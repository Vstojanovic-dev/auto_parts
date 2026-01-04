<?php declare(strict_types=1);

header('Content-Type: application/json');

require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../config.php';

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) $input = [];

// Base fields (existing)
$name     = trim((string)($input['name'] ?? ''));
$email    = trim((string)($input['email'] ?? ''));
$password = (string)($input['password'] ?? '');

// New optional fields
$gender      = trim((string)($input['gender'] ?? ''));
$dateOfBirth = trim((string)($input['date_of_birth'] ?? ''));

$vehicle = is_array($input['vehicle'] ?? null) ? $input['vehicle'] : [];
$carYear = isset($vehicle['year']) && $vehicle['year'] !== '' ? (int)$vehicle['year'] : null;
$make    = trim((string)($vehicle['make'] ?? ''));
$model   = trim((string)($vehicle['model'] ?? ''));
$engine  = trim((string)($vehicle['engine'] ?? ''));

$address = is_array($input['address'] ?? null) ? $input['address'] : [];
$addr1   = trim((string)($address['address_line1'] ?? $address['address_line'] ?? '')); // supports both keys
$apt     = trim((string)($address['apartment'] ?? ''));
$city    = trim((string)($address['city'] ?? ''));
$postal  = trim((string)($address['postal_code'] ?? ''));
$country = trim((string)($address['country'] ?? ''));

// Validate base
$errors = [];
if ($name === '') $errors[] = 'Name is required';
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'Valid email is required';
if ($password === '' || strlen($password) < 6) $errors[] = 'Password must be at least 6 characters';

// Validate gender if provided
$allowedGenders = ['male','female','other','prefer_not',''];
if (!in_array($gender, $allowedGenders, true)) $errors[] = 'Invalid gender';

// Validate DOB if provided
if ($dateOfBirth !== '') {
    $ts = strtotime($dateOfBirth);
    if ($ts === false) $errors[] = 'Invalid date of birth';
    elseif ($ts > time()) $errors[] = 'Date of birth cannot be in the future';
}

// If any address field is provided, require minimal set (apt/country optional)
$addressProvided = ($addr1 !== '' || $city !== '' || $postal !== '' || $apt !== '' || $country !== '');
if ($addressProvided) {
    if ($addr1 === '') $errors[] = 'Address is required';
    if ($city === '') $errors[] = 'City is required';
    if ($postal === '') $errors[] = 'Postal code is required';
}

if ($errors) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'errors' => $errors]);
    exit;
}

try {
    // Unique email check
    $check = $pdo->prepare("SELECT id FROM users WHERE email = :email LIMIT 1");
    $check->execute([':email' => $email]);
    if ($check->fetch()) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'errors' => ['Email is already registered']]);
        exit;
    }

    $pdo->beginTransaction();

    // Insert user
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    $ins = $pdo->prepare("
        INSERT INTO users (name, email, password_hash, role, is_verified)
        VALUES (:name, :email, :ph, 'user', 0)
    ");
    $ins->execute([
        ':name'  => $name,
        ':email' => $email,
        ':ph'    => $passwordHash,
    ]);

    $userId = (int)$pdo->lastInsertId();

    // Profile (optional)
    if ($gender !== '' || $dateOfBirth !== '') {
        $p = $pdo->prepare("
            INSERT INTO user_profiles (user_id, gender, date_of_birth)
            VALUES (:uid, :g, :dob)
            ON DUPLICATE KEY UPDATE gender=VALUES(gender), date_of_birth=VALUES(date_of_birth)
        ");
        $p->execute([
            ':uid' => $userId,
            ':g'   => ($gender !== '' ? $gender : null),
            ':dob' => ($dateOfBirth !== '' ? $dateOfBirth : null),
        ]);
    }

    // Vehicle (optional)
    $vehicleProvided = ($carYear !== null || $make !== '' || $model !== '' || $engine !== '');
    if ($vehicleProvided) {
        $v = $pdo->prepare("
            INSERT INTO user_vehicles (user_id, year, make, model, engine, is_primary)
            VALUES (:uid, :y, :make, :model, :engine, 1)
        ");
        $v->execute([
            ':uid'    => $userId,
            ':y'      => $carYear,
            ':make'   => ($make !== '' ? $make : null),
            ':model'  => ($model !== '' ? $model : null),
            ':engine' => ($engine !== '' ? $engine : null),
        ]);
    }

    // Address (optional)
    if ($addressProvided) {
        $a = $pdo->prepare("
            INSERT INTO user_addresses (user_id, address_line1, apartment, city, postal_code, country, is_default)
            VALUES (:uid, :l1, :apt, :city, :pc, :cty, 1)
        ");
        $a->execute([
            ':uid' => $userId,
            ':l1'  => $addr1,
            ':apt' => ($apt !== '' ? $apt : null),
            ':city'=> $city,
            ':pc'  => $postal,
            ':cty' => ($country !== '' ? $country : null),
        ]);
    }

    // Create email verification token
    $token = bin2hex(random_bytes(32));
    $tokenHash = hash('sha256', $token);
    $expiresAt = date('Y-m-d H:i:s', time() + 24 * 60 * 60);

    $ev = $pdo->prepare("
        INSERT INTO email_verifications (user_id, token_hash, expires_at)
        VALUES (:uid, :h, :exp)
    ");
    $ev->execute([
        ':uid' => $userId,
        ':h'   => $tokenHash,
        ':exp' => $expiresAt,
    ]);

    $pdo->commit();

    // “Works out of the gate” verification link (no SMTP required)
    $verifyUrl = "http://localhost:8080/api/public/auth/verify_email.php?token=" . $token;

    // Optional best-effort email (may do nothing in Docker, that’s OK)
    @mail($email, "Verify your email", "Verify here:\n$verifyUrl");

    http_response_code(201);
    echo json_encode([
        'status' => 'ok',
        'user_id' => $userId,
        'verify_url' => $verifyUrl
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Registration failed']);
}
