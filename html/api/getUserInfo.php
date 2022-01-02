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
        setcookie("authID", $authID);
        
        $retMsg["cookie"] = $_COOKIE;
	}

	if( $userInfo != null )
	{
        if( array_key_exists("userID", $post) )
	    {
            $userID = $post["userID"];
            $dbName = "UserInfo";
            $colName = "UserList";
            $filter = ['userID'=> $userID];
            $options = [
                'projection' => [
					'_id' => 0,
					'passwd' => 0,
					'salt' => 0,
				],
				'sort' => ['lastNameRubi' => 1],
            ];

            $mongoConfig = new MongoConfig();
            $mongo = $mongoConfig->getMongo();
            
            $query = new MongoDB\Driver\Query( $filter, $options );
            $cursor = $mongo->executeQuery( $dbName . '.' . $colName , $query);
            
            $retMsg["userInfo"] = [];
            foreach ($cursor as $document)
            {
                $retMsg["userInfo"] = $document;
            }
            $retMsg["result"] = 'OK';
        }
  	}
	echo( json_encode($retMsg) );
}
?>
