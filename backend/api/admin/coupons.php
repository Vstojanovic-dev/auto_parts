<?php declare(strict_types=1);
// backend/api/admin/coupons.php

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

// q: search in code
$qRaw = $_GET['q'] ?? '';
$q = trim((string) $qRaw);
if ($q !== '') {
    $whereParts[] = 'code LIKE :q';
    $params[':q'] = '%' . $q . '%';
}

// Filter by discount_type
if (isset($_GET['discount_type']) && $_GET['discount_type'] !== '') {
    $discountType = trim((string) $_GET['discount_type']);
    $whereParts[] = 'discount_type = :discount_type';
    $params[':discount_type'] = $discountType;
}

// Filter by is_active (0 or 1)
if (isset($_GET['is_active']) && $_GET['is_active'] !== '') {
    $isActive = (int) $_GET['is_active'];
    if ($isActive === 0 || $isActive === 1) {
        $whereParts[] = 'is_active = :is_active';
        $params[':is_active'] = $isActive;
    }
}

// Filter by validity dates (optional)
if (isset($_GET['valid_on']) && $_GET['valid_on'] !== '') {
    // Coupons that are valid on a given date: valid_from <= date <= valid_to
    $validOn = trim((string) $_GET['valid_on']);
    $whereParts[] = '( (valid_from IS NULL OR valid_from <= :valid_on) AND (valid_to IS NULL OR valid_to >= :valid_on) )';
    $params[':valid_on'] = $validOn;
}

$whereSql = '';
if (!empty($whereParts)) {
    $whereSql = 'WHERE ' . implode(' AND ', $whereParts);
}

// --- Sorting (newest coupons first) ---
$orderBy = 'created_at DESC';

// --- Count total ---
try {
    $countSql = "
        SELECT COUNT(*) AS cnt
        FROM coupons
        $whereSql
    ";

    $countStmt = $pdo->prepare($countSql);
    foreach ($params as $key => $value) {
        $countStmt->bindValue($key, $value);
    }
    $countStmt->execute();
    $total = (int) $countStmt->fetchColumn();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Failed to count coupons',
    ]);
    exit;
}

// --- Fetch page of coupons ---
try {
    $dataSql = "
        SELECT
            id,
            code,
            discount_type,
            discount_value,
            valid_from,
            valid_to,
            is_active,
            usage_limit,
            used_count,
            created_at
        FROM coupons
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
    $coupons = $dataStmt->fetchAll(PDO::FETCH_ASSOC);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Failed to load coupons',
    ]);
    exit;
}

$totalPages = $total > 0 ? (int) ceil($total / $limit) : 1;

echo json_encode([
    'status'      => 'ok',
    'page'        => $page,
    'per_page'    => $limit,
    'total'       => $total,
    'total_pages' => $totalPages,
    'data'        => $coupons,
]);

