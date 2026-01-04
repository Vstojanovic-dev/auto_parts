<?php declare(strict_types=1);
// backend/api/public/me.php

header('Content-Type: application/json');

require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../user_guard.php';

/** @var PDO $pdo */
global $pdo;

$user = require_login();
$userId = (int)$user['id'];

try {
    // profile (gender, dob)
    $profileStmt = $pdo->prepare('
        SELECT gender, date_of_birth
        FROM user_profiles
        WHERE user_id = ?
        LIMIT 1
    ');
    $profileStmt->execute([$userId]);
    $profile = $profileStmt->fetch(PDO::FETCH_ASSOC) ?: null;

    // primary vehicle
    $vehStmt = $pdo->prepare('
        SELECT year, make, model, engine
        FROM user_vehicles
        WHERE user_id = ?
        ORDER BY is_primary DESC, id DESC
        LIMIT 1
    ');
    $vehStmt->execute([$userId]);
    $vehicle = $vehStmt->fetch(PDO::FETCH_ASSOC) ?: null;

    // default address
    $addrStmt = $pdo->prepare('
        SELECT address_line1, apartment, city, postal_code, country
        FROM user_addresses
        WHERE user_id = ?
        ORDER BY is_default DESC, id DESC
        LIMIT 1
    ');
    $addrStmt->execute([$userId]);
    $address = $addrStmt->fetch(PDO::FETCH_ASSOC) ?: null;

    echo json_encode([
        'status' => 'ok',
        'user' => [
            'id'          => (int)$user['id'],
            'name'        => $user['name'],
            'email'       => $user['email'],
            'role'        => $user['role'],
            'is_verified' => (int)$user['is_verified'],
            'created_at'  => $user['created_at'] ?? null,
        ],
        'profile' => $profile,
        'vehicle' => $vehicle,
        'address' => $address,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Failed to load profile',
    ]);
}

