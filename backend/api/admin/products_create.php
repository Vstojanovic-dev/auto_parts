<?php declare(strict_types=1);
// backend/api/admin/products_create.php

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

// Extract & sanitize input
$name        = isset($data['name']) ? trim((string) $data['name']) : '';
$brand       = isset($data['brand']) ? trim((string) $data['brand']) : '';
$category    = isset($data['category']) ? trim((string) $data['category']) : '';
$description = isset($data['description']) ? trim((string) $data['description']) : '';

$price = null;
if (array_key_exists('price', $data)) {
    $price = (float) $data['price'];
}

$stock = 0;
if (array_key_exists('stock', $data)) {
    $stock = (int) $data['stock'];
}

$imageUrl = null;
if (array_key_exists('image_url', $data) && $data['image_url'] !== null && $data['image_url'] !== '') {
    $imageUrl = (string) $data['image_url'];
}

// Validation
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

if ($price === null || $price <= 0) {
    $errors[] = 'price must be a positive number';
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

// Insert into products table
try {
    $sql = "
        INSERT INTO products
            (name, brand, category, description, price, stock, image_url)
        VALUES
            (:name, :brand, :category, :description, :price, :stock, :image_url)
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':name', $name, PDO::PARAM_STR);
    $stmt->bindValue(':brand', $brand, PDO::PARAM_STR);
    $stmt->bindValue(':category', $category, PDO::PARAM_STR);
    $stmt->bindValue(':description', $description, PDO::PARAM_STR);
    $stmt->bindValue(':price', $price);
    $stmt->bindValue(':stock', $stock, PDO::PARAM_INT);

    if ($imageUrl !== null) {
        $stmt->bindValue(':image_url', $imageUrl, PDO::PARAM_STR);
    } else {
        $stmt->bindValue(':image_url', null, PDO::PARAM_NULL);
    }

    $stmt->execute();

    $newId = (int) $pdo->lastInsertId();

    // Fetch the created product so frontend gets full row
    $fetchSql = "
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
    ";

    $fetchStmt = $pdo->prepare($fetchSql);
    $fetchStmt->execute([$newId]);
    $product = $fetchStmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'ok',
        'data'   => $product,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Failed to create product',
    ]);
}
