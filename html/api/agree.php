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
            $mongoConfig = new MongoConfig();
            $mongo = $mongoConfig->getMongo();
            $dcaseID = $post["dcaseID"];
            if( checkMember($mongo, $dcaseID, $userInfo->userID) )
			{
                $filter = ['dcaseID'=> $dcaseID ];
                $options = [
                    'projection' => ['_id' => 0],
                ];
                $query = new MongoDB\Driver\Query( $filter, $options );
                $cursor = $mongo->executeQuery( 'dcaseInfo.dcaseList' , $query);

                $dcaseInfo = [];
                foreach ($cursor as $document)
                {
                    $dcaseInfo = $document;
                }
                foreach( $dcaseInfo->member as $member )
                {
                    if( $member->userID == $userInfo->userID )
                    {
                        $member->position =  $agree;
                    }
                }

                $timeStmap = intval(date("YmdHis"));
                if( array_key_exists("commitLog", $dcaseInfo) == false )
                {
                    $dcaseInfo->commitLog = [];
                }
                $dcaseInfo->commitLog[] = $timeStmap;
                $dcaseInfo->updateDay = $timeStmap;
                $query = new MongoDB\Driver\BulkWrite;
                $query->update(
                    ['dcaseID'=> $dcaseID ],
                    ['$set' => $dcaseInfo ],
                    ['multi' => true, 'upsert' => true]
                );
                $result = $mongo->executeBulkWrite( 'dcaseInfo.dcaseList' , $query);
                
                $filter = [];
                $options = [
                    'projection' => ['_id' => 0],
                ];

                $query = new MongoDB\Driver\Query( $filter, $options );
                $cursor = $mongo->executeQuery( 'dcaseParts.' . $dcaseID , $query);
                $dcaseInfo->parts = [];
                foreach ($cursor as $document)
                {
                    $dcaseInfo->parts[] = $document;
                }
                
                $dcaseInfo->snapshotTime = $timeStmap;

                $query = new MongoDB\Driver\BulkWrite;
                $query->insert( $dcaseInfo );
                $result = $mongo->executeBulkWrite( 'dcaseHistory.' . $dcaseID , $query);
                $msg = $userInfo->lastName . " " . $userInfo->firstName . "　さんが";
                if($agree > 0)
                {
                    $msg .= "同意しました";
                }else{
                    $msg .= "拒否しました";
                }
                $line = [
                    'timeStamp' => $timeStmap,
                    'userID' => $userInfo->userID,
                    'name' => $userInfo->lastName . " " . $userInfo->firstName,
                    'message' => $msg,
                    'agree' => $agree,
                ];

                $query = new MongoDB\Driver\BulkWrite;
                $query->insert($line);
                $result = $mongo->executeBulkWrite( 'dcaseChat.' . $dcaseID , $query);
                $retMsg["result"] = 'OK';
                $retMsg["line"] = $line;
                $retMsg["dcaseInfo"] = $dcaseInfo;
            }
        }
  	}
	echo( json_encode($retMsg) );
}
?>
