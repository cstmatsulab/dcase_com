<?php

require_once("./config.php");
$mongoConfig = new MongoConfig();
$mongo = $mongoConfig->getMongo();

$filter = [];
$options = [
    'projection' => ['_id' => 0],
];
$query = new MongoDB\Driver\Query( $filter, $options );
$cursor = $mongo->executeQuery( 'dcaseInfo.dcaseList', $query);

$dcaseList = [];
foreach ($cursor as $document)
{   
    $dcaseList[] = $document->dcaseID;
}
var_dump($dcaseList);

$detailList = [];
foreach ($dcaseList as $dcaseID)
{   
    $filter = [];
    $options = [
        'projection' => ['_id' => 0],
    ];
    $query = new MongoDB\Driver\Query( $filter, $options );
    $cursor = $mongo->executeQuery( 'dcaseParts.' . $dcaseID , $query);
    foreach ($cursor as $parts)
    {
        if( array_key_exists("detail", $parts))
        {
            $detailList[] = [
                "dcaseID" => $dcaseID,
                "partsID" => $parts->id,
                "detail" => $parts->detail,
                "kind" => $parts->kind,
                "x" => $parts->x,
                "y" => $parts->y,
            ];
        }
    }
}
$option = array('-d', '/var/lib/mecab/dic/mecab-ipadic-neologd');
$mecab = new \MeCab\Tagger($option );
foreach ($detailList as $parts)
{
    $dcaseID = $parts["dcaseID"];
    $partsID = $parts["partsID"];
    $kind = $parts["kind"];
    $x = $parts["x"];
    $y = $parts["y"];
    $detailData = $parts["detail"];

    // 英語対応
    $line= mb_split(" ", $detailData);
    foreach ($line as $detail)
    {
        $str = $detail;
        $str = preg_replace('/<[^>]+>/','', $str);
        $str = preg_replace('/<(".*?"|\'.*?\'|[^\'"])*?>/','', $str);
        $str = preg_replace('/<("[^"]*"|\'[^\']*\'|[^\'">])*>/','', $str);
        
        $str = str_replace( array("\r\n", "\r", "\n"), "", $str );
        if (mb_strlen($str) == mb_strwidth($str))
        {
            $wordList = explode (" ",$str);
            foreach ($wordList as $word)
            {
                if($word == "")
                {
                    continue;
                }
                //半角
                $searchIndex = [
                    'dcaseID'=> $dcaseID,
                    'partsID'=> $partsID,
                    'word'=> $word,
                    'detail'=> $detail,
                    'kind'=> $kind,
                    'x'=> $x,
                    'y'=> $y,
                ];

                $query = new MongoDB\Driver\BulkWrite;
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
        }else{
            $nodes = $mecab->parseToNode( $str );

            foreach ($nodes as $n)
            {
                if ($n->getLength() > 0)
                {
                    $wordInfo = mb_split(",", $n->getFeature());
                    if($wordInfo[0]=="名詞" && $wordInfo[6]!="*")
                    {
                        $word = $wordInfo[6];
                        if($word == "")
                        {
                            continue;
                        }
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
        }
    }
}
/*
$str = "パーツを更新すると、インデックスも更新されます。";
$option = array('-d', '/var/lib/mecab/dic/mecab-ipadic-neologd');
$mecab = new \MeCab\Tagger($option );
$nodes = $mecab->parseToNode($str);
foreach ($nodes as $n)
{
    if ($n->getLength() > 0)
    {
        $wordInfo = mb_split(",", $n->getFeature());
        var_dump($wordInfo);
        #array_key_exists($sf, $uay) ? $uay[$sf]++ : $uay[$sf]= 1;  // 単語をキーにしてカウント
    }
}
*/
?>