<?php declare(strict_types=1);

header('Content-Type: application/json');

require_once __DIR__ . '/../../../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

$endpointSecret = getenv('STRIPE_WEBHOOK_SECRET') ?: '';
if ($endpointSecret === '') {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Missing STRIPE_WEBHOOK_SECRET']);
    exit;
}

$payload = (string) file_get_contents('php://input');
$sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

if ($sigHeader === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing Stripe-Signature header']);
    exit;
}

/**
 * Manual verification (no stripe-php needed):
 * - Stripe signs: "{timestamp}.{rawBody}"
 * - Compare to v1 signature(s) in Stripe-Signature header
 * Stripe docs describe verifying using Stripe-Signature and raw body. :contentReference[oaicite:2]{index=2}
 */
function parseStripeSig(string $header): array {
    $parts = explode(',', $header);
    $out = ['t' => null, 'v1' => []];
    foreach ($parts as $p) {
        $kv = explode('=', trim($p), 2);
        if (count($kv) !== 2) continue;
        if ($kv[0] === 't') $out['t'] = $kv[1];
        if ($kv[0] === 'v1') $out['v1'][] = $kv[1];
    }
    return $out;
}

function secureEquals(string $a, string $b): bool {
    if (function_exists('hash_equals')) return hash_equals($a, $b);
    if (strlen($a) !== strlen($b)) return false;
    $res = 0;
    for ($i = 0; $i < strlen($a); $i++) $res |= ord($a[$i]) ^ ord($b[$i]);
    return $res === 0;
}

$sig = parseStripeSig($sigHeader);
$timestamp = $sig['t'];
$v1s = $sig['v1'];

if ($timestamp === null || empty($v1s)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid Stripe-Signature header']);
    exit;
}

// Optional: timestamp tolerance (5 minutes)
$tolerance = 300;
if (abs(time() - (int)$timestamp) > $tolerance) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Webhook timestamp outside tolerance']);
    exit;
}

$signedPayload = $timestamp . '.' . $payload;
$computed = hash_hmac('sha256', $signedPayload, $endpointSecret);

$ok = false;
foreach ($v1s as $v1) {
    if (secureEquals($computed, $v1)) { $ok = true; break; }
}

if (!$ok) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Signature verification failed']);
    exit;
}

$event = json_decode($payload, true);
if (!is_array($event) || empty($event['type'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid event payload']);
    exit;
}

/** @var PDO $pdo */
global $pdo;

try {
    $type = (string)$event['type'];

    if ($type === 'checkout.session.completed' || $type === 'checkout.session.expired') {
        $session = $event['data']['object'] ?? null;
        if (!is_array($session)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Missing session object']);
            exit;
        }

        $stripeSessionId = (string)($session['id'] ?? '');
        $amountTotal = isset($session['amount_total']) ? (int)$session['amount_total'] : null;
        $currency = isset($session['currency']) ? (string)$session['currency'] : null;

        if ($stripeSessionId === '') {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Missing session id']);
            exit;
        }

        $newStatus = ($type === 'checkout.session.completed') ? 'paid' : 'expired';

        // Update local tracking table if it exists (safe)
        try {
            $stmt = $pdo->prepare("
                UPDATE stripe_checkout_sessions
                SET status = ?, amount_total = COALESCE(amount_total, ?), currency = COALESCE(currency, ?)
                WHERE stripe_session_id = ?
            ");
            $stmt->execute([$newStatus, $amountTotal, $currency, $stripeSessionId]);
        } catch (Throwable $ignored) {
            // If table doesn’t exist, we still return 200 to Stripe
        }
    }

    // Always 200 so Stripe stops retrying
    echo json_encode(['status' => 'ok']);
} catch (Throwable $e) {
    // Still return 200 to avoid Stripe retry storms in dev
    echo json_encode(['status' => 'ok']);
}

