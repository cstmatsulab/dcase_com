const d3 = require('d3');
const jsdom = require('jsdom');
const fs = require('fs');
const { JSDOM } = jsdom;
const mongodb = require('mongodb')
const { execSync } = require('child_process')
const MongoClient = mongodb.MongoClient
const assert = require('assert')

const DCaseAPI = require('../js/DCaseAPI.js');
const DCaseParts = require('../js/DCaseParts.js');
//const { timeStamp } = require('console');

const url = 'mongodb://localhost:27017';

if(process.argv.length  != 3)
{
    return;
}

const dcaseID = process.argv[2];

const canvusSize = {
    x:99999999,
    y:99999999,
    width: 1,
    height: 1,
};

var dbClient = undefined;
var dcaseInfo = undefined;
var partsList = undefined;

MongoClient.connect(url, (err, client) =>
{
    fs.mkdir("/data/screenshot/" + dcaseID, function(errorCode)
    {

    });
    assert.equal(null, err);
    dbClient = client;
    const dcaseInfoDB = client.db("dcaseInfo");

    var select = {"dcaseID": dcaseID};
    dcaseInfoDB.collection("dcaseList").find(select).toArray(function(err, result)
    {
        if (err)
        {
            throw err;
        }
        result.forEach( function( value )
        {
            dcaseInfo = value;
        });
        //dbClient.close();
    });

    const dcasePartsDB = client.db("dcaseParts");
    var select = {};
    var projection = { projection: { "_id": 0, } }

    dcasePartsDB.collection(dcaseID).find(select, projection).toArray(function(err, result)
    {
        if (err)
        {
            throw err;
        }
        partsList = JSON.parse(JSON.stringify(result))
        partsList.forEach( function( value )
        {
            var width = value.x + value.width/2;
            var height = value.y + value.height/2;
            if(canvusSize.width < width)
            {
                canvusSize.width = width;
            }
            if(canvusSize.height < height)
            {
                canvusSize.height = height;
            }
            var x = value.x - value.width/2;
            var y = value.y - value.height/2;
            if(canvusSize.x > x)
            {
                canvusSize.x = x;
            }
            if(canvusSize.y > y)
            {
                canvusSize.y = y;
            }
        });
        canvusSize.x -= 50;
        canvusSize.y -= 50;
        canvusSize.width += 50;
        canvusSize.height += 50;
        setTimeout(d3Func);
        dbClient.close();
    });
});

function d3Func()
{
    const document = new JSDOM().window.document;
    const svg = d3.select(document.body)
        .append('svg')
        .attr("xmlns",'http://www.w3.org/2000/svg')
        .attr('width', canvusSize.width - canvusSize.x)
        .attr('height', canvusSize.height - canvusSize.y)
		.attr("id", "svg")
        .attr("class", "svgStyle")
        .style('background-color', "#FFFFFF");

    var dcaseParts = new DCaseParts();
    var viewPort ={"scale": 1.0, "offsetX":-canvusSize.x, "offsetY":-canvusSize.y };
    var dcaseAPI = new DCaseAPI(dcaseParts, viewPort, d3);
    
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

    ///////////
    var partsIDList = [];
    var nodes = [];
    var links = [];
    for( var key in partsList )
    {
        var parts = partsList[key];
        partsIDList[parts.id] = parts;
    }
    for( var key in partsIDList )
    {
        var parts = partsIDList[key];
        parts.children = [];
        for( var index in parts.childrenID )
        {
            var link = {};
            var target = partsIDList[ parts.childrenID[index] ];
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
        nodes.push( partsIDList[key] );
    }
    
    for( var key in partsIDList )
    {
        var parts = partsIDList[key];
        if( parts.parent == "")
        {
            parts.parent = undefined;
        }else{
            parts.parent = partsIDList[parts.parent];
        }
        if( parts.original == "")
        {
            parts.original = undefined;
        }else{
            parts.original = partsIDList[parts.original];
        }
    }
    global.document = document;
    var runFlag = false;
    ///////////
    d3.select("#svg").selectAll(".node").remove();
    d3.select("#svg").selectAll(".link").remove();
    d3.select("#svg").selectAll(".linkInner").remove();
    
    dcaseParts.makeArrow();
    
    var singlePathList = dcaseAPI.makePathList( links, 1 );
    if( singlePathList.length > 0 )
    {
        //dcaseAPI.makePathSingle( svg, singlePathList, delLinkedPathEvent, runFlag  );
        dcaseAPI.makePathSingle( singlePathList, function(){}, runFlag  );
    }
    
    var dasharrayPathList = dcaseAPI.makePathList( links, 2 );
    if( dasharrayPathList.length > 0 )
    {
        // dcaseAPI.makePathSingleDasharray( svg, dasharrayPathList, delLinkedPathEvent, runFlag  );
        dcaseAPI.makePathSingleDasharray( dasharrayPathList, function(){}, runFlag  );
    }
    
    var doublePathList = dcaseAPI.makePathList( links, 0 );
    if( doublePathList.length > 0 )
    {
        // dcaseAPI.makePathDouble( svg, doublePathList, delLinkedPathEvent, runFlag );
        dcaseAPI.makePathDouble( doublePathList, function(){}, runFlag );
    }
    for( kind in dcaseParts.partsKind )
    {
        var nodeList = dcaseAPI.makePartsList( nodes, kind );
        if( nodeList.length > 0 )
        {
            // dcaseAPI.createNode( dcaseID, svg, nodeList, nodeClickEvent, drag, dragendedSize, runFlag );
            dcaseAPI.createNode( dcaseID, nodeList, function(){}, function(){}, undefined, function(){} );
        }
    }
    
    
    
    dcaseAPI.changeNodeDisplay(runFlag);
    dcaseAPI.changePathDisplay(runFlag);

    var html = require('html');
    var hdoc = html.prettyPrint(document.body.innerHTML, {
        indent_size: 4, 
        indent_character: ' ', 
        max_char: 70
    });
    
    hdoc.replace(/<img.*>/g, function (match) {
        console.log("match", match);
        return match.toLowerCase();
    });
    hdoc = hdoc.replace(/<br>/g, "<br/>");
    // hdoc = hdoc.replace(/&amp;fileName=/g, '&fileName=');
    hdoc = hdoc.replace(/<img([^>]*)>/g, function(matchStr, g1)
    {
        g1 = g1.replace(/["|']*\.\/api\/getFile.php\?dcaseID=([^>]*)&(amp;)*fileName=([^>]*)[^"|^']*/g, '"/data/uploadFile/$1/$3');
        return("<img " + g1 + "/>");
    });

    function dateToStr24HPad0(date, format) {
        if (!format) {
            format = 'YYYY/MM/DD hh:mm:ss'
        }
        format = format.replace(/YYYY/g, date.getFullYear());
        format = format.replace(/MM/g, ('0' + (date.getMonth() + 1)).slice(-2));
        format = format.replace(/DD/g, ('0' + date.getDate()).slice(-2));
        format = format.replace(/hh/g, ('0' + date.getHours()).slice(-2));
        format = format.replace(/mm/g, ('0' + date.getMinutes()).slice(-2));
        format = format.replace(/ss/g, ('0' + date.getSeconds()).slice(-2));
        return format;
    }
    now = new Date();
    fileName = dateToStr24HPad0(now, 'YYYY_MMDD_hhmm_ss');
    timeStamp = dateToStr24HPad0(now, 'YYYY/MM/DD hh:mm:ss');
    baseDir = "/data/screenshot/" + dcaseID + "/";
    //hdoc = "<html>" + hdoc.replace(/<img.*>/g, "<img.*>") + "</html>";
    ret = {
        "result": "NG",
    };

    fs.writeFile(baseDir + fileName +'.svg', hdoc, function(err)
    {
        if(err){
            process.exit();
        }else{
            ret["fileName"] = fileName +'.jpg';
            fs.chmodSync(baseDir + fileName + '.svg', 0777);
            cmd  = "google-chrome --no-sandbox --headless --disable-gpu --screenshot=" + baseDir + fileName +'.jpg ' + " --window-size=" + 
            Math.ceil(canvusSize.width - canvusSize.x) + "," + Math.ceil(canvusSize.height - canvusSize.y) + " " + baseDir + fileName +'.svg 2>/dev/null';
        
            stdout = execSync(cmd)
            fs.chmodSync(baseDir + fileName + '.jpg', 0777);
            
            /*
            cmd  = "google-chrome --no-sandbox --headless --disable-gpu --print-to-pdf=" + baseDir + fileName +'.pdf ' + " --window-size=" + 
            Math.ceil(canvusSize.width - canvusSize.x) + "," + Math.ceil(canvusSize.height - canvusSize.y) + " " + baseDir + fileName +'.svg 2>/dev/null';
        
            stdout = execSync(cmd)
            fs.chmodSync(baseDir + fileName + '.pdf', 0777);
            */
            //ret = stdout.toString();
            ret["result"] = 'OK';
            ret["timeStamp"] = timeStamp;
            console.log(JSON.stringify(ret));
        }
    });
    /*
    const chromeLauncher = require('chrome-launcher');
    const CDP = require('chrome-remote-interface');
chromeLauncher.launch({
    startingUrl: "d3.svg",
    chromeFlags: ["--headless", "--disable-gpu", "--no-sandbox", "--screenshot", "--window-size=2000,2000", ]
  }).then(chrome => {
    console.log(`Chrome debugging port running on ${chrome.port}`);
  });
  */

}