/* © Utrecht University and DialogueTrainer */

var PlumbGenerator;

(function()
{
    "use strict";

    PlumbGenerator =
    {
        genJsPlumbInstance : genJsPlumbInstance,
        defaultPaintStyle: { stroke: "#5c96bc", strokeWidth: 2, outlineStroke: "transparent", outlineWidth: 2 },
        defaultHoverPaintStyle: { stroke: "#5c96bc", strokeWidth: 2, outlineStroke: "#1e8151", outlineWidth: 1 }
    };

    // Expects an element returned from a jquery selector
    function genJsPlumbInstance(container)
    {
        var instance = jsPlumb.getInstance();

        instance.setContainer(container);

        instance.importDefaults(
        {
            Endpoint : ["Dot", {radius:2}],
            Anchor: [ "Perimeter", { shape: "Rectangle", anchorCount: 80 } ],
            HoverPaintStyle : PlumbGenerator.defaultHoverPaintStyle,
            Connector: [ "StateMachine", { proximityLimit: 120 } ],
            PaintStyle : PlumbGenerator.defaultPaintStyle,
            ConnectionOverlays : [
                [ "Arrow", {
                    location: 1,
                    id: "arrow",
                    length: 14,
                    foldback: 0.8
                } ]
            ]
        });

        // On dblclick, the connection will be deleted
        instance.bind("dblclick", function(connection, originalEvent)
        {
            SaveIndicator.setSavedChanges(false);

            instance.deleteConnection(connection, originalEvent);
        });

        // On mouseover, show the color key entry
        instance.bind("mouseover",function(connection, e)
        {
            if (ColorPicker.areColorsEnabled())
            {
                var colorValue = connection.getParameter("color");
                if (colorValue in ColorPicker.key.byColor && ColorPicker.key.byColor[colorValue].entry)
                {
                    // This uses the innerHTML property, so escape the HTML!
                    connection.addOverlay([ "Label", { id: "color-label", label: Utils.escapeHTML(ColorPicker.key.byColor[colorValue].entry), cssClass: "color-label" }]);
                }
            }
        });

        // On mouseout, hide the color key entry
        instance.bind("mouseout", function(connection, e)
        {
            connection.removeOverlay("color-label");
        });

        // On click, select the connection
        instance.bind("click",function(c, e)
        {
            if (!c || e.which !== 1) return;

            // There are other elements (nodes or trees) selected, so deselect those elements
            if (Main.selectedElements.length > 0) Main.selectElement(null);

            var selectedConnections = Zoom.getZoomed().selectedConnections;
            var connectionId;
            if (c.id in selectedConnections)
            {
                if (e.ctrlKey || e.metaKey)
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
                if (!(e.ctrlKey || e.metaKey))
                {
                    for (connectionId in selectedConnections)
                    {
                        Main.deselectConnection(instance, selectedConnections, connectionId);
                    }
                }

                selectedConnections[c.id] = { source: c.sourceId, target: c.targetId };
                var colorValue = c.getParameter("color");
                if (!colorValue || !ColorPicker.areColorsEnabled())
                {
                    c.setPaintStyle($.extend({}, PlumbGenerator.defaultPaintStyle, { stroke: "goldenrod" }));
                }
                else
                {
                    c.setPaintStyle($.extend({}, PlumbGenerator.defaultPaintStyle, { stroke: colorValue, outlineStroke: colorValue }));
                }
            }
        });

        instance.bind("contextmenu", function(connection, e)
        {
            ColorPicker.showFor(connection);
            e.preventDefault();
        });

        instance.bind("beforeDrop", function(info)
        {
            Main.makeConnection(info.sourceId,info.targetId, instance);
            instance.revalidate(info.sourceId);
            instance.revalidate(info.targetId);
        });

        instance.bind("connection", function(info)
        {
            SaveIndicator.setSavedChanges(false);

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
