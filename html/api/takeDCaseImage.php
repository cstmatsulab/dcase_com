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
            $cmd = '/usr/local/bin/node /var/www/html/dcase/nodejs/drawGraph.js ' . $dcaseID . ' 2>/dev/null';
            $output = [];
            exec($cmd, $output);
            $imageInfo = json_decode($output[0]);
            $retMsg["result"] = 'OK';
            $fileName = $imageInfo->fileName;
            $timeStamp = $imageInfo->timeStamp;
            $retMsg["fileName"] = $fileName;

            if( array_key_exists("slackURL", $post) )
            {
                $slackURL = $post["slackURL"];
                if($slackURL != "")
                {
                    // memo: https://qiita.com/stkdev/items/992921572eefc7de4ad8

                    //$slackURL = "https://hooks.slack.com/services/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";
                    $protocol = empty($_SERVER['HTTPS']) ? 'http://' : 'https://';
                    $url = $protocol . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
                    $baseURL = str_replace("api/takeDCaseImage.php","", $url);
                    $apiURL = $baseURL . "api/getDCaseImage.php?dcaseID=" . $dcaseID . "&fileName=";

                    $mongoConfig = new MongoConfig();
                    $mongo = $mongoConfig->getMongo();

                    $filter = [ "dcaseID" => $dcaseID ];
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

                    $postData = [
                        "text" => "DCase CommunicatorからDCaseの画像が投稿されました",
                        "attachments" => [
                            [
                                "fields" => [
                                    [
                                        "title" => "タイトル: " . $dcaseInfo->title . " (" . $timeStamp .")",
                                        "value" => "URL: " . $baseURL . "editor.html?dcaseID=" . $dcaseID. "\n".
                                                    "SVG: " . $apiURL . str_replace(".jpg", ".svg", $fileName) . "\n",
                                    ]
                                ],
                                "image_url" => $apiURL . $fileName,
                            ]
                        ]
                    ];

                    $retMsg["postData"] = $postData;
                    $postData = json_encode($postData);
                    $header = array(
                        "Content-Type: application/x-www-form-urlencoded",
                        "Content-Length: ".strlen($postData)
                    );

                    $context = array(
                        "http" => array(
                            "method"  => "POST",
                            "header"  => implode("\r\n", $header),
                            "content" => $postData
                        )
                    );

                    $slackResult= file_get_contents($slackURL, false, stream_context_create($context));

                    $retMsg["slackResult"] = $slackResult;
                    if($retMsg["slackResult"]=="ok")
                    {
                        $dcaseInfo = [];
                        $dcaseInfo["slackURL"] = $slackURL;
                        $query = new MongoDB\Driver\BulkWrite;
                        $query->update(
                            ['dcaseID'=> $dcaseID ],
                            ['$set' => $dcaseInfo ],
                            ['multi' => true, 'upsert' => true]
                        );
                        $result = $mongo->executeBulkWrite( 'dcaseInfo.dcaseList' , $query);
				
                    }
                        
                }

            }

            if( array_key_exists("slackOAuth", $post) && array_key_exists("slackChannel", $post) )
            {
                $slackToken = $post["slackOAuth"];
                $slackChannel = $post["slackChannel"];
                $slackChannel = preg_replace("/^#(.*)/", "$1", $slackChannel);
                if($slackToken != "" && $slackChannel != "" )
                {

                    // memo: https://qiita.com/stkdev/items/992921572eefc7de4ad8

                    // OAuth Access Token: xoxp-1566519985137-1539148954423-1697094038309-ff2cb9d8c076ce4e8c3c31787c017eb3
                    $protocol = empty($_SERVER['HTTPS']) ? 'http://' : 'https://';
                    $url = $protocol . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
                    $baseURL = str_replace("api/takeDCaseImage.php","", $url);
                    $apiURL = $baseURL . "api/getDCaseImage.php?dcaseID=" . $dcaseID . "&fileName=";

                    $mongoConfig = new MongoConfig();
                    $mongo = $mongoConfig->getMongo();

                    $filter = [ "dcaseID" => $dcaseID ];
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

                    $header = array();
                    $header[] = 'Content-Type: multipart/form-data';
                    $file = new CurlFile( "/data/screenshot/" .  $dcaseID . "/" . $fileName , 'image/jpg');
                    $text = "タイトル: " . $dcaseInfo->title . " (" . $timeStamp .")\n" . 
                            "URL: " . $baseURL . "editor.html?dcaseID=" . $dcaseID. "\n".
                            "SVG: " . $apiURL . str_replace(".jpg", ".svg", $fileName) . "\n";

                    $postitems =  array(
                        'token' => $slackToken,
                        'channels' => $slackChannel,
                        'file' =>  $file,
                        'title' => "DCase CommunicatorからDCaseの画像が投稿されました",
                        'text' => $text,
                        'initial_comment' => $text,
                        'filename' => $fileName,
                    );
                    
                    $curl = curl_init();
                    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
                    curl_setopt($curl, CURLOPT_FAILONERROR, true);
                    curl_setopt($curl, CURLOPT_HTTPHEADER, $header);
                    curl_setopt($curl, CURLOPT_URL, "https://slack.com/api/files.upload");
                    curl_setopt($curl, CURLOPT_POST, 1);
                    curl_setopt($curl, CURLOPT_POSTFIELDS,$postitems);

                    
                    $body = curl_exec($curl);
                    $errno = curl_errno($curl);
                    $error = curl_error($curl);
                    curl_close($curl);

                    $slackRet = json_decode($body);
                    $retMsg["slackResult_fileUploadAPI"] = $slackRet;
                    if( $slackRet->ok )
                    {
                        $dcaseInfo = [];
                        $dcaseInfo["slackOAuth"] = $slackToken;
                        $dcaseInfo["slackChannel"] = $slackChannel;
                        $query = new MongoDB\Driver\BulkWrite;
                        $query->update(
                            ['dcaseID'=> $dcaseID ],
                            ['$set' => $dcaseInfo ],
                            ['multi' => true, 'upsert' => true]
                        );
                        $result = $mongo->executeBulkWrite( 'dcaseInfo.dcaseList' , $query);
                    }
                }

            }
        }
    }
	echo( json_encode($retMsg) );
}
?>
