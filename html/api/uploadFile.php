<?PHP
header("Content-type: application/json; charset=UTF-8");
date_default_timezone_set('Asia/Tokyo');

require_once("./config.php");

main($_GET, $_POST);

function main($get, $post)
{
	$retMsg = array(
		"result" => "NG",
	);
	$userInfo = null;
	if( array_key_exists("authID", $post) )
	{
		$authID = $post["authID"];
		$userInfo = auth( $authID );
	}

    if( array_key_exists("dcaseID", $post) && 
        array_key_exists("fileName", $post) )
    {
        $dcaseID = $post["dcaseID"];
        $fileName = basename($post["fileName"]);

        /*
        $mongoConfig = new MongoConfig();
        $mongo = $mongoConfig->getMongo();
        
        $query = new MongoDB\Driver\BulkWrite;
        $query->update(
            ['id'=> $storeData["id"] ],
            ['$set' => $storeData ],
            ['multi' => true, 'upsert' => true]
        );
            
        $result = $mongo->executeBulkWrite( 'dcaseFile.' . $dcaseID , $query);
        if( $result->getUpsertedCount() == 1 || 
            $result->getModifiedCount()==1 || 
            $result->getMatchedCount() > 0)
        {
        }
        */
        $bastPath = "/data/uploadFile/". $dcaseID;
        $fileName = base64_encode($fileName);
        $fileName = str_replace("=", "_", $fileName);
        if(file_exists($bastPath) == false)
        {
            mkdir($bastPath, 0777, true);
        }
        $uploadfile = $bastPath . "/" . $fileName;
        
        if (move_uploaded_file($_FILES['file']['tmp_name'], $uploadfile))
        {
            $retMsg["result"] = "OK";
            $protocol = empty($_SERVER['HTTPS']) ? 'http://' : 'https://';
            $url = "./api/getFile.php?dcaseID=" . $dcaseID . "&fileName=" . $fileName;
            $retMsg["url"] = $url;
        }
    }
	echo( json_encode($retMsg) );
}
?>
