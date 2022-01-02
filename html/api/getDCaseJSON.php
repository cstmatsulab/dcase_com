<?PHP
header("Content-type: application/json; charset=UTF-8");
date_default_timezone_set('Asia/Tokyo');

require_once("./config.php");

main($_GET, $_POST);

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
		if( array_key_exists("dcaseID", $post) )
		{
			$dcaseID = $post["dcaseID"];

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
				$partsList[$document->id] = [
					"parentID" => "",
					"id" => $document->id,
					"kind" => $document->kind,
					"detail" => $document->detail,
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
				error_log( $partsID . ":" .print_r($partsList[$partsID],true) );
			}
			$root = [];
			foreach( $partsList as $partsID => $parts)
			{
				if( $parts["parentID"] == "" )
				{
					$root[] = $parts;
				}
			}

			$retMsg["result"] = 'OK';
			$retMsg["dcaseList"] = $root;
		}
  	}
	echo( json_encode($retMsg) );
}
?>
