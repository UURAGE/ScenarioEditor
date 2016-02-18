/*
//This program has been developed by students from the bachelor Computer Science at Utrecht University 
//within the Software and Game project courses 2013-2015
//©Copyright Utrecht University (Department of Information and Computing Sciences) 
*/

var DragBox;

(function(){
    DragBox = 
    {
        startDragging : startDragging,
        showError : showError,
        isDroppable : isDroppable,
        cancel: cancelDragBox
    };

    var dragging = false,
        startPos = {},
        dragPos = {},
        dragSafezone = 25,
        stopHandler = null,
        cancelDragBox = new Event("cancelDragBox");

    // Starts a dragging action, registering the stop handler
    function startDragging(e, text, newStopHandler)
    {
        startPos = { x: e.pageX, y: e.pageY };
        stopHandler = newStopHandler;
        $(document).on('mousemove', handleDrag);
        $(document).on('mouseup', {cancel:false}, handleStop);
        $("#dragBox").on("cancelDragBox", {cancel:true}, handleStop);
        dragging = true;

        updateDraggerPosition(e);
        showDraggerWithText(text);
        $('#dragBox').removeClass('error');
        $('body').css("cursor", "move");
    }

    // Updates the position of the dragbox according to the mouse position
    function handleDrag(e)
    {
        e.preventDefault(); // Prevent selecting text

        updateDraggerPosition(e);
    }

    function handleStop(e)
    {
        var pos = { left: e.pageX, top: e.pageY };

        // Allow the stop handler to cancel the drop
        // Short-cicuit evaluation means that the drophandler is not executed on a cancel
        if (e.data.cancel || (isDroppable() && stopHandler(pos)))
        {
             // Reset all the dragging stuff
            $('#dragBox').hide();
            $(document).off('mousemove', handleDrag);
            $(document).off('mouseup', handleStop);
            $("#dragBox").off('cancelDragBox', handleStop);
            dragging = false;
            startPos = {};
            dragPos = {};
            stopHandler = null;
            $('body').css("cursor", "");
        }
    }

    // Only droppable if dragger is moved more than X pixels
    function isDroppable()
    {
        var dragMove = Math.abs(dragPos.x - startPos.x) +
            Math.abs(dragPos.y - startPos.y);
        return dragging && dragMove > dragSafezone;
    }

    function showError(e, text)
    {
        updateDraggerPosition(e);
        showDraggerWithText(text);

        var drag = $('#dragBox');
        drag.addClass('error');
        // .delay(1000) cannot be cancelled using .stop(true),
        // but .animate with a dummy value can.
        drag.animate({ dummy: 1 }, 1000).fadeOut();
    }

    function updateDraggerPosition(e)
    {
        dragPos.x = e.pageX;
        dragPos.y = e.pageY;
        $('#dragBox').css({ left: e.pageX, top: e.pageY });
    }

    function showDraggerWithText(text)
    {
        drag = $('#dragBox');
        drag.stop(true).css({ opacity: "" }).show();
        drag.html(text);
    }
})();
