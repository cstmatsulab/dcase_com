<?PHP

require "./websocket_client.php";

header("Content-type: application/json; charset=UTF-8");
date_default_timezone_set('Asia/Tokyo');

require_once("./config.php");
require_once("./util.php");

main($_GET, $_POST);

function nodeHidden($mongo, $dcaseID, $partsID, $state)
{
	$filter = [ "id" => $partsID ];
	$options = [ 'projection' => ['_id' => 0], ];
	
	$query = new MongoDB\Driver\Query( $filter, $options );
	$cursor = $mongo->executeQuery( 'dcaseParts.' . $dcaseID , $query);

	$children = [];
	foreach ($cursor as $document)
	{
		foreach( $document->childrenID as $childID )
		{
			$children[] = $childID;
		}
	}
	error_log( print_r($children, true) );
	$query = new MongoDB\Driver\BulkWrite;
	$query->update(
		['id' => $partsID, ],
		['$set' =>
			[
				"apiFlag" => $state,
			],
		],
		['multi' => true, 'upsert' => true]
	);
	$result = $mongo->executeBulkWrite( 'dcaseParts.' . $dcaseID , $query);

	foreach ($children as $childID)
	{
		nodeHidden($mongo, $dcaseID, $childID, $state);
	}
}

function main($get, $post)
{
	$retMsg = array(
		"result" => "NG"
	);
	if( array_key_exists("dcaseID", $post) &&
		array_key_exists("partsID", $post) &&
		array_key_exists("color", $post) &&
		array_key_exists("thick", $post) )
	{
		$mongoConfig = new MongoConfig();
		$mongo = $mongoConfig->getMongo();
		$dcaseID = $post["dcaseID"];
		$partsID = $post["partsID"];
		$color = $post["color"];
		$thick = intval($post["thick"]);
		/*
		$filter = [ "id" => $partsID ];
		$options = [ 'projection' => ['_id' => 0], ];
		
        $query = new MongoDB\Driver\Query( $filter, $options );
		$cursor = $mongo->executeQuery( 'dcaseParts.' . $dcaseID , $query);

		$parts = [];
		foreach ($cursor as $document)
		{
            $parts = json_decode(json_encode($document));
			break;
		}
		*/
		$style =  [
			"border_color" => $color,
			"border_thick" => $thick,
		];
		$query = new MongoDB\Driver\BulkWrite;
        $query->update(
            ['id' => $partsID, ],
			['$set' =>
				[
					"style" => $style,
				],
			],
            ['multi' => true, 'upsert' => true]
        );
        $result = $mongo->executeBulkWrite( 'dcaseParts.' . $dcaseID , $query);
		if( $result->getUpsertedCount() == 1 || 
		$result->getModifiedCount()==1 || 
		$result->getMatchedCount() > 0)
		{
			if( $sp = websocket_open("127.0.0.1", 3000,'',$errstr, 10, false) )
        	{
				$jsonData = json_encode( [
					"mode" => "connected",  
					'dcaseID' => $dcaseID,
				]);
				websocket_write($sp, $jsonData);
				
				$jsonData = json_encode([
					"mode" => "nodeStyle", 
					'dcaseID' => $dcaseID,
					'partsID' => $partsID,
					'style' => $style,
				]);
				websocket_write($sp, $jsonData);
				
				websocket_close($sp);
			}
            
			$retMsg["result"] = "OK";
			$retMsg["jsonData"] = $jsonData;
		}
	}
	echo( json_encode($retMsg) );
}
?>
