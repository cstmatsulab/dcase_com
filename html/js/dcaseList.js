window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

app = angular.module('App', ['ui.router', 'ui.bootstrap' ]);
app.config(['$stateProvider', '$urlRouterProvider', '$httpProvider', 
function($stateProvider, $urlRouterProvider, $httpProvider)
{
	//POST��PHP���猩���悤�ɂ���
	$httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;application/json;charset=utf-8';
	$httpProvider.defaults.transformRequest = function(data)
	{
		if (data === undefined)
		{
			return(data);
		}
		//console.log($.param(data));
		return $.param(data);
	}
}]);

app.factory('SharedScope', function ($rootScope)
{
	var sharedScopes = {};
	return(
	{
		setScope: function(key, value)
		{
			sharedScopes[key] = value;
		},
		getScope: function(key)
		{
			return(sharedScopes[key]);
		}
	});
});

app.directive('fileModel',function($parse){
    return{
        restrict: 'A',
        link: function(scope,element,attrs){
            var model = $parse(attrs.fileModel);
            element.bind('change',function(){
                scope.$apply(function(){
                    model.assign(scope,element[0].files[0]);
                });
            });
        }
    };
});

app.controller('Network', 
['$scope', '$http', '$document', '$stateParams', '$uibModal', 'SharedScope', '$timeout', 
function($scope, $http, $document, $stateParams, $uibModal, SharedScope, $timeout )
{
	var authID = auth( $scope, $http, loadConnection );
	var langType = getLang();
	if( getCookie("lang") != "")
	{
		langType = getCookie("lang");
	}
	var langURL = "lang/" + langType + ".json";
	$scope.lang = {};
	$http.get( langURL ).success(function(data)
	{
		$scope.lang = data;
		//console.log( "lang", $scope.lang );
	});

	$scope.inviteDialogOpen = false;
	//SharedScope.setScope('Canvus', $scope);
	var param = getQuery()["param"];
	$scope.strToDate = strToDate;
	var cookieDcaseID = getCookie("dcaseID");
	var paramDcaseID = param["dcaseID"];
	
	var dcaseID = "";
	if( paramDcaseID !== undefined )
	{
		dcaseID = paramDcaseID;
	}else if( cookieDcaseID != "" ){
		dcaseID = cookieDcaseID;
	}
	
	var dcase = {};
	var nodes = [];
	var links = [];
	
	var offsetX = 0;
	var offsetY = 0;
	var scale = 1.0;
	
	var selectedNode = {};
	
	$scope.scale = scale;

	var device = checkEnv();
	if(device == "ie")
	{
		alert("���̃u���E�U�́A���Ή��ł�");
	}
	
	var html = angular.element(document).find('html')
	
	$scope.userInfo = {};

	function loadConnection( user )
	{
		$scope.userInfo = user;
		loadDCaseList();
		loadTemplateList();
	}

	
	function loadDCaseList()
	{
		var fd = new FormData();
		fd.append('authID', authID );
		fd.append('userID', $scope.userInfo.userID );

		$http.post('./api/getConnection.php',fd,{
			transformRequest: null,
			headers: {'Content-type':undefined}
		}).success(function(data, status, headers, config){
			if( data.result == "OK" )
			{
				console.log("dcaseList", data.dcaseList);
				$scope.sortKey = 'title';
				$scope.dcaseList = data.dcaseList;
			}
		});
	}

	$scope.filterTitle = "";
	$scope.filterTemplateTitle = "";
	$scope.orderDist = false;
	$scope.TemplateOrderDist = false;
	$scope.sortTitle = function(dist)
	{
		$scope.orderDist = dist;
		$scope.sortKey = 'title';
	}
	
	$scope.sortDate = function(dist)
	{
		$scope.orderDist = dist;
		$scope.sortKey = 'updateDay';
	}
	
	$scope.createNew = function()
	{
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
					createDCase( $scope.title, member, $scope.public.value );
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
					console.log($scope.authID);
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


	function createDCase(title, memberList, public = 0)
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
			console.log(data);
			setCookie("dcaseID", data.dcaseID, 90);
			var dcaseInfo =
			{
				"userID" : $scope.userInfo.userID,
				"owner" : $scope.userInfo.lastName + " " + $scope.userInfo.firstName,
				"member" : memberList,
				"dcaseID" : data.dcaseID,
				"title" : title,
			};
			var childWindow = window.open('about:blank');
			childWindow.location.href = "./editor.html?dcaseID=" + data.dcaseID;
			childWindow = null;

			loadDCaseList();
		});
	}

	$scope.dcaseDelete = function(dcaseInfo)
	{
		console.log(dcaseInfo);
		$scope.resultMsg = '"' + dcaseInfo.title + '"' + $scope.lang.RemoveAlert;
		$uibModal.open(
		{
			templateUrl:"alertYES_NO.html?" + Math.random(),
			scope: $scope,
			controller: function($scope, $uibModalInstance)
			{
				$scope.ok = function()
				{
					var fd = new FormData();
					fd.append('authID', authID );
					fd.append('dcaseID', dcaseInfo.dcaseID );
					fd.append('member', JSON.stringify( [$scope.userInfo.userID] ) );
					$http.post('./api/delMember.php',fd,{
						transformRequest: null,
						headers: {'Content-type':undefined}
					}).success(function(data, status, headers, config){
						console.log("delMember", data);
						loadDCaseList();
					});
					$uibModalInstance.close();
				};

				$scope.cancel = function()
				{
					$uibModalInstance.dismiss('cancel');
				};
			}
		});
	}

	$scope.updateUserInfo = function()
	{
		var childWindow = window.open('updateUserInfo');
		childWindow.location.href = "./updateUserInfo.html";
		childWindow = null;
	}

	
	function loadTemplateList()
	{
		var fd = new FormData();
		fd.append('authID', authID );
		fd.append('userID', $scope.userInfo.userID );

		$http.post('./api/getTemlateList.php',fd,{
			transformRequest: null,
			headers: {'Content-type':undefined}
		}).success(function(data, status, headers, config){
			console.log(data);
			if( data.result == "OK" )
			{
				$scope.templateList = data.templateList;
			}
		});
	}

	$scope.logout = function(item)
	{
		var fd = new FormData();
		fd.append('authID', authID );
		$http.post('./api/logout.php',fd,{
			transformRequest: null,
			headers: {'Content-type':undefined}
		}).success(function(data, status, headers, config){
			console.log("logout", data);
			location.href = "./";
		});
	}

	$scope.deleteTemplate = function(item)
	{
		$scope.resultMsg = '"' + item.name + '"' + $scope.lang.RemoveAlert;
		$uibModal.open(
		{
			templateUrl:"alertYES_NO.html?" + Math.random(),
			scope: $scope,
			controller: function($scope, $uibModalInstance)
			{
				$scope.ok = function()
				{
					var fd = new FormData();
					fd.append('authID', authID );
					fd.append('templateID', item.id );
					$http.post('./api/deleteTemplate.php',fd,{
						transformRequest: null,
						headers: {'Content-type':undefined}
					}).success(function(data, status, headers, config){
						console.log("deleteTemplate", data);
						loadTemplateList();
					});
					$uibModalInstance.close();
				};

				$scope.cancel = function()
				{
					$uibModalInstance.dismiss('cancel');
				};
			}
		});
	}

	$scope.search = function()
	{
		var childWindow = window.open('search');
		childWindow.location.href = "./search.html?keyword=" + $scope.keyword;
	}
	
}]);