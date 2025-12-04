<?php declare(strict_types=1);
// backend/api/public/coupons_validate.php

header('Content-Type: application/json');

require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../config.php';

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

$codeRaw      = $data['code']        ?? '';
$orderTotalRaw = $data['order_total'] ?? null;

$code = trim((string) $codeRaw);
$orderTotal = $orderTotalRaw !== null ? (float) $orderTotalRaw : 0.0;

if ($code === '' || $orderTotal <= 0) {
    http_response_code(400);
    echo json_encode([
        'status'  => 'error',
        'message' => 'code and positive order_total are required',
    ]);
    exit;
}

try {
    // Load coupon and check basic active + date window in SQL
    $sql = "
        SELECT
            id,
            code,
            discount_type,
            discount_value,
            valid_from,
            valid_to,
            is_active,
            usage_limit,
            used_count
        FROM coupons
        WHERE
            code = :code
            AND is_active = 1
            AND (valid_from IS NULL OR valid_from <= NOW())
            AND (valid_to IS NULL   OR valid_to   >= NOW())
        LIMIT 1
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':code', $code, PDO::PARAM_STR);
    $stmt->execute();
    $coupon = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$coupon) {
        http_response_code(404);
        echo json_encode([
            'status'  => 'error',
            'message' => 'Coupon not found or not currently valid',
        ]);
        exit;
    }

    // Check usage limit
    $usageLimit = $coupon['usage_limit'] !== null ? (int) $coupon['usage_limit'] : null;
    $usedCount  = (int) $coupon['used_count'];

    if ($usageLimit !== null && $usedCount >= $usageLimit) {
        http_response_code(400);
        echo json_encode([
            'status'  => 'error',
            'message' => 'Coupon usage limit reached',
        ]);
        exit;
    }

    $discountType  = (string) $coupon['discount_type'];
    $discountValue = (float) $coupon['discount_value'];

    if ($discountValue <= 0) {
        http_response_code(400);
        echo json_encode([
            'status'  => 'error',
            'message' => 'Coupon has invalid discount value',
        ]);
        exit;
    }

    // Calculate discount amount
    $discountAmount = 0.0;

    if ($discountType === 'percent') {
        $discountAmount = $orderTotal * ($discountValue / 100.0);
    } elseif ($discountType === 'fixed') {
        $discountAmount = $discountValue;
    } else {
        http_response_code(400);
        echo json_encode([
            'status'  => 'error',
            'message' => 'Unsupported discount_type',
        ]);
        exit;
    }

    // Do not allow discount > order total
    if ($discountAmount > $orderTotal) {
        $discountAmount = $orderTotal;
    }

    $finalTotal = $orderTotal - $discountAmount;

    echo json_encode([
        'status' => 'ok',
        'data'   => [
            'code'            => $coupon['code'],
            'discount_type'   => $discountType,
            'discount_value'  => $discountValue,
            'order_total'     => $orderTotal,
            'discount_amount' => round($discountAmount, 2),
            'final_total'     => round($finalTotal, 2),
        ],
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Failed to validate coupon',
    ]);
}

