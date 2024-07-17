// © DialogueTrainer

/* exported TabDock */
let TabDock;

(function()
{
    "use strict";

    let currentId = null;
    const renderFunctionByID = {};

    // eslint-disable-next-line no-global-assign
    TabDock =
    {
        register,
        close,
        isShown,
        switchTo,
        getActiveTabID: getActiveTabID,
        handleZoomOut,
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

    function getTabButtonById(id)
    {
        return $('#tabDock').find('.header').find(`button[data-tab-id='${CSS.escape(id)}']`);
    }

    function register(id, render, openOnRegister)
    {
        renderFunctionByID[id] = render;

        const tabButton = getTabButtonById(id);
        if (tabButton.length === 0)
        {
            console.error("TabDock button not found");
            return false;
        }
        tabButton.show();
        tabButton.on('click', function()
        {
            switchOrToggle(id);
        });

        if (openOnRegister)
        {
            switchTo(id);
        }
    }

    function close()
    {
        const tabDock = $('#tabDock').addClass('closed');
        // Remove 'active' class from all buttons
        tabDock.find('.header').find('button').removeClass('active');

        tabDock.children('.content').children().hide();
        tabDock.find('.controls').empty();
        if (TabDock.closeHandler) TabDock.closeHandler();
        TabDock.closeHandler = null;
        TabDock.zoomOutHandler = null;
        currentId = null;
        $("#closeTabDock").hide();
        MiniMap.update(false);
    }

    function show()
    {
        $('#tabDock').removeClass('closed')
            .find('.controls').empty().end()
            .children('.content').children().hide();
        $("#closeTabDock").show();
        MiniMap.update(false);
    }

    function isShown()
    {
        return !$('#tabDock').hasClass('closed');
    }

    function handleZoomOut()
    {
        if (TabDock.zoomOutHandler) TabDock.zoomOutHandler();
    }

    function switchOrToggle(id, ...renderArguments)
    {
        if (currentId === id)
        {
            close();
            return false;
        }

        switchTo(id, ...renderArguments);
        return true;
    }

    function switchTo(id, ...renderArguments)
    {
        // Remove the class active from all buttons inside the tabDock header
        $('#tabDock').find('.header').find('button').removeClass('active');
        currentId = id;
        getTabButtonById(id).addClass('active');

        show();

        // Render
        if (!(id in renderFunctionByID))
        {
            console.error(`Render function "${id}" not registered!`);
            return false;
        }

        renderFunctionByID[id](...renderArguments);
    }

    function getActiveTabID()
    {
        return currentId;
    }
})();
