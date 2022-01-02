<?PHP
header("Content-Type: application/json; charset=utf-8");
//header("Content-Type: application/json; charset=utf-8");
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
		
		$retMsg["test"] =$userInfo;
	}
	if( $userInfo != null )
	{
		if( array_key_exists("keyword", $post) )
		{
		$retMsg["result"] = "NG1";
			$dbName = "UserInfo";
			$colName = "UserList";
		
			$mongoConfig = new MongoConfig();
			$mongo = $mongoConfig->getMongo();
			$keyword = $post["keyword"];
			$keywords = mb_split("　|\s",$keyword);
			$filter = ['keyword' =>['$in' => $keywords]];
			$options = [
				'projection' => [
					'_id' => 0,
					'passwd' => 0,
					'salt' => 0,
				],
				'sort' => ['lastNameRubi' => 1],
				'limit' => 10,
			];
			$query = new MongoDB\Driver\Query( $filter, $options );
			$cursor = $mongo->executeQuery( $dbName . '.' . $colName , $query);
			$retMsg["data"] = [];
			foreach ($cursor as $document) {
				if( $document->userID != $userInfo->userID )
				{
					$retMsg["data"][] = $document;
				}
			}
			$retMsg["result"] = "OK";
		}
	}
	$json = json_encode($retMsg);
	printf("%s", $json);
}
?>