var httpsURL = "https://" + getURLPath();
var httpURL = "http://" + getURLPath();

var Base64 = {
	encode: function(str)
	{
		return(
			btoa(unescape(encodeURIComponent(str)))
		);
	},
	// URLエンコード
	encodeURL: function(str)
	{
		return(
			encodeURIComponent(str)
		);
	},
	decode: function(str)
	{
		return(
			decodeURIComponent(escape(atob(str)))
		);
	},
	// URLエンコードのでデコード
	decodeURL: function(str)
	{
		return(
			decodeURIComponent(str)
		);
	},
};

// 現在アクセスしているURLの作成
function getURLPath()
{
	var pathList = location.pathname.split("/");
	var url = location.host;
	for( var i = 0; i <  pathList.length-1; i++ )
	{
		url += pathList[ i ] + "/";
	}
	return( url );
}

// web kitベースの環境課の判定
function useWebKit()
{
	var device = checkEnv();
	if(	device == "ipad" ||
		device == "iphone" ||
		device == "safari" ||
		device == "chrome" )
	{
		return(true);
	}
	return(false);
}

// ランダムな文字列の生成
function makeRandomString(len)
{
	//Math.seedrandom();
	var l = len; // 生成する文字列の長さ
	var c = "abcdefghijklmnopqrstuvwxyz0123456789"; // 生成する文字列に含める文字セット
	var cl = c.length;
	var r = "";
	for (var i = 0; i < l; i++)
	{
		r += c[Math.floor(Math.random() * cl)];
	}
	return(r);
}

// authIDの認証
function auth($scope, $http, callback, jumpURL )
{
	/*
	if( location.href.indexOf(httpURL) >= 0 )
	{
		location.href = location.href.replace(httpURL, httpsURL);
	}else{
	*/
		var authID = getCookie("authID");
		console.log("authID: ", authID );
		var fd = new FormData();
		fd.append('authID', authID );
		$http.post('./api/checkAuth.php',fd,{
			transformRequest: null,
			headers: {'Content-type':undefined}
		}).success(function(data, status, headers, config){
			console.log(data);
			if( data.result == "NG" )
			{
				var q = getQuery();
				if( location.href.indexOf("login.html") < 0 )
				{
					q['param']['base64url'] = Base64.encodeURL(location.href);
					param = makeParam(q['param']);
					// location.href = httpsURL + "login.html?" + param;
					location.href = "./login.html?" + param;
				}
			}else{
				$scope.userInfo = data.userInfo;
				setCookie("authID", authID, 1);
				
				if(callback !== undefined)
				{
					callback( $scope.userInfo );
				}
			}

			
		});
		return( authID );
	//}
	return( "" );
}

// editor用のauthIDの認証、認証できなくてもジャンプしない
function authEditor($http, callback, jumpURL )
{
	/*
	if( location.href.indexOf(httpURL) >= 0 )
	{
		location.href = location.href.replace(httpURL, httpsURL);
	}else{
	*/
		var authID = getCookie("authID");
		console.log("authID: ", authID );
		var fd = new FormData();
		fd.append('authID', authID );
		$http.post('./api/checkAuth.php',fd,{
			transformRequest: null,
			headers: {'Content-type':undefined}
		}).success(function(data, status, headers, config){
			console.log("authEditor", data);
			if( data.result == "OK" )
			{
				setCookie("authID", authID, 1);
			}
			if(callback !== undefined)
			{
				callback( data.userInfo );
			}
		});
		return( authID );
	//}
	return( "" );
}

// editor用のauthIDの認証、認証できなくてもジャンプしない
function authHistory($http, callback, jumpURL )
{
	/*
	if( location.href.indexOf(httpURL) >= 0 )
	{
		location.href = location.href.replace(httpURL, httpsURL);
	}else{
	*/
		var authID = getCookie("authID");
		console.log("authID: ", authID );
		var fd = new FormData();
		fd.append('authID', authID );
		$http.post('./api/checkAuth.php',fd,{
			transformRequest: null,
			headers: {'Content-type':undefined}
		}).success(function(data, status, headers, config){
			console.log(data);
			if( data.result == "OK" )
			{
				setCookie("authID", authID, 1);
			}
			if(callback !== undefined)
			{
				callback(0, data.userInfo);
			}
		});
		return( authID );
	//}
	return( "" );
}

// ブラウザの環境判定
function checkEnv()
{
	var uaName = "";
	var userAgent = window.navigator.userAgent.toLowerCase();
	var appVersion = window.navigator.appVersion.toLowerCase();
/*
	if (userAgent.indexOf('msie') != -1)
	{
		uaName = 'ie';
		/*
		if (appVersion.indexOf('msie 6.') != -1)
		{
			uaName = 'ie6';
		}else if(appVersion.indexOf('msie 7.') != -1) {
			uaName = 'ie7';
		}else if(appVersion.indexOf('msie 8.') != -1) {
			uaName = 'ie8';
		}else if(appVersion.indexOf('msie 9.') != -1) {
			uaName = 'ie9';
		}else if(appVersion.indexOf('msie 10.') != -1) {
			uaName = 'ie10';
		}
		
	}else */if(userAgent.indexOf('chrome') != -1){
		uaName = 'chrome';
	}else if(userAgent.indexOf('ipad') != -1){
		uaName = 'ipad';
	}else if(userAgent.indexOf('ipod') != -1) {
		uaName = 'ipod';
	}else if(userAgent.indexOf('iphone') != -1) {
		uaName = 'iphone';
		//var ios = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/);
		//uaName = [parseInt(ios[1], 10), parseInt(ios[2], 10), parseInt(ios[3] || 0, 10)];
	}else if(userAgent.indexOf('safari') != -1) {
		uaName = 'safari';
	}else if(userAgent.indexOf('firefox') != -1) {
		uaName = 'firefox';
	}else if(userAgent.indexOf('opera') != -1) {
		uaName = 'opera';
	}else if(userAgent.indexOf('android') != -1) {
		uaName = 'android';
	}else if(userAgent.indexOf('mobile') != -1) {
		uaName = 'mobile';
	}else{
		uaName = 'ie';
	}
	return( uaName );
}


function makeParam(paramList)
{
	var param = "";
	var on = 1;
	for(key in paramList)
	{
		if(on == 1)
		{
			on = 0;
		}else{
			param += "&";
		}
		param += key + "=" + paramList[key];
	}
	console.log(param);
	return( param );
}

function setCookie(c_name, value, expiredays)
{
	// pathの指定
	var path = location.pathname;
	// pathをフォルダ毎に指定する場合のIE対策
	var paths = new Array();
	paths = path.split("/");
	if(paths[paths.length-1] != ""){
		paths[paths.length-1] = "";
		path = paths.join("/");
	}
	// 有効期限の日付
	var extime = new Date().getTime();
	var cltime = new Date(extime + (60*60*24*1000*expiredays));
	var exdate = cltime.toUTCString();
	// クッキーに保存する文字列を生成
	var s="";
	s += c_name +"="+ escape(value);// 値はエンコードしておく
	s += "; path="+ path;
	if(expiredays){
		s += "; expires=" +exdate+"; ";
	}else{
		s += "; ";
	}
	// クッキーに保存
	document.cookie=s;
}

function getCookie(c_name)
{
	var st="";
	var ed="";
	if(document.cookie.length>0)
	{
		st=document.cookie.indexOf(c_name + "=");
		if(st!=-1){
			st=st+c_name.length+1;
			ed=document.cookie.indexOf(";",st);
			if(ed==-1) ed=document.cookie.length;
			// 値をデコードして返す
			return unescape(document.cookie.substring(st,ed));
		}
	}
	return "";
}
// クッキーの値をアラートで表示
function checkCookie()
{
	if(getCookie('testName')){
		var setName = getCookie('testName');
		alert(setName);
	}
}


var toZeroPadding = (function (Number, isNaN, Array)
{
	'use strict';
	function toZeroPadding (number, limit)
	{
		number = Number(number);
		if (isNaN(number))
		{
			return null;
		}
		return (Array(limit).join('0') + number).slice(-limit);
	}
	return toZeroPadding;
})(Number, isNaN, Array);

function strToDate( strDate )
{
	var dateObj = parseInt(strDate);
	var sec = dateObj % 100;
	dateObj = Math.floor( dateObj / 100 );
	var min = dateObj % 100;
	dateObj = Math.floor( dateObj / 100 );
	var hour = dateObj % 100;
	dateObj = Math.floor( dateObj / 100 );
	var day = dateObj % 100;
	dateObj = Math.floor( dateObj / 100 );
	var month = dateObj % 100;
	dateObj = Math.floor( dateObj / 100 );
	var year = dateObj;
	var str = year + "/" +  month + "/" +  day + " " +  hour + ":" +  min + ":" +  sec;
	var ret = new Date(str);
	return( ret );
}

function strToDateFormat( strDate )
{
	var dateObj = parseInt(strDate);
	var sec = dateObj % 100;
	dateObj = Math.floor( dateObj / 100 );
	var min = dateObj % 100;
	dateObj = Math.floor( dateObj / 100 );
	var hour = dateObj % 100;
	dateObj = Math.floor( dateObj / 100 );
	var day = dateObj % 100;
	dateObj = Math.floor( dateObj / 100 );
	var month = dateObj % 100;
	dateObj = Math.floor( dateObj / 100 );
	var year = dateObj;
	var str = year + "/" +  month + "/" +  day + " " +  hour + ":" +  min + ":" +  sec;
	return( str );
}

function calcDate(n, y,m,d)
{
	var n = parseInt(n);
	var nmsec = n * 1000 * 60 * 60 * 24; // 1日のミリ秒
	var msec = new Date(y, m, d).getTime();
	return new Date(msec + nmsec );
}

function calcHour(hour, y,m,d)
{
	var n = parseInt(hour);
	var nmsec = n * 1000 * 60 * 60;
	var msec = new Date(y, m, d).getTime();
	return new Date(msec + nmsec );
}

function calcMitute(min, y,m,d)
{
	var n = parseInt(min);
	var nmsec = n * 1000 * 60;
	var msec = new Date(y, m, d).getTime();
	return new Date(msec + nmsec );
}

function cleanAuthID()
{
	authID = "";
	setCookie("authID", "", 7);
	location.href = "./";
}

function getQuery()
{
	var result = {"query":""};
	var param = {};
	if( 1 < window.location.search.length )
	{
		var query = window.location.search.substring( 1 );
		result[ "query" ] = query;
		var parameters = query.split( '&' );
		for( var i = 0; i < parameters.length; i++ )
		{
			var element = parameters[ i ].split( '=' );
			var paramName = decodeURIComponent( element[ 0 ] );
			var paramValue = decodeURIComponent( element[ 1 ] );
			param[ paramName ] = paramValue;
		}
	}
	result["param"] = param;
	return( result );
}

function getLocalDate( strUTC )
{
	var utc = new Date(strUTC);
	now = new Date( utc.getTime() - (utc.getTimezoneOffset()*60*1000) );
	return( now );
}

function getUTCDate( strNow )
{
	var now = new Date(strNow);
	utcdate = new Date( now.getTime() + (now.getTimezoneOffset()*60*1000) );
	return( utcdate );
}

function getLang()
{
	var lang = (window.navigator.languages && window.navigator.languages[0]) ||
	  window.navigator.language ||
	  window.navigator.userLanguage ||
	  window.navigator.browserLanguage;
	return( lang );
}