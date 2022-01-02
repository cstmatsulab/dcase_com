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
            $dcaseList[] = $document->dcaseID;
        }
        foreach ($dcaseList as $dcaseID)
        {
            deleteDCase($mongo, $dcaseID, $userInfo->userID);
        }
        
        $query = new MongoDB\Driver\BulkWrite;
        $query->delete(['userID'=> $userInfo->userID ]);
        $result = $mongo->executeBulkWrite( 'UserInfo.UserList' , $query);
        $query = new MongoDB\Driver\BulkWrite;
        $query->delete(['authID'=> $authID ]);
        $result = $mongo->executeBulkWrite( 'UserInfo.Auth' , $query);
        
        $retMsg["result"] = 'OK';
        $retMsg["dcaseList"] = $dcaseList;
        $retMsg["userID"] = $userInfo->userID;
    }
	echo( json_encode($retMsg) );
        /*
        foreach ($dcaseList as $document)
        {
            $dcaseList[] = $document;
        }*/
    // $delUser = $userInfo->userID;
}

function deleteDCase($mongo, $dcaseID, $delUser)
{
    if( checkMember($mongo, $dcaseID, $delUser) )
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
                if( $currentMember->userID == $delUser )
                {
                    $exist = true;
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
                return("OK");
            }
        }else{
            $query = new MongoDB\Driver\BulkWrite;
            $query->delete(['dcaseID'=> $dcaseID ]);
            $result = $mongo->executeBulkWrite( 'dcaseInfo.dcaseList' , $query);
            
            try {
                $mongo->executeCommand('dcaseParts', new \MongoDB\Driver\Command(["drop" => $dcaseID]));
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
            try {
                $mongo->executeCommand('dcasePartsHistory', new \MongoDB\Driver\Command(["drop" => $dcaseID]));
            } catch(Exception $e) {
            }
            if($dcaseID != "")
            {
                $output = [];
                exec("rm -rf /data/screenshot/" . $dcaseID . "/", $output);

                $output = [];
                exec("rm -rf /data/uploadFile/" . $dcaseID . "/", $output);
            }
        }
    }
}
?>
