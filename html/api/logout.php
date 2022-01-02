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
		
		$userInfo = auth( $authID );
		if( $userInfo != null )
		{
            $mongoConfig = new MongoConfig();
    		$mongo = $mongoConfig->getMongo();
            $query = new MongoDB\Driver\BulkWrite;
            $query->delete(
                ['authID' => $authID ],
                ['limit' => 0]
            );
            $result = $mongo->executeBulkWrite( 'UserInfo.Auth' , $query);
			$retMsg["result"] = "OK";
		}
	}
	echo( json_encode( $retMsg ) );
}
?>
