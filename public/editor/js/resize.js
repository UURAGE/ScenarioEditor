/* © Utrecht University and DialogueTrainer */

/* exported Resize */
let Resize;

(function()
{
    "use strict";

    // eslint-disable-next-line no-global-assign
    Resize =
    {
        initialize: initialize
    };

    function initialize(options)
    {
        const domSidebarGrip = $(options.containerSelector).find('.grip');
        let mouseCoordinate = 0;

        const setContainerDimension = dimension =>
        {
            const d = Math.min(Math.max(dimension, options.minDimension), options.maxDimension);
            $(options.containerSelector).css(options.direction === 'horizontal' ? 'width' : 'height', d + 'px');
            localStorage.setItem(options.dimensionKey, d);
            localStorage.setItem(options.collapsedKey, false);
        };

        const collapseContainer = set =>
        {
            set = set || false; // Don't toggle, just collapse
            if (set || localStorage.getItem(options.collapsedKey) === "false")
            {
                if (options.direction === 'horizontal')
                {
                    $(options.containerSelector).css('width', $(options.containerSelector).css('min-width'));
                }
                else
                {
                    $(options.containerSelector).css('height', $(options.containerSelector).css('min-height'));
                }

                localStorage.setItem(options.collapsedKey, 'true');
            }
            else if (localStorage.getItem(options.collapsedKey) === "true")
            {
                setContainerDimension(options.maxDimension);
                localStorage.setItem(options.collapsedKey, 'false');
            }
        };

        const mouseMoveHandler = function(event)
        {
            const dimension = options.direction === 'horizontal' ?
                $(window).width() - event.pageX + mouseCoordinate :
                $(window).height() - event.pageY + mouseCoordinate;
            setContainerDimension(dimension);
        };

        const mouseUpHandler = function()
        {
            $(document).off("mousemove", mouseMoveHandler);
            $(document).off("mouseup", mouseUpHandler);
            $(options.containerSelector).removeClass('dragging');
        };

        $(domSidebarGrip).on('mousedown', function(event)
        {
            // Clear selection so browser doesn't try to drag selected items
            // Copied from: http://stackoverflow.com/a/3169849/1765330
            if (window.getSelection().empty)
            { // Chrome
                window.getSelection().empty();
            }
            else if (window.getSelection().removeAllRanges)
            { // Firefox
                window.getSelection().removeAllRanges();
            }

            const parentOffset = $(this).offset();
            mouseCoordinate = (options.direction === 'horizontal' ? event.pageX - parentOffset.left : event.pageY - parentOffset.top) / 2;
            $(document).on("mousemove", mouseMoveHandler);
            $(document).on("mouseup", mouseUpHandler);
            $(options.containerSelector).addClass('dragging');
        });

        if (options.enableCollapse)
        {
            $(domSidebarGrip).on('dblclick', function()
            {
                collapseContainer();
            });

            if (Utils.parseBool(localStorage.getItem(options.collapsedKey)))
            {
                collapseContainer(true);
            }
        }
        else if (localStorage.getItem(options.dimensionKey))
        {
            setContainerDimension(localStorage.getItem(options.dimensionKey));
        }
    }
})();
