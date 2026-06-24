<?php
/**
 * =========================================================================
 * 🛡️ BODY TOUCH SECURITY PORTAL - SECURE PHP SMTP & OTP DISPATCH SCRIPT
 * =========================================================================
 * Designed for Hostinger Shared (or VPS) Hosting environments.
 * This script sends OTP verification codes using custom SMTP configurations
 * sent from the frontend, stored in smtp-config.json, or hardcoded securely
 * as fallbacks.
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
$smtp = isset($data['smtp']) ? $data['smtp'] : null;

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

// Secure Default SMTP configurations hardcoded (Gmail App Password fallback)
// This solves the issue when smtp-config.json is not uploaded to Hostinger!
$defaultSmtp = [
    "host" => "smtp.gmail.com",
    "port" => 587,
    "user" => "metroomaa@gmail.com",
    "pass" => "ksvrmwpqubbjenxr",
    "secure" => false,
    "fromEmail" => "sakilroky@gmail.com"
];

// If no SMTP config was passed from the frontend, try to load it from parent directory
if (!$smtp) {
    $configPaths = [
        __DIR__ . '/smtp-config.json',
        dirname(__DIR__) . '/smtp-config.json'
    ];
    foreach ($configPaths as $path) {
        if (file_exists($path)) {
            $jsonContent = @file_get_contents($path);
            $parsed = json_decode($jsonContent, true);
            if ($parsed) {
                $smtp = $parsed;
                break;
            }
        }
    }
}

// Fallback to the secure hardcoded default credentials if still empty or invalid
if (!$smtp || empty($smtp['host']) || empty($smtp['user'])) {
    $smtp = $defaultSmtp;
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

/**
 * Sends email using a pure PHP SMTP client via direct socket connection.
 * Fully compatible with standard email servers including Gmail (ports 465, 587, 25).
 */
function send_smtp_email_socket($smtp, $to, $subject, $message_html) {
    $host = isset($smtp['host']) ? trim($smtp['host']) : '';
    $port = isset($smtp['port']) ? intval($smtp['port']) : 587;
    $user = isset($smtp['user']) ? trim($smtp['user']) : '';
    $pass = isset($smtp['pass']) ? trim($smtp['pass']) : '';
    $secure = isset($smtp['secure']) && ($smtp['secure'] === true || $smtp['secure'] === 'true' || $smtp['secure'] === 1 || $smtp['secure'] === '1');
    $from = !empty($smtp['fromEmail']) ? trim($smtp['fromEmail']) : $user;

    if (empty($host) || empty($user) || empty($pass)) {
        throw new Exception("Missing essential SMTP settings (Host, Username, or Password).");
    }

    // Determine connection protocol prefix
    $protocol = '';
    if ($secure || $port === 465) {
        $protocol = 'ssl://';
    }

    $connectionTarget = $protocol . $host;
    
    // Use 10-second timeout for rapid failure feedback
    $socket = @fsockopen($connectionTarget, $port, $errno, $errstr, 10);
    if (!$socket) {
        throw new Exception("Connection to SMTP host $connectionTarget:$port failed: $errstr ($errno). Hostinger might be blocking outbound port $port.");
    }

    // Helper to read server response with validation
    $readResponse = function($socket, $expected_code) {
        $response = '';
        while ($line = fgets($socket, 515)) {
            $response .= $line;
            // SMTP lines ending with space after the code indicate the last line of response
            if (substr($line, 3, 1) === ' ') {
                break;
            }
        }
        $code = substr($response, 0, 3);
        if ($code !== $expected_code) {
            throw new Exception("SMTP protocol error: Expected $expected_code, but got: " . trim($response));
        }
        return $response;
    };

    // Helper to transmit SMTP command
    $sendCommand = function($socket, $cmd) {
        fputs($socket, $cmd . "\r\n");
    };

    try {
        $readResponse($socket, '220');

        $localhost = isset($_SERVER['HTTP_HOST']) ? preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST']) : 'localhost';
        $sendCommand($socket, "EHLO " . $localhost);
        $ehloResponse = $readResponse($socket, '250');

        // Handle STARTTLS handshake if on port 587
        if ($port === 587 && strpos($ehloResponse, 'STARTTLS') !== false && empty($protocol)) {
            $sendCommand($socket, "STARTTLS");
            $readResponse($socket, '220');

            // Upgrade connection to secure TLS socket
            $crypto_method = STREAM_CRYPTO_METHOD_TLS_CLIENT;
            if (defined('STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT')) {
                $crypto_method |= STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT;
            }
            if (defined('STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT')) {
                $crypto_method |= STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT;
            }

            if (!@stream_socket_enable_crypto($socket, true, $crypto_method)) {
                throw new Exception("TLS negotiation failed via STARTTLS.");
            }

            // Say hello again securely
            $sendCommand($socket, "EHLO " . $localhost);
            $readResponse($socket, '250');
        }

        // Authenticate with server
        $sendCommand($socket, "AUTH LOGIN");
        $readResponse($socket, '334');

        $sendCommand($socket, base64_encode($user));
        $readResponse($socket, '334');

        $sendCommand($socket, base64_encode($pass));
        $readResponse($socket, '235');

        // Specify sender
        $sendCommand($socket, "MAIL FROM:<" . $from . ">");
        $readResponse($socket, '250');

        // Specify recipient
        $sendCommand($socket, "RCPT TO:<" . $to . ">");
        $readResponse($socket, '250');

        // Start transmitting email data
        $sendCommand($socket, "DATA");
        $readResponse($socket, '354');

        // Construct complete standard headers
        $emailHeaders = [
            "MIME-Version: 1.0",
            "Content-Type: text/html; charset=UTF-8",
            "From: BODY TOUCH <" . $from . ">",
            "To: <" . $to . ">",
            "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=",
            "Date: " . date('r'),
            "X-Mailer: BodyTouch-Secure-PHP-SMTP"
        ];

        $headersPayload = implode("\r\n", $emailHeaders);
        $fullPayload = $headersPayload . "\r\n\r\n" . $message_html . "\r\n.";

        $sendCommand($socket, $fullPayload);
        $readResponse($socket, '250');

        $sendCommand($socket, "QUIT");
        fclose($socket);
        return true;
    } catch (Exception $e) {
        @fputs($socket, "QUIT\r\n");
        @fclose($socket);
        throw $e;
    }
}

// Execution flow
$smtpError = "";
try {
    $sendResult = send_smtp_email_socket($smtp, $email, $subject, $message);
    if ($sendResult) {
        echo json_encode([
            "success" => true,
            "method" => "secure_smtp_socket",
            "message" => "OTP sent successfully via SMTP (" . htmlspecialchars($smtp['host']) . ")"
        ]);
        exit();
    }
} catch (Exception $e) {
    $smtpError = $e->getMessage();
}

// If direct SMTP failed, we output the explicit failure so the user knows exactly why their Hostinger SMTP didn't fire!
// This avoids false success reporting.
http_response_code(500);
echo json_encode([
    "success" => false,
    "error" => "SMTP dispatch failed. Please verify your Hostinger outgoing mail ports or App Password.",
    "details" => $smtpError,
    "smtp_attempted" => [
        "host" => $smtp['host'],
        "port" => $smtp['port'],
        "user" => $smtp['user']
    ]
]);
exit();
?>
