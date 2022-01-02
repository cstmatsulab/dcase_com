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

app.filter('lineBreak', function ($sce)
{
	return function (input, exp)
	{
		if(input !== undefined)
		{
			var replacedHtml = input.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&/, '&amp;');
			return( $sce.trustAsHtml(replacedHtml.replace(/\n/g, '<br />')) );
		}
		return("");
		/*
		var replacedHtml = input.replace(/"/g, '&quot;').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		return $sce.trustAsHtml(replacedHtml.replace(/\n|\r/g, '<br/>'));
		*/
	};
});

app.controller('Menu', 
['$scope', '$http', '$document', '$stateParams', '$uibModal', 'SharedScope', '$timeout', 
function($scope, $http, $document, $stateParams, $uibModal, SharedScope, $timeout )
{
	//SharedScope.setScope('Canvus', $scope);
	var param = getQuery()["param"];
	$scope.strToDate = strToDate;
	var cookieDcaseID = getCookie("dcaseID");
	var paramDcaseID = param["dcaseID"];
	$scope.cookieID = "";
	if( cookieDcaseID != "" )
	{
		$scope.cookieID = cookieDcaseID;
	}
	
	$scope.createDCase = function()
	{
		var fd = new FormData();
		//fd.append('title', tree.title );
		
		$http.post('./api/createDCase.php',fd,{
			transformRequest: null,
			headers: {'Content-type':undefined}
		}).success(function(data, status, headers, config){
			console.log(data);
			setCookie("dcaseID", data.dcaseID, 90);
			location.href = "./editor.html?dcaseID=" + data.dcaseID;
		});
	}
	$scope.editDCase = function()
	{
		setCookie("dcaseID", $scope.cookieID, 90);
		location.href = "./editor.html?dcaseID=" + $scope.cookieID;
	}
}]);
