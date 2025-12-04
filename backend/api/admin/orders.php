<?php declare(strict_types=1);
// backend/api/admin/orders.php

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

// Filter by status (e.g. pending, paid, shipped, cancelled)
if (isset($_GET['status']) && $_GET['status'] !== '') {
    $status = trim((string) $_GET['status']);
    if ($status !== '') {
        $whereParts[] = 'o.status = :status';
        $params[':status'] = $status;
    }
}

// Filter by user_id
if (isset($_GET['user_id']) && $_GET['user_id'] !== '') {
    $userId = (int) $_GET['user_id'];
    if ($userId > 0) {
        $whereParts[] = 'o.user_id = :user_id';
        $params[':user_id'] = $userId;
    }
}

// Filter by created_at date range
// Expecting ISO-ish "YYYY-MM-DD" strings
if (isset($_GET['date_from']) && $_GET['date_from'] !== '') {
    $dateFrom = trim((string) $_GET['date_from']);
    // We just trust the format; DB will interpret it
    $whereParts[] = 'o.created_at >= :date_from';
    $params[':date_from'] = $dateFrom . ' 00:00:00';
}

if (isset($_GET['date_to']) && $_GET['date_to'] !== '') {
    $dateTo = trim((string) $_GET['date_to']);
    $whereParts[] = 'o.created_at <= :date_to';
    $params[':date_to'] = $dateTo . ' 23:59:59';
}

$whereSql = '';
if (!empty($whereParts)) {
    $whereSql = 'WHERE ' . implode(' AND ', $whereParts);
}

// --- Sorting (newest first) ---
$orderBy = 'o.created_at DESC';

// --- Count total orders ---
try {
    $countSql = "
        SELECT COUNT(*) AS cnt
        FROM orders o
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
        'message' => 'Failed to count orders',
    ]);
    exit;
}

// --- Fetch page of orders ---
try {
    $dataSql = "
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
    $orders = $dataStmt->fetchAll(PDO::FETCH_ASSOC);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Failed to load orders',
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
    'data'        => $orders,
]);

