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
			array_key_exists("member", $post) )
		{
			$dbName = "dcaseInfo";
			$colName = "dcaseList";
			
			$dcaseID = $post["dcaseID"];
			$title = $post["title"];
			$memberList = json_decode( $post["member"] );
			
			$mongoConfig = new MongoConfig();
			$mongo = $mongoConfig->getMongo();
			
            $filter = ['dcaseID'=> $dcaseID];
            $options = [
                'projection' => ['_id' => 0],
            ];
            $query = new MongoDB\Driver\Query( $filter, $options );
            $cursor = $mongo->executeQuery( $dbName . '.' . $colName  , $query);
        
            $checkList = [];
            $member = [];
            foreach ($cursor as $document)
            {
                $member = $document->member;
                foreach ($user as $document->member)
                {
                    $checkList[ $user->userID ] = 1;
                }
            }

            //メンバーの情報の取得
            $filter = ['userID'=> ['$in' => $memberList]];
            $options = [
                'projection' => ['_id' => 0],
                'sort' => ['lastNameRubi' => 1],
            ];
            $query = new MongoDB\Driver\Query( $filter, $options );
            $cursor = $mongo->executeQuery( 'UserInfo.UserList' , $query);
        
            foreach ($cursor as $document)
            {
                if( array_key_exists( $document->userID, $checkList) == false )
                {
                    $item = [];
                    $item["userID"] = $document->userID;
                    $item["userName"] = $document->lastName . " " . $document->firstName;
                    $item["position"] = 0;
                    $item["value"] = 5;
                    $member[] = $item;
                }
            }
			
            $query->update(
                ['dcaseID'=> $dcaseID],
                ['$set' =>
                    [
                        'dcaseID'=> $dcaseID,
                        'updateDay' => intval(date("YmdHis")),
                        'member' => $member,
                    ]
                ],
                ['multi' => true, 'upsert' => true]
            );
				
            $result = $mongo->executeBulkWrite( $dbName . '.' .$colName , $query);
            if( $result->getUpsertedCount() == 1 || $result->getModifiedCount()==1 || $result->getMatchedCount() > 0)
            {
                $retMsg["result"] = 'OK';
                $retMsg["dcaseID"] = $dcaseID;
            }
		}
	}
	echo( json_encode($retMsg) );
}
?>
