<?php declare(strict_types=1);

header('Content-Type: application/json');

require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../config.php';

$token = trim((string)($_GET['token'] ?? ''));

if ($token === '' || strlen($token) < 20) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing or invalid token']);
    exit;
}

$tokenHash = hash('sha256', $token);

try {
    // Find token row (must exist, not used, not expired)
    $stmt = $pdo->prepare("
        SELECT id, user_id, expires_at, used_at
        FROM email_verifications
        WHERE token_hash = :h
        LIMIT 1
    ");
    $stmt->execute([':h' => $tokenHash]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid token']);
        exit;
    }

    if (!empty($row['used_at'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Token already used']);
        exit;
    }

    if (strtotime((string)$row['expires_at']) < time()) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Token expired']);
        exit;
    }

    $pdo->beginTransaction();

    $u = $pdo->prepare("UPDATE users SET is_verified = 1 WHERE id = :uid");
    $u->execute([':uid' => (int)$row['user_id']]);

    $t = $pdo->prepare("UPDATE email_verifications SET used_at = NOW() WHERE id = :id");
    $t->execute([':id' => (int)$row['id']]);

    $pdo->commit();

    echo json_encode(['status' => 'ok', 'message' => 'Email verified']);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Verification failed']);
}
