<?PHP
//header("Content-type: application/json; charset=UTF-8");
date_default_timezone_set('Asia/Tokyo');

require_once("./config.php");

main($_GET, $_POST);

function main($get, $post)
{
	$retMsg = array(
		"result" => "NG",
	);
	
	$authFlag = false;

	$userInfo = null;
	if( array_key_exists("authID", $_COOKIE) )
	{
		$authID = $_COOKIE["authID"];
		$userInfo = auth( $authID );
	}
	
	if( array_key_exists("dcaseID", $get) )
	{
		$dcaseID = $get["dcaseID"];
		$filter = [ "dcaseID" => $dcaseID ];
		$options = [
			'projection' => ['_id' => 0],
		];

		$mongoConfig = new MongoConfig();
		$mongo = $mongoConfig->getMongo();
		$query = new MongoDB\Driver\Query( $filter, $options );
		$cursor = $mongo->executeQuery( 'dcaseInfo.dcaseList' , $query);

		$dcaseInfo = [];
		foreach ($cursor as $document)
		{
			$dcaseInfo = $document;
		}

		$authFlag = false;
		if($userInfo != null)
		{
			if( $dcaseInfo->public == 0)
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
		}
		
		if( $dcaseInfo->public == 2 )
		{
			$authFlag = true;
		}
	}

	if( $authFlag )
	{
		if( array_key_exists("dcaseID", $get) && 
			array_key_exists("fileName", $get) )
		{
			$dcaseID = $get["dcaseID"];
			$fileName = basename($get["fileName"]);
			$filePath = "/data/uploadFile/" . $dcaseID . "/" . $fileName;
			if(file_exists($filePath))
        	{
        		$file = file_get_contents($filePath);
				$ret = mime_content_type($filePath);
				header("Content-type: " . $ret . "; charset=UTF-8");
				$retMsg["Content-type"] = $ret;
				//echo( json_encode($retMsg) );
				echo( $file );
				return;
			}
		}
	}
	header("HTTP/1.1 404 Not Found");
	
}
?>
