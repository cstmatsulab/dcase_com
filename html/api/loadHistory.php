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
			$dcaseID = $post["dcaseID"];

			$mongoConfig = new MongoConfig();
            $mongo = $mongoConfig->getMongo();
            		
			$filter = [ "dcaseID" => $dcaseID ];
			$options = [
				'projection' => ['_id' => 0],
			];

			$query = new MongoDB\Driver\Query( $filter, $options );
			$cursor = $mongo->executeQuery( 'dcaseInfo.dcaseList' , $query);

            $commitLog = [];
            $dcaseInfo = [];
            $partsList = [];

			foreach ($cursor as $document)
			{
                $commitLog = $document->commitLog;
                break;
            }
            $lastCommit = 0;
            $lastCommitIndex = count($commitLog);
            if($lastCommitIndex > 0)
            {
                $lastCommit = $commitLog[count($commitLog)-1]->date;
            }

            if( array_key_exists("date", $post) )
		    {
				$lastCommitDate = intval($post["date"]);
                $retMsg["lastCommitDate"] = $lastCommitDate;
				if($lastCommitDate > 0)
				{
					$lastCommit = $lastCommitDate;
				}
            }

            if($lastCommit > 0)
            {
                $filter = [ "updateDay"=> $lastCommit, ];
                $options = [
                    'projection' => ['_id' => 0],
                ];
    
                $query = new MongoDB\Driver\Query( $filter, $options );
                $cursor = $mongo->executeQuery( 'dcaseHistory.'.$dcaseID , $query);
                
                foreach ($cursor as $document)
                {
                    $dcaseInfo = $document;
                }
            }
			
			$authFlag = false;
			if( $dcaseInfo->public == 0 )
			{
				foreach( $dcaseInfo->member as $member )
				{
					if( $member->userID == $userInfo->userID )
					{
						$authFlag = true;
					}
				}
			}else if( $dcaseInfo->public == 1 ){
				if( $userInfo != null )
				{
					$authFlag = true;
				}
			}else{
				$authFlag = true;
			}
			if($authFlag == true)
			{
                $retMsg["result"] = 'OK';
                $retMsg["commitDate"] =$lastCommit;
                $retMsg["authFlag"] =$authFlag;
            	$retMsg["commitLog"] = $commitLog;
            	$retMsg["dcaseInfo"] = $dcaseInfo;
			}
		}
  	}
	echo( json_encode($retMsg) );
}
?>
