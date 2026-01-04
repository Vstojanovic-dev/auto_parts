<?php declare(strict_types=1);

header('Content-Type: application/json');

require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../config.php';

$stripeSecret = getenv('STRIPE_SECRET_KEY') ?: '';
if ($stripeSecret === '') {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Missing STRIPE_SECRET_KEY']);
    exit;
}

$sessionId = trim((string)($_GET['session_id'] ?? ''));
if ($sessionId === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing session_id']);
    exit;
}

// Fetch session from Stripe API
$ch = curl_init('https://api.stripe.com/v1/checkout/sessions/' . urlencode($sessionId));
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $stripeSecret,
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
if ($httpCode < 200 || $httpCode >= 300 || !is_array($json)) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Stripe returned an error', 'stripe_http' => $httpCode, 'stripe_response' => $json]);
    exit;
}

echo json_encode([
    'status' => 'ok',
    'id' => $json['id'] ?? null,
    'payment_status' => $json['payment_status'] ?? null,
    'amount_total' => $json['amount_total'] ?? null,
    'currency' => $json['currency'] ?? null,
]);
