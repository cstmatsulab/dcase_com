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

        $filter = ['userID'=> $userInfo->userID];
        $options = [
            'projection' => [],
            'sort' => ['_id' => -1],
        ];
        $query = new MongoDB\Driver\Query( $filter, $options );
        $cursor = $mongo->executeQuery( 'UserInfo.UserList' , $query);
        $userInfo = null;
        foreach ($cursor as $document) {
            $userInfo = $document;
            break;
        }

        if( array_key_exists("currentPassword", $post) )
        {
            $currentPassword = $post["currentPassword"];

            $salt = $userInfo->salt;
            $hashData = hash("sha256", $currentPassword.$salt, TRUE);
            $passwdHash = base64_encode($hashData);
            $retMsg["passwd"] = $userInfo;
            $retMsg["passwdHash"] =  $passwdHash;
            if( $userInfo->passwd == $passwdHash )
            {
                $dbName = "UserInfo";
                $colName = "UserList";
                
                
                $updateUserInfo = [
                ];
                $updateFlag = false;
                if( array_key_exists("mail", $post) )
                {
                    $updateUserInfo["mail"] = $post["mail"];
                    $updateFlag = True;
                }
                if( array_key_exists("passwd", $post) )
                {
                    srand( rand(0,10000000) );
                    $salt = rand( 0,10000000 );
                    $passwd = $post["passwd"];
                    $updateUserInfo["salt"] = $salt;
                    $hashData = hash("sha256", $passwd.$salt, TRUE);
                    $passwdHash = base64_encode($hashData);
                    $updateUserInfo["passwd"] = $passwdHash;
                    $updateFlag = True;
                }
                if($updateFlag)
                {
                    
                $query = new MongoDB\Driver\BulkWrite;
                $query->update(
                    ['userID'=> $userInfo->userID],
                    ['$set' =>$updateUserInfo],
                    ['multi' => true, 'upsert' => true]
                );
                $result = $mongo->executeBulkWrite( $dbName . '.' .$colName , $query);
                if( $result->getUpsertedCount() == 1 || $result->getModifiedCount()==1 || $result->getMatchedCount() > 0)
                {
                }
                if ( is_uploaded_file($file["iconImage"]["tmp_name"]) )
                {
                    cropImage(	$file["iconImage"]["tmp_name"],
                                getcwd() . "/../pic/user/" . $userInfo->userID . ".jpg" );
                }
                $retMsg["image"] = getcwd() . "/../pic/user/" . $userInfo->userID . ".jpg";
                $retMsg["result"] = 'OK';
            }
        }
	}	
	$json = json_encode($retMsg);
	printf("%s", $json);
}
?>