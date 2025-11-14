<?php
// backend/api/public/auth/register.php

header('Content-Type: application/json');

require_once __DIR__ . '/../../../config.php';
require_once __DIR__ . '/../../../cors.php';

// Read JSON body
$input = json_decode(file_get_contents('php://input'), true);

$name     = trim($input['name']     ?? '');
$email    = trim($input['email']    ?? '');
$password = trim($input['password'] ?? '');

// Basic validation
$errors = [];

if ($name === '') {
    $errors[] = 'Name is required';
}
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Valid email is required';
}
if ($password === '' || strlen($password) < 6) {
    $errors[] = 'Password must be at least 6 characters';
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'errors' => $errors
    ]);
    exit;
}

try {
    // Check if email already exists
    $checkStmt = $pdo->prepare("SELECT id FROM users WHERE email = :email LIMIT 1");
    $checkStmt->bindValue(':email', $email);
    $checkStmt->execute();

    if ($checkStmt->fetch()) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'errors' => ['Email is already registered']
        ]);
        exit;
    }

    // Hash password
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    // Insert user
    $insertSql = "INSERT INTO users (name, email, password_hash, role, is_verified)
                  VALUES (:name, :email, :password_hash, 'user', 0)";
    $insertStmt = $pdo->prepare($insertSql);
    $insertStmt->bindValue(':name', $name);
    $insertStmt->bindValue(':email', $email);
    $insertStmt->bindValue(':password_hash', $passwordHash);
    $insertStmt->execute();

    $userId = (int) $pdo->lastInsertId();

    http_response_code(201);
    echo json_encode([
        'status' => 'ok',
        'user_id' => $userId
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Registration failed'
    ]);
}

