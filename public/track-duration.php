<?php
/**
 * =========================================================================
 * 🛡️ BODY TOUCH SECURITY PORTAL - SECURE PHP DURATION UPDATE SCRIPT
 * =========================================================================
 * Updates the active session duration for a visitor.
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Method not allowed."]);
    exit();
}

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data) {
    $data = $_POST;
}

$logId = isset($data['logId']) ? trim($data['logId']) : '';
$duration = isset($data['duration']) ? (int)$data['duration'] : 0;

if (empty($logId)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "logId is required."]);
    exit();
}

$logFile = __DIR__ . '/visitor_logs.json';

if (file_exists($logFile)) {
    $existingContent = file_get_contents($logFile);
    $logs = json_decode($existingContent, true);
    
    if (is_array($logs)) {
        $updated = false;
        foreach ($logs as &$log) {
            if (isset($log['id']) && $log['id'] === $logId) {
                $log['duration'] = max(isset($log['duration']) ? (int)$log['duration'] : 0, $duration);
                $updated = true;
                break;
            }
        }
        
        if ($updated) {
            file_put_contents($logFile, json_encode($logs, JSON_PRETTY_PRINT), LOCK_EX);
            echo json_encode(["success" => true, "message" => "Duration updated successfully."]);
            exit();
        }
    }
}

echo json_encode(["success" => false, "error" => "Log not found."]);
