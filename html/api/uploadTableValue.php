<?PHP
require "./websocket_client.php";

header("Content-type: application/json; charset=UTF-8");
date_default_timezone_set('Asia/Tokyo');

require_once("./config.php");

main($_GET, $_POST);

function main($get, $post)
{
	$retMsg = array(
		"result" => "NG"
	);
	if( array_key_exists("dcaseID", $post) &&
		array_key_exists("partsID", $post) &&
		array_key_exists("data", $post) )
	{
		$mongoConfig = new MongoConfig();
		$mongo = $mongoConfig->getMongo();
		$dcaseID = $post["dcaseID"];
		$partsID = $post["partsID"];
		$data = json_decode( $post["data"] );

        // error_log(print_r($post, true));

        if( $sp = websocket_open("127.0.0.1", 3000,'',$errstr, 10, false) )
        {
            $jsonData = json_encode( [
                "mode" => "connected",  
                'dcaseID' => $dcaseID,
            ]);
            websocket_write($sp, $jsonData);
            $jsonData = json_encode([
                "mode" => "updateTable", 
                'dcaseID' => $dcaseID,
                'partsID' => $partsID,
                'tableInfo' => $data,
            ]);
            websocket_write($sp, $jsonData);
            websocket_close($sp);
            $retMsg["result2"] = 'OK';
        }

        $query = new MongoDB\Driver\BulkWrite;
        $query->update(
            ['id' => $partsID, ],
            ['$set' => [
                    "tableInfo" => $data,
                ], 
            ],
            ['multi' => true, 'upsert' => true]
        );
        
        $result = $mongo->executeBulkWrite( 'dcaseParts.' . $dcaseID , $query);
        if( $result->getUpsertedCount() == 1 || 
            $result->getModifiedCount()==1 || 
            $result->getMatchedCount() > 0)
        {
            $retMsg["result"] = 'OK';
        }
	}
	echo( json_encode($retMsg) );
}
?>
