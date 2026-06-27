<?php
/**
 * =========================================================================
 * 🛡️ BODY TOUCH SECURITY PORTAL - SECURE PHP CUSTOM EMAIL DISPATCH SCRIPT
 * =========================================================================
 * Designed for Hostinger Shared (or VPS) Hosting environments.
 * This script sends styled notifications (orders, membership, registrations)
 * using custom SMTP configurations, fallback files, or hardcoded secure details.
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

$toEmail = isset($data['toEmail']) ? trim($data['toEmail']) : '';
$subject = isset($data['subject']) ? trim($data['subject']) : '';
$bodyText = isset($data['bodyText']) ? $data['bodyText'] : '';
$smtp = isset($data['smtp']) ? $data['smtp'] : null;

if (empty($toEmail)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "error" => "Recipient email (toEmail) is a required parameter."
    ]);
    exit();
}

if (!filter_var($toEmail, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "error" => "Provided recipient email address is invalid."
    ]);
    exit();
}

// Default secure hardcoded SMTP settings (Gmail App Password fallback)
$defaultSmtp = [
    "host" => "smtp.gmail.com",
    "port" => 587,
    "user" => "metroomaa@gmail.com",
    "pass" => "ksvrmwpqubbjenxr",
    "secure" => false,
    "fromEmail" => "metroomaa@gmail.com"
];

// If no SMTP config was passed from the frontend, try to load it from the parent directory
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

$emailSubject = !empty($subject) ? $subject : "🔔 [BODY TOUCH] Notification Update";

// Format plain text body into structured HTML line breaks and bold header tags
$htmlBody = str_replace("\r\n", "<br>", $bodyText);
$htmlBody = str_replace("\n", "<br>", $htmlBody);

$htmlBody = preg_replace(
    '/--- SERVICE RECORD INQUIRY ---/i', 
    '<strong style="color: #06b6d4; display: block; border-bottom: 1px solid #1e293b; padding-bottom: 5px; margin-top: 20px; margin-bottom: 10px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Service Record Inquiry</strong>', 
    $htmlBody
);

$htmlBody = preg_replace(
    '/--- TRANSACTION LEDGER ---/i', 
    '<strong style="color: #06b6d4; display: block; border-bottom: 1px solid #1e293b; padding-bottom: 5px; margin-top: 20px; margin-bottom: 10px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Transaction Ledger</strong>', 
    $htmlBody
);

$htmlBody = preg_replace(
    '/--- WITHDRAWAL RECORD ---/i', 
    '<strong style="color: #06b6d4; display: block; border-bottom: 1px solid #1e293b; padding-bottom: 5px; margin-top: 20px; margin-bottom: 10px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Withdrawal Record</strong>', 
    $htmlBody
);

// HTML email template wrapper
$messageHtml = '
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>' . htmlspecialchars($emailSubject) . '</title>
</head>
<body style="margin: 0; padding: 0; background-color: #020716; font-family: \'Inter\', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #1e293b; border-radius: 16px; background-color: #020716; color: #ffffff;">
    <div style="text-align: center; border-bottom: 1px solid #1e293b; padding-bottom: 20px; margin-bottom: 25px;">
      <h2 style="color: #06b6d4; margin: 0; font-size: 24px; letter-spacing: 1px;">BODY TOUCH</h2>
      <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #64748b; font-weight: bold;">Concierge Hub & Notifications</span>
    </div>
    <div style="padding: 10px 0;">
      <div style="font-size: 14px; color: #cbd5e1; line-height: 1.6; margin-bottom: 25px;">
        ' . $htmlBody . '
      </div>
    </div>
    <div style="text-align: center; border-top: 1px solid #1e293b; padding-top: 20px; margin-top: 25px; font-size: 11px; color: #64748b; line-height: 1.5;">
      <p>This is a secure, automated notification dispatched on behalf of BODY TOUCH VIP service logistics.</p>
      <p style="margin-top: 5px;">&copy; 2026 BODY TOUCH Operations. All rights reserved.</p>
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
            "From: BODY TOUCH Concierge <" . $from . ">",
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
    $sendResult = send_smtp_email_socket($smtp, $toEmail, $emailSubject, $messageHtml);
    if ($sendResult) {
        echo json_encode([
            "success" => true,
            "method" => "secure_smtp_socket",
            "message" => "Custom email sent successfully via SMTP (" . htmlspecialchars($smtp['host']) . ")"
        ]);
        exit();
    }
} catch (Exception $e) {
    $smtpError = $e->getMessage();
}

// Native PHP mail() fallback
$host = isset($_SERVER['HTTP_HOST']) ? preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST']) : 'body-touch.com';
$headers = "MIME-Version: 1.0" . "\r\n";
$headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
$headers .= "From: BODY TOUCH Concierge <noreply@" . $host . ">" . "\r\n";
$headers .= "Reply-To: noreply@" . $host . "\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

if (@mail($toEmail, $emailSubject, $messageHtml, $headers)) {
    echo json_encode([
        "success" => true,
        "method" => "php_mail_fallback",
        "message" => "Custom email sent via native PHP mail fallback. Note: SMTP failed with: " . $smtpError
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Both SMTP socket and native PHP mail failed to dispatch custom email. SMTP Error: " . $smtpError
    ]);
}
?>
