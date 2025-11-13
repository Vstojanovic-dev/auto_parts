<?php
// backend/api/test-db.php

header('Content-Type: application/json');

require_once __DIR__ . '/../../config.php';

try {
    $stmt = $pdo->query("SELECT COUNT(*) AS product_count FROM products");
    $row = $stmt->fetch();

    echo json_encode([
        'status' => 'ok',
        'product_count' => (int) ($row['product_count'] ?? 0)
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Query failed'
    ]);
}

