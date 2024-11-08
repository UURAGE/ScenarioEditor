// © DialogueTrainer

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
        const sidebar = options.containerSelector === "#sidebar" ? $(options.containerSelector) : null;
        const sidebarTypeHeaderIcon = $(options.containerSelector).find('#sidebarType .header');
        let mouseCoordinate = 0;

        const setContainerDimension = dimension =>
        {
            const d = Math.min(Math.max(dimension, options.minDimension), options.maxDimension);
            $(options.containerSelector).css(options.direction === 'horizontal' ? 'width' : 'height', d + 'px');
            trySetInStorage(options.dimensionKey, d);
            trySetInStorage(options.collapsedKey, 'false');
        };

        const collapseContainer = set =>
        {
            if (set || tryGetFromStorage(options.collapsedKey) === "false")
            {
                if (options.direction === 'horizontal')
                {
                    sidebar.addClass('collapsed');
                    $(options.containerSelector).css('width', $(options.containerSelector).css('min-width'));
                }
                else
                {
                    $(options.containerSelector).css('height', $(options.containerSelector).css('min-height'));
                }

                trySetInStorage(options.collapsedKey, 'true');
            }
            else if (tryGetFromStorage(options.collapsedKey) === "true")
            {
                setContainerDimension(options.maxDimension);
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
            if (options.afterResize) options.afterResize();
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
            $(sidebarTypeHeaderIcon).on('click', function()
            {
                sidebar.toggleClass('collapsed');
                collapseContainer();
            });

            $(domSidebarGrip).on('dblclick', function()
            {
                collapseContainer();
            });

            if (Utils.parseBool(tryGetFromStorage(options.collapsedKey)))
            {
                collapseContainer(true);
            }
        }

        if (options.dimensionKey)
        {
            const dimension = tryGetFromStorage(options.dimensionKey);
            if (dimension) setContainerDimension(dimension);
        }
    }

    const storage = {};

    function tryGetFromStorage(key)
    {
        const storageItem = storage[key];
        if (storageItem !== undefined) return storageItem;

        try
        {
            return localStorage.getItem(key);
        }
        catch (e)
        {
            // Local storage is an enhancement
            console.error(e);
            return null;
        }
    }

    function trySetInStorage(key, value)
    {
        storage[key] = value;

        try
        {
            localStorage.setItem(key, value);
        }
        catch (e)
        {
            // Local storage is an enhancement
            console.error(e);
        }
    }
})();
