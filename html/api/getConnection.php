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
        $dbName = "dcaseInfo";
        $colName = "dcaseList";
        $filter = ['member.userID'=> $userInfo->userID];
        
        if( array_key_exists("dcaseID", $post) )
        {
        	$dcaseID = $post["dcaseID"];
            $filter = ['$and' => [
            				['dcaseID'=> $dcaseID],
            				['member.userID'=> $userInfo->userID],
            			],
            		  ];
	    }
	    
        $options = [
            'projection' => ['_id' => 0],
            'sort' => ['_id' => -1],
        ];

        $mongoConfig = new MongoConfig();
		$mongo = $mongoConfig->getMongo();
		
        $query = new MongoDB\Driver\Query( $filter, $options );
        $cursor = $mongo->executeQuery( $dbName . '.' . $colName , $query);

        $dcaseList = [];
        foreach ($cursor as $document)
        {
            $dcaseInfo = $document;
            $dcaseInfo->vote = [0,0,0];
            foreach( $dcaseInfo->member as $member )
            {
                if( $member->position > 0)
                {
                    $dcaseInfo->vote[0]++;
                }else if( $member->position == 0){
                    $dcaseInfo->vote[1]++;
                }else{
                    $dcaseInfo->vote[2]++;    
                }
            }
            $dcaseList[] = $dcaseInfo;
        }
        $retMsg["result"] = 'OK';
        $retMsg["dcaseList"] = $dcaseList;
  	}
	echo( json_encode($retMsg) );
}
?>
