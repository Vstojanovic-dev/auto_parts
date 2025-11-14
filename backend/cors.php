<?php
// backend/cors.php

// Allow frontend dev origin
header('Access-Control-Allow-Origin: http://localhost:5173');
// Allow cookies / sessions
header('Access-Control-Allow-Credentials: true');
// Allowed headers
header('Access-Control-Allow-Headers: Content-Type');
// Allowed methods
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

// Handle preflight OPTIONS requests quickly
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

