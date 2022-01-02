<?PHP
header("Content-Type: application/json; charset=utf-8");
//header("Content-Type: application/json; charset=utf-8");
date_default_timezone_set('Asia/Tokyo');

require_once("./config.php");
require_once("./util.php");

main($_GET, $_POST, $_FILES);

function main($get, $post, $file)
{
	$retMsg = array(
		"result" => "NG"
	);
	if( array_key_exists("userID", $post) &&
		array_key_exists("passwd", $post) &&
		array_key_exists("mail", $post) 
	)
	{
		$retMsg["result"] = "NG2";
		$mongoConfig = new MongoConfig();
		$mongo = $mongoConfig->getMongo();
		
		$userID = $post["userID"];
		$passwd = $post["passwd"];
		$filter = [ 'userID'=> $userID ];
		$options = [
			'projection' => ['_id' => 0],
			'sort' => ['_id' => -1],
		];

		$query = new MongoDB\Driver\Query( $filter, $options );
		$cursor = $mongo->executeQuery( 'UserInfo.UserList' , $query);
		
		$userInfo = [];
		foreach ($cursor as $document)
		{
			$userInfo = $document;
			break;
		}
		
		$salt = $userInfo->salt;
		$hashData = hash("sha256", $passwd.$salt, TRUE);
		$passwdHash = base64_encode($hashData);

		if( $userInfo->passwd == $passwdHash )
		{
			$filter = ['mail' => $post["mail"] ];
			$options = [
				'projection' => ['_id' => 0],
				'sort' => ['_id' => -1],
			];
			$query = new MongoDB\Driver\Query( $filter, $options );
			$cursor = $mongo->executeQuery( 'UserInfo.UserList' , $query);

			$notUpdateFlag = false;
			foreach ($cursor as $document)
			{
				if( $document->userID != $userID )
				{
					$notUpdateFlag = true;
				}
			}

			if($notUpdateFlag == false)
			{
				$userInfo->mail = $post["mail"];

				srand( rand(0,10000000) );
				$userInfo->salt = rand( 0,10000000 );
				$hashData = hash("sha256", $passwd . $userInfo->salt, TRUE);
				$userInfo->passwd = base64_encode($hashData);

				$userInfo->lastName = $post["lastName"];
				$userInfo->firstName = $post["firstName"];
				$userInfo->lastNameRubi = $post["lastNameRubi"];
				$userInfo->firstNameRubi = $post["firstNameRubi"];
				$userInfo->age = $post["age"];
				$userInfo->group = $post["group"];
				$userInfo->grade = $post["grade"];
				if($userInfo->group != "")
				{
					$userInfo->keyword = mb_split("�@|\s", $userInfo->group);
				}else{
					$userInfo->keyword = [];
				}

				$userInfo->keyword[] = $userInfo->mail;
				if($userInfo->lastName != "")
				{
					$userInfo->keyword[] = $userInfo->lastName;
				}
				if($userInfo->firstName != "")
				{
					$userInfo->keyword[] = $userInfo->firstName;
				}
				if($userInfo->lastNameRubi != "")
				{
					$userInfo->keyword[] = $userInfo->lastNameRubi;
				}
				if($userInfo->firstNameRubi != "")
				{
					$userInfo->keyword[] = $userInfo->firstNameRubi;
				}

				$query = new MongoDB\Driver\BulkWrite;
				$query->update(
					['mail'=> $userInfo->mail],
					['$set' => $userInfo],
					['multi' => true, 'upsert' => true]
				);
				$result = $mongo->executeBulkWrite( 'UserInfo.UserList' , $query);
				if( $result->getUpsertedCount() == 1 || $result->getModifiedCount()==1 || $result->getMatchedCount() > 0)
				{
					if( array_key_exists("iconImage", $file))
					{
						if ( is_uploaded_file($file["iconImage"]["tmp_name"]) )
						{
							cropImage(	$file["iconImage"]["tmp_name"],
										getcwd() . "/../pic/user/" . $userID . ".jpg" );
						}
						$retMsg["image"] = getcwd() . "/../pic/user/" . $userID . ".jpg";
					}
					$retMsg["result"] = 'OK';
				}
			}
		}
	}	
	$json = json_encode($retMsg);
	printf("%s", $json);
}
?>