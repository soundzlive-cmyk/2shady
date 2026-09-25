<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = strip_tags($_POST['name'] ?? '');
    $phone = strip_tags($_POST['phone'] ?? '');
    $service = strip_tags($_POST['service'] ?? '');
    $date = strip_tags($_POST['date'] ?? '');
    $details = strip_tags($_POST['details'] ?? '');
    $page = strip_tags($_POST['page'] ?? 'landing');

    $to = 'sales@2shadytinting.com, soundzlive@yahoo.com';
    $subject = "New Quote Request ($service) — 2 Shady Tinting";
    $body = "Source Page: $page\nName: $name\nPhone: $phone\nService: $service\nPreferred Date: $date\nDetails: $details\n";
    $headers = "From: no-reply@2shadytinting.com\r\nReply-To: $phone\r\n";

    if (mail($to, $subject, $body, $headers)) {
        echo "Thank you! We'll reach out shortly.";
    } else {
        http_response_code(500);
        echo "There was a problem sending your request. Please call 617-828-0887.";
    }
} else {
    http_response_code(405);
    echo "Method Not Allowed";
}
?>