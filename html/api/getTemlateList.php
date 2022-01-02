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
        
        if( array_key_exists("all", $post) )
        {
            $filter = [];
        }else{
            $filter = ['userID'=> $userInfo->userID];
        }
        $retMsg["filter"] = $filter;
        $options = [
            'projection' => [
                '_id' => 0,
            ],
        ];
        $query = new MongoDB\Driver\Query( $filter, $options );
        $cursor = $mongo->executeQuery( 'dcaseInfo.dcaseTemplate' , $query);

        $dcaseList = [];
        foreach ($cursor as $document)
        {
            $dcaseList[] = $document;
        }

        $retMsg["result"] = 'OK';
        $retMsg["templateList"] = $dcaseList;
    }
	echo( json_encode($retMsg) );
}
?>
