var RecvMessage = class {
    constructor(dcaseAPI, dcaseParts)
    {
        this.dcaseAPI = dcaseAPI;
        this.dcaseParts = dcaseParts;
		//this.timeout = timeout;
	}
	
    //
    createNode = function(data, partsList, nodeClickEvent, drag, dragendedSize)
    {
		var node = data["node"];
		// todo
		if( node.parent == "" )
		{
			node.parent = undefined;
		}else{
			node.parent = partsList[node.parent];
		}
		
		// todo
		if( node.original == "" )
		{
			node.original = undefined;
		}else{
			node.original = partsList[node.original];
		}

		node.children = [];
		for(var childID in node.children)
		{
			var child = partsList[childID];
			node.children.push(child);
		}
		node.childrenID = [];
		this.dcaseAPI.createNode( data["dcaseID"], [node], nodeClickEvent, drag, dragendedSize );
		
		return(node);
	}

    updateNode = function(data, partsList)
    {
		data.node.detail = unescape(data.node.detail);
		var recvNode = data.node;
		var node = partsList[recvNode.id];
		var keyList = Object.keys(recvNode);
		for( var i in keyList)
		{
			var key = keyList[i];
			if(key == "parent" || key == "original" || key == "children" || key == "childrenID" || key == "viewPort" || key == "resize" || key == "make" )
			{
				continue;
			}
			node[key] = recvNode[key];
		}
	}

    //
    moveTo = function(node)
    {
		
		this.dcaseAPI.moveTo(node);
	}
	
    changeSize = function(data, partsList)
	{
		var node = partsList[data.id];
		node.width = data.width;
		node.height = data.height;
		node.resize( node );
		d3.selectAll("." + data.id).attr("d", this.dcaseParts.makePathLine);
		this.dcaseParts.updateInner(node)
    }
    
    updateTable = function(data, lang)
	{
		var thisObj = this;
		d3.selectAll( "#" + data.partsID + "_detail").html(function(d)
		{
			var tableInfo = thisObj.dcaseAPI.makeTableInfo(data.tableInfo);
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
				
				return("<pre class='preHTML' style='" + style +"'>" + lang.PartsDefaultMessage + "</pre>"  + tableInfo);
			}
			return( d.detail + tableInfo);
		});
    }
    
    nodeState = function(item, flag, apiHidden, runFlag)
	{
		if(flag !== undefined)
		{
			item.hidden = flag;
		}
		if(apiHidden !== undefined)
		{
			item.apiHidden = apiHidden;
		}
		this.dcaseAPI.changeNodeDisplay(runFlag, item);
		
		if(item.kind != "Pendding" && item.children !== undefined)
		{
			var childNum = item.children.length;
			for( var i=0; i < childNum; i++)
			{
				var child = item.children[i];
				this.dcaseAPI.changePathDisplay(item, child, runFlag);
				this.nodeState(child, flag, apiHidden, runFlag);
			}
		}
	}

	nodeStyle = function(data)
	{
		var partsID = data.partsID;
		d3.selectAll( "#shape_" + partsID )
			.attr("style",
				"stroke:" + data.style.border_color + ";" + 
				"stroke-width:" + data.style.border_thick + ";");
    }
    
	deleteNode = function(data, partsList, nodes, links, runFlag)
	{
		var node = partsList[ data.id ];
		if(node.kind=="Pendding")
		{
			var target = node;
			var penddingRoot = partsList[target.original.id];
			penddingRoot.penndingFlag = false;
			this.nodeState( penddingRoot, false, runFlag);
			if(target.parent !== undefined )
			{
				this.dcaseAPI.linkParts(target.parent, penddingRoot);
			}
			this.dcaseAPI.deleteNode( partsList[ data.id ], partsList, nodes, links );
			
		}else{
			this.dcaseAPI.deleteNode( partsList[ data.id ], partsList, nodes, links );
		}
	}
	
	deleteNodeForPrep = function(data, partsList, nodes, links, runFlag)
	{
		var node = partsList[ data.node.id ];
		if(node === undefined)
		{
			return;
		}else if(node.kind=="Pendding"){
			var target = node;
			var penddingRoot = partsList[target.original.id];
			penddingRoot.penndingFlag = false;
			this.nodeState( penddingRoot, false, runFlag);
			if(target.parent !== undefined )
			{
				this.dcaseAPI.linkParts(target.parent, penddingRoot);
			}
			this.dcaseAPI.deleteNode( partsList[ data.node.id ], partsList, nodes, links );
			
		}else{
			this.dcaseAPI.deleteNode( partsList[ data.node.id ], partsList, nodes, links );
		}
	}
	
	linkPath = function(data, partsList, links)
	{
		this.unlinkPath( data, partsList, links );
		this.dcaseAPI.linkParts( partsList[ data.source ], partsList[ data.target ]);
	}
	
	unlinkPath = function(data, partsList, links)
	{
		this.dcaseAPI.unlinkPath( partsList[data.source], partsList[data.target], links );
	}
	
	changeContent = function(data)
	{
		data.detail = unescape(data.detail);
		d3.selectAll( "#" + data.id + "_detail")
		.html(function(d)
		{
			if( data.addonInfo !== undefined )
			{
				d.addonInfo = data.addonInfo;
			}
			var tableInfo = "";
			// tableInfo = makeTableInfo(d.table);
			var addonTag = "";
			// addonTag = makeAddonTag(d);
			
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
				return(addonTag + "<pre class='preHTML' style='" + style +"'>ダブルクリックで\n内容の編集</pre>");
			}
			
			return( addonTag + d.detail + tableInfo);
		});
	}
	/*
	chat = function(data)
	{
		this.scope.chatLog.unshift( data );
		//this.timeout(function(){});
	}
	*/
	agree = function(data)
	{
		setAgreeLog( data )
	}
	
	invite = function(data)
	{
		/*
		this.scope.inviteDCase = data.value;
		$uibModal.open(
		{
			templateUrl:"alertInvite.html?" + Math.random(),
			scope: this.scope,
			backdrop : false,
			controller: function(this.scope, $uibModalInstance)
			{
				this.scope.ok = function() {
					location.href = "./editor.html?dcaseID=" + this.scope.inviteDCase.dcaseID;
					$uibModalInstance.close();
				};
				this.scope.cancel = function()
				{
					$uibModalInstance.dismiss('cancel');
				};
			}
		});
		*/
	}
}
