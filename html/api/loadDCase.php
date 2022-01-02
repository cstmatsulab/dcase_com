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

	//if( $userInfo != null )
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

			$dcaseInfo = [];
			foreach ($cursor as $document)
			{
				$dcaseInfo = $document;
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
			$retMsg["authFlag"] =$authFlag;
			$retMsg["dcaseInfo"] = $dcaseInfo;
			if($authFlag == true)
			{
				$filter = [];
				$options = [
					'projection' => ['_id' => 0],
				];

				$query = new MongoDB\Driver\Query( $filter, $options );
				$cursor = $mongo->executeQuery( 'dcaseParts.' . $dcaseID , $query);

				$partsList = [];
				
				foreach ($cursor as $document)
				{
					$partsList[] = $document;
				}
				
				$retMsg["result"] = 'OK';
				$retMsg["dcaseInfo"] = $dcaseInfo;
				$retMsg["partsList"] = $partsList;
			}
		}
  	}
	echo( json_encode($retMsg) );
}
?>
