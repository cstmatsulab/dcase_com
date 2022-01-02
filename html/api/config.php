<?PHP

mb_regex_encoding('UTF-8');
// qiita.com/y-hara/items/83a86655bba48dc8b140
// mongo admin -u dcase -p hogehoge
class MongoConfig
{
	public $server = "localhost";
	public $port = 27017;
	public $user = "";
	public $passwd = "hogehoge";
	
	function getMongo()
	{
		$authInfo = "";
		if( $this->user != "" )
		{
			$authInfo = $this->user + ":" + $this->passwd + "@";
		}
		
		$url = "mongodb://" . $authInfo . $this->server . ":" . $this->port;
		return( new MongoDB\Driver\Manager($url) );
	}
	
	
}

function auth( $authID, $mongo = null )
{
	$now = date("YmdHis");
	if( $mongo == null )
	{
		$mongoConfig = new MongoConfig();
		$mongo = $mongoConfig->getMongo();
	}
	
	$filter = [
		'authID'=> $authID, 
		'timeout' => ['$gte' => intval($now) ]
	];
	$options = [
		'projection' => ['_id' => 0],
		'sort' => ['_id' => -1],
	];
	$query = new MongoDB\Driver\Query( $filter, $options );
	$cursor = $mongo->executeQuery( 'UserInfo.Auth' , $query);
	$authInfo = null;
	foreach ($cursor as $document) {
		$authInfo = $document;
		break;
	}
	
	if( $authInfo != null )
	{
		if( $authInfo->authID == $authID )
		{
			$limit = intval(date("YmdHis",strtotime("+6 hour")));
			$query = new MongoDB\Driver\BulkWrite;
			$query->update(
				['authID'=> $authID],
				['$set' => [ 'timeout' => $limit, ] ],
				['multi' => true, 'upsert' => true]
			);
			$query->delete(
				['timeout' => ['$lte' => intval($now) ]],
				['limit' => 0]
			);
			
			$result = $mongo->executeBulkWrite( 'UserInfo.Auth' , $query);
			
			if( $result->getUpsertedCount() == 1 || $result->getModifiedCount()==1 || $result->getMatchedCount() > 0)
			{	
				$filter = ['userID'=> $authInfo->userID];
				$options = [
					'projection' => [
						'_id' => 0,
						'passwd' => 0,
						'salt' => 0,
					],
					'sort' => ['_id' => -1],
				];
				$query = new MongoDB\Driver\Query( $filter, $options );
				$cursor = $mongo->executeQuery( 'UserInfo.UserList' , $query);
				$userInfo = null;
				foreach ($cursor as $document) {
					$userInfo = $document;
					break;
				}
				$userInfo->authID  = $authID;
				return( $userInfo );
			}
		}
	}
	return( null );
}

function checkMember($mongo, $dcaseID, $userID)
{
	$filter = [ "dcaseID" => $dcaseID ];
	$options = [];

	$query = new MongoDB\Driver\Query( $filter, $options );
	$cursor = $mongo->executeQuery( 'dcaseInfo.dcaseList' , $query);

	foreach ($cursor as $document)
	{
		foreach( $document->member as $member )
		{
			if( $member->userID == $userID )
			{
				return( true );
			}
		}
	}
	return( false );
}

function updateTime($mongo, $dcaseID)
{
	$timeStmap = intval(date("YmdHis"));
	$query = new MongoDB\Driver\BulkWrite;
	
	$query->update(
		['dcaseID'=> $dcaseID ],
		['$set' => ['updateDay' => $timeStmap]],
		['multi' => true, 'upsert' => true]
	);
	$result = $mongo->executeBulkWrite( 'dcaseInfo.dcaseList' , $query);

}

function clearPosition($mongo, $dcaseID)
{
	$filter = ['dcaseID'=> $dcaseID ];
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
	foreach( $dcaseInfo->member as $member )
	{
		$member->position =  0;
	}
	$timeStmap = intval(date("YmdHis"));
	$dcaseInfo->updateDay = $timeStmap;

	$query = new MongoDB\Driver\BulkWrite;
	$query->update(
		['dcaseID'=> $dcaseID ],
		['$set' => $dcaseInfo ],
		['multi' => true, 'upsert' => true]
	);
	$result = $mongo->executeBulkWrite( 'dcaseInfo.dcaseList' , $query);

}
?>