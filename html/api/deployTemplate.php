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
	if( array_key_exists("dcaseID", $post) &&
		array_key_exists("partsID", $post) &&
		array_key_exists("templateID", $post) )
	{
		$mongoConfig = new MongoConfig();
        $mongo = $mongoConfig->getMongo();
        
        if( $sp = websocket_open("127.0.0.1", 3000,'',$errstr, 10, false) )
        {
            $jsonData = json_encode( [
                "mode" => "connected",  
                'dcaseID' => $dcaseID,
            ]);
            websocket_write($sp, $jsonData);
        }
        
		$dcaseID = $post["dcaseID"];
		$partsID = $post["partsID"];
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
        $replaceIDList = [];
        $rootParts = [];
        
        $filter = [ "id" => $partsID ];
        $options = [ 'projection' => ['_id' => 0], ];
        
        $query = new MongoDB\Driver\Query( $filter, $options );
        $cursor = $mongo->executeQuery( 'dcaseParts.' . $dcaseID , $query);
        foreach ($cursor as $document)
        {
            $rootParts = clone $document;
        }

        foreach ($template->partsList as $parts)
		{
            $replaceIDList[$parts->id] = createPartsID($mongo, $dcaseID);
            $partsList[ $parts->id ] = $parts;
            if($template->root->id == $parts->parent)
            {
                $rootParts->childrenID[] = $replaceIDList[$parts->id];
            }
        }

        //座標
        foreach ($template->partsList as $parts)
		{
            if($template->root->id == $parts->parent)
            {
                $parts->x = $rootParts->x + $parts->offsetX;
                $parts->y = $rootParts->y + $parts->offsetY;
            }else{
                $parent = $partsList[ $parts->parent ];
                $parts->x = $parent->x + $parts->offsetX;
                $parts->y = $parent->y + $parts->offsetY;
            }
        }
        
        foreach ($template->partsList as $parts)
		{
            $newChildrenID = [];
            foreach( $parts->childrenID as $childID )
            {
                $newChildrenID[] = $replaceIDList[$childID];
            }

            $parts->childrenID = $newChildrenID;

            if($template->root->id == $parts->parent)
            {
                $parts->parent = $partsID;
            }else{
                $parts->parent = $replaceIDList[$parts->parent]; 
            }
            $parts->id = $replaceIDList[$parts->id]; 
        }

        $rootParts->label = $template->name;
        $rootParts->detail = $template->root->detail;
        $query = new MongoDB\Driver\BulkWrite;
        $query->update(
            ['id' => $partsID, ],
			['$set' => $rootParts, ],
            ['multi' => true, 'upsert' => true]
		);
		$retMsg["rootParts"] = $rootParts;
        $result = $mongo->executeBulkWrite( 'dcaseParts.' . $dcaseID , $query);
        if( $sp )
        {
            $jsonData = json_encode([
                "mode" => "createNode", 
                "dcaseID" => $dcaseID,
                "node" => $rootParts,
            ]);
            websocket_write($sp, $jsonData);
        }
        
        foreach ($template->partsList as $parts)
		{
            $query = new MongoDB\Driver\BulkWrite;
            $query->update(
                ['id' => $parts->id, ],
                ['$set' => $parts, ],
                ['multi' => true, 'upsert' => true]
            );
            $result = $mongo->executeBulkWrite( 'dcaseParts.' . $dcaseID , $query);
            
            if( $sp )
            {
                $jsonData = json_encode([
                    "mode" => "createNode", 
                    "dcaseID" => $dcaseID,
                    "node" => $parts,
                ]);
                websocket_write($sp, $jsonData);
            }
        }
        if( $sp )
        {
            
            foreach ($template->partsList as $parts)
            {
                $jsonData = json_encode([
                    "mode" => "linkPath", 
                    "dcaseID" => $dcaseID,
                    "source" => $parts->parent,
                    "target" => $parts->id,
                ]);
                websocket_write($sp, $jsonData);
            }
        }
		$retMsg["partsList"] = $template->partsList;
		
		if( $sp )
        {
            websocket_close($sp);
        }
        
		$retMsg["result"] = 'OK';
	}
	echo( json_encode($retMsg) );
}
?>
