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
        
        $filter = ['member.userID'=> $userInfo->userID];
        $options = [
            'projection' => [
                '_id' => 0, 
                'member' => 0,
                'public' => 0,
                'commitLog' => 0,
                'commitTime' => 0,
                'diffParts' => 0,
                'diffLink' => 0,
                'original' => 0,
            ],
        ];
        // RFZIppOkZHvwiRDE87PNmLJeawrtsGlXFZnTv_IQ5lU_
        $query = new MongoDB\Driver\Query( $filter, $options );
        $cursor = $mongo->executeQuery( 'dcaseInfo.dcaseList' , $query);

        $dcaseList = [];
        foreach ($cursor as $document)
        {
            $dcaseList[] = $document;
        }

        $retMsg["result"] = 'OK';
        $retMsg["dcaseList"] = $dcaseList;
    }
	echo( json_encode($retMsg) );
}
?>
