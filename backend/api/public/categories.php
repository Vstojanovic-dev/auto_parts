<?php
// backend/api/public/categories.php

header('Content-Type: application/json');

require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../config.php';

try {
    $sql = "SELECT category, COUNT(*) AS product_count
            FROM products
            GROUP BY category
            ORDER BY category";

    $stmt = $pdo->query($sql);
    $rows = $stmt->fetchAll();

    echo json_encode([
        'status' => 'ok',
        'data'   => $rows,
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Failed to fetch categories',
    ]);
}
