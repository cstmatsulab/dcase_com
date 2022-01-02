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
            array_key_exists("title", $post) )
	    {
            $mongoConfig = new MongoConfig();
            $mongo = $mongoConfig->getMongo();
            $dcaseID = $post["dcaseID"];
            $title = $post["title"];
            $public = $post["public"];
			if( checkMember($mongo, $dcaseID, $userInfo->userID) )
			{
				$dcaseInfo = [];
				$dcaseInfo["title"] = $title;
				$dcaseInfo["public"] = $public;
				
				$query = new MongoDB\Driver\BulkWrite;
				$query->update(
					['dcaseID'=> $dcaseID ],
					['$set' => $dcaseInfo ],
					['multi' => true, 'upsert' => true]
				);
				clearPosition($mongo, $dcaseID);
				
				$result = $mongo->executeBulkWrite( 'dcaseInfo.dcaseList' , $query);
				
				if( $result->getUpsertedCount() == 1 || 
					$result->getModifiedCount()==1 || 
					$result->getMatchedCount() > 0)
				{
					$filter = ['dcaseID'=> $dcaseID];
					$options = [
						'projection' => ['_id' => 0],
						'sort' => ['_id' => -1],
					];
					$query = new MongoDB\Driver\Query( $filter, $options );
					$cursor = $mongo->executeQuery( 'dcaseInfo.dcaseList' , $query);

					$parentDcaseID = "";
					$parentPartsID = "";
					foreach ($cursor as $document)
					{
						$parentDcaseID = $document->parentDcaseID;
						$parentPartsID = $document->parentPartsID;
					}

					$detail =	'<center><a href="./editor.html?dcaseID=' .
							 $dcaseID .
							'" target="_blank">' . 
							$title . 
							'への<br/>リンク</a></center>';

					$query = new MongoDB\Driver\BulkWrite;
					$query->update(
						['id'=> $parentPartsID ],
						['$set' =>
							[
								"detail" => $detail,
							]
						],
						['multi' => true, 'upsert' => true]
					);
					
					$result = $mongo->executeBulkWrite( 'dcaseParts.' . $parentDcaseID , $query);

					$retMsg["result"] = 'OK';
				}
			}
        }
  	}
	echo( json_encode($retMsg) );
}
?>
