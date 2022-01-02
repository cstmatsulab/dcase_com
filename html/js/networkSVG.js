function makeDCaseNode( svg, dcase, drag, openDCaseInfo )
{
	var partsWidth = 200;
	var partsHeight = 100;
	
	var dcaseNode = svg.selectAll(".dcase")
		.data(dcase)
		.enter()
		.append("g")
		.attr("class","dcase")
		.attr('id', function(d)
		{
			return("dcaseNode_" + d.dcaseID);
		})
		.attr("transform", function(d)
		{
			return "translate("+  d.x + "," + d.y + ")";
		})
		.call(drag)
		// .on("click", openDCaseInfo)
		;
		
		
	dcaseNode.append("rect")
		.attr("class", "Suppose")
		.attr("x", -partsWidth/2)
		.attr("y", -partsHeight/2)
		.attr("rx", 10)
		.attr("ry", 10)
		.attr("width", partsWidth)
		.attr("height", partsHeight)
		.attr("fill", "#FFFFFF")
		.attr("stroke", function(d)
		{
			console.log(d.vote);
			var sum = 0;
			for( i in d.vote )
			{
				sum += d.vote[i];
			}
			var B = Math.floor(255 * d.vote[0] / sum);
			//var G = Math.floor(255 * d.vote[1] / sum);
			var G = 0;
			var R = Math.floor(255 * d.vote[2] / sum);
			ret = "rgb(" + R + "," + G + "," + B + ")";
			return(ret);
		})
		// .on("click", openDCaseInfo)
		;

	dcaseNode.append("text")
			.attr("class","PartsKindText")
			.attr('font-size', '16px')
			.text(function(d)
			{
				return( "D-Case" );
			})
			.attr("x",function(d)
			{
				return( -10*3 );
			})
			.attr("y",function(d)
			{
				return( partsHeight/2 - 5 );
			})
			// .on("click", openDCaseInfo)
			;
			
	dcaseNode.append("foreignObject")
		.attr("x", -partsWidth/2-1)
		.attr("y", -partsHeight/2-1)
		.attr("width", partsWidth-2)
		.attr("height", partsHeight-2)
		.style("overflow", "hidden")
		.append("xhtml:div")
		.attr("width", "100%")
		.attr("height", "100%")
		.style("word-wrap", "break-word")
		.style("word-break", "break-all")
		.style("margin", "10px")
		.html(function(d)
		{
			return(d.title);
		})
		// .on("click", openDCaseInfo)
		;
	return( dcaseNode );
}

function makeUserNode( svg, userList, drag, openUserInfo )
{
	var userNode = svg.append("g").attr("class", "userNode")
			.selectAll(".user")
			.data(userList)
			.enter()
			.append("g")
			.attr("class","user")
			.attr("transform", function(d)
			{
				return "translate("+  d.x + "," + d.y + ")";
			})
			.call(drag)
			// .on("click", openUserInfo )
			;
				
		userNode.append("circle")
			.attr("class", "userInfo")
			.attr("cx", 0)
			.attr("cy", 0)
			.attr("r", 30)
			.attr("fill", "#FFFFFF")
			.attr("stroke", "#0000FF")
			;
		
		userNode.append("text")
			.attr("class","UserName")
			.attr('font-size', '16px')
			.text(function(d)
			{
				return( ""+d.userName )
			})
			.attr("x",function(d)
			{
				var userName = ""+d.userName;
				return( -6 * userName.length );
			})
			.attr("y",function(d,i)
			{
				return(30 + 20);
			})
			;

		userNode.append("foreignObject")
			.attr("x", -29)
			.attr("y", -29)
			.attr("width", 58)
			.attr("height", 58)
			.style("overflow", "hidden")
			.append("xhtml:img")
			.attr("width", "100%")
			.attr("height", "100%")
			.attr("src", function(d){ return("./pic/user/" + d.id +".jpg");})
			.style("border-radius", "30px")
			;
	return( userNode );
}