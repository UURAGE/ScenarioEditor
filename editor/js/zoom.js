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

    function toggleZoom(tree) //tree (object not id) contains a div and original positions before zoom
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
            //find treeContainer
            var parent = tree.dragDiv.parent();

            //unzoom other trees
            $.each(Main.trees, function(key, value) {
                zoomOut(value); 
            });

            //tell the Tree it is now zoomed
            tree.dragDiv.addClass("zoom");
            //ensure it looks right
            parent.css({"overflow": "hidden"}); // hide overflowing content
            tree.dragDiv.css({"top": parent.scrollTop(), "left": parent.scrollLeft()});//put it in gridposition(0,0)
            tree.dragDiv.draggable('disable'); //make it undraggable
            tree.dragDiv.removeClass("ui-state-disabled");//remove default disable-draggable-style

            //return to the last scroll position
            tree.div.scrollLeft(tree.leftScroll);
            tree.div.scrollTop(tree.topScroll);

            tree.div.xselectable('enable');

            //set text in zoombutton to [-]
            var zoomTreeButton = $('.zoomTreeButton', tree.dragDiv);
            zoomTreeButton.text("[-]");

            //save name if needed
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
    }

    function zoomOut(tree)
    {
        if ($('#' + tree.id).hasClass('zoom'))
        {
            var parent = tree.dragDiv.parent();

            $('#tabDock').hide();
            $('#draftScreen').hide();
            MiniMap.deactivate();

            //scroll position needs to 0 when the dom manipulation happens to keep jsPlumb from messing up
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
        
            //update show/hide of buttons
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
