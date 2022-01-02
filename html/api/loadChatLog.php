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
            // dcaseInfoを調べる
            $mongoConfig = new MongoConfig();
            $mongo = $mongoConfig->getMongo();
            $dcaseID = $post["dcaseID"];
            $filter = [];
            $options = [
                'projection' => ['_id' => 0],
                'sort' => ['timeStamp' => -1],
            ];

            $query = new MongoDB\Driver\Query( $filter, $options );
            $cursor = $mongo->executeQuery( 'dcaseChat.' . $dcaseID , $query);

            $chatLog = [];
            foreach ($cursor as $document)
            {
                $chatLog[] = $document;
            }
            $retMsg["result"] = 'OK';
            $retMsg["chatLog"] = $chatLog;
        }
  	}
	echo( json_encode($retMsg) );
}
?>
