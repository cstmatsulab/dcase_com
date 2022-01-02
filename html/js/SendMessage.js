// var this.socketio = io.connect('https://' + location.host + '/editor');

var SendMessage = class {
    constructor(socketio)
    {
		this.messageCount = 0;
        this.socketio = socketio
	}
	
	serverConnect = function( dcaseID) //, userID )
	{
		
		this.socketio.send( JSON.stringify(
			{
				"mode": "connected",
				"dcaseID" : dcaseID,
				// "userID" : userID,
			}
		) );
		
		//this.socketio.emit("connected", { "dcaseID": dcaseID, "userID" : userID });
	}

	createNode = function( dcaseID, part )
	{
		var keyList = Object.keys(part);
		var item = {
			"childrenID":[],
			"parent":"",
		};
		for( var i in keyList)
		{
			var key = keyList[i];
			if(key == "parent" || key == "original" || key == "children" || key == "viewPort" || key == "resize" || key == "make" )
			{
				continue;
			}
			
			item[key] = part[key];
		}

		// todo
		if( part.parent === undefined )
		{
			item.parent = "";
		}else{
			item.parent = part.parent.id;
		}
		
		// todo
		if( part.original === undefined )
		{
			item.original = "";
		}else{
			item.original = part.original.id;
		}


		for(var childIndex in part.children)
		{
			var child = part.children[childIndex];
			item.childrenID.push(child.id);
		}
		
		if( item.addonInfo === undefined )
		{
			item.addonInfo = [];
		}
		this.messageCount += 1;

		this.socketio.send( JSON.stringify(
			{
				"mode": "createNode",
				"dcaseID" : dcaseID,
				"node": item,
				"msgCount": this.messageCount,
			}
		) );

		/*
		this.socketio.emit("createNode",
		{
			"dcaseID" : dcaseID,
			"node": item,
			"msgCount": this.messageCount,
		});
		*/
		return(this.messageCount);
	}

	updateNode = function( dcaseID, part )
	{
		var keyList = Object.keys(part);
		var item = {
			"childrenID":[],
			"parent":"",
		};
		for( var i in keyList)
		{
			var key = keyList[i];
			if(key == "parent" || key == "original" || key == "children" || key == "viewPort" || key == "resize" || key == "make" )
			{
				continue;
			}
			
			item[key] = part[key];
		}

		// todo
		if( part.parent === undefined )
		{
			item.parent = "";
		}else{
			item.parent = part.parent.id;
		}
		
		// todo
		if( part.original === undefined )
		{
			item.original = "";
		}else{
			item.original = part.original.id;
		}


		for(var childIndex in part.children)
		{
			var child = part.children[childIndex];
			item.childrenID.push(child.id);
		}
		
		if( item.addonInfo === undefined )
		{
			item.addonInfo = [];
		}
		var obj = JSON.stringify(
			{
				"mode": "updateNode",
				"dcaseID" : dcaseID,
				"node": item,
			});
			obj.node.detail = escape(obj.node.detail);
		
		this.socketio.send( obj );
		/*
		this.socketio.emit("updateNode",
		{
			"dcaseID" : dcaseID,
			"node": item,
		});
		*/
	}

	
	deleteNode = function( dcaseID, node )
	{
		
		this.socketio.send( JSON.stringify(
			{
				"mode": "deleteNode",
				"dcaseID" : dcaseID,
				"id": node.id
			}
		) );
		/*
		this.socketio.emit("deleteNode",
		{
			"dcaseID" : dcaseID,
			"id": node.id
		});
		*/
	}

	linkPath = function( dcaseID, sourceID, targetID )
	{
		
		this.socketio.send( JSON.stringify(
			{
				"mode": "linkPath",
				"dcaseID" : dcaseID,
				"source": sourceID,
				"target": targetID,
			}
		) );
		/*
		this.socketio.emit("linkPath",
		{
			"dcaseID" : dcaseID,
			"source": sourceID,
			"target": targetID,
		});
		*/
	}

	unlinkPath = function(dcaseID, sourceID, targetID )
	{
		
		this.socketio.send( JSON.stringify(
			{
				"mode": "unlinkPath",
				"dcaseID" : dcaseID,
				"source": sourceID,
				"target": targetID,
			}
		) );
		/*
		this.socketio.emit("unlinkPath",
		{
			"dcaseID" : dcaseID,
			"source": sourceID,
			"target": targetID,
		});
		*/
	}

	moveTo = function( dcaseID, node )
	{
		this.socketio.send( JSON.stringify(
			{
				"mode": "moveTo",
				"dcaseID" : dcaseID,
				"id": node.id,
				"x":node.x,
				"y":node.y
			}
		) );
		/*
		this.socketio.emit("moveTo",
		{
			"dcaseID" : dcaseID,
			"id": node.id,
			"x":node.x,
			"y":node.y
		});
		*/
	}

	changeSize = function( dcaseID, node )
	{
		this.socketio.send( JSON.stringify(
			{
				"mode": "changeSize",
				"dcaseID" : dcaseID,
				"id": node.id,
				"width":node.width,
				"height":node.height,
			}
		) );
		/*
		this.socketio.emit("changeSize",
		{
			"dcaseID" : dcaseID,
			"id": node.id,
			"width":node.width,
			"height":node.height
		});
		*/
	}

	changeContent = function( dcaseID, node )
	{
		var utf8str = Encoding.convert(node.detail, 'UTF-8'); //unescape(encodeURIComponent(node.detail));
		var obj = JSON.stringify(
			{
				"mode": "changeContent",
				"dcaseID" : dcaseID,
				"id": node.id,
				"detail":escape(node.detail),
				"addonInfo": node.addonInfo,
			});
		this.socketio.send( obj );
		/*
		this.socketio.emit("changeContent",
		{
			"dcaseID" : dcaseID,
			"id": node.id,
			"detail":node.detail,
			"addonInfo": node.addonInfo,
		});
		*/
	}

	changeAddonInfo = function( dcaseID, node )
	{
		this.socketio.send( JSON.stringify(
			{
				"mode": "changeAddonInfo",
				"dcaseID" : dcaseID,
				"id": node.id,
				"detail":node.detail,
				"addonInfo": node.addonInfo,
			}
		) );
		/*
		this.socketio.emit("changeAddonInfo",
		{
			"dcaseID" : dcaseID,
			"id": node.id,
			"detail":node.detail,
			"addonInfo": node.addonInfo,
		});
		*/
	}

	chat = function( dcaseID, line )
	{
		/*
		line.dcaseID = dcaseID,
		this.socketio.send( JSON.stringify(
			{
				"mode": "chat",
				"dcaseID" : dcaseID,
				"id": node.id,
				"detail":node.detail,
				"addonInfo": node.addonInfo,
			}
		) );
		this.socketio.emit("chat", line);
		*/
	}

	agree = function( dcaseID, line )
	{
		//line.dcaseID = dcaseID,
		//this.socketio.emit("agree", line);
	}

	invite = function( dcaseInfo )
	{
		//this.socketio.emit("invite", dcaseInfo);	
	}

	nodeState = function( dcaseID, node, hiddenFlag )
	{
		this.socketio.send( JSON.stringify(
		{
			"mode": "nodeState",
			"dcaseID" : dcaseID,
			"id": node.id,
			"hiddenFlag": hiddenFlag,
		}
	) );
	/*
		this.socketio.emit("nodeState", {
			"dcaseID" : dcaseID,
			"id": node.id,
			"hiddenFlag": hiddenFlag,
		});	
		*/
	}
}