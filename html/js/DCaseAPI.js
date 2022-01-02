
function isList(obj) {
	var toString = Object.prototype.toString;
	return toString.call(obj).slice(8, -1).toLowerCase() == "list" || 
	toString.call(obj).slice(8, -1).toLowerCase() == "array";
}

var DCaseAPI = class{
    constructor( dcaseParts, viewPort, d3 )
    {
		this.dcaseParts = dcaseParts;
		this.viewPort = viewPort;

		try {
			global.d3 = d3;
		}catch (e) {
		}
	}
	
	linkParts = function( source, target, delLinkedPath )
	{
		var parent = this;
		return new Promise(function(resolve, reject)
        {
			var addFlag = true;
			for( var clidlenIndex in source.children )
			{
				var child = source.children[clidlenIndex];
				if(child.id == target.id)
				{
					addFlag = false;
				}
			}
			if( addFlag )
			{
				source.children.push(target);
			}
			target.parent = source;
			var link = {
				"source": source,
				"target": target,
			};

			var linkType = parent.checkLinkType(link)
			if( linkType == 1 )
			{
				parent.makePathSingle( link, delLinkedPath);
			}else if( linkType == 2 ){
				parent.makePathSingleDasharray( link, delLinkedPath);
			}else{
				parent.makePathDouble( link, delLinkedPath);
			}
			//link.target.apiFlag = link.source.apiFlag;

			resolve(link);
		});

	}

	//function this.makeLabel(node)
	makeLabel = function(node)
	{
		var addonTag = "";
		if(node.label != "" && node.label !== undefined)
		{
			var addonStyle = "float:right; "
			addonStyle += "margin-top: -10px;";
			addonStyle += "margin-right: -10px;";
			addonStyle += "width: " + (node.label.length*8+10) + "px;";
			addonStyle += "height: 20px;";
			addonStyle += "color: #ffffff;"
			addonStyle += "background-color: #800000;"
			addonStyle += "text-align: center;"
			addonTag = "<div style='" + addonStyle +"'>" + node.label + "</div>";	
		}
		return( addonTag );
	}
	
	createNodeInfo = function(id, kind, x, y, width, height, detail, addonInfo)
	{
		var parts = {
			"parent": undefined, //
			"kind": kind,
			"id": id,
			"detail": detail,
			"children": [],
			"x": x,
			"y": y,
			"offsetX": 0, //
			"offsetY": 0, //
			"width": width,
			"height": height,
			
			"label": "",
			"addonInfo": addonInfo,
			"tableInfo": "",

			"penndingFlag": false,
			"apiFlag": false,
			"apiPartsID": "",
			"apiHidden": false,
			"original": undefined,
			"hidden": false,

			// add function
			"viewPort": this.viewPort,
			"make":this.dcaseParts.partsKind[ kind ].make,
			"resize": this.dcaseParts.partsKind[ kind ].resize,
		};

		return(parts);
	}

	nodeInit = function(parts)
	{
		var kind = parts["kind"];
		parts["viewPort"] = this.viewPort;
		parts["make"] = this.dcaseParts.partsKind[ kind ].make;
		parts["resize"] = this.dcaseParts.partsKind[ kind ].resize;

		return(parts);
	}

	createNode = function( dcaseID, nodeList, click, drag, draggedSize, dragendedSize )
	{
		var thisObj = this;
		if(isList(nodeList) == false)
		{
			nodeList = [nodeList];
		}
		for(var nodeIndex in nodeList)
		{
			this.nodeInit(nodeList[nodeIndex]);
		}

		for(var index in nodeList)
		{
			var node = nodeList[index];
			d3.selectAll( "#" + node.id ).remove(); //Node
		}
		var node = d3.select("#svg").selectAll( nodeList[0].id ) //.selectAll( ".node" )
			.data( nodeList )
			.enter()
			.append("g")
			.attr("id", function(d){ return( d.id ); })
			.attr("class", function(d){ 
				return( "node node_" + d.kind );
			})
			.attr("transform", function(d){ 
				return( thisObj.dcaseParts.svgLocation(d.x, d.y, d.viewPort.scale) );
			})
			.attr("style", function(d)
			{
				return( thisObj.dcaseParts.webKitScale( d.x+d.viewPort.offsetX, d.y+d.viewPort.offsetY, d.viewPort.scale ) );
			})
			.on("click",click)
			.call(drag)
			;
		nodeList[0].make( node );
		
		node.append("foreignObject")
		.attr("id", function(d){ return( d.id + "_detail_outline" ); })
		.attr("width", function(d)
		{
			return(d.width);
		})
		.attr("height", function(d)
		{
			return(d.height);
		})
		.attr("x", function(d)
		{
			return( -d.width/2 );
		})
		.attr("y", function(d)
		{
			return( -d.height/2 );
		})
		.append("xhtml:div")
		.attr("xmlns", function(d)
		{
			return( "http://www.w3.org/1999/xhtml" );
		})
		.attr("width", function(d)
		{
			return( "100%" );
		})
		.attr("height", function(d)
		{
			return( "100%" );
		})
		.attr("style","overflow: hidden; padding:10px 10px 10px 10px ;")
		.attr("id", function(d){ return( d.id + "_detail" ); })
		.html(function(d)
		{
			var addonTag = thisObj.makeLabel(d);
			var tableInfo = thisObj.makeTableInfo(d.tableInfo);
				
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
				return(addonTag + "<pre class='preHTML' style='" + style +"'>ダブルクリックで\n内容の編集</pre>" + tableInfo);
			}
			return(addonTag  + d.detail + tableInfo);
		});


		if(draggedSize !== undefined)
		{
			this.dcaseParts.sizePoint( dcaseID, node, draggedSize, dragendedSize );
		}
	}

	makePathSingle = function(linkList, unlink)
	{
		var thisObj = this;
		if(isList(linkList) == false)
		{
			linkList = [linkList];
		}
		// console.log(linkList);
		d3.select("#svg").selectAll(".link_" + linkList[0].source.id + "_" + linkList[0].target.id)
			.data(linkList)
			.enter()
			.append("path")
			.attr("id",  function(d)
			{
				return("link_" + d.source.id + "_" + d.target.id);
			})
			.attr("class", function(d)
			{
				//var classValue = d3.select("#" + d.source.id).attr( "class" );
				return("link " + d.source.id + " " + d.target.id);
			})
			.attr("fill", "none")
			.attr("stroke", "#0000FF")
			.attr("stroke-width", function(d)
			{
				return( 6 );
			}).attr("transform", function(d){
				return( thisObj.dcaseParts.svgLocation(d.source.viewPort.offsetX, d.source.viewPort.offsetY, d.source.viewPort.scale) );
			})
			.attr("d", thisObj.dcaseParts.makePathLine)
			.attr("marker-end", "url(#arrowheadSingle)")
			.attr("style", function(d)
			{
				return( thisObj.dcaseParts.webKitScale( d.source.viewPort.offsetX, d.source.viewPort.offsetY, d.source.viewPort.scale ) );
			})
			.on("click", unlink);
		
	}
	
	makePathSingleDasharray = function(linkList, unlink)
	{
		console.log("makePathSingleDasharray", "hogehoge");
		var thisObj = this;
		if(isList(linkList) == false)
		{
			linkList = [linkList];
		}
		d3.select("#svg").selectAll(".link_" + linkList[0].source.id + "_" + linkList[0].target.id)
			.data(linkList)
			.enter()
			.append("path")
			.attr("id",  function(d)
			{
				return("link_" + d.source.id + "_" + d.target.id);
			})
			.attr("class", function(d)
			{
				return("link " + d.source.id + " " + d.target.id);
			})
			.attr("transform", function(d){
				return( thisObj.dcaseParts.svgLocation(d.source.viewPort.offsetX, d.source.viewPort.offsetY, d.source.viewPort.scale) );
			})
			.attr("fill", "none")
			.attr("stroke", "#0000FF")
			.attr("stroke-dasharray", "8 8")
			.attr("stroke-width", function(d)
			{
				return( 6 );
			})
			.attr("d", thisObj.dcaseParts.makePathLine)
			.attr("marker-end", "url(#arrowheadSingle)")
			.attr("style", function(d)
			{
				return( thisObj.dcaseParts.webKitScale( d.source.viewPort.offsetX, d.source.viewPort.offsetY, d.source.viewPort.scale ) );
			})
			.on("click", unlink);
	}
	

	makePathDouble = function(linkList, unlink)
	{
		var thisObj = this;
		if(isList(linkList) == false)
		{
			linkList = [linkList];
		}
		d3.select("#svg").selectAll(".link_" + linkList[0].source.id + "_" + linkList[0].target.id)
			.data(linkList)
			.enter()
			.append("path")
			.attr("id",  function(d)
			{
				return("link_" + d.source.id + "_" + d.target.id);
			})
			.attr("class", function(d)
			{
				return("link " + d.source.id + " " + d.target.id);
			})
			.attr("transform", function(d){
				return( thisObj.dcaseParts.svgLocation(d.source.viewPort.offsetX, d.source.viewPort.offsetY, d.source.viewPort.scale) );
			})
			 .attr("fill", "none")
			.attr("stroke", "#0000FF")
			.attr("stroke-width", function(d)
				{
					return( 6 );
				})
			.attr("d", thisObj.dcaseParts.makePathLine)
			.attr("marker-end", "url(#arrowhead)")
			.attr("style", function(d)
			{
				return( thisObj.dcaseParts.webKitScale( d.source.viewPort.offsetX, d.source.viewPort.offsetY, d.source.viewPort.scale ) );
			})
			.on("click", unlink);
			
		d3.select("#svg").selectAll(".linkInner_" + linkList[0].source.id + "_" + linkList[0].target.id)
			.data(linkList)
			.enter()
			.append("path")
			.attr("id",  function(d)
					{
						return("linkInner_" + d.source.id + "_" + d.target.id);
					})
			.attr("class", function(d)
					{
						return("linkInner " + d.source.id + " " + d.target.id);
					})
			.attr("fill", "none")
			.attr("stroke", function(d)
				{
					return( "#FFFFFF" );
				})
			.attr("stroke-width", function(d)
				{
					return( 4 );
				})
				.attr("transform", function(d){
					return( thisObj.dcaseParts.svgLocation(d.source.viewPort.offsetX, d.source.viewPort.offsetY, d.source.viewPort.scale) );
				})
			.attr("d", thisObj.dcaseParts.makePathLine)
			.attr("style", function(d)
			{
				return( thisObj.dcaseParts.webKitScale( d.source.viewPort.offsetX, d.source.viewPort.offsetY, d.source.viewPort.scale ) );
			})
			.on("click", unlink);
			;
	}
	
	changeNodeDisplay = function(runMode, node = undefined)
	{
		var nodeTag = ".node";
		if(node !== undefined)
		{
			nodeTag = "#" + node.id;
		}
		d3.select("#svg").selectAll( nodeTag )
		.attr("display", function(d)
		{
			// api create
			if(d.apiFlag == true)
			{
				if(runMode)
				{
					// dynamic
					if(d.apiHidden == false)
					{
						// console.trace("TRACE!");
						// console.log("changeNodeDisplay", d, "1");
						return("inline");
					}
				}else{
					// console.log("changeNodeDisplay", d, "2");
					// edit
					return("None");
				}
			}

			// 
			if(d.apiHidden == true)
			{
				if(runMode)
				{
					// console.log("changeNodeDisplay", d, "3");
					// dynamic
					return("None");
				}else{
					// console.log("changeNodeDisplay", d, "4");
					// edit
					return("inline");
				}
			}
			
			if(d.hidden == true)
			{
				// console.log("changeNodeDisplay", d, "5");
				// console.log("5");
				return("None");
			}
			
			// console.log("changeNodeDisplay", d, "6");
			// console.log(d, "6");
			return("inline");
		});
	}

	changePathDisplay = function(runMode, source=undefined, target=undefined)
	{
		var linkTag = ".link";
		var linkInnerTag = ".linkInner";
		if( source !== undefined && target !== undefined)
		{
			linkTag = "#link_" + source.id + "_" + target.id;
			linkInnerTag = "#linkInner_" + source.id + "_" + target.id;
		}
		// d3.select("#svg").selectAll( ".link" )
		// d3.select("#svg").select(".linkInner")
		
		d3.select("#svg").selectAll( linkTag )
		.attr("display", function(d)
		{
			/*
			if(d.source.apiFlag == true)
			{
				if(runMode)
				{
					// dynamic
					if(d.source.apiHidden == false)
					{
						return("inline");
					}
				}else{
					// edit
					return("None");
				}
			}
			*/
			// 
			if(d.source.apiHidden == true)
			{
				if(runMode)
				{
					// dynamic
					return("None");
				}else{
					// edit
					return("inline");
				}
			}
			
			if(d.target.apiFlag == true)
			{
				if(runMode)
				{
					// dynamic
					if(d.target.apiHidden == false)
					{
						return("inline");
					}
				}else{
					// edit
					return("None");
				}
			}

			// 
			if(d.target.apiHidden == true)
			{
				if(runMode)
				{
					// dynamic
					return("None");
				}else{
					// edit
					return("inline");
				}
			}
			if(d.source.hidden == true)
			{
				return("None");
			}
			if(d.target.hidden == true)
			{
				return("None");
			}
			return("inline");
		});

		d3.select("#svg").select( linkInnerTag )
		.attr("display", function(d)
		{
			if(d.source.apiFlag == true)
			{
				if(runMode)
				{
					// dynamic
					if(d.source.apiHidden == false)
					{
						return("inline");
					}
				}else{
					// edit
					return("None");
				}
			} 
			if(d.source.apiHidden == true)
			{
				if(runMode)
				{
					// dynamic
					return("None");
				}else{
					// edit
					return("inline");
				}
			}
			

			if(d.target.apiFlag == true)
			{
				if(runMode)
				{
					// dynamic
					if(d.target.apiHidden == false)
					{
						return("inline");
					}
				}else{
					// edit
					return("None");
				}
			}
			if(d.target.apiHidden == true)
			{
				if(runMode)
				{
					// dynamic
					return("None");
				}else{
					// edit
					return("inline");
				}
			}


			if(d.source.hidden == true)
			{
				return("None");
			}
			if(d.target.hidden == true)
			{
				return("None");
			}
			return("inline");
		});
	}

	moveTo = function( node )
	{
		var thisObj = this;
		d3.select("#" + node.id)
		.attr("transform",function(d)
		{
			d.x = node.x;
			d.y = node.y;
			return( thisObj.dcaseParts.svgLocation(d.x, d.y, d.viewPort.scale));
		}).attr("style", function(d)
		{
			return( thisObj.dcaseParts.webKitScale( d.x+d.viewPort.offsetX, d.y+d.viewPort.offsetY, d.viewPort.scale ) );
		});
		
		var nodes = d3.selectAll("." + node.id).attr("d", function(d)
		{
			if( d.source.id == node.id )
			{
				d.source.x = node.x;
				d.source.y = node.y;
			}else{
				d.target.x = node.x;
				d.target.y = node.y;
			}
			return( thisObj.dcaseParts.makePathLine(d) );
		});
	}
	
	deleteNode = function ( node, partsList, nodes, links )
	{
		d3.selectAll( "#" + node.id ).remove(); //Node
		d3.selectAll( "." + node.id ).remove(); //Link
		var loopFlag = 0;
	
		do
		{
			loopFlag = 0;
			for(var i in links)
			{
				var link = links[i];
				if( link.source.id == node.id || link.target.id == node.id )
				{
					links.splice( i, 1 );
					loopFlag = 1;
					break;
				}
			}
		}while(loopFlag == 1);
	
		if(node.parent !== undefined )
		{
			do
			{
				loopFlag = 0;
				for(var i in node.parent.children)
				{
					var item = node.parent.children[i];
					if( item.id == node.id )
					{
						node.parent.children.splice( i, 1 );
						loopFlag = 1;
						break;
					}
				}
			}while(loopFlag == 1);
		}
	
		for(var i in node.children )
		{
			var child = node.children[i];
			/*if( i== 0) 
			{
				dcase = child;
			}
			*/
			if( child.parent !== undefined )
			{
				delete child["parent"];
			}
		}
		delete partsList[node.id];
	
		do
		{
			loopFlag = 0;
			for(var i in nodes )
			{
				var item = nodes[i];
				if( item.id == node.id )
				{
					nodes.splice( i, 1 );
					loopFlag = 1;
					break;
				}
			}
		}while(loopFlag == 1);
	}
	
	unlinkPath = function( source, target, links )
	{
		d3.selectAll("#link_" + source.id + "_" + target.id).remove();
		d3.selectAll("#linkInner_" + source.id + "_" + target.id).remove();
		
		var loopFlag = 0;
		do
		{
			loopFlag = 0;
			for(var i in links)
			{
				var link = links[i];
				if( link.source.id == source.id && link.target.id == target.id )
				{
					links.splice( i, 1 );
					loopFlag = 1;
					break;
				}
			}
		}while(loopFlag == 1);
		
		do
		{
			loopFlag = 0;
			for(var i in source.children)
			{
				var node = source.children[i];
				if( node.id == target.id )
				{
					source.children.splice( i, 1 );
					loopFlag = 1;
					break;
				}
			}
		}while(loopFlag == 1);
		// delete target["parent"];
		target.parent = undefined;
	}
	
	makePartsList = function( data, kind )
	{
		var ret = [];
		var num = data.length;
		for( var i = 0; i < num; i++ )
		{
			if( data[i].kind == kind )
			{
				ret.push( data[i] );
			}
		}
		return( ret );
	}
	
	makeTableInfo = function(tableData)
	{
		if(tableData === undefined)
		{
			return("");
		}
		if(tableData.length == 0)
		{
			return("");
		}
		var tableInfo = '<center><table width="80%" border="1">';
		var table = tableData;
		for(var i in table )
		{
			var style = "";
			if(table[i]["Color"] !== undefined)
			{
				style += "color:" + table[i]["Color"] + ";";
			}
			if(table[i]["Font"] !== undefined)
			{
				style += "font-size:" + table[i]["Font"] + "px;";
			}
			tableInfo += '<tr style="' + style + '" >';
				tableInfo += "<td>";
					tableInfo += "" + table[i]["Key"];
				tableInfo += "</td>";
				tableInfo += "<td>";
					tableInfo += "" + table[i]["Value"];
				tableInfo += "</td>";
			tableInfo += "</tr>";
		}
		tableInfo += "<table></center>";
		return( tableInfo );
	}

	checkLinkType = function(path)
	{
		if( path.source.kind == "Goal" && path.target.kind == "Plan" )
		{
			return(1);
		}
		if( path.source.kind == "Goal" && path.target.kind == "Goal" )
		{
			return(1);
		}
		if( path.source.kind == "Goal" && path.target.kind == "Evidence" )
		{
			return(1);
		}
		if( path.source.kind == "Goal" && path.target.kind == "Unachieved" )
		{
			return(1);
		}
		if( path.source.kind == "Goal" && path.target.kind == "External" )
		{
			return(1);
		}
		
		if( path.source.kind == "Plan" && path.target.kind == "Goal" )
		{
			return(1);
		}
		if( path.source.kind == "Plan" && path.target.kind == "Evidence" )
		{
			return(1);
		}
		if( path.source.kind == "Plan" && path.target.kind == "Unachieved" )
		{
			return(1);
		}
		if( path.source.kind == "Plan" && path.target.kind == "External" )
		{
			return(1);
		}

		
		if( path.source.kind == "External" && path.target.kind == "Goal" )
		{
			return(1);
		}
		if( path.source.kind == "External" && path.target.kind == "Plan" )
		{
			return(1);
		}
		if( path.source.kind == "External" && path.target.kind == "Evidence" )
		{
			return(1);
		}
		if( path.source.kind == "External" && path.target.kind == "Unachieved" )
		{
			return(1);
		}
		return(0);
	}
	
	makePathList = function( data, mode )
	{
		var ret = [];
		var num = data.length;
		for( var i = 0; i < num; i++ )
		{
			if(mode == this.checkLinkType( data[i] ))
			{
				ret.push( data[i] );
			}
		}
		return( ret );
	}
	

	test = function()
	{
		console.log("hogehoge");
	}
	
}

try {
	module.exports = DCaseAPI;
}catch (e) {
}
