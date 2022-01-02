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
            array_key_exists("partsID", $post) )
	    {
            // dcaseInfoを調べる
            $mongoConfig = new MongoConfig();
            $mongo = $mongoConfig->getMongo();
            $dcaseID = $post["dcaseID"];
            $partsID = $post["partsID"];
            
            if( checkMember($mongo, $dcaseID, $userInfo->userID) )
			{
                $existParts = false;
                $updateTimeStamp = false;
                $flag = 0;
                if( array_key_exists("parts", $post) )
                {
                    $parts = json_decode($post["parts"], true);
                    $existParts = true;
                }else{
                    $filter = [ "id" => $partsID ];
                    $options = [
                        'projection' => ['_id' => 0],
                    ];

                    $query = new MongoDB\Driver\Query( $filter, $options );
                    $cursor = $mongo->executeQuery( 'dcaseParts.' . $dcaseID , $query);

                    foreach ($cursor as $document)
                    {   
                        $existParts = true;
                    }

                    $parts = ['id' => $partsID,];
                    if( array_key_exists("detail", $post) )
                    {
                        $parts["detail"] = $post["detail"];
                $flag = 1;
                    }
                    
                    if( array_key_exists("x", $post) )
                    {
                        $parts["x"] = intval( $post["x"] );
                        $parts["y"] = intval( $post["y"] );
                        $updateTimeStamp = true;
                $flag = 2;
                    }
                    
                    if( array_key_exists("width", $post) )
                    {
                        $parts["width"] = intval($post["width"]);
                        $parts["height"] = intval($post["height"]);
                        $updateTimeStamp = true;
                $flag = 3;
                    }

                    // $parts["flag"] = $flag;

                }
                

                if($existParts)
                {
                    if( $updateTimeStamp )
                    {
                        updateTime( $mongo, $dcaseID );
                    }else{
                        clearPosition($mongo, $dcaseID);
                    }
                    
                    $parts["updateTime"] = intval(date("YmdHis"));
                    //if( property_exists($parts, 'updateLinkTime') == false)
                    if( array_key_exists('updateLinkTime', $parts) == false)
                    {
                        $parts["updateLinkTime"] = -1;
                    }

                    $query = new MongoDB\Driver\BulkWrite;
                    $query->update(
                        ['id'=> $partsID ],
                        ['$set' => $parts ],
                        ['multi' => true, 'upsert' => true]
                    );
                    
                    $result = $mongo->executeBulkWrite( 'dcaseParts.' . $dcaseID , $query);
                    
                    if( $result->getUpsertedCount() == 1 || 
                        $result->getModifiedCount()==1 || 
                        $result->getMatchedCount() > 0)
                    {
                        $kind = $parts["kind"];
                        $x = $parts["x"];
                        $y = $parts["y"];
                        $detail = $parts["detail"];

                        $str = preg_replace('/<("[^"]*"|\'[^\']*\'|[^\'">])*>/','', $detail);
                        $option = array('-d', '/var/lib/mecab/dic/mecab-ipadic-neologd');
                        $mecab = new \MeCab\Tagger($option);
                        $nodes = $mecab->parseToNode( $str );
                        $retMsg["searchIndex"] = [];
                        foreach ($nodes as $n)
                        {
                            if ($n->getLength() > 0)
                            {
                                $wordInfo = mb_split(",", $n->getFeature());
                                if($wordInfo[0]=="名詞" && $wordInfo[6]!="*")
                                {
                                    $word = $wordInfo[6];
                                    $query = new MongoDB\Driver\BulkWrite;
                                    $searchIndex = [
                                        'dcaseID'=> $dcaseID,
                                        'partsID'=> $partsID,
                                        'word'=> $word,
                                        'detail'=> $detail,
                                        'kind'=> $kind,
                                        'x'=> $x,
                                        'y'=> $y,
                                    ];
                                    $retMsg["searchIndex"][] = $searchIndex;
                                    $query->update(
                                        [
                                            'dcaseID'=> $dcaseID,
                                            'partsID'=> $partsID,
                                            'word'=> $word,
                                        ],
                                        ['$set' => $searchIndex],
                                        ['multi' => true, 'upsert' => true]
                                    );
                                    $result = $mongo->executeBulkWrite( 'dcaseSearchIndex.Parts' , $query);
                                }
                            }
                        }
                        $retMsg["result"] = 'OK';
                        $retMsg["parts"] = $parts;
                    }
                }
            }
        }
  	}
	echo( json_encode($retMsg) );
}
?>
