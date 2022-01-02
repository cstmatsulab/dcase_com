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
            array_key_exists("member", $post) )
	    {
            $mongoConfig = new MongoConfig();
            $mongo = $mongoConfig->getMongo();
            $dcaseID = $post["dcaseID"];
            $member = json_decode( $post["member"] );
			if( checkMember($mongo, $dcaseID, $userInfo->userID) )
			{
				$newMemberList = [];

				$filter = [ "dcaseID" => $dcaseID ];
				$options = [];
                $query = new MongoDB\Driver\Query( $filter, $options );
				$cursor = $mongo->executeQuery( 'dcaseInfo.dcaseList' , $query);

				$sendMailList = [];
				$dcaseInfo = [];
				foreach ($cursor as $document)
				{
					$dcaseInfo = $document;
					foreach( $document->member as $currentMember )
					{
						$newMemberList[] = $currentMember;
						$memberNum = count($member);
						for( $i = 0; $i < $memberNum; $i++ )
						{
							if( $currentMember->userID == $member[$i] )
							{
								unset($member[$i]);
							}else{
								$sendMailList[] = $member[$i];
							}
						}
					}
					$member = array_values($member);
				}
				
				$filter = ['userID'=> ['$in' => $member]];
				$options = [
					'projection' => ['_id' => 0],
					'sort' => ['lastNameRubi' => 1],
				];
				$query = new MongoDB\Driver\Query( $filter, $options );
				$cursor = $mongo->executeQuery( 'UserInfo.UserList' , $query);
			
				$member = [];
				$retMsg["mail"] = []; 
				foreach ($cursor as $document)
				{
					$item = [];
					$item["userID"] = $document->userID;
					$item["userName"] = $document->lastName . " " . $document->firstName;
					$item["position"] = 0;
					$item["value"] = 5;
					$newMemberList[] = $item;

					
					$protocol = empty($_SERVER['HTTPS']) ? 'http://' : 'https://';
					$basePATH = str_replace( 'api', '', pathinfo($_SERVER['REQUEST_URI'])["dirname"] );
					$url = $protocol . $_SERVER['HTTP_HOST'] . $basePATH;
					
					$to = $document->mail;
					$subject = 'You are invited to new dcase';
					$message = 'Title:' . $dcaseInfo->title ."\n". 
								'You are invited to new dcase' ."\n". 
								$url . 'editor.html?dcaseID=' . $dcaseID ."\n";
					$headers = 'From: dcase@' . $_SERVER['HTTP_HOST'];
					mail($to, $subject, $message, $headers);
					$retMsg["newMember"] = $member; 
					$retMsg["mail"][] = $to;
				}
			
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
					$result->getMatchedCount() > 0)
				{
					$retMsg["result"] = 'OK';
					$retMsg["dcaseInfo"] = $dcaseInfo;
					$retMsg["newMember"] = $member; 
				}
			}
        }
  	}
	echo( json_encode($retMsg) );
}
?>
