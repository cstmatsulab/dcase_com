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
            array_key_exists("source", $post)  &&
            array_key_exists("target", $post) )
	    {
            // dcaseInfoを調べる
            $mongoConfig = new MongoConfig();
            $mongo = $mongoConfig->getMongo();
            $dcaseID = $post["dcaseID"];
            $source = $post["source"];
            $target = $post["target"];

            $filter = [ "id" => $source ];
			$options = [
				'projection' => ['_id' => 0],
			];

			$query = new MongoDB\Driver\Query( $filter, $options );
			$cursor = $mongo->executeQuery( 'dcaseParts.' . $dcaseID , $query);
			$parts = [];
			foreach ($cursor as $document)
			{
                $parts = $document;
				$exist = false;
    			foreach ($parts->childrenID as $child)
	    		{
                    if( $child == $target )
                    {
                        $exist = true;  
                    }
                }

                if( $exist == false )
                {
                    $parts->childrenID[] = $target;
                }
			}
            $query = new MongoDB\Driver\BulkWrite;
            $query->update(
				['id'=> $source ],
				['$set' => $parts ],
				['multi' => true, 'upsert' => true]
			);
			
            $result = $mongo->executeBulkWrite( 'dcaseParts.' . $dcaseID , $query);
			
            $query = new MongoDB\Driver\BulkWrite;
            $query->update(
				['id'=> $target ],
				['$set' => [
						"parent" => $source,
						"updateLinkTime" => intval(date("YmdHis")),
					]
				],
				['multi' => true, 'upsert' => true]
			);
            $result = $mongo->executeBulkWrite( 'dcaseParts.' . $dcaseID , $query);
			
			
			clearPosition($mongo, $dcaseID);

            if( $result->getUpsertedCount() == 1 || 
				$result->getModifiedCount()==1 || 
				$result->getMatchedCount() > 0)
			{
				$retMsg["result"] = 'OK';
			}
        }
  	}
	echo( json_encode($retMsg) );
}
?>
