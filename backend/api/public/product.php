<?php
// backend/api/public/product.php

header('Content-Type: application/json');

require_once __DIR__ . '/../../config.php';

// 1. Read and validate product id
$id = isset($_GET['id']) ? (int) $_GET['id'] : 0;

if ($id <= 0) {
    http_response_code(400);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Invalid product id'
    ]);
    exit;
}

try {
    // 2. Fetch single product
    $sql = "SELECT id, name, brand, category, description, price, stock, image_url, created_at
            FROM products
            WHERE id = :id
            LIMIT 1";
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':id', $id, PDO::PARAM_INT);
    $stmt->execute();

    $product = $stmt->fetch();

    if (!$product) {
        http_response_code(404);
        echo json_encode([
            'status'  => 'error',
            'message' => 'Product not found'
        ]);
        exit;
    }

    // 3. Return product as JSON
    echo json_encode([
        'status'  => 'ok',
        'product' => $product
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Failed to fetch product'
    ]);
}

