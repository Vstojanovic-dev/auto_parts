<?php declare(strict_types=1);
// backend/api/admin/orders_update_status.php

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
$status = isset($data['status']) ? trim((string) $data['status']) : '';

if ($id <= 0 || $status === '') {
    http_response_code(400);
    echo json_encode([
        'status'  => 'error',
        'message' => 'id and status are required',
    ]);
    exit;
}

// Allowed statuses (adjust to match your DB / business rules)
$allowedStatuses = ['pending', 'paid', 'shipped', 'cancelled', 'refunded'];

if (!in_array($status, $allowedStatuses, true)) {
    http_response_code(400);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Invalid status value',
        'allowed' => $allowedStatuses,
    ]);
    exit;
}

// Ensure the order exists
$orderStmt = $pdo->prepare('SELECT id, status FROM orders WHERE id = ? LIMIT 1');
$orderStmt->execute([$id]);
$order = $orderStmt->fetch(PDO::FETCH_ASSOC);

if (!$order) {
    http_response_code(404);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Order not found',
    ]);
    exit;
}

// Update status
try {
    $updateStmt = $pdo->prepare('UPDATE orders SET status = :status WHERE id = :id');
    $updateStmt->bindValue(':status', $status, PDO::PARAM_STR);
    $updateStmt->bindValue(':id', $id, PDO::PARAM_INT);
    $updateStmt->execute();

    // Fetch updated order summary
    $fetchStmt = $pdo->prepare('SELECT id, user_id, status, total_amount, created_at FROM orders WHERE id = ? LIMIT 1');
    $fetchStmt->execute([$id]);
    $updated = $fetchStmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'ok',
        'data'   => $updated,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Failed to update order status',
    ]);
}

