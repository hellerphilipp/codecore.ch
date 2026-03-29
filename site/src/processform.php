<?php
// Abort if not POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit;
}

// Honeypot check — bots fill this hidden field
if (!empty($_POST['website'])) {
    http_response_code(200);
    echo '<div class="alert alert-success">Vielen Dank für Ihre Nachricht!</div>';
    exit;
}

// Collect and sanitize inputs
$vorname     = trim(strip_tags($_POST['vorname'] ?? ''));
$nachname    = trim(strip_tags($_POST['nachname'] ?? ''));
$email       = trim(strip_tags($_POST['email'] ?? ''));
$unternehmen = trim(strip_tags($_POST['unternehmen'] ?? ''));
$nachricht   = trim(strip_tags($_POST['nachricht'] ?? ''));
$datenschutz = isset($_POST['datenschutz']);

// Validate required fields
if ($vorname === '' || $nachname === '' || $email === '' || $nachricht === '' || !$datenschutz) {
    http_response_code(422);
    echo '<div class="alert alert-danger">Bitte füllen Sie alle Pflichtfelder aus und akzeptieren Sie die Datenschutzerklärung.</div>';
    exit;
}

// Validate email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo '<div class="alert alert-danger">Bitte geben Sie eine gültige E-Mail-Adresse ein.</div>';
    exit;
}

// Build email
$to = 'info@codecore.ch';
$subject = '=?UTF-8?B?' . base64_encode('Kontaktformular: Neue Nachricht') . '?=';

$body  = "Vorname: " . $vorname . "\n";
$body .= "Nachname: " . $nachname . "\n";
$body .= "E-Mail: " . $email . "\n";
if ($unternehmen !== '') {
    $body .= "Unternehmen: " . $unternehmen . "\n";
}
$body .= "\nNachricht:\n" . $nachricht . "\n";

$headers  = "From: contactform-noreply@codecraft.ch\r\n";
$headers .= "Reply-To: " . $email . "\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

// Send
$success = mail($to, $subject, $body, $headers);

if ($success) {
    echo '<div class="alert alert-success">';
    echo '<strong>Vielen Dank!</strong> Ihre Nachricht wurde erfolgreich gesendet. Wir melden uns in Kürze bei Ihnen.';
    echo '</div>';
} else {
    http_response_code(500);
    echo '<div class="alert alert-danger">';
    echo 'Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut oder schreiben Sie uns direkt an <a href="mailto:info@codecore.ch">info@codecore.ch</a>.';
    echo '</div>';
}
