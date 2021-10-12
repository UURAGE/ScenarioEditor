/* © Utrecht University and DialogueTrainer */

/* exported TabDock */
let TabDock;

(function()
{
    "use strict";

    // eslint-disable-next-line no-global-assign
    TabDock =
    {
        close: close,
        handleZoomOut: handleZoomOut,
        closeHandler: null,
        zoomOutHandler: null
    };

    $(function()
    {
        $("#closeTabDock").on('click', function()
        {
            close();
            $("#main").focus();
        });
    });

    function close()
    {
        const tabDock = $('#tabDock');
        tabDock.children().not('.ui-widget-header').hide();
        tabDock.hide();
        if (TabDock.closeHandler) TabDock.closeHandler();
        TabDock.closeHandler = null;
        TabDock.zoomOutHandler = null;
    }

    function handleZoomOut()
    {
        if (TabDock.zoomOutHandler) TabDock.zoomOutHandler();
    }
})();
