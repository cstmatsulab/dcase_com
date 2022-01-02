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
        if( array_key_exists("dcaseID", $post) && 
            array_key_exists("partsID", $post)&& 
            array_key_exists("name", $post) )
		{
            $dcaseID = $post["dcaseID"];
            $partsID = $post["partsID"];
            $name = $post["name"];

            $mongoConfig = new MongoConfig();
            $mongo = $mongoConfig->getMongo();
	
            $filter = [];
            $options = [
                'projection' => ['_id' => 0, 'public' => 0],
            ];
            $query = new MongoDB\Driver\Query( $filter, $options );
            $cursor = $mongo->executeQuery( 'dcaseParts.' . $dcaseID , $query);
            $partsList = [];
            $root = false;
            $templateList = [];
            foreach ($cursor as $parts)
            {
                $partsList[$parts->id] = clone $parts;
                if($partsID == $parts->id)
                {
                    $root = $partsList[$parts->id];
                }
            }
            makeTemplatePartsList($root, $root->x, $root->y, $partsList, $templateList);
            
            if($root != false)
            {
                $templateID = "";
                $filter = ["name" => $name, "userID" => $userInfo->userID,];
                $options = [
                    'projection' => ['_id' => 0],
                    'sort' => ['_id' => -1],
                ];
                $query = new MongoDB\Driver\Query( $filter, $options );
                $cursor = $mongo->executeQuery( 'dcaseInfo.dcaseTemplate' , $query);
                foreach ($cursor as $template)
                {
                    $templateID = $template->id;
                }  
                if($templateID =="")
                {
                    for($loopNum = 0; $loopNum < 100; $loopNum++)
                    {
                        $id = rand( 0,100000 );
                        $hashData = hash("sha256", $id.$id.$id.$id.$id, TRUE);
                        $templateID = base64_encode($hashData);
                        $templateID = preg_replace("/[\/+=]/","_",$templateID);
                        $filter = ['templateID'=> $templateID];
                        $options = [
                            'projection' => ['_id' => 0],
                            'sort' => ['_id' => -1],
                        ];
                        $query = new MongoDB\Driver\Query( $filter, $options );
                        $cursor = $mongo->executeQuery( 'dcaseInfo.dcaseTemplate' , $query);
                        
                        $exist = false;
                        foreach ($cursor as $document) {
                            $exist = true;
                            if( $document->dcaseID == $dcaseID )
                            {
                                $loopNum = 100;
                            }
                        }
                        if( $exist == false )
                        {
                            break;
                        }
                    }    
                }
             
                if($templateID != "")
                {
                    $createTime = intval(date("YmdHis"));
                    $query = new MongoDB\Driver\BulkWrite;
                    $query->update(
                        [ "name" => $name, "userID" => $userInfo->userID, ],
                        ['$set' =>
                            [
                                'id' => $templateID, 
                                "name" => $name,
                                "kind" => $root->kind,
                                "createTime" => $createTime,
                                "userID" => $userInfo->userID,
                                "dcaseID" => $dcaseID,
                                "root" => $root,
                                "partsList" => $templateList,
                            ],
                        ],
                        ['multi' => true, 'upsert' => true]
                    );
                    $result = $mongo->executeBulkWrite( 'dcaseInfo.dcaseTemplate' , $query);
                    $retMsg["result"] = 'OK';
                    $retMsg["root"] = $root;
                    $retMsg["templateList"] = $templateList;
                    $retMsg["templateID"] = $templateID;
                }
            }
        }
    }
	echo( json_encode($retMsg) );
}

function makeTemplatePartsList(&$target, $x, $y, &$partsList, &$templateList)
{
    $partsList[$target->id]->offsetX = $target->x - $x;
    $partsList[$target->id]->offsetY = $target->y - $y;
    // $templateList[] = $target;
    foreach ($target->childrenID as $partsID)
    {
        foreach ($partsList as $parts)
        {
            if($partsID == $parts->id)
            {
                $templateList[] = $parts;
                makeTemplatePartsList($parts, $target->x, $target->y, $partsList, $templateList);
            }
        }
    }
}

?>
