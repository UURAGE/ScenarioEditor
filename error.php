<?php
 // redirect to the error controller, with the status code as an argument
 $num = (string) $_SERVER['REDIRECT_STATUS'];
 // change this URL if the application is not in the web root
 header("Location: /index.php/error/index/" . $num);
?>
