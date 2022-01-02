<?PHP
header('Content-type: application/json; charset=utf-8');
//header("Content-Type: application/json; charset=utf-8");
date_default_timezone_set('Asia/Tokyo');

require_once("./config.php");

main($_GET, $_POST);

function main($get, $post)
{
	$retMsg = array(
		"result" => "NG"
	);
	
	
	if( array_key_exists("mail", $post) &&
		array_key_exists("passwd", $post) )
	{
		$dbName = "UserInfo";
		
		$mongoConfig = new MongoConfig();
		$mongo = $mongoConfig->getMongo();
		$mail = $post["mail"];
		$passwd = $post["passwd"];
		
		srand( rand(0,10000000) );
		$filter = [ 'mail'=> $mail ];
		$options = [
			'projection' => ['_id' => 0],
			'sort' => ['_id' => -1],
		];
		$query = new MongoDB\Driver\Query( $filter, $options );
		$cursor = $mongo->executeQuery( $dbName . '.UserList' , $query);
		
		$userInfo = [];
		foreach ($cursor as $document)
		{
			$userInfo = $document;
			break;
		}
		
		$salt = $userInfo->salt;
		$hashData = hash("sha256", $passwd.$salt, TRUE);
		$passwdHash = base64_encode($hashData);
		srand( rand(0,10000000) );
		if( $userInfo->passwd == $passwdHash )
		{
			for($loopNum = 0; $loopNum < 100; $loopNum++)
			{
				$authID = base64_encode(hash("sha256", $mail . $passwdHash . rand( 0,10000000 ), TRUE));
				$authID = preg_replace("/[\/+=]/","_",$authID);
				$filter = ['authID'=> $authID];
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
							'userID' => $userInfo->userID,
							'mail' => $userInfo->mail,
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
					$retMsg["result"] = 'OK';
					$retMsg["authID"] = $authID;
				}
			}
		}
	}	
	$json = json_encode($retMsg);
	printf("%s", $json);
}
?>