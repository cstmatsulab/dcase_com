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
	var authID = authEditor( $http, loadData );

	// document.cookie = "authID=" + authID;
	console.log(document.cookie);

	var param = getQuery()["param"];
	$scope.strToDate = strToDate;
	var intervalTime = 30;
	var langType = getLang();
	if( getCookie("lang") != "")
	{
		langType = getCookie("lang");
	}

	$scope.runMode = "dynamic";
	var runFlag = true;
	$scope.updateRunMode = function()
	{
		if($scope.runMode == "dynamic")
		{
			$scope.runMode = "editor";
			runFlag = false;
			
		}else{
			$scope.runMode = "dynamic";
			runFlag = true;
		}

		viewDCase();
		dcaseAPI.changeNodeDisplay(runFlag);
		dcaseAPI.changePathDisplay(runFlag);
	}

	var langURL = "lang/" + langType + ".json";
	$scope.lang = {};
	var lang = {};

	$http.get( langURL ).success(function(data)
	{
		$scope.lang = data;
		lang = $scope.lang;
		
		$scope.AddPathMsg = lang.AddPath;
		$scope.DelItemMsg = lang.DelBtnMessage;
		dcaseParts.updateLang(lang);
		//console.log( "lang", $scope.lang );
	});

	var cookieDcaseID = getCookie("dcaseID");
	var paramDcaseID = param["dcaseID"];
	var baseX = 0;
	var baseY = 0;
	
	/*
	var svgTagFrame = document.getElementById( "canvus" );
	var svgTagWidth = $("#canvus").width();
	var svgTagHeight = $("#canvus").height();
	console.log("svgTagWidth", svgTagWidth);
	*/
	if(param["x"] !== undefined)
	{
		baseX = -parseInt(param["x"]) + $("#canvus").width()/2;
	}
	
	if(param["y"] !== undefined)
	{
		baseY= -parseInt(param["y"]) + $("#canvus").height()/2;
	}

	initParts = param["partsID"];


	var dcaseID = "";
	if( paramDcaseID !== undefined )
	{
		dcaseID = paramDcaseID;
	}else if( cookieDcaseID != "" ){
		dcaseID = cookieDcaseID;
	}
	$scope.url = location.href;
	if( dcaseID == "")
	{
		location.href = "./";
	}
	
	// init lib
	
	//var viewPort ={"scale": 1.0, "offsetX":0, "offsetY":0 };
	var viewPort ={"scale": 1.0, "offsetX":baseX, "offsetY":baseY };
	$scope.viewPort = viewPort;

	var dbApi = new DBApi(dcaseID, authID, $http );
	var dcaseParts = new DcaseParts();
	var dcaseAPI = new DCaseAPI( dcaseParts, viewPort );

	var uri = "";
	if( location.protocol == "https:" )
	{
		uri = "wss://";
	}else{
		uri = "ws://";
	}
	
	uri += location.host + location.pathname.replace("editor.html", "") + "websocket/";
	console.log("uri", uri);
	var ws = new WebSocket(uri);
	ws.onopen = function () {
		
		sendMsg.serverConnect( dcaseID ); //, $scope.userInfo.userID);
		console.log('WebSocket onopen ');
	};
	
	ws.onerror = function (error)
	{
		alert('WebSocket Error ', error);
		console.log('WebSocket Error ', error);
	};

	ws.onclose = function (error)
	{
		console.log('WebSocket Close ' + error);
	};

	var recvMsg = new RecvMessage( dcaseAPI, dcaseParts);
	ws.onmessage = function (msg)
	{
		// console.log('WebSocket recv', msg.data);
		var data = JSON.parse( msg.data );
		if( data.mode == "createNode" )
		{
			var childrenID = data.node.childrenID;
			recvMsg.deleteNodeForPrep(data, partsList, nodes, links, runFlag);
			
			var node = recvMsg.createNode( data, partsList, nodeClickEvent, drag, draggedSize, dragendedSize );
			var exist = false;
			for(var i in nodes)
			{
				var target = nodes[i];
				if(node.id == target.id)
				{
					exist = true;
				}
			}
			if(exist == false)
			{
				nodes.push(node);
				partsList[node.id] = node;
			}else{
				var target = partsList[node.id];
				target.apiFlag = node.apiFlag;
				target.apiHidden = node.apiHidden;
			}
			if(node.parent !== undefined)
			{
				if(partsList[ node.parent.id ] !== undefined)
				{
					dcaseAPI.linkParts( partsList[ node.parent.id ] ,node );
				}
	
			}

			for(var idx in childrenID)
			{
				var childID = childrenID[idx];
				if(partsList[ childID ] !== undefined)
				{
					dcaseAPI.linkParts( node, partsList[ childID ]);
				}
			}
			
			dcaseAPI.changeNodeDisplay(runFlag);
			dcaseAPI.changePathDisplay(runFlag);
		}
		else if(data.mode == "moveTo" ){ recvMsg.moveTo(data); }
		else if(data.mode == "changeSize" ){ recvMsg.changeSize(data, partsList); }
		else if(data.mode == "updateTable" ){ recvMsg.updateTable(data, $scope.lang); }
		else if(data.mode == "nodeStyle" ){ 
			recvMsg.nodeStyle(data); }
		else if(data.mode == "deleteNode" ){ recvMsg.deleteNode(data, partsList, nodes, links, runFlag); }
		else if(data.mode == "linkPath" ){ recvMsg.linkPath(data, partsList, links); }
		else if(data.mode == "unlinkPath" ){ recvMsg.unlinkPath(data, partsList, links); }
		else if(data.mode == "changeContent" ){ recvMsg.changeContent(data); }
		else if(data.mode == "nodeState" ){
			var item = partsList[data.id];
			var flag = data.hiddenFlag;
			var apiHidden = data.apiHidden;
			recvMsg.nodeState(item, flag, apiHidden, runFlag);

			dcaseAPI.changeNodeDisplay(runFlag);
			dcaseAPI.changePathDisplay(runFlag);
		}
		else if(data.mode == "updateNode" ){ node = recvMsg.updateNode(data, partsList); }
	}

	function ping()
	{
		var sendData = {
			"mode":"ping",
			"dcaseID": dcaseID,
		};
		ws.send( JSON.stringify(sendData) );
		$timeout(ping, 10*1000);
	}
	$timeout(ping,10*1000);

	
	// var sendMsg = new SendMessage( socketio );
	var sendMsg = new SendMessage( ws );
	
	$scope.test = function()
	{
		console.log(nodes);
	}

	$scope.dcaseID = dcaseID;
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

	$scope.public = $scope.publicList[0];

	console.log("dcaseID", dcaseID);
	
	var dcaseInfo = {};
	var member = {};
	var nodes = [];
	var links = [];
	var partsList = {};
	
	var defaultWidth = 180;
	var defaultHeight = 120;

	var viewDetailLen = 30;
	var lineNum = 5;
	
	

	var device = checkEnv();
	
	if(device == "ie")
	{
		alert("このブラウザは、未対応です");
	}
	
	var html = angular.element(document).find('html')
	// var cW = html[0].clientWidth
	
	$scope.addPartsKind = "";
	
	$scope.addPathFlag = 0;
	var addPathPoint = {};
	$scope.delBtnFlag = 0;
	$scope.AddPathMsg = "";
	$scope.DelItemMsg = "";

	
	$scope.permission = false;

	
	// $scope.inviteUser = inviteUser;
	
	var startScrollPoint = {x:0,y:0};
	var baseScrollPoint = {x:0,y:0};

	//ワークスペース全体のスクロール
	var scroll = d3.drag().on("start", function()
		{
			startScrollPoint.x = d3.event.x;
			startScrollPoint.y = d3.event.y;
			baseScrollPoint.x = viewPort.offsetX;
			baseScrollPoint.y = viewPort.offsetY;
			console.log("start", viewPort);
		})
		.on("drag", function()
		{
			viewPort.offsetX = baseScrollPoint.x + d3.event.x - startScrollPoint.x;
			viewPort.offsetY = baseScrollPoint.y + d3.event.y - startScrollPoint.y;
			d3.selectAll(".node").attr("style", function(d)
			{
				return( dcaseParts.webKitScale( d.x + viewPort.offsetX, d.y + viewPort.offsetY, viewPort.scale ) );
			});
			d3.selectAll(".link").attr("style", dcaseParts.webKitScale( viewPort.offsetX, viewPort.offsetY, viewPort.scale ));
			d3.selectAll(".linkInner").attr("style", dcaseParts.webKitScale( viewPort.offsetX, viewPort.offsetY, viewPort.scale ));
		})
		.on("end", function(){});
		
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
			if($scope.addPartsKind != "")
			{
				var mousePos = d3.mouse(this);
				var pos = {};
				pos.x = mousePos[0] / viewPort.scale - viewPort.offsetX;
				pos.y = mousePos[1] / viewPort.scale - viewPort.offsetY;
				createNewParts( $scope.addPartsKind, pos.x, pos.y, detail="");
				$scope.addPartsKind = "";
			}
			
			$timeout(function(){},0);
		})
		.call(scroll)
		;
	
	dcaseParts.makeArrow();
		
	function loadData(userInfo)
	{
		if( userInfo.tempID !== undefined )
		{
			authID = userInfo.tempID;
			userInfo.userID = "temp_" + userInfo.tempID;
		}else{
			console.log(userInfo);
			$scope.userName = userInfo.lastName + " " + userInfo.firstName;
			$scope.userPic = userInfo.userID + ".jpg";
		}
		$scope.userInfo = userInfo;
		dbApi.loadDCase(userInfo.userID).then(function(data)
		{
			dcaseInfo = data.dcaseInfo;
			nodes = data.nodes;
			links = data.links;
			partsList = data.partsList;
			member = data.member;

			$scope.public = $scope.publicList[dcaseInfo.public];
			$scope.dcaseTitle = dcaseInfo.title;
			$scope.permission = dbApi.permission;

			console.log("$scope.permission", $scope.permission);
			
			for( var key in partsList )
			{
				var parts = partsList[key];
				parts.viewPort = viewPort;
				if(parts.kind === undefined)
				{
					continue;
				}
				parts.resize = dcaseParts.partsKind[parts.kind].resize;
				parts.make = dcaseParts.partsKind[ parts.kind ].make;
			}

			setCookie("dcaseID", dcaseID, 90);

			viewDCase();
		});
		dbApi.loadChatLog().then(function(data)
		{
			$scope.chatLog = data.chatLog;
		});

		loadTemplateList();
	}
	
	/////////////////////////
	
	resizeCanvus();
	/*
	var sendMsg = new SendMessage(socketio)
	
	*/
	//JSON.stringify(partsList);//
	
	$scope.partsKind = dcaseParts.partsKind;
	console.log( "partsKind", $scope.partsKind );
	//var layoutWidth = parseInt( svg.style("width").replace( /px/g ,"" ) );
	//var layoutHeight = parseInt( svg.style("height").replace( /px/g ,"" ) );
		
	$scope.chatLog = [];

	/////////////////////////////////////////////////
	
	
	function createNewPath(source, target, save=true)
	{
		dcaseAPI.linkParts(source, target, delLinkedPathEvent).then(function(link)
		{
			links.push(link); 
		});
		
		target.apiFlag = source.apiFlag;
		/*
		if(save==true)
		{
			sendMsg.createNode( dcaseID, target );
			dbApi.saveNode(target);
		}
		*/
		if(save==true)
		{
			sendMsg.linkPath( dcaseID, source.id, target.id );
			dbApi.saveLinkPath( source.id, target.id );	
		}

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
	
	$scope.addPathBtn = function(key)
	{
		if($scope.addPathFlag == 0)
		{
			$scope.AddPathMsg = lang.AddPathClicked1;
			$scope.addPathFlag = 1;
			addPathPoint = {};
		}else{
			$scope.AddPathMsg = lang.AddPath;
			$scope.addPathFlag = 0;
			if( addPathPoint.source !== undefined )
			{
				d3.select("#" + addPathPoint.source.id).attr("stroke-width", 1);
			}
			addPathPoint = {};
		}
	}
	
	$scope.delBtn = function()
	{
		if( $scope.delBtnFlag == 0 )
		{
			$scope.DelItemMsg = lang.DelBtnClickedMessage;
			$scope.delBtnFlag = 1;
		}else{
			$scope.DelItemMsg = lang.DelBtnMessage;
			$scope.delBtnFlag = 0;
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
		d3.select("#svg").attr("width", "100%").attr("height", "100%")
	}
	
	function viewDCase()
	{
		d3.select("#svg").selectAll(".node").remove();
		d3.select("#svg").selectAll(".link").remove();
		d3.select("#svg").selectAll(".linkInner").remove();

		var singlePathList = dcaseAPI.makePathList( links, 1 );
		if( singlePathList.length > 0 )
		{
			//dcaseAPI.makePathSingle( svg, singlePathList, delLinkedPathEvent, runFlag  );
			dcaseAPI.makePathSingle( singlePathList, delLinkedPathEvent, runFlag  );
		}
		
		var dasharrayPathList = dcaseAPI.makePathList( links, 2 );
		if( dasharrayPathList.length > 0 )
		{
			// dcaseAPI.makePathSingleDasharray( svg, dasharrayPathList, delLinkedPathEvent, runFlag  );
			dcaseAPI.makePathSingleDasharray( dasharrayPathList, delLinkedPathEvent, runFlag  );
		}
		
		var doublePathList = dcaseAPI.makePathList( links, 0 );
		if( doublePathList.length > 0 )
		{
			// dcaseAPI.makePathDouble( svg, doublePathList, delLinkedPathEvent, runFlag );
			dcaseAPI.makePathDouble( doublePathList, delLinkedPathEvent, runFlag );
		}
		
		for( kind in dcaseParts.partsKind )
		{
			var nodeList = dcaseAPI.makePartsList( nodes, kind );
			if( nodeList.length > 0 )
			{
				// dcaseAPI.createNode( dcaseID, svg, nodeList, nodeClickEvent, drag, dragendedSize, runFlag );
				dcaseAPI.createNode( dcaseID, nodeList, nodeClickEvent, drag, draggedSize, dragendedSize );
			}
		}
		
		if( addPathPoint.source !== undefined )
		{
			d3.select("#" + addPathPoint.source.id).attr("stroke-width", 5);
		}

		dcaseAPI.changeNodeDisplay(runFlag);
		dcaseAPI.changePathDisplay(runFlag);
		
		if( initParts !== undefined )
		{
			d3.select("#" + initParts).attr("stroke-width", 5);
			console.log("select partsID", param["partsID"] );
		}
		$timeout(function(){});
	}
	
	function delLinkedPathEvent( data, flag = 0 )
	{
		if( flag !== undefined )
		{
			if( flag == 1)
			{
				$scope.delBtnFlag = 1;
			}
		}
		if($scope.delBtnFlag > 0)
		{
			$scope.delBtnFlag = 0;
			delPath( data.source, data.target );
			$scope.DelItemMsg = lang.DelBtnMessage;
			$timeout(function(){},0);
		}
	}
	
	function delPath( source, target, save=true )
	{
		dcaseAPI.unlinkPath( source, target, links );
		if(save == true)
		{
			sendMsg.unlinkPath( dcaseID, source.id, target.id );
			dbApi.removeLinkPath( source.id, target.id );	
		}
	}

	function delParts(data, save=true)
	{
		// if($scope.delBtnFlag > 0 )
		{
			console.log("delParts", data);
			if(save)
			{
				dbApi.removeParts( data );
				if(data.parent !== undefined)
				{
					dbApi.removeLinkPath( data.parent.id, data.id );
				}			
				sendMsg.deleteNode( dcaseID, data );
			}
			dcaseAPI.deleteNode( data, partsList, nodes, links );	
			$scope.delBtnFlag = 0;
			
			$scope.DelItemMsg = lang.DelBtnMessage;
		}
	}
	
	function updatePenndingState(target, penndingFlag)
	{
		target.penndingFlag = penndingFlag;
		if(target.kind !="Pendding" )
		{
			if(target.penndingFlag == true )
			{
				newParts = createNewParts("Pendding", target.x, target.y, detail="<center>Pendding</center>", id=undefined, addonInfo=undefined, save=false);
				newParts.parent = parent;
				newParts.original = target;
				newParts.penndingFlag = true;
				
				var ret = sendMsg.createNode( dcaseID, newParts );
				console.log("updatePenndingState ret", ret);
				dbApi.saveNode( newParts );
				
				sendMsg.updateNode( dcaseID, target );
				dbApi.saveNode( target );

				if(target.parent !== undefined)
				{
					createNewPath(target.parent, newParts);
					delPath(target.parent, target);
				}
				nodeHidden(target, true);
			}
		}else if(target.penndingFlag == false){
			penddingRoot = target.original;
			console.log(target);
			penddingRoot.penndingFlag = false;

			if(target.parent !== undefined )
			{
				updatePenndingState(target, penddingRoot)
				createNewPath(target.parent, penddingRoot);
				delPath(target.parent, target);
			}
			delParts(target);
			nodeHidden( penddingRoot, false);
		}

	}
	
	function nodeHidden(item, flag = true)
	{
		item.hidden = flag;
		dcaseAPI.changeNodeDisplay(runFlag, item);
			/*
			svg.selectAll( "#" + item.id ).remove(); //Node
			svg.selectAll( "." + item.id ).remove(); //Link
			if(item.parent !== undefined)
			{
				item.offsetX = item.parent.x - item.x;
				item.offsetY = item.parent.y - item.y;
			}
			*/

		sendMsg.nodeState( dcaseID, item, flag );
		dbApi.saveNode( item );
		
		if(item.kind != "Pendding" && item.children !== undefined)
		{
			var childNum = item.children.length;
			for( var i=0; i < childNum; i++)
			{
				var child = item.children[i];
				child.hidden = flag;
				dcaseAPI.changePathDisplay(item, child, runFlag);
				nodeHidden(child, flag);
			}
		}
	}

	function addPathParent(d)
	{
		console.log("addPathParent");
		d3.select("#" + d.id).attr("stroke-width", 5);
		$scope.AddPathMsg = lang.AddPathClicked2;
		addPathPoint.source = d;
		/*
		if( d.children === undefined )
		{
			d.children = [];
		}
		*/
		$scope.addPathFlag = 2;
	}
	
	function addPathChild(d)
	{
		// if( d.parent === undefined || d.parent == "")
		{
			if( addPathPoint.source.id != d.id )
			{
				addPathPoint.target = d;
				
				createNewPath(addPathPoint.source, addPathPoint.target);
				d3.select("#" + addPathPoint.source.id).attr("stroke-width", 1);
				$scope.AddPathMsg = lang.AddPath;
				$scope.addPathFlag = 0;
				addPathPoint = {};
			}else{
				d3.select("#" + addPathPoint.source.id).attr("stroke-width", 1);
				$scope.AddPathMsg = lang.AddPathClicked1;
				$scope.addPathFlag = 1;
				addPathPoint = {};
			}
		}
	}
	
	function nodeClickEvent( d )
	{
		// console.log("nodeClickEvent", d, templateSelectMode);
		if(templateSelectMode == 1)
		{
			createTemplate(d)
		}else if($scope.addPathFlag == 1){
			addPathParent(d);
		}else if($scope.addPathFlag == 2){
			addPathChild(d);
		}else if($scope.delBtnFlag > 0 ){
			delParts(d);
		}else if(selectedNode == null){
			nodeDoubleClick(d);
			if( $scope.permission )
			{
				$timeout(function()
				{
					selectedNode = d;
					d3.select("#" + selectedNode.id)
					.selectAll(".SizePoint")
					.attr("style","display:inline");
				});
			}
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

	function openEditDetail(node)
	{
		var beforeDetail = node.detail;
		$scope.editorConfig = dcaseParts.editorConfig;
		$scope.detail = node.detail;
		$scope.resultMsg="内容";
		
		$scope.selectedNodeMode = "";
		$scope.editParts = node;
		$scope.partsID = node.id;
		$scope.template = undefined;
		for(var idx in $scope.templateList[node.kind])
		{
			var template = $scope.templateList[node.kind][idx];
			if(template.name == node.label)
			{
				$scope.template = $scope.templateList[node.kind][idx];
			}
		}
		$uibModal.open(
		{
			templateUrl:"alertPartsDetail.html?" + Math.random(),
			scope: $scope,
			backdrop : false,
			controller: function($scope, $uibModalInstance)
			{
				$scope.ok = function()
				{
					var updateFlag = false;
					if( $scope.template !== undefined )
					{
						if( $scope.template.name == "" )
						{
							node.label = "";
							updateFlag = true;
						}else if($scope.template.name != node.label){
							$timeout(function()
							{
								deployTemplate(node, $scope.template);
							});
						}
					}

					console.log("node.detail", node);
					d3.selectAll( "#" + node.id + "_detail")
					.html(function(d)
					{
						if($scope.detail != beforeDetail)
						{
							updateFlag = true;
						}

						d.detail = $scope.detail;

						updatePenndingState(d, d.penndingFlag);

						var addonTag = dcaseAPI.makeLabel(d);
						
						
						var tableInfo = dcaseAPI.makeTableInfo(d.tableInfo);

						if(updateFlag == true)
						{
							sendMsg.changeContent( dcaseID, d );
							dbApi.saveNode( d );
						}
						if(d.detail == "")
						{
							var style = "font-size: 15px;";
							style += "background-color: rgba(255,255,255,0.0);";
							style += "border: 0px solid rgba(0,0,0,0.0);";
							style += "overflow: hidden;";
							style += "width: 100%;";
							style += "height: 100%;";
							style += "margin: 10px 20px 10px 10px;"
							style += "white-space: pre;white-space: pre-wrap;white-space: pre-line;white-space: -pre-wrap;white-space: -o-pre-wrap;white-space: -moz-pre-wrap;white-space: -hp-pre-wrap;word-wrap: break-word;";
							
							return(addonTag + "<pre class='preHTML' style='" + style +"'>" + lang.PartsDefaultMessage + "</pre>" + tableInfo);
						}

						return( addonTag + d.detail + tableInfo );
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

	function deployTemplate(node, template)
	{
		$scope.resultMsg = '"' + template.name + '"' + lang.TemplateDeployAlert;
		$scope.MidOK = lang.TemplateDeployLabel;
		$scope.MidOKFlag = true;
		$uibModal.open(
		{
			templateUrl:"alertYES_NO.html?" + Math.random(),
			scope: $scope,
			backdrop : false,
			controller: function($scope, $uibModalInstance)
			{
				$scope.ok = function()
				{
					var fd = new FormData();
					fd.append('authID', authID );
					fd.append('dcaseID', dcaseID );
					fd.append('partsID', node.id );
					fd.append('templateID', template.id );

					$http.post('./api/deployTemplate.php',fd,{
						transformRequest: null,
						headers: {'Content-type':undefined}
					}).success(function(data, status, headers, config){
						console.log("deployTemplate", data);
						if( data.result == "OK" )
						{
						}
					});
					$scope.MidOKFlag = false;
					$uibModalInstance.close();
				};
				$scope.midOK = function()
				{
					node.label = template.name;
					d3.selectAll( "#" + node.id + "_detail")
					.html(function(d)
					{
						var addonTag = dcaseAPI.makeLabel(d);
						var tableInfo = dcaseAPI.makeTableInfo(d.tableInfo);

						sendMsg.changeContent( dcaseID, d );
						dbApi.saveNode( d );
						if(d.detail == "")
						{
							var style = "font-size: 15px;";
							style += "background-color: rgba(255,255,255,0.0);";
							style += "border: 0px solid rgba(0,0,0,0.0);";
							style += "overflow: hidden;";
							style += "width: 100%;";
							style += "height: 100%;";
							style += "margin: 10px 20px 10px 10px;"
							style += "white-space: pre;white-space: pre-wrap;white-space: pre-line;white-space: -pre-wrap;white-space: -o-pre-wrap;white-space: -moz-pre-wrap;white-space: -hp-pre-wrap;word-wrap: break-word;";
							
							return(addonTag + "<pre class='preHTML' style='" + style +"'>" + lang.PartsDefaultMessage + "</pre>" + tableInfo);
						}

						return( addonTag + d.detail + tableInfo );
					});
					$scope.MidOKFlag = false;
					$uibModalInstance.close();
				};
				$scope.cancel = function()
				{
					$scope.MidOKFlag = false;
					$uibModalInstance.dismiss('cancel');
				};
			}
		});
		
	}
	function nodeDoubleClick( node )
	{
		if( $scope.permission )
		{
			var date = new Date();
			var now = date.getTime();
			if( node.clickTime !== undefined )
			{
				if( now - node.clickTime < 500)
				{
					if(node.kind == "External")
					{
						openCreateDialog(node, node.id);
					}else{
						openEditDetail(node);
					}
				}
			}
			node.clickTime = now;
		}
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
			d.x += d3.event.dx/d.viewPort.scale;
			d.y += d3.event.dy/d.viewPort.scale;
			dcaseAPI.moveTo(d);
			
			if( $scope.permission )
			{
				sendMsg.moveTo( dcaseID, d );
			}
		}
	}

	function dragended(d)
	{
		if(d.moveFlag)
		{
			dbApi.saveMoveTo( d );
		}
		// d.moveFlag = false;
		d3.select("#" + d.id).classed("dragging", false);
		d3.select("#" + d.id).attr("opacity",1.0);
	}
	
	function draggedSize(dcaseID, node)
	{
		sendMsg.changeSize(dcaseID, node);
	}
	
	function dragendedSize(d)
	{
		dbApi.changeSize(d).then(function(data)
		{
			d3.select("#" + d.id)
				.selectAll(".SizePoint")
				.attr("style","display:none");
	
			selectedNode = null;
		});
	}
	
	$scope.sendChatMessage = function()
	{
		dbApi.chatMessage($scope.chatMessage).then(function(data)
		{
			$scope.chatLog.unshift( data.line );
			sendMsg.chat( dcaseID, data.line );
			$scope.chatMessage = "";
		});
	};
	
	$scope.chatKeydown = function(e)
	{
		if (e.which == 13)
		{
			$scope.sendChatMessage();
		}
	}
	
	$scope.btnAgree = function(agree)
	{
		dbApi.setAgree(agree).thien(function(data)
		{
			member[$scope.userInfo.userID].position = agree;
			setAgreeLog( data.line );
			sendMsg.agree( dcaseID, data.line );
		});
	};

	$scope.updateTitle = function()
	{
		dbApi.updateTitle($scope.dcaseTitle, $scope.public.value);
	}




	
	
	function createNewParts( kind, x, y, detail = "", id=undefined, addonInfo=undefined, save=true, width=-1, height=-1)
	{
		if(width < 0)
		{
			width = defaultWidth;
		}
		if(height < 0)
		{
			height = defaultHeight;
		}

		// console.log(kind, x, y);
		if(id === undefined)
		{
			id = "Parts_" + makeRandomString(8);
			while( partsList[id] !== undefined )
			{
				id = "Parts_" + makeRandomString(8);
			}
		}
		parts = dcaseAPI.createNodeInfo(id, kind, x, y, width, height, detail, addonInfo)
		//to do
		dcaseAPI.createNode( dcaseID, [parts], nodeClickEvent, drag, dragendedSize );
		
		id = parts["id"];
		partsList[id] = parts;
		nodes.push(parts);

		if(save==true)
		{
			sendMsg.createNode( dcaseID, parts );
			dbApi.saveNode( parts );	
		}
		
		return(parts);
	}
	
	$scope.commitDetail = function()
	{
		$scope.commitMsg = "";
		$uibModal.open(
		{
			templateUrl:"alertCommit.html?" + Math.random(),
			scope: $scope,
			backdrop : false,
			controller: function($scope, $uibModalInstance)
			{
				$scope.ok = function()
				{
					dbApi.commit($scope.commitMsg).then(function(data)
					{
						console.log("commitDetail", data);
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


	

	function createDCase(node, title, memberList, public = 0, parentPartsID="")
	{
		memberList.push( $scope.userInfo.userID );
		
		var fd = new FormData();
		fd.append('authID', authID );
		fd.append('title', title );
		fd.append('public', public );
		fd.append('member', JSON.stringify(memberList) );
		fd.append('parentDcaseID', dcaseID);
		fd.append('parentPartsID', parentPartsID);
		
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
			var url = '<center><a href="./editor.html?dcaseID=' + data.dcaseID + '" target="_blank">'+title+'への<br/>リンク</a></center>';
			d3.selectAll( "#" + node.id + "_detail").html(function(d)
			{
				if( data.addonInfo !== undefined )
				{
					d.addonInfo = data.addonInfo;
				}
				var tableInfo = dcaseAPI.makeTableInfo(d.tableInfo);
				// var tableInfo = makeTableInfo(d.table);
				
				var addonTag = "";
				// var addonTag = makeAddonTag(d);

				d.detail = url;
				sendMsg.changeContent( dcaseID, d );
				dbApi.saveNode( d );
				return(addonTag + d.detail + tableInfo);
			});
			// location.href = "./editor.html?dcaseID=" + data.dcaseID;
			open(  "./editor.html?dcaseID=" + data.dcaseID, "_blank" ) ;
		});
	}

	$scope.addParamList = function()
	{
		console.log("append");
		$scope.paramList.push({
			"key":"",
			"value":"",
		});
	}

	
	$scope.delParamList = function(index)
	{
		$scope.paramList.splice(index, 1);
	}

	function openCreateDialog(node, parentPartsID="")
	{
		var selectedTemplateID = "";
		$scope.paramList = [];
		var str = node.detail;
		paramParse = str.match(/templateID=[\w]+/);
		if(paramParse !== null)
		{
			selectedTemplateID = paramParse[0];
			selectedTemplateID = selectedTemplateID.replace("templateID=", "");
			console.log("selectedTemplate", selectedTemplateID);
		}

		var str = node.detail;
		console.log("node.detail", node.detail);
		paramParse = str.match(/&paramList=\S+'/);
		param = "";
		if(paramParse !== null)
		{
			param = paramParse[0];
			param = param.replace("&paramList=", "")
			param = param.substring( 0, param.length-1 );
			$scope.paramList = JSON.parse(param) 
		}
		
		$scope.selectTemplateList = [];
		for(partName in $scope.templateList)
		{
			for(templateIndex in $scope.templateList[partName])
			{
				if($scope.templateList[partName][templateIndex].name == ""){ continue; }
				$scope.selectTemplateList.push($scope.templateList[partName][templateIndex]);

				if($scope.templateList[partName][templateIndex].id == selectedTemplateID)
				{
					$scope.template = $scope.templateList[partName][templateIndex];
				}
			}
		}
		
		$uibModal.open(
		{
			templateUrl:"alertCreateModuleLink.html?" + Math.random(),
			scope: $scope,
			controller: function($scope, $uibModalInstance)
			{
				$scope.ok = function() {
					//linkURL
					if($scope.template !== undefined)
					{
						var paramList = JSON.stringify($scope.paramList);
						var url = "<center><a href='./viewModule.html?templateID=" + $scope.template.id +
									'&paramList=' + paramList +
									"' target=" + $scope.template.id + '">' 
										+ $scope.template.name  + lang.LinkDCaseIDMsg + '</a></center>';
						console.log("url = ", url);
						d3.selectAll( "#" + node.id + "_detail").html(function(d)
						{
							d.detail = url;
							sendMsg.changeContent( dcaseID, d );
							dbApi.saveNode( d );
							return( d.detail );
						});
					}
					$uibModalInstance.close();
				};

				$scope.cancel = function()
				{
					$uibModalInstance.dismiss('cancel');
				};
			}
		});
		/*
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
								sendMsg.changeContent( dcaseID, d );
								dbApi.saveNode( d );
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
						createDCase( node, $scope.title, member, $scope.public.value, parentPartsID );
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
		*/
	}
	
	$scope.inviteUser = function()
	{
		if( $scope.permission )
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

	function inviteMember(member)
	{
		console.log("inviteMember", member);
		if( $scope.permission )
		{
			var fd = new FormData();
			fd.append('authID', authID );
			fd.append('dcaseID', dcaseID );
			fd.append('member', JSON.stringify(member) );
			$http.post('./api/addMember.php',fd,{
				transformRequest: null,
				headers: {'Content-type':undefined}
			}).success(function(data, status, headers, config){
				console.log("inviteMember", data);
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
						// sendInvite( dcaseInfo );
					}
				}
			});
		}
	}

	$scope.getPostSlack = function()
	{
		if( $scope.permission )
		{
			$scope.authID = authID;
			$scope.slackURL = "";
			if(dcaseInfo.slackURL !== undefined)
			{
				$scope.slackURL = dcaseInfo.slackURL;
			}

			$scope.slackOAuth = "";
			if(dcaseInfo.slackOAuth !== undefined)
			{
				$scope.slackOAuth = dcaseInfo.slackOAuth;
			}

			$scope.slackChannel = "";
			if(dcaseInfo.slackChannel !== undefined)
			{
				$scope.slackChannel = dcaseInfo.slackChannel;
			}

			$uibModal.open(
			{
				templateUrl:"alertPostSlack.html?" + Math.random(),
				scope: $scope,
				controller: function($scope, $uibModalInstance)
				{
					$scope.ok = function() {
						var fd = new FormData();
						fd.append('authID', authID );
						fd.append('dcaseID', dcaseID );
						fd.append('slackURL', $scope.slackURL );
						fd.append('slackOAuth', $scope.slackOAuth );
						fd.append('slackChannel', $scope.slackChannel );
						$http.post('./api/takeDCaseImage.php',fd,{
							transformRequest: null,
							headers: {'Content-type':undefined}
						}).success(function(data, status, headers, config){
							console.log("takeDCaseImage", data);
							if(data.result=="OK")
							{
								if(data.slackResult == "ok")
								{
									dcaseInfo.slackURL = $scope.slackURL;
								}
								if(data.slackResult_fileUploadAPI.ok)
								{
									dcaseInfo.slackOAuth = $scope.slackOAuth;
									dcaseInfo.slackChannel = $scope.slackChannel;
								}

								$uibModalInstance.dismiss('cancel');
								$timeout(function(){
									posetedSlack();
								},1);
							}
						});
					};
					
					$scope.cancel = function()
					{
						$uibModalInstance.dismiss('cancel');
					};
				}
			});
		}
		
	}

	function posetedSlack()
	{
		$scope.resultMsg = "Slackへ投稿されました";
		$uibModal.open(
			{
				templateUrl:"alertOK.html?" + Math.random(),
				scope: $scope,
				backdrop : false,
				controller: function($scope, $uibModalInstance)
				{
					$scope.ok = function()
					{
						$uibModalInstance.close();
					};
					$scope.cancel = function()
					{
						$uibModalInstance.dismiss('cancel');
					};
				}
			});
	}

	$scope.getDCaseData = function()
	{
		var fd = new FormData();
		fd.append('authID', authID );
		fd.append('dcaseID', dcaseID );
		$http.post('./api/getDCaseJSON.php',fd,{
			transformRequest: null,
			headers: {'Content-type':undefined}
		}).success(function(data, status, headers, config){
			if(data.result=="OK")
			{
				var aTag = document.getElementById("dcaseDownload");
				var content  = JSON.stringify(data.dcaseList);
				var mimeType = 'application/json';
				var bom  = new Uint8Array([0xEF, 0xBB, 0xBF]);
				var blob = new Blob([bom, content], {type : mimeType});
				aTag.target   = '_blank';
				aTag.download = "dcase_" + $scope.dcaseTitle + ".json";

				$timeout(function()
				{
					if (window.navigator.msSaveBlob) {
					// for IE
					window.navigator.msSaveBlob(blob, name)
					}
					else if (window.URL && window.URL.createObjectURL) {
					// for Firefox
					aTag.href = window.URL.createObjectURL(blob);
					document.body.appendChild(aTag);
					aTag.click();
					document.body.removeChild(aTag);
					}
					else if (window.webkitURL && window.webkitURL.createObject) {
					// for Chrome
					aTag.href = window.webkitURL.createObjectURL(blob);
					aTag.click();
					}
					else {
					// for Safari
					window.open('data:' + mimeType + ';base64,' + window.Base64.encode(content), '_blank');
					}
				}, 0);
			}
		});
	}

	var templateSelectMode = 0;
	var templateName = 0;
	$scope.templateDialog = function()
	{
		loadTemplateList();
		templateSelectMode = 0;
		$uibModal.open(
		{
			templateUrl:"alertTemplate.html?" + Math.random(),
			scope: $scope,
			backdrop : false,
			controller: function($scope, $uibModalInstance)
			{
				$scope.start = function()
				{
					templateSelectMode = 1;
					templateName = $scope.templateName;
					$uibModalInstance.close();
				};
				$scope.cancel = function()
				{
					templateSelectMode = 0;
					$uibModalInstance.dismiss('cancel');
				};
			}
		});
	}

	$scope.updateTemplate= function(templateID)
	{
		console.log("templateID", templateID);
		var fd = new FormData();
		fd.append('authID', authID );
		fd.append('templateID', templateID );
		$http.post('./api/loadTemplate.php',fd,{
			transformRequest: null,
			headers: {'Content-type':undefined}
		}).success(function(data, status, headers, config){
			console.log("deployTemplate", data);
			if( data.result == "OK" )
			{
				data.template.partsList.push(data.template.root);
				for( var key in data.template.partsList )
				{
					var parts = data.template.partsList[key];
					valList = parts.detail.match(/\$\{([\w]+)}/g);
					var keyList = {};
					
					for(var index in $scope.paramList)
					{
						var param = $scope.paramList[index];
						keyList[param["key"]] = 1;
					}
					for(var index in valList)
					{
						val = valList[index];
						val = val.replace("${","");
						key = val.replace("}","");
						if(key in keyList)
						{

						}else{
							keyList[key] = 1;
							$scope.paramList.push({
								"key": key,
								"value": "",
							});
						}
					}
				}
			}
		});
	}

	function loadTemplateList()
	{
		var fd = new FormData();
		fd.append('authID', authID );
		fd.append('userID', $scope.userInfo.userID );
		fd.append('all', 1 );

		$http.post('./api/getTemlateList.php',fd,{
			transformRequest: null,
			headers: {'Content-type':undefined}
		}).success(function(data, status, headers, config){
			console.log("loadTemplateList", data);
			$scope.templateList = {};
			if( data.result == "OK" )
			{
				for(templateIndex in data.templateList)
				{
					var template = data.templateList[templateIndex];
					if(!(template.kind in $scope.templateList) )
					{
						$scope.templateList[template.kind] = [
							{
								name:"",
							}
						];
					}
					$scope.templateList[template.kind].push( template );
				}
			}
		});
	}

	function createTemplate(parts)
	{
		templateSelectMode = 0;
		$scope.resultMsg = '"' + templateName + '"' + lang.TemplateCreateAlert;
		$uibModal.open(
		{
			templateUrl:"alertYES_NO.html?" + Math.random(),
			scope: $scope,
			backdrop : false,
			controller: function($scope, $uibModalInstance)
			{
				$scope.ok = function()
				{
					$timeout(function()
					{
						requestCreateTemplate(parts);
					});
					$uibModalInstance.close();
				};
				$scope.cancel = function()
				{
					templateSelectMode = 0;
					$uibModalInstance.dismiss('cancel');
				};
			}
		});
	}

	function requestCreateTemplate(parts)
	{
		var fd = new FormData();
		fd.append('authID', authID );
		fd.append('dcaseID', dcaseID );
		fd.append('partsID', parts.id );
		fd.append('name', templateName );
		$http.post('./api/createTemplate.php',fd,{
			transformRequest: null,
			headers: {'Content-type':undefined}
		}).success(function(data, status, headers, config){
			console.log("requestCreateTemplate", data);
			if(data.result=="OK")
			{
				loadTemplateList();
			}
		});
	}
}]);


/*
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
*/


/*
	var socketio = io.connect('https://' + location.host + '/editor');
	socketio.on("createNode", function(data){
		var node = recvMsg.createNode( data, partsList, nodeClickEvent, drag, draggedSize, dragendedSize );
		var exist = false;
		for(var i in nodes)
		{
			var target = nodes[i];
			if(node.id == target.id)
			{
				exist = true;
			}
		}
		if(exist == false)
		{
			nodes.push(node);
			partsList[node.id] = node;
		}else{
			var target = partsList[node.id];
			target.apiFlag = node.apiFlag;
			target.apiHidden = node.apiHidden;
			console.log("dcaseAPI.changeNodeDisplay", node);
		}
		
		dcaseAPI.changeNodeDisplay(runFlag);
		dcaseAPI.changePathDisplay(runFlag);
	});
	socketio.on("moveTo", function(data){ recvMsg.moveTo(data); });
	socketio.on("changeSize", function(data){ recvMsg.changeSize(data, partsList); });
	socketio.on("updateTable", function(data){ 
		console.log("updateTable", data);
		recvMsg.updateTable(data, $scope.lang);
	});
	socketio.on("nodeStyle",  function(data){ recvMsg.nodeStyle(data); });
	socketio.on("deleteNode",  function(data){ recvMsg.deleteNode(data, partsList, nodes, links, runFlag); });
	socketio.on("linkPath",  function(data){
		recvMsg.linkPath(data, partsList);
		// dcaseAPI.changeNodeDisplay(runFlag);
		// dcaseAPI.changePathDisplay(runFlag);
	});
	socketio.on("unlinkPath",  function(data){
		recvMsg.unlinkPath(data, partsList, links);
		// dcaseAPI.changeNodeDisplay(runFlag);
		// dcaseAPI.changePathDisplay(runFlag);
	});
	socketio.on("changeContent",  function(data){ recvMsg.changeContent(data); });
	socketio.on("nodeState",  function(data){
		console.log("nodeState hogehoge", data);
		var item = partsList[data.id];
		var flag = data.hiddenFlag;
		var apiHidden = data.apiHidden;
		recvMsg.nodeState(item, flag, apiHidden, runFlag);

		dcaseAPI.changeNodeDisplay(runFlag);
		dcaseAPI.changePathDisplay(runFlag);
	});

	socketio.on("updateNode",  function(data){ 
		node = recvMsg.updateNode(data, partsList);
	});
	*/