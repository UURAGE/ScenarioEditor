/*
//This program has been developed by students from the bachelor Computer Science at Utrecht University 
//within the Software and Game project courses 2013-2015
//©Copyright Utrecht University (Department of Information and Computing Sciences) 
*/

var KeyControl;

(function()
{
    var hotKeysActive;

    KeyControl = 
    {
        ctrlClickOnElement: ctrlClickOnElement,
        selectExtraElement: selectExtraElement,
        hotKeysActive  : hotKeysActive
    };
    
    $(document).ready(function() 
    {
        //activate the hotkeys
        KeyControl.hotKeysActive = true;

        // Event handlers.
        $("#main").on('keydown', function(e) 
        {
            // check if hotkeys are active
            if(KeyControl.hotKeysActive)
            {
                var ch = String.fromCharCode(e.keyCode);
                //Check if the ctrl key is pressed
                if(e.ctrlKey)
                {
                    if(e.keyCode in ctrlNumberControl)
                    {
                        ensurePreventDefault(this, e, ctrlNumberControl[e.keyCode]);
                    }
                    else if(ch in ctrlLetterControl)
                    {
                        ensurePreventDefault(this, e, ctrlLetterControl[ch]);
                    }
                    
                    $("#main").focus();
                }
                else if(e.keyCode in numberControl)
                {
                    ensurePreventDefault(this, e, numberControl[e.keyCode]);
                    $("#main").focus();
                }
                else if (ch in letterControl)
                {
                    ensurePreventDefault(this, e, letterControl[ch]);
                }
            }
        });
    });

    //All events for keyboard controls with normal letters.
    var letterControl = {
        Q: function()
        {
            if(Zoom.isZoomed()) 
                Main.addNewNode(Main.playerType);
        },
        W: function()
        {
            if(Zoom.isZoomed()) 
                Main.addNewNode(Main.computerType);
        },
        E: function()
        {
            if(Zoom.isZoomed()) 
                Main.addNewNode(Main.conversationType);
        },
        R: function()
        {
            if(Zoom.isZoomed()) 
                Main.createChildNode();
        },
        T: function()
        {
            if(!Zoom.isZoomed()) 
                Main.addNewTree(null, true, 0, 0);
        },
        M: function()
        {
            Media.mediaDialog();
        },
        B: function()
        {
            Metadata.metadataDialog();
        },
        V: function()
        {
            var errors = Validator.validate();
            Validator.show(errors);
        }
    };

    //All events for keyboard controls with special characters.
    var numberControl = {
        46: function()
        {
            Main.deleteAllSelected();
        },
        38: function()
        {
            selectParent();
        },
        40: function()
        {
            selectChild();
        },
        39: function()
        {
            selectRightBrother();
        },
        37: function()
        {
            selectLeftBrother();
        },
        27: function()
        {
            DragBox.cancel();
        }
    };

    //All events for keyboard controls with normal letters and ctrl pressed.
    var ctrlLetterControl = {
        A: function()
        {
            selectAll();
        },
        C: function()
        {
            Clipboard.copyElement();
        },
        X: function()
        {
            Clipboard.cutElement();
        },
        V: function()
        {
            Clipboard.pasteElement();
        },
        S: function()
        {
            Media.downloadFile();
        },
        L: function()
        {
            location.reload();
        },
    };

    //All events for keyboard controls with special characters and ctrl pressed.
    var ctrlNumberControl = {
        38: function()
        {
            moveNodeUp();
        },
        40: function()
        {
            moveNodeDown();
        },
        39: function()
        {
            moveNodeRight();
        },
        37: function()
        {
            moveNodeLeft();
        }
    };
    
    // Ensures the default event trigger is really prevented, 
    // because of a bug in firefox it is still triggered, 
    // when just calling event.preventDefault() 
    // http://stackoverflow.com/questions/14860759/cant-override-ctrls-in-firefox-using-jquery-hotkeys
    // -> move this to utils?
    function ensurePreventDefault(div, event, eventFunction)
    {
        event.preventDefault();
                        
        div.blur();
                        
        setTimeout(function() { eventFunction(); }, 50);        
    }

    /*
     ** Public Functions
     */

    //If the user clicked on a node while ctrl is pressed, check if he need to be selected or deselected.
    function ctrlClickOnElement(node)
    {
        if ($("#" + node).hasClass("multiSelected"))
            deselectElement(node);
        else selectExtraElement(node);
    }

    // Multiselect an extra element
    function selectExtraElement(elementID)
    {
        if (Main.selectedElements.length === 0)
        {
            Main.selectElement(elementID);
        }
        else
        {
            if (Main.selectedElements.length === 1)
            {
                var selectedElementID = Main.selectedElement;
                Main.selectElement(null);
                Main.selectedElements.push(selectedElementID);
                $("#" + selectedElementID).addClass("multiSelected");
            }
            
            Main.selectedElements.push(elementID);
            $("#" + elementID).addClass("multiSelected");
        }
    }
    
    /*
     ** Private Functions
     */

    //If the user clicked on a selected node while ctrl is pressed, deselect the node.
    function deselectElement(node)
    {
        if (Main.selectedElement !== null)
            Main.selectElement(null);
        else
        {
            $("#" + node).removeClass("multiSelected");
            Main.selectedElements = jQuery.grep(Main.selectedElements,
                function(value)
                {
                    return value != node;
                });
            if (Main.selectedElements.length == 1)
                Main.selectElement(Main.selectedElements[0]);
        }
    }

    //If a node is selected and arrow up is pressed, move the node up.
    function moveNodeUp()
    {
        // Check if none of the selected nodes are out of the upper bound
        var outOfUpperBound = false;
        for (var i = 0; i < Main.selectedElements.length; i++)
        {
            var upperBound = $('#main').position().top + 50;
            
            var newTop = $("#" + Main.selectedElements[i]).offset().top - 5;
            
            outOfUpperBound = newTop < upperBound - 1;
        }
        
        // If none of the nodes is moving outside of the canvas, move and repaint them
        if (!outOfUpperBound)
        {
            for (var j = 0; j < Main.selectedElements.length; j++)
            {
                $("#" + Main.selectedElements[j]).offset(
                {
                    top: $("#" + Main.selectedElements[j]).offset().top - 5
                });
                jsPlumb.repaint($("#" + Main.selectedElements[j]));
            }
        }
    }

    //If a node is selected and arrow up is pressed, move the node down.
    function moveNodeDown()
    {
        for (var i = 0; i < Main.selectedElements.length; i++)
        {
            $("#" + Main.selectedElements[i]).offset(
            {
                top: $("#" + Main.selectedElements[i]).offset()
                    .top + 5
            });
            jsPlumb.repaint($("#" + Main.selectedElements[i]));
        }
    }

    //If a node is selected and arrow up is pressed, move the node to the left.
    function moveNodeLeft()
    {
        // Check if none of the nodes will move out of the canvas
        var outOfLeftBound = false;
        for (var i = 0; i < Main.selectedElements.length; i++)
        {
            var leftBound = $('#main').position().left;
            
            var newLeft = $("#" + Main.selectedElements[i]).offset().left - 5;
            
            outOfLeftBound = newLeft < leftBound - 1;
            
            if (outOfLeftBound)
                break;
        }
        
        // If none of the nodes will move out of the canvas, move and repaint them
        if (!outOfLeftBound)
        {
            for (var j = 0; j < Main.selectedElements.length; j++)
            {
                $("#" + Main.selectedElements[j]).offset(
                {
                    left: $("#" + Main.selectedElements[j]).offset().left - 5
                });
                jsPlumb.repaint($("#" + Main.selectedElements[j]));
            }
        }
    }

    //If a node is selected and arrow up is pressed, move the node to the right.
    function moveNodeRight()
    {
        for (var i = 0; i < Main.selectedElements.length; i++)
        {
            $("#" + Main.selectedElements[i]).offset(
            {
                left: $("#" + Main.selectedElements[i]).offset()
                    .left + 5
            });
            jsPlumb.repaint($("#" + Main.selectedElements[i]));
        }
    }

    function selectAll()
    {
        Main.selectElement(null);
        Main.selectedElements = [];
        
        if (Zoom.isZoomed())
        {
            Zoom.getZoomed().nodes.forEach(function(nodeID)
            {
                selectExtraElement(nodeID);
            });
        }
        else
        {
            $('.treeContainer').each(function(i, tree)
            {
                selectExtraElement(tree.id);
            });
        }
    }

    //Select the lowest parent from the current selected node.
    function selectParent()
    {
        if (Main.selectedElement === null) return;

        var connections = jsPlumb.getConnections(
        {
            target: Main.selectedElement
        });
        var closestNode;
        var top = -Infinity;
        for (var i = 0; i < connections.length; i++)
        {
            if ($("#" + connections[i].sourceId).offset().top > top)
            {
                closestNode = connections[i].sourceId;
                top = $("#" + closestNode).offset().top;
            }
        }
        if (top !== -Infinity)
            Main.selectElement(closestNode);
    }

    //Select the highest child from the current selected node.
    function selectChild()
    {
        if (Main.selectedElement === null) return;

        var connections = jsPlumb.getConnections(
        {
            source: Main.selectedElement
        });
        var closestNode;
        var top = Infinity;
        for (var i = 0; i < connections.length; i++)
        {
            if ($("#" + connections[i].targetId).offset().top < top)
            {
                closestNode = connections[i].targetId;
                top = $("#" + closestNode).offset().top;
            }
        }
        if (top !== Infinity)
            Main.selectElement(closestNode);
    }

    //Select the closest brother on the right from the current selected node.
    function selectRightBrother()
    {
        if (Main.selectedElement === null) return;

        var connections = jsPlumb.getConnections(
        {
            target: Main.selectedElement
        });
        var closestNode;
        var left = Infinity;
        var leftCurrent = $("#" + Main.selectedElement).offset().left;
        for (var i = 0; i < connections.length; i++)
        {
            var connections2 = jsPlumb.getConnections(
            {
                source: connections[i].sourceId
            });
            for (var j = 0; j < connections2.length; j++)
            {
                var nodeLookedAt = connections2[j].targetId;
                var leftLookedAt = $("#" + nodeLookedAt).offset().left;

                if ((nodeLookedAt != Main.selectedElement) && (
                        leftLookedAt > leftCurrent) && (left >
                        leftLookedAt))
                {
                    closestNode = nodeLookedAt;
                    left = leftLookedAt;
                }
            }
        }
        if (left !== Infinity)
            Main.selectElement(closestNode);
    }

    //Select the closest brother on the left from the current selected node.
    function selectLeftBrother()
    {
        if (Main.selectedElement === null) return;

        var connections = jsPlumb.getConnections(
        {
            target: Main.selectedElement
        });
        
        var closestNode;
        var right = -Infinity;
        var rightCurrent = $("#" + Main.selectedElement).offset().left;
        for (var i = 0; i < connections.length; i++)
        {
            var sourceConnections = jsPlumb.getConnections(
            {
                source: connections[i].sourceId
            });
            
            for (var j = 0; j < sourceConnections.length; j++)
            {
                var nodeLookedAt = sourceConnections[j].targetId;
                var rightLookedAt = $("#" + nodeLookedAt).offset().left;

                if ((nodeLookedAt != Main.selectedElement) &&
                    (rightLookedAt < rightCurrent) &&
                    (right < rightLookedAt))
                {
                    closestNode = nodeLookedAt;
                    right = rightLookedAt;
                }
            }
        }
        
        if (right !== -Infinity)
            Main.selectElement(closestNode);
    }
})();
