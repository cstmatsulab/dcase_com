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

	
	if( $userInfo != null )
	{
		if( array_key_exists("dcaseID", $post) )
		{
			$dcaseID = $post["dcaseID"];
            $result = glob('/data/uploadFile/' . $dcaseID . '/*');
            $retMsg["result"] = "OK";
            $fileList = [];
            foreach($result as $fileName)
            {
                $fileName = basename($fileName);
                $fileName = str_replace("_", "=", $fileName);
                $fileName = base64_decode($fileName);
                $fileList[] = $fileName;
            }
            $retMsg["filenameList"] = $fileList;
        }
	}
    echo( json_encode($retMsg) );
}
?>
