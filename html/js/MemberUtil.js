var MemberUtil = class{
    constructor( dcaseID, authID, http, permission=false)
    {
        this.dcaseID = dcaseID;
        this.authID = authID;
        this.http = http;
        this.permission = permission;
    }
    
    loadChatLog = function()
	{
        var parent = this;
		return new Promise(function(resolve, reject)
        {
            var fd = new FormData();
            fd.append('authID', parent.authID );
            fd.append('dcaseID', parent.dcaseID );
            parent.http.post('./api/loadChatLog.php',fd,{
                transformRequest: null,
                headers: {'Content-type':undefined}
            }).success(function(data, status, headers, config){
                //console.log( "loadChatLog", data);
                if(data.result == "OK")
                {
                    resolve(data);
                }
            });
        });	
    }
}
/*
	function createDCase(node, title, memberList, public = 0)
	{
		memberList.push( $scope.userInfo.userID );
		
		var fd = new FormData();
		fd.append('authID', authID );
		fd.append('title', title );
		fd.append('public', public );
		fd.append('member', JSON.stringify(memberList) );
		
		$http.post('./api/createDCase.php',fd,{
			transformRequest: null,
			headers: {'Content-type':undefined}
		}).success(function(data, status, headers, config){
			setCookie("dcaseID", data.dcaseID, 90);
			var dcaseInfo =
			{
				"userID" : $scope.userInfo.userID,
				"owner" : $scope.userInfo.lastName + " " + $scope.userInfo.firstName,
				"member" : memberList,
				"dcaseID" : data.dcaseID,
				"title" : title,
			};
			socketio.emit("invite", dcaseInfo);
			var url = '<center><a href="./editor.html?dcaseID=' + data.dcaseID + '">他のDCaseへの<br/>リンク</a></center>';
			d3.selectAll( "#" + node.id + "_detail").html(function(d)
			{
				if( data.addonInfo !== undefined )
				{
					d.addonInfo = data.addonInfo;
				}
				var tableInfo = makeTableInfo(d.table);
				var addonTag = makeAddonTag(d);

				d.detail = url;
				sendChangeContent( dcaseID, d );
				saveNode( d );
				return(addonTag + d.detail + tableInfo);
			});
			location.href = "./editor.html?dcaseID=" + data.dcaseID;
		});
	}
	
	function openCreateDialog(node)
	{
		console.log(node.detail);
		if(node.detail != "")
		{
			$uibModal.open(
			{
				templateUrl:"alertLinkDCaseID.html?" + Math.random(),
				scope: $scope,
				controller: function($scope, $uibModalInstance)
				{
					$scope.ok = function() {
						//linkURL
						if( $scope.linkURL != ""  && $scope.linkURL !== undefined)
						{
							var url = '<center><a href="' + $scope.linkURL + '" target="' + $scope.linkURL + '">' + lang.LinkDCaseIDMsg +'</a></center>';
							console.log(url);
							d3.selectAll( "#" + node.id + "_detail").html(function(d)
							{
								d.detail = url;
								sendChangeContent( dcaseID, d );
								saveNode( d );
								return( d.detail );
							});
							$uibModalInstance.close();
						}
					};

					$scope.cancel = function()
					{
						$uibModalInstance.dismiss('cancel');
					};
				}
			});
		}else{
			$scope.memberList = [];
			$scope.authID = authID;
			
			$scope.publicList = 
			[
				{
					name : $scope.lang.ScopeModeInvite,
					value : 0,
				},
				{
					name : $scope.lang.ScopeModeAllUser,
					value : 1,
				},
				{
					name : $scope.lang.ScopeModePublic,
					value : 2,
				},
			];
			$scope.public = $scope.publicList[0];
		
			$uibModal.open(
			{
				templateUrl:"alertCreateNew.html?" + Math.random(),
				scope: $scope,
				controller: function($scope, $uibModalInstance)
				{
					$scope.ok = function() {
						console.log($scope.public)
						var member = []
						for(i in $scope.memberList)
						{
							member.push( $scope.memberList[i].userID );
						}
						createDCase( node, $scope.title, member, $scope.public.value );
						$uibModalInstance.close();
					};

					$scope.cancel = function()
					{
						$uibModalInstance.dismiss('cancel');
					};
					
					$scope.checkMember = function(user)
					{
						if(user.addFlag == false)
						{
							user.addFlag = true;
						}else{
							user.addFlag = false;
						}
					};
					
					$scope.searchKeydown = function(e)
					{
						if (e.which == 13)
						{
							$scope.searchUser();
						}
					}
					
					$scope.searchUser = function()
					{
						var fd = new FormData();
						fd.append('authID', $scope.authID );
						fd.append('keyword', $scope.keyword );
						$http.post('./api/searchUser.php',fd,{
							transformRequest: null,
							headers: {'Content-type':undefined}
						}).success(function(data, status, headers, config){
							$scope.searchResultList = data.data;
							for( i in $scope.searchResultList )
							{
								var same = false;
								var user = $scope.searchResultList[i];
								for( j in $scope.memberList )
								{
									if( $scope.memberList[j].userID == user.userID )
									{
										same = true;
									}
								}
								
								if( same )
								{
									$scope.searchResultList[i].addFlag=true;
								}else{
									$scope.searchResultList[i].addFlag=false;
								}
							}
						});
					}

					$scope.stateChange = function(user, $index)
					{
						if( user.addFlag )
						{
							deleteMember(user, $index);
						}else{
							addMember(user, $index);
						}
					}
					
					function addMember(user, $index)
					{
						user.addFlag=true;
						var same = false;
						for( j in $scope.memberList )
						{
							if( $scope.memberList[j].userID == user.userID )
							{
								same = true;
							}
						}
						
						if(same != true)
						{
							$scope.memberList.push( user );
						}
					}
					
					function deleteMember(user, $index)
					{
						user.addFlag=false;
						$scope.memberList.splice( $index, 1 );
					}
					
				}
			});
		}
    }
    function inviteUser()
	{
		if( $scope.permissionEdit )
		{
			$scope.memberList = [];
			$scope.authID = authID;
			$uibModal.open(
			{
				templateUrl:"alertAddMember.html?" + Math.random(),
				scope: $scope,
				controller: function($scope, $uibModalInstance)
				{
					$scope.ok = function() {
						var member = []
						for(i in $scope.memberList)
						{
							member.push( $scope.memberList[i].userID );
						}
						inviteMember( member );
						$uibModalInstance.close();
					};
					$scope.cancel = function()
					{
						$uibModalInstance.dismiss('cancel');
					};
					
					$scope.checkMember = function(user)
					{
						if(user.addFlag == false)
						{
							user.addFlag = true;
						}else{
							user.addFlag = false;
						}
					};
					
					$scope.searchKeydown = function(e)
					{
						if (e.which == 13)
						{
							$scope.searchUser();
						}
					}
					
					$scope.searchUser = function()
					{
						var fd = new FormData();
						fd.append('authID', $scope.authID );
						fd.append('keyword', $scope.keyword );
						$http.post('./api/searchUser.php',fd,{
							transformRequest: null,
							headers: {'Content-type':undefined}
						}).success(function(data, status, headers, config){
							console.log(data);
							$scope.searchResultList = data.data;
							for( i in $scope.searchResultList )
							{
								var same = false;
								var user = $scope.searchResultList[i];
								for( j in $scope.memberList )
								{
									if( $scope.memberList[j].userID == user.userID )
									{
										same = true;
									}
								}
								
								if( same )
								{
									$scope.searchResultList[i].addFlag=true;
								}else{
									$scope.searchResultList[i].addFlag=false;
								}
							}
						});
					}

					$scope.stateChange = function(user, $index)
					{
						if( user.addFlag )
						{
							deleteMember(user, $index);
						}else{
							addMember(user, $index);
						}
					}
					
					function addMember(user, $index)
					{
						user.addFlag=true;
						var same = false;
						for( j in $scope.memberList )
						{
							if( $scope.memberList[j].userID == user.userID )
							{
								same = true;
							}
						}
						
						if(same != true)
						{
							$scope.memberList.push( user );
						}
					}
					
					function deleteMember(user, $index)
					{
						user.addFlag=false;
						$scope.memberList.splice( $index, 1 );
					}
					
				}
			});
		}
	}

	function inviteMember($scope, member)
	{
		if( $scope.permissionEdit )
		{
			var fd = new FormData();
			fd.append('authID', authID );
			fd.append('dcaseID', dcaseID );
			fd.append('member', JSON.stringify(member) );
			$http.post('./api/addMember.php',fd,{
				transformRequest: null,
				headers: {'Content-type':undefined}
			}).success(function(data, status, headers, config){
				if(data.result=="OK")
				{
					if(data.newMember.length > 0)
					{
						var dcaseInfo =
						{
							"userID" : $scope.userInfo.userID,
							"owner" : $scope.userInfo.lastName + " " + $scope.userInfo.firstName,
							"member" : data.newMember,
							"dcaseID" : dcaseID,
							"title" : $scope.dcaseTitle,
						};
						sendInvite( dcaseInfo );
					}
				}
			});
		}
	}
*/