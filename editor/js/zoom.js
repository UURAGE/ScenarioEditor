/*
//This program has been developed by students from the bachelor Computer Science at Utrecht University 
//within the Software and Game project courses 2013-2015
//©Copyright Utrecht University (Department of Information and Computing Sciences) 
*/

var Zoom;

(function()
{
    Zoom = 
    {
        toggleZoom : toggleZoom,
        zoomIn : zoomIn,
        zoomOut : zoomOut,
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
            parent.css({"overflow": "hidden"}); 
            // Put it in grid position (0,0)
            tree.dragDiv.css({"top": parent.scrollTop(), "left": parent.scrollLeft()});
            tree.dragDiv.draggable('disable'); 
            // Remove default disable-draggable-style
            tree.dragDiv.removeClass("ui-state-disabled");

            // Return to the last scroll position
            tree.div.scrollLeft(tree.leftScroll);
            tree.div.scrollTop(tree.topScroll);

            tree.div.xselectable('enable');

            var zoomTreeButton = $('.zoomTreeButton', tree.dragDiv);
            zoomTreeButton.text("[-]");

            // Save the subject name if necessary
            $('.subjectName', tree.dragDiv).text(Main.unEscapeTags(tree.subject));

            var heightOffset = tree.div.position().top - tree.dragDiv.position().top;
            var dragDivHeight = tree.dragDiv.outerHeight();

            $(tree.div).css({ "height": (dragDivHeight - heightOffset) + "px", "width": "100%" });
            jsPlumb.setSuspendDrawing(false);
            tree.nodes.forEach(function(n)
            {
                Main.changeNodeText(n);
                jsPlumb.repaint(n);

            });
        }

        Main.updateButtons();
    }

    function zoomOut(tree)
    {
        if ($('#' + tree.id).hasClass('zoom'))
        {
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
            tree.dragDiv.css({ "top": (tree.topPos * Main.gridY), "left": (tree.leftPos * Main.gridX) });
            tree.dragDiv.draggable('enable');
            tree.div.xselectable('disable');

            $('.subjectName', tree.dragDiv).text(Main.unEscapeTags(tree.subject));
            //$(tree.div).css('width', 0);
            //$(tree.div).css('height', 0);

            var zoomTreeButton = $('.zoomTreeButton', tree.dragDiv);
            zoomTreeButton.text("[+]");

            parent.css({"overflow": "auto"});
            jsPlumb.setSuspendDrawing(true);
            
            Main.updateButtons();
        }
    }
    
    function isZoomed(treeID)
    {
        if (treeID === undefined)
        {
            var zoomedTrees = $('#mainCell .treeContainer.zoom');
            return zoomedTrees.length >= 1;  
        }  
        else 
        {
            return $("#"+treeID).hasClass('zoom');
        }
    }
})();
