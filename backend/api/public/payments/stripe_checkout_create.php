<?php declare(strict_types=1);

header('Content-Type: application/json');

require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../config.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode([
        'status' => 'error',
        'message' => 'Authentication required',
    ]);
    exit;
}

$stripeSecret = getenv('STRIPE_SECRET_KEY') ?: '';
$currency = strtolower(getenv('STRIPE_CURRENCY') ?: 'eur');

if ($stripeSecret === '') {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Stripe is not configured (missing STRIPE_SECRET_KEY)',
    ]);
    exit;
}

$input = json_decode((string) file_get_contents('php://input'), true);
$items = $input['items'] ?? null;

$successUrl = (string) ($input['success_url'] ?? 'http://localhost:5173/checkout/success?session_id={CHECKOUT_SESSION_ID}');
$cancelUrl  = (string) ($input['cancel_url']  ?? 'http://localhost:5173/cart');

if (!is_array($items) || count($items) < 1) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Body must include items: [{product_id, quantity}]',
    ]);
    exit;
}

/** @var PDO $pdo */
global $pdo;

try {
    // Normalize + validate quantities
    $normalized = [];
    foreach ($items as $it) {
        $pid = (int) ($it['product_id'] ?? 0);
        $qty = (int) ($it['quantity'] ?? 0);
        if ($pid <= 0 || $qty <= 0) continue;

        // merge duplicates
        if (!isset($normalized[$pid])) $normalized[$pid] = 0;
        $normalized[$pid] += $qty;
    }

    if (count($normalized) < 1) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'No valid items found',
        ]);
        exit;
    }

    // Load product data from DB (never trust prices from frontend)
    $productIds = array_keys($normalized);
    $placeholders = implode(',', array_fill(0, count($productIds), '?'));

    $stmt = $pdo->prepare("
        SELECT id, name, price
        FROM products
        WHERE id IN ($placeholders)
    ");
    $stmt->execute($productIds);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $byId = [];
    foreach ($rows as $r) {
        $byId[(int)$r['id']] = $r;
    }

    // Build Stripe line_items
    $lineItems = [];
    $amountTotal = 0;

    foreach ($normalized as $pid => $qty) {
        if (!isset($byId[$pid])) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => "Product not found: id=$pid",
            ]);
            exit;
        }

        $name = (string) $byId[$pid]['name'];
        $priceFloat = (float) $byId[$pid]['price'];     // e.g. 49.99
        $unitAmount = (int) round($priceFloat * 100);   // cents

        $amountTotal += $unitAmount * $qty;

        // Stripe expects nested form fields: line_items[0][price_data]...
        $lineItems[] = [
            'price_data' => [
                'currency' => $currency,
                'product_data' => ['name' => $name],
                'unit_amount' => $unitAmount,
            ],
            'quantity' => $qty,
        ];
    }

    // Create a local record (optional, but helpful)
    $localCheckoutId = null;
    try {
        $pdo->prepare("
            INSERT INTO stripe_checkout_sessions (user_id, stripe_session_id, status, amount_total, currency)
            VALUES (?, '', 'created', ?, ?)
        ")->execute([(int)$_SESSION['user_id'], $amountTotal, $currency]);

        $localCheckoutId = (int) $pdo->lastInsertId();
    } catch (Throwable $ignored) {
        // If tables don't exist yet, we still proceed with Stripe Checkout.
        $localCheckoutId = null;
    }

    // Stripe Checkout Sessions API (server-side)
    // Docs: create session and use checkout.session.completed webhook for fulfillment. :contentReference[oaicite:1]{index=1}
    $payload = [
        'mode' => 'payment',
        'success_url' => $successUrl,
        'cancel_url' => $cancelUrl,
        'client_reference_id' => 'user_' . (int)$_SESSION['user_id'],
        'metadata[user_id]' => (string) (int)$_SESSION['user_id'],
    ];

    if ($localCheckoutId !== null) {
        $payload['metadata[local_checkout_id]'] = (string) $localCheckoutId;
    }

    // Add line items as form fields
    foreach ($lineItems as $i => $li) {
        $payload["line_items[$i][price_data][currency]"] = $li['price_data']['currency'];
        $payload["line_items[$i][price_data][product_data][name]"] = $li['price_data']['product_data']['name'];
        $payload["line_items[$i][price_data][unit_amount]"] = (string) $li['price_data']['unit_amount'];
        $payload["line_items[$i][quantity]"] = (string) $li['quantity'];
    }

    $ch = curl_init('https://api.stripe.com/v1/checkout/sessions');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query($payload),
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $stripeSecret,
            'Content-Type: application/x-www-form-urlencoded',
        ],
    ]);

    $resp = curl_exec($ch);
    $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);

    if ($resp === false) {
        $err = curl_error($ch);
        curl_close($ch);
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Stripe request failed: ' . $err]);
        exit;
    }
    curl_close($ch);

    $json = json_decode($resp, true);

    if ($httpCode < 200 || $httpCode >= 300 || !is_array($json) || empty($json['id']) || empty($json['url'])) {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Stripe returned an error',
            'stripe_http' => $httpCode,
            'stripe_response' => $json,
        ]);
        exit;
    }

    // Update local record + store items (optional)
    if ($localCheckoutId !== null) {
        try {
            $pdo->prepare("UPDATE stripe_checkout_sessions SET stripe_session_id = ? WHERE id = ?")
                ->execute([(string)$json['id'], $localCheckoutId]);

            $insItem = $pdo->prepare("
                INSERT INTO stripe_checkout_session_items
                  (checkout_session_id, product_id, name_snapshot, unit_amount, quantity)
                VALUES (?, ?, ?, ?, ?)
            ");

            foreach ($normalized as $pid => $qty) {
                $name = (string) $byId[$pid]['name'];
                $unitAmount = (int) round(((float)$byId[$pid]['price']) * 100);
                $insItem->execute([$localCheckoutId, (int)$pid, $name, $unitAmount, (int)$qty]);
            }
        } catch (Throwable $ignored) {}
    }

    echo json_encode([
        'status' => 'ok',
        'checkout_url' => (string) $json['url'],
        'stripe_session_id' => (string) $json['id'],
        'amount_total' => $amountTotal,
        'currency' => $currency,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to create checkout session',
    ]);
}
