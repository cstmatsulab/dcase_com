
var DBApi = class{
    constructor( dcaseID, authID, http, permission=false)
    {
        this.dcaseID = dcaseID;
        this.authID = authID;
        this.http = http;
        this.permission = permission;
    }
    
    
	saveNode = function ( part )
	{
        var parent = this;
        var keyList = Object.keys(part);
        var item = {
            "childrenID":[],
            "parent":"",
        };
        for( var i in keyList)
        {
            var key = keyList[i];
            if(key == "parent" || key == "original" || key == "childrenID" || key == "children" || key == "viewPort" || key == "resize" || key == "make" )
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

        console.log("part.label", part.label)
        // todo
        if( part.label === undefined )
        {
            item.label = "";
        }else{
            item.label = part.label;
        }

        return new Promise(function(resolve, reject)
        {
            if( parent.permission )
            {
                var json = JSON.stringify(item);
                var fd = new FormData();
                fd.append('authID', parent.authID );
                fd.append('dcaseID', parent.dcaseID );
                fd.append('partsID', item.id );
                fd.append('parts', json );
                parent.http.post('./api/updateParts.php',fd,{
                    transformRequest: null,
                    headers: {'Content-type':undefined}
                }).success(function(data, status, headers, config){
                    if(data.result == "OK")
                    {
                        resolve(data);
                    }
                });
            }
        });
    }

    loadDCase = function(userID, permission)
	{
        var parent = this;
		return new Promise(function(resolve, reject)
        {
            var fd = new FormData();
            fd.append('authID', parent.authID );
            fd.append('dcaseID', parent.dcaseID );
            parent.http.post('./api/loadDCase.php',fd,{
                transformRequest: null,
                headers: {'Content-type':undefined}
            }).success(function(data, status, headers, config){
                console.log( "loadDCase", data );
                if(data.result == "OK")
                {
                    var nodes = [];
                    var links = [];
                    var partsList = {};
                    var member = {};

                    var dcaseInfo = data.dcaseInfo;
                    parent.permission = false;

                    for(var i in dcaseInfo.member)
                    {
                        member[ dcaseInfo.member[i].userID ] = dcaseInfo.member[i];
                        if( dcaseInfo.member[i].userID == userID )
                        {
                            if(permission === undefined)
                            {
                                parent.permission = true;
                            }else{
                                parent.permission = permission;
                            }
                        }
                    }

                    for( var key in data.partsList )
                    {
                        var parts = data.partsList[key];
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
                    location.href = "./";
                }
            });
		});
    }
    
	loadChatLog = function()
	{
        var parent = this;
		return new Promise(function(resolve, reject)
        {
            var fd = new FormData();
            fd.append('authID', parent.authID );
            fd.append('dcaseID', parent.dcaseID );
            parent.http.post('./api/loadChatLog.php',fd,{
                transformRequest: null,
                headers: {'Content-type':undefined}
            }).success(function(data, status, headers, config){
                //console.log( "loadChatLog", data);
                if(data.result == "OK")
                {
                    resolve(data);
                    
                }
            });
        });
		
    }
    
    chatMessage = function(chatMessage)
    {
        var parent = this;
        return new Promise(function(resolve, reject)
        {
            if( parent.permission )
            {
                var fd = new FormData();
                fd.append('authID', parent.authID );
                fd.append('dcaseID', parent.dcaseID );
                fd.append('message', chatMessage );
                
                parent.http.post('./api/saveChatLog.php',fd,{
                    transformRequest: null,
                    headers: {'Content-type':undefined}
                }).success(function(data, status, headers, config){
                    if(data.result == "OK")
                    {
                        resolve(data);
                    }
                });
            }
        });
    }

    setAgree = function(agree)
    {
        var parent = this;
        return new Promise(function(resolve, reject)
        {
            if( parent.permission )
            {
                var fd = new FormData();
                fd.append('authID', parent.authID );
                fd.append('dcaseID', parent.dcaseID );
                fd.append('agree', agree );
                parent.http.post('./api/saveAgree.php',fd,{
                    transformRequest: null,
                    headers: {'Content-type':undefined}
                }).success(function(data, status, headers, config){
                    if(data.result == "OK")
                    {	
                        resolve(data);
                    }
                });
            }
        });
    }

    commit = function()
    {
        var parent = this;
        return new Promise(function(resolve, reject)
        {
            if( parent.permission )
            {
                var fd = new FormData();
                fd.append('authID', parent.authID );
                fd.append('dcaseID', parent.dcaseID );
                parent.http.post('./api/commit.php',fd,{
                    transformRequest: null,
                    headers: {'Content-type':undefined}
                }).success(function(data, status, headers, config){
                    if(data.result == "OK")
                    {	
                        resolve(data);
                    }
                });
            }
        });
    }

    updateTitle = function(dcaseTitle, publicFlag)
    {
        var parent = this;
        return new Promise(function(resolve, reject)
        {
            if( parent.permission )
            {
                var fd = new FormData();
                fd.append('authID', parent.authID );
                fd.append('dcaseID', parent.dcaseID );
                fd.append('title', dcaseTitle );
                fd.append('public', publicFlag );
                parent.http.post('./api/updateTitle.php',fd,{
                    transformRequest: null,
                    headers: {'Content-type':undefined}
                }).success(function(data, status, headers, config){
                    if(data.result == "OK")
                    {
                        resolve(data);
                    }
                });
            }
        });
    }

    removeParts = function( node )
	{
        var parent = this;
		return new Promise(function(resolve, reject)
        {
            if( parent.permission )
            {
                var fd = new FormData();
                fd.append('authID', parent.authID );
                fd.append('dcaseID', parent.dcaseID );
                fd.append('partsID', node.id );
                parent.http.post('./api/removeParts.php',fd,{
                    transformRequest: null,
                    headers: {'Content-type':undefined}
                }).success(function(data, status, headers, config){
                    if(data.result == "OK")
                    {
                        resolve(node);
                    }
                });
            }
        });
    }

	saveMoveTo = function( node )
	{
        var parent = this;
		return new Promise(function(resolve, reject)
        {
            if( parent.permission )
            {
                var fd = new FormData();
                fd.append('authID', parent.authID );
                fd.append('dcaseID', parent.dcaseID );
                fd.append('partsID', node.id );
                fd.append('x', node.x );
                fd.append('y', node.y );
                parent.http.post('./api/updateParts.php',fd,{
                    transformRequest: null,
                    headers: {'Content-type':undefined}
                }).success(function(data, status, headers, config){
                    if(data.result == "OK")
                    {
                        resolve(node);
                    }
                });
            }
        });
	}

	saveLinkPath = function( source, target )
	{
        var parent = this;
		return new Promise(function(resolve, reject)
        {
            if( parent.permission )
            {
                var fd = new FormData();
                fd.append('authID', parent.authID );
                fd.append('dcaseID', parent.dcaseID );
                fd.append('source', source );
                fd.append('target', target );
                parent.http.post('./api/linkParts.php',fd,{
                    transformRequest: null,
                    headers: {'Content-type':undefined}
                }).success(function(data, status, headers, config){
                    if(data.result == "OK")
                    {
                        resolve(data);
                    }
                });
            }
        });
	}

	removeLinkPath = function( source, target )
	{
        var parent = this;
		return new Promise(function(resolve, reject)
        {
            if( parent.permission )
            {
                var fd = new FormData();
                fd.append('authID', parent.authID );
                fd.append('dcaseID', parent.dcaseID );
                fd.append('source', source );
                fd.append('target', target );
                parent.http.post('./api/removeLink.php',fd,{
                    transformRequest: null,
                    headers: {'Content-type':undefined}
                }).success(function(data, status, headers, config){
                    if(data.result == "OK")
                    {
                        resolve(data);
                    }
                });
            }
        });
	}

	//dragendedSize = function(d)
	changeSize = function(d)
	{
        var parent = this;
		return new Promise(function(resolve, reject)
        {
            if( parent.permission )
            {
                var fd = new FormData();
                fd.append('authID', parent.authID );
                fd.append('dcaseID', parent.dcaseID );
                fd.append('partsID', d.id );
                fd.append('width', d.width );
                fd.append('height', d.height );
                parent.http.post('./api/updateParts.php',fd,{
                    transformRequest: null,
                    headers: {'Content-type':undefined}
                }).success(function(data, status, headers, config){
                    if(data.result == "OK")
                    {
                        resolve(data);
                    }
                });
            }else{
                resolve(data);
            }
        });
    }

    commit = function(commitMsg)
	{
        var parent = this;
		return new Promise(function(resolve, reject)
        {
            if( parent.permission )
            {
                var fd = new FormData();
                fd.append('authID', parent.authID );
                fd.append('dcaseID', parent.dcaseID );
                fd.append('msg', commitMsg );
                parent.http.post('./api/commit.php',fd,{
                    transformRequest: null,
                    headers: {'Content-type':undefined}
                }).success(function(data, status, headers, config){
                    if(data.result == "OK")
                    {
                        resolve(data);
                    }
                });
            }else{
                resolve(data);
            }
        });
    }
}