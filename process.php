<?php  
	header("Content-Type: application/json");
	$url = $_POST['url'];
	$json = file_get_contents($url);
	echo $json;
?>		