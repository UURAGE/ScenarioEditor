/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

var Zoom;

(function()
{
    "use strict";

    Zoom =
    {
        toggleZoom : toggleZoom,
        zoomIn : zoomIn,
        zoomOut : zoomOut,
        getZoomed: getZoomed,
        isZoomed : isZoomed
    };

    // Tree (the object, not the id) contains a div and original positions before zoom
    function toggleZoom(tree)
    {
        if(!tree.dragDiv.hasClass("zoom"))
            zoomIn(tree);
        else
            zoomOut(tree);
    }

    function zoomIn(tree)
    {
        if (!$('#' + tree.id).hasClass('zoom'))
        {
            // Unselect the selected tree(s), because we are zooming in
            Main.selectElement(null);

            // Find the treeContainer
            var parent = tree.dragDiv.parent();

            // Zoom out all the other trees if they are zoomed in
            $.each(Main.trees, function(key, value) {
                zoomOut(value);
            });

            tree.dragDiv.addClass("zoom");
            // Ensure it looks right
            // Hide overflowing content
            parent.css({"overflow": "hidden"});
            // Put it in the current top left corner of the parent
            Utils.cssPosition(tree.dragDiv, { "top": parent.scrollTop(), "left": parent.scrollLeft() });
            // Make it undraggable
            jsPlumb.setDraggable(tree.dragDiv, false);
            // Remove default disable-draggable-style
            tree.dragDiv.removeClass("ui-state-disabled");

            // Return to the last scroll position
            tree.div.scrollLeft(tree.leftScroll);
            tree.div.scrollTop(tree.topScroll);

            tree.div.selectable('enable');

            var zoomTreeButton = tree.dragDiv.find('.zoomTreeButton');
            zoomTreeButton.text("[-]");

            jsPlumb.setSuspendDrawing(false);
            tree.nodes.forEach(function(n)
            {
                Main.changeNodeText(n);
            });
        }

        Main.updateButtons();
    }

    function zoomOut(tree)
    {
        if (!tree) tree = getZoomed();
        if (!tree) return;

        if ($('#' + tree.id).hasClass('zoom'))
        {
            // Unselect the selected nodes(s), because we are zooming out of a tree
            Main.selectElement(null);

            var parent = tree.dragDiv.parent();

            $('#tabDock').hide();
            $('#draftScreen').hide();
            MiniMap.deactivate();

            // Scroll position needs to 0 when the dom manipulation happens to keep jsPlumb from messing up
            tree.leftScroll = tree.div.scrollLeft();
            tree.topScroll = tree.div.scrollTop();

            tree.div.scrollTop(0);
            tree.div.scrollLeft(0);

            tree.dragDiv.removeClass("zoom");
            Utils.cssPosition(tree.dragDiv, { "top": tree.topPos * Main.gridY, "left": tree.leftPos * Main.gridX });
            jsPlumb.setDraggable(tree.dragDiv, true);
            tree.div.selectable('disable');

            var zoomTreeButton = tree.dragDiv.find('.zoomTreeButton');
            zoomTreeButton.text("[+]");

            parent.css({"overflow": "auto"});
            jsPlumb.setSuspendDrawing(true);

            Main.updateButtons();
        }
    }

    function getZoomed()
    {
        var zoomedTrees = $("#mainCell .treeContainer.zoom");
        if (zoomedTrees.length === 0) return null;

        return Main.trees[zoomedTrees.eq(0).attr("id")];
    }

    function isZoomed(treeID)
    {
        if (treeID === undefined)
        {
            return getZoomed() !== null;
        }
        else
        {
            return $("#"+treeID).hasClass('zoom');
        }
    }
})();
