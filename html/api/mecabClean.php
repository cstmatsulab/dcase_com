<?php

require_once("./config.php");
$mongoConfig = new MongoConfig();
$mongo = $mongoConfig->getMongo();
$query = new MongoDB\Driver\BulkWrite;
$query->delete(
    ['word' => "" ],
    ['limit' => 0]
);
$result = $mongo->executeBulkWrite( 'dcaseSearchIndex.Parts' , $query);
?>