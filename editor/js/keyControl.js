/* © Utrecht University and DialogueTrainer */

var KeyControl;

(function()
{
    "use strict";

    var hotKeysActive;

    KeyControl =
    {
        ctrlClickOnElement: ctrlClickOnElement,
        hotKeysActive  : hotKeysActive
    };

    var ctrlNumberControl,
        ctrlLetterControl,
        numberControl,
        letterControl;

    $(document).ready(function()
    {
        //activate the hotkeys
        KeyControl.hotKeysActive = true;

        // Event handlers.
        $("#main").on('keydown', function(e)
        {
            // check if hotkeys are active
            if (KeyControl.hotKeysActive)
            {
                var ch = String.fromCharCode(e.keyCode);
                //Check if the ctrl key is pressed
                if ((e.ctrlKey || e.metaKey) && !e.shiftKey)
                {
                    if (e.keyCode in ctrlNumberControl)
                    {
                        Utils.ensurePreventDefault(this, e, ctrlNumberControl[e.keyCode]);
                    }
                    else if (ch in ctrlLetterControl)
                    {
                        Utils.ensurePreventDefault(this, e, ctrlLetterControl[ch]);
                    }

                    $("#main").focus();
                }
                else if (!(e.ctrlKey || e.metaKey) && !e.shiftKey && e.keyCode in numberControl)
                {
                    Utils.ensurePreventDefault(this, e, numberControl[e.keyCode]);
                    $("#main").focus();
                }
                else if (!(e.ctrlKey || e.metaKey) && !e.shiftKey && ch in letterControl)
                {
                    Utils.ensurePreventDefault(this, e, letterControl[ch]);
                }
            }
        });
    });

    //All events for keyboard controls with normal letters.
    letterControl = {
        Q: function()
        {
            if (Zoom.isZoomed())
            {
                Main.addNewNode(Main.playerType, "", Main.mousePositionToDialoguePosition(Main.mousePosition), true);
            }
        },
        W: function()
        {
            if (Zoom.isZoomed())
            {
                Main.addNewNode(Main.computerType, "", Main.mousePositionToDialoguePosition(Main.mousePosition), true);
            }
        },
        E: function()
        {
            if (Zoom.isZoomed())
            {
                Main.addNewNode(Main.situationType, "", Main.mousePositionToDialoguePosition(Main.mousePosition), true);
            }
        },
        R: function()
        {
            if (Zoom.isZoomed() && Main.selectedElement)
            {
                Main.createChildNode(Main.selectedElement);
            }
        },
        T: function()
        {
            if (!Zoom.isZoomed())
            {
                Main.addNewTree();
            }
        },
        A: function()
        {
            var allParentsButton = $("#allParents");
            if (!allParentsButton.is(":disabled"))
            {
                allParentsButton.trigger('click');
            }
        },
        B: function()
        {
            Metadata.dialog();
        },
        P: function()
        {
            Parameters.dialog();
        },
        X: function()
        {
            Evaluations.dialog();
        },
        I: function()
        {
            Load.importDialog();
        },
        O: function()
        {
            Save.exportScenario();
        },
        V: function()
        {
            var errors = Validator.validate();
            Validator.show(errors);
        }
    };

    //All events for keyboard controls with special characters.
    numberControl = {
        13: function()
        {
            if (Main.selectedElements[0] in Main.nodes)
            {
                Main.startEditingNode(Main.selectedElements[0]);
            }
            else if (Main.selectedElements[0] in Main.trees)
            {
                Zoom.toggleZoom(Main.trees[Main.selectedElements[0]]);
            }
        },
        46: function()
        {
            Main.deleteAllSelected();
        },
        38: function()
        {
            if (Main.selectedElements[0] in Main.nodes)
            {
                selectParent();
            }
            else if (Main.selectedElements[0] in Main.trees)
            {
                var selectedTree = Main.trees[Main.selectedElements[0]];
                var upPredicate = function(tree)
                {
                    return tree.topPos < selectedTree.topPos && tree.leftPos === selectedTree.leftPos;
                };

                selectClosestOffsetTree(upPredicate, Main.selectedElements[0]);
            }
        },
        40: function()
        {
            if (Main.selectedElements[0] in Main.nodes)
            {
                selectChild();
            }
            else if (Main.selectedElements[0] in Main.trees)
            {
                var selectedTree = Main.trees[Main.selectedElements[0]];
                var downPredicate = function(tree)
                {
                    return tree.topPos > selectedTree.topPos && tree.leftPos === selectedTree.leftPos;
                };

                selectClosestOffsetTree(downPredicate, Main.selectedElements[0]);
            }
        },
        39: function()
        {
            if (Main.selectedElements[0] in Main.nodes)
            {
                selectRightBrother();
            }
            else if (Main.selectedElements[0] in Main.trees)
            {
                var selectedTree = Main.trees[Main.selectedElements[0]];
                var rightPredicate = function(tree)
                {
                    return tree.topPos == selectedTree.topPos && tree.leftPos > selectedTree.leftPos;
                };

                selectClosestOffsetTree(rightPredicate, Main.selectedElements[0]);
            }
        },
        37: function()
        {
            if (Main.selectedElements[0] in Main.nodes)
            {
                selectLeftBrother();
            }
            else if (Main.selectedElements[0] in Main.trees)
            {
                var selectedTree = Main.trees[Main.selectedElements[0]];
                var leftPredicate = function(tree)
                {
                    return tree.topPos === selectedTree.topPos && tree.leftPos < selectedTree.leftPos;
                };

                selectClosestOffsetTree(leftPredicate, Main.selectedElements[0]);
            }
        },
        27: function()
        {
            DragBox.cancel();
        }
    };

    //All events for keyboard controls with normal letters and ctrl pressed.
    ctrlLetterControl = {
        A: function()
        {
            selectAll();
        },
        S: function()
        {
            Save.exportScenario();
        },
        L: function()
        {
            location.reload();
        },
        P: function()
        {
            Print.printScenario();
        }
    };

    //All events for keyboard controls with special characters and ctrl pressed.
    ctrlNumberControl = {
        38: function()
        {
            if (Main.selectedElements[0] in Main.nodes)
            {
                moveNode({ y: -1 });
            }
            else if (Main.selectedElements[0] in Main.trees)
            {
                moveTree(function(x){return x;}, function(y){return y-1;});//arrow(lambda) functions would be nice here when support is sorted out
            }
        },
        40: function()
        {
            if (Main.selectedElements[0] in Main.nodes)
            {
                moveNode({ y: 1 });
            }
            else if (Main.selectedElements[0] in Main.trees)
            {
                moveTree(function(x){return x;}, function(y){return y+1;});
            }
        },
        39: function()
        {
            if (Main.selectedElements[0] in Main.nodes)
            {
                moveNode({ x: 1 });
            }
            else if (Main.selectedElements[0] in Main.trees)
            {
                moveTree(function(x){return x+1;}, function(y){return y;});
            }
        },
        37: function()
        {
            if (Main.selectedElements[0] in Main.nodes)
            {
                moveNode({ x: -1 });
            }
            else if (Main.selectedElements[0] in Main.trees)
            {
                moveTree(function(x){return x-1;}, function(y){return y;});
            }
        },
        13: function()
        {
            var selectedTree = Zoom.getZoomed();
            if (Main.selectedElements[0] === undefined && selectedTree !== null)
            {
                Zoom.toggleZoom(selectedTree);
                Main.selectElement(selectedTree.id);
            }
        }
    };

    //If the user clicked on a node while ctrl is pressed, check if he need to be selected or deselected.
    function ctrlClickOnElement(node)
    {
        if (Main.selectedElements.indexOf(node) !== -1)
        {
            deselectElement(node);
        }
        else
        {
            selectExtraElement(node);
        }
    }

    // Multiselect an extra element
    function selectExtraElement(elementID)
    {
        if (elementID === null) return;

        if (Main.selectedElements.length === 0)
        {
            Main.selectElement(elementID);
        }
        else
        {
            if (Main.selectedElements.length === 1)
            {
                var selectedElementID = Main.selectedElements[0];
                Main.selectElement(null);
                Main.selectedElements.push(selectedElementID);
                $("#" + selectedElementID).addClass("ui-selected");
                if (selectedElementID in Main.nodes)
                {
                    Main.getPlumbInstanceByNodeID(selectedElementID).addToDragSelection(selectedElementID);
                }
            }

            Main.selectedElements.push(elementID);
            $("#" + elementID).addClass("ui-selected");
            if (elementID in Main.nodes)
            {
                Main.getPlumbInstanceByNodeID(elementID).addToDragSelection(elementID);
            }
        }
    }

    // If the user clicked on a selected element while ctrl is pressed, deselect the element.
    function deselectElement(elementID)
    {
        if (elementID === null) return;

        if (elementID in Main.nodes)
        {
            Main.getPlumbInstanceByNodeID(elementID).removeFromDragSelection(elementID);
        }

        if (Main.selectedElement !== null)
        {
            Main.selectElement(null);
        }
        else
        {
            $("#" + elementID).removeClass("ui-selected");
            Main.selectedElements = jQuery.grep(Main.selectedElements,
                function(value)
                {
                    return value != elementID;
                });
            if (Main.selectedElements.length == 1)
            {
                Main.selectElement(Main.selectedElements[0]);
            }
        }
    }

    //If a node is selected and arrow up is pressed, move the node up.
    function moveNode(direction)
    {
        var deltaX = direction.x ? direction.x * 5 : 0;
        var deltaY = direction.y ? direction.y * 5 : 0;
        var upperBound = 0;
        var leftBound = 0;

        // Check if none of the nodes will move out of the canvas
        var outOfLeftBound = direction.x === -1 && Main.selectedElements.some(function(selectedElement)
        {
            var newLeft = Utils.cssPosition($("#" + selectedElement)).left + deltaX;
            // Include delta for the left boundary for smaller movements than delta
            // This is corrected later on by clamping to the bounds
            return newLeft <= leftBound + deltaX;
        });

        // Check if none of the nodes will move out of the canvas
        var outOfUpperBound = direction.y === -1 && Main.selectedElements.some(function(selectedElement)
        {
            var newTop = Utils.cssPosition($("#" + selectedElement)).top + deltaY;
            // Include delta for the upper boundary for smaller movements than delta
            // This is corrected later on by clamping to the bounds
            return newTop <= upperBound + deltaY;
        });

        // If none of the nodes is moving outside of the canvas, move and repaint them
        if (!outOfLeftBound && !outOfUpperBound)
        {
            Main.unsavedChanges = true;

            var plumbInstance = Main.getPlumbInstanceByNodeID(Main.selectedElements[0]);
            Main.selectedElements.forEach(function(selectedElement)
            {
                var position = Utils.cssPosition($("#" + selectedElement));
                Utils.cssPosition($("#" + selectedElement),
                {
                    left: Math.max(position.left + deltaX, leftBound),
                    top: Math.max(position.top + deltaY, upperBound)
                });

                plumbInstance.revalidate(selectedElement);
            });
        }
    }

    function moveTree(modifyX, modifyY)
    {
        var allClear = true;
        var tree, newGridX, newGridY;

        for (var i = 0; i < Main.selectedElements.length; i++)
        {
            tree = Main.trees[Main.selectedElements[i]];
            newGridX = modifyX(tree.leftPos);
            newGridY = modifyY(tree.topPos);

            //new position is within bounds
            if (newGridX >= 0 && newGridY >= 0)
            {
                //check if the new position is blocked by an unselected tree
                //selected trees may occupy the space since they will move anyway
                //all selected trees will move in the same distance in the same direction so no two selected trees can end up in the same space if they are not already
                allClear = allClear && checkUnselectedGridAvailable(newGridX, newGridY);

                if(!allClear)
                {
                    break;
                }
            }
            else
            {
                allClear = false;
                break;
            }
        }

        if (allClear)
        {
            Main.unsavedChanges = true;

            for (var j = 0; j < Main.selectedElements.length; j++)
            {
                tree = Main.trees[Main.selectedElements[j]];
                newGridX = modifyX(tree.leftPos);
                newGridY = modifyY(tree.topPos);

                tree.leftPos = newGridX;
                tree.topPos = newGridY;

                Utils.cssPosition(tree.dragDiv,
                {
                    "top": tree.topPos*Main.gridY,
                    "left": tree.leftPos*Main.gridX
                });
            }
        }
    }

    function selectClosestOffsetTree(offsetPredicate, originID)
    {
        var minDistance = Number.MAX_VALUE;
        var originTree = Main.trees[originID];
        var selectID = "";

        $.each(Main.trees, function(id, tree)
        {
            if (id === originID)
            {
                return;
            }
            else
            {
                if (offsetPredicate(tree))
                {
                    var distance = Math.sqrt(Math.pow(tree.topPos-originTree.topPos, 2) + Math.pow(tree.leftPos-originTree.leftPos, 2));
                    if (distance < minDistance)
                    {
                        minDistance = distance;
                        selectID = id;
                    }
                }
            }
        });

        if (selectID !== "")
        {
            Main.selectElement(selectID);
        }
    }

    function checkUnselectedGridAvailable(gridX, gridY)
    {
        var available = true;

        $.each(Main.trees, function(id, tree)
        {
            if (Main.selectedElements.indexOf(id) !== -1) return;

            available = available && !(tree.leftPos === gridX && tree.topPos === gridY);
        });

        return available;
    }

    function selectAll()
    {
        if (Zoom.isZoomed())
        {
            Main.selectElements(Zoom.getZoomed().nodes);
        }
        else
        {
            Main.selectElements(Object.keys(Main.trees));
        }
    }

    //Select the lowest parent from the current selected node.
    function selectParent()
    {
        if (Main.selectedElement === null) return;

        var plumbInstance = Main.getPlumbInstanceByNodeID(Main.selectedElement);

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
        {
            Main.selectElement(closestNode);
        }
    }

    //Select the highest child from the current selected node.
    function selectChild()
    {
        if (Main.selectedElement === null) return;

        var plumbInstance = Main.getPlumbInstanceByNodeID(Main.selectedElement);

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
        {
            Main.selectElement(closestNode);
        }
    }

    //Select the closest brother on the right from the current selected node.
    function selectRightBrother()
    {
        if (Main.selectedElement === null) return;

        var plumbInstance = Main.getPlumbInstanceByNodeID(Main.selectedElement);

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

                if (nodeLookedAt != Main.selectedElement &&
                    leftLookedAt > leftCurrent &&
                    left > leftLookedAt)
                {
                    closestNode = nodeLookedAt;
                    left = leftLookedAt;
                }
            }
        }
        if (left !== Infinity)
        {
            Main.selectElement(closestNode);
        }
    }

    //Select the closest brother on the left from the current selected node.
    function selectLeftBrother()
    {
        if (Main.selectedElement === null) return;

        var plumbInstance = Main.getPlumbInstanceByNodeID(Main.selectedElement);

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

                if (nodeLookedAt != Main.selectedElement &&
                    rightLookedAt < rightCurrent &&
                    right < rightLookedAt)
                {
                    closestNode = nodeLookedAt;
                    right = rightLookedAt;
                }
            }
        }

        if (right !== -Infinity)
        {
            Main.selectElement(closestNode);
        }
    }
})();
