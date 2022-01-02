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
        if( array_key_exists("keyword", $post) )
	    {
            $mongoConfig = new MongoConfig();
            $mongo = $mongoConfig->getMongo();
            $keyword = $post["keyword"];
            if (mb_strlen($keyword) == mb_strwidth($keyword))
            {
                $wordList = explode (" ",$keyword);
                foreach ($wordList as $word)
                {
                    $wordList[] = $word;
                    $filter = ["word" => '/'.$word.'/' ];
                    $filter = ["word" => $word ];
                    $options = [
                        'projection' => ['_id' => 0],
                    ];
                    $query = new MongoDB\Driver\Query( $filter, $options );
                    $cursor = $mongo->executeQuery( 'dcaseSearchIndex.Parts', $query);
                    foreach ($cursor as $parts)
                    {
                        $key = $parts->dcaseID . "-" . $parts->partsID;
                        if( array_key_exists($key, $partsList) )
                        {
                            $partsList[$key]["word"][$word] = 1;
                            #$partsList[$key]["count"] = count($partsList[$key]["word"]);
                        }else{
                            $detail = $parts->detail;
                            $detail = preg_replace('/<[^>]+>/','', $detail);
                            $detail = preg_replace('/<(".*?"|\'.*?\'|[^\'"])*?>/','', $detail);
                            $detail = preg_replace('/<("[^"]*"|\'[^\']*\'|[^\'">])*>/','', $detail);
                            $partsList[$key] = [
                                "dcaseID" => $parts->dcaseID,
                                "partsID" => $parts->partsID,
                                "word" => [$word => 1, ],
                                "detail" => $detail,
                                "kind" => $parts->kind,
                                "x" => $parts->x,
                                "y" => $parts->y,
                            ];
                        }
                    }
                }
            }else{
                $option = array('-d', '/var/lib/mecab/dic/mecab-ipadic-neologd');
                $mecab = new \MeCab\Tagger($option);
                $nodes = $mecab->parseToNode($keyword);
                $partsList = [];
                $wordList = [];
                foreach ($nodes as $n)
                {
                    if ($n->getLength() > 0)
                    {
                        $wordInfo = mb_split(",", $n->getFeature());
                        if($wordInfo[0]=="名詞" && $wordInfo[6]!="*")
                        {
                            $word = $wordInfo[6];
                            $wordList[] = $word;
                            $filter = ["word" => '/'.$word.'/' ];
                            $filter = ["word" => $word ];
                            $options = [
                                'projection' => ['_id' => 0],
                            ];
                            $query = new MongoDB\Driver\Query( $filter, $options );
                            $cursor = $mongo->executeQuery( 'dcaseSearchIndex.Parts', $query);
                            foreach ($cursor as $parts)
                            {
                                $key = $parts->dcaseID . "-" . $parts->partsID;
                                if( array_key_exists($key, $partsList) )
                                {
                                    $partsList[$key]["word"][$word] = 1;
                                    #$partsList[$key]["count"] = count($partsList[$key]["word"]);
                                }else{
                                    $detail = $parts->detail;
                                    $detail = preg_replace('/<[^>]+>/','', $detail);
                                    $detail = preg_replace('/<(".*?"|\'.*?\'|[^\'"])*?>/','', $detail);
                                    $detail = preg_replace('/<("[^"]*"|\'[^\']*\'|[^\'">])*>/','', $detail);
                                    $partsList[$key] = [
                                        "dcaseID" => $parts->dcaseID,
                                        "partsID" => $parts->partsID,
                                        "word" => [$word => 1, ],
                                        "detail" => $detail,
                                        "kind" => $parts->kind,
                                        "x" => $parts->x,
                                        "y" => $parts->y,
                                    ];
                                }
                            }
                        }
                    }
                }    
            }
            usort($partsList, function($a, $b)
            {
                if( count($a["word"]) > count($b["word"]) )
                {
                    return -1;
                }
                
                return 1;
            });
            $retMsg["partsList"] = $partsList;
            $retMsg["wordList"] = $wordList;
            $retMsg["result"] = "OK";
        }
    }

    echo( json_encode($retMsg) );
}
?>