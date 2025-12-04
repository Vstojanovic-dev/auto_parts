<?php declare(strict_types=1);
// backend/api/admin/order_detail.php

header('Content-Type: application/json');

require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../admin_guard.php';

// Ensure current user is admin
$adminUser = require_admin();

/** @var PDO $pdo */
global $pdo;

// --- Input validation ---
$id = isset($_GET['id']) ? (int) $_GET['id'] : 0;

if ($id <= 0) {
    http_response_code(400);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Valid id parameter is required',
    ]);
    exit;
}

// --- Fetch order with user info ---
try {
    $orderSql = "
        SELECT
            o.id,
            o.user_id,
            u.name   AS user_name,
            u.email  AS user_email,
            o.status,
            o.total_amount,
            o.created_at
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        WHERE o.id = ?
        LIMIT 1
    ";

    $orderStmt = $pdo->prepare($orderSql);
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
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Failed to load order',
    ]);
    exit;
}

// --- Fetch order items (best effort) ---
$items = [];
$itemsError = null;

try {
    // Assumes order_items table with at least:
    // id, order_id, product_id, quantity, unit_price
    // and products table with id, name
    $itemsSql = "
        SELECT
            oi.id,
            oi.product_id,
            p.name      AS product_name,
            oi.quantity,
            oi.unit_price
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
        ORDER BY oi.id ASC
    ";

    $itemsStmt = $pdo->prepare($itemsSql);
    $itemsStmt->execute([$id]);
    $items = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);
} catch (Throwable $e) {
    // Do not break order detail if items table/schema is not ready
    $items = [];
    $itemsError = 'Failed to load order items (check order_items table/schema)';
}

$response = [
    'status' => 'ok',
    'data'   => [
        'order' => $order,
        'items' => $items,
    ],
];

if ($itemsError !== null) {
    $response['items_error'] = $itemsError;
}

echo json_encode($response);

