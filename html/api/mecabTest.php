<?php

$option = array('-d', '/var/lib/mecab/dic/mecab-ipadic-neologd');
$mecab = new \MeCab\Tagger($option );
$str = '<div style="font-size:20pt;">ゴール戦略前提</div><font face="MS 明朝">テスト</font>';

var_dump($str);
$str = preg_replace('/<(".*?"|\'.*?\'|[^\'"])*?>/','', $str);
var_dump($str);
$str = preg_replace('/<("[^"]*"|\'[^\']*\'|[^\'">])*>/','', $str);
var_dump($str);
//$str = preg_replace('/<.*>/','', $str);
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
        }
    }
}
?>