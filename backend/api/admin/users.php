<?php
// backend/api/admin/users.php

declare(strict_types=1);

header('Content-Type: application/json');

require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../admin_guard.php';

// Ensures we have a logged-in admin and gives us their row.
$adminUser = require_admin();

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

// --- Search + role filter ---
$qRaw = $_GET['q'] ?? '';
$q = trim((string) $qRaw);

$roleRaw = $_GET['role'] ?? '';
$role = trim((string) $roleRaw);

$whereParts = [];
$params = [];

if ($q !== '') {
    // IMPORTANT: use unique placeholders (PDO can fail if :q is reused)
    $whereParts[] = '(name LIKE :q_name OR email LIKE :q_email)';
    $like = '%' . $q . '%';
    $params[':q_name'] = $like;
    $params[':q_email'] = $like;
}

if ($role !== '' && ($role === 'admin' || $role === 'user')) {
    $whereParts[] = 'role = :role';
    $params[':role'] = $role;
}


$whereSql = '';
if (!empty($whereParts)) {
    $whereSql = 'WHERE ' . implode(' AND ', $whereParts);
}

// --- Count total users matching filter ---
$countSql = "SELECT COUNT(*) AS cnt FROM users $whereSql";
$countStmt = $pdo->prepare($countSql);
foreach ($params as $key => $value) {
    $countStmt->bindValue($key, $value, PDO::PARAM_STR);
}
$countStmt->execute();
$total = (int) $countStmt->fetchColumn();

// --- Fetch page of users ---
$dataSql = "
    SELECT
        id,
        name,
        email,
        role
    FROM users
    $whereSql
    ORDER BY id DESC
    LIMIT :limit OFFSET :offset
";

$dataStmt = $pdo->prepare($dataSql);

foreach ($params as $key => $value) {
    $dataStmt->bindValue($key, $value, PDO::PARAM_STR);
}

$dataStmt->bindValue(':limit', $limit, PDO::PARAM_INT);
$dataStmt->bindValue(':offset', $offset, PDO::PARAM_INT);

$dataStmt->execute();
$users = $dataStmt->fetchAll(PDO::FETCH_ASSOC);

$totalPages = $total > 0 ? (int) ceil($total / $limit) : 1;

echo json_encode([
    'status'      => 'ok',
    'page'        => $page,
    'per_page'    => $limit,
    'total'       => $total,
    'total_pages' => $totalPages,
    'data'        => $users,
]);

