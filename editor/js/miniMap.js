/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

/*
    This file contains all functionality pertaining to the mini map shown in the upper right corner in the editor
*/

var MiniMap;

(function()
{
    "use strict";

    var zoom = 1,
        // Show details? Set to false to speed up editor processing in large scenarios
        detailed = true;

    MiniMap =
    {
        zoom: zoom,
        detailed: detailed,
        initialise: initialise,
        attachScrollListener: attachScrollListener,
        update: update,
        activate: activate,
        deactivate: deactivate
    };

    // Turned on for this session? (based on e.g. browser)
    var enabled = true,
    // Allowed by the context? If not, hidden completely, including controls
    active = true,
    // Turned on by the user? If not, hidden, but controls are still visible
    shown = true;

    function initialise()
    {
        // Minimap does not work yet in firefox,
        // due to css zoom not being supported,
        // updateMinimap code needs to be rewritten for css translate: scale(v)
        // but this bugs out a lot of other css properties in the cloned main DOM
        // meanwhile the minimap is disabled for mozilla
        // minimap disabled in ie, until minimap displacement bug is fixed

        if (navigator.userAgent.match(/Chrome/i) || navigator.userAgent.match(/Opera/i) ||  navigator.userAgent.match(/Edge/i))
        {
            enabled = true;
            $("#miniwrap").css("display","block");
            $("#minimap").css("width", "300px");
            $("#minimap").css("height", "300px");
            $("#minimap").css("overflow", "hidden");

            $("#minimap").on("click", function(e)
            {
                update(true);
                updateScrollPosition(e);
                //e.stopPropagation();
            });
            // Listener for change in scroll position in main div
            $("#mainCell #main").scroll(function()
            {
                update(false);
            });

            // Zoomed in scroll event listeners for minimap are created by attachScrollListener,
            // called by createEmptyTree()!

            // Listeners for minimap checkboxes
            $("#enableMinimap").on("click", function()
            {
                if (this.checked)
                {
                    shown = true;
                    showAnimated($("#minimap"));
                }
                else
                {
                    hideAnimated($("#minimap"));
                    shown = false;
                }
            });
            $("#simpleMinimap").on("click", function()
            {
                if (this.checked)
                {
                    detailed = false;
                    $("#scaledDiv").empty();
                    update(false);
                }
                else
                {
                    detailed = true;
                    update(true);
                }
            });
        }
        else
        {
            enabled = false;
            $("#miniwrap").css("display","none");
            console.log("It appears you're using Firefox or IE, minimap display:" + $("#miniwrap").css("display") + ". We recommend running this game in Chrome or Opera.");
        }
    }

    function attachScrollListener(treeDiv)
    {
        if (!enabled) return;

        treeDiv.on('scroll', function(e)
        {
            update(false);
        });
    }

    function updateScrollPosition(e)
    {
        var minimapSelectorX = (e.pageX - $("#minimap").offset().left) - ($("#minimapSelector").width()/2);
        var minimapSelectorY = (e.pageY - $("#minimap").offset().top) - ($("#minimapSelector").height()/2);

        //Limit the minimum/maximum positions of the selector
        var maxX = $("#minimap").width() - $("#minimapSelector").width();
        var maxY = $("#minimap").height() - $("#minimapSelector").height();
        if(minimapSelectorX < 0) minimapSelectorX = 0;
        if(minimapSelectorY < 0) minimapSelectorY = 0;
        if(minimapSelectorX > maxX) minimapSelectorX = maxX;
        if(minimapSelectorY > maxY) minimapSelectorY = maxY;

        $("#minimapSelector").css("top", minimapSelectorY+"px");
        $("#minimapSelector").css("left", minimapSelectorX+"px");

        minimapSelectorX /= zoom;
        minimapSelectorY /= zoom;

        if(!Zoom.isZoomed())   //Nothing is zoomed
        {
            $("#mainCell > #main").scrollLeft(minimapSelectorX);
            $("#mainCell > #main").scrollTop(minimapSelectorY);
        }
        else
        {
            $("#mainCell .treeContainer.zoom > .treeDiv").scrollLeft(minimapSelectorX);
            $("#mainCell .treeContainer.zoom > .treeDiv").scrollTop(minimapSelectorY);
        }

        update(false);

        //Decouple objects for garbage collection:
        minimapSelectorX = null;
        minimapSelectorY = null;
        maxX = null;
        maxY = null;
    }

    //Scale the minimap according to the main div dimensions
    //and optionally refresh the background by cloning the main div
    ///refresh boolean to effect a new clone of the main div and its children
    function update(refresh)
    {
        if (!(enabled && active && shown)) return;

        var realWidth, realHeight;
        var viewportWidth, viewportHeight, viewportX, viewportY, zoomFactor;
        var main, treeDiv;

        main = $("#mainCell > #main");
        treeDiv = $("#mainCell .treeContainer.zoom > .treeDiv");

        if(!Zoom.isZoomed())   //Nothing is zoomed
        {
            realWidth = main[0].scrollWidth;
            realHeight = main[0].scrollHeight;
            viewportX = main.scrollLeft();
            viewportY = main.scrollTop();
        }
        else
        {
            if (treeDiv == "undefined")
            {
                realWidth = main[0].scrollWidth;
                realHeight = main[0].scrollHeight;
                viewportX = main.scrollLeft();
                viewportY = main.scrollTop();
            }
            else
            {
                realWidth = treeDiv[0].scrollWidth;
                realHeight = treeDiv[0].scrollHeight + $("#mainCell .subjectDiv")[0].scrollHeight;
                viewportX = treeDiv.scrollLeft();
                viewportY = treeDiv.scrollTop() + $("#mainCell .subjectDiv")[0].scrollHeight;
            }
        }
        viewportWidth = main.width();
        viewportHeight = main.height();

        $("#scaledDiv").css("width", realWidth+"px");
        $("#scaledDiv").css("height", realHeight+"px");
        $("#minimap").css("height", $("#sidebar").height()-25+"px");

        //Show a cloned and scaled down version of the main div in the minimap if detailedMinimap is set to true
        if(detailed && refresh)
        {
            $("#scaledDiv").empty();
            main.clone().appendTo($("#scaledDiv"));
            $("#scaledDiv #gridIndicator").remove();
            //Rename cloned div ids!
            $("#scaledDiv > #main").attr("id","miniMain");
            //Remove inappropriate subjects from minimap
            if(Zoom.isZoomed())
                $("#scaledDiv .treeContainer").not(".zoom").remove();
        }

        //Standard width/height for minimap container
        var width = 300;
        var height = 300;

        var widthFactor = width/realWidth;
        var heightFactor = height/realHeight;

        zoomFactor = widthFactor;
        //minimap gets taller than the allowed screenheight
        if (zoomFactor * realHeight > $("#sidebar").height())
        {
            zoomFactor = $("#sidebar").height()/(realHeight+realHeight*0.1);
        }

        $("#minimap").css("width", (realWidth * zoomFactor) + "px");
        $("#minimap").css("height", (realHeight * zoomFactor) + "px");

        if(detailed && refresh)
        {
            $("#scaledDiv *").css("overflow", "hidden");

            $("#scaledDiv .treeContainer.zoom").css("left", 0 + "px");
            $("#scaledDiv .treeContainer.zoom").css("top", 0 + "px");
            $("#scaledDiv .treeContainer.zoom > .treeDiv").css("height", realHeight + "px");
            $("#scaledDiv .treeContainer.zoom > .treeDiv").css("width", realWidth + "px");

            $("#scaledDiv *").off();
        }

        $("#scaledDiv").css("zoom", zoomFactor+"");
        // css zoom code needs to be rewritten for css translate: scale(v)
        // but this bugs out a lot of other css properties in the cloned main DOM:
        //$("#scaledDiv #main").css("-moz-transform:", "scale("zoomFactor+")");

        //Scale and reposition the minimap selector
        viewportWidth = viewportWidth*zoomFactor;
        viewportHeight = viewportHeight*zoomFactor;
        viewportX = viewportX*zoomFactor;
        viewportY = viewportY*zoomFactor;
        $("#minimapSelector").css("width", viewportWidth+"px");
        $("#minimapSelector").css("height", viewportHeight+"px");
        $("#minimapSelector").css("top", viewportY+"px");
        $("#minimapSelector").css("left", viewportX+"px");

        zoom = zoomFactor;

        //Decouple objects for garbage collection:
        width = null;
        height = null;
        widthFactor = null;
        heightFactor = null;
        zoomFactor = null;
        realWidth = null;
        realHeight = null;
        viewportWidth = null;
        viewportHeight = null;
        viewportX = null;
        viewportY = null;
        main = null;
        treeDiv = null;

        //Deprecated: take canvas screenshot of visible html DOM:
        /*
        html2canvas($("#main"),
        {
            onrendered: function(canvas)
            {
                var aspectRatio = canvas.height/canvas.width;
                var divWidth = parseInt($("#minimap").css("width"));
                var extra_canvas = document.createElement("canvas");
                extra_canvas.setAttribute('width', divWidth);
                extra_canvas.setAttribute('height', divWidth*aspectRatio);
                var ctx = extra_canvas.getContext('2d');
                ctx.drawImage(canvas,0,0,canvas.width, canvas.height,0,0,divWidth,divWidth*aspectRatio);
                var dataURL = extra_canvas.toDataURL();
                //var img = $(document.createElement('img'));
                //img.attr('src', dataURL);
                // insert the thumbnail
                $("#minimap").css("background-image", "url(" + dataURL + ")");
                $("#minimap").css("height", (divWidth * aspectRatio) + "px");
            }
        });
        */

    }

    function showAnimated(element)
    {
        // slide Down with animation stopper
        var autoHeight = element.css('height', 'auto').height();
        element.height(0).show().stop(true,false).animate({height: autoHeight}, 400);
    }

    function hideAnimated(element)
    {
        // slide Up with animation stopper
        element.stop(true,false).animate({height: 0}, 400,
            'swing', function(){ element.hide(); });
    }

    function activate()
    {
        if (!enabled) return;

        if (!active) showAnimated($("#miniwrap"));
        active = true;
        update(true);
    }

    function deactivate()
    {
        if (!enabled) return;

        if (active) hideAnimated($("#miniwrap"));
        active = false;
    }
})();
