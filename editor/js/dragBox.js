/* © Utrecht University and DialogueTrainer */

var DragBox;

(function()
{
    "use strict";

    var dragging = false;

    DragBox =
    {
        startDragging : startDragging,
        showError : showError,
        isDroppable : isDroppable,
        cancel: cancel,
        dragging: function(){ return dragging; } // To prevent other code from modifying this value
    };

    var startPos = {},
        dragPos = {},
        dragSafezone = 25,
        stopHandler = null;

    // Starts a dragging action, registering the stop handler
    function startDragging(e, text, newStopHandler)
    {
        startPos = { x: e.pageX, y: e.pageY };
        stopHandler = newStopHandler;
        $(document).on('mousemove', handleDrag);
        $(document).on('mouseup', handleStop);
        dragging = true;

        updateDraggerPosition(e);
        showDraggerWithText(text);
        $('#dragBox').removeClass('error');
        $('body').css("cursor", "move");
    }

    // Stops a dragging action without executing the stop handler
    function cancel()
    {
        if (dragging) stopDragging();
    }

    // Updates the position of the dragbox according to the mouse position
    function handleDrag(e)
    {
        e.preventDefault(); // Prevent selecting text

        updateDraggerPosition(e);
    }

    function handleStop()
    {
        // Whether this drop is cancelled or not,
        // stop handling the mouseup event
        $(document).off('mouseup', handleStop);

        // Allow the stop handler to cancel the drop
        // (i.e. force the user to keep dragging)
        if (isDroppable() && stopHandler())
        {
            stopDragging();
        }
        else
        {
            // Note that the following off-on pair does not
            // reduce to "do nothing" if this is the first
            // time handleStop is triggered!

            // Make sure the handler is not present before
            // (re-)adding it
            $(document).off('click', handleStop);
            // After the first time handleStop is triggered,
            // handle click instead of mouseup
            $(document).on('click', handleStop);
        }
    }

    // Resets dragging-related data and handlers
    function stopDragging()
    {
        $('#dragBox').hide();
        $(document).off('mousemove', handleDrag);
        $(document).off('mouseup click', handleStop);
        dragging = false;
        startPos = {};
        dragPos = {};
        stopHandler = null;
        $('body').css("cursor", "");
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
        var drag = $('#dragBox');
        drag.stop(true).css({ opacity: "" }).show();
        drag.text(text);
    }
})();
