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
        if( array_key_exists("dcaseID", $post) && 
            array_key_exists("fileName", $post) )
		{
			$dcaseID = $post["dcaseID"];
            $fileName = basename($post["fileName"]);
            $fileName = base64_encode($fileName);
            $fileName = str_replace("=", "_", $fileName);

            $filePath = '/data/uploadFile/' . $dcaseID . '/' . $fileName;
            if (unlink($filePath))
            {
                $retMsg["result"] = "OK";
            }
        }
	}
    echo( json_encode($retMsg) );
}
?>
