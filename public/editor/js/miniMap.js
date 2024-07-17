// © DialogueTrainer

/*
    This file contains all functionality pertaining to the mini map shown in the upper right corner in the editor
*/

/* exported MiniMap */
let MiniMap;

(function()
{
    "use strict";

    // eslint-disable-next-line no-global-assign
    MiniMap =
    {
        initialise: initialise,
        attachScrollListener: attachScrollListener,
        update: update,
        activate: activate,
        deactivate: deactivate
    };

    let zoom = 1,
        // Allowed by the context? If not, hidden completely, including controls
        active = false,
        // Turned on by the user? If not, hidden, but controls are still visible
        shown = false;

    function initialise()
    {
        recallShown();

        if (shown) activate();
        else deactivate();

        $("#minimap").on("click", function(e)
        {
            updateScrollPosition(e);
        });

        let scrollTimeout = null;
        $("#main").on("scroll", function()
        {
            // Throttle scroll event
            if (scrollTimeout === null)
            {
                scrollTimeout = setTimeout(function()
                {
                    scrollTimeout = null;
                    update(false);
                }, 25);
            }
        });

        // Zoomed in scroll event listeners for minimap are created by attachScrollListener,
        // called by createEmptyTree()!

        // Listeners for minimap checkboxes
        $("#enableMinimap").on("click", function()
        {
            if (!shown)
            {
                setAndStoreShown(true);
                update(true);
                showAnimated($("#minimap"));
            }
            else
            {
                hideAnimated($("#minimap"));
                setAndStoreShown(false);
            }
        });
    }

    function attachScrollListener(treeDiv)
    {
        let scrollTimeout = null;
        treeDiv.on('scroll', function()
        {
            // Throttle scroll event
            if (scrollTimeout === null)
            {
                scrollTimeout = setTimeout(function()
                {
                    scrollTimeout = null;
                    update(false);
                }, 25);
            }
        });
    }

    function updateScrollPosition(e)
    {
        let minimapSelectorX = e.pageX - $("#minimap").offset().left - $("#minimapSelector").width() / 2;
        let minimapSelectorY = e.pageY - $("#minimap").offset().top - $("#minimapSelector").height() / 2;

        // Limit the minimum/maximum positions of the selector
        const maxX = $("#minimap").width() - $("#minimapSelector").width();
        const maxY = $("#minimap").height() - $("#minimapSelector").height();
        if (minimapSelectorX < 0) minimapSelectorX = 0;
        if (minimapSelectorY < 0) minimapSelectorY = 0;
        if (minimapSelectorX > maxX) minimapSelectorX = maxX;
        if (minimapSelectorY > maxY) minimapSelectorY = maxY;

        $("#minimapSelector").css("top", minimapSelectorY + "px");
        $("#minimapSelector").css("left", minimapSelectorX + "px");

        minimapSelectorX /= zoom;
        minimapSelectorY /= zoom;

        if (!Zoom.isZoomed()) // Nothing is zoomed
        {
            $("#main").scrollLeft(minimapSelectorX);
            $("#main").scrollTop(minimapSelectorY);
        }
        else
        {
            $("#main .treeContainer.zoom .treeDiv").scrollLeft(minimapSelectorX);
            $("#main .treeContainer.zoom .treeDiv").scrollTop(minimapSelectorY);
        }

        update(false);
    }

    // Scale the minimap according to the main div dimensions
    // and optionally refresh the map by cloning the main div
    function update(refresh)
    {
        if (!(active && shown)) return;

        let realWidth, realHeight;
        let viewportWidth, viewportHeight, viewportX, viewportY;

        const main = $("#main");

        function getCoordinates(element)
        {
            realWidth = element[0].scrollWidth;
            realHeight = element[0].scrollHeight;
            viewportX = element.scrollLeft();
            viewportY = element.scrollTop();
            viewportWidth = element[0].clientWidth;
            viewportHeight = element[0].clientHeight;
        }

        if (!Zoom.isZoomed()) // Nothing is zoomed
        {
            getCoordinates(main);
        }
        else
        {
            getCoordinates($("#main .treeContainer.zoom .treeDiv"));
        }

        const scaledDiv = $("#scaledDiv");
        scaledDiv.css("width", realWidth + "px");
        scaledDiv.css("height", realHeight + "px");

        // Show a cloned and scaled down version of the main div in the minimap
        if (refresh)
        {
            scaledDiv.empty();
            const clonedMain = main.clone();
            // Remove inappropriate elements from the cloned main
            clonedMain.find("#gridIndicator").remove();
            clonedMain.find("#colorPicker").remove();
            if (Zoom.isZoomed())
            {
                clonedMain.find(".treeContainer").not(".zoom").remove();
                clonedMain.find(".treeDiv").removeClass('backgroundPattern');
            }
            else clonedMain.find(".treeDiv").remove();
            // Remove all event handlers and IDs from the cloned main
            clonedMain.find("*").removeClass(['jtk-drag-selected', 'ui-selected']).addBack().off().removeAttr("id");
            scaledDiv.append(clonedMain);
        }

        // Standard width/height for minimap container
        const width = $('#miniwrap').width();
        let zoomFactor = width / realWidth;
        const maxHeight = $('#miniwrap').height();

        // Minimap gets taller than the allowed screen height
        if (zoomFactor * realHeight > maxHeight)
        {
            zoomFactor = maxHeight / realHeight;
        }

        const minimapSize = {
            width: realWidth * zoomFactor + "px",
            height: realHeight * zoomFactor + "px"
        };
        $("#minimap").css(minimapSize);
        $("#minimap").data("savedSize", minimapSize);

        if (refresh)
        {
            $("#scaledDiv .treeContainer.zoom").css("left", 0 + "px");
            $("#scaledDiv .treeContainer.zoom").css("top", 0 + "px");
            $("#scaledDiv .treeContainer.zoom .treeDiv").css("height", realHeight + "px");
            $("#scaledDiv .treeContainer.zoom .treeDiv").css("width", realWidth + "px");
        }

        scaledDiv.css({
            transform: "scale(" + zoomFactor + ")",
            transformOrigin: "top left"
        });

        // Scale and reposition the minimap selector
        $("#minimapSelector").css({
            width: viewportWidth * zoomFactor + "px",
            height: viewportHeight * zoomFactor + "px",
            top: viewportY * zoomFactor + "px",
            left: viewportX * zoomFactor + "px"
        });

        zoom = zoomFactor;
    }

    function recallShown()
    {
        const recalledShown = localStorage.getItem('MiniMap.shown');
        if (recalledShown !== null) shown = Boolean(JSON.parse(recalledShown));
    }

    function setAndStoreShown(newShown)
    {
        shown = Boolean(newShown);
        try
        {
            localStorage.setItem('MiniMap.shown', JSON.stringify(shown));
        }
        catch (e)
        {
            // Storage is an enhancement, so ignore failure
        }
    }

    function showAnimated(element)
    {
        // Slide Down with animation stopper
        const savedSize = element.data('savedSize');
        const finalHeight = savedSize ? savedSize.height : element.css('height', 'auto').height();
        element.css('display', '').height(0).stop(true, false).animate({ height: finalHeight }, 400);
    }

    function hideAnimated(element)
    {
        // Slide Up with animation stopper
        element.stop(true, false).animate({ height: 0 }, 400,
            'swing', function() { element.hide(); });
    }

    function activate()
    {
        active = true;
        update(true);
        if (!active) showAnimated($("#minimap"));
    }

    function deactivate()
    {
        if (active) hideAnimated($("#minimap"));
        active = false;
    }
})();
