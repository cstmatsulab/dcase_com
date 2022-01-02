var DcaseParts = class{
    constructor()
    {
		this.partsKind =
		{
			"Goal":
			{
				"name": "ゴール",
				"make": this.makeGoal,
				"resize": this.resizeGoal,
				"view":1,
			},
			"Plan":
			{
				"name": "戦略",
				"make": this.makePlan,
				"resize": this.resizePlan,
				"view":1,
			},
			"Suppose":
			{
				"name": "前提",
				"make": this.makeSuppose,
				"resize": this.resizeSuppose,
				"view":1,
			},
			"Evidence":
			{
				"name": "証拠",
				"make": this.makeEvidence,
				"resize": this.resizeEvidence,
				"view":1,
			},
			"Unachieved":
			{
				"name": "未到達",
				"make": this.makeUnachieved,
				"resize": this.resizeUnachieved,
				"view":1,
			},
			"Monitor":
			{
				"name": "モニタ",
				"make": this.makeMonitor,
				"resize": this.resizeMonitor,
				"view":0,
			},
			"Assumption":
			{
				"name": "仮定",
				"make": this.makeMonitor,
				"resize": this.resizeMonitor,
				"view":1,
			},
			"Justification":
			{
				"name": "正当化",
				"make": this.makeMonitor,
				"resize": this.resizeMonitor,
				"view":1,
			},	
			"External":
			{
				"name": "外部",
				"make": this.makeExternal,
				"resize": this.resizeExternal,
				"view":1,
			},
			"Pendding":
			{
				"name": "保留",
				"make": this.makePendding,
				"resize": this.resizePendding,
				"view":0,
			},
		};
	}
	

	updateLang = function(lang)
	{
		this.partsKind["Goal"].name = lang.PartsGoal;
		this.partsKind["Plan"].name = lang.PartsPlan;
		this.partsKind["Suppose"].name = lang.PartsSuppose;
		this.partsKind["Evidence"].name = lang.PartsEvidence;
		this.partsKind["Unachieved"].name = lang.PartsUnachieved;
		this.partsKind["Monitor"].name = lang.PartsMonitor;
		this.partsKind["Assumption"].name = lang.PartsAssumption;
		this.partsKind["Justification"].name = lang.PartsJustification;
		this.partsKind["External"].name = lang.PartsExternal;
	}

	//ゴールパーツ
	makeGoal = function( node )
	{
		node.append("rect")
		.attr("class", "Goal")
		.attr("id", function(d){
			return("shape_" + d.id);
		})
		.attr("x", function(d)
		{
			return(-d.width/2);
		})
		.attr("y", function(d)
		{
			return(-d.height/2);
		})
		.attr("width", function(d)
		{
			return(d.width);
		})
		.attr("height", function(d)
		{
			return(d.height);
		})
		.attr("fill", "#CCFFCC")
		.attr("stroke", function()
		{
			return("#0000FF");
		})
		.attr("style", function(d){
			if( d.style !== undefined )
			{
				var style="";
				if( d.style.border_color !== undefined )
				{
					style += "stroke:" + d.style.border_color + ";";
				}
				if( d.style.border_color !== undefined )
				{
					style += "stroke-width:" + d.style.border_thick + ";";
				}
			}
			return( style );
		})
		;
	}

	resizeGoal = function( d )
	{
		d3.selectAll("#shape_" + d.id)
		.attr("x", function(d)
		{
			return(-d.width/2);
		})
		.attr("y", function(d)
		{
			return(-d.height/2);
		})
		.attr("width", function(d)
		{
			return(d.width);
		})
		.attr("height", function(d)
		{
			return(d.height);
		});
	}

	//戦略パーツ
	makePlan = function( node )
	{
		node.append("rect")
		.attr("class", "Plan")
		.attr("id", function(d){
			return("shape_" + d.id);
		})
		.attr("x", function(d)
		{
			return(-d.width/2 );
		})
		.attr("y", function(d)
		{
			return(-d.height/2 );
		})
		.attr("width", function(d)
		{
			return(d.width );
		})
		.attr("height",function(d)
		{
			return(d.height );
		})
		.attr("transform", "skewX(-15)")
		.attr("fill", "#FFFFFF")
		.attr("stroke", "#0000FF")
		.attr("style", function(d){
			if( d.style !== undefined )
			{
				var style="";
				if( d.style.border_color !== undefined )
				{
					style += "stroke:" + d.style.border_color + ";";
				}
				if( d.style.border_color !== undefined )
				{
					style += "stroke-width:" + d.style.border_thick + ";";
				}
			}
			return( style );
		})
		;
	}

	resizePlan = function( d )
	{
		d3.selectAll("#shape_" + d.id)
		.attr("x", function(d)
		{
			return(-d.width/2 );
		})
		.attr("y", function(d)
		{
			return(-d.height/2 );
		})
		.attr("width", function(d)
		{
			return(d.width );
		})
		.attr("height",function(d)
		{
			return(d.height );
		});
	}

	makeSuppose = function( node )
	{
		node.append("rect")
		.attr("class", "Suppose")
		.attr("id", function(d){
			return("shape_" + d.id);
		})
		.attr("x", function(d)
		{
			return(-d.width/2);
		})
		.attr("y", function(d)
		{
			return(-d.height/2);
		})
		.attr("rx", 10)
		.attr("ry", 10)
		.attr("width", function(d)
		{
			return(d.width);
		})
		.attr("height", function(d)
		{
			return(d.height);
		})
		.attr("fill", "#FFFFFF")
		.attr("stroke", "#0000FF")
		.attr("style", function(d){
			if( d.style !== undefined )
			{
				var style="";
				if( d.style.border_color !== undefined )
				{
					style += "stroke:" + d.style.border_color + ";";
				}
				if( d.style.border_color !== undefined )
				{
					style += "stroke-width:" + d.style.border_thick + ";";
				}
			}
			return( style );
		})
		;
	}

	resizeSuppose = function( d )
	{
		d3.selectAll("#shape_" + d.id)
		.attr("x", function(d)
		{
			return(-d.width/2);
		})
		.attr("y", function(d)
		{
			return(-d.height/2);
		})
		.attr("width", function(d)
		{
			return(d.width);
		})
		.attr("height", function(d)
		{
			return(d.height);
		});
	}

	makeEvidence = function( node )
	{
		node.append("ellipse")
		.attr("class", "Evidence")
		.attr("id", function(d){
			return("shape_" + d.id);
		})
		.attr("cx", 0)
		.attr("cy", 0)
		.attr("rx", function(d)
		{
			return(d.width/2);
		})
		.attr("ry", function(d)
		{
			return(d.height/2);
		})
		.attr("width", function(d)
		{
			return(d.width);
		})
		.attr("height",function(d)
		{
			return(d.height);
		})
		.attr("fill", "#FFC5AA")
		.attr("stroke", "#0000FF")
		.attr("style", function(d){
			if( d.style !== undefined )
			{
				var style="";
				if( d.style.border_color !== undefined )
				{
					style += "stroke:" + d.style.border_color + ";";
				}
				if( d.style.border_color !== undefined )
				{
					style += "stroke-width:" + d.style.border_thick + ";";
				}
			}
			return( style );
		})
		;
	}

	resizeEvidence = function( d )
	{
		d3.selectAll("#shape_" + d.id)
		.attr("rx", function(d)
		{
			return(d.width/2);
		})
		.attr("ry", function(d)
		{
			return(d.height/2);
		})
		.attr("width", function(d)
		{
			return(d.width);
		})
		.attr("height",function(d)
		{
			return(d.height);
		});
	}

	makeMonitor = function( node )
	{
		node.append("ellipse")
		.attr("class", function(d)
		{
			return(d.kind);
		})
		.attr("id", function(d){
			return("shape_" + d.id);
		})
		.attr("cx", 0)
		.attr("cy", 0)
		.attr("rx", function(d)
		{
			return(d.width/2);
		})
		.attr("ry", function(d)
		{
			return(d.height/2);
		})
		.attr("width", function(d)
		{
			return(d.width);
		})
		.attr("height",function(d)
		{
			return(d.height);
		})
		.attr("fill", function(d)
		{
			if(d.kind=="Assumption")
			{
				return("#FFE699");
			}else if(d.kind=="Justification"){
				return("#BDD7EE");
			}
			return("#FFFFFF");
		})
		.attr("stroke", "#0000FF")
		.attr("style", function(d){
			if( d.style !== undefined )
			{
				var style="";
				if( d.style.border_color !== undefined )
				{
					style += "stroke:" + d.style.border_color + ";";
				}
				if( d.style.border_color !== undefined )
				{
					style += "stroke-width:" + d.style.border_thick + ";";
				}
			}
			return( style );
		})
		;
	}

	resizeMonitor = function( d )
	{
		d3.selectAll("#shape_" + d.id)
		.attr("rx", function(d)
		{
			return(d.width/2);
		})
		.attr("ry", function(d)
		{
			return(d.height/2);
		})
		.attr("width", function(d)
		{
			return(d.width);
		})
		.attr("height",function(d)
		{
			return(d.height);
		});
	}

	makeUnachieved = function( node )
	{
		node.append("polyline")
		.attr("class", "Unachieved")
		.attr("id", function(d){
			return("shape_" + d.id);
		})
		.attr("points", function(d)
			{
				var corner = d.height/3;
				var ret = "";
				ret += -d.width/2 + "," + 0 + " ";
				ret += 0 + "," + d.height/2 + " ";
				ret += d.width/2 + "," +  0 + " ";
				ret += 0 + "," + -d.height/2 + " ";
				ret += -d.width/2 + "," + 0 + " ";
				return(ret);
			})
		.attr("fill", "#FFFFFF")
		.attr("stroke", "#0000FF")
		.attr("style", function(d){
			if( d.style !== undefined )
			{
				var style="";
				if( d.style.border_color !== undefined )
				{
					style += "stroke:" + d.style.border_color + ";";
				}
				if( d.style.border_color !== undefined )
				{
					style += "stroke-width:" + d.style.border_thick + ";";
				}
			}
			return( style );
		})
		;
	}

	resizeUnachieved = function( d )
	{
		d3.selectAll("#shape_" + d.id)
		.attr("points", function(d)
			{
				var corner = d.height/3;
				var ret = "";
				ret += -d.width/2 + "," + 0 + " ";
				ret += 0 + "," + d.height/2 + " ";
				ret += d.width/2 + "," +  0 + " ";
				ret += 0 + "," + -d.height/2 + " ";
				ret += -d.width/2 + "," + 0 + " ";
				return(ret);
			});
	}

	makePendding = function( node )
	{
		node.append("polyline")
		.attr("class", "Pendding")
		.attr("id", function(d){
			return("shape_" + d.id);
		})
		.attr("points", function(d)
			{
				var corner = d.height/3;
				var ret = "";
				ret += -d.width/2 + "," + 0 + " ";
				ret += 0 + "," + d.height/2 + " ";
				ret += d.width/2 + "," +  0 + " ";
				ret += 0 + "," + -d.height/2 + " ";
				ret += -d.width/2 + "," + 0 + " ";
				return(ret);
			})
		.attr("fill", "#CCFFCC")
		.attr("stroke", "#0000FF")
		.attr("style", function(d){
			if( d.style !== undefined )
			{
				var style="";
				if( d.style.border_color !== undefined )
				{
					style += "stroke:" + d.style.border_color + ";";
				}
				if( d.style.border_color !== undefined )
				{
					style += "stroke-width:" + d.style.border_thick + ";";
				}
			}
			return( style );
		})
		;
	}

	resizePendding = function( d )
	{
		d3.selectAll("#shape_" + d.id)
		.attr("points", function(d)
			{
				var corner = d.height/3;
				var ret = "";
				ret += -d.width/2 + "," + 0 + " ";
				ret += 0 + "," + d.height/2 + " ";
				ret += d.width/2 + "," +  0 + " ";
				ret += 0 + "," + -d.height/2 + " ";
				ret += -d.width/2 + "," + 0 + " ";
				return(ret);
			});
	}

	makeExternal = function( node )
	{
		node.append("polyline")
		.attr("class", "External")
		.attr("id", function(d){
			return("shape_" + d.id);
		})
		.attr("points", function(d)
			{
				var corner = d.height/3;
				var ret = "";
				ret += -d.width/2 + "," + -d.height/2 + " ";
				ret += d.width/2 + "," + -d.height/2 + " ";
				ret += d.width/2 + "," +  (d.height/2 - corner) + " ";
				ret += (d.width/2 - corner) + "," + d.height/2 + " ";
				ret += (-d.width/2 + corner) + "," + d.height/2 + " ";
				ret += -d.width/2 + "," + (d.height/2 - corner) + " ";
				ret += -d.width/2 + "," + -d.height/2 + " ";
				return(ret);
			})
		.attr("fill", "#FFFFFF")
		.attr("stroke", "#0000FF")
		.attr("style", function(d){
			if( d.style !== undefined )
			{
				var style="";
				if( d.style.border_color !== undefined )
				{
					style += "stroke:" + d.style.border_color + ";";
				}
				if( d.style.border_color !== undefined )
				{
					style += "stroke-width:" + d.style.border_thick + ";";
				}
			}
			return( style );
		})
		;
	}

	resizeExternal = function ( d )
	{
		d3.selectAll("#shape_" + d.id)
		.attr("points", function(d)
			{
				var corner = d.height/3;
				var ret = "";
				ret += -d.width/2 + "," + -d.height/2 + " ";
				ret += d.width/2 + "," + -d.height/2 + " ";
				ret += d.width/2 + "," +  (d.height/2 - corner) + " ";
				ret += (d.width/2 - corner) + "," + d.height/2 + " ";
				ret += (-d.width/2 + corner) + "," + d.height/2 + " ";
				ret += -d.width/2 + "," + (d.height/2 - corner) + " ";
				ret += -d.width/2 + "," + -d.height/2 + " ";
				return(ret);
			});
	}

	updateInner = function(d)
	{
		var thisObj = this;
		var scale = d.viewPort.scale;
		var g = d3.selectAll("#" + d.id)
			.attr("transform",function(d){ return(thisObj.svgLocation(d.x,d.y,scale)); })
			;
		d.resize(d);
		
		g.selectAll(".LeftTopPoint")
		.attr("cx", function(d)
		{
			return(-d.width/2)
		})
		.attr("cy", function(d)
		{
			return(-d.height/2)
		})
		;
		
		g.selectAll(".LeftBottomPoint")
		.attr("cx", function(d)
		{
			return(-d.width/2)
		})
		.attr("cy", function(d)
		{
			return(d.height/2)
		})
		;
		g.selectAll(".RightTopPoint")
		.attr("cx", function(d)
		{
			return(d.width/2)
		})
		.attr("cy", function(d)
		{
			return(-d.height/2)
		})
		;
		g.selectAll(".RightBottomPoint")
		.attr("cx", function(d)
		{
			return(d.width/2)
		})
		.attr("cy", function(d)
		{
			return(d.height/2)
		})
		;
		g.selectAll(".RightBottomPoint")
		.attr("cx", function(d)
		{
			return(d.width/2)
		})
		.attr("cy", function(d)
		{
			return(d.height/2)
		})
		;

		g.selectAll( "#" + d.id + "_detail_outline")
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
		.selectAll( "#" + d.id + "_detail")
		.attr("width", function(d)
		{
			return( d.width );
		})
		;
		
		g.selectAll(".SizeRect")
		.attr("x", function(d)
		{
			return(-d.width/2 );
		})
		.attr("y", function(d)
		{
			return(-d.height/2 );
		})
		.attr("width", function(d)
		{
			return(d.width );
		})
		.attr("height",function(d)
		{
			return(d.height );
		})
		;
	}

	startDragSize = function(d)
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

	sizePoint = function( dcaseID, node, drag, dragend )
	{
		var thisObj = this;
		var dragLeftTopPoint = d3.drag()
			.on("start", this.startDragSize)
			.on("drag", function(d)
			{
				//console.log("dragLeftTopPoint");
				var scale = d.viewPort.scale;
				var width  = d.orWidth - 2*(d3.event.x - d.start.x);
				var height = d.orHeight - 2*(d3.event.y - d.start.y);
				
				if( width < 100 )
				{
					width = 100;
				}
				if( height < 100 )
				{
					height = 100;
				}
				
				d3.selectAll("." + d.id).attr("d", thisObj.makePathLine);
				d.width = width;
				d.height = height;
				thisObj.updateInner(d);
				drag( dcaseID, d );
			})
			.on("end", dragend)
			;
		var dragLeftBottomPoint = d3.drag()
			.on("start", this.startDragSize)
			.on("drag", function(d)
			{
				//console.log("dragLeftBottomPoint");
				var scale = d.viewPort.scale;
				var width  = d.orWidth - 2*(d3.event.x - d.start.x);
				var height = d.orHeight + 2*(d3.event.y - d.start.y);
				
				if( width < 100 )
				{
					width = 100;
				}
				if( height < 100 )
				{
					height = 100;
				}
				d3.selectAll("." + d.id).attr("d", thisObj.makePathLine);
				d.width = width;
				d.height = height;
				thisObj.updateInner(d);
				drag( dcaseID, d );
			})
			.on("end", dragend)
			;

		var dragRightTopPoint = d3.drag()
			.on("start", this.startDragSize)
			.on("drag", function(d)
			{
				//console.log("dragRightTopPoint");
				var scale = d.viewPort.scale;
				var width  = d.orWidth + 2*(d3.event.x - d.start.x);
				var height = d.orHeight - 2*(d3.event.y - d.start.y);
				
				if( width < 100 )
				{
					width = 100;
				}
				if( height < 100 )
				{
					height = 100;
				}
				d3.selectAll("." + d.id).attr("d", thisObj.makePathLine);
				d.width = width;
				d.height = height;
				thisObj.updateInner(d);
				drag( dcaseID, d );
			})
			.on("end", dragend)
			;

		var dragRightBottomPoint = d3.drag()
			.on("start", this.startDragSize)
			.on("drag", function(d)
			{
				//console.log("dragRightBottomPoint");
				var scale = d.viewPort.scale;
				var width  = d.orWidth + 2*(d3.event.x - d.start.x);
				var height = d.orHeight + 2*(d3.event.y - d.start.y);
				
				if( width < 100 )
				{
					width = 100;
				}
				if( height < 100 )
				{
					height = 100;
				}
				d3.selectAll("." + d.id).attr("d", thisObj.makePathLine);
				d.width = width;
				d.height = height;
				thisObj.updateInner(d);
				drag( dcaseID, d );
			})
			.on("end", dragend)
			;

		node.append("rect")
		.attr("class", "SizeRect SizePoint")
		.attr("x", function(d)
		{
			return(-d.width/2 );
		})
		.attr("y", function(d)
		{
			return(-d.height/2 );
		})
		.attr("width", function(d)
		{
			return(d.width );
		})
		.attr("height",function(d)
		{
			return(d.height );
		})
		.attr("fill-opacity", 0)
		.attr("stroke", "#666666")
		.attr("style","display:none")
		;

		node.append("ellipse")
		.attr("class", "LeftTopPoint SizePoint")
		.attr("cx", function(d)
		{
			return(-d.width/2)
		})
		.attr("cy", function(d)
		{
			return(-d.height/2)
		})
		.attr("rx", 10)
		.attr("ry", 10)
		.attr("width", 20)
		.attr("height", 20)
		.attr("fill", "#DDDDDD")
		.attr("stroke", "#666666")
		.attr("style","display:none")
		.call(dragLeftTopPoint)
		;
		
		node.append("ellipse")
		.attr("class", "LeftBottomPoint SizePoint")
		.attr("cx", function(d)
		{
			return(-d.width/2)
		})
		.attr("cy", function(d)
		{
			return(d.height/2)
		})
		.attr("rx", 10)
		.attr("ry", 10)
		.attr("width", 20)
		.attr("height", 20)
		.attr("fill", "#DDDDDD")
		.attr("stroke", "#666666")
		.attr("style","display:none")
		.call(dragLeftBottomPoint)
		;
		
		node.append("ellipse")
		.attr("class", "RightTopPoint SizePoint")
		.attr("cx", function(d)
		{
			return(d.width/2)
		})
		.attr("cy", function(d)
		{
			return(-d.height/2)
		})
		.attr("rx", 10)
		.attr("ry", 10)
		.attr("width", 20)
		.attr("height", 20)
		.attr("fill", "#DDDDDD")
		.attr("stroke", "#666666")
		.attr("style","display:none")
		.call( dragRightTopPoint )
		;
		
		node.append("ellipse")
		.attr("class", "RightBottomPoint SizePoint")
		.attr("cx", function(d)
		{
			return(d.width/2)
		})
		.attr("cy", function(d)
		{
			return(d.height/2)
		})
		.attr("rx", 10)
		.attr("ry", 10)
		.attr("width", 20)
		.attr("height", 20)
		.attr("fill", "#DDDDDD")
		.attr("stroke", "#666666")
		.attr("style","display:none")
		.call( dragRightBottomPoint )
		;
	}

	makePathLine = function (d)
	{
		if(d.source.x === undefined || d.target.x === undefined )
		{
			return("");
		}
		var dx = d.source.x - d.target.x;
		var dy = d.source.y - d.target.y;
		var deg = Math.atan2(dy,dx) * 180 / Math.PI;
		
		var ret = "M";
		if(	
			( d.source.kind == "Goal" && d.target.kind == "Goal") || 
			( d.source.kind == "Goal" && d.target.kind == "Plan") || 
			( d.source.kind == "Goal" && d.target.kind == "Evidence") ||
			( d.source.kind == "Goal" && d.target.kind == "Unachieved")  || 
			( d.source.kind == "Goal" && d.target.kind == "External")  || 
			( d.source.kind == "Plan" && d.target.kind == "Goal") ||
			( d.source.kind == "Plan" && d.target.kind == "Evidence") ||
			( d.source.kind == "Plan" && d.target.kind == "Unachieved") ||
			( d.source.kind == "Plan" && d.target.kind == "External") ||
			( d.source.kind == "External" && d.target.kind == "Goal") ||
			( d.source.kind == "External" && d.target.kind == "Plan") || 
			( d.source.kind == "External" && d.target.kind == "Evidence") ||
			( d.source.kind == "External" && d.target.kind == "Unachieved") )
		{
			if( -180 <= deg && deg < 0 ){
				ret += (d.source.x) + "," + (d.source.y + d.source.height/2);
				ret += "L";
				ret += (d.target.x) + "," + (d.target.y - d.target.height/2 - 23);
			}else{
				ret += (d.source.x) + "," + (d.source.y - d.source.height/2);
				ret += "L";
				ret += (d.target.x) + "," + (d.target.y + d.target.height/2 + 23);
			}
		}else{
			if( -90 <= deg && deg < 90 ){
				ret += (d.source.x - d.source.width/2) + "," + (d.source.y);
				ret += "L";
				ret += (d.target.x + d.target.width/2 + 23) + "," + (d.target.y);
			}else{
				ret += (d.source.x + d.source.width/2) + "," + (d.source.y);
				ret += "L";
				ret += (d.target.x - d.target.width/2 -23) + "," + (d.target.y);
			}
		}

		/*
		var ret = "M";
		if( -150 <= deg && deg < -30 )
		{
			ret += (d.source.x) + "," + (d.source.y + d.source.height/2);
		}else if( -30 <= deg && deg < 30 ){
			ret += (d.source.x - d.source.width/2) + "," + (d.source.y);
		}else if( 30 <= deg && deg < 150 ){
			ret += (d.source.x) + "," + (d.source.y - d.source.height/2);
		}else if( 150 <= deg || deg < -150 ){
			ret += (d.source.x + d.source.width/2) + "," + (d.source.y);
		}else{

		}
		ret += "L";
		if( -150 <= deg && deg < -30 )
		{
			ret += (d.target.x) + "," + (d.target.y - d.target.height/2 - 23);
		}else if( -30 <= deg && deg < 30 ){
			ret += (d.target.x + d.target.width/2 + 23) + "," + (d.target.y);
		}else if( 30 <= deg && deg < 150 ){
			ret += (d.target.x) + "," + (d.target.y + d.target.height/2 + 23);
		}else if( 150 <= deg || deg < -150 ){
			ret += (d.target.x - d.target.width/2 -23) + "," + (d.target.y);
		}
		*/
		return(ret);
	}

	makeArrow = function ()
	{
		var scale = 0.6;
		var arrowSize = 10;
		var refX = 0.2;//2/scale; - scale;
		var refY = 3*scale;
		var line = d3.line()
				.x(function(d){ return d[1]; })
				.y(function(d){ return d[0]; });

		var defs = d3.select("#svg").append("svg:defs");
		var marker = defs
			.append("svg:marker")
			.attr('id', "arrowhead")
			.attr('class', "arrowhead")
			.attr('refX', refX)
			.attr('refY', refY)
			.attr('markerWidth', arrowSize)
			.attr('markerHeight', arrowSize)
			.attr("fill", "#FFFFFF")
			.attr("stroke", "#0000FF")
			.attr('orient', "auto")
			;
		marker.append("path")
			.attr("stroke-width", 0.3)
			.attr("d", line( [[scale*1, scale*0], [scale*5, scale*0], [scale*3, scale*4], [scale*1, scale*0]] ) );
			//.attr("d", line( [[1, 0], [5, 0], [3, 4], [1, 0]] ) );
		
		marker = defs
			.append("marker")
			.attr('id', "arrowheadSingle")
			.attr('class', "arrowheadSingle")
			.attr('refX', refX)
			.attr('refY', refY)
			.attr('markerWidth', arrowSize)
			.attr('markerHeight', arrowSize)
			.attr("fill", "#0000FF")
			.attr("stroke", "#0000FF")
			.attr('orient', "auto")
			;
			
		marker.append("path")
			.attr("stroke-width", 0.3)
			.attr("d", line( [[scale*1, scale*0], [scale*5, scale*0], [scale*3, scale*4], [scale*1, scale*0]] ) );
			//.attr("d", line( [[1, 0], [5, 0], [3, 4], [1, 0]] ) );


		/// red
		var marker = defs
			.append("svg:marker")
			.attr('id', "arrowheadRed")
			.attr('class', "arrowhead")
			.attr('refX', refX)
			.attr('refY', refY)
			.attr('markerWidth', arrowSize)
			.attr('markerHeight', arrowSize)
			.attr("fill", "#FFFFFF")
			.attr("stroke", "#FF0000")
			.attr('orient', "auto")
			;
		marker.append("path")
			.attr("stroke-width", 0.3)
			.attr("d", line( [[scale*1, scale*0], [scale*5, scale*0], [scale*3, scale*4], [scale*1, scale*0]] ) );
			//.attr("d", line( [[1, 0], [5, 0], [3, 4], [1, 0]] ) );
		
		marker = defs
			.append("marker")
			.attr('id', "arrowheadSingleRed")
			.attr('class', "arrowheadSingle")
			.attr('refX', refX)
			.attr('refY', refY)
			.attr('markerWidth', arrowSize)
			.attr('markerHeight', arrowSize)
			//.attr('markerWidth', 10)
			//.attr('markerHeight', 10)
			.attr("fill", "#FF0000")
			.attr("stroke", "#FF0000")
			.attr('orient', "auto")
			;
			
		marker.append("path")
			.attr("stroke-width", 0.3)
			.attr("d", line( [[scale*1, scale*0], [scale*5, scale*0], [scale*3, scale*4], [scale*1, scale*0]] ) );
			//.attr("d", line( [[1, 0], [5, 0], [3, 4], [1, 0]] ) );
		return( marker );
	}

	webKitScale = function ( dx, dy, scale)
	{
		var ret = "";
		ret += "-webkit-transform:";
		ret += " scale(" + scale + ") ";
		ret += " translate(" + dx + "px," + dy + "px);\n";
		
		ret += "-moz-transform:";
		ret += " scale(" + scale + ") ";
		ret += " translate(" + dx + "px," + dy + "px);";

		return( ret );
	}

	svgLocation = function (x, y, scale=1)
	{
		return("scale(" + scale+","+scale+") translate(" + x+ "," + y+")");
		//return("scale(" + scale+","+scale+") translate(" + (x+viewPort.offsetX)+ "," + (y +viewPort.offsetY)+")");
	}

	buttonDef = {
		list: {
			ico: 'emoji',
			dropdown: [
				
			],
		},
		color: {
			ico: 'fore-color',
			dropdown: [
				'black',
				'red',
				'blue',
			],
		},
		'black':
		{
			title:"<font color='black'>black</font>",
			fn: 'foreColor',
			param:"#000000",
		},
		'red':
		{
			title:"<font color='red'>red</font>",
			fn: 'foreColor',
			param:"#FF0000",
		},
		'blue':
		{
			title:"<font color='blue'>blue</font>",
			fn: 'foreColor',
			param:"#0000FF",
		},
		fontSize: {
			ico: 'p',
			dropdown: [
				'font8pt',
				'font10.5pt',
				'font12pt',
				'font14pt',
				'font16pt',
				'font18pt',
				'font20pt',
				'font24pt',
				'font28pt',
				'font32pt',
				'font36pt',
			],
		},
		'font8pt':
		{
			title:"8pt",
			fn: 'insertHTML',
			param:"style='font-size:8pt;'",
		},
		'font9pt':
		{
			title:"9pt",
			fn: 'insertHTML',
			param:"style='font-size:9pt;'",
		},
		'font10pt':
		{
			title:"10pt",
			fn: 'insertHTML',
			param:"style='font-size:10pt;'",
		},
		'font10.5pt':
		{
			title:"10.5pt",
			fn: 'insertHTML',
			param:"style='font-size:10.5pt;'",
		},
		'font11pt':
		{
			title:"11pt",
			fn: 'insertHTML',
			param:"style='font-size:11pt;'",
		},
		'font12pt':
		{
			title:"12pt",
			fn: 'insertHTML',
			param:"style='font-size:12pt;'",
		},
		'font14pt':
		{
			title:"14pt",
			fn: 'insertHTML',
			param:"style='font-size:14pt;'",
		},
		'font16pt':
		{
			title:"16pt",
			fn: 'insertHTML',
			param:"style='font-size:16pt;'",
		},
		'font18pt':
		{
			title:"18pt",
			fn: 'insertHTML',
			param:"style='font-size:18pt;'",
		},
		'font20pt':
		{
			title:"20pt",
			fn: 'insertHTML',
			param:"style='font-size:20pt;'",
		},
		'font24pt':
		{
			title:"24pt",
			fn: 'insertHTML',
			param:"style='font-size:24pt;'",
		},
		'font28pt':
		{
			title:"28pt",
			fn: 'insertHTML',
			param:"style='font-size:28pt;'",
		},
		'font32pt':
		{
			title:"32pt",
			fn: 'insertHTML',
			param:"style='font-size:32pt;'",
		},
		'font36pt':
		{
			title:"36pt",
			fn: 'insertHTML',
			param:"style='font-size:36pt;'",
		},
		'font40pt':
		{
			title:"40pt",
			fn: 'insertHTML',
			param:"style='font-size:40pt;'",
		},
		'font44pt':
		{
			title:"44pt",
			fn: 'insertHTML',
			param:"style='font-size:44pt;'",
		},
		'font48pt':
		{
			title:"48pt",
			fn: 'insertHTML',
			param:"style='font-size:48pt;'",
		},
		'font54pt':
		{
			title:"54pt",
			fn: 'insertHTML',
			param:"style='font-size:54pt;'",
		},
		'font60pt':
		{
			title:"60pt",
			fn: 'insertHTML',
			param:"style='font-size:60pt;'",
		},
	};

	editorConfig =
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
		btnsDef: this.buttonDef,
	}
}

try {
	module.exports = DcaseParts;
}catch (e) {
}
