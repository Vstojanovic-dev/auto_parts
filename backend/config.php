<?php
// backend/config.php

$dsn = 'mysql:host=db;dbname=carparts;charset=utf8mb4';
$db_user = 'carparts_user';
$db_pass = 'carparts_pass';

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $db_user, $db_pass, $options);
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => 'Database connection failed'
        // optionally log $e->getMessage() somewhere later
    ]);
    exit;
}
