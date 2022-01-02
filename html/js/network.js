window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

app = angular.module('App', ['ui.router', 'ui.bootstrap' ]);
app.config(['$stateProvider', '$urlRouterProvider', '$httpProvider', 
function($stateProvider, $urlRouterProvider, $httpProvider)
{
	//POSTをPHPから見れるようにする
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
	/*
	ws.on("invite", function(data)
	{
		$scope.inviteDCase = data.value;
		$uibModal.open(
		{
			templateUrl:"alertInvite.html?" + Math.random(),
			scope: $scope,
			backdrop : false,
			controller: function($scope, $uibModalInstance)
			{
				$scope.ok = function() {
					var childWindow = window.open('about:blank');
					childWindow.location.href = "./editor.html?dcaseID=" + $scope.inviteDCase.dcaseID;
					childWindow = null;
					//location.href = "./editor.html?dcaseID=" + $scope.inviteDCase.dcaseID;
					$uibModalInstance.close();
				};
				$scope.cancel = function()
				{
					$uibModalInstance.dismiss('cancel');
				};
			}
		});
	});

	*/
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
		alert("このブラウザは、未対応です");
	}
	
	var html = angular.element(document).find('html')
	
	var simulation;
	var partsList = {};
	
	//ネットワーク全体のスクロール
	var startx = -1;
	var starty = -1;
	var scroll = d3.drag()
		.on("start", function()
		{
			startx = d3.event.x;
			starty = d3.event.y;
			simulation.alphaTarget(0.02).restart();
		})
		.on("drag", function()
		{
			offsetX += d3.event.x - startx;
			offsetY += d3.event.y - starty;
			startx = d3.event.x;
			starty = d3.event.y;
		})
		.on("end", function()
		{
			simulation.alphaTarget(0);
		});

	var svg = d3.select("#canvus").append("svg")
			//.call(scroll)
			.attr("width", "100%")
			.attr("height", "100%")
			.attr("transform","scale(" + scale + ")")
			.call(scroll)
			;

	function initSVG()
	{
		//svg.call(scroll);
		/*
		svg = d3.select("#canvus").append("svg")
			.call(scroll)
			.attr("width", "100%")
			.attr("height", "100%")
			.attr("transform","scale(" + scale + ")")
			;
		*/	
		var layoutWidth = parseInt( svg.style("width").replace( /px/g ,"" ) );
		var layoutHeight = parseInt( svg.style("height").replace( /px/g ,"" ) );
		var r = layoutWidth / 2;
		if( layoutHeight / 2 < r )
		{
			r = layoutHeight / 2;
		}
		
		simulation = d3.forceSimulation()
			.force("link", d3.forceLink().id(function(d) { return d.id; }))
			//.force("charge", d3.forceManyBody().strength(-5000).distanceMax(1000).distanceMin(5))
			.force("charge", d3.forceManyBody())
			.force("center", d3.forceCenter(layoutWidth / 2, layoutHeight / 2))
			.force("collide", d3.forceCollide().radius( function(d) { return(r/3); }).iterations(1))
		//.force("x", d3.forceX(10000))
		//.force("y", d3.forceY().strength(2))
			;
			//.iterations(20)
	}
	

	var graphInfo;
	$scope.userInfo = {};

	function loadConnection( user )
	{
		initSVG();
		var fd = new FormData();
		fd.append('authID', authID );
		fd.append('userID', user.userID );
		$scope.userInfo = user;
		$http.post('./api/getConnection.php',fd,{
			transformRequest: null,
			headers: {'Content-type':undefined}
		}).success(function(data, status, headers, config){
			console.log("loadConnection", data);
			if( data.result == "OK" )
			{
				drawNetwork( data.dcaseList );
			}
		});
	}



	//d3.json("network.json", (error, data) =>
	function drawNetwork( dcaseList )
	{
		var users = {};
		var userList = [];
		var linkList = [];
		var allNode = [];

		for( i in dcaseList)
		{
			var dcase = dcaseList[i];
			dcase.kind = 2;
			dcase.id = dcase.dcaseID;
			allNode.push( dcase );
			for( j in dcase.member)
			{
				user = dcase.member[j];
				users[user.userID] = 
				{
					"id" : user.userID,
					"userName" : user.userName,
					"kind" : 1,
				};
				linkList.push(
					{
						"source" : dcase.dcaseID,
						"target" : user.userID,
						"value" : 5,
						"position" : user.position,
					}
				);
			}
		}
		
		for( id in users)
		{
			var user = users[id];
			allNode.push( user );
			userList.push( user );
		}
		simulation.nodes(allNode)
				.on("tick", ticked);
		
		simulation.force("link").links(linkList);
		var link = svg.append("g")
			.attr("class", "links")
			.selectAll("line")
			.data(linkList)
			.enter().append("line")
			.attr("stroke-width", 2)
			.attr("stroke", function(d)
			{
				if(d.position==1)
				{
					return("blue");
				}else if(d.position==-1){
					return("red");
				}else{
					return("lightgray");
				}
			})
			;
		
	
		var drag = d3.drag()
				.on("start", dragstarted)
				.on("drag", dragged)
				.on("end", dragended);

		var dcaseNode = makeDCaseNode( svg, dcaseList, drag, openDCaseInfo );
		
		$timeout(function()
		{
			for(i in dcaseList)
			{
				var dcase = dcaseList[i];
				var moge = document.getElementById('dcaseNode_' + dcase.dcaseID);
				console.log(moge);
				moge.addEventListener("click",  function(){
			    console.log('反応した');
			  });
			}
		});
		var userNode = makeUserNode( svg, userList, drag, openUserInfo );

		function ticked()
		{
			link
				.attr("x1", function(d) { return offsetX + d.source.x; })
				.attr("y1", function(d) { return offsetY + d.source.y; })
				.attr("x2", function(d) { return offsetX + d.target.x; })
				.attr("y2", function(d) { return offsetY + d.target.y; });
			userNode.attr("transform", function(d)
			{
				return "translate("+  (offsetX +d.x) + "," + (offsetY +d.y) + ")";
			});
			//.attr("cx", function(d) { return( offsetX + d.x); })
			//.attr("cy", function(d) { return( offsetY + d.y); });

			dcaseNode.attr("transform", function(d)
			{
				return "translate("+  (offsetX +d.x) + "," + (offsetY +d.y) + ")";
			});
			//.attr("cx", function(d) { return( offsetX + d.x); })
			//.attr("cy", function(d) { return( offsetY + d.y); });
		}
	};
	
	var selectedNode = undefined;
	var selectedTime = undefined;
	function dragstarted(d)
	{
		selectedNode = d;
		var now = new Date();
		selectedTime = now.getTime();
		if( !d3.event.active )
		{
			simulation.alphaTarget(0.2).restart();
		}
		d.fx = d.x;
		d.fy = d.y;
	}

	function dragged(d)
	{
		
		d.fx = d3.event.x;
		d.fy = d3.event.y;
	}

	function dragended(d)
	{
		if( d === selectedNode)
		{
			var now = new Date();
			if( (now - selectedTime)  < 100 )
			{
				if(d.dcaseID !== undefined)
				{
					openDCaseInfo(d);
				}else{
					openUserInfo(d);
				}
			}
		}
		if( !d3.event.active )
		{
			simulation.alphaTarget(0);
		}
		d.fx = null;
		d.fy = null;
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
		});
	}

	function openDCaseInfo(d)
	{
		$scope.resultMsg = d.title;
		$scope.dcaseInfo = d;
		$uibModal.open(
		{
			templateUrl:"alertDetailInfo.html?" + Math.random(),
			scope: $scope,
			controller: function($scope, $uibModalInstance)
			{
				$scope.ok = function() {
					var childWindow = window.open('about:blank');
					childWindow.location.href = "./editor.html?dcaseID=" + $scope.dcaseInfo.dcaseID;
					childWindow = null;
					//location.href = "./editor.html?dcaseID=" + $scope.dcaseInfo.dcaseID;
					$uibModalInstance.close();
				};

				$scope.delete = function() {
					$uibModalInstance.close();
					$timeout(function()
					{
						dcaseDelete($scope.dcaseInfo);
					});
				};

				$scope.cancel = function()
				{
					$uibModalInstance.dismiss('cancel');
				};
			}
		});
	}

	function dcaseDelete(dcaseInfo)
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
						console.log(data);
						location.reload();
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

	function openUserInfo(d)
	{
		var fd = new FormData();
		fd.append('authID', authID );
		fd.append('userID', d.id );
		$http.post('./api/getUserInfo.php',fd,{
			transformRequest: null,
			headers: {'Content-type':undefined}
		}).success(function(data, status, headers, config){
			//console.log(data);
			if(data.result == "OK")
			{
				$scope.etcInfo = data.userInfo;
				if( $scope.userInfo.userID == d.id )
				{
					ownInfoDialog(d);
				}else{
					userInfoDialog(d);
				}
			}
		});
	}

	function ownInfoDialog(d)
	{
		//$scope.etcInfo = undefined;
		$scope.resultMsg = d.userName;
		$scope.target = d;
		$scope.ownFlag = false;
		$scope.iconImagePath = "./pic/user/" + d.id + ".jpg";
		if( d.id == $scope.userInfo.userID )
		{
			$scope.ownFlag = true;
		}

		$uibModal.open(
		{
			templateUrl:"alertOwnInfo.html?" + Math.random(),
			scope: $scope,
			controller: function($scope, $uibModalInstance)
			{
				$scope.ok = function()
				{
					var fd = new FormData();
					fd.append('authID', authID );
					if( $scope.etcInfo.passwd == "" || 
						$scope.etcInfo.passwd == undefined ||
						$scope.etcInfo.passwd != $scope.etcInfo.passwdAgain )
					{
						$scope.AlertMessage = $scope.lang.ErrorNoInputPassword;
						return;
					}

					fd.append('userID', $scope.etcInfo.userID );
					fd.append('mail', $scope.etcInfo.mail );
					fd.append('passwd', $scope.etcInfo.passwd );
					if($scope.etcInfo.lastName !== undefined)
					{
						fd.append('lastName', $scope.etcInfo.lastName);
					}else{
						fd.append('lastName', "");
					}
					if($scope.etcInfo.firstName !== undefined)
					{
						fd.append('firstName', $scope.etcInfo.firstName);
					}else{
						fd.append('firstName', "");;
					}
					fd.append('lastNameRubi', $scope.etcInfo.lastNameRubi);
					fd.append('firstNameRubi', $scope.etcInfo.firstNameRubi);
					fd.append('age', $scope.etcInfo.age);
					fd.append('group', $scope.etcInfo.group);
					fd.append('grade', $scope.etcInfo.grade);
					
					if($scope.iconImage  != undefined)
					{
						fd.append('iconImage', $scope.iconImage );
					}

					$http.post('./api/updateUserInfo.php',fd,{
						transformRequest: null,
						headers: {'Content-type':undefined}
					}).success(function(data, status, headers, config){
						console.log("update User", data);
						if(data.result == "OK")
						{

						}
					});
					//$uibModalInstance.close();
				};
				$scope.cancel = function()
				{
					$uibModalInstance.dismiss('cancel');
				};

				$scope.$watch("iconImage", function (iconImage)
				{
					$scope.iconImageSrc = undefined;
					if( !iconImage || !iconImage.type.match("image.*"))
					{
						return;
					}
					var reader = new FileReader();
					reader.onload = function ()
					{
						$scope.$apply(function ()
						{
							$scope.iconImageSrc = reader.result;
						});
					};
					reader.readAsDataURL(iconImage);
				});
			}
		});
	}

	function userInfoDialog(d)
	{
		//$scope.etcInfo = undefined;
		$scope.resultMsg = d.userName;
		$scope.target = d;
		$scope.ownFlag = false;
		$scope.iconImagePath = "./pic/user/" + d.id + ".jpg";
		if( d.id == $scope.userInfo.userID )
		{
			$scope.ownFlag = true;
		}

		$uibModal.open(
		{
			templateUrl:"alertUserInfo.html?" + Math.random(),
			scope: $scope,
			controller: function($scope, $uibModalInstance)
			{
				$scope.ok = function() {
					var memberList = [];
					memberList.push( $scope.target.id );
					createDCase( $scope.dcaseTitle, memberList );
					$uibModalInstance.close();
				};
				$scope.cancel = function()
				{
					$uibModalInstance.dismiss('cancel');
				};
			}
		});
	}
}]);