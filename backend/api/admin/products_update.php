<?php
// backend/api/admin/products_update.php

declare(strict_types=1);

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

// Extract id
$id = isset($data['id']) ? (int) $data['id'] : 0;
if ($id <= 0) {
    http_response_code(400);
    echo json_encode([
        'status'  => 'error',
        'message' => 'id is required and must be a positive integer',
    ]);
    exit;
}

// First, ensure product exists
$checkStmt = $pdo->prepare('SELECT id FROM products WHERE id = ? LIMIT 1');
$checkStmt->execute([$id]);
$exists = $checkStmt->fetchColumn();

if (!$exists) {
    http_response_code(404);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Product not found',
    ]);
    exit;
}

// Extract updatable fields (same as create)
$name = isset($data['name']) ? trim((string) $data['name']) : '';
$brand = isset($data['brand']) ? trim((string) $data['brand']) : '';
$category = isset($data['category']) ? trim((string) $data['category']) : '';
$description = isset($data['description']) ? trim((string) $data['description']) : '';
$price = isset($data['price']) ? (float) $data['price'] : 0.0;
$stock = isset($data['stock']) ? (int) $data['stock'] : 0;
$imageUrl = array_key_exists('image_url', $data) ? trim((string) $data['image_url']) : null;

$errors = [];

if ($name === '') {
    $errors[] = 'name is required';
}
if ($brand === '') {
    $errors[] = 'brand is required';
}
if ($category === '') {
    $errors[] = 'category is required';
}
if ($price <= 0) {
    $errors[] = 'price must be greater than 0';
}
if ($stock < 0) {
    $errors[] = 'stock cannot be negative';
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Validation failed',
        'errors'  => $errors,
    ]);
    exit;
}

// Build update query
try {
    $sql = "
        UPDATE products
        SET
            name = :name,
            brand = :brand,
            category = :category,
            description = :description,
            price = :price,
            stock = :stock,
            image_url = :image_url
        WHERE id = :id
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':name', $name, PDO::PARAM_STR);
    $stmt->bindValue(':brand', $brand, PDO::PARAM_STR);
    $stmt->bindValue(':category', $category, PDO::PARAM_STR);
    $stmt->bindValue(':description', $description, PDO::PARAM_STR);
    $stmt->bindValue(':price', $price);
    $stmt->bindValue(':stock', $stock, PDO::PARAM_INT);

    if ($imageUrl !== null && $imageUrl !== '') {
        $stmt->bindValue(':image_url', $imageUrl, PDO::PARAM_STR);
    } else {
        $stmt->bindValue(':image_url', null, PDO::PARAM_NULL);
    }

    $stmt->bindValue(':id', $id, PDO::PARAM_INT);

    $stmt->execute();

    // Fetch updated product
    $fetchStmt = $pdo->prepare("
        SELECT
            id,
            name,
            brand,
            category,
            description,
            price,
            stock,
            image_url,
            created_at
        FROM products
        WHERE id = ?
        LIMIT 1
    ");
    $fetchStmt->execute([$id]);
    $product = $fetchStmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'ok',
        'data'   => $product,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Failed to update product',
    ]);
}

