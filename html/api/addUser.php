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
	
	
	if( array_key_exists("mail", $post) &&
		array_key_exists("passwd", $post) )
	{
		$dbName = "UserInfo";
		$colName = "UserList";
		
		$mongoConfig = new MongoConfig();
		$mongo = $mongoConfig->getMongo();
		
		$mail = $post["mail"];
		$filter = ['mail'=> $mail];
		$options = [];
		$query = new MongoDB\Driver\Query( $filter, $options );
		$cursor = $mongo->executeQuery( $dbName . '.' . $colName , $query);
		$exist = false;
		foreach ($cursor as $document)
		{
			$exist = true;
		}

		if($exist == false)
		{
			$passwd = $post["passwd"];
			
			$lastName = $post["lastName"];
			$firstName = $post["firstName"];
			
			$lastNameRubi = $post["lastNameRubi"];
			$firstNameRubi = $post["firstNameRubi"];
			
			$age = $post["age"];
			$group = $post["group"];
			$grade = $post["grade"];
			
			srand( rand(0,10000000) );
			
			for($loopNum = 0; $loopNum < 100; $loopNum++)
			{
				$salt = rand( 0,10000000 );
				$hashData = hash("sha256", $passwd.$salt, TRUE);
				$passwdHash = base64_encode($hashData);
				
				$userID = base64_encode(hash("sha256", $mail . $passwdHash, TRUE));
				$userID = preg_replace("/[\/+=]/","_",$userID);
				$filter = ['userID' => $userID];
				$options = [
					'projection' => ['_id' => 0],
					'sort' => ['_id' => -1],
				];
				$query = new MongoDB\Driver\Query( $filter, $options );
				$cursor = $mongo->executeQuery( $dbName . '.' . $colName , $query);
				
				$exist = false;
				foreach ($cursor as $document) {
					$exist = true;
					if( $document->mail == $mail )
					{
						$loopNum = 100;
					}
				}
				if( $exist == false )
				{
					break;
				}
			}
			
			if($loopNum < 100)
			{
				$query = new MongoDB\Driver\BulkWrite;
				$keyword = mb_split("�@|\s", $group);
				$keyword[] = $mail;
				//if( array_search($lastName, $keyword) != false )
				$keyword[] = $lastName;
				$keyword[] = $firstName;
				$keyword[] = $lastNameRubi;
				$keyword[] = $firstNameRubi;
				
				$query->update(
					['mail'=> $mail],
					['$set' =>
						[
							'userID' => $userID,
							'mail' => $mail,
							'passwd' => $passwdHash,
							'salt' => $salt,
							'lastName' => $lastName,
							'firstName' => $firstName,
							'lastNameRubi' => $lastNameRubi,
							'firstNameRubi' => $firstNameRubi,
							'age' => $age,
							'group' => $group,
							'grade' => $grade,
							'keyword' => $keyword,
						]
					],
					['multi' => true, 'upsert' => true]
				);
				$result = $mongo->executeBulkWrite( $dbName . '.' .$colName , $query);
				if( $result->getUpsertedCount() == 1 || $result->getModifiedCount()==1 || $result->getMatchedCount() > 0)
				{
					if ( is_uploaded_file($file["iconImage"]["tmp_name"]) )
					{
						cropImage(	$file["iconImage"]["tmp_name"],
									getcwd() . "/../pic/user/" . $userID . ".jpg" );
					}
					$retMsg["image"] = getcwd() . "/../pic/user/" . $userID . ".jpg";
					$retMsg["result"] = 'OK';
				}
			}
		}
	}	
	$json = json_encode($retMsg);
	printf("%s", $json);
}
?>