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
            if( array_key_exists("member", $post) )
            {
                $member = json_decode( $post["member"] );
            }else{
                $member = [ $userInfo->userID, ];
            }
			if( checkMember($mongo, $dcaseID, $userInfo->userID) )
			{
				$newMemberList = [];

				$filter = [ "dcaseID" => $dcaseID ];
				$options = [];
                $query = new MongoDB\Driver\Query( $filter, $options );
				$cursor = $mongo->executeQuery( 'dcaseInfo.dcaseList' , $query);

				foreach ($cursor as $document)
				{
					foreach( $document->member as $currentMember )
					{
                        $exist = false;
                        foreach( $member as $delUser )
                        {
                            if( $currentMember->userID == $delUser )
                            {
                                $exist = true;
                            }
                        }
                        if( $exist == false )
                        {
    						$newMemberList[] = $currentMember;
                        }
					}
				}
				
                if( count($newMemberList) > 0 )
                {
                    $dcaseInfo = [];
                    $dcaseInfo["member"] = $newMemberList;
                    $query = new MongoDB\Driver\BulkWrite;
                    $query->update(
                        ['dcaseID'=> $dcaseID ],
                        ['$set' => $dcaseInfo ],
                        ['multi' => true, 'upsert' => true]
                    );
                    $result = $mongo->executeBulkWrite( 'dcaseInfo.dcaseList' , $query);
                    if( $result->getUpsertedCount() == 1 || 
                        $result->getModifiedCount()==1 || 
                        $result->getMatchedCount() > 0 ||
                        $result->getDeletedCount() > 0)
                    {
                        $retMsg["result"] = 'OK';
                    }
                }else{
                    $retMsg["result"] = 'OK';
                    
                    $query = new MongoDB\Driver\BulkWrite;
                    $query->delete(['dcaseID'=> $dcaseID ]);
                    $result = $mongo->executeBulkWrite( 'dcaseInfo.dcaseList' , $query);
                    
                    try {
                        $mongo->executeCommand('dcaseParts', new \MongoDB\Driver\Command(["drop" => $dcaseID]));
                    } catch(Exception $e) {
                    }
                    try {
                        $mongo->executeCommand('dcasePartsHistory', new \MongoDB\Driver\Command(["drop" => $dcaseID]));
                    } catch(Exception $e) {
                    }  
                    try {
                        $mongo->executeCommand('dcaseHistory', new \MongoDB\Driver\Command(["drop" => $dcaseID]));
                    } catch(Exception $e) {
                    }
                    try {
                        $mongo->executeCommand('dcaseChat', new \MongoDB\Driver\Command(["drop" => $dcaseID]));
                    } catch(Exception $e) {
                    }
                }
			}
        }
  	}
	echo( json_encode($retMsg) );
}
?>
