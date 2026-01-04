<?php declare(strict_types=1);
// backend/api/admin/products.php

header('Content-Type: application/json');

require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../admin_guard.php';

/** @var PDO $pdo */
global $pdo;


$adminUser = require_admin();

// --- Read and normalize query params ---

$pageRaw  = $_GET['page']  ?? '1';
$limitRaw = $_GET['limit'] ?? '20';

$page  = (int) $pageRaw;
$limit = (int) $limitRaw;

if ($page < 1) {
    $page = 1;
}
if ($limit < 1) {
    $limit = 20;
}

$offset = ($page - 1) * $limit;

// Filters
$qRaw        = $_GET['q']        ?? '';
$categoryRaw = $_GET['category'] ?? '';
$brandRaw    = $_GET['brand']    ?? '';
$idRaw       = $_GET['id']       ?? '';
$minPriceRaw = $_GET['min_price'] ?? '';
$maxPriceRaw = $_GET['max_price'] ?? '';

$q         = trim((string) $qRaw);
$category  = trim((string) $categoryRaw);
$brand     = trim((string) $brandRaw);
$idFilter  = $idRaw !== '' ? (int) $idRaw : null;
$minPrice  = $minPriceRaw !== '' ? (float) $minPriceRaw : null;
$maxPrice  = $maxPriceRaw !== '' ? (float) $maxPriceRaw : null;

$sort = $_GET['sort'] ?? 'newest';

// --- Build WHERE and bind params ---

$whereParts = [];
$params     = [];

// Search across name, brand, category
// Search across name, brand, category
if ($q !== '') {
    $whereParts[]          = '(name LIKE :q_name OR brand LIKE :q_brand OR category LIKE :q_category)';
    $like                  = '%' . $q . '%';
    $params[':q_name']     = $like;
    $params[':q_brand']    = $like;
    $params[':q_category'] = $like;
}


// Filter by exact ID
if ($idFilter !== null && $idFilter > 0) {
    $whereParts[]      = 'id = :id';
    $params[':id']     = $idFilter;
}

// Filter by category
if ($category !== '') {
    $whereParts[]          = 'category = :category';
    $params[':category']   = $category;
}

// Filter by brand
if ($brand !== '') {
    $whereParts[]       = 'brand = :brand';
    $params[':brand']   = $brand;
}

// Price range
if ($minPrice !== null) {
    $whereParts[]          = 'price >= :min_price';
    $params[':min_price']  = $minPrice;
}

if ($maxPrice !== null) {
    $whereParts[]          = 'price <= :max_price';
    $params[':max_price']  = $maxPrice;
}

$whereSql = '';
if (!empty($whereParts)) {
    $whereSql = 'WHERE ' . implode(' AND ', $whereParts);
}

// --- Sorting ---

switch ($sort) {
    case 'price_asc':
        $orderBy = 'ORDER BY price ASC';
        break;
    case 'price_desc':
        $orderBy = 'ORDER BY price DESC';
        break;
    case 'name_asc':
        $orderBy = 'ORDER BY name ASC';
        break;
    case 'name_desc':
        $orderBy = 'ORDER BY name DESC';
        break;
    case 'newest':
    default:
        $orderBy = 'ORDER BY created_at DESC';
        break;
}

// --- Query DB ---

try {
    // Count
    $countSql = "SELECT COUNT(*) AS cnt FROM products $whereSql";
    $countStmt = $pdo->prepare($countSql);

    foreach ($params as $key => $value) {
        $pdoType = is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR;
        $countStmt->bindValue($key, $value, $pdoType);
    }

    $countStmt->execute();
    $total = (int) $countStmt->fetchColumn();

    // Data
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
        $orderBy
        LIMIT :limit OFFSET :offset
    ";

    $dataStmt = $pdo->prepare($dataSql);

    foreach ($params as $key => $value) {
        $pdoType = is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR;
        $dataStmt->bindValue($key, $value, $pdoType);
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
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Failed to load products',
    ]);
}
