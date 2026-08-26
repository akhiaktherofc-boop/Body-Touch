<?php
/**
 * =========================================================================
 * BODY TOUCH SECURITY PORTAL - SECURE PHP VISITOR RETRIEVAL SCRIPT
 * =========================================================================
 * Retrieves visitor logs for Administrator Console with 3-Day Retention
 */
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$logFile = __DIR__ . '/visitor_logs.json';
$logs = [];

if (file_exists($logFile)) {
    $existingContent = file_get_contents($logFile);
    $decoded = json_decode($existingContent, true);
    if (is_array($decoded)) {
        // 3 Days Retention Limit (3 * 24 * 60 * 60 = 259200 seconds)
        $threeDaysAgo = time() - (3 * 24 * 60 * 60);

        // Filter out admin routes and logs older than 3 days
        $logs = array_filter($decoded, function($log) use ($threeDaysAgo) {
            $p = isset($log['path']) ? strtolower($log['path']) : '';
            $isFromAdmin = strpos($p, 'admin') !== false || strpos($p, 'turmarheda') !== false;
            if ($isFromAdmin) return false;

            if (isset($log['timestamp'])) {
                $t = strtotime($log['timestamp']);
                if ($t && $t < $threeDaysAgo) {
                    return false; // older than 3 days, auto-prune
                }
            }
            return true;
        });
        $logs = array_values($logs);

        // Save pruned version back if size decreased
        if (count($logs) !== count($decoded)) {
            file_put_contents($logFile, json_encode($logs, JSON_PRETTY_PRINT), LOCK_EX);
        }
    }
}

echo json_encode([
    "success" => true,
    "retentionDays" => 3,
    "logs" => $logs
]);
