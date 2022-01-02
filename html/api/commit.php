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
        if( array_key_exists("dcaseID", $post) ) //&& array_key_exists("msg", $post) )
	    {
            $mongoConfig = new MongoConfig();
            $mongo = $mongoConfig->getMongo();
            $dcaseID = $post["dcaseID"];
            $msg = $post["msg"];
            if( checkMember($mongo, $dcaseID, $userInfo->userID) )
			{
                $filter = ['dcaseID'=> $dcaseID ];
                $options = [
                    'projection' => ['_id' => 0],
                ];
                $query = new MongoDB\Driver\Query( $filter, $options );
                $cursor = $mongo->executeQuery( 'dcaseInfo.dcaseList' , $query);

                $dcaseInfo = [];
                foreach ($cursor as $document)
                {
                    $dcaseInfo = $document;
                }

                $timeStmap = intval(date("YmdHis"));
                if( array_key_exists("commitLog", $dcaseInfo) == false )
                {
                    $dcaseInfo->commitLog = [];
                    $dcaseInfo->commitTime = 0;//$timeStmap;
                    /*
                    $query = new MongoDB\Driver\BulkWrite;
                    $query->update(
                        ['dcaseID'=> $dcaseID ],
                        ['$set' => $dcaseInfo ],
                        ['multi' => true, 'upsert' => true]
                    );
                    $result = $mongo->executeBulkWrite( 'dcaseInfo.dcaseList' , $query);
                    */
                }
                $dcaseInfo->commitLog[] = [
                    "date" => $timeStmap,
                    "msg" => $msg,
                ];
                $commitTime = $dcaseInfo->commitTime;
                $dcaseInfo->commitTime = $timeStmap;

                $filter = [
                    'updateTime' => ['$gte' => intval($commitTime) ], // >=
                ];
                $options = [
                    'projection' => ['_id' => 0],
                ];

                $query = new MongoDB\Driver\Query( $filter, $options );
                $cursor = $mongo->executeQuery( 'dcaseParts.' . $dcaseID , $query);
                $diff = [];
                $dcaseInfo->diffParts = [];
                $saveFlag = false;
                foreach ($cursor as $document)
                {
                    $saveFlag = True;
                    $diff[$document->id] = $document;
                    $dcaseInfo->diffParts[] = $document->id;
                }

                
                $filter = [
                    'updateLinkTime' => ['$gt' => intval($commitTime) ], // >=
                ];
                $options = [
                    'projection' => ['_id' => 0],
                ];

                $query = new MongoDB\Driver\Query( $filter, $options );
                $cursor = $mongo->executeQuery( 'dcaseParts.' . $dcaseID , $query);
                $diffLink=[];
                $dcaseInfo->diffLink = [];
                foreach ($cursor as $document)
                {
                    $saveFlag = True;
                    $diff[$document->id] = $document;
                    $diffLink[] = $document;
                    $dcaseInfo->diffLink[] = [
                        "source" =>  $document->parent,
                        "target" =>  $document->id,
                    ];
                }
                $retMsg["diffParts"] = $diff;
                $retMsg["diffLink"] = $diffLink;
                
                if($saveFlag)
                {
                    $dcaseInfo->updateDay = $timeStmap;
                    $query = new MongoDB\Driver\BulkWrite;
                    $query->update(
                        ['dcaseID'=> $dcaseID ],
                        ['$set' => $dcaseInfo ],
                        ['multi' => true, 'upsert' => true]
                    );
                    $result = $mongo->executeBulkWrite( 'dcaseInfo.dcaseList' , $query);
                    
                    $filter = [];
                    $options = [
                        'projection' => ['_id' => 0],
                    ];
    
                    $query = new MongoDB\Driver\Query( $filter, $options );
                    $cursor = $mongo->executeQuery( 'dcaseParts.' . $dcaseID , $query);
                    $dcaseInfo->parts = [];
                    foreach ($cursor as $document)
                    {
                        $dcaseInfo->parts[] = $document;
                    }
                    
                    $dcaseInfo->snapshotTime = $timeStmap;
    
                    $query = new MongoDB\Driver\BulkWrite;
                    $query->insert( $dcaseInfo );
                    $result = $mongo->executeBulkWrite( 'dcaseHistory.' . $dcaseID , $query);
                    $p = [];
                    foreach ($diff as $id => $parts)
                    {
                        unset($parts->_id);
                        $parts->commitTime = $timeStmap;
                        $query = new MongoDB\Driver\BulkWrite;
                        $query->update(
                            ['id'=> $parts->id, 'commitTime'=> $parts->commitTime,  ],
                            ['$set' => $parts ],
                            ['multi' => true, 'upsert' => true]
                        );
                        $p = $parts;
                        $result = $mongo->executeBulkWrite( 'dcasePartsHistory.' . $dcaseID , $query);
                    }
                    $retMsg["result"] = 'OK';
                    $retMsg["p"] = $p;
                }else{
                    $retMsg["result"] = 'OK';
                    $retMsg["reason"] = "no diff";
                    $retMsg["commitTime"] = $commitTime;
                    $retMsg["dcaseInfo"] = $dcaseInfo;
                }
            }
        }
  	}
	echo( json_encode($retMsg) );
}
?>
