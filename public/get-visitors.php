<?php
/**
 * =========================================================================
 * 🛡️ BODY TOUCH SECURITY PORTAL - SECURE PHP VISITORS FETCH SCRIPT
 * =========================================================================
 * Designed for Hostinger Shared (or VPS) Hosting environments.
 * This script retrieves stored visitor details from visitor_logs.json.
 */

// Enable CORS for frontend compatibility
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Ensure it is a GET request
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "error" => "Method not allowed. Use GET request only."
    ]);
    exit();
}

$logFile = __DIR__ . '/visitor_logs.json';
$logs = [];

if (file_exists($logFile)) {
    $content = file_get_contents($logFile);
    $decoded = json_decode($content, true);
    if (is_array($decoded)) {
        // Absolutely filter out any admin entries before returning
        $logs = array_filter($decoded, function($log) {
            $p = isset($log['path']) ? strtolower($log['path']) : '';
            $isFromAdmin = strpos($p, 'admin') !== false || strpos($p, 'turmarheda') !== false;
            return !$isFromAdmin;
        });
        $logs = array_values($logs);
    }
}

echo json_encode([
    "success" => true,
    "logs" => $logs
]);
