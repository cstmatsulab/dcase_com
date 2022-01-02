<?PHP
$protocol = empty($_SERVER['HTTPS']) ? 'http://' : 'https://';
$url = $_SERVER['REQUEST_URI'] . "login.html";
header('Location: ' . $url);
exit;
?>
