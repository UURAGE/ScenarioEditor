/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

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
                if(e.ctrlKey && !e.shiftKey)
                {
                    if(e.keyCode in ctrlNumberControl)
                    {
                        Utils.ensurePreventDefault(this, e, ctrlNumberControl[e.keyCode]);
                    }
                    else if(ch in ctrlLetterControl)
                    {
                        Utils.ensurePreventDefault(this, e, ctrlLetterControl[ch]);
                    }

                    $("#main").focus();
                }
                else if(!e.ctrlKey && !e.shiftKey && e.keyCode in numberControl)
                {
                    Utils.ensurePreventDefault(this, e, numberControl[e.keyCode]);
                    $("#main").focus();
                }
                else if (!e.ctrlKey && !e.shiftKey && ch in letterControl)
                {
                    Utils.ensurePreventDefault(this, e, letterControl[ch]);
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
        P: function()
        {
            printScript();
        }
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

        if(elementID !== null && elementID !== undefined && !(elementID in Main.trees))
            Main.trees[Main.nodes[elementID].parent].plumbInstance.addToDragSelection($("#"+elementID)[0]);
    }

    /*
     ** Private Functions
     */

    //If the user clicked on a selected node while ctrl is pressed, deselect the node.
    function deselectElement(node)
    {
        if(node !== null && node !== undefined && !(node in Main.trees))
            Main.trees[Main.nodes[node].parent].plumbInstance.removeFromDragSelection($("#"+node)[0]);

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
        var plumbInstance = Main.trees[Main.selectedElements[0].parent].plumbInstance
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
            }

            plumbInstance.repaintEverything();
        }
    }

    //If a node is selected and arrow up is pressed, move the node down.
    function moveNodeDown()
    {
        var plumbInstance = Main.trees[Main.selectedElements[0].parent].plumbInstance
        for (var i = 0; i < Main.selectedElements.length; i++)
        {
            $("#" + Main.selectedElements[i]).offset(
            {
                top: $("#" + Main.selectedElements[i]).offset()
                    .top + 5
            });
        }

        plumbInstance.repaintEverything();
    }

    //If a node is selected and arrow up is pressed, move the node to the left.
    function moveNodeLeft()
    {
        // Check if none of the nodes will move out of the canvas
        var plumbInstance = Main.trees[Main.selectedElements[0].parent].plumbInstance
        var outOfLeftBound = false;
        for (var i = 0; i < Main.selectedElements.length; i++)
        {
            plumbInstance = Main.trees[Main.selectedElements[i].parent].plumbInstance

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
            }
            plumbInstance.repaintEverything();
        }
    }

    //If a node is selected and arrow up is pressed, move the node to the right.
    function moveNodeRight()
    {
        var plumbInstance = Main.trees[Main.selectedElements[0].parent].plumbInstance
        for (var i = 0; i < Main.selectedElements.length; i++)
        {
            $("#" + Main.selectedElements[i]).offset(
            {
                left: $("#" + Main.selectedElements[i]).offset()
                    .left + 5
            });
        }

        plumbInstance.repaintEverything();
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

        var plumbInstance = Main.trees[Main.nodes[Main.selectedElement].parent].plumbInstance;

        var connections = plumbInstance.getConnections(
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

        vvar plumbInstance = Main.trees[Main.nodes[Main.selectedElement].parent].plumbInstance;

        var connections = plumbInstance.getConnections(
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

        var plumbInstance = Main.trees[Main.nodes[Main.selectedElement].parent].plumbInstance;

        var connections = plumbInstance.getConnections(
        {
            target: Main.selectedElement
        });
        var closestNode;
        var left = Infinity;
        var leftCurrent = $("#" + Main.selectedElement).offset().left;
        for (var i = 0; i < connections.length; i++)
        {
            var connections2 = plumbInstance.getConnections(
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

        var plumbInstance = Main.trees[Main.nodes[Main.selectedElement].parent].plumbInstance;

        var connections = plumbInstance.getConnections(
        {
            target: Main.selectedElement
        });

        var closestNode;
        var right = -Infinity;
        var rightCurrent = $("#" + Main.selectedElement).offset().left;
        for (var i = 0; i < connections.length; i++)
        {
            var sourceConnections = plumbInstance.getConnections(
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
