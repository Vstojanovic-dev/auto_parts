<?php declare(strict_types=1);
// backend/api/admin/coupons_create.php

header('Content-Type: application/json');

require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../admin_guard.php';

// Ensure current user is admin
$adminUser = require_admin();

/** @var PDO $pdo */
global $pdo;

// Read JSON body
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Invalid JSON body',
    ]);
    exit;
}

// Extract & sanitize fields
$code          = isset($data['code']) ? trim((string) $data['code']) : '';
$discountType  = isset($data['discount_type']) ? trim((string) $data['discount_type']) : '';
$discountValue = isset($data['discount_value']) ? (float) $data['discount_value'] : 0.0;

// Dates (simple strings; DB will parse them)
$validFromRaw = isset($data['valid_from']) ? trim((string) $data['valid_from']) : '';
$validToRaw   = isset($data['valid_to']) ? trim((string) $data['valid_to']) : '';

// Usage limit
$usageLimit = null;
if (array_key_exists('usage_limit', $data) && $data['usage_limit'] !== null && $data['usage_limit'] !== '') {
    $usageLimit = (int) $data['usage_limit'];
}

// is_active flag
$isActive = true;
if (array_key_exists('is_active', $data)) {
    $isActive = (bool) $data['is_active'];
}

// --- Validation ---
$errors = [];

if ($code === '') {
    $errors[] = 'code is required';
}

$allowedTypes = ['percent', 'fixed'];
if ($discountType === '' || !in_array($discountType, $allowedTypes, true)) {
    $errors[] = 'discount_type must be one of: percent, fixed';
}

if ($discountValue <= 0) {
    $errors[] = 'discount_value must be greater than 0';
}

if ($discountType === 'percent' && $discountValue > 100) {
    $errors[] = 'percent discount_value cannot be greater than 100';
}

if ($usageLimit !== null && $usageLimit < 0) {
    $errors[] = 'usage_limit cannot be negative';
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Validation failed',
        'errors'  => $errors,
    ]);
    exit;
}

// Normalize date strings (very basic)
$validFrom = $validFromRaw !== '' ? $validFromRaw : null;
$validTo   = $validToRaw !== '' ? $validToRaw : null;

// --- Insert coupon ---
try {
    $sql = "
        INSERT INTO coupons
            (code, discount_type, discount_value, valid_from, valid_to, is_active, usage_limit, used_count)
        VALUES
            (:code, :discount_type, :discount_value, :valid_from, :valid_to, :is_active, :usage_limit, 0)
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':code', $code, PDO::PARAM_STR);
    $stmt->bindValue(':discount_type', $discountType, PDO::PARAM_STR);
    $stmt->bindValue(':discount_value', $discountValue);

    if ($validFrom !== null && $validFrom !== '') {
        $stmt->bindValue(':valid_from', $validFrom, PDO::PARAM_STR);
    } else {
        $stmt->bindValue(':valid_from', null, PDO::PARAM_NULL);
    }

    if ($validTo !== null && $validTo !== '') {
        $stmt->bindValue(':valid_to', $validTo, PDO::PARAM_STR);
    } else {
        $stmt->bindValue(':valid_to', null, PDO::PARAM_NULL);
    }

    if ($usageLimit !== null) {
        $stmt->bindValue(':usage_limit', $usageLimit, PDO::PARAM_INT);
    } else {
        $stmt->bindValue(':usage_limit', null, PDO::PARAM_NULL);
    }

    $stmt->bindValue(':is_active', $isActive ? 1 : 0, PDO::PARAM_INT);

    $stmt->execute();

    $newId = (int) $pdo->lastInsertId();

    // Fetch the created coupon
    $fetchSql = "
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
        WHERE id = ?
        LIMIT 1
    ";
    $fetchStmt = $pdo->prepare($fetchSql);
    $fetchStmt->execute([$newId]);
    $coupon = $fetchStmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'ok',
        'data'   => $coupon,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Failed to create coupon',
    ]);
}
