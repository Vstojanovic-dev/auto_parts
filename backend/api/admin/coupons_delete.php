<?php declare(strict_types=1);
// backend/api/admin/coupons_delete.php

header('Content-Type: application/json');

require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../admin_guard.php';

// Ensure current user is admin
$adminUser = require_admin();

/** @var PDO $pdo */
global $pdo;

// Read JSON body
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Invalid JSON body',
    ]);
    exit;
}

$id = isset($data['id']) ? (int) $data['id'] : 0;

if ($id <= 0) {
    http_response_code(400);
    echo json_encode([
        'status'  => 'error',
        'message' => 'id is required and must be a positive integer',
    ]);
    exit;
}

// Load coupon
$checkStmt = $pdo->prepare('SELECT id, code, discount_type, discount_value, is_active, usage_limit, used_count FROM coupons WHERE id = ? LIMIT 1');
$checkStmt->execute([$id]);
$coupon = $checkStmt->fetch(PDO::FETCH_ASSOC);

if (!$coupon) {
    http_response_code(404);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Coupon not found',
    ]);
    exit;
}

// Deactivate coupon (soft delete)
try {
    $updateStmt = $pdo->prepare('UPDATE coupons SET is_active = 0 WHERE id = ?');
    $updateStmt->execute([$id]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Failed to deactivate coupon',
    ]);
    exit;
}

echo json_encode([
    'status' => 'ok',
    'data'   => [
        'id'             => $coupon['id'],
        'code'           => $coupon['code'],
        'discount_type'  => $coupon['discount_type'],
        'discount_value' => $coupon['discount_value'],
        'usage_limit'    => $coupon['usage_limit'],
        'used_count'     => $coupon['used_count'],
        'is_active'      => 0,
        'deleted'        => true
    ],
]);

