<?PHP

require "./websocket_client.php";

header("Content-type: application/json; charset=UTF-8");
date_default_timezone_set('Asia/Tokyo');

require_once("./config.php");
require_once("./util.php");

main($_GET, $_POST);

function createPartsID($mongo, $dcaseID)
{
    $newPartsID = "";
    for($i=0; $i<100; $i++)
    {
        $newPartsID = "Parts_" . randomPasswd($length = 8);

        $filter = [ "id" => $newPartsID ];
        $options = [ 'projection' => ['_id' => 0], ];
        
        $on = true;
        $query = new MongoDB\Driver\Query( $filter, $options );
        $cursor = $mongo->executeQuery( 'dcaseParts.' . $dcaseID , $query);
        foreach ($cursor as $document)
        {
            $on = false;
        }

        if($on)
        {
            $parts["id"] = $newPartsID;
            break;
        }
    }

    return($newPartsID);
}

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
        if( array_key_exists("templateID", $post) )
        {
            $mongoConfig = new MongoConfig();
            $mongo = $mongoConfig->getMongo();
            
            $templateID = $post["templateID"];
            
            $filter = [ "id" => $templateID ];
            $options = [ 'projection' => ['_id' => 0], ];
            
            $query = new MongoDB\Driver\Query( $filter, $options );
            $cursor = $mongo->executeQuery( 'dcaseInfo.dcaseTemplate' , $query);
            
            $template = [];
            $partsList = [];
            foreach ($cursor as $document)
            {
                $template = clone $document;
            }
            $retMsg["template"] = $template;
            $retMsg["post"] = $post;
            
            $retMsg["result"] = 'OK';
        }
    }
	echo( json_encode($retMsg) );
}
?>
