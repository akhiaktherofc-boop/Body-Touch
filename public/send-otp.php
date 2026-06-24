<?php
/**
 * =========================================================================
 * 🛡️ BODY TOUCH SECURITY PORTAL - SECURE PHP OTP SENDER FALLBACK
 * =========================================================================
 * Designed for Hostinger Shared (or VPS) Hosting environments.
 * This script sends OTP verification codes using PHP's native mail system
 * when the Node.js Express server is not available.
 */

// Enable CORS for frontend compatibility
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Ensure it is a POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "error" => "Method not allowed. Use POST request only."
    ]);
    exit();
}

// Get JSON body input
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

// Fallback to form POST parameters if JSON decoding failed
if (!$data) {
    $data = $_POST;
}

$email = isset($data['email']) ? trim($data['email']) : '';
$username = isset($data['username']) ? trim($data['username']) : 'User';
$code = isset($data['code']) ? trim($data['code']) : '';

if (empty($email) || empty($code)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "error" => "Email and verification code are required parameters."
    ]);
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "error" => "Provided email address is invalid."
    ]);
    exit();
}

$subject = "🔐 [BODY TOUCH] Security Verification Code (ভেরিফিকেশন কোড)";

// HTML email message
$message = '
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>BODY TOUCH Verification</title>
</head>
<body style="margin: 0; padding: 0; background-color: #020716; font-family: \'Inter\', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #1e293b; border-radius: 16px; background-color: #020716; color: #ffffff;">
    <div style="text-align: center; border-bottom: 1px solid #1e293b; padding-bottom: 20px; margin-bottom: 25px;">
      <h2 style="color: #06b6d4; margin: 0; font-size: 24px; letter-spacing: 1px;">BODY TOUCH</h2>
      <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #64748b; font-weight: bold;">Security Portal</span>
    </div>
    <div style="padding: 10px 0;">
      <p style="font-size: 15px; color: #cbd5e1; margin-bottom: 15px;">Hello <strong style="color: #06b6d4;">' . htmlspecialchars($username) . '</strong>,</p>
      <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6; margin-bottom: 25px;">
        Please use the secure verification code below to authorize your login/registration:
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <span style="display: inline-block; font-family: \'Courier New\', monospace; font-size: 32px; font-weight: bold; color: #10b981; letter-spacing: 5px; background-color: #030d24; padding: 15px 35px; border-radius: 10px; border: 1px solid #10b981; box-shadow: 0 0 15px rgba(16, 185, 129, 0.1);">
          ' . htmlspecialchars($code) . '
        </span>
      </div>
      
      <p style="font-size: 12px; color: #f43f5e; line-height: 1.6; margin-top: 25px;">
        <strong>সতর্কতা:</strong> এই ওটিপি কোডটি শুধুমাত্র ১৫ মিনিটের জন্য কার্যকর থাকবে। আপনার ওটিপি কোড বা পাসওয়ার্ড অন্য কারও সাথে শেয়ার করবেন না।
      </p>
    </div>
  </div>
</body>
</html>
';

// Determine the server host name dynamically for from headers
$host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'body-touch.com';
// Remove port if present
$host = preg_replace('/:\d+$/', '', $host);

// Email headers
$headers = "MIME-Version: 1.0" . "\r\n";
$headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
$headers .= "From: BODY TOUCH Security <noreply@" . $host . ">" . "\r\n";
$headers .= "Reply-To: noreply@" . $host . "\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

// Send mail
if (@mail($email, $subject, $message, $headers)) {
    echo json_encode([
        "success" => true,
        "message" => "OTP sent successfully via Hostinger PHP mail service."
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "PHP mail function failed to dispatch. Verify hosting email server settings."
    ]);
}
?>
