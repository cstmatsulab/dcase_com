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
	var authID = authHistory( $http, loadData );

	var param = getQuery()["param"];
	$scope.strToDateFormat = strToDateFormat;
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
	var viewPort ={"scale": 1.0, "offsetX":0, "offsetY":0 };
	$scope.viewPort = viewPort;

	var dcaseParts = new DcaseParts();
	var dcaseAPI = new DCaseAPI( dcaseParts, viewPort );

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
		})
		.on("drag", function()
		{
			viewPort.offsetX = baseScrollPoint.x + d3.event.x - startScrollPoint.x;
			viewPort.offsetY = baseScrollPoint.y + d3.event.y - startScrollPoint.y;
			d3.selectAll(".node").attr("style", function(d)
			{
				return( dcaseParts.webKitScale( d.x + viewPort.offsetX, d.y + viewPort.offsetY, viewPort.scale ) );
			});
			d3.selectAll(".link").attr("style", function(d)
			{
				var color = "";
				if( d.target.updateLinkFlag !== undefined)
				{
					color = "stroke:#FF0000;";
				}
				var moveStyle = dcaseParts.webKitScale( viewPort.offsetX, viewPort.offsetY, viewPort.scale );

				return(moveStyle + color);
			});
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
	
	function loadDCase(date)
	{
		return new Promise(function(resolve, reject)
        {
            var fd = new FormData();
            fd.append('authID', authID );
            fd.append('dcaseID', dcaseID );
            fd.append('date', date );
            $http.post('./api/loadHistory.php',fd,{
                transformRequest: null,
                headers: {'Content-type':undefined}
            }).success(function(data, status, headers, config){
                console.log( "loadDCase", data );
                if(data.result == "OK")
                {
					$scope.commitList = data.commitLog;
					$scope.selectDate = data.commitDate;
					console.log($scope.selectDate );


                    var nodes = [];
                    var links = [];
                    var partsList = {};
                    var member = {};

                    var dcaseInfo = data.dcaseInfo;
                    
                    for( var key in data.dcaseInfo.parts )
                    {
                        var parts = data.dcaseInfo.parts[key];
                        partsList[parts.id] = parts;
                    }
                    for( var key in partsList )
                    {
                        var parts = partsList[key];
                        parts.children = [];
                        for( var index in parts.childrenID )
                        {
                            var link = {};
                            var target = partsList[ parts.childrenID[index] ];
                            if(target !== undefined)
                            {
                                link.source = parts;
                                link.target = target;
                                links.push(link);
                                parts.children.push( target );
                            }else{
                                console.log("error target not exist", parts.id, parts.childrenID[index] );
                            }
                        }
                        //delete parts["childrenID"];
                        nodes.push( partsList[key] );
                    }
                    
                    for( var key in partsList )
                    {
                        var parts = partsList[key];
                        if( parts.parent == "")
                        {
                            parts.parent = undefined;
                        }else{
                            parts.parent = partsList[parts.parent];
                        }
                        if( parts.original == "")
                        {
                            parts.original = undefined;
                        }else{
                            parts.original = partsList[parts.original];
                        }
					}
                    resolve({
                        "dcaseInfo": dcaseInfo,
                        "nodes": nodes, 
                        "links": links,
                        "partsList": partsList, 
                        "member": member,
					});
				}else{
                    // location.href = "./";
                }
            });
		});
	}

	var userInfo = {};
	function loadData(date, authUserInfo)
	{
		if(authUserInfo !== undefined)
		{
			userInfo = authUserInfo;
		}
		loadDCase(date).then(function(data)
		{
			console.log("loadData", date);
			dcaseInfo = data.dcaseInfo;
			nodes = data.nodes;
			links = data.links;
			partsList = data.partsList;
			member = data.member;

			$scope.public = $scope.publicList[dcaseInfo.public];
			$scope.dcaseTitle = dcaseInfo.title;
			
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
		
	}
	$scope.loadData = loadData;
	
	/////////////////////////
	
	resizeCanvus();
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
		for( var partsIndex in  dcaseInfo.diffParts)
		{
			var parts = dcaseInfo.diffParts[partsIndex];
			console.log(parts);
			d3.select("#shape_" + parts).attr("stroke-width", 5)
			.attr("style", function(d){
				return("stroke:#FF0000;");
			});
		}
		for( var linkIndex in  dcaseInfo.diffLink)
		{
			var link = dcaseInfo.diffLink[linkIndex];
			linkID = "#link_" + link.source + "_" + link.target;
			console.log("link", link, linkID);
			d3.select(linkID).attr("stroke-width", 5)
			.attr("style", function(d){
				d.target.updateLinkFlag = true;
				// d.style.border_color = "#FF0000";
				return("stroke:#FF0000;");
			})
			.attr("marker-end", function()
			{
				if(d3.select(linkID).attr("marker-end") == "url(#arrowheadSingle)")
				{
					return("url(#arrowheadSingleRed)");
				}else{
					return("url(#arrowheadRed)");
				}
			})
			;
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
			$scope.DelItemMsg = lang.DelPath;
			$timeout(function(){},0);
		}
	}
	
	function delPath( source, target, save=true )
	{
		dcaseAPI.unlinkPath( source, target, links );
		
	}

	function delParts(data, save=true)
	{
		// if($scope.delBtnFlag > 0 )
		{
			dcaseAPI.deleteNode( data, partsList, nodes, links );	
			$scope.delBtnFlag = 0;
			$scope.DelPartsMsg = lang.DelParts;
		}
	}
	
	function updatePenndingState(target, penndingFlag)
	{
		target.penndingFlag = penndingFlag;
		console.log("updatePenndingState",target);
		if(target.kind !="Pendding" )
		{
			if(target.penndingFlag == true )
			{
				newParts = createNewParts("Pendding", target.x, target.y, detail="<center>Pendding</center>", id=undefined, addonInfo=undefined, save=false);
				newParts.parent = parent;
				newParts.original = target;
				newParts.penndingFlag = true;
				
				console.log("updatePenndingState ret", ret);
				
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
		// console.log("nodeClickEvent", d, $scope.addPathFlag);
		
		if($scope.addPathFlag == 1)
		{
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
						var updateFlag = false;
						if($scope.detail != beforeDetail)
						{
							updateFlag = true;
						}

						d.detail = $scope.detail;

						updatePenndingState(d, d.penndingFlag);

						var addonTag = "";
						// addonTag = makeAddonTag(d);
						
						
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
							
							return(addonTag + "<pre class='preHTML' style='" + style +"'>" + lang.PartsDefaultMessage + "</pre>");
						}
						
						var tableInfo = makeTableInfo(d.tableInfo);

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
						openCreateDialog(node);
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
		}
	}

	function dragended(d)
	{
		// d.moveFlag = false;
		d3.select("#" + d.id).classed("dragging", false);
		d3.select("#" + d.id).attr("opacity",1.0);
	}
	
	function draggedSize(dcaseID, node)
	{
	}
	
	function dragendedSize(d)
	{
		d3.select("#" + d.id)
			.selectAll(".SizePoint")
			.attr("style","display:none");

		selectedNode = null;
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
		
		return(parts);
	}


	function forkDCase(title, memberList, public = 0)
	{
		console.log("userInfo", userInfo);
		memberList.push( userInfo.userID );
		
		var fd = new FormData();
		fd.append('authID', authID );
		fd.append('title', title );
		fd.append('public', public );
		fd.append('dcaseID', dcaseID );
		fd.append('commitTime', $scope.selectDate );
		fd.append('member', JSON.stringify(memberList) );
		
		$http.post('./api/forkDCase.php',fd,{
			transformRequest: null,
			headers: {'Content-type':undefined}
		}).success(function(data, status, headers, config){
			console.log(data);
			setCookie("dcaseID", data.dcaseID, 90);
			var dcaseInfo =
			{
				"userID" : userInfo.userID,
				"owner" : userInfo.lastName + " " + userInfo.firstName,
				"member" : memberList,
				"dcaseID" : data.dcaseID,
				"title" : title,
			};
			// socketio.emit("invite", dcaseInfo);
			var childWindow = window.open('about:blank');
			childWindow.location.href = "./editor.html?dcaseID=" + data.dcaseID;
			childWindow = null;
		});
	}

	$scope.forkDCase = function()
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
					forkDCase( $scope.title, member, $scope.public.value );
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
}]);
