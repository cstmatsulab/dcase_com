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

app.controller('Canvus', 
['$scope', '$http', '$document', '$stateParams', '$uibModal', '$timeout', 
function($scope, $http, $document, $stateParams, $uibModal, $timeout )
{
	//var authID = auth( $scope, $http, loadData );
    var authID = "**********************************************************";
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
	$scope.dcaseTitle = "";
	console.log(dcaseID);

	function loadData(userInfo)
	{
		$scope.userInfo = userInfo;
		serverConnect( dcaseID, userInfo.userID);
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
	
	$scope.addPartsKind = "";
	
	$scope.addPathFlag = 0;
	var addPathPoint = {};
	$scope.delPathFlag = 0;
	$scope.delPartsFlag = 0;
	$scope.AddPathMsg = "パスの追加";
	$scope.DelItemMsg = "パスの削除";
	$scope.DelPartsMsg = "部品の削除";
	
	var partsKind =
	{
		"Goal":
		{
			"name": "ゴール",
			"make": makeGoal,
			"resize": resizeGoal,
		},
		"Plan":
		{
			"name": "戦略",
			"make": makePlan,
			"resize": resizePlan,
		},
		"Suppose":
		{
			"name": "前提",
			"make": makeSuppose,
			"resize": resizeSuppose,
		},
		"Evidence":
		{
			"name": "証拠",
			"make": makeEvidence,
			"resize": resizeEvidence,
		},
		"Monitor":
		{
			"name": "モニタ",
			"make": makeMonitor,
			"resize": resizeMonitor,
		},
		"Unachieved":
		{
			"name": "未到達",
			"make": makeUnachieved,
			"resize": resizeUnachieved,
		},
		"External":
		{
			"name": "外部",
			"make": makeExternal,
			"resize": resizeExternal,
		}
	};
	
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
			if($scope.addPartsKind != "")
			{
				if(selectedNode != null)
				{
					d3.select("#" + selectedNode.id)
					.selectAll(".SizePoint")
					.attr("fill", "#111111");
					selectedNode = null;
				}
				var mousePos = d3.mouse(this);
				var pos = {};
				pos.x = mousePos[0] / viewPort.scale - viewPort.offsetX;
				pos.y = mousePos[1] / viewPort.scale - viewPort.offsetY;
				
				var id = "Parts_" + makeRandomString(8);
				while( partsList[id] !== undefined )
				{
					id = "Parts" + makeRandomString(8);
				}
				var parts = {
					"kind": $scope.addPartsKind,
					"id": id,
					"detail": "",
					"children": [],
					"x": pos.x,
					"y": pos.y,
					"width": defaultWidth,
					"height": defaultHeight,

					// add function
					"viewPort": viewPort,
					"make": partsKind[ $scope.addPartsKind ].make,
					"resize": partsKind[$scope.addPartsKind].resize,
				};
				partsList[id] = parts;
				nodes.push(parts);
				if( dcase.id === undefined )
				{
					dcase = parts;
				}
				sendCreateNode( dcaseID, parts );
				
				createNode( dcaseID, svg, [parts], nodeClickEvent, drag, endDragSize );
				saveCreateNode( parts );
				$scope.addPartsKind = "";
			}
			
			$timeout(function(){},0);
		})
		.call(scroll)
		;
	
	makeArrow( svg );
	/////////////////////////
	
	resizeCanvus();
	//$scope.url = location.href;
	if( dcaseID == "")
	{
		//location.href = "./";
	}
	loadDCase();
	loadChatLog();
	
	//JSON.stringify(partsList);//
	
	$scope.partsKind = partsKind;
	
	function loadChatLog()
	{
		$scope.chatLog = [];
		var fd = new FormData();
		
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
		var fd = new FormData();
		
		fd.append('dcaseID', dcaseID );
		$http.post('./api/loadDCase.php',fd,{
			transformRequest: null,
			headers: {'Content-type':undefined}
		}).success(function(data, status, headers, config){
			console.log( "loadDCase", data );
			if(data.result == "OK")
			{
				setCookie("dcaseID", dcaseID, 90);
				dcaseInfo = data.dcaseInfo;
				$scope.dcaseTitle = dcaseInfo.title;
				dcase = {};
				nodes = [];
				links = [];
				partsList = {};

				for( key in data.partsList )
				{
					var parts = data.partsList[key];
					parts.viewPort = viewPort;
					parts.resize = partsKind[parts.kind].resize;
					parts.make = partsKind[ parts.kind ].make;
					//if( useWebKit() )
					//{
					//	parts.x = parts.x + viewPort.offsetX*viewPort.scale;
					//	parts.y = parts.y + viewPort.offsetY*viewPort.scale;
					//}
					
					partsList[parts.id] = parts;
				}
				for( key in partsList )
				{
					var parts = partsList[key];
					parts.children = [];
					for( index in parts.childrenID )
					{
						var link = {};
						var target = partsList[ parts.childrenID[index] ];
						link.source = parts;
						link.target = target;
						links.push(link);
						parts.children.push( target );
						target.parent = parts;
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
				//location.href = "./";
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
	
	
	$scope.addPathBtn = function(key)
	{
		if($scope.addPathFlag == 0)
		{
			$scope.AddPathMsg = "親となる部品をクリック";
			$scope.addPathFlag = 1;
			addPathPoint = {};
		}else{
			$scope.AddPathMsg = "パスの追加";
			$scope.addPathFlag = 0;
			if( addPathPoint.source !== undefined )
			{
				d3.select("#" + addPathPoint.source.id).attr("stroke-width", 1);
			}
			addPathPoint = {};
		}
	}
	
	$scope.delPathBtn = function()
	{
		if( $scope.delPathFlag == 0 )
		{
			$scope.DelItemMsg = "削除するパスをクリック";
			$scope.delPathFlag = 1;
		}else{
			$scope.DelItemMsg = "パスの削除";
			$scope.delPathFlag = 0;
		}
	}
	
	$scope.delPartsBtn = function()
	{
		if( $scope.delPartsFlag == 0 )
		{
			$scope.DelPartsMsg = "削除する部品をクリック";
			$scope.delPartsFlag = 1;
		}else{
			$scope.DelPartsMsg = "部品の削除";
			$scope.delPartsFlag = 0;
		}
	}
	
	$scope.addPartsBtn = function(key)
	{
		if( $scope.addPartsKind == "" )
		{
			$scope.addPartsKind = key;
		}else{
			$scope.addPartsKind = "";
		}
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
			makePathSingle( svg, singlePathList, delLinkedPath );
		}
		var doublePathList = makePathList( links, 0 );
		if( doublePathList.length > 0 )
		{
			makePathDouble( svg, doublePathList, delLinkedPath );
		}
		
		for( kind in partsKind )
		{
			var nodeList = makePartsList( nodes, kind);
			if( nodeList.length > 0 )
			{
				createNode( dcaseID, svg, nodeList, nodeClickEvent, drag, endDragSize );
			}
		}
		
		if( addPathPoint.source !== undefined )
		{
			d3.select("#" + addPathPoint.source.id).attr("stroke-width", 5);
		}
	}
	
	socketio.on("createNode", function(data)
	{
		console.log("recv createNode");
		data.node.viewPort = viewPort;
		data.node.resize = partsKind[data.node.kind].resize;
		data.node.make = partsKind[ data.node.kind ].make;
		partsList[data.node.id] = data.node;
		nodes.push(data.node);
		var nodeList = [data.node];
		createNode( dcaseID, svg, nodeList, nodeClickEvent, drag, endDragSize );
	});
	
	//// WebSocket Callback //////////////////////////
	socketio.on("connected", function(name)
	{
		
	});
	socketio.on("disconnect", function(){
		
	});
	socketio.on("moveTo", function(node)
	{
		moveTo(node);
	});
	
	socketio.on("changeSize", function(data)
	{
		var node = partsList[data.id];
		node.width = data.width;
		node.height = data.height;
		node.resize( node );
		d3.selectAll("." + data.id).attr("d", makePathLine);
		updateInner(node)
	});
	
	socketio.on("deleteNode", function(data)
	{
		deleteNode( svg, partsList[ data.id ], partsList, nodes, links );
	});
	
	socketio.on("linkPath", function(data)
	{
		var link = {
			"source" : partsList[ data.source ],
			"target" : partsList[ data.target ],
		}
		links.push( link );
		if( checkLinkType(link) == 1 )
		{
			makePathSingle( svg, [ link ], delLinkedPath);
		}else{
			makePathDouble( svg, [ link ], delLinkedPath);
		}
	});
	
	socketio.on("unlinkPath", function(data)
	{
		unlinkPath( svg, partsList[data.source], partsList[data.target], links );
	});
	
	socketio.on("changeContent", function(data)
	{
		d3.selectAll( "#" + data.id + "_detail")
		.html(function(d)
		{
			d.detail = data.detail;
			if(d.detail == "")
			{
				var style = "font-size: 15px;";
				style += "background-color: rgba(255,255,255,0.0);";
				style += "border: 0px solid rgba(0,0,0,0.0);";
				style += "overflow: hidden;";
				style += "width: 100%;";
				style += "height: 100%;";
				style += "margin: 10px 10px 10px 10px;"
				style += "white-space: pre;white-space: pre-wrap;white-space: pre-line;white-space: -pre-wrap;white-space: -o-pre-wrap;white-space: -moz-pre-wrap;white-space: -hp-pre-wrap;word-wrap: break-word;";
				return("<pre class='preHTML' style='" + style +"'>ダブルクリックで\n内容の編集</pre>");
			}
			return( d.detail );
		});
	});

	//////////////////////////////
	
	function delLinkedPath( node )
	{
		if($scope.delPathFlag >0)
		{
			$scope.delPathFlag = 0;
			
			unlinkPath( svg, node.source, node.target, links );
			sendUnlinkPath( dcaseID, node.source.id, node.target.id );
			removeLinkPath( node.source.id, node.target.id );
			$scope.DelItemMsg = "パスの削除";
			$timeout(function(){},0);
		}
	}
	
	function delParts(node)
	{
		if($scope.delPartsFlag > 0 )
		{
			deleteNode( svg, node, partsList, nodes, links );
			sendDeleteNode( dcaseID, node );
			removeParts( node );

			$scope.delPartsFlag = 0;
			$scope.DelPartsMsg = "部品の削除";
		}
	}
	
	function nodeClickEvent( d )
	{
		if($scope.addPathFlag == 1)
		{
			d3.select("#" + d.id).attr("stroke-width", 5);
			$scope.AddPathMsg = "子となる部品をクリック";
			addPathPoint.source = d;
			if( d.children === undefined )
			{
				d.children = [];
			}
			$scope.addPathFlag++;
		}else if($scope.addPathFlag == 2){
			if( d.parent === undefined)
			{
				if( addPathPoint.source.id != d.id )
				{
					d.parent = addPathPoint.source;
					addPathPoint.source.children.push(d);
					addPathPoint.target = d;
					
					if( addPathPoint.target == dcase )
					{
						var root = addPathPoint.source;
						while(root.parent !== undefined)
						{
							root = root.parent;
						}
						dcase = root;
					}

					$scope.addPathFlag = 0;
					links.push(addPathPoint);
					
					if( checkLinkType(addPathPoint) == 1 )
					{
						makePathSingle(svg, [addPathPoint], delLinkedPath);
					}else{
						makePathDouble(svg, [addPathPoint], delLinkedPath);
					}
					
					d3.select("#" + addPathPoint.source.id).attr("stroke-width", 1);
					sendLinkPath( dcaseID, addPathPoint.source.id, addPathPoint.target.id );
					saveLinkPath( addPathPoint.source.id, addPathPoint.target.id );
					addPathPoint ={};
					$scope.AddPathMsg = "パスの追加";
				}
			}
		}else if($scope.delPartsFlag > 0 ){
			delParts(d);

		}else if(selectedNode == null){
			nodeDoubleClick(d);
			$timeout(function()
			{
				selectedNode = d;
				d3.select("#" + selectedNode.id)
				.selectAll(".SizePoint")
				.attr("style","display:inline");
			});
		}else{
			nodeDoubleClick(d);
			if(selectedNode.id != d.id)
			{
				$timeout(function()
				{
					selectedNode = d;
					d3.select("#" + selectedNode.id)
					.selectAll(".SizePoint")
					.attr("style","display:inline");
				});
			}
			d3.select("#" + selectedNode.id)
				.selectAll(".SizePoint")
				.attr("style","display:none");
			selectedNode = null;
		}
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
				console.log("node", node);
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
							d3.selectAll( "#" + node.id + "_detail")
							.html(function(d)
							{
								d.detail = $scope.detail;
								console.log("update", d.detail);
								sendChangeContent( dcaseID, d );
								saveContent( d );
								if(d.detail == "")
								{
									var style = "font-size: 15px;";
									style += "background-color: rgba(255,255,255,0.0);";
									style += "border: 0px solid rgba(0,0,0,0.0);";
									style += "overflow: hidden;";
									style += "width: 100%;";
									style += "height: 100%;";
									style += "margin: 10px 10px 10px 10px;"
									style += "white-space: pre;white-space: pre-wrap;white-space: pre-line;white-space: -pre-wrap;white-space: -o-pre-wrap;white-space: -moz-pre-wrap;white-space: -hp-pre-wrap;word-wrap: break-word;";
									return("<pre class='preHTML' style='" + style +"'>ダブルクリックで\n内容の編集</pre>");
								}
								return( d.detail );
							});
							$timeout(function(){});
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
		svgTag = document.getElementById( "canvus" );
		svgTagWidth = $("#canvus").width();
		svgTagHeight = $("#canvus").height();
		d3.select("#" + d.id).attr("opacity",0.5);
		d3.select("#" + d.id).classed("dragging", true);
	}

	function dragged(d)
	{
		var pos = d3.mouse( svgTagFrame  );
		if( pos[0] > 0 && pos[1] > 0 && pos[0] < svgTagWidth && pos[1] < svgTagHeight )
		{
			//d.x = pos[0]/d.viewPort.scale;
			//d.y = pos[1]/d.viewPort.scale;
			d.x += d3.event.dx/d.viewPort.scale;
			d.y += d3.event.dy/d.viewPort.scale;
			moveTo(d);
			sendMoveTo( dcaseID, d );
		}
	}

	function dragended(d)
	{
		saveMoveTo( d );
		d3.select("#" + d.id).classed("dragging", false);
		d3.select("#" + d.id).attr("opacity",1.0);
	}
    
    // http://bl.ocks.org/shimizu/c5c8ea2add273c83995983c540a53f2d
  
	$scope.getImage = function()
	{
        // http://tattii.hatenablog.com/entry/2013/09/19/073715
        // canvg('canvas', svg.)
	}
	
	$scope.sendChatMessage = function()
	{
		var fd = new FormData();
		
		fd.append('dcaseID', dcaseID );
		fd.append('message', $scope.chatMessage );
		$http.post('./api/saveChatLog.php',fd,{
			transformRequest: null,
			headers: {'Content-type':undefined}
		}).success(function(data, status, headers, config){
			console.log("sendChatMessage", data);
			if(data.result == "OK")
			{
				$scope.chatLog.unshift( data.line );
				sendChat( dcaseID, data.line );
			}
		});
	}
	
	function saveCreateNode( part )
	{
		var item = {};
		item.kind = part.kind;
		item.id = part.id;
		item.detail = part.detail;
		item.x = part.x;
		item.y = part.y;
		item.width = part.width;
		item.height = part.height;
		
		if( part.parent !== undefined )
		{
			item.parent = part.parent.id;
		}
		item.childrenID = [];
		for(childIndex in part.children)
		{
			var child = part.children[childIndex];
			item.childrenID.push(child.id);
		}
		
		var json = JSON.stringify(item);
		var fd = new FormData();
		
		fd.append('dcaseID', dcaseID );
		fd.append('partsID', item.id );
		fd.append('parts', json );
		$http.post('./api/updateParts.php',fd,{
			transformRequest: null,
			headers: {'Content-type':undefined}
		}).success(function(data, status, headers, config){
		});
	}

	function removeParts( node )
	{
		var fd = new FormData();
		
		fd.append('dcaseID', dcaseID );
		fd.append('partsID', node.id );
		$http.post('./api/removeParts.php',fd,{
			transformRequest: null,
			headers: {'Content-type':undefined}
		}).success(function(data, status, headers, config){
		});
	}

	function saveMoveTo( node )
	{
		var fd = new FormData();
		
		fd.append('dcaseID', dcaseID );
		fd.append('partsID', node.id );
		fd.append('x', node.x );
		fd.append('y', node.y );
		$http.post('./api/updateParts.php',fd,{
			transformRequest: null,
			headers: {'Content-type':undefined}
		}).success(function(data, status, headers, config){
		});
	}

	function saveLinkPath( source, target )
	{
		var fd = new FormData();
		
		fd.append('dcaseID', dcaseID );
		fd.append('source', source );
		fd.append('target', target );
		$http.post('./api/linkParts.php',fd,{
			transformRequest: null,
			headers: {'Content-type':undefined}
		}).success(function(data, status, headers, config){
			
		});
	}

	function removeLinkPath( source, target )
	{
		var fd = new FormData();
		
		fd.append('dcaseID', dcaseID );
		fd.append('source', source );
		fd.append('target', target );
		$http.post('./api/removeLink.php',fd,{
			transformRequest: null,
			headers: {'Content-type':undefined}
		}).success(function(data, status, headers, config){
			
		});
	}

	function saveContent( node )
	{
		var fd = new FormData();
		
		fd.append('dcaseID', dcaseID );
		fd.append('partsID', node.id );
		fd.append('detail', node.detail );
		$http.post('./api/updateParts.php',fd,{
			transformRequest: null,
			headers: {'Content-type':undefined}
		}).success(function(data, status, headers, config){
			console.log(data);
		});
	}

	function endDragSize(d)
	{
		d3.select("#" + d.id)
			.selectAll(".SizePoint")
			.attr("style","display:none");
		selectedNode = null;

		var fd = new FormData();
		
		fd.append('dcaseID', dcaseID );
		fd.append('partsID', d.id );
		fd.append('width', d.width );
		fd.append('height', d.height );
		$http.post('./api/updateParts.php',fd,{
			transformRequest: null,
			headers: {'Content-type':undefined}
		}).success(function(data, status, headers, config){
		});
	}

	$scope.updateTitle = function()
	{
		var fd = new FormData();
		
		fd.append('dcaseID', dcaseID );
		fd.append('title', $scope.dcaseTitle );
		$http.post('./api/updateTitle.php',fd,{
			transformRequest: null,
			headers: {'Content-type':undefined}
		}).success(function(data, status, headers, config){
			console.log(data);
			if(data.result == "OK")
			{
				//$scope.dcaseTitle = data.title;
			}
		});
	}

}]);

