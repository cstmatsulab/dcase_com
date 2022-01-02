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
        if( array_key_exists("dcaseID", $post) &&
            array_key_exists("message", $post) )
	    {
            // dcaseInfoを調べる
            $mongoConfig = new MongoConfig();
            $mongo = $mongoConfig->getMongo();
            $dcaseID = $post["dcaseID"];
            $message = $post["message"];
            if( checkMember($mongo, $dcaseID, $userInfo->userID) )
			{
                $line = [
                        'timeStamp' => intval(date("YmdHis")),
                        'userID' => $userInfo->userID,
                        'name' => $userInfo->lastName . " " . $userInfo->firstName,
                        'message' => $message,
                        'agree' => 0,
                    ];
                $query = new MongoDB\Driver\BulkWrite;
                $query->insert($line);
                $result = $mongo->executeBulkWrite( 'dcaseChat.' . $dcaseID , $query);
                $retMsg["result"] = 'OK';
                $retMsg["line"] = $line;
            }
        }
  	}
	echo( json_encode($retMsg) );
}
?>
