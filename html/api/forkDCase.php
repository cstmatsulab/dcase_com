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
        if( array_key_exists("title", $post) &&
        array_key_exists("dcaseID", $post) &&
        array_key_exists("commitTime", $post) &&
			array_key_exists("member", $post) )
		{
            $mongoConfig = new MongoConfig();
            $mongo = $mongoConfig->getMongo();
            
            $dbName = "dcaseInfo";
			$colName = "dcaseList";
			
			$title = $post["title"];
            $srcDCaseID = $post["dcaseID"];
			$commitTime = intval( $post["commitTime"] );
            
            $filter = [ "commitTime"=> $commitTime, ];
            $options = [
                'projection' => ['_id' => 0],
            ];

            $query = new MongoDB\Driver\Query( $filter, $options );
            $cursor = $mongo->executeQuery( 'dcaseHistory.'.$srcDCaseID , $query);
            
            $existDcaseInfo = false;
            foreach ($cursor as $document)
            {
                $dcaseInfo = $document;
                $existDcaseInfo = true;
            }

            if($existDcaseInfo)
            {
                $memberList = json_decode( $post["member"] );
			
                
                
                $dcaseID = "";
                for($loopNum = 0; $loopNum < 100; $loopNum++)
                {
                    $id = rand( 0,100000 );
                    $hashData = hash("sha256", $id.$id.$id.$id.$id, TRUE);
                    $dcaseID = base64_encode($hashData);
                    $dcaseID = preg_replace("/[\/+=]/","_",$dcaseID);
                    $filter = ['dcaseID'=> $dcaseID];
                    $options = [
                        'projection' => ['_id' => 0],
                        'sort' => ['_id' => -1],
                    ];
                    $query = new MongoDB\Driver\Query( $filter, $options );
                    $cursor = $mongo->executeQuery( $dbName . '.' . $colName , $query);
                    
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
                
                if($loopNum < 100)
                {
    
                    $filter = ['userID'=> ['$in' => $memberList]];
                    $options = [
                        'projection' => ['_id' => 0],
                        'sort' => ['lastNameRubi' => 1],
                    ];
                    $query = new MongoDB\Driver\Query( $filter, $options );
                    $cursor = $mongo->executeQuery( 'UserInfo.UserList' , $query);
                
                    $member = [];
                    foreach ($cursor as $document)
                    {
                        $item = [];
                        $item["userID"] = $document->userID;
                        $item["userName"] = $document->lastName . " " . $document->firstName;
                        $item["position"] = 0;
                        $item["value"] = 5;
                        $member[] = $item;
                    }
                
                    $query = new MongoDB\Driver\BulkWrite;
                    /*
                    $query->update(
                        ['userID'=> $userID],
                        ['$set' =>
                            [
                                'dcaseID'=> $dcaseID,
                                'updateDay' => new DateTime(),
                                'createDay' => new DateTime(),
                                'title' => $title,
                                'member' => $member,
                            ]
                        ],
                        ['multi' => true, 'upsert' => true]
                    );
                    $result = $mongo->executeBulkWrite( $dbName . '.' .$colName , $query);
                    
                    $query = new MongoDB\Driver\BulkWrite;
                    */
                    $public = 0;
                    if( $post["public"] )
                    {
                        $public = 1;
                    }
                    
                    $query->update(
                        ['dcaseID'=> $dcaseID],
                        ['$set' =>
                            [
                                'dcaseID'=> $dcaseID,
                                'updateDay' => intval(date("YmdHis")),
                                'createDay' => intval(date("YmdHis")),
                                'title' => $title,
                                'member' => $member,
                                'public' => $public,
                                'original' => 
                                [
                                    "dcaseID" => $srcDCaseID,
                                    "commitTime" => $commitTime,
                                ],
                            ]
                        ],
                        ['multi' => true, 'upsert' => true]
                    );
                    $result = $mongo->executeBulkWrite( $dbName . '.' .$colName , $query);
                    
                    //add Parts
                    
                    foreach ($dcaseInfo->parts as $parts)
                    {
                        $query = new MongoDB\Driver\BulkWrite;
                        $query->update(
                            ['id'=> $parts->id],
                            ['$set' => $parts],
                            ['multi' => true, 'upsert' => true]
                        );
                        $result = $mongo->executeBulkWrite( 'dcaseParts.' . $dcaseID , $query);
                    }

                    if( $result->getUpsertedCount() == 1 || $result->getModifiedCount()==1 || $result->getMatchedCount() > 0)
                    {
                        $retMsg["result"] = 'OK';
                        $retMsg["dcaseID"] = $dcaseID;
                    }
                }    
            }
		}
	}
	echo( json_encode($retMsg) );
}
?>
