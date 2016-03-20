/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

jsPlumb.bind("ready", function() 
{
    // setup some defaults for jsPlumb.
    
    jsPlumb.importDefaults(
    {
        Endpoint : ["Dot", {radius:2}],
        HoverPaintStyle : {strokeStyle:"#1e8151", lineWidth:2 },
        ConnectionOverlays : [
            [ "Arrow", {
                location:1,
                id:"arrow",
                length:14,
                foldback:0.8
            } ]
        ]
    });


    // bind a dblclick listener to each connection; the connection is deleted. you could of course
    // just do this: jsPlumb.bind("click", jsPlumb.detach), but I wanted to make it clear what was
    // happening.
    jsPlumb.bind("dblclick", function(c) 
    {
        $(".pathToDeadEnd").removeClass("pathToDeadEnd");
        jsPlumb.detach(c);
        Main.dehighlightParents();
        Main.highlightParents(Main.selectedElement);
    });

    // on click, select connector
    jsPlumb.bind("click",function(c)
    {
        // change color style
        setTimeout(function()
        {
            c.setPaintStyle({strokeStyle:"darkgoldenrod"});
        },5);
        // time out so that the click can be finished
        setTimeout(function()
        { 
            // add new click event that deselects the arrow on first canvas click
            $("#main").one("click", function()
            {
                // find selected connection
                var con = jsPlumb.getConnections(
                {
                    source: c.sourceId,
                    target: c.targetId
                });
                if(con.length > 0) // connection can just have been removed
                {    
                // connections are unique, so if it exists there is never more then one
                con[0].setPaintStyle({strokeStyle:"#5c96bc"});
                }
            });                 
        }, 30);
    });

    jsPlumb.bind("beforeDrop", function(info) 
    { 
        Main.makeConnection(info.sourceId,info.targetId);
    });

    jsPlumb.bind("connection", function(info) 
    {
        $(".pathToDeadEnd").removeClass("pathToDeadEnd");
        if($("#" + info.targetId).hasClass("parentSelected") || 
           $("#" + info.targetId).hasClass("selected"))
        {
            if($("#allParents").hasClass("enabled"))
            {
                $("#" + info.sourceId).addClass("parentSelected");
                Main.highlightParents(info.sourceId);
            }
        }
    });
});
