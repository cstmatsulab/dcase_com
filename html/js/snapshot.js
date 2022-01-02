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
		//console.log($.param(data));
		return $.param(data);
	}
}]);

var selectedNode = null;

app.controller('SnapShot', 
['$scope', '$http', '$document', '$stateParams', '$uibModal', '$timeout', 
function($scope, $http, $document, $stateParams, $uibModal, $timeout )
{
	var authID = authEditor( $http, loadData );
	var param = getQuery()["param"];
	$scope.strToDate = strToDate;
	
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

    var dcaseID = param["dcaseID"];
    var snapshotTime = param["snapshotTime"];
    
	$scope.dcaseTitle = "";
	$scope.publicList = 
	[
		{
			name : "招待されたメンバーのみ",
			value : 0,
		},
		{
			name : "全てのユーザー",
			value : 1,
		},
		{
			name : "URLでアクセス可能",
			value : 2,
		},
	];

	console.log("dcaseID", dcaseID);
	console.log("snapshotTime", snapshotTime);
	function loadData(userInfo)
	{
		$scope.userInfo = userInfo;
		loadDCase();
		loadChatLog();
	}
	
	var dcaseInfo = {};
	var member = {};
	var dcase = {};
	var nodes = [];
	var links = [];
	var partsList = {};
	
	var defaultWidth = 180;
	var defaultHeight = 120;

	var viewDetailLen = 30;
	var lineNum = 5;
	
	var viewPort ={"scale": 1.0, "offsetX":0, "offsetY":0 };
	$scope.viewPort = viewPort;
	var device = checkEnv();
	
	if(device == "ie")
	{
		alert("このブラウザは、未対応です");
	}
	
	var html = angular.element(document).find('html')
	var cW = html[0].clientWidth

	var startScrollPoint = {x:0,y:0};
	var baseScrollPoint = {x:0,y:0};
	//ワークスペース全体のスクロール
	var scroll = d3.drag()
		.on("start", function()
		{
			startScrollPoint.x = d3.event.x;
			startScrollPoint.y = d3.event.y;
			baseScrollPoint.x = viewPort.offsetX;
			baseScrollPoint.y = viewPort.offsetY;
		})
		.on("drag", function()
		{
			viewPort.offsetX = baseScrollPoint.x + d3.event.x - startScrollPoint.x;
			viewPort.offsetY = baseScrollPoint.y + d3.event.y - startScrollPoint.y;
			d3.selectAll(".node")
				.attr("style", function(d)
				{
					return( webKitScale( d.x+viewPort.offsetX, d.y+viewPort.offsetY, viewPort.scale ) );
				});
			d3.selectAll(".link").attr("style", webKitScale( viewPort.offsetX, viewPort.offsetY, viewPort.scale ));
			d3.selectAll(".linkInner").attr("style", webKitScale( viewPort.offsetX, viewPort.offsetY, viewPort.scale ));
		})
		.on("end", function()
		{
		})
		;
		
	var drag = d3.drag()
		.on("start", dragstarted)
		.on("drag", dragged)
		.on("end",  dragended);
		
	var svg = d3.select("#canvus").append("svg")
		.attr("id", "svg")
		.attr("class", "svgStyle")
		.on("click", function()
		{
			if(selectedNode != null)
			{
				d3.select("#" + selectedNode.id)
					.selectAll(".SizePoint")
					.attr("style","display:none");
				selectedNode = null;
			}
			$timeout(function(){},0);
		})
		.call(scroll)
		;
	
	makeArrow( svg );
	/////////////////////////
	
    resizeCanvus();
    /*
                // debug
	$scope.url = location.href;
	if( dcaseID == "")
	{
		location.href = "./";
	}
	*/
	//JSON.stringify(partsList);//
	
	$scope.partsKind = partsKind;
	var layoutWidth = parseInt( svg.style("width").replace( /px/g ,"" ) );
	var layoutHeight = parseInt( svg.style("height").replace( /px/g ,"" ) );
		
	function loadChatLog()
	{
		$scope.chatLog = [];
		var fd = new FormData();
		fd.append('authID', authID );
		fd.append('dcaseID', dcaseID );
		$http.post('./api/loadChatLog.php',fd,{
			transformRequest: null,
			headers: {'Content-type':undefined}
		}).success(function(data, status, headers, config){
			//console.log( "loadChatLog", data);
			if(data.result == "OK")
			{
				$scope.chatLog = data.chatLog;
			}
		});
		
	}

	/////////////////////////////////////////////////
	function loadDCase()
	{
		$scope.permissionEdit = false;
		var fd = new FormData();
		fd.append('authID', authID );
		fd.append('dcaseID', dcaseID );
		fd.append('snapshotTime', snapshotTime );
		$http.post('./api/getSnapShot.php',fd,{
			transformRequest: null,
			headers: {'Content-type':undefined}
		}).success(function(data, status, headers, config){
			console.log( "getSnapShot.php", data );
			if(data.result == "OK")
			{
				setCookie("dcaseID", dcaseID, 90);
				dcaseInfo = data.dcase;
				$scope.dcaseTitle = dcaseInfo.title;
				
				dcase = {};
				nodes = [];
				links = [];
				partsList = {};

				for( key in dcaseInfo.parts )
				{
					var parts = dcaseInfo.parts[key];
					parts.viewPort = viewPort;
                    partsList[parts.id] = parts;
					parts.resize = partsKind[parts.kind].resize;
					parts.make = partsKind[ parts.kind ].make;
				}
				for( key in partsList )
				{
					var parts = partsList[key];
					parts.children = [];
					for( index in parts.childrenID )
					{
						var link = {};
						var target = partsList[ parts.childrenID[index] ];
						if(target !== undefined)
						{
							link.source = parts;
							link.target = target;
							links.push(link);
							parts.children.push( target );
							target.parent = parts;
						}else{
							console.log("error target not exist", parts.id, parts.childrenID[index] );
						}
					}
					//delete parts["childrenID"];
					nodes.push( partsList[key] );
				}
				
				for( key in partsList )
				{
					var parts = partsList[key];
					if( parts.parent === undefined)
					{
						dcase = parts;
						break;
					}
				}
				viewDCase(dcase);
			}else{
                // debug
				// location.href = "./";
			}
		});
	}
		
	$scope.btnScaleChange = function(value)
	{
		
		if(viewPort.scale + value > 0.2)
		{
			viewPort.scale += value;
			$scope.viewPort.scale = Math.round(viewPort.scale*100)/100;
			resizeCanvus();
			viewDCase();
		}
	}
	
	
	function startDragSize(d)
	{
		var scale = d.viewPort.scale;
		d.orWidth = d.width;
		d.orHeight = d.height;
		d.start = {
			"x": d3.event.x,
			"y": d3.event.y
		};
		d.basePoint = {
			"x": d.x + d.width*scale,
			"y": d.y + d.height*scale,
		};
	}
	
	
	function resizeCanvus()
	{
		svg.attr("width", "100%")
			.attr("height", "100%")
			//.attr("transform","scale(" + scale + ")")
			//.attr("style", webKitScale( offsetX, offsetY, scale ))
			//.style("margin-right", $scope.canvusSize)
			;
	}
	
	function viewDCase()
	{
		svg.selectAll(".node").remove();
		svg.selectAll(".link").remove();
		svg.selectAll(".linkInner").remove();
		
		var singlePathList = makePathList( links, 1 );
		if( singlePathList.length > 0 )
		{
			makePathSingle( svg, singlePathList, function(){} );
		}
		var doublePathList = makePathList( links, 0 );
		if( doublePathList.length > 0 )
		{
			makePathDouble( svg, doublePathList, function(){} );
		}
		
		for( kind in partsKind )
		{
			var nodeList = makePartsList( nodes, kind);
			if( nodeList.length > 0 )
			{
				createNode( dcaseID, svg, nodeList, nodeClickEvent, drag, endDragSize );
			}
		}
	}
	
	function nodeClickEvent( d )
	{
        nodeDoubleClick(d);
        $timeout(function(){},0);
	}
						
	// https://blog.htmlhifive.com/2015/05/12/web%e6%a5%ad%e5%8b%99%e3%82%b7%e3%82%b9%e3%83%86%e3%83%a0%e3%81%a7%e3%82%82%e4%bd%bf%e3%81%88%e3%82%8bwysiwyg%e3%82%a8%e3%83%87%e3%82%a3%e3%82%bfx10%e9%81%b8/
	function nodeDoubleClick( node )
	{
        var date = new Date();
        var now = date.getTime();
        if( node.clickTime !== undefined )
        {
            if( now - node.clickTime < 500)
            {
                $scope.editorConfig =
                {
                    btns:[
                        'viewHTML',
                        'fontSize',
                        'color',
                        'btnGrp-semantic',
                        'link',
                        'btnGrp-justify','btnGrp-lists',
                    ],
                    lang: "ja",
                    btnsDef: buttonDef,
                };
                
                $scope.detail = node.detail;
                $scope.resultMsg="内容";
                $uibModal.open(
                {
                    templateUrl:"alertPartsDetail.html?" + Math.random(),
                    scope: $scope,
                    backdrop : false,
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
        }
        node.clickTime = now;
	}
	
	var svgTagFrame = document.getElementById( "canvus" );
	var svgTagWidth = $("#canvus").width();
	var svgTagHeight = $("#canvus").height();
	function dragstarted(d)
	{
		d.moveFlag = false;
		svgTag = document.getElementById( "canvus" );
		svgTagWidth = $("#canvus").width();
		svgTagHeight = $("#canvus").height();
		d3.select("#" + d.id).attr("opacity",0.5);
		d3.select("#" + d.id).classed("dragging", true);
	}

	function dragged(d)
	{
		d.moveFlag = true;
		var pos = d3.mouse( svgTagFrame  );
		if( pos[0] > 0 && pos[1] > 0 && pos[0] < svgTagWidth && pos[1] < svgTagHeight )
		{
			//d.x = pos[0]/d.viewPort.scale;
			//d.y = pos[1]/d.viewPort.scale;
			d.x += d3.event.dx/d.viewPort.scale;
			d.y += d3.event.dy/d.viewPort.scale;
			moveTo(d);
			
			if( $scope.permissionEdit )
			{
				sendMoveTo( dcaseID, d );
			}
		}
	}

	function dragended(d)
	{
		d3.select("#" + d.id).classed("dragging", false);
		d3.select("#" + d.id).attr("opacity",1.0);
	}
	
	var makingWait = 0;
	//$scope.downloadBtn = "Image Download (Firefox非対応)";
	$scope.downloadBtn = "Image Download";
	$scope.getImage = function()
	{
		if(makingWait == 0)
		{
			$scope.downloadBtn = "Please wait";
			makingWait = 1;
			var svgTag = document.querySelector("svg");
			var svgData = new XMLSerializer().serializeToString(svgTag);
			var canvas = document.createElement("canvas");
			canvas.width = 3000;//svgTag.width.baseVal.value;
			canvas.height = 3000;//svgTag.height.baseVal.value;
			//var canvas = document.getElementById("c2");
			var ctx = canvas.getContext("2d");
			var image = new Image;
			image.src = "data:image/svg+xml;charset=utf-8;base64," + btoa(unescape(encodeURIComponent(svgData)));
			image.onload = function()
			{
				ctx.drawImage( image, 0, 0);
				var aTag = document.getElementById("imageDownload");
				aTag.href = canvas.toDataURL("image/png");
				aTag.setAttribute("download", "dcase.png");
			
				$timeout(function()
				{
					makingWait = 0;
					$scope.downloadBtn = "Image Download";
					aTag.click();
				}, 0);
			}
		}
	}
	

	function endDragSize(d)
	{
		d3.select("#" + d.id)
			.selectAll(".SizePoint")
			.attr("style","display:none");
		selectedNode = null;
	}
}]);

