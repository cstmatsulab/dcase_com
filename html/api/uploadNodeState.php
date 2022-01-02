<?PHP

require "./websocket_client.php";

header("Content-type: application/json; charset=UTF-8");
date_default_timezone_set('Asia/Tokyo');

require_once("./config.php");
require_once("./util.php");

main($_GET, $_POST);

function nodeHidden($mongo, $dcaseID, $partsID, $state)
{
	$query = new MongoDB\Driver\BulkWrite;
	$query->update(
		['id' => $partsID, ],
		['$set' =>
			[
				"apiHidden" => $state,
			],
		],
		['multi' => true, 'upsert' => true]
	);
	$result = $mongo->executeBulkWrite( 'dcaseParts.' . $dcaseID , $query);

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
		array_key_exists("kind", $post) &&
		array_key_exists("state", $post) &&
		array_key_exists("detail", $post) )
	{
		$mongoConfig = new MongoConfig();
		$mongo = $mongoConfig->getMongo();
		$dcaseID = $post["dcaseID"];
		$partsID = $post["partsID"];
		$kind = $post["kind"];
		$state = $post["state"];
		if($state=="True")
		{
			$state = True;
		}else{
			$state = False;
		}

		$detail = $post["detail"];

		
		$filter = [ "id" => $partsID ];
		$options = [ 'projection' => ['_id' => 0], ];
		
        $query = new MongoDB\Driver\Query( $filter, $options );
		$cursor = $mongo->executeQuery( 'dcaseParts.' . $dcaseID , $query);

		$parts = [];
		$newPartsID = "";
		$parentID = "";
		$existParts = False;
		foreach ($cursor as $document)
		{
			//ここから　2020 11 19
			$newPartsID = $document->apiPartsID;
			$parentID = $document->parent;
			
			$parts = [
				"parent" => $parentID,
				"kind" => $kind,
				"id" => $newPartsID,
				"detail" => $detail,
				"children" => [],
				"x" => $document->x,
				"y" => $document->y,
				"offsetX" => 0, //
				"offsetY" => 0, //
				"width" => $document->width,
				"height" => $document->height,
				
				"label" => "",
				"addonInfo" => [],
				"tableInfo" => "",
	
				"penndingFlag" => false,
				"apiFlag" => true,
				"apiHidden" => !$state,
				"apiPartsID" => "",
				"original" => $partsID,
				"hidden" => false, 
			];
			break;
		}
		if( $newPartsID == "" )
		{
			for($i=0; $i<10; $i++)
			{
				$newPartsID = "Parts_" . randomPasswd($length = 8);
	
				$filter = [ "id" => $newPartsID ];
				$options = [ 'projection' => ['_id' => 0], ];
				
				$on = true;
				$query = new MongoDB\Driver\Query( $filter, $options );
				$cursor = $mongo->executeQuery( 'dcaseParts.' . $dcaseID , $query);
				foreach ($cursor as $document)
				{
					$on = false;
				}
	
				if($on)
				{
					$parts["id"] = $newPartsID;
					break;
				}
			}
		}
		
		if($newPartsID == "")
		{
			$retMsg["result"] = 'NG';
			$retMsg['partsID'] = "";
			$retMsg['reason'] = "partsID not exist";
			echo( json_encode($retMsg) );
			return;
		}
		## 元のパーツにAPIで作ったパーツのIDをメモ
		$query = new MongoDB\Driver\BulkWrite;
        $query->update(
            ['id' => $partsID, ],
			['$set' =>
				[
					"apiPartsID" => $newPartsID,
				],
			],
            ['multi' => true, 'upsert' => true]
		);
		$result = $mongo->executeBulkWrite( 'dcaseParts.' . $dcaseID , $query);
		
		$filter = [ "id" => $parentID ];
		$options = [ 'projection' => ['_id' => 0], ];
		
		$query = new MongoDB\Driver\Query( $filter, $options );
		$cursor = $mongo->executeQuery( 'dcaseParts.' . $dcaseID , $query);
		
		if($state)
		{
			$newChildrenID = [ $newPartsID, ];
		}else{
			$newChildrenID = [  ];
		}
		foreach ($cursor as $document)
		{
			$childrenID = $document->childrenID;
			foreach ($childrenID as $childID)
			{
				if($childID != $newPartsID)
				{
					$newChildrenID[] = $childID;
				}
			}
		}
		$query = new MongoDB\Driver\BulkWrite;
		$query->update(
			['id' => $parentID, ],
			['$set' =>
				[
					"childrenID" => $newChildrenID,
				],
			],
			['multi' => true, 'upsert' => true]
		);
		$result = $mongo->executeBulkWrite( 'dcaseParts.' . $dcaseID , $query);
		
		// api partsの保存
		$query = new MongoDB\Driver\BulkWrite;
		$query->update(
			['id' => $newPartsID, ],
			['$set' => $parts, ],
			['multi' => true, 'upsert' => true]
		);
		
		$result = $mongo->executeBulkWrite( 'dcaseParts.' . $dcaseID , $query);
		if( $result->getUpsertedCount() == 1 || 
			$result->getModifiedCount()==1 || 
			$result->getMatchedCount() > 0)
		{
			//$retMsg["result"] = 'OK';
			$retMsg['partsID'] = $parts["id"];
		}
		
		nodeHidden($mongo, $dcaseID, $partsID, $state);

		if( $sp = websocket_open("127.0.0.1", 3000,'',$errstr, 10, false) )
        {
            $jsonData = json_encode( [
                "mode" => "connected",  
                'dcaseID' => $dcaseID,
            ]);
			websocket_write($sp, $jsonData);
			
            $jsonData = json_encode([
                "mode" => "createNode", 
                "dcaseID" => $dcaseID,
				"node" => $parts,
            ]);
			websocket_write($sp, $jsonData);
			

			if($state)
			{
				$jsonData = json_encode([
					"mode" => "linkPath", 
					"dcaseID" => $dcaseID,
					"source" => $parentID,
					"target" => $newPartsID,
				]);
				websocket_write($sp, $jsonData);
			}else{
				$jsonData = json_encode([
					"mode" => "unlinkPath", 
					"dcaseID" => $dcaseID,
					"source" => $parentID,
					"target" => $newPartsID,
				]);
				websocket_write($sp, $jsonData);
			}
			$jsonData = json_encode([
				"mode" => "nodeState", 
				'dcaseID' => $dcaseID,
				'id' => $partsID,
				'apiHidden' => $state,
			]);
			websocket_write($sp, $jsonData);
			
            websocket_close($sp);
        }
		// $retMsg["cmd"] = $cmd;
		// $retMsg["output"] = $output;
		/*
		$options = [
			0 => ["pipe", "r"],
			1 => ["pipe", "w"],
		];
		$process = proc_open(
						"/usr/local/bin/node /var/www/html/dcase/sioTest.js", 
						$options,
						$pipe);
		if(!is_resource($process))
		{
			return;
		}
		$jsonStr = json_encode( [
			"func" => "createNode", 
			"data" => [
				"dcaseID" => $dcaseID,
				"node" => $parts,
			],
		]);
		fwrite($pipe[0], $jsonStr."\n" );
		
		//$retMsg = fread($pipe[1], 1024);
		if($state)
		{
			$jsonStr = json_encode( [
				"func" => "linkPath", 
				"data" => [
					"dcaseID" => $dcaseID,
					"source" => $parentID,
					"target" => $newPartsID,
				],
			]);
			fwrite($pipe[0], $jsonStr."\n" );
		}else{
			$jsonStr = json_encode( [
				"func" => "unlinkPath", 
				"data" => [
					"dcaseID" => $dcaseID,
					"source" => $parentID,
					"target" => $newPartsID,
				],
			]);
			fwrite($pipe[0], $jsonStr."\n" );
		}
		$retMsg = fread($pipe[1], 1024);
		$jsonStr = json_encode( [
			"func" => "nodeState", 
			"data" => [
				'dcaseID' => $dcaseID,
				'id' => $partsID,
				'apiHidden' => $state,
			],
		]);
		fwrite($pipe[0], $jsonStr."\n" );
		
		$retMsg = fread($pipe[1], 1024);
		
		$jsonStr = json_encode( [
			"func" => "exit", 
			"data" => [],
		]);
		fwrite($pipe[0], $jsonStr."\n" );
		// $retMsg = stream_get_contents($pipe[1]);
				
		fclose($pipe[1]);
		fclose($pipe[0]);
		proc_close($process);
		*/
		/*
		$websocket = new Client(new Version1X('http://localhost:8080'));
		// $websocket = new Client(new Version1X('http://localhost/dcase/socket.io/', []));
		$websocket->initialize();
		echo( json_encode($retMsg) );
			return;
			
		$websocket->of('/editor');

		$websocket->emit("createNode",
		[
			"dcaseID" => $dcaseID,
			"node" => $parts,
		]);

		if($state)
		{
			$websocket->emit("linkPath",
			[
				"dcaseID" => $dcaseID,
				"source" => $parentID,
				"target" => $newPartsID,
			]);
		}else{
			$websocket->emit("unlinkPath",
			[
				"dcaseID" => $dcaseID,
				"source" => $parentID,
				"target" => $newPartsID,
			]);
		}
		$retMsg["result1"] = $websocket->emit("nodeState", [
			'dcaseID' => $dcaseID,
			'id' => $partsID,
			'apiHidden' => $state,
		]);
		*/

		$retMsg["result"] = 'OK';
		$retMsg["newPartsID"] = $newPartsID;
	}
	echo( json_encode($retMsg) );
}
?>
