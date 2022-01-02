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
	
	if( array_key_exists("authID", $post) )
	{
		$authID = $post["authID"];

        setcookie("authID", $authID);
        // $retMsg["cookie"] = $_COOKIE;
		
		$userInfo = auth( $authID );
		if( $userInfo != null )
		{
			$retMsg["result"] = "OK";
			$retMsg["userInfo"] = $userInfo;
		}else{
			$mongoConfig = new MongoConfig();
			$mongo = $mongoConfig->getMongo();
			$dbName = "UserInfo";
			for($loopNum = 0; $loopNum < 100; $loopNum++)
			{
				$authID = base64_encode(
							hash("sha256", 
								rand( 0,10000000 ) . rand( 0,10000000 ). rand( 0,10000000 ). rand( 0,10000000 ). rand( 0,10000000 ). rand( 0,10000000 ),
								TRUE)
						);
				$authID = preg_replace("/[\/+=]/","_",$authID);
				$filter = [ 'authID'=> $authID ];
				$options = [
					'projection' => ['_id' => 0],
					'sort' => ['_id' => -1],
				];
				$query = new MongoDB\Driver\Query( $filter, $options );
				$cursor = $mongo->executeQuery( $dbName . '.Auth' , $query);
				
				$exist = false;
				foreach ($cursor as $document) {
					$exist = true;
				}
				if( $exist == false )
				{
					break;
				}
			}
			if($loopNum < 100)
			{
				$limit = intval( date("YmdHis",strtotime("+6 hour")) );
				$item = [
							'userID' => "temp_" . $authID,
							'mail' => "tempID_" . $authID,
							'authID' => $authID,
							'timeout' => $limit,
						];
				$query = new MongoDB\Driver\BulkWrite;
				$query->update(
					['authID'=> $authID],
					['$set' => $item],
					['multi' => true, 'upsert' => true]
				);
				$result = $mongo->executeBulkWrite( $dbName . '.Auth' , $query);
				
				if( $result->getUpsertedCount() == 1 || $result->getModifiedCount()==1 || $result->getMatchedCount() > 0)
				{
					$retMsg["userInfo"]["tempID"] = $authID;
				}
			}
		}
	}
	echo( json_encode( $retMsg ) );
}
?>
