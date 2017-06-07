/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

var PlumbGenerator;

(function()
{
    "use strict";

    PlumbGenerator =
    {
        genJsPlumbInstance : genJsPlumbInstance
    };

    // Expects an element returned from a jquery selector
    function genJsPlumbInstance(container)
    {
        var instance = jsPlumb.getInstance();

        instance.setContainer(container);

        instance.importDefaults(
        {
            Endpoint : ["Dot", {radius:2}],
            Anchor: [ "Perimeter", { shape: "Rectangle", anchorCount: 150 } ],
            HoverPaintStyle : {strokeStyle:"#1e8151", lineWidth:2 },
            Connector: ["StateMachine", { proximityLimit: 120 }],
            PaintStyle : {strokeStyle: "#5c96bc", lineWidth: 2, outlineColor: "transparent", outlineWidth: 4},
            ConnectionOverlays : [
                [ "Arrow", {
                    location:1,
                    id:"arrow",
                    length:14,
                    foldback:0.8
                } ]
            ]
        });

        // On dblclick, the connection will be deleted
        instance.bind("dblclick", instance.detach);

        // On click, select the connection
        instance.bind("click",function(c, e)
        {
            if(!c) return;

            // There are other elements (nodes or trees) selected, so deselect those elements
            if (Main.selectedElements.length > 0) Main.selectElement(null);

            var selectedConnections = Zoom.getZoomed().selectedConnections;
            var connectionId;
            if (c.id in selectedConnections)
            {
                if (e.ctrlKey)
                {
                    Main.deselectConnection(instance, selectedConnections, c.id);
                }
                else
                {
                    for (connectionId in selectedConnections)
                    {
                        Main.deselectConnection(instance, selectedConnections, connectionId);
                    }
                }
            }
            else
            {
                if (!e.ctrlKey)
                {
                    for (connectionId in selectedConnections)
                    {
                        Main.deselectConnection(instance, selectedConnections, connectionId);
                    }
                }

                selectedConnections[c.id] = { source: c.sourceId, target: c.targetId };

                // Change the color of the connection
                c.setPaintStyle({strokeStyle:"darkgoldenrod"});
            }
        });

        instance.bind("beforeDrop", function(info)
        {
            Main.makeConnection(info.sourceId,info.targetId, instance);
            instance.updateOffset({elId:info.sourceId, recalc:true});
            instance.repaint(info.sourceId, null, 0);

            instance.updateOffset({elId:info.targetId, recalc:true});
            instance.repaint(info.targetId, null, 0);
        });

        instance.bind("connection", function(info)
        {
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

        return instance;
    }
})();