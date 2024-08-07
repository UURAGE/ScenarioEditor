// © DialogueTrainer

/* exported Zoom */
let Zoom;

(function()
{
    "use strict";

    // eslint-disable-next-line no-global-assign
    Zoom =
    {
        toggleZoom: toggleZoom,
        zoomIn: zoomIn,
        zoomOut: zoomOut,
        getZoomed: getZoomed,
        isZoomed: isZoomed
    };

    $(function()
    {
        const backButton = $('#canvas .backButton');
        backButton.on("click", function()
        {
            Zoom.zoomOut();
        });
    });

    // Tree (the object, not the id) contains a div and original positions before zoom
    function toggleZoom(tree)
    {
        if (!tree.dragDiv.hasClass("zoom")) zoomIn(tree);
        else zoomOut(tree);
    }

    function zoomIn(tree)
    {
        if (tree.id in Main.trees && !$('#' + tree.id).hasClass('zoom'))
        {
            // Unselect the selected tree(s), because we are zooming in
            Main.selectElement(null);

            // Find the treeContainer
            const parent = tree.dragDiv.parent();

            // Zoom out all the other trees if they are zoomed in
            Object.values(Main.trees).forEach(zoomOut);

            tree.dragDiv.addClass("zoom");

            tree.dragDiv.find('.subjectDiv').hide();

            // Ensure it looks right
            // Hide overflowing content
            parent.css({ "overflow": "hidden" });
            // Put it in the current top left corner of the parent
            Utils.cssPosition(tree.dragDiv, { "top": parent.scrollTop(), "left": parent.scrollLeft() });
            // Make it undraggable
            jsPlumb.setDraggable(tree.dragDiv, false);

            // Return to the last scroll position
            tree.div.scrollLeft(tree.leftScroll);
            tree.div.scrollTop(tree.topScroll);

            $("#main").get(0)._selectable.disable();
            tree.div.get(0)._selectable.enable();

            jsPlumb.setSuspendDrawing(false);

            // The tree is always kept up-to-date when zoomed and can't be changed when not zoomed,
            // so the nodes of the tree only have to be updated when zooming in for the first time.
            tree.plumbInstance.batch(function()
            {
                if (!tree.zoomedInBefore)
                {
                    tree.nodes.forEach(function(n)
                    {
                        Main.updateNodeGraphics(n);
                    });

                    tree.zoomedInBefore = true;
                }
                ColorPicker.applyColors();
            });

            $('#canvas').removeClass('wSpacing');
            $('#canvas .backButton').css('display', '');
        }

        MiniMap.update(true);
        Main.updateToolbar();
    }

    function zoomOut(tree)
    {
        if (!tree) tree = getZoomed();
        if (!tree) return;

        if (tree.id in Main.trees && $('#' + tree.id).hasClass('zoom'))
        {
            // Unselect the selected nodes(s), because we are zooming out of a tree
            Main.selectElement(null);

            const parent = tree.dragDiv.parent();

            TabDock.handleZoomOut();

            // Scroll position needs to 0 when the dom manipulation happens to keep jsPlumb from messing up
            tree.leftScroll = tree.div.scrollLeft();
            tree.topScroll = tree.div.scrollTop();

            tree.div.scrollTop(0);
            tree.div.scrollLeft(0);

            // Node selection sometimes causes this class to be added, and it interferes with tree selection, so remove it
            tree.dragDiv.removeClass("ui-selecting");

            tree.dragDiv.removeClass("zoom");
            Utils.cssPosition(tree.dragDiv, { "top": tree.topPos * Main.gridY, "left": tree.leftPos * Main.gridX });
            jsPlumb.setDraggable(tree.dragDiv, true);
            tree.div.get(0)._selectable.disable();
            $("#main").get(0)._selectable.enable();

            tree.dragDiv.find('.subjectDiv').show();

            parent.css({ "overflow": "auto" });
            jsPlumb.setSuspendDrawing(true);

            $('#canvas').addClass('wSpacing');
            $('#canvas .backButton').css('display', 'none');

            MiniMap.update(true);
            Main.updateToolbar();
            Main.updateTreePreview(tree);
        }
    }

    function getZoomed()
    {
        const zoomedTrees = $("#main .treeContainer.zoom");
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
            return $("#" + treeID).hasClass('zoom');
        }
    }
})();
