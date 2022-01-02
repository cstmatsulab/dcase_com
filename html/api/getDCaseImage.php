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
    
    $userInfo = null;
	if( array_key_exists("authID", $_COOKIE) )
	{
		$authID = $_COOKIE["authID"];
		$userInfo = auth( $authID );
	}

	
	if( $userInfo != null )
	{
        if( array_key_exists("dcaseID", $get) && 
            array_key_exists("fileName", $get) )
        {
            $dcaseID = $get["dcaseID"];
            $fileName = basename($get["fileName"]);

            $filePath = "/data/screenshot/" . $dcaseID . "/" . $fileName;
            //$info = pathinfo($filePath);
            $retMsg["filePath"] = $filePath;
            if(file_exists($filePath))
            {
                $file = file_get_contents($filePath);
                $ret = mime_content_type($filePath);
                
                if( strpos($ret, 'svg') !== false)
                {
                    $ret .= "+xml";
                    $file = str_replace("./api/", "./", $file); 
                    $file = str_replace("/data/uploadFile/" . $dcaseID . "/", 
                    "./getFile.php?dcaseID=" . $dcaseID . "&amp;fileName=", $file);          
                }
                $retMsg["Content-type"] = $ret;
                header("Content-type: " . $ret . "; charset=UTF-8");
                echo( $file );
                return;
                
            }
        }
    }
    header("HTTP/1.1 404 Not Found");
    /*
    header("Content-type: application/json; charset=UTF-8");
    echo( json_encode($retMsg) );
    */
}
?>
