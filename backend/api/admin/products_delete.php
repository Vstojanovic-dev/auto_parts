<?php declare(strict_types=1);
// backend/api/admin/products_delete.php

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

// Load product to confirm it exists
$checkStmt = $pdo->prepare('SELECT id, name, brand, category, price, stock FROM products WHERE id = ? LIMIT 1');
$checkStmt->execute([$id]);
$product = $checkStmt->fetch(PDO::FETCH_ASSOC);

if (!$product) {
    http_response_code(404);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Product not found',
    ]);
    exit;
}

// Try to delete (may fail if there are foreign key constraints)
try {
    $deleteStmt = $pdo->prepare('DELETE FROM products WHERE id = ?');
    $deleteStmt->execute([$id]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Failed to delete product',
    ]);
    exit;
}

echo json_encode([
    'status' => 'ok',
    'data'   => [
        'id'       => $product['id'],
        'name'     => $product['name'],
        'brand'    => $product['brand'],
        'category' => $product['category'],
        'price'    => $product['price'],
        'stock'    => $product['stock'],
        'deleted'  => true,
    ],
]);

