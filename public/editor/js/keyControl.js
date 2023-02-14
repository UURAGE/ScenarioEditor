/* © Utrecht University and DialogueTrainer */

/* exported KeyControl */
let KeyControl;

(function()
{
    "use strict";

    // eslint-disable-next-line no-global-assign
    KeyControl =
    {
        ctrlClickOnElement: ctrlClickOnElement
    };

    // All events for keyboard controls with normal letters.
    const letterControl = {
        Q: function()
        {
            const dialoguePosition = Main.mousePositionToDialoguePosition(Main.mousePosition);
            if (dialoguePosition) Main.addNewNode(Main.playerType, "", dialoguePosition, true);
        },
        W: function()
        {
            const dialoguePosition = Main.mousePositionToDialoguePosition(Main.mousePosition);
            if (dialoguePosition) Main.addNewNode(Main.computerType, "", dialoguePosition, true);
        },
        E: function()
        {
            const dialoguePosition = Main.mousePositionToDialoguePosition(Main.mousePosition);
            if (dialoguePosition) Main.addNewNode(Main.situationType, "", dialoguePosition, true);
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
            if (!Zoom.isZoomed() && Main.isMousePositionWithinEditingCanvas())
            {
                Main.addNewTree(true);
            }
        },
        A: function()
        {
            const highlightAncestorsButton = $("#highlightAncestors");
            if (!highlightAncestorsButton.is(":disabled"))
            {
                highlightAncestorsButton.trigger('click');
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
            const errors = Validator.validate();
            Validator.show(errors);
        }
    };

    // All events for keyboard controls with special characters.
    const numberControl = {
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
                const selectedTree = Main.trees[Main.selectedElements[0]];
                const upPredicate = function(tree)
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
                const selectedTree = Main.trees[Main.selectedElements[0]];
                const downPredicate = function(tree)
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
                const selectedTree = Main.trees[Main.selectedElements[0]];
                const rightPredicate = function(tree)
                {
                    return tree.topPos === selectedTree.topPos && tree.leftPos > selectedTree.leftPos;
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
                const selectedTree = Main.trees[Main.selectedElements[0]];
                const leftPredicate = function(tree)
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

    // All events for keyboard controls with normal letters and ctrl pressed.
    const ctrlLetterControl = {
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

    // All events for keyboard controls with special characters and ctrl pressed.
    const ctrlNumberControl = {
        38: function()
        {
            if (Main.selectedElements[0] in Main.nodes)
            {
                moveNode(0, -1);
            }
            else if (Main.selectedElements[0] in Main.trees)
            {
                moveTree(0, -1);
            }
        },
        40: function()
        {
            if (Main.selectedElements[0] in Main.nodes)
            {
                moveNode(0, 1);
            }
            else if (Main.selectedElements[0] in Main.trees)
            {
                moveTree(0, 1);
            }
        },
        39: function()
        {
            if (Main.selectedElements[0] in Main.nodes)
            {
                moveNode(1, 0);
            }
            else if (Main.selectedElements[0] in Main.trees)
            {
                moveTree(1, 0);
            }
        },
        37: function()
        {
            if (Main.selectedElements[0] in Main.nodes)
            {
                moveNode(-1, 0);
            }
            else if (Main.selectedElements[0] in Main.trees)
            {
                moveTree(-1, 0);
            }
        },
        13: function()
        {
            const selectedTree = Zoom.getZoomed();
            if (Main.selectedElements[0] === undefined && selectedTree !== null)
            {
                Zoom.toggleZoom(selectedTree);
                Main.selectElement(selectedTree.id);
            }
        }
    };

    $(function()
    {
        // Event handlers.
        $(document).on('keydown', function(e)
        {
            // Check if hotkeys are active
            if (Main.isEditingInCanvas())
            {
                const ch = String.fromCharCode(e.keyCode);
                // Check if the ctrl key is pressed
                if ((e.ctrlKey || e.metaKey) && !e.shiftKey)
                {
                    if (e.keyCode in ctrlNumberControl)
                    {
                        e.preventDefault();
                        ctrlNumberControl[e.keyCode]();
                    }
                    else if (ch in ctrlLetterControl)
                    {
                        e.preventDefault();
                        ctrlLetterControl[ch]();
                    }
                }
                else if (!(e.ctrlKey || e.metaKey) && !e.shiftKey && e.keyCode in numberControl)
                {
                    e.preventDefault();
                    numberControl[e.keyCode]();
                }
                else if (!(e.ctrlKey || e.metaKey) && !e.shiftKey && ch in letterControl)
                {
                    e.preventDefault();
                    letterControl[ch]();
                }
            }
        });
    });

    // If the user clicked on a node while ctrl is pressed, check if he need to be selected or deselected.
    function ctrlClickOnElement(node)
    {
        if (Main.selectedElements.includes(node))
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
            let plumbInstance;
            if (Main.selectedElements.length === 1)
            {
                const selectedElementID = Main.selectedElements[0];
                Main.selectElement(null);
                Main.selectedElements.push(selectedElementID);
                $("#" + selectedElementID).addClass("ui-selected");
                plumbInstance = selectedElementID in Main.nodes ? Main.getPlumbInstanceByNodeID(selectedElementID) : jsPlumb;
                plumbInstance.addToDragSelection(selectedElementID);
            }

            Main.selectedElements.push(elementID);
            $("#" + elementID).addClass("ui-selected");
            plumbInstance = elementID in Main.nodes ? Main.getPlumbInstanceByNodeID(elementID) : jsPlumb;
            plumbInstance.addToDragSelection(elementID);
        }
    }

    // If the user clicked on a selected element while ctrl is pressed, deselect the element.
    function deselectElement(elementID)
    {
        if (elementID === null) return;

        const plumbInstance = elementID in Main.nodes ? Main.getPlumbInstanceByNodeID(elementID) : jsPlumb;
        plumbInstance.removeFromDragSelection(elementID);

        if (Main.selectedElement !== null)
        {
            Main.selectElement(null);
        }
        else
        {
            $("#" + elementID).removeClass("ui-selected");
            Main.selectedElements = Main.selectedElements.filter(function(value)
            {
                return value != elementID;
            });
            if (Main.selectedElements.length == 1)
            {
                Main.selectElement(Main.selectedElements[0]);
            }
        }
    }

    function moveNode(deltaX, deltaY)
    {
        const pixelDeltaX = deltaX * 5;
        const pixelDeltaY = deltaY * 5;
        const upperBound = 0;
        const leftBound = 0;

        // Check if none of the nodes will move out of the canvas
        const outOfLeftBound = deltaX < 0 && Main.selectedElements.some(function(selectedElement)
        {
            const newLeft = Utils.cssPosition($("#" + selectedElement)).left + pixelDeltaX;
            // Include delta for the left boundary for smaller movements than delta
            // This is corrected later on by clamping to the bounds
            return newLeft <= leftBound + pixelDeltaX;
        });

        // Check if none of the nodes will move out of the canvas
        const outOfUpperBound = deltaY < 0 && Main.selectedElements.some(function(selectedElement)
        {
            const newTop = Utils.cssPosition($("#" + selectedElement)).top + pixelDeltaY;
            // Include delta for the upper boundary for smaller movements than delta
            // This is corrected later on by clamping to the bounds
            return newTop <= upperBound + pixelDeltaY;
        });

        // If none of the nodes is moving outside of the canvas, move and repaint them
        if (!outOfLeftBound && !outOfUpperBound)
        {
            SaveIndicator.setSavedChanges(false);

            const plumbInstance = Main.getPlumbInstanceByNodeID(Main.selectedElements[0]);
            Main.selectedElements.forEach(function(selectedElement)
            {
                const position = Utils.cssPosition($("#" + selectedElement));
                Utils.cssPosition($("#" + selectedElement),
                {
                    left: Math.max(position.left + pixelDeltaX, leftBound),
                    top: Math.max(position.top + pixelDeltaY, upperBound)
                });

                plumbInstance.revalidate(selectedElement);
            });
        }
    }

    function moveTree(deltaX, deltaY)
    {
        const allClear = Main.selectedElements.every(function(treeID)
        {
            const tree = Main.trees[treeID];
            const newGridX = tree.leftPos + deltaX;
            const newGridY = tree.topPos + deltaY;

            // New position is within bounds
            if (newGridX >= 0 && newGridY >= 0)
            {
                // Check if the new position is blocked by an unselected tree
                // Selected trees may occupy the space since they will move anyway.
                // All selected trees will move in the same distance in the same direction,
                // so no two selected trees can end up in the same space if they are not already.
                return Main.checkGridAvailable(newGridX, newGridY,
                    function(tree) { return Main.selectedElements.includes(tree.id); });
            }
            else
            {
                return false;
            }
        });

        if (allClear)
        {
            SaveIndicator.setSavedChanges(false);

            Main.selectedElements.forEach(function(treeID)
            {
                const tree = Main.trees[treeID];
                const newGridX = tree.leftPos + deltaX;
                const newGridY = tree.topPos + deltaY;

                tree.leftPos = newGridX;
                tree.topPos = newGridY;

                Utils.cssPosition(tree.dragDiv,
                {
                    "top": tree.topPos * Main.gridY,
                    "left": tree.leftPos * Main.gridX
                });
            });
        }
    }

    function selectClosestOffsetTree(offsetPredicate, originID)
    {
        let minDistance = Number.MAX_VALUE;
        const originTree = Main.trees[originID];
        let selectID = "";

        $.each(Main.trees, function(id, tree)
        {
            if (id === originID) return;
            if (!offsetPredicate(tree)) return;
            const distance = Math.sqrt(Math.pow(tree.topPos - originTree.topPos, 2) + Math.pow(tree.leftPos - originTree.leftPos, 2));
            if (distance < minDistance)
            {
                minDistance = distance;
                selectID = id;
            }
        });

        if (selectID !== "")
        {
            Main.selectElement(selectID);
        }
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
        MiniMap.update(true);
    }

    // Select the lowest parent from the current selected node.
    function selectParent()
    {
        if (Main.selectedElement === null) return;

        const plumbInstance = Main.getPlumbInstanceByNodeID(Main.selectedElement);

        const connections = plumbInstance.getConnections(
        {
            target: Main.selectedElement
        });
        let closestNode;
        let top = -Infinity;
        connections.forEach(function(connection)
        {
            if ($("#" + connection.sourceId).offset().top > top)
            {
                closestNode = connection.sourceId;
                top = $("#" + closestNode).offset().top;
            }
        });
        if (top !== -Infinity)
        {
            Main.selectElement(closestNode);
        }
    }

    // Select the highest child from the current selected node.
    function selectChild()
    {
        if (Main.selectedElement === null) return;

        const plumbInstance = Main.getPlumbInstanceByNodeID(Main.selectedElement);

        const connections = plumbInstance.getConnections(
        {
            source: Main.selectedElement
        });
        let closestNode;
        let top = Infinity;
        connections.forEach(function(connection)
        {
            if ($("#" + connection.targetId).offset().top < top)
            {
                closestNode = connection.targetId;
                top = $("#" + closestNode).offset().top;
            }
        });
        if (top !== Infinity)
        {
            Main.selectElement(closestNode);
        }
    }

    // Select the closest brother on the right from the current selected node.
    function selectRightBrother()
    {
        if (Main.selectedElement === null) return;

        const plumbInstance = Main.getPlumbInstanceByNodeID(Main.selectedElement);

        const connections = plumbInstance.getConnections(
        {
            target: Main.selectedElement
        });
        let closestNode;
        let left = Infinity;
        const leftCurrent = $("#" + Main.selectedElement).offset().left;
        connections.forEach(function(connection)
        {
            const sourceConnections = plumbInstance.getConnections(
            {
                source: connection.sourceId
            });
            sourceConnections.forEach(function(sourceConnection)
            {
                const nodeLookedAt = sourceConnection.targetId;
                const leftLookedAt = $("#" + nodeLookedAt).offset().left;

                if (nodeLookedAt != Main.selectedElement &&
                    leftLookedAt > leftCurrent &&
                    left > leftLookedAt)
                {
                    closestNode = nodeLookedAt;
                    left = leftLookedAt;
                }
            });
        });
        if (left !== Infinity)
        {
            Main.selectElement(closestNode);
        }
    }

    // Select the closest brother on the left from the current selected node.
    function selectLeftBrother()
    {
        if (Main.selectedElement === null) return;

        const plumbInstance = Main.getPlumbInstanceByNodeID(Main.selectedElement);

        const connections = plumbInstance.getConnections(
        {
            target: Main.selectedElement
        });

        let closestNode;
        let right = -Infinity;
        const rightCurrent = $("#" + Main.selectedElement).offset().left;
        connections.forEach(function(connection)
        {
            const sourceConnections = plumbInstance.getConnections(
            {
                source: connection.sourceId
            });

            sourceConnections.forEach(function(sourceConnection)
            {
                const nodeLookedAt = sourceConnection.targetId;
                const rightLookedAt = $("#" + nodeLookedAt).offset().left;

                if (nodeLookedAt != Main.selectedElement &&
                    rightLookedAt < rightCurrent &&
                    right < rightLookedAt)
                {
                    closestNode = nodeLookedAt;
                    right = rightLookedAt;
                }
            });
        });

        if (right !== -Infinity)
        {
            Main.selectElement(closestNode);
        }
    }
})();
