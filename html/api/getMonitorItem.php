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
		$mongoConfig = new MongoConfig();
		$mongo = $mongoConfig->getMongo();
		if( array_key_exists("dcaseID", $post) &&
		    array_key_exists("monitorKey", $post) )
		{
			$dcaseID = $post["dcaseID"];
			$monitorKey = $post["monitorKey"];
			
			$filter = [ "monitorKey" => $monitorKey ];
			$options = [ 'projection' => ['_id' => 0], ];
			
			$query = new MongoDB\Driver\Query( $filter, $options );
			$cursor = $mongo->executeQuery( 'dcaseMonitor.' . $dcaseID , $query);
			$partsID = "";
			$data = "";
			foreach ($cursor as $document)
			{
				$partsID = $document->id;
				$data = $document->data;
			}
			
			if($partsID != "")
			{
				$parts = [
					'partsID' => $partsID,
					'data' => $data, 
				];
				
				$retMsg["result"] = 'OK';
				$retMsg["parts"] = $parts;
			}
		}else if( array_key_exists("dcaseID", $post) ){
			$dcaseID = $post["dcaseID"];
			$filter = [];
			$options = [ 'projection' => ['_id' => 0], ];
			
			$query = new MongoDB\Driver\Query( $filter, $options );
			$cursor = $mongo->executeQuery( 'dcaseMonitor.' . $dcaseID , $query);
			$partsID = "";
			$dataList = [];
			
			foreach ($cursor as $document)
			{
				$partsID = $document->id;
				$dataList[] = unserialize( serialize( $document ) );
			}
			
			$retMsg["result"] = 'OK';
			$retMsg["parts"] = $dataList;
		}
	}
	echo( json_encode($retMsg) );
}
?>
