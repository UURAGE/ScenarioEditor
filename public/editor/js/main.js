/* © Utrecht University and DialogueTrainer */

/* exported Main */
var Main;

(function()
{
    "use strict";

    var gridX,
        gridY;

    // eslint-disable-next-line no-global-assign
    Main =
    {
        nodes: {},
        selectedElement: null,
        selectedElements: [],
        jsPlumbCounter: 0,
        computerType: "computer",
        playerType: "player",
        situationType: "situation",
        ancestorHighlightSettings:
        {
            nearKeyword: "target",
            farIDKeyword: "sourceId",
            generalClass: "ancestorOfSelected",
            directClass: "parentOfSelected"
        },
        descendantHighlightSettings:
        {
            nearKeyword: "source",
            farIDKeyword: "targetId",
            generalClass: "descendantOfSelected",
            directClass: "childOfSelected"
        },
        trees: {},
        maxTreeNumber: 0,
        gridX: gridX,
        gridY: gridY,
        // The mouse position relative to the html document
        mousePosition: { x: 0, y: 0 },
        // Functions
        addNewNode: addNewNode,
        addNewTree: addNewTree,
        applyChanges: applyChanges,
        changeNodeText: changeNodeText,
        mousePositionToDialoguePosition: mousePositionToDialoguePosition,
        createChildNode: createChildNode,
        createEmptyTree: createEmptyTree,
        createAndReturnNode: createAndReturnNode,
        deleteAllSelected: deleteAllSelected,
        deselectConnection: deselectConnection,
        getGridIndicatorPosition: getGridIndicatorPosition,
        getPlumbInstanceByNodeID: getPlumbInstanceByNodeID,
        getStartNodeIDs: getStartNodeIDs,
        getInterleaves: getInterleaves,
        highlightLinealRelatives: highlightLinealRelatives,
        isEditingInCanvas: isEditingInCanvas,
        isMousePositionWithinEditingCanvas: isMousePositionWithinEditingCanvas,
        makeConnection: makeConnection,
        selectElements: selectElements,
        selectElement: selectElement,
        selectNode: selectNode,
        startEditingNode: startEditingNode,
        stopEditingNode: stopEditingNode,
        triggerSubjectNameInput: triggerSubjectNameInput,
        updateButtons: updateButtons,
        updateDocumentTitle: updateDocumentTitle
    };

    // Node dragging
    var firstDragNodeID = null, invalidateNodeClick = false;
    // Tree dragging
    var firstDragTreeID = null, invalidateTreeClick = false, minimumCoordinatesByTree = {};
    // Selecting and panning
    var ctrlDown = false, spaceDown = false, isSelecting = false, isPanning = false;

    // Copied from: http://stackoverflow.com/a/22079985/1765330
    $.fn.attachDragger = function()
    {
        var lastPosition, position, difference;
        $(this)
            .on("mouseenter", function(e)
            {
                lastPosition = [e.clientX, e.clientY];
            })
            .on("mousedown", function(e)
            {
                isPanning = true;
                lastPosition = [e.clientX, e.clientY];
            })
            .on("mouseup", function()
            {
                isPanning = false;
            })
            .on("mousemove", function(e)
            {
                if (!isPanning) return;
                if (spaceDown)
                {
                    position = [e.clientX, e.clientY];
                    difference = [ position[0] - lastPosition[0], position[1] - lastPosition[1] ];
                    $(this).scrollLeft($(this).scrollLeft() - difference[0]);
                    $(this).scrollTop($(this).scrollTop() - difference[1]);
                    lastPosition = [e.clientX, e.clientY];
                }
                else
                {
                    isPanning = false;
                }
            });
        $(document).on("mouseup", function()
        {
            isPanning = false;
        });
    };

    $(function()
    {
        makeCollapsable();

        MiniMap.initialise();

        updateButtons();

        $("#main").focus();

        initialiseMenuBar();

        initialiseGrid();

        document.addEventListener('mousemove', function(e)
        {
            Main.mousePosition.x = e.pageX;
            Main.mousePosition.y = e.pageY;
        }, false);

        if (Config.container.characters.sequence.length > 1)
        {
            var characterSelection = $("#characterSelection");
            Config.container.characters.sequence.forEach(function(character)
            {
                characterSelection.append($("<option>", { value: character.id, text: character.name ? character.name : character.id }));
            });
        }
        else
        {
            $("#characterSelection").remove();
        }

        var scenarioNameInput = $('<input>', { type: 'text', maxlength: 50 });
        var scenarioNameInputSpan = $('<span>', { class: "scenarioNameInput" }).append(scenarioNameInput);
        scenarioNameInputSpan.on('focusout', function(e, cancel)
        {
            var nameInput = $('#scenarioNameTab .scenarioNameInput input');

            if (!cancel)
            {
                var inputName = Metadata.formatScenarioName(nameInput.val());
                if (inputName !== Metadata.container.name)
                {
                    Metadata.container.name = inputName;
                    $('#scenarioNameTab .scenarioName').text(Metadata.container.name);
                    Main.updateDocumentTitle();
                    SaveIndicator.setSavedChanges(false);
                }
            }

            $(this).hide();
            $('#scenarioNameTab .scenarioName').show();
        });
        scenarioNameInputSpan.on('keydown', function(e)
        {
            if (e.keyCode === 13) // Enter
            {
                $(this).trigger('focusout', [false]);
            }
            if (e.keyCode === 27) // Escape
            {
                $(this).trigger('focusout', [true]);
            }
        });
        scenarioNameInputSpan.hide();

        $('#scenarioNameTab').append(scenarioNameInputSpan);

        $('#scenarioNameTab .scenarioName').on('dblclick', function()
        {
            $(this).hide();

            var nameInputSpan = $('#scenarioNameTab .scenarioNameInput');
            var nameInput = nameInputSpan.children('input');
            nameInput.val(Metadata.container.name);
            nameInputSpan.show();
            nameInput.focus();
        });

        // Handle movement of the div indicating which grid cell youre hovering over
        $('#main').on('mousemove', function(e)
        {
            var mainPos = $("#main").offset();

            Utils.cssPosition($("#gridIndicator"),
            {
                "top": pixelPositionToGridPosition(e.pageY - mainPos.top + $("#main").scrollTop(), Main.gridY) * Main.gridY,
                "left": pixelPositionToGridPosition(e.pageX - mainPos.left + $("#main").scrollLeft(), Main.gridX) * Main.gridX
            });
        });

        $('#main').on('dblclick', function()
        {
            if (!Zoom.isZoomed()) addNewTree(true);
        });
        $('#newTree').on('mousedown', function(e)
        {
            selectElement(null);

            e.preventDefault(); // Prevent selecting text
            var text = "+ " + i18next.t('common:subject');

            Zoom.zoomOut();

            DragBox.startDragging(e, text, function(draggingContinues)
            {
                if (!isMousePositionWithinEditingCanvas()) return true;
                return addNewTree(!draggingContinues);
            }, true);
        });
        $('#newComputerNode').on("mousedown", function(e)
        {
            selectElement(null);

            e.preventDefault(); // Prevent selecting text
            var text = "+ " + i18next.t('common:computer');

            if (!Zoom.isZoomed())
            {
                DragBox.showError(e, i18next.t('main:no_subject_open'));
                return;
            }

            DragBox.startDragging(e, text, function(draggingContinues)
            {
                var dialoguePosition = mousePositionToDialoguePosition(Main.mousePosition);
                if (dialoguePosition) addNewNode(Main.computerType, "", dialoguePosition, !draggingContinues);
                return true;
            }, true);
        });
        $('#newPlayerNode').on("mousedown", function(e)
        {
            selectElement(null);

            e.preventDefault(); // Prevent selecting text
            var text = "+ " + i18next.t('common:player');

            if (!Zoom.isZoomed())
            {
                DragBox.showError(e, i18next.t('main:no_subject_open'));
                return;
            }

            DragBox.startDragging(e, text, function(draggingContinues)
            {
                var dialoguePosition = mousePositionToDialoguePosition(Main.mousePosition);
                if (dialoguePosition) addNewNode(Main.playerType, "", dialoguePosition, !draggingContinues);
                return true;
            }, true);
        });
        $('#newSituationNode').on("mousedown", function(e)
        {
            selectElement(null);

            e.preventDefault(); // Prevent selecting text
            var text = "+ " + i18next.t('common:situation');

            if (!Zoom.isZoomed())
            {
                DragBox.showError(e, i18next.t('main:no_subject_open'));
                return;
            }

            DragBox.startDragging(e, text, function(draggingContinues)
            {
                var dialoguePosition = mousePositionToDialoguePosition(Main.mousePosition);
                if (dialoguePosition) addNewNode(Main.situationType, "", dialoguePosition, !draggingContinues);
                return true;
            }, true);
        });
        $("#newChildNode").on('click', function()
        {
            createChildNode(Main.selectedElement);
        });
        $("#delete").on('click', function()
        {
            deleteAllSelected();

            $("#main").focus();
        });
        $("#highlightAncestors").on('click', function()
        {
            if ($(this).hasClass("enabled"))
            {
                $(this).removeClass("enabled");
                dehighlightLinealRelativesIncludingDirect(Main.ancestorHighlightSettings);
            }
            else
            {
                $(this).addClass("enabled");
                Main.selectedElements.forEach(function(nodeID)
                {
                    highlightLinealRelativesIncludingDirect(nodeID, Main.ancestorHighlightSettings);
                });
            }

            $("#main").focus();
        });
        $("#highlightDescendants").on('click', function()
        {
            if ($(this).hasClass("enabled"))
            {
                $(this).removeClass("enabled");
                dehighlightLinealRelativesIncludingDirect(Main.descendantHighlightSettings);
            }
            else
            {
                $(this).addClass("enabled");
                Main.selectedElements.forEach(function(nodeID)
                {
                    highlightLinealRelativesIncludingDirect(nodeID, Main.descendantHighlightSettings);
                });
            }

            $("#main").focus();
        });

        $("#addUserDefinedParameterEffect").on('click', function()
        {
            if (Parameters.atLeastOneUserDefined())
            {
                addEmptyUserDefinedParameterEffect();
                Utils.focusFirstTabindexedDescendant($(".effect").last());
            }
            else
            {
                Utils.alertDialog(i18next.t('main:no_parameters_to_affect'), 'info');
            }
        });

        $("#userDefinedParameterEffects").on('click', '.delete', function()
        {
            $(this).parent().remove();
        });

        Utils.makeSortable($("#userDefinedParameterEffects"));

        $("#main").on('mouseenter', function()
        {
            $("#gridIndicator").show();
        });

        // $("#main").on('mouseleave', function()
        // {
        //     $("#gridIndicator").hide();
        // });

        var isMainClickAction = false;
        $("#main").on('click', function(e)
        {
            if (e.target == this && isMainClickAction)
            {
                $(this).focus();
                selectElement(null);
            }
            isMainClickAction = false;
        });

        // Used for selecting multiple nodes.
        $("#main").selectable(
        {
            distance: 5,
            filter: ".w", // Only select the nodes.
            cancel: "#main *",
            appendTo: "#main"
        });

        $("#main").on('mousedown', function(event)
        {
            isMainClickAction = true;
            ctrlDown = event.ctrlKey || event.metaKey;
        });
        $("#main").on('selectablestart', function()
        {
            $(this).focus();
            if (!ctrlDown) selectElement(null);
        });
        $("#main").on('selectableselected', function(event, element)
        {
            var id = element.selected.id;

            var isZoomed = Zoom.isZoomed();
            var isTree = id in Main.trees;
            if ((isZoomed && !isTree) || (!isZoomed && isTree))
            {
                Main.selectedElements.push(id);
            }
        });
        $("#main").on('selectablestop', function()
        {
            isMainClickAction = false;

            selectElements(Main.selectedElements);

            MiniMap.update(true);
        });

        $(document).on('keydown', function(e)
        {
            if (e.which === 8 && !$(e.target).is('input, textarea'))
            {
                e.preventDefault();
            }
        });

        initialiseSidebar();
    });

    $(window).on('beforeunload', function()
    {
        // Confirmation for leaving the page
        if (!SaveIndicator.getSavedChanges())
        {
            return i18next.t('main:pending_changes');
        }
    });

    $(window).on('keydown', function(e)
    {
        if ($(document.activeElement).filter('input,textarea').length === 0 &&
        Zoom.isZoomed() && !isSelecting)
        {
            if (e.which == 32 && !spaceDown)
            {
                var zoomedTree = Zoom.getZoomed();
                spaceDown = true;
                zoomedTree.div.selectable('disable');
                zoomedTree.div.addClass('dragging');
            }
        }
    });

    $(window).on('keyup', function()
    {
        if (spaceDown)
        {
            var zoomedTree = Zoom.getZoomed();
            spaceDown = false;
            isPanning = false;
            zoomedTree.div.selectable('enable');
            zoomedTree.div.removeClass('dragging');
        }
    });

    function initialiseMenuBar()
    {
        var buttons = $(".dropdownButton");

        // These functions reference each other
        var closeOpenMenu, closeMenu, openMenu;

        closeOpenMenu = function(e)
        {
            var dropdownButton = $(".dropdownButton.dropped");
            var menu = dropdownButton.closest(".dropdown");
            if (menu.length === 0) return;
            // Mousedown events that target the open menu (including its button)
            // should not close it: both menu buttons and menu items have event
            // handlers that will do the closing (using closeMenu).
            if (e && (e.target === menu[0] || $.contains(menu[0], e.target))) return;

            closeMenu.call(dropdownButton);
        };

        // The following functions use this instead of an argument so they can be
        // used as event handlers without wrapping.
        // The non-jQuery capturing event handler ensures all clicks are handled.

        closeMenu = function()
        {
            $(this).removeClass("dropped");
            $(this).closest(".dropdown").find(".dropdownItems").hide();
            document.removeEventListener("mousedown", closeOpenMenu, true);
            buttons.off("mouseenter", openMenu);
        };

        openMenu = function()
        {
            if ($(this).hasClass("dropped")) return;
            closeOpenMenu();
            $(this).addClass("dropped");
            $(this).closest(".dropdown").find(".dropdownItems").show();
            document.addEventListener("mousedown", closeOpenMenu, true);
            buttons.on("mouseenter", openMenu);
        };

        buttons
            .on("mousedown", function(e)
            {
                if (e.button !== 0) return;
                $(this).trigger('click');
            })
            .on("mouseup", function(e)
            {
                if (e.button !== 0) return;
                Utils.stopQueuedClicks();
            })
            .on("click", function()
            {
                var handler = $(this).hasClass("dropped") ? closeMenu : openMenu;
                handler.call(this);
            });

        $(".dropdownItems")
            .on("mouseup", "button", function(e)
            {
                if (e.button !== 0) return;
                $(this).trigger('click');
                Utils.stopQueuedClicks();
            })
            .on("click", "button", function()
            {
                closeMenu.call($(this).closest(".dropdown").find(".dropdownButton"));
            });
    }

    function initialiseSidebar()
    {
        if (Utils.parseBool(localStorage.getItem('sidebarCollapsed')))
        {
            collapseSidebar(true);
        }
        else if (localStorage.getItem('sidebarWidth'))
        {
            setSidebarWidth(localStorage.getItem('sidebarWidth'));
        }

        var domSidebarGrip = $('#sidebar').find('.grip');
        var mouseX = 0;

        var mouseMoveHandler = function(event)
        {
            var width = $(window).width() - event.pageX + mouseX;
            setSidebarWidth(width);
        };

        var mouseUpHandler = function()
        {
            $(document).off("mousemove", mouseMoveHandler);
            $(document).off("mouseup", mouseUpHandler);
            $('#sidebar').removeClass('dragging');
        };

        $(domSidebarGrip).mousedown(function(event)
        {
            // Clear selection so browser doesn't try to drag selected items
            // Copied from: http://stackoverflow.com/a/3169849/1765330
            if (window.getSelection)
            {
                if (window.getSelection().empty)
                { // Chrome
                    window.getSelection().empty();
                }
                else if (window.getSelection().removeAllRanges)
                { // Firefox
                    window.getSelection().removeAllRanges();
                }
            }
            else if (document.selection)
            { // IE?
                document.selection.empty();
            }

            var parentOffset = $(this).offset();
            mouseX = (event.pageX - parentOffset.left) / 2;
            $(document).on("mousemove", mouseMoveHandler);
            $(document).on("mouseup", mouseUpHandler);
            $('#sidebar').addClass('dragging');
        });

        $(domSidebarGrip).dblclick(function()
        {
            collapseSidebar();
        });
    }

    function setSidebarWidth(width)
    {
        var minWidth = 100;
        var maxWidth = $(window).width() / 3;
        if (maxWidth < 475) maxWidth = 475;
        var w = Math.min(Math.max(width, minWidth), maxWidth);
        $('#sidebar').css('width', w + 'px');
        localStorage.setItem('sidebarWidth', w);
        localStorage.setItem('sidebarCollapsed', false);
    }

    function collapseSidebar(set)
    {
        set = set || false; // Dont toggle, just collapse
        if (set || localStorage.getItem('sidebarCollapsed') === "false")
        {
            $('#sidebar').css('width', $('#sidebar').css('min-width'));
            localStorage.setItem('sidebarCollapsed', 'true');
        }
        else if (localStorage.getItem('sidebarCollapsed') === "true")
        {
            setSidebarWidth(1000);
            localStorage.setItem('sidebarCollapsed', 'false');
        }
    }

    function createEmptyTree(id, leftPos, topPos)
    {
        if (!id)
        {
            id = "dialogue" + Main.maxTreeNumber;
            Main.maxTreeNumber++;
            SaveIndicator.setSavedChanges(false);
        }

        var treeDiv = $('<div>', { class: "treeDiv noSelect" });

        var isClickAction = false;
        treeDiv.on("click", function(e)
        {
            if (e.target == this && isClickAction)
            {
                $("#main").focus();
                selectElement(null);
            }
            isClickAction = false;
        });

        treeDiv.on("mousedown", function()
        {
            isClickAction = true;
        });

        treeDiv.selectable(
        {
            distance: 5,
            filter: ".w", // Only select the nodes.
            appendTo: treeDiv,
            start: function()
            {
                isSelecting = true;
            },
            stop: function()
            {
                isSelecting = false;
                isClickAction = false;
            }
        });
        treeDiv.selectable('disable'); // Box selection only useful in zoomed state
        treeDiv.attachDragger();

        var defaultName = i18next.t('main:default_subject');
        var changeNameInput = $('<input type="text" class="subjectNameInput">');
        changeNameInput.val(defaultName);
        changeNameInput.hide();
        changeNameInput.on('focusout', function(e, cancel)
        {
            var subDiv = $("#" + id);
            var subjectName = subDiv.find('.subjectName').show();
            var input = subDiv.find('.subjectNameInput').hide();

            if (cancel)
            {
                subjectName.text(Main.trees[id].subject);
                input.text(Main.trees[id].subject);
                input.val(Main.trees[id].subject);
            }
            // Save subject on defocus of textbox
            else if (Main.trees[id].subject !== input.val())
            {
                Main.trees[id].subject = input.val();
                subjectName.text(Main.trees[id].subject);
                SaveIndicator.setSavedChanges(false);
            }

            updateSideBar();
        });
        changeNameInput.on('keydown', function(e)
        {
            if (e.keyCode === 13) // Enter
            {
                changeNameInput.trigger('focusout', [false]);
                $("#main").focus();
            }
            if (e.keyCode === 27) // Escape
            {
                changeNameInput.trigger('focusout', [true]);
                $("#main").focus();
            }
        });

        var zoomTreeButton = $('<div>', { html: Utils.sIcon('icon-plus'), class: "zoomTreeButton button" });
        zoomTreeButton.on("click", function()
        {
            if (!DragBox.dragging())
            {
                // Open/close tree
                Main.trees[id].subject = changeNameInput.val();
                $("#" + id).find('.subjectName').text(Main.trees[id].subject);
                Zoom.toggleZoom(Main.trees[id]);
                MiniMap.update(true);
            }
        });

        var subjectContainer = $('<div>', { class: "subjectTextContainer" });
        var subjTextSpan = $('<span>', { text: defaultName, class: "subjectName" });

        subjectContainer.append(subjTextSpan);
        subjectContainer.append(changeNameInput);

        var iconDiv = $('<div>', { class: "icons" });

        var subjectDiv = $('<div>', { class: "subjectDiv noSelect" });
        subjectDiv.prepend(zoomTreeButton);

        subjectDiv.append(subjectContainer);
        subjectDiv.append(iconDiv);

        subjectDiv.on("click", function(e)
        {
            e.stopPropagation();
            if (!$.contains($("#main")[0], document.activeElement)) $("#main").focus();
            if (invalidateTreeClick)
            {
                invalidateTreeClick = false;
                return;
            }
            if (Main.selectedElement === id) return;
            if (e.ctrlKey || e.metaKey)
            {
                KeyControl.ctrlClickOnElement(id);
            }
            else
            {
                selectTree(id);
            }
        });

        subjectDiv.on("dblclick", function(e)
        {
            if ($(e.target).hasClass("zoomTreeButton")) return;
            var selectAllInput = false;
            triggerSubjectNameInput(id, selectAllInput);
            e.stopPropagation();
        });

        var dragDiv = $('<div>', { class: "w treeContainer gridded selectable", id: id });
        dragDiv.append(subjectDiv);
        dragDiv.append(treeDiv);

        $("#main").append(dragDiv);

        Utils.cssPosition(dragDiv, {
            "left": Main.gridX * leftPos,
            "top": Main.gridY * topPos
        });

        Main.trees[id] = {
            dragDiv: dragDiv,
            div: treeDiv,
            id: id,
            subject: defaultName,
            optional: false,
            // Necessary to return to the right spot after zooming out
            // leftPos and topPos are in grid coordinates (if leftPos == 2 screen pos == 2*gridX)
            leftPos: leftPos,
            topPos: topPos,
            // Necessary to zoom in to the spot on the graph where last zoomed out
            leftScroll: 0,
            topScroll: 0,
            comment: "",
            nodes: [],
            // The keys for this object are the connection IDs
            selectedConnections: {},
            plumbInstance: PlumbGenerator.genJsPlumbInstance(treeDiv)
        };

        var minimumPosition = null;
        jsPlumb.draggable(dragDiv,
        {
            filter: ".zoomTreeButton, .zoomTreeButton *",

            // The constrain function returns the array with coordinates that will be assigned to the dragged element
            constrain: function(currentCoordinates, el)
            {
                var treeMinimumCoordinates = minimumCoordinatesByTree[$(el).attr('id')];
                return [
                    Math.max(treeMinimumCoordinates[0], currentCoordinates[0]),
                    Math.max(treeMinimumCoordinates[1], currentCoordinates[1])
                ];
            },

            start: function()
            {
                if (firstDragTreeID === null)
                {
                    firstDragTreeID = id;
                }
                else
                {
                    return;
                }

                invalidateTreeClick = true;

                if (Main.selectedElement === null)
                {
                    if (Main.selectedElements.indexOf(id) === -1)
                    {
                        selectElement(id);
                    }
                }
                else
                {
                    if (Main.selectedElement !== id)
                    {
                        selectElement(id);
                    }
                }

                minimumPosition = { "top": Infinity, "left": Infinity };
                Main.selectedElements.forEach(function(selectedElementID)
                {
                    var tree = Main.trees[selectedElementID];
                    if (tree.topPos < minimumPosition.top) minimumPosition.top = tree.topPos;
                    if (tree.leftPos < minimumPosition.left) minimumPosition.left = tree.leftPos;
                });
                minimumCoordinatesByTree = {};
                Main.selectedElements.forEach(function(selectedElementID)
                {
                    var tree = Main.trees[selectedElementID];
                    minimumCoordinatesByTree[selectedElementID] =
                    [
                        (tree.leftPos - minimumPosition.left) * Main.gridX,
                        (tree.topPos - minimumPosition.top) * Main.gridY
                    ];
                });
            },

            stop: function()
            {
                var indicatorPos = getGridIndicatorPosition();
                var thisTree = Main.trees[id];
                var delta =
                {
                    "top": Math.max(-minimumPosition.top, indicatorPos.top - thisTree.topPos),
                    "left": Math.max(-minimumPosition.left, indicatorPos.left - thisTree.leftPos)
                };

                var shouldMove = !(delta.left === 0 && delta.top === 0) &&
                    // Make sure no trees can be dragged on top of each other
                    Main.selectedElements.every(function(selectedElementID)
                    {
                        var tree = Main.trees[selectedElementID];
                        return checkGridAvailable(tree.leftPos + delta.left, tree.topPos + delta.top, minimumCoordinatesByTree);
                    });

                if (shouldMove)
                {
                    SaveIndicator.setSavedChanges(false);
                    MiniMap.update(true);
                }

                Main.selectedElements.forEach(function(selectedElementID)
                {
                    var tree = Main.trees[selectedElementID];
                    if (shouldMove)
                    {
                        tree.topPos = tree.topPos + delta.top;
                        tree.leftPos = tree.leftPos + delta.left;
                    }
                    Utils.cssPosition(tree.dragDiv,
                    {
                        "top": tree.topPos * Main.gridY,
                        "left": tree.leftPos * Main.gridX
                    });
                });

                firstDragTreeID = null;
                minimumPosition = null;
                minimumCoordinatesByTree = {};
            }
        }); // We cannot use the built in grid functionality because it doesnt allow to drag "outside" the graph area to expand it

        // Attach minimap scroll event listener to treeDiv
        MiniMap.attachScrollListener(treeDiv);

        return Main.trees[id];
    }

    function addNewTree(shouldSelectAndStartEditing)
    {
        Zoom.zoomOut();

        var indicatorPos = getGridIndicatorPosition();
        if (!checkGridAvailable(indicatorPos.left, indicatorPos.top)) return null;

        var tree = createEmptyTree(null, indicatorPos.left, indicatorPos.top);

        if (shouldSelectAndStartEditing)
        {
            selectTree(tree.id);
            triggerSubjectNameInput(tree.id, true);
        }

        return tree;
    }

    // Creates a new node and places it on the specified position, which is relative to the parent
    function addNewNode(type, text, position, shouldSelectAndStartEditing)
    {
        selectElement(null);

        // Create a node of the right type
        var tree = Zoom.getZoomed();

        if (tree === null)
        {
            return null;
        }

        var node = createAndReturnNode(type, null, tree.div, tree.id);

        var id = node.attr('id');

        var characterIdRef;
        if (type === Main.computerType)
        {
            if (Config.container.characters.sequence.length > 1)
            {
                characterIdRef = $("#characterSelection option:selected").val();
            }
            else
            {
                characterIdRef = Config.container.characters.sequence[0].id;
            }
        }

        var parameterEffects = Config.getNewDefaultParameterEffects(characterIdRef);

        if (Parameters.timeId && type === Main.playerType)
        {
            var timeEffect =
            {
                idRef: 't',
                operator: "addAssign",
                value: 1
            };
            parameterEffects.userDefined.push(timeEffect);
        }

        var acceptableScopes = ['per', 'per-' + type];
        if (type === Main.computerType) acceptableScopes.push('per-computer-own');

        Main.nodes[id] = {
            text: text !== undefined ? text : Config.container.settings.statement.type.defaultValue,
            type: type,
            parameterEffects: parameterEffects,
            preconditions: null,
            propertyValues: Config.getNewDefaultPropertyValues(acceptableScopes, characterIdRef),
            comment: "",
            endNode: false,
            allowDialogueEndNode: false,
            allowInterleaveNode: false,
            id: id,
            parent: tree.id
        };

        if (type === Main.computerType) Main.nodes[id].characterIdRef = characterIdRef;

        if (position)
        {
            Utils.cssPosition(node, position);
        }

        if (shouldSelectAndStartEditing)
        {
            selectElement(id);
            startEditingNode(id);
        }
        else
        {
            changeNodeText(id);
        }

        return Main.nodes[id];
    }

    function createChildNode(parentNodeID)
    {
        if (parentNodeID in Main.nodes)
        {
            var parent = Main.nodes[parentNodeID];

            var parentDiv = $('#' + parentNodeID);
            var parentPosition = Utils.cssPosition(parentDiv);
            var position =
            {
                top: parentPosition.top + parentDiv.height() + 55,
                left: parentPosition.left
            };
            var node;
            var firstChildNodeId = getFirstChildIdOrNull(parentNodeID);
            if (firstChildNodeId)
            {
                node = addNewNode(Main.nodes[firstChildNodeId].type, "", position, true);
            }
            else
            {
                switch (parent.type)
                {
                    case Main.playerType:
                        node = addNewNode(Main.computerType, "", position, true);
                        break;
                    case Main.computerType:
                        node = addNewNode(Main.playerType, "", position, true);
                        break;
                    case Main.situationType:
                        node = addNewNode(Main.playerType, "", position, true);
                        break;
                }
            }

            // If there are errors (cycles, invalid pairs, existing connections)
            // regarding the connection to be created, delete the new node and cancel.
            var connection = makeConnection(parent.id, node.id, Zoom.getZoomed().plumbInstance);

            if (!connection)
            {
                deleteNode(node.id);
                return;
            }

            return node;
        }
        else
        {
            return null;
        }
    }

    // Creates a node, adds it to the html and returns the html of the node.
    // This function is used extensively when loading a scenario with a large amount of nodes.
    // For optimal performance the use of jQuery to create DOM elements should be minimized.
    function createAndReturnNode(type, id, parent, parentID)
    {
        if (id === null)
        {
            Main.jsPlumbCounter++;
            id = "edit_" + Main.jsPlumbCounter;
            SaveIndicator.setSavedChanges(false);
        }

        Main.trees[parentID].nodes.push(id);
        var plumbInstance = Main.trees[parentID].plumbInstance;

        // Add the node to the html.
        var node = document.createElement('div');
        node.setAttribute('id', id);
        node.classList.add('w');
        node.classList.add(type);

        var endpoint = document.createElement('div');
        endpoint.classList.add('ep');
        var endpointAnchor = document.createElement('div');
        endpointAnchor.classList.add('anchor');
        endpoint.appendChild(endpointAnchor);
        node.appendChild(endpoint);

        var nodeContent = document.createElement('div');
        nodeContent.classList.add("nodeContent");

        var inputDiv = $('<div>', { class: "statementInput" });
        inputDiv.hide();
        nodeContent.appendChild(inputDiv[0]);

        var textDiv = document.createElement('div');
        textDiv.classList.add('statementText');
        nodeContent.appendChild(textDiv);

        var imgDiv = document.createElement('div');
        imgDiv.classList.add('imgDiv');
        nodeContent.appendChild(imgDiv);

        // Expands node container using overflow when moving a node closer to the bounds of the container
        var scrollOffset = 50;
        var expander = document.createElement('div');
        expander.classList.add('expander');
        expander.style.right = -(scrollOffset - 1) + "px";
        expander.style.bottom = -(scrollOffset - 1) + "px";
        nodeContent.appendChild(expander);

        node.appendChild(nodeContent);

        node.addEventListener('dblclick', function()
        {
            startEditingNode(id);
        }, false);

        endpoint.addEventListener('mousemove', function(e)
        {
            $(this).find('.anchor').css(
            {
                left: e.pageX - node.getBoundingClientRect().left + 7.5,
                top: e.pageY - node.getBoundingClientRect().top + 7.5
            });
        }, false);

        endpoint.addEventListener('mouseleave', function()
        {
            $(this).find('.anchor').css({ left: "", top: "" });
        }, false);

        var previousMousePosition;
        // Initialise draggable elements.
        plumbInstance.draggable(node,
        {
            constrain: function(currentCoordinates)
            {
                return [Math.max(0, currentCoordinates[0]), Math.max(0, currentCoordinates[1])];
            },

            start: function()
            {
                if (firstDragNodeID === null) firstDragNodeID = id;

                previousMousePosition = $.extend({}, Main.mousePosition);

                invalidateNodeClick = true;

                SaveIndicator.setSavedChanges(false);

                if (Main.selectedElement === null)
                {
                    if (Main.selectedElements.indexOf(id) === -1)
                    {
                        selectElement(id);
                    }
                }
                else
                {
                    if (Main.selectedElement !== id)
                    {
                        selectElement(id);
                    }
                }
            },

            drag: function(params)
            {
                if (id !== firstDragNodeID) return;

                var direction = { x: Main.mousePosition.x - previousMousePosition.x, y: Main.mousePosition.y - previousMousePosition.y };

                // TODO: delete if jsPlumb katavorio supports scrolling into view
                var x = params.pos[0];
                var y = params.pos[1];
                var container = parent[0];
                if (direction.x >= 0 && x + scrollOffset + node.offsetWidth > container.clientWidth + container.scrollLeft)
                {
                    container.scrollLeft = x + scrollOffset + node.offsetWidth - container.clientWidth;
                }
                else if (direction.x <= 0 && x - scrollOffset < container.scrollLeft)
                {
                    container.scrollLeft = Math.max(x - scrollOffset, 0);
                }
                if (direction.y >= 0 && y + scrollOffset + node.offsetHeight > container.clientHeight + container.scrollTop)
                {
                    container.scrollTop = y + scrollOffset + node.offsetHeight - container.clientHeight;
                }
                else if (direction.y <= 0 && y - scrollOffset < container.scrollTop)
                {
                    container.scrollTop = Math.max(y - scrollOffset, 0);
                }

                previousMousePosition.x = Main.mousePosition.x;
                previousMousePosition.y = Main.mousePosition.y;
            },

            stop: function()
            {
                firstDragNodeID = null;
            }

            // We do not set invalidateNodeClick in a stop handler since it fires before the click handler
        });

        // Make each ".ep" div a source
        plumbInstance.makeSource(node,
        {
            filter: ".ep",
            connectionType: "basic"
        });

        // Initialise all '.w' elements as connection targets.
        plumbInstance.makeTarget(node);

        // Make the node selected when we click on it.
        node.addEventListener("click", function(event)
        {
            event.stopPropagation();
            if (!$.contains($("#main")[0], document.activeElement)) $("#main").focus();
            if (invalidateNodeClick)
            {
                invalidateNodeClick = false;
                return;
            }
            if (Main.selectedElement === id) return;
            if (event.ctrlKey || event.metaKey)
            {
                KeyControl.ctrlClickOnElement(id);
            }
            else
            {
                selectElement(id);
            }
        }, false);

        parent[0].appendChild(node);

        return $(node);
    }

    function startEditingNode(nodeID)
    {
        var node = Main.nodes[nodeID];
        if (node.editing) return;

        var nodeDiv = $('#' + node.id);
        var inputDiv = nodeDiv.find('.statementInput');
        var textDiv = nodeDiv.find('.statementText');

        nodeDiv.off('dblclick');
        nodeDiv.addClass("editing");
        node.editing = true;

        var text = node.text ? node.text : "";

        textDiv.hide();
        inputDiv.show();

        var txtArea = $('<textarea>',
        {
            class: "nodestatement",
            maxlength: Config.container.settings.statement.type.maxLength,
            text: text
        });

        // Because textareas apparently don't act normally:
        // Manual deselect for txtArea
        txtArea.on("mousedown", function(event)
        {
            if (this.selectionStart !== this.selectionEnd)
            {
                this.selectionStart = this.selectionEnd = -1;
            }
            event.stopPropagation();
        });

        txtArea.on('focusout', function()
        {
            stopEditingNode(node.id, false);
        });

        txtArea.on('keydown', function(e)
        {
            if ((e.ctrlKey || e.metaKey) && e.keyCode === 13) // Enter
            {
                stopEditingNode(node.id, false);
                e.stopPropagation();
                $("#main").focus();
            }
            if (e.keyCode === 27) // Escape
            {
                stopEditingNode(node.id, true);
                e.stopPropagation();
                $("#main").focus();
            }
        });

        inputDiv.prepend(txtArea);
        if (Config.container.settings.statement.type.markdown)
        {
            // Detaches the previous markdown tooltip if it exists
            Utils.detachMarkdownTooltip(txtArea);
            Utils.attachMarkdownTooltip(txtArea);
        }

        // Calculate relative width
        var width = Math.sqrt(text.length);
        nodeDiv.width(width + "em");
        // Make room for typing text in the node
        nodeDiv.height(inputDiv.height() + 35);
        if (nodeDiv.width() < 128) nodeDiv.width(128);
        // Don't show overflow ellipsis while editing
        nodeDiv.removeClass("long");

        inputDiv.height("100%");

        getPlumbInstanceByNodeID(node.id).revalidate(node.id);

        txtArea.focus();
    }

    function stopEditingNode(nodeID, cancel)
    {
        var node = Main.nodes[nodeID];
        if (!node.editing) return;

        var nodeDiv = $('#' + node.id);
        var inputDiv = nodeDiv.find('.statementInput');
        var textDiv = nodeDiv.find('.statementText');
        var textArea = nodeDiv.find('.nodestatement');

        var text = textArea.val();
        textArea.remove();
        inputDiv.hide();
        textDiv.show();

        if (!cancel) node.text = text;
        changeNodeText(node.id);

        nodeDiv.on('dblclick', function()
        {
            startEditingNode(node.id);
        });
        nodeDiv.removeClass("editing");
        delete node.editing;
    }

    function getPlumbInstanceByNodeID(nodeID)
    {
        return Main.trees[Main.nodes[nodeID].parent].plumbInstance;
    }

    function getStartNodeIDs(tree)
    {
        return getNodesWithoutParents(tree);
    }

    function getNodesWithoutParents(tree)
    {
        var orphanNodes = [];
        $.each(tree.nodes, function(index, nodeID)
        {
            var connections = tree.plumbInstance.getConnections(
            {
                target: nodeID
            });
            if (connections.length === 0) orphanNodes.push(nodeID);
        });
        return orphanNodes;
    }

    function getInterleaves()
    {
        var sortedTrees = Object.keys(Main.trees)
            .map(function(treeID) { return Main.trees[treeID]; })
            .sort(function(a, b)
            {
                return (a.topPos - b.topPos) || (a.leftPos - b.leftPos);
            });

        if (sortedTrees.length === 0) return [];

        var interleaves = [];
        var currentInterleave = [sortedTrees.shift()];
        var currentTopPos = currentInterleave[0].topPos;
        sortedTrees.forEach(function(tree)
        {
            if (tree.topPos !== currentTopPos)
            {
                interleaves.push(currentInterleave);
                currentInterleave = [];
                currentTopPos = tree.topPos;
            }
            currentInterleave.push(tree);
        });
        interleaves.push(currentInterleave);
        return interleaves;
    }

    function triggerSubjectNameInput(id, selectAllInput)
    {
        // Hide subject name span and show textbox
        var subDiv = $("#" + id);
        subDiv.find('.subjectName').hide();

        var input = subDiv.find('.subjectNameInput');
        input.show();
        input.focus();
        if (selectAllInput) input.select();
    }

    function deleteAllSelected()
    {
        var zoomedTree;
        // If there are node or tree elements selected
        if (Main.selectedElements.length > 0)
        {
            var jsPlumbInstance = jsPlumb;
            if (!(Main.selectedElements[0] in Main.trees))
            {
                jsPlumbInstance = getPlumbInstanceByNodeID(Main.selectedElements[0]);
            }

            jsPlumbInstance.batch(function()
            {
                for (var i = 0; i < Main.selectedElements.length; i++)
                {
                    deleteElement(Main.selectedElements[i]);
                }
                if (Main.selectedElement !== null)
                {
                    deleteElement(Main.selectedElement);
                }
            });

            Main.selectedElements = [];
        }
        // If there is a tree zoomed and if there are selected connections, delete them
        else if (Zoom.isZoomed())
        {
            zoomedTree = Zoom.getZoomed();
            zoomedTree.plumbInstance.batch(function()
            {
                for (var connectionId in zoomedTree.selectedConnections)
                {
                    var cs = zoomedTree.plumbInstance.getConnections(
                    {
                        source: zoomedTree.selectedConnections[connectionId].source,
                        target: zoomedTree.selectedConnections[connectionId].target
                    });

                    if (cs.length > 0)
                    {
                        // Pick the first element in the array, because connections are unique and delete it
                        zoomedTree.plumbInstance.deleteConnection(cs[0]);
                    }

                    delete zoomedTree.selectedConnections[connectionId];
                }
            });
        }

        MiniMap.update(true);
    }

    function selectElements(elementIds)
    {
        if (elementIds.length === 1)
        {
            selectElement(elementIds[0]);
        }
        else
        {
            selectElement(null);
            Main.selectedElements = elementIds.slice();
            elementIds.forEach(function(elementId)
            {
                $("#" + elementId).addClass("ui-selected");
                var plumbInstance = elementId in Main.nodes ? Main.getPlumbInstanceByNodeID(elementId) : jsPlumb;
                plumbInstance.addToDragSelection(elementId);
            });
            var highlightAncestors = $("#highlightAncestors").hasClass("enabled");
            var highlightDescendants = $("#highlightDescendants").hasClass("enabled");
            if (highlightAncestors || highlightDescendants)
            {
                elementIds.forEach(function(elementId)
                {
                    if (!(elementId in Main.nodes)) return;
                    if (highlightAncestors)
                    {
                        highlightLinealRelativesIncludingDirect(elementId, Main.ancestorHighlightSettings);
                    }
                    if (highlightDescendants)
                    {
                        highlightLinealRelativesIncludingDirect(elementId, Main.descendantHighlightSettings);
                    }
                });
            }
        }
    }

    function selectElement(elementId)
    {
        if (elementId in Main.trees)
        {
            selectTree(elementId);
        }
        else if (elementId in Main.nodes || elementId === null)
        {
            selectNode(elementId);
        }

        // If anything is selected here then we need to deselect all the connections
        if (Zoom.isZoomed())
        {
            var zoomedTree = Zoom.getZoomed();
            for (var connectionId in zoomedTree.selectedConnections)
            {
                deselectConnection(zoomedTree.plumbInstance, zoomedTree.selectedConnections, connectionId);
            }
        }
    }

    // Select a node.
    function selectNode(nodeID)
    {
        // Before we change the node, we first apply the changes that may have been made.
        if (Main.selectedElement !== null)
        {
            applyChanges();
        }

        // Currently selected node(s) should now not be selected.
        $(".selected").removeClass("selected");
        $(".ui-selected").removeClass("ui-selected");
        Main.selectedElements = [];
        var zoomedTree = Zoom.getZoomed();
        var plumbInstance = zoomedTree ? zoomedTree.plumbInstance : jsPlumb;
        plumbInstance.clearDragSelection();
        dehighlightLinealRelativesIncludingDirect(Main.ancestorHighlightSettings);
        dehighlightLinealRelativesIncludingDirect(Main.descendantHighlightSettings);

        if (nodeID !== null && !(nodeID in Main.nodes))
        {
            // The node does not exist (anymore)
            return;
        }

        // Change the selected node.
        Main.selectedElement = nodeID;

        // Only make a node selected if it isn't null.
        if (Main.selectedElement !== null)
        {
            $("#" + Main.selectedElement).addClass("selected");
            Main.selectedElements.push(Main.selectedElement);
            $("#" + nodeID).addClass("ui-selected");
            if ($("#highlightAncestors").hasClass("enabled"))
            {
                highlightLinealRelativesIncludingDirect(nodeID, Main.ancestorHighlightSettings);
            }
            if ($("#highlightDescendants").hasClass("enabled"))
            {
                highlightLinealRelativesIncludingDirect(nodeID, Main.descendantHighlightSettings);
            }
        }

        // Update the side bar, so it displays the selected node.
        updateSideBar();
        updateButtons();
    }

    function deselectConnection(plumbInstance, selectedConnections, connectionId)
    {
        var cs = plumbInstance.getConnections(
        {
            source: selectedConnections[connectionId].source,
            target: selectedConnections[connectionId].target
        });

        // Connection could just have been removed so we need to check if it still exists
        if (cs.length > 0)
        {
            var paintStyle = PlumbGenerator.defaultPaintStyle;
            var colorValue = cs[0].getParameter("color");
            if (colorValue && ColorPicker.areColorsEnabled())
            {
                paintStyle = $.extend({}, paintStyle, { stroke: colorValue, outlineStroke: "transparent" });
            }
            cs[0].setPaintStyle(paintStyle);
        }

        delete selectedConnections[connectionId];
    }

    function updateButtons()
    {
        var subjectButtons = document.getElementsByClassName("subjectButton");
        var nodeButtons = document.getElementsByClassName("nodeButton");

        hideButtons(subjectButtons);
        hideButtons(nodeButtons);

        if (Zoom.isZoomed())
        {
            showButtons(subjectButtons);

            if (Main.selectedElement !== null)
            {
                // A node is selected, because a tree is zoomed
                showButtons(nodeButtons);
            }
        }
    }
    function hideButtons(buttons)
    {
        for (var i = 0, len = buttons.length; i < len; i++)
        {
            buttons[i].disabled = true;
        }
    }
    function showButtons(buttons)
    {
        for (var i = 0, len = buttons.length; i < len; i++)
        {
            buttons[i].disabled = false;
        }
    }

    function applyChanges()
    {
        if (Main.selectedElement in Main.trees) applyTreeChanges();
        else applyNodeChanges();
    }

    // Apply the changes that have been made to the node.
    function applyNodeChanges()
    {
        if (Main.selectedElement === null) return; // No node selected, so do nothing.

        SaveIndicator.setSavedChanges(false);

        // Get the selected node.
        var node = Main.nodes[Main.selectedElement];
        node.parameterEffects = Config.getNewDefaultParameterEffects(node.characterIdRef);

        // Save user-defined parameter effects.
        $("#userDefinedParameterEffects").children().each(function()
        {
            var idRef = $(this).find(".parameter-idref-select").find("option:selected").val();
            node.parameterEffects.userDefined.push(
            {
                idRef: idRef,
                operator: $(this).find(".parameter-effect-operator-select").find("option:selected").val(),
                value: Parameters.container.byId[idRef].type.getFromDOM($(this).find(".parameter-effect-value-container"))
            });
        });

        // Save fixed parameter effects.
        var getFixedParameterEffectFromDOMAndSetInNode = function(effectContainer, parameterDefinitions, fixedParameterEffects, classPrefix)
        {
            var parameterIdRef = $(effectContainer).find('.' + $.escapeSelector(classPrefix) + '-effect-idref-select').val();
            var controlContainer = $(effectContainer).find('.' + $.escapeSelector(classPrefix) + '-effect-control-container');
            var parameterValue = parameterDefinitions[parameterIdRef].type.getFromDOM(controlContainer);
            var parameterOperator = $(effectContainer).find('.' + $.escapeSelector(classPrefix) + '-effect-operator-select').val();
            var parameterEffect = {
                idRef: parameterIdRef,
                operator: parameterOperator,
                value: parameterValue
            };

            if (parameterEffect.idRef in fixedParameterEffects.byId)
            {
                fixedParameterEffects.sequence.push(parameterEffect);
                fixedParameterEffects.byId[parameterEffect.idRef].push(parameterEffect);
            }
        };

        var fixedParameterEffectsEl = $("#fixed-parameter-effects");
        fixedParameterEffectsEl.find('.' + fixedParameterEffectsEl.attr('id') + '-effect-container').each(function()
        {
            getFixedParameterEffectFromDOMAndSetInNode(this, Config.container.parameters.byId, node.parameterEffects.fixed.characterIndependent, fixedParameterEffectsEl.attr('id'));
        });
        var fixedCharacterParameterEffectsEl = $("#fixed-character-parameter-effects");
        var characterId, classCharacterPrefix, parameterDefinitions;
        for (characterId in Config.container.characters.byId)
        {
            classCharacterPrefix = fixedCharacterParameterEffectsEl.attr('id') + '-' + characterId;
            parameterDefinitions = $.extend({}, Config.container.characters.parameters.byId, Config.container.characters.byId[characterId].parameters.byId);
            fixedCharacterParameterEffectsEl.find('.' + $.escapeSelector(classCharacterPrefix) + '-effect-container').each(function()
            {
                getFixedParameterEffectFromDOMAndSetInNode(this, parameterDefinitions, node.parameterEffects.fixed.perCharacter[characterId], classCharacterPrefix);
            });
        }
        if (node.type === Main.computerType)
        {
            var computerOwnParameterEffectsEl = $("#node-computer-own-parameter-effects");
            classCharacterPrefix = computerOwnParameterEffectsEl.attr('id') + '-' + node.characterIdRef;
            parameterDefinitions = $.extend({}, Config.container.characters.parameters.byId, Config.container.characters.byId[node.characterIdRef].parameters.byId);
            computerOwnParameterEffectsEl.find('.' + $.escapeSelector(classCharacterPrefix) + '-effect-container').each(function()
            {
                getFixedParameterEffectFromDOMAndSetInNode(this, parameterDefinitions, node.parameterEffects.fixed.perCharacter[node.characterIdRef], classCharacterPrefix);
            });
        }

        // Save preconditions.
        node.preconditions = Condition.getFromDOM($("#preconditionsDiv"));

        // Save property values.
        var acceptableScopes = ['per', 'per-' + node.type];
        if (node.type === Main.computerType) acceptableScopes.push('per-computer-own');

        var getPropertyFromDOMAndSetInNode = function(property, propertyValues, idPrefix, nodeCharacterIdRef, characterId)
        {
            if (acceptableScopes.indexOf(property.scopes.statementScope) === -1) return;
            if (property.scopes.statementScope === 'per-computer-own' && (!characterId || characterId !== nodeCharacterIdRef)) return;
            propertyValues[property.id] = property.type.getFromDOM($('#' + $.escapeSelector(idPrefix) + "-container-" + $.escapeSelector(property.id)));

            if (property.type.autoComplete && property.autoCompleteList.indexOf(propertyValues[property.id]) === -1)
            {
                property.autoCompleteList.push(propertyValues[property.id]);
            }
        };

        var propertyId, property;
        for (propertyId in Config.container.properties.byId)
        {
            getPropertyFromDOMAndSetInNode(Config.container.properties.byId[propertyId], node.propertyValues.characterIndependent, "node-property-values");
        }
        for (propertyId in Config.container.characters.properties.byId)
        {
            for (characterId in Config.container.characters.byId)
            {
                property = Config.container.characters.properties.byId[propertyId];
                getPropertyFromDOMAndSetInNode(property, node.propertyValues.perCharacter[characterId], "node-character-property-values-" + characterId, node.characterIdRef, characterId);
            }
        }
        for (characterId in Config.container.characters.byId)
        {
            for (propertyId in Config.container.characters.byId[characterId].properties.byId)
            {
                property = Config.container.characters.byId[characterId].properties.byId[propertyId];
                getPropertyFromDOMAndSetInNode(property, node.propertyValues.perCharacter[characterId], "node-character-property-values-" + characterId, node.characterIdRef, characterId);
            }
        }

        // Save endNode.
        node.endNode = $("#endNodeCheckbox").prop("checked");

        // Save allowDialogueEndNode.
        node.allowDialogueEndNode = $("#allowDialogueEndNodeCheckbox").prop("checked");

        // Save allowInterleaveNode.
        node.allowInterleaveNode = $("#allowInterleaveNodeCheckbox").prop("checked");

        // Save comment.
        node.comment = $("textarea#comment").val();

        // Ensure the node is not being edited.
        stopEditingNode(node.id, false);

        // Change the text of the node.
        changeNodeText(Main.selectedElement);
    }

    function highlightLinealRelativesIncludingDirect(nearNodeID, settings)
    {
        var options = {};
        options[settings.nearKeyword] = nearNodeID;
        var connections = Main.getPlumbInstanceByNodeID(nearNodeID).getConnections(options);

        connections.forEach(function(connection)
        {
            var farNodeID = connection[settings.farIDKeyword];
            $("#" + farNodeID).addClass([settings.generalClass, settings.directClass]);
            highlightLinealRelatives(farNodeID, settings);
        });
    }

    function highlightLinealRelatives(nearNodeID, settings)
    {
        var options = {};
        options[settings.nearKeyword] = nearNodeID;
        var connections = Main.getPlumbInstanceByNodeID(nearNodeID).getConnections(options);

        connections.forEach(function(connection)
        {
            var farNodeID = connection[settings.farIDKeyword];
            var farNodeDiv = $("#" + farNodeID);
            if (!farNodeDiv.hasClass(settings.generalClass))
            {
                farNodeDiv.addClass(settings.generalClass);
                highlightLinealRelatives(farNodeID, settings);
            }
        });
    }

    function dehighlightLinealRelativesIncludingDirect(settings)
    {
        $("." + settings.generalClass).removeClass(settings.generalClass);
        $("." + settings.directClass).removeClass(settings.directClass);
    }

    // Determines grid size from the relevant CSS rules.
    // The units are assumed to be pixels!
    function initialiseGrid()
    {
        for (var iStyleSheet = 0; iStyleSheet < document.styleSheets.length; iStyleSheet++)
        {
            var styleSheet = document.styleSheets[iStyleSheet];
            for (var iCSSRule = 0; iCSSRule < styleSheet.cssRules.length; iCSSRule++)
            {
                var cssRule = styleSheet.cssRules[iCSSRule];
                if (cssRule.selectorText == '.gridded')
                {
                    Main.gridX = Utils.parseDecimalIntWithDefault(cssRule.style.width);
                    Main.gridY = Utils.parseDecimalIntWithDefault(cssRule.style.height);
                    return;
                }
            }
        }
    }

    function checkGridAvailable(gridX, gridY, ignore)
    {
        var available = true;

        $.each(Main.trees, function(id, tree)
        {
            if (ignore && id in ignore) return true;
            available = available && !(tree.leftPos === gridX && tree.topPos === gridY);
        });

        return available;
    }

    function getGridIndicatorPosition()
    {
        var position = Utils.cssPosition($("#gridIndicator"));
        return {
            "left": pixelPositionToGridPosition(position.left, Main.gridX),
            "top": pixelPositionToGridPosition(position.top, Main.gridY)
        };
    }

    function pixelPositionToGridPosition(pixelPos, gridSize)
    {
        // The grid positions refer to the upper left corners of the cells, we want to find
        // not the closest upper left corner but the cell that contains the position
        return Math.floor(pixelPos / gridSize);
    }

    function selectTree(id)
    {
        if (!(id in Main.trees)) return;

        if (Main.selectedElement !== null)
        {
            applyChanges();
        }

        if (Zoom.isZoomed(id))
        {
            // Cancel selection if the tree is zoomed to prevent accidental deletion and duplication of trees.
            selectElement(null);
            return;
        }
        var clone = $("#clone");
        if (clone.length !== 0)
        { // Jsplumb creates clones when nodes are being dragged. if one exists this event is on drop of a node and should not fire
            return;
        }

        $(".selected").removeClass("selected");
        $(".ui-selected").removeClass("ui-selected");
        Main.selectedElements = [];
        var zoomedTree = Zoom.getZoomed();
        var plumbInstance = zoomedTree ? zoomedTree.plumbInstance : jsPlumb;
        plumbInstance.clearDragSelection();

        var dragDiv = Main.trees[id].dragDiv;

        dragDiv.addClass("selected");
        Main.selectedElement = id;

        dragDiv.addClass("ui-selected");
        Main.selectedElements.push(Main.selectedElement);

        updateSideBar();

        $("#main").focus();
    }

    // Change the text of the node.
    function changeNodeText(nodeID)
    {
        var node = Main.nodes[nodeID];

        var text = "";
        var longestWord = "";
        switch (node.type)
        {
            case Main.computerType:
                // For computerType node: just input text
                // with characterId prefix when there are multiple characters
                if (Config.container.characters.sequence.length > 1)
                {
                    var character = Config.container.characters.byId[node.characterIdRef];
                    var characterPrefix = character.name ? Utils.escapeHTML(character.name) : character.id;
                    text += "<b>" + characterPrefix + ": </b>";
                }
                text += Utils.escapeHTML(node.text);
                break;
            case Main.playerType:
            case Main.situationType:
                // For playerType node: show text input
                text = Utils.escapeHTML(node.text);
                break;
        }
        // Calculate the node width
        if (longestWord === "")
        {
            longestWord = text.split(" ").reduce(function(a, b)
            {
                return a.length > b.length ? a : b;
            });
        }
        var textLength = $(".lengthTest").text(longestWord)[0].clientWidth / 11;
        var width = Math.max(4, textLength * 1.08, Math.sqrt(text.length));

        // Get the node
        var nodeHTML = $('#' + nodeID);
        // Fill div that can hold the images that visualize if the node has certain settings
        var imageDiv = nodeHTML.find('.imgDiv');
        imageDiv.empty();

        var appendNodePropertyImageIfHasValue = function(imgName, propertyValue, showTooltip)
        {
            if (propertyValue)
            {
                // Span wrapping required for relative tooltip position.
                var nodePropertyImage = $('<span>', { html: Utils.sIcon("icon-" + imgName) }).appendTo(imageDiv);
                if (showTooltip)
                {
                    nodePropertyImage.tooltip(
                    {
                        items: "span:hover",
                        content: Utils.escapeHTML(propertyValue),
                        // Taken from: http://stackoverflow.com/a/15014759
                        create: function() { $(this).data("ui-tooltip").liveRegion.remove(); },
                        close: function(event, ui)
                        {
                            ui.tooltip.hover(
                                function()
                                {
                                    $(this).stop(true).fadeIn();
                                },
                                function()
                                {
                                    $(this).fadeOut(function() { $(this).remove(); });
                                }
                            );
                        }
                    });
                }
            }
        };

        appendNodePropertyImageIfHasValue("node-has-preconditions", node.preconditions);
        appendNodePropertyImageIfHasValue("node-has-comments", node.comment, true);

        appendNodePropertyImageIfHasValue("node-has-jump", node.allowInterleaveNode);
        appendNodePropertyImageIfHasValue("node-has-premature-end", node.allowDialogueEndNode);
        appendNodePropertyImageIfHasValue("node-has-end", node.endNode);

        var longNode = text.length > 140;
        if (longNode)
        {
            nodeHTML.addClass("long");
            nodeHTML.width(150 + "px");
        }
        else
        {
            nodeHTML.removeClass("long");
            nodeHTML.width(width + "em");
        }

        var nodeTextDiv = nodeHTML.find('.statementText');
        nodeTextDiv.show();
        nodeTextDiv.html(text);

        // Make sure the text fits inside the node
        var h = Math.max(40, nodeTextDiv[0].clientHeight);
        nodeHTML.height(h);

        // Add classes to the node for a graphical indication
        nodeHTML.toggleClass('allowInterleaveNode', node.allowInterleaveNode);
        nodeHTML.toggleClass('allowDialogueEndNode', node.allowDialogueEndNode);
        nodeHTML.toggleClass("endNode", node.endNode);

        Main.trees[node.parent].plumbInstance.revalidate(node.id);

        ElementList.handleNodeTextChange(node);
    }

    function deleteElement(elementID)
    {
        SaveIndicator.setSavedChanges(false);

        if (elementID in Main.trees) deleteTree(elementID);
        else deleteNode(elementID);
    }

    function deleteTree(treeID)
    {
        Main.trees[treeID].plumbInstance.batch(function()
        {
            Main.trees[treeID].nodes.forEach(function(nodeID)
            {
                deleteNode(nodeID, true);
            });
            Main.trees[treeID].nodes = [];
        }, true);

        if (treeID === Main.selectedElement) selectElement(null);

        Main.trees[treeID].dragDiv.remove();

        delete Main.trees[treeID];
    }

    // Deletes the selected node.
    function deleteNode(nodeID, shouldNotDeleteFromTree)
    {
        if (nodeID === null) return; // No node selected, so do nothing

        // No node should be selected after we remove a node.
        if (nodeID === Main.selectedElement) selectElement(null);

        var node = Main.nodes[nodeID];
        var parentTree = Main.trees[node.parent];

        // ShouldNotDeleteFromTree should only be true when deleting the node from the tree yourself afterwards
        if (!shouldNotDeleteFromTree)
        {
            parentTree.nodes.splice(parentTree.nodes.indexOf(nodeID), 1);
        }

        // Delete the node of our object and remove it from the graph.
        delete Main.nodes[nodeID];
        parentTree.plumbInstance.remove($('#' + nodeID));

        ElementList.handleNodeDeletion(node);
    }

    function applyTreeChanges()
    {
        var hasChanges = !SaveIndicator.getSavedChanges();

        var tree = Main.trees[Main.selectedElement];

        var newTreeOptional = $('#optionalCheckbox').prop('checked');
        hasChanges = hasChanges || tree.optional !== newTreeOptional;
        tree.optional = newTreeOptional;
        $(Main.trees[Main.selectedElement].dragDiv).toggleClass("optional", tree.optional);
        var treeIcons = tree.dragDiv.find('.icons').empty();
        if (tree.optional) treeIcons.html(Utils.sIcon('icon-tree-is-optional'));

        var newTreeComment = $("textarea#comment").val();
        hasChanges = hasChanges || tree.comment !== newTreeComment;
        tree.comment = newTreeComment;

        SaveIndicator.setSavedChanges(!hasChanges);
    }

    // Updates the side bar to show the selected node.
    function updateSideBar()
    {
        // Clear everything in the sidebar.
        $(
            "#preconditionsDiv, #userDefinedParameterEffects, #node-property-values, #node-character-property-values, #node-computer-own-property-values," +
            "#fixed-parameter-effects, #fixed-character-parameter-effects, #node-computer-own-parameter-effects"
        ).children().remove();

        // Don't show properties if no node or tree is selected. Display the minimap
        if (Main.selectedElement === null)
        {
            $("#properties").attr("class", "hidden");

            MiniMap.activate();
        }
        else if (Main.selectedElement in Main.nodes)
        {
            var node = Main.nodes[Main.selectedElement];
            var addedDiv;

            MiniMap.deactivate();

            // Show the correct divs for the type.
            $("#properties").attr("class", node.type);

            // Insert the preconditions in the sidebar
            var preconditionsContainer = $("#preconditionsDiv");
            Condition.appendControlsTo(preconditionsContainer);
            if (node.preconditions) Condition.setInDOM(preconditionsContainer, node.preconditions);

            // Show user-defined parameters
            for (var k = 0; k < node.parameterEffects.userDefined.length; k++)
            {
                var parameter = node.parameterEffects.userDefined[k];

                addedDiv = addEmptyUserDefinedParameterEffect();
                addedDiv.find(".parameter-idref-select").val(parameter.idRef).trigger('change');
                addedDiv.find(".parameter-effect-operator-select").val(parameter.operator);
                Parameters.container.byId[parameter.idRef].type.setInDOM(addedDiv.find(".parameter-effect-value-container"), parameter.value);
            }

            var scopes = ['per', 'per-' + node.type];

            // Show fixed parameters
            // Appends a default effect to the container, which changes dynamically based on the parameter selected
            var appendEffectContainerTo = function(effectsContainer, containerClassPrefix, parameterDefinitions)
            {
                // This element contains the dynamically changing operator and control for possible values
                // It is separate from the rest so that it can be emptied
                var effectSubContainer = $('<span>');

                // Dynamically changes the type of the effect according to the given parameter
                var changeEffectType = function(pId)
                {
                    var operatorSelect = $('<select>', { class: containerClassPrefix + "-effect-operator-select" });
                    parameterDefinitions[pId].type.assignmentOperators.forEach(function(op)
                    {
                        operatorSelect.append($('<option>', { value: op.name, text: op.uiName }));
                    });
                    effectSubContainer.append(operatorSelect);

                    var controlContainer = $('<span>', { class: containerClassPrefix + "-effect-control-container" });
                    parameterDefinitions[pId].type.appendControlTo(controlContainer);
                    effectSubContainer.append(controlContainer);
                };

                // Clone the hidden select accumulated for each separate section and put it in the parameter effect
                var idRefSelect = effectsContainer.parent().children('select.' + $.escapeSelector(containerClassPrefix) + '-idref-select.hidden').clone();
                idRefSelect.removeClass(containerClassPrefix + '-idref-select');
                idRefSelect.addClass(containerClassPrefix + '-effect-idref-select');
                changeEffectType($(idRefSelect).val());
                idRefSelect.on('change', function()
                {
                    effectSubContainer.empty();
                    changeEffectType($(this).val());
                });
                idRefSelect.removeClass('hidden');

                // This button deletes the effect (container)
                var deleteButton = Parts.deleteButton();
                deleteButton.on('click', function() { $(this).parent().remove(); });

                var effectContainer = $('<div>', { class: "parameter-effect " + containerClassPrefix + "-effect-container" });
                var handle = $('<span>', { class: "handle", text: "↕" });
                effectContainer.append([handle, idRefSelect, effectSubContainer, deleteButton]);
                effectsContainer.append(effectContainer);
            };

            // Shows the sections and add buttons when there are effects that can be added
            var hStartLevel = 3;
            var showParameterItem = function(parameterDefinitions, acceptableScopes, parameterItem, hLevel, container, classPrefix, idRefToEffectsContainer)
            {
                if (acceptableScopes.indexOf(parameterItem.scopes.statementScope) === -1) return false;
                if (parameterItem.kind === 'section')
                {
                    var sectionContainer = $('<div>');
                    if (hLevel === hStartLevel) sectionContainer.addClass("section");
                    else sectionContainer.addClass("subsection");
                    sectionContainer.append($('<h' + hLevel + '>', { text: parameterItem.name }));
                    container.append(sectionContainer);

                    // Show all subsections or possibilities to add effects
                    var anyParameterShown = false;
                    parameterItem.sequence.forEach(function(subItem)
                    {
                        if (showParameterItem(parameterDefinitions, acceptableScopes, subItem, hLevel + 1, sectionContainer, classPrefix, idRefToEffectsContainer))
                        {
                            anyParameterShown = true;
                        }
                    });

                    // Remove the section if there are no effects inside it and no effects inside subsections to add
                    if (!anyParameterShown) sectionContainer.remove();

                    return anyParameterShown;
                }
                else
                {
                    var parameterIdRefSelect;
                    var effectsContainer;
                    if (!container.hasClass(classPrefix + "-possible"))
                    {
                        container.addClass(classPrefix + "-possible");

                        // Make a new select that accumulates all the possible parameter id's that can be affected
                        parameterIdRefSelect = $('<select>', { class: classPrefix + "-idref-select hidden" });
                        container.append(parameterIdRefSelect);

                        effectsContainer = $('<div>', { class: classPrefix + "-container" });
                        Utils.makeSortable(effectsContainer);
                        container.append(effectsContainer);

                        container.append(Parts.addButton(i18next.t('main:add_effect')));
                        var addEffectButton = container.children().last();
                        addEffectButton.on('click', function()
                        {
                            appendEffectContainerTo(effectsContainer, classPrefix, parameterDefinitions);
                        });
                    }
                    else
                    {
                        parameterIdRefSelect = container.children('select.' + $.escapeSelector(classPrefix) + '-idref-select.hidden');
                        effectsContainer = container.children('.' + $.escapeSelector(classPrefix) + '-container');
                    }
                    var parameterIdRefOption = $('<option>', { value: parameterItem.id, text: parameterItem.name });
                    parameterIdRefSelect.append(parameterIdRefOption);

                    idRefToEffectsContainer[parameterItem.id] = effectsContainer;

                    return true;
                }
            };

            // Show the sections for all character-independent fixed parameter effects
            var fixedParameterEffectsEl = $("#fixed-parameter-effects");
            var classPrefix = fixedParameterEffectsEl.attr('id');
            fixedParameterEffectsEl.removeClass(classPrefix + '-possible');
            // Accumulator for mapping a parameter id to its effects container
            var idRefToEffectsContainer = {};
            Config.container.parameters.sequence.forEach(function(subItem)
            {
                showParameterItem(Config.container.parameters.byId, scopes, subItem, hStartLevel, fixedParameterEffectsEl, classPrefix, idRefToEffectsContainer);
            });

            // Add the character-independent effects that were previously defined
            node.parameterEffects.fixed.characterIndependent.sequence.forEach(function(effect)
            {
                if (effect.idRef in idRefToEffectsContainer)
                {
                    var effectsContainer = idRefToEffectsContainer[effect.idRef];
                    appendEffectContainerTo(effectsContainer, classPrefix, Config.container.parameters.byId);
                    var addedEffectContainer = effectsContainer.children().last();

                    addedEffectContainer.find('.' + classPrefix + '-effect-idref-select').val(effect.idRef).trigger('change');
                    addedEffectContainer.find('.' + classPrefix + '-effect-operator-select').val(effect.operator);
                    Config.container.parameters.byId[effect.idRef].type.setInDOM(addedEffectContainer.find('.' + classPrefix + '-effect-control-container'), effect.value);
                }
            });

            if (node.type !== Main.computerType || Config.container.characters.sequence.length > 1)
            {
                // Show the sections for all per-character fixed parameter effects
                var fixedCharacterParameterEffectsEl = $("#fixed-character-parameter-effects");
                var characterClassPrefix = fixedCharacterParameterEffectsEl.attr('id');
                var accordionDiv = $('<div>');
                fixedCharacterParameterEffectsEl.append(accordionDiv);
                var anyCharacterParameterShown = false;
                // Accumulator for mapping a character parameter id to its effects container
                var idRefToCharacterEffectsContainer = {};
                Config.container.characters.sequence.forEach(function(character)
                {
                    var characterHeader = $('<h' + hStartLevel + '>', { value: character.id, text: character.name ? character.name : character.id });
                    var characterDiv = $('<div>');
                    accordionDiv.append(characterHeader).append(characterDiv);

                    var classCharacterPrefix = characterClassPrefix + '-' + character.id;

                    idRefToCharacterEffectsContainer[character.id] = {};

                    // The definitions for each parameter need to be available for changing the select,
                    // it can either be a parameter for an individual character or for all the characters,
                    // so we need to merge the definitions into one object and pass it.
                    var characterParameterDefinitions = $.extend({}, Config.container.characters.parameters.byId, Config.container.characters.byId[character.id].parameters.byId);

                    Config.container.characters.parameters.sequence.forEach(function(parameterItem)
                    {
                        if (showParameterItem(characterParameterDefinitions, scopes, parameterItem, hStartLevel,
                                              characterDiv, classCharacterPrefix, idRefToCharacterEffectsContainer[character.id]))
                        {
                            anyCharacterParameterShown = true;
                        }
                    });

                    Config.container.characters.byId[character.id].parameters.sequence.forEach(function(parameterItem)
                    {
                        if (showParameterItem(characterParameterDefinitions, scopes, parameterItem, hStartLevel,
                                              characterDiv, classCharacterPrefix, idRefToCharacterEffectsContainer[character.id]))
                        {
                            anyCharacterParameterShown = true;
                        }
                    });
                });

                if (anyCharacterParameterShown)
                {
                    if (Config.container.characters.sequence.length > 1)
                    {
                        fixedCharacterParameterEffectsEl.prepend($('<h3>', { text: i18next.t('common:characters') }));
                        // Set the heightStyle to "content", because the content changes dynamically
                        accordionDiv.accordion({ active: false, collapsible: true, heightStyle: "content" });
                    }
                }
                else
                {
                    accordionDiv.remove();
                }

                // Add the per-character effects that were previously defined
                for (var characterId in Config.container.characters.byId)
                {
                    var classCharacterPrefix = characterClassPrefix + '-' + characterId;
                    var characterParameterDefinitions = $.extend({}, Config.container.characters.parameters.byId, Config.container.characters.byId[characterId].parameters.byId);

                    node.parameterEffects.fixed.perCharacter[characterId].sequence.forEach(function(effect)
                    {
                        if (effect.idRef in idRefToCharacterEffectsContainer[characterId])
                        {
                            var effectsContainer = idRefToCharacterEffectsContainer[characterId][effect.idRef];
                            appendEffectContainerTo(effectsContainer, classCharacterPrefix, characterParameterDefinitions);
                            var addedEffectContainer = effectsContainer.children().last();

                            addedEffectContainer.find('.' + $.escapeSelector(classCharacterPrefix) + '-effect-idref-select').val(effect.idRef).trigger('change');
                            addedEffectContainer.find('.' + $.escapeSelector(classCharacterPrefix) + '-effect-operator-select').val(effect.operator);
                            characterParameterDefinitions[effect.idRef].type.setInDOM(addedEffectContainer.find('.' + $.escapeSelector(classCharacterPrefix) + '-effect-control-container'), effect.value);
                        }
                    });
                }
            }

            // Show the node's property values
            var showPropertyItem = function(propertyValues, acceptableScopes, propertyItem, hLevel, tableBody, idPrefix)
            {
                if (acceptableScopes.indexOf(propertyItem.scopes.statementScope) === -1) return;
                if (propertyItem.kind === 'section')
                {
                    var sectionTable = $('<table>');

                    var sectionTableHeader = $('<thead>').append($('<th colspan="2">').append($('<h' + hLevel + '>', { text: propertyItem.name })));
                    sectionTable.append(sectionTableHeader);

                    var sectionTableBody = $('<tbody>');
                    sectionTable.append(sectionTableBody);

                    var sectionContainer = $('<div>').append(sectionTable);
                    if (hLevel === hStartLevel) sectionContainer.addClass("section");
                    else sectionContainer.addClass("subsection");
                    tableBody.append($('<tr>').append($('<td colspan="2">').append(sectionContainer)));

                    var anyPropertyShown = false;
                    propertyItem.sequence.forEach(function(subItem)
                    {
                        if (showPropertyItem(propertyValues, acceptableScopes, subItem, hLevel + 1, sectionTableBody, idPrefix))
                        {
                            anyPropertyShown = true;
                        }
                    });
                    return anyPropertyShown;
                }
                else
                {
                    var propertyHeader = $('<th>');
                    var controlHtmlId = idPrefix + '-' + propertyItem.id;
                    var controlFirst = propertyItem.type.labelControlOrder === Types.labelControlOrders.singleLineContainerLabel ||
                                       propertyItem.type.labelControlOrder === Types.labelControlOrders.twoLineContainerLabel;
                    propertyHeader.append($('<label>', { text: propertyItem.name + (controlFirst ? '' : ':'), 'for': controlHtmlId }));

                    var propertyData = $('<td>', { id: idPrefix + '-container-' + propertyItem.id });
                    propertyItem.type.appendControlTo(propertyData, controlHtmlId);
                    propertyItem.type.setInDOM(propertyData, propertyValues[propertyItem.id]);

                    if (propertyItem.type.autoComplete)
                    {
                        if (!propertyItem.autoCompleteList) propertyItem.autoCompleteList = [];
                        propertyItem.type.autoCompleteControl(propertyData, propertyItem.autoCompleteList);
                    }

                    var propertyRow = $('<tr>');
                    var additionalPropertyRow;
                    switch (propertyItem.type.labelControlOrder)
                    {
                        case Types.labelControlOrders.singleLineLabelContainer:
                            propertyRow.append(propertyHeader);
                            propertyRow.append(propertyData);
                            break;
                        case Types.labelControlOrders.singleLineContainerLabel:
                            propertyRow.append(propertyHeader);
                            propertyRow.prepend(propertyData);
                            break;
                        case Types.labelControlOrders.container:
                            propertyData.prop('colspan', "2");
                            propertyRow.append(propertyData);
                            break;
                        case Types.labelControlOrders.twoLineLabelContainer:
                            propertyRow.append(propertyHeader);
                            additionalPropertyRow = $('<tr>').append(propertyData);
                            break;
                        case Types.labelControlOrders.twoLineContainerLabel:
                            additionalPropertyRow = propertyRow.append(propertyHeader);
                            propertyRow = $('<tr>').append(propertyData);
                            break;
                        default:
                            console.error("Not implemented");
                            break;
                    }
                    tableBody.append(propertyRow);
                    if (additionalPropertyRow) tableBody.append(additionalPropertyRow);

                    return true;
                }
            };
            var nodePropertyValuesEl = $('#node-property-values');
            var nodePropertyValuesTable = $('<table>');
            var anyNodePropertyShown = false;
            Config.container.properties.sequence.forEach(function(subItem)
            {
                if (showPropertyItem(node.propertyValues.characterIndependent, scopes, subItem, hStartLevel, nodePropertyValuesTable, nodePropertyValuesEl.attr('id')))
                {
                    anyNodePropertyShown = true;
                }
            });
            nodePropertyValuesEl.append(nodePropertyValuesTable);

            var nodeCharacterPropertyValuesEl = $('#node-character-property-values');
            if (node.type !== Main.computerType || Config.container.characters.sequence.length > 1)
            {
                var characterAccordion = $('<div>');
                nodeCharacterPropertyValuesEl.append(characterAccordion);
                var anyCharacterPropertyShown = false;
                Config.container.characters.sequence.forEach(function(character)
                {
                    var characterHeader = $('<h' + hStartLevel + '>', { value: character.id, text: character.name ? character.name : character.id });
                    var characterTab = $('<table>');
                    characterAccordion.append(characterHeader).append($('<div>').append(characterTab));

                    var containerIdPrefix = nodeCharacterPropertyValuesEl.attr('id') + '-' + character.id;

                    Config.container.characters.properties.sequence.forEach(function(propertyItem)
                    {
                        if (showPropertyItem(node.propertyValues.perCharacter[character.id], scopes, propertyItem, hStartLevel, characterTab, containerIdPrefix))
                        {
                            anyCharacterPropertyShown = true;
                        }
                    });

                    Config.container.characters.byId[character.id].properties.sequence.forEach(function(propertyItem)
                    {
                        if (showPropertyItem(node.propertyValues.perCharacter[character.id], scopes, propertyItem, hStartLevel, characterTab, containerIdPrefix))
                        {
                            anyCharacterPropertyShown = true;
                        }
                    });
                });

                if (anyCharacterPropertyShown)
                {
                    anyNodePropertyShown = true;
                    if (Config.container.characters.sequence.length > 1)
                    {
                        nodeCharacterPropertyValuesEl.prepend($('<h3>', { text: i18next.t('common:characters') }));
                        characterAccordion.accordion({ active: false, collapsible: true, heightStyle: "content" });
                    }
                }
                else
                {
                    characterAccordion.remove();
                }
            }

            $("#propertyValuesSection").toggle(anyNodePropertyShown);

            // Show the per-computer-own parameter effects and property values
            if (node.type === Main.computerType)
            {
                var updateSideBarCharacterSection = function()
                {
                    var acceptableScopes = ['per-computer-own'];
                    if (Config.container.characters.sequence.length === 1)
                    {
                        acceptableScopes = acceptableScopes.concat(scopes);
                    }

                    // Show the sections for all per-character fixed parameter effects
                    var computerOwnParameterEffectsEl = $("#node-computer-own-parameter-effects");
                    computerOwnParameterEffectsEl.children().remove();
                    var computerOwnParameterEffectsDiv = $('<div>');
                    computerOwnParameterEffectsEl.append(computerOwnParameterEffectsDiv);
                    var anyCharacterParameterShown = false;
                    var classCharacterPrefix = computerOwnParameterEffectsEl.attr('id') + '-' + $.escapeSelector(node.characterIdRef);
                    var idRefToThisCharacterEffectsContainer = {};
                    // The definitions for each parameter need to be available for changing the select,
                    // it can either be a parameter for an individual character or for all the characters,
                    // so we need to merge the definitions into one object and pass it.
                    var characterParameterDefinitions = $.extend({}, Config.container.characters.parameters.byId, Config.container.characters.byId[node.characterIdRef].parameters.byId);
                    Config.container.characters.parameters.sequence.forEach(function(parameterItem)
                    {
                        if (showParameterItem(characterParameterDefinitions, acceptableScopes, parameterItem, hStartLevel,
                                              computerOwnParameterEffectsDiv, classCharacterPrefix, idRefToThisCharacterEffectsContainer))
                        {
                            anyCharacterParameterShown = true;
                        }
                    });
                    Config.container.characters.byId[node.characterIdRef].parameters.sequence.forEach(function(parameterItem)
                    {
                        if (showParameterItem(characterParameterDefinitions, acceptableScopes, parameterItem, hStartLevel,
                                              computerOwnParameterEffectsDiv, classCharacterPrefix, idRefToThisCharacterEffectsContainer))
                        {
                            anyCharacterParameterShown = true;
                        }
                    });
                    computerOwnParameterEffectsEl.parent().toggle(anyCharacterParameterShown);

                    // Add the previously defined per-computer-own fixed parameter effects
                    node.parameterEffects.fixed.perCharacter[node.characterIdRef].sequence.forEach(function(effect)
                    {
                        if (acceptableScopes.indexOf(characterParameterDefinitions[effect.idRef].scopes.statementScope) !== -1)
                        {
                            var effectsContainer = idRefToThisCharacterEffectsContainer[effect.idRef];
                            appendEffectContainerTo(effectsContainer, classCharacterPrefix, characterParameterDefinitions);
                            var addedEffectContainer = effectsContainer.children().last();

                            addedEffectContainer.find('.' + classCharacterPrefix + '-effect-idref-select').val(effect.idRef).trigger('change');
                            addedEffectContainer.find('.' + classCharacterPrefix + '-effect-operator-select').val(effect.operator);
                            characterParameterDefinitions[effect.idRef].type.setInDOM(addedEffectContainer.find('.' + classCharacterPrefix + '-effect-control-container'), effect.value);
                        }
                    });

                    var computerOwnPropertyValuesEl = $("#node-computer-own-property-values");
                    computerOwnPropertyValuesEl.children().remove();
                    var computerOwnPropertyValuesTable = $('<table>');
                    computerOwnPropertyValuesEl.append(computerOwnPropertyValuesTable);
                    // The same id prefix as the other character property values, so they can be easily retrieved
                    var containerIdPrefix = nodeCharacterPropertyValuesEl.attr('id') + '-' + node.characterIdRef;
                    var anyPropertyShown = false;
                    Config.container.characters.properties.sequence.forEach(function(propertyItem)
                    {
                        if (showPropertyItem(node.propertyValues.perCharacter[node.characterIdRef], acceptableScopes, propertyItem, hStartLevel + 1, computerOwnPropertyValuesTable, containerIdPrefix))
                        {
                            anyPropertyShown = true;
                        }
                    });
                    Config.container.characters.byId[node.characterIdRef].properties.sequence.forEach(function(propertyItem)
                    {
                        if (showPropertyItem(node.propertyValues.perCharacter[node.characterIdRef], acceptableScopes, propertyItem, hStartLevel + 1, computerOwnPropertyValuesTable, containerIdPrefix))
                        {
                            anyPropertyShown = true;
                        }
                    });
                    computerOwnPropertyValuesEl.parent().toggle(anyPropertyShown);

                    $("#characterSection").toggle(anyCharacterParameterShown || anyPropertyShown || Config.container.characters.sequence.length > 1);
                };

                if (Config.container.characters.sequence.length > 1)
                {
                    var characterSelection = $("#characterSelection");
                    characterSelection.off('change');
                    characterSelection.on('change', function()
                    {
                        if (Main.selectedElement)
                        {
                            // Save the changes of the user if the character changed by the user, so we can store them in the new property values and parameter effects
                            applyNodeChanges();

                            var node = Main.nodes[Main.selectedElement];

                            var newCharacterIdRef = $(this).val();

                            var acceptableScopes = ['per', 'per-' + node.type, 'per-computer-own'];

                            var perCharacterParameterEffects = Config.getNewDefaultParameterEffects(newCharacterIdRef).fixed.perCharacter;

                            var characterId;
                            for (characterId in node.parameterEffects.fixed.perCharacter)
                            {
                                node.parameterEffects.fixed.perCharacter[characterId].sequence.forEach(function(effect)
                                {
                                    var parameter = Config.container.characters.parameters.byId[effect.idRef];
                                    if (!parameter) parameter = Config.container.characters.byId[newCharacterIdRef].parameters.byId[effect.idRef];

                                    if (parameter)
                                    {
                                        if (parameter.scopes.statementScope === 'per-computer-own')
                                        {
                                            perCharacterParameterEffects[newCharacterIdRef].sequence.push(effect);
                                            perCharacterParameterEffects[newCharacterIdRef].byId[effect.idRef].push(effect);
                                        }
                                        else
                                        {
                                            perCharacterParameterEffects[characterId].sequence.push(effect);
                                            perCharacterParameterEffects[characterId].byId[effect.idRef].push(effect);
                                        }
                                    }
                                });
                            }
                            node.parameterEffects.fixed.perCharacter = perCharacterParameterEffects;

                            // Store old property values in the new property values and
                            // check for each per-character property value if it is per-computer-own and
                            // if the other character also has that property then store it in the new character property values
                            var perCharacterPropertyValues = Config.getNewDefaultPropertyValues(acceptableScopes, newCharacterIdRef).perCharacter;
                            for (characterId in perCharacterPropertyValues)
                            {
                                for (var propertyId in perCharacterPropertyValues[characterId])
                                {
                                    var property = Config.container.characters.properties.byId[propertyId];
                                    if (!property) property = Config.container.characters.byId[characterId].properties.byId[propertyId];

                                    if (property.scopes.statementScope === 'per-computer-own')
                                    {
                                        if (node.propertyValues.perCharacter[node.characterIdRef][propertyId])
                                        {
                                            perCharacterPropertyValues[characterId][propertyId] = node.propertyValues.perCharacter[node.characterIdRef][propertyId];
                                        }
                                    }
                                    else if (node.propertyValues.perCharacter[characterId][propertyId])
                                    {
                                        perCharacterPropertyValues[characterId][propertyId] = node.propertyValues.perCharacter[characterId][propertyId];
                                    }
                                }
                            }
                            node.propertyValues.perCharacter = perCharacterPropertyValues;

                            node.characterIdRef = newCharacterIdRef;

                            updateSideBarCharacterSection();
                            changeNodeText(Main.selectedElement);
                        }
                    });
                }

                updateSideBarCharacterSection();
            }

            $("#endNodeCheckbox").prop("checked", node.endNode);
            $("#allowDialogueEndNodeCheckbox").prop("checked", node.allowDialogueEndNode);
            $("#allowInterleaveNodeCheckbox").prop("checked", node.allowInterleaveNode);

            $("textarea#comment").val(node.comment);
        }
        else if (Main.selectedElement in Main.trees)
        {
            MiniMap.deactivate();

            $('#properties').attr("class", "tree");

            $("#optionalCheckbox").prop("checked", Main.trees[Main.selectedElement].optional);

            $("textarea#comment").val(Main.trees[Main.selectedElement].comment);
        }
    }

    function addEmptyUserDefinedParameterEffect()
    {
        var parameterEffect = $('<div>', { class: "parameter-effect" });
        parameterEffect.append($('<span>', { class: "handle", text: '↕' }));
        var idRefSelect = $('<select>', { class: "parameter-idref-select" });
        parameterEffect.append(idRefSelect);
        var effectContainer = $('<span>', { class: "parameter-effect-container" });
        parameterEffect.append(effectContainer);
        parameterEffect.append(Parts.deleteButton());
        $("#userDefinedParameterEffects").append(parameterEffect);

        Parameters.insertInto(idRefSelect);
        var changeEffectType = function(pId)
        {
            var operatorSelect = $('<select>', { class: "parameter-effect-operator-select" });
            Parameters.container.byId[pId].type.assignmentOperators.forEach(function(op)
            {
                operatorSelect.append($('<option>', { value: op.name, text: op.uiName }));
            });
            effectContainer.append(operatorSelect);

            var controlContainer = $('<span>', { class: "parameter-effect-value-container" });
            Parameters.container.byId[pId].type.appendControlTo(controlContainer);
            effectContainer.append(controlContainer);
        };
        changeEffectType(idRefSelect.val());
        idRefSelect.on('change', function()
        {
            effectContainer.empty();
            changeEffectType($(this).val());
        });

        return parameterEffect;
    }

    function makeConnection(sourceID, targetID, plumbInstance)
    {
        var sourceNode = Main.nodes[sourceID];
        var targetNode = Main.nodes[targetID];

        // Do not connect between trees
        if (targetNode.parent !== sourceNode.parent)
        {
            console.log(i18next.t('main:error.tree_connection'));
            return false;
        }

        if (Validator.testCycle(targetID, sourceID))
        {
            Utils.alertDialog(i18next.t('main:error.cycle'), 'error');
            return false;
        }

        // Ensure that siblings are of the same type only
        var firstChildId = getFirstChildIdOrNull(sourceID);
        if (firstChildId !== null)
        {
            if (targetNode.type != Main.nodes[firstChildId].type)
            {
                Utils.alertDialog(i18next.t('main:error.child_type'), 'error');
                return false;
            }
        }

        if (Validator.testDuplicateConnection(sourceID, targetID))
        {
            return false;
        }

        plumbInstance.connect({ source: sourceID, target: targetID });

        return true;
    }

    function getFirstChildIdOrNull(sourceId)
    {
        var connections = Main.getPlumbInstanceByNodeID(sourceId).getConnections({ source: sourceId });
        return connections.length === 0 ? null : connections[0].targetId;
    }

    // Make .collapsable div sections collapse and expand when .clickable sibling element is clicked
    function makeCollapsable()
    {
        // Set the initial state of collapsable and clickable elements:
        $(".collapsable").css("display", "inline-block");
        $(".collapsable").show();

        $(".clicktag").removeClass("collapsed").html(Utils.sIcon("icon-open"));
        $(".masterclicktag").removeClass("collapsed").html(Utils.sIcon("icon-open"));

        // Click element header to toggle slide property elements
        $(".clickable").on("click", function(e)
        {
            // The main header was clicked, it can collapse all the property elements
            if ($(this).hasClass("collapseAll"))
            {
                // If there is at least one collapsable element open, close all
                var result = 0;
                $(".collapsable").each(function()
                {
                    if ($(this).css("display") != "none")
                    {
                        $("#properties").find(".collapsable").slideUp(400);
                        $(".clicktag").addClass("collapsed").html(Utils.sIcon("icon-closed"));
                        $(".masterclicktag").addClass("collapsed").html(Utils.sIcon("icon-closed"));
                        result++;
                        return false;
                    }
                });
                // If there are no collapsable elements open, open all
                if (result === 0)
                {
                    $("#properties").find(".collapsable").slideDown(400);
                    $(".clicktag").removeClass("collapsed").html(Utils.sIcon("icon-open"));
                    $(".masterclicktag").removeClass("collapsed").html(Utils.sIcon("icon-open"));
                }
            }
            // A property element header was clicked
            else
            {
                var clickTag = $(this).find(".clicktag");
                // An element was opened
                if (clickTag.hasClass("collapsed"))
                {
                    clickTag.removeClass("collapsed").html(Utils.sIcon("icon-open"));
                    $(".masterclicktag").removeClass("collapsed").html(Utils.sIcon("icon-open"));
                }
                // An element was closed
                else
                {
                    clickTag.addClass("collapsed").html(Utils.sIcon("icon-closed"));

                    $(".clickable").each(function()
                    {
                        // Check if there is at least one element open
                        if (!$(this).find(".clicktag").hasClass("collapsed"))
                        {
                            $(".masterclicktag").removeClass("collapsed").html(Utils.sIcon("icon-open"));
                            return false;
                        }
                        else $(".masterclicktag").addClass("collapsed").html(Utils.sIcon("icon-closed"));
                    });
                }
                // Close or open a single element
                $(this).parent().closest("div").find(".collapsable").slideToggle(400);
            }
            e.stopPropagation();
        });

        // Exceptions to stop propagation: .collapsable is clicked directly
        $(".collapsable").on("click", function(e)
        {
            e.stopPropagation();
        });
    }

    function mousePositionToDialoguePosition(mousePos)
    {
        // Must return a position (not null) when
        // Zoom.isZoomed() && isMousePositionWithinEditingCanvas()

        var zoomedTree = Zoom.getZoomed();
        if (!zoomedTree) return null;

        var treeDiv = zoomedTree.div;
        var leftBound = treeDiv.offset().left;
        var upperBound = treeDiv.offset().top;
        var rightBound = leftBound + treeDiv.width();
        var lowerBound = upperBound + treeDiv.height();

        if (!(mousePos.x >= leftBound && mousePos.x < rightBound &&
            mousePos.y >= upperBound && mousePos.y < lowerBound))
        {
            return null;
        }

        return {
            left: mousePos.x - leftBound + treeDiv.scrollLeft(),
            top: mousePos.y - upperBound + treeDiv.scrollTop()
        };
    }

    function isEditingInCanvas()
    {
        var inModal = $(document.body).children(".ui-widget-overlay.ui-front").length > 0;
        return !inModal && window.getSelection().isCollapsed &&
            ($("#main").closest(document.activeElement).length > 0 || document.activeElement === null);
    }

    function isMousePositionWithinEditingCanvas()
    {
        var zoomedTree = Zoom.getZoomed();
        var canvas = zoomedTree ? zoomedTree.div : $("#main");
        var offset = canvas.offset();
        var width = canvas.width();
        var height = canvas.height();
        return Main.mousePosition.x >= offset.left &&
            Main.mousePosition.y >= offset.top &&
            Main.mousePosition.x < offset.left + width &&
            Main.mousePosition.y < offset.top + height;
    }

    function updateDocumentTitle()
    {
        var savedIndicator = SaveIndicator.getSavedChanges() ? "" : "• ";
        var scenarioTitle = Metadata.container.name !== "" ? Metadata.container.name + " - " : "";
        document.title = savedIndicator + scenarioTitle + "Scenario Editor";
    }
})();
