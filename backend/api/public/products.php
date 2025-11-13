<?php
// backend/api/products.php

header('Content-Type: application/json');

require_once __DIR__ . '/../../config.php';

// 1. Read query params
$q        = isset($_GET['q']) ? trim($_GET['q']) : '';
$category = isset($_GET['category']) ? trim($_GET['category']) : '';
$brand    = isset($_GET['brand']) ? trim($_GET['brand']) : '';
$sort     = isset($_GET['sort']) ? trim($_GET['sort']) : 'newest';
$page     = isset($_GET['page']) ? (int) $_GET['page'] : 1;
$limit    = isset($_GET['limit']) ? (int) $_GET['limit'] : 10;


if ($page < 1) {
    $page = 1;
}
if ($limit < 1 || $limit > 50) {
    $limit = 10; // default
}

$offset = ($page - 1) * $limit;

// 3. Build WHERE conditions
$where = "WHERE 1";
$params = [];

if ($q !== '') {
    $where .= " AND (name LIKE :q_name OR brand LIKE :q_brand OR category LIKE :q_category)";
    $params[':q_name']     = '%' . $q . '%';
    $params[':q_brand']    = '%' . $q . '%';
    $params[':q_category'] = '%' . $q . '%';
}


if ($category !== '') {
    $where .= " AND category = :category";
    $params[':category'] = $category;
}

if ($brand !== '') {
    $where .= " AND brand = :brand";
    $params[':brand'] = $brand;
}

// 4. Determine ORDER BY
switch ($sort) {
    case 'price_asc':
        $orderBy = "ORDER BY price ASC";
        break;
    case 'price_desc':
        $orderBy = "ORDER BY price DESC";
        break;
    case 'name_asc':
        $orderBy = "ORDER BY name ASC";
        break;
    case 'name_desc':
        $orderBy = "ORDER BY name DESC";
        break;
    case 'newest':
    default:
        $orderBy = "ORDER BY created_at DESC";
        break;
}

// 5. Count total products (for pagination)
try {
    $countSql = "SELECT COUNT(*) AS total FROM products $where";
    $countStmt = $pdo->prepare($countSql);
    foreach ($params as $key => $value) {
        $countStmt->bindValue($key, $value);
    }
    $countStmt->execute();
    $total = (int) $countStmt->fetchColumn();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to count products'
    ]);
    exit;
}

// 6. Fetch products with pagination
try {
    // NOTE: we inject LIMIT/OFFSET as integers directly (already validated)
    $sql = "SELECT id, name, brand, category, description, price, stock, image_url, created_at
            FROM products
            $where
            $orderBy
            LIMIT $limit OFFSET $offset";

    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->execute();
    $products = $stmt->fetchAll();

    $response = [
        'status'       => 'ok',
        'page'         => $page,
        'per_page'     => $limit,
        'total'        => $total,
        'total_pages'  => $total > 0 ? ceil($total / $limit) : 1,
        'data'         => $products
    ];

    echo json_encode($response);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to fetch products'
    ]);
}

