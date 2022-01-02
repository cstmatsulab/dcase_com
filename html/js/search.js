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

app.controller('Search', 
['$scope', '$http', '$document', '$stateParams', '$uibModal', 'SharedScope', '$timeout', 
function($scope, $http, $document, $stateParams, $uibModal, SharedScope, $timeout )
{
	var authID = auth( $scope, $http );
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
    console.log(param["keyword"]);
    $scope.keyword = param["keyword"]
    if(param["keyword"] !== undefined)
    {
        search();
    }
	$scope.strToDate = strToDate;
	var cookieDcaseID = getCookie("dcaseID");
    
	$scope.search = function()
	{
        search();
    }

    function search()
    {
		var fd = new FormData();
		fd.append('authID', authID );
		fd.append('keyword', $scope.keyword );
		$http.post('./api/search.php',fd,{
			transformRequest: null,
			headers: {'Content-type':undefined}
		}).success(function(data, status, headers, config){
			console.log("search", data);
            $scope.partsList = data.partsList;
            console.log($scope.partsList );
		});
	}
}]);