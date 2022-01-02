window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

app = angular.module('App', ['ui.router', 'ui.bootstrap', 'trumbowyg-ng' ]);
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
		return $.param(data);
	}
}]);

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

app.controller('AddUser', 
['$scope', '$http', '$document', '$stateParams', '$uibModal', '$timeout', 
function($scope, $http, $document, $stateParams, $uibModal, $timeout )
{
    var authID = auth( $scope, $http, loadConnection );
    
	var param = getQuery()["param"];
	$scope.strToDate = strToDate;
	var authID = getCookie("authID");
	var url = param["url"];
	
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
	
	$scope.mail = "";
	$scope.passwd = "";
	$scope.lastName = "";
	$scope.firstName = "";
	$scope.lastNameRubi = "";
	$scope.firstNameRubi = "";
	$scope.age = "";
	$scope.group = "";
    $scope.grade = "";

    var userInfo = undefined;
    function loadConnection(user)
    {
        console.log("user", user);
        userInfo = user;
        $scope.mail = userInfo.mail;
    }
    $scope.currentPassword = "";
    $scope.passwd = "";
    $scope.passwd_again = "";
    $scope.mail = "";
    
	/////////////////////////////////////////////////
	$scope.addUser = function()
	{
		if( $scope.currentPassword != "" )
		{
			var fd = new FormData();
			fd.append('authID', authID );
			fd.append('currentPassword', $scope.currentPassword );

			if( $scope.passwd != "" &&
				$scope.passwd == $scope.passwd_again)
			{
				fd.append('passwd', $scope.passwd );
			}
			
			if($scope.mail != userInfo.mail)
			{
				fd.append('mail', $scope.mail );
			}
            if($scope.iconImage !== undefined)
            {
                fd.append('iconImage', $scope.iconImage );
            }

			$http.post('./api/updateUser.php',fd,{
				transformRequest: null,
				headers: {'Content-type':undefined}
			}).success(function(data, status, headers, config){
				console.log(data);
				if(data.result == "OK")
				{
					$scope.resultMsg = "登録が完了しました";
					$uibModal.open(
					{
						templateUrl:"alertOK.html?" + Math.random(),
						scope: $scope,
						controller: function($scope, $uibModalInstance)
						{
							$scope.ok = function() {
								$uibModalInstance.close();
							};
							$scope.cancel = function()
							{
								$uibModalInstance.dismiss('cancel');
							};
						}
					});
				}else{
					$scope.resultMsg = "登録ができませんでした";
					$uibModal.open(
					{
						templateUrl:"alertOK.html?" + Math.random(),
						scope: $scope,
						controller: function($scope, $uibModalInstance)
						{
							$scope.ok = function() {
								$uibModalInstance.close();
							};
							$scope.cancel = function()
							{
								$uibModalInstance.dismiss('cancel');
							};
						}
					});
				}
			});
		}else{
			$scope.state = "入力に誤りがあります";
		}
    }
	$scope.deleteCheck = false;
	$scope.deleteUser = function()
	{
		if( $scope.deleteCheck != "" )
		{
			var fd = new FormData();
			fd.append('authID', authID );

			$http.post('./api/deleteUser.php',fd,{
				transformRequest: null,
				headers: {'Content-type':undefined}
			}).success(function(data, status, headers, config){
				console.log(data);
				if(data.result == "OK")
				{
					$scope.resultMsg = "ユーザーの削除が完了しました";
					$uibModal.open(
					{
						templateUrl:"alertOK.html?" + Math.random(),
						scope: $scope,
						controller: function($scope, $uibModalInstance)
						{
							$scope.ok = function() {
								location.href = "./";
								$uibModalInstance.close();
							};
							$scope.cancel = function()
							{
								$uibModalInstance.dismiss('cancel');
							};
						}
					});
				}else{
					$scope.resultMsg = "登録ができませんでした";
					$uibModal.open(
					{
						templateUrl:"alertOK.html?" + Math.random(),
						scope: $scope,
						controller: function($scope, $uibModalInstance)
						{
							$scope.ok = function() {
								$uibModalInstance.close();
							};
							$scope.cancel = function()
							{
								$uibModalInstance.dismiss('cancel');
							};
						}
					});
				}
			});
		}else{
			$scope.stateDelete = "入力に誤りがあります";
		}
    }
	$scope.iconImageSrc = undefined;
	$scope.$watch("iconImage", function (iconImage)
	{
		$scope.iconImageSrc = undefined;
		if(!iconImage || !iconImage.type.match("image.*"))
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
}]);