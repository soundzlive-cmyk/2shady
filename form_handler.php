<?php
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

header('Content-Type: application/json');

// Sanitize inputs
$name    = strip_tags(trim($_POST['name']    ?? ''));
$email   = strip_tags(trim($_POST['email']   ?? ''));
$phone   = strip_tags(trim($_POST['phone']   ?? ''));
$service = strip_tags(trim($_POST['service'] ?? ''));
$vehicle = strip_tags(trim($_POST['vehicle'] ?? ''));
$date    = strip_tags(trim($_POST['date']    ?? ''));
$time    = strip_tags(trim($_POST['time']    ?? ''));
$notes   = strip_tags(trim($_POST['notes']   ?? ''));

// Basic validation
if (!$name || !$phone || !$service) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Please fill in all required fields.']);
    exit;
}

$to      = 'soundzlive@yahoo.com';
$subject = "New Appointment Request — $service | 2 Shady Tinting";

$body  = "NEW APPOINTMENT REQUEST — 2 Shady Tinting\n";
$body .= str_repeat("=", 45) . "\n\n";
$body .= "Name:             $name\n";
$body .= "Phone:            $phone\n";
$body .= "Email:            $email\n";
$body .= "Service:          $service\n";
$body .= "Vehicle:          $vehicle\n";
$body .= "Preferred Date:   $date\n";
$body .= "Preferred Time:   $time\n";
$body .= "Notes:            $notes\n\n";
$body .= str_repeat("=", 45) . "\n";
$body .= "Sent from 2shadytinting.com appointment form\n";

$headers  = "From: no-reply@2shadytinting.com\r\n";
$headers .= "Reply-To: $email\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

if (mail($to, $subject, $body, $headers)) {
    echo json_encode(['success' => true, 'message' => "Thanks, $name! We'll be in touch shortly to confirm your appointment."]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'There was a problem sending your request. Please call us directly at (617) 828-0887.']);
}
?>
