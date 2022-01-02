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
            array_key_exists("snapshotTime", $post) )
		{
			$dcaseID = $post["dcaseID"];
			$snapshotTime = intval($post["snapshotTime"]);

			$mongoConfig = new MongoConfig();
			$mongo = $mongoConfig->getMongo();		
			
			$filter = [
                "dcaseID" => $dcaseID,
                "snapshotTime" => $snapshotTime,
            ];
			$options = [
				'projection' => ['_id' => 0],
			];

			$query = new MongoDB\Driver\Query( $filter, $options );
			$cursor = $mongo->executeQuery( 'dcaseHistory.' . $dcaseID , $query);

			foreach( $cursor as $document )
			{
                $retMsg["result"] = 'OK';
    			$retMsg["dcase"] = $document;
			}
		}
  	}
	echo( json_encode($retMsg) );
}
?>
