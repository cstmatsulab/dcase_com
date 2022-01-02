window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

app = angular.module('App', ['ui.router', 'ui.bootstrap', 'trumbowyg-ng' ]);
app.config(['$stateProvider', '$urlRouterProvider', '$httpProvider', 
function($stateProvider, $urlRouterProvider, $httpProvider)
{
	//POST��PHP���猩�����悤�ɂ���
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

var selectedNode = null;

app.controller('Login', 
['$scope', '$http', '$document', '$stateParams', '$uibModal', '$timeout', 
function($scope, $http, $document, $stateParams, $uibModal, $timeout )
{
	var param = getQuery()["param"];
	$scope.strToDate = strToDate;
	var authID = getCookie("authID");
	var url = param["url"];
	
	$scope.langTypeList = 
	[
		{
			type:"en",
			name:"English",
		},
		{
			type:"ja",
			name:"日本語",
		}
	];

	var langType = getLang();
	console.log("langType", langType);
	if( getCookie("lang") != "" && getCookie("lang") !== undefined )
	{
		langType = getCookie("lang");
	}
	var existLang = false;
	for(i in $scope.langTypeList)
	{
		if($scope.langTypeList[i].type == langType)
		{
			$scope.selectedLangType = $scope.langTypeList[i];
			existLang = true;
		}
	}
	if(existLang == false)
	{
		$scope.selectedLangType = $scope.langTypeList[0];
		langType = $scope.selectedLangType.type;
	}
	setCookie("lang", langType, 90);
	
	$scope.updateLangType = function()
	{
		setCookie("lang", $scope.selectedLangType.type, 90);
		location.href = "login.html?" + Math.random();
	}

	var langURL = "lang/" + langType + ".json";
	$scope.lang = {};
	$http.get( langURL ).success(function(data)
	{
		$scope.lang = data;
		//console.log( "lang", $scope.lang );
	});

	/////////////////////////////////////////////////
	$scope.login = function()
	{
		var fd = new FormData();
		fd.append('mail', $scope.mail );
		fd.append('passwd', $scope.passwd );
		$http.post('./api/login.php',fd,{
			transformRequest: null,
			headers: {'Content-type':undefined}
		}).success(function(data, status, headers, config){
			console.log(data);
			if(data.result == "OK")
			{
				setCookie("authID", data.authID, 1);
				if(param["base64url"] !== undefined)
				{
					//console.log( Base64.decodeURL(param["base64url"]) );
					location.href = Base64.decodeURL(param["base64url"]);
				}else{
					location.href = "./dcaseList.html";
				}
			}else{
				$scope.loginState = "認証に失敗しました";
			}
		});
	}

	
	$scope.loginKeydown = function(e)
	{
		if (e.which == 13)
		{
			$scope.login();
		}
	}
}]);

