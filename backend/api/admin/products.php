<?php
// backend/api/admin/products.php

declare(strict_types=1);

header('Content-Type: application/json');

require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../admin_guard.php';

// Ensure current user is admin
$adminUser = require_admin();

/** @var PDO $pdo */
global $pdo;

// --- Pagination ---
$page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
if ($page < 1) {
    $page = 1;
}

$limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 20;
if ($limit < 1) {
    $limit = 20;
}
if ($limit > 100) {
    $limit = 100;
}
$offset = ($page - 1) * $limit;

// --- Filters ---
$whereParts = [];
$params = [];

// Search across name, brand, category
$qRaw = $_GET['q'] ?? '';
$q = trim((string) $qRaw);
if ($q !== '') {
    $whereParts[] = '(name LIKE :q OR brand LIKE :q OR category LIKE :q)';
    $params[':q'] = '%' . $q . '%';
}

// Filter by exact ID
if (isset($_GET['id']) && $_GET['id'] !== '') {
    $idFilter = (int) $_GET['id'];
    if ($idFilter > 0) {
        $whereParts[] = 'id = :id';
        $params[':id'] = $idFilter;
    }
}

// Filter by category
if (isset($_GET['category']) && $_GET['category'] !== '') {
    $category = trim((string) $_GET['category']);
    if ($category !== '') {
        $whereParts[] = 'category = :category';
        $params[':category'] = $category;
    }
}

// Filter by brand
if (isset($_GET['brand']) && $_GET['brand'] !== '') {
    $brand = trim((string) $_GET['brand']);
    if ($brand !== '') {
        $whereParts[] = 'brand = :brand';
        $params[':brand'] = $brand;
    }
}

// Filter by price range
if (isset($_GET['min_price']) && $_GET['min_price'] !== '') {
    $minPrice = (float) $_GET['min_price'];
    $whereParts[] = 'price >= :min_price';
    $params[':min_price'] = $minPrice;
}

if (isset($_GET['max_price']) && $_GET['max_price'] !== '') {
    $maxPrice = (float) $_GET['max_price'];
    $whereParts[] = 'price <= :max_price';
    $params[':max_price'] = $maxPrice;
}

$whereSql = '';
if (!empty($whereParts)) {
    $whereSql = 'WHERE ' . implode(' AND ', $whereParts);
}

// --- Sorting ---
$sort = $_GET['sort'] ?? 'newest';
$orderBy = 'created_at DESC'; // default

switch ($sort) {
    case 'price_asc':
        $orderBy = 'price ASC';
        break;
    case 'price_desc':
        $orderBy = 'price DESC';
        break;
    case 'name_asc':
        $orderBy = 'name ASC';
        break;
    case 'name_desc':
        $orderBy = 'name DESC';
        break;
    case 'newest':
    default:
        $orderBy = 'created_at DESC';
        break;
}

// --- Count total matching products ---
$countSql = "SELECT COUNT(*) AS cnt FROM products $whereSql";
$countStmt = $pdo->prepare($countSql);

foreach ($params as $key => $value) {
    // prices are floats, others strings/ints, but PDO::PARAM_STR works fine here
    $countStmt->bindValue($key, $value);
}

$countStmt->execute();
$total = (int) $countStmt->fetchColumn();

// --- Fetch page of products ---
$dataSql = "
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
    $whereSql
    ORDER BY $orderBy
    LIMIT :limit OFFSET :offset
";

$dataStmt = $pdo->prepare($dataSql);

foreach ($params as $key => $value) {
    $dataStmt->bindValue($key, $value);
}

$dataStmt->bindValue(':limit', $limit, PDO::PARAM_INT);
$dataStmt->bindValue(':offset', $offset, PDO::PARAM_INT);

$dataStmt->execute();
$products = $dataStmt->fetchAll(PDO::FETCH_ASSOC);

$totalPages = $total > 0 ? (int) ceil($total / $limit) : 1;

echo json_encode([
    'status'      => 'ok',
    'page'        => $page,
    'per_page'    => $limit,
    'total'       => $total,
    'total_pages' => $totalPages,
    'data'        => $products,
]);

