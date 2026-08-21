<?php
/**
 * =========================================================================
 * 🛡️ BODY TOUCH SECURITY PORTAL - SECURE PHP VISITOR TRACKING SCRIPT
 * =========================================================================
 * Designed for Hostinger Shared (or VPS) Hosting environments.
 * This script logs visitor details (IP, GeoIP location, UserAgent, paths, etc.)
 * and stores them inside visitor_logs.json on the server.
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

if (!$data) {
    $data = $_POST;
}

$userAgent = isset($data['userAgent']) ? trim($data['userAgent']) : '';
$referer = isset($data['referer']) ? trim($data['referer']) : '';
$path = isset($data['path']) ? trim($data['path']) : '/';
$isUnique = isset($data['isUnique']) ? (bool)$data['isUnique'] : true;

// Get client IP address securely
$ip = '';
if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
    $ip = $_SERVER['HTTP_CLIENT_IP'];
} elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
    // Can contain multiple IPs, get the first one
    $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
    $ip = trim($ips[0]);
} elseif (!empty($_SERVER['HTTP_X_REAL_IP'])) {
    $ip = $_SERVER['HTTP_X_REAL_IP'];
} else {
    $ip = $_SERVER['REMOTE_ADDR'];
}

$cleanIp = trim($ip);

// Check if request is from Admin (by payload flag, custom header, or path contents)
$isAdminPayload = isset($data['isAdmin']) && $data['isAdmin'] === true;
$isAdminHeader = isset($_SERVER['HTTP_X_IS_ADMIN']) && $_SERVER['HTTP_X_IS_ADMIN'] === 'true';
$isAdminPath = strpos(strtolower($path), 'admin') !== false || strpos(strtolower($path), 'turmarheda') !== false;

if ($isAdminPayload || $isAdminHeader || $isAdminPath) {
    echo json_encode([
        "success" => true,
        "bypassed" => true,
        "message" => "Admin visit tracking bypassed successfully."
    ]);
    exit();
}

// Resolve IP to Location via GeoIP API (freeipapi.com as primary, ip-api.com as backup)
$city = "Unknown City";
$country = "Unknown Country";
$countryCode = "UN";
$region = "Unknown Region";
$org = "Unknown ISP";

// If local IP, use local fallbacks
$isLocal = false;
if (empty($cleanIp) || $cleanIp === "::1" || $cleanIp === "127.0.0.1" || 
    strpos($cleanIp, '10.') === 0 || strpos($cleanIp, '192.168.') === 0 || 
    strpos($cleanIp, '172.') === 0 || strpos($cleanIp, '169.254.') === 0 || 
    strpos($cleanIp, '100.64.') === 0) {
    $isLocal = true;
    $city = "Localhost";
    $country = "Bangladesh (Dev)";
    $countryCode = "BD";
    $region = "Developer Lab";
    $org = "Local Development Server";
}

if (!$isLocal) {
    // 1. Primary accurate lookup using ipwho.is
    $url = "https://ipwho.is/" . urlencode($cleanIp);
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 4);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $resolved = false;
    if ($httpCode === 200 && !empty($response)) {
        $geo = json_decode($response, true);
        if ($geo && isset($geo['success']) && $geo['success'] !== false) {
            $city = isset($geo['city']) && !empty($geo['city']) ? $geo['city'] : "Unknown City";
            $country = isset($geo['country']) && !empty($geo['country']) ? $geo['country'] : "Unknown Country";
            $countryCode = isset($geo['country_code']) && !empty($geo['country_code']) ? $geo['country_code'] : "UN";
            $region = isset($geo['region']) && !empty($geo['region']) ? $geo['region'] : "Unknown Region";
            $org = isset($geo['connection']['isp']) && !empty($geo['connection']['isp']) ? $geo['connection']['isp'] : "Unknown ISP";
            $resolved = true;
        }
    }

    if (!$resolved) {
        // 2. Secondary fallback: freeipapi.com
        $urlFallback = "https://freeipapi.com/api/json/" . urlencode($cleanIp);
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $urlFallback);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 4);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 200 && !empty($response)) {
            $geo = json_decode($response, true);
            if ($geo) {
                $city = isset($geo['cityName']) && !empty($geo['cityName']) ? $geo['cityName'] : "Unknown City";
                $country = isset($geo['countryName']) && !empty($geo['countryName']) ? $geo['countryName'] : "Unknown Country";
                $countryCode = isset($geo['countryCode']) && !empty($geo['countryCode']) ? $geo['countryCode'] : "UN";
                $region = isset($geo['regionName']) && !empty($geo['regionName']) ? $geo['regionName'] : "Unknown Region";
                $resolved = true;
            }
        }
    }

    if (!$resolved) {
        // 3. Tertiary fallback: ip-api.com
        $urlBackup = "http://ip-api.com/json/" . urlencode($cleanIp);
        $chBackup = curl_init();
        curl_setopt($chBackup, CURLOPT_URL, $urlBackup);
        curl_setopt($chBackup, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($chBackup, CURLOPT_TIMEOUT, 4);
        $responseBackup = curl_exec($chBackup);
        $httpCodeBackup = curl_getinfo($chBackup, CURLINFO_HTTP_CODE);
        curl_close($chBackup);

        if ($httpCodeBackup === 200 && !empty($responseBackup)) {
            $geoBackup = json_decode($responseBackup, true);
            if ($geoBackup && isset($geoBackup['status']) && $geoBackup['status'] === 'success') {
                $city = isset($geoBackup['city']) && !empty($geoBackup['city']) ? $geoBackup['city'] : "Unknown City";
                $country = isset($geoBackup['country']) && !empty($geoBackup['country']) ? $geoBackup['country'] : "Unknown Country";
                $countryCode = isset($geoBackup['countryCode']) && !empty($geoBackup['countryCode']) ? $geoBackup['countryCode'] : "UN";
                $region = isset($geoBackup['regionName']) && !empty($geoBackup['regionName']) ? $geoBackup['regionName'] : "Unknown Region";
                $org = isset($geoBackup['org']) && !empty($geoBackup['org']) ? $geoBackup['org'] : "Unknown ISP";
            }
        }
    }
}

// Parse Simple User Agent (Browser & OS & Device)
$browser = "Unknown Browser";
$os = "Unknown OS";
$device = "Desktop / Laptop";

if (!empty($userAgent)) {
    // Detect OS
    if (preg_match('/windows|win32/i', $userAgent)) {
        $os = 'Windows';
    } elseif (preg_match('/macintosh|mac os x/i', $userAgent)) {
        $os = 'macOS';
    } elseif (preg_match('/android/i', $userAgent)) {
        $os = 'Android';
        $device = 'Android Device';
        
        // Attempt to extract Android device model from parentheses, e.g. "Linux; Android 10; SM-A505F"
        if (preg_match('/\(([^)]+)\)/', $userAgent, $matches)) {
            $parts = explode(';', $matches[1]);
            foreach ($parts as $part) {
                $part = trim($part);
                if (preg_match('/android/i', $part) || preg_match('/linux/i', $part) || preg_match('/wv/i', $part) || preg_match('/khtml/i', $part)) {
                    continue;
                }
                
                if (preg_match('/([^/]+)\s+build/i', $part, $subMatches)) {
                    $m = trim($subMatches[1]);
                    if (!empty($m)) {
                        $device = $m;
                        break;
                    }
                }
                
                if (preg_match('/(sm-|cph-|v21|moto|redmi|xiaomi|oneplus|pixel|vivo|oppo|huawei|realme|infinix|tecno|galaxy|lenovo|nexus|asus|lg-)/i', $part)) {
                    $device = $part;
                    break;
                }
            }
            
            // Fallback generic android brand search
            if ($device === "Android Device" && count($parts) >= 3) {
                $candidate = trim(end($parts));
                if (preg_match('/build/i', $candidate) && count($parts) >= 2) {
                    $candidate = trim($parts[count($parts) - 2]);
                }
                if (!empty($candidate) && strlen($candidate) < 30 && !preg_match('/wv/i', $candidate)) {
                    $device = $candidate;
                }
            }
        }
    } elseif (preg_match('/iphone|ipad|ipod/i', $userAgent)) {
        $os = 'iOS';
        if (preg_match('/iphone/i', $userAgent)) {
            $device = 'iPhone';
        } elseif (preg_match('/ipad/i', $userAgent)) {
            $device = 'iPad';
        } else {
            $device = 'iOS Device';
        }
    } elseif (preg_match('/linux/i', $userAgent)) {
        $os = 'Linux';
    }

    // Detect Browser
    if (preg_match('/chrome/i', $userAgent)) {
        $browser = 'Chrome';
    } elseif (preg_match('/safari/i', $userAgent) && !preg_match('/chrome/i', $userAgent)) {
        $browser = 'Safari';
    } elseif (preg_match('/firefox/i', $userAgent)) {
        $browser = 'Firefox';
    } elseif (preg_match('/edge/i', $userAgent)) {
        $browser = 'Edge';
    } elseif (preg_match('/opera|opr/i', $userAgent)) {
        $browser = 'Opera';
    }
}

// Timestamp calculations matching Bangladesh Time (UTC+6)
$now = time();
$bdOffset = 6 * 60 * 60; // 6 hours
$bdTime = $now + $bdOffset;
$bdDateString = gmdate('Y-m-d', $bdTime);
$timestampISO = gmdate('Y-m-d\TH:i:s.000\Z', $now); // Standard ISO UTC

// Create New Entry
$newEntry = [
    "id" => "vis_" . substr(md5(uniqid(microtime(), true)), 0, 9),
    "ip" => $cleanIp,
    "city" => $city,
    "country" => $country,
    "countryCode" => $countryCode,
    "region" => $region,
    "org" => $org,
    "browser" => $browser,
    "os" => $os,
    "device" => $device,
    "userAgent" => $userAgent,
    "referer" => $referer,
    "path" => $path,
    "timestamp" => $timestampISO,
    "date" => $bdDateString,
    "isUnique" => $isUnique
];

// Read and Write to visitor_logs.json in same folder
$logFile = __DIR__ . '/visitor_logs.json';
$logs = [];

if (file_exists($logFile)) {
    $existingContent = file_get_contents($logFile);
    $decoded = json_decode($existingContent, true);
    if (is_array($decoded)) {
        // Absolutely filter out any pre-existing admin logs from the display and records
        $logs = array_filter($decoded, function($log) {
            $p = isset($log['path']) ? strtolower($log['path']) : '';
            $isFromAdmin = strpos($p, 'admin') !== false || strpos($p, 'turmarheda') !== false;
            return !$isFromAdmin;
        });
        $logs = array_values($logs);
    }
}

// Prepend new entry so newest is at the top
array_unshift($logs, $newEntry);

// Protect file size - limit to latest 5000 sessions
if (count($logs) > 5000) {
    $logs = array_slice($logs, 0, 5000);
}

// Write file back with locking
file_put_contents($logFile, json_encode($logs, JSON_PRETTY_PRINT), LOCK_EX);

// Return response
echo json_encode([
    "success" => true,
    "visitor" => $newEntry
]);
