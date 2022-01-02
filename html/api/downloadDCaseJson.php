<?PHP
header("Content-type: application/json; charset=UTF-8");
date_default_timezone_set('Asia/Tokyo');

require_once("./config.php");

main($_GET, $_POST);

function main($get, $post)
{
	// /var/www/html/dcase/api
	$path = getcwd() . "/../dump/";
	$zipPath = getcwd() . "/../dump.zip";
	
	$mongoConfig = new MongoConfig();
	$mongo = $mongoConfig->getMongo();
	
	$filter = [];
	$options = [
		'projection' => ['_id' => 0, 'public' => 0],
	];
	$query = new MongoDB\Driver\Query( $filter, $options );
	$cursor = $mongo->executeQuery( 'dcaseInfo.dcaseList' , $query);
	
	$zip = new ZipArchive();
	if( $zip->open($zipPath , ZipArchive::CREATE | ZipArchive::OVERWRITE) )
	{
		foreach ($cursor as $document)
		{
			$dcaseID = $document->dcaseID;
			$root = saveDCase($dcaseID);
			$obj = get_object_vars( $document );
			$obj["root"] = $root;
			$jsonStr = json_encode($obj, JSON_UNESCAPED_UNICODE);
			
			$filePath = $path . $dcaseID . ".json";
			// error_log($filePath);
			file_put_contents( $filePath, $jsonStr );
			$zip->addFile($filePath, $dcaseID . ".json");
		}
		$zip->close();
	}
	$protocol = empty($_SERVER['HTTPS']) ? 'http://' : 'https://';
	$basePATH = str_replace( 'api', '', pathinfo($_SERVER['REQUEST_URI'])["dirname"] );
	$url = $protocol . $_SERVER['HTTP_HOST'] . $basePATH;

	print('<a href="' . $url . 'dump.zip">Download URL</a>');
}

function saveDCase($dcaseID)
{
	$mongoConfig = new MongoConfig();
	$mongo = $mongoConfig->getMongo();		
	
	$filter = [];
	$options = [
		'projection' => ['_id' => 0],
	];

	$query = new MongoDB\Driver\Query( $filter, $options );
	$cursor = $mongo->executeQuery( 'dcaseParts.' . $dcaseID , $query);

	$dbDataList = [];
	$partsList = [];
	
	foreach ($cursor as $document)
	{
		$dbDataList[$document->id] = $document;
		$detail = "";
		if( property_exists($document, "detail") )
		{
			$detail = $document->detail;
		}
		$kind = "error";
		if( property_exists($document, "kind") )
		{
			$kind = $document->kind;
		}
		$partsList[$document->id] = [
			"parentID" => "",
			"id" => $document->id,
			"kind" => $kind,
			"detail" => $detail,
			"childlen" => [],
		];
	}
	foreach( $dbDataList as $partsID => $doc)
	{
		if( property_exists($doc, "childrenID"))
		{
			foreach( $doc->childrenID as $childrenID )
			{
				$partsList[$partsID]["childlen"][] = &$partsList[$childrenID];
				$partsList[$childrenID]["parentID"] = $partsID;
			}
		}
		// error_log( $partsID . ":" .print_r($partsList[$partsID],true) );
	}
	$root = [];
	foreach( $partsList as $partsID => $parts)
	{
		if( $parts["parentID"] == "" )
		{
			$root[] = $parts;
		}
	}
	return( $root );
}
?>
