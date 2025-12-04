<?php
// backend/api/admin/product_upload_image.php

declare(strict_types=1);

header('Content-Type: application/json');

require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../admin_guard.php';

// Ensure current user is admin
$adminUser = require_admin();

// Max file size in bytes (e.g. 5 MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed MIME types
$allowedMimeTypes = [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
];

// Check that the request is multipart/form-data with a file named "image"
if (
    !isset($_FILES['image']) ||
    !is_array($_FILES['image']) ||
    !isset($_FILES['image']['tmp_name'])
) {
    http_response_code(400);
    echo json_encode([
        'status'  => 'error',
        'message' => 'No image file uploaded (expected field name "image")',
    ]);
    exit;
}

$file = $_FILES['image'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode([
        'status'  => 'error',
        'message' => 'File upload error code: ' . $file['error'],
    ]);
    exit;
}

if ($file['size'] <= 0 || $file['size'] > MAX_FILE_SIZE) {
    http_response_code(400);
    echo json_encode([
        'status'  => 'error',
        'message' => 'File is empty or exceeds maximum size of 5 MB',
    ]);
    exit;
}

// Detect MIME type safely
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->file($file['tmp_name']);

if (!isset($allowedMimeTypes[$mimeType])) {
    http_response_code(400);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Unsupported file type: ' . $mimeType,
    ]);
    exit;
}

$extension = $allowedMimeTypes[$mimeType];

// Build upload directory path (on filesystem)
$uploadDir = __DIR__ . '/../../assets/products';

// Ensure directory exists
if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0775, true) && !is_dir($uploadDir)) {
        http_response_code(500);
        echo json_encode([
            'status'  => 'error',
            'message' => 'Failed to create upload directory',
        ]);
        exit;
    }
}


$basename = bin2hex(random_bytes(16)); // random 32 hex chars
$filename = $basename . '.' . $extension;

// Full filesystem path
$destination = $uploadDir . '/' . $filename;

// Move uploaded file
if (!move_uploaded_file($file['tmp_name'], $destination)) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Failed to move uploaded file',
    ]);
    exit;
}

// Build public URL path (served by Apache from /var/www/html)
$publicUrl = '/assets/products/' . $filename;

echo json_encode([
    'status' => 'ok',
    'url'    => $publicUrl,
]);

