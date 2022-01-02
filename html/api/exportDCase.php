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
    
    if( $userInfo != null )
	{
        if( array_key_exists("dcaseID", $post) )
        {
            $dcaseID = $post["dcaseID"];
            
            $mongoConfig = new MongoConfig();
            $mongo = $mongoConfig->getMongo();		
            $filter = [];
            $options = [
                'projection' => ['_id' => 0],
            ];

            $query = new MongoDB\Driver\Query( $filter, $options );
            $cursor = $mongo->executeQuery( 'dcaseParts.' . $dcaseID , $query);

            $partsList = [];
            
            foreach ($cursor as $document)
            {
                $document = json_decode(json_encode($document), true);
                if( array_key_exists("apiFlag", $document) )
                {
                    if($document["apiFlag"])
                    {
                        continue;
                    }
                }
                $children = [];
                if( array_key_exists("childrenID", $document) )
                {
                    foreach( $document["childrenID"] as $child)
                    {
                        $children[] = str_replace("Parts_", "", $child);
                    }
                }
                $parts = [
                    "partsID" => str_replace("Parts_", "", $document["id"]),
                    "parent" => str_replace("Parts_", "", $document["parent"]),
                    "children" => $children,
                    "kind" => $document["kind"],
                    "detail" => $document["detail"],
                    "x" => intval($document["x"]),
                    "y" => intval($document["y"]),
                    "width" => intval($document["width"]),
                    "height" => intval($document["height"]),
                ];
                $partsList[] = $parts;
            }
            
            $retMsg["result"] = 'OK';
            $retMsg["partsList"] = $partsList;
        }
    }
	echo( json_encode($retMsg) );
}
?>
