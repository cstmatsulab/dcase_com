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

    if( array_key_exists("dcaseID", $post) && array_key_exists("partsList", $post) )
    {
        $dcaseID = $post["dcaseID"];
        $partsList = $post["partsList"];
        $partsList = json_decode($partsList, true);

        $storeDataList = [];
        foreach($partsList as $parts)
        {
            $children = [];
            foreach( $parts["children"] as $child)
            {
                $children[] = "Parts_" . $child;
            }
            $storeData["id"] = "Parts_" . $parts["partsID"];
            if($parts["parent"] == "")
            {
                $storeData["parent"] = "";
            }else{
                $storeData["parent"] = "Parts_" . $parts["parent"];
            }
            $storeData["childrenID"] = $children;
            $storeData["kind"] = $parts["kind"];
            $storeData["detail"] = $parts["detail"];
            $storeData["x"] = intval($parts["x"]);
            $storeData["y"] = intval($parts["y"]);
            $storeData["width"] = intval($parts["width"]);
            $storeData["height"] = intval($parts["height"]);

            $storeData["label"] = "";
            $storeData["tableInfo"] = [];
            $storeData["penndingFlag"] = false;
            $storeData["apiFlag"] = false;
            $storeData["apiPartsID"] = "";
            $storeData["apiHidden"] = false;
            $storeData["hidden"] = false;
            $storeData["original"] = "";
            $storeData["updateTime"] = 0;
            $storeData["updateLinkTime"] = 0;

            $storeDataList[] = $storeData;
        }

        $mongoConfig = new MongoConfig();
        $mongo = $mongoConfig->getMongo();
        
        $success = True;
        foreach($storeDataList as $storeData)
        {
            $query = new MongoDB\Driver\BulkWrite;
            $query->update(
                ['id'=> $storeData["id"] ],
                ['$set' => $storeData ],
                ['multi' => true, 'upsert' => true]
            );
            
            $result = $mongo->executeBulkWrite( 'dcaseParts.' . $dcaseID , $query);
            if( $result->getUpsertedCount() == 1 || 
                $result->getModifiedCount()==1 || 
                $result->getMatchedCount() > 0)
            {

            }else{
                $success = False;
            }
        }        
        if( $success )
        {
            $retMsg["result"] = 'OK';
        }
    }
	echo( json_encode($retMsg) );
}
?>
