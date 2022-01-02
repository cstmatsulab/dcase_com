<?PHP
header("Content-type: application/json; charset=UTF-8");
date_default_timezone_set('Asia/Tokyo');

require_once("./config.php");

main($_GET, $_POST);


function removeLink( $mongo, $dcaseID, $source, $target )
{
	$filter = [ "id" => $source ];
	$options = [
		'projection' => ['_id' => 0],
	];

	$query = new MongoDB\Driver\Query( $filter, $options );
	$cursor = $mongo->executeQuery( 'dcaseParts.' . $dcaseID , $query);
	
	$parts = [];
	foreach ($cursor as $document)
	{
		$parts = $document;
		$removeIndex = -1;
		$childNum = count( $parts->childrenID );
		for( $i = 0; $i < $childNum; $i++ )
		{
			if( $parts->childrenID[ $i ] == $target )
			{
				$removeIndex = $i;
			}
		}
		array_splice( $parts->childrenID, $removeIndex, 1);
	}

	$query = new MongoDB\Driver\BulkWrite;
	$query->update(
		['id'=> $source ],
		['$set' => $parts ],
		['multi' => true, 'upsert' => true]
	);
	
	$result = $mongo->executeBulkWrite( 'dcaseParts.' . $dcaseID , $query);

	$query = new MongoDB\Driver\BulkWrite;
	$query->update(
		['id'=> $target ],
		['$set' => [
				"parent" => "",
				"updateTime" => intval(date("YmdHis")),
			]
		],
		['multi' => true, 'upsert' => true]
	);
	$result = $mongo->executeBulkWrite( 'dcaseParts.' . $dcaseID , $query);
}

function main($get, $post)
{
	$retMsg = array(
		"result" => "NG"
	);
	$userInfo = null;
	if( array_key_exists("authID", $post) )
	{
		$authID = $post["authID"];
		$userInfo = auth( $authID );
	}

	if( $userInfo != null )
	{
        if( array_key_exists("dcaseID", $post) &&
            array_key_exists("partsID", $post) )
	    {
            // dcaseInfoを調べる
            $mongoConfig = new MongoConfig();
            $mongo = $mongoConfig->getMongo();
            $dcaseID = $post["dcaseID"];
			$partsID = $post["partsID"];
			if (0 === strpos($partsID, "Parts_")){}else{
				$partsID = "Parts_" . $partsID;
			}

			if( checkMember($mongo, $dcaseID, $userInfo->userID) )
			{
				$filter = [ "id" => $partsID ];
				$options = [
					'projection' => ['_id' => 0],
				];

				$query = new MongoDB\Driver\Query( $filter, $options );
				$cursor = $mongo->executeQuery( 'dcaseParts.' . $dcaseID , $query);

				$parts = [];
				foreach ($cursor as $document)
				{   
					$parts = json_decode(json_encode($document), true);
					//$parts = $document;
				}
				
				if($parts["parent"] != "")
				{
					$source = $parts["parent"];
					$target = $partsID;
					removeLink( $mongo, $dcaseID, $source, $target );	
				}
				
				foreach( $parts["childrenID"] as $childrenID )
				{
					$source = $partsID;
					$target = $childrenID;
					removeLink( $mongo, $dcaseID, $source, $target );
				}
				
				$query = new MongoDB\Driver\BulkWrite;
				$query->delete( ['id'=> $partsID ] );
				$result = $mongo->executeBulkWrite( 'dcaseParts.' . $dcaseID , $query);
				clearPosition($mongo, $dcaseID);
				if( $result->getDeletedCount() > 0)
				{
					$retMsg["result"] = 'OK';
				}
			}
        }
  	}
	echo( json_encode($retMsg) );
}
?>
