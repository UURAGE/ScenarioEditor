/* © Utrecht University and DialogueTrainer */

/* exported Main */
let Main;

(function()
{
    "use strict";

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
        gridX: null,
        gridY: null,
        // The mouse position relative to the html document
        mousePosition: { x: 0, y: 0 },
        // Functions
        addNewNode: addNewNode,
        addNewTree: addNewTree,
        applyChanges: applyChanges,
        updateNodeGraphics: updateNodeGraphics,
        mousePositionToDialoguePosition: mousePositionToDialoguePosition,
        createChildNode: createChildNode,
        createEmptyTree: createEmptyTree,
        createAndReturnNode: createAndReturnNode,
        deleteAllSelected: deleteAllSelected,
        deselectConnection: deselectConnection,
        getGridIndicatorPosition: getGridIndicatorPosition,
        checkGridAvailable: checkGridAvailable,
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
    let firstDragNodeID = null, invalidateNodeClick = false;
    // Tree dragging
    let firstDragTreeID = null, invalidateTreeClick = false, minimumCoordinatesByTree = {};
    // Selecting and panning
    let ctrlDown = false, spaceDown = false, isSelecting = false, isPanning = false;

    // Copied from: http://stackoverflow.com/a/22079985/1765330
    $.fn.attachDragger = function()
    {
        let lastPosition, position, difference;
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
            const characterSelection = $("#characterSelection");
            Config.container.characters.sequence.forEach(function(character)
            {
                characterSelection.append($("<option>", { value: character.id, text: character.name ? character.name : character.id }));
            });
        }
        else
        {
            $("#characterSelection").remove();
        }

        const scenarioNameInput = $('<input>', { type: 'text' });
        const scenarioNameInputSpan = $('<span>', { class: "scenarioNameInput" }).append(scenarioNameInput);
        scenarioNameInputSpan.on('focusout', function(e, cancel)
        {
            const nameInput = $('#scenarioNameTab .scenarioNameInput input');

            if (!cancel)
            {
                const inputName = Metadata.formatScenarioName(nameInput.val());
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

            const nameInputSpan = $('#scenarioNameTab .scenarioNameInput');
            const nameInput = nameInputSpan.children('input');
            nameInput.val(Metadata.container.name);
            nameInputSpan.show();
            nameInput.focus();
        });

        // Handle movement of the div indicating which grid cell youre hovering over
        $('#main').on('mousemove', function(e)
        {
            const mainPos = $("#main").offset();

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
            const text = "+ " + i18next.t('common:subject');

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
            const text = "+ " + i18next.t('common:computer');

            if (!Zoom.isZoomed())
            {
                DragBox.showError(e, i18next.t('main:no_subject_open'));
                return;
            }

            DragBox.startDragging(e, text, function(draggingContinues)
            {
                const dialoguePosition = mousePositionToDialoguePosition(Main.mousePosition);
                if (dialoguePosition) addNewNode(Main.computerType, "", dialoguePosition, !draggingContinues);
                return true;
            }, true);
        });
        $('#newPlayerNode').on("mousedown", function(e)
        {
            selectElement(null);

            e.preventDefault(); // Prevent selecting text
            const text = "+ " + i18next.t('common:player');

            if (!Zoom.isZoomed())
            {
                DragBox.showError(e, i18next.t('main:no_subject_open'));
                return;
            }

            DragBox.startDragging(e, text, function(draggingContinues)
            {
                const dialoguePosition = mousePositionToDialoguePosition(Main.mousePosition);
                if (dialoguePosition) addNewNode(Main.playerType, "", dialoguePosition, !draggingContinues);
                return true;
            }, true);
        });
        $('#newSituationNode').on("mousedown", function(e)
        {
            selectElement(null);

            e.preventDefault(); // Prevent selecting text
            const text = "+ " + i18next.t('common:situation');

            if (!Zoom.isZoomed())
            {
                DragBox.showError(e, i18next.t('main:no_subject_open'));
                return;
            }

            DragBox.startDragging(e, text, function(draggingContinues)
            {
                const dialoguePosition = mousePositionToDialoguePosition(Main.mousePosition);
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

        let isMainClickAction = false;
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
            const id = element.selected.id;

            const isZoomed = Zoom.isZoomed();
            const isTree = id in Main.trees;
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
                const zoomedTree = Zoom.getZoomed();
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
            const zoomedTree = Zoom.getZoomed();
            spaceDown = false;
            isPanning = false;
            zoomedTree.div.selectable('enable');
            zoomedTree.div.removeClass('dragging');
        }
    });

    function initialiseMenuBar()
    {
        const buttons = $(".dropdownButton");

        /* eslint-disable prefer-const */

        // These functions reference each other
        let closeOpenMenu, closeMenu, openMenu;

        closeOpenMenu = function(e)
        {
            const dropdownButton = $(".dropdownButton.dropped");
            const menu = dropdownButton.closest(".dropdown");
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

        /* eslint-enable prefer-const */

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
                const handler = $(this).hasClass("dropped") ? closeMenu : openMenu;
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

        const domSidebarGrip = $('#sidebar').find('.grip');
        let mouseX = 0;

        const mouseMoveHandler = function(event)
        {
            const width = $(window).width() - event.pageX + mouseX;
            setSidebarWidth(width);
        };

        const mouseUpHandler = function()
        {
            $(document).off("mousemove", mouseMoveHandler);
            $(document).off("mouseup", mouseUpHandler);
            $('#sidebar').removeClass('dragging');
        };

        $(domSidebarGrip).mousedown(function(event)
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
        const minWidth = 100;
        let maxWidth = $(window).width() / 3;
        if (maxWidth < 475) maxWidth = 475;
        const w = Math.min(Math.max(width, minWidth), maxWidth);
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

        const treeDiv = $('<div>', { class: "treeDiv noSelect" });

        let isClickAction = false;
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

        const defaultName = i18next.t('main:default_subject');
        const changeNameInput = $('<input type="text" class="subjectNameInput">');
        changeNameInput.val(defaultName);
        changeNameInput.hide();
        changeNameInput.on('focusout', function(e, cancel)
        {
            const subDiv = $("#" + id);
            const subjectName = subDiv.find('.subjectName').show();
            const input = subDiv.find('.subjectNameInput').hide();

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

        const zoomTreeButton = $('<div>', { html: Utils.sIcon('icon-plus'), class: "zoomTreeButton button" });
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

        const subjectContainer = $('<div>', { class: "subjectTextContainer" });
        const subjTextSpan = $('<span>', { text: defaultName, class: "subjectName" });

        subjectContainer.append(subjTextSpan);
        subjectContainer.append(changeNameInput);

        const iconDiv = $('<div>', { class: "icons" });

        const subjectDiv = $('<div>', { class: "subjectDiv noSelect" });
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
            const selectAllInput = false;
            triggerSubjectNameInput(id, selectAllInput);
            e.stopPropagation();
        });

        const dragDiv = $('<div>', { class: "w treeContainer gridded selectable", id: id });
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

        let minimumPosition = null;
        jsPlumb.draggable(dragDiv,
        {
            filter: ".zoomTreeButton, .zoomTreeButton *",

            // The constrain function returns the array with coordinates that will be assigned to the dragged element
            constrain: function(currentCoordinates, el)
            {
                const treeMinimumCoordinates = minimumCoordinatesByTree[$(el).attr('id')];
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
                    if (!Main.selectedElements.includes(id))
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
                    const tree = Main.trees[selectedElementID];
                    if (tree.topPos < minimumPosition.top) minimumPosition.top = tree.topPos;
                    if (tree.leftPos < minimumPosition.left) minimumPosition.left = tree.leftPos;
                });
                minimumCoordinatesByTree = {};
                Main.selectedElements.forEach(function(selectedElementID)
                {
                    const tree = Main.trees[selectedElementID];
                    minimumCoordinatesByTree[selectedElementID] =
                    [
                        (tree.leftPos - minimumPosition.left) * Main.gridX,
                        (tree.topPos - minimumPosition.top) * Main.gridY
                    ];
                });
            },

            stop: function()
            {
                const indicatorPos = getGridIndicatorPosition();
                const thisTree = Main.trees[id];
                const delta =
                {
                    "top": Math.max(-minimumPosition.top, indicatorPos.top - thisTree.topPos),
                    "left": Math.max(-minimumPosition.left, indicatorPos.left - thisTree.leftPos)
                };

                const shouldMove = !(delta.left === 0 && delta.top === 0) &&
                    // Make sure no trees can be dragged on top of each other
                    Main.selectedElements.every(function(selectedElementID)
                    {
                        const tree = Main.trees[selectedElementID];
                        return checkGridAvailable(tree.leftPos + delta.left, tree.topPos + delta.top,
                            function(tree) { return tree.id in minimumCoordinatesByTree; });
                    });

                if (shouldMove)
                {
                    SaveIndicator.setSavedChanges(false);
                    MiniMap.update(true);
                }

                Main.selectedElements.forEach(function(selectedElementID)
                {
                    const tree = Main.trees[selectedElementID];
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

        const indicatorPos = getGridIndicatorPosition();
        if (!checkGridAvailable(indicatorPos.left, indicatorPos.top)) return null;

        const tree = createEmptyTree(null, indicatorPos.left, indicatorPos.top);

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
        const tree = Zoom.getZoomed();

        if (tree === null)
        {
            return null;
        }

        const node = createAndReturnNode(type, null, tree.div, tree.id);

        const id = node.attr('id');

        let characterIdRef;
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

        const parameterEffects = Config.getNewDefaultParameterEffects(characterIdRef);

        if (Parameters.timeId && type === Main.playerType)
        {
            const timeEffect =
            {
                idRef: 't',
                operator: "addAssign",
                value: 1
            };
            parameterEffects.userDefined.push(timeEffect);
        }

        const acceptableScopes = ['per', 'per-' + type];
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
            Utils.cssPosition(node, SnapToGrid.roundPosition(position));
        }

        if (shouldSelectAndStartEditing)
        {
            selectElement(id);
            startEditingNode(id);
        }
        else
        {
            updateNodeGraphics(id);
        }

        return Main.nodes[id];
    }

    function createChildNode(parentNodeID)
    {
        if (parentNodeID in Main.nodes)
        {
            const parent = Main.nodes[parentNodeID];

            const parentDiv = $('#' + parentNodeID);
            const parentPosition = Utils.cssPosition(parentDiv);
            const position =
            {
                top: parentPosition.top + parentDiv.height() + 55,
                left: parentPosition.left
            };
            let node;
            const firstChildNodeId = getFirstChildIdOrNull(parentNodeID);
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
            const connection = makeConnection(parent.id, node.id, Zoom.getZoomed().plumbInstance);

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
        const plumbInstance = Main.trees[parentID].plumbInstance;

        // Add the node to the html.
        const node = document.createElement('div');
        node.setAttribute('id', id);
        node.classList.add('w');
        node.classList.add(type);

        const endpoint = document.createElement('div');
        endpoint.classList.add('ep');
        const endpointAnchor = document.createElement('div');
        endpointAnchor.classList.add('anchor');
        endpoint.appendChild(endpointAnchor);
        node.appendChild(endpoint);

        const nodeContent = document.createElement('div');
        nodeContent.classList.add("nodeContent");

        const inputDiv = $('<div>', { class: "statementInput" });
        inputDiv.hide();
        nodeContent.appendChild(inputDiv[0]);

        const textDiv = document.createElement('div');
        textDiv.classList.add('statementText');
        nodeContent.appendChild(textDiv);

        const imgDiv = document.createElement('div');
        imgDiv.classList.add('imgDiv');
        nodeContent.appendChild(imgDiv);

        // Expands node container using overflow when moving a node closer to the bounds of the container
        const scrollOffset = 50;
        const expander = document.createElement('div');
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

        let previousMousePosition;
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
                    if (!Main.selectedElements.includes(id))
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

                const direction = { x: Main.mousePosition.x - previousMousePosition.x, y: Main.mousePosition.y - previousMousePosition.y };

                // TODO: delete if jsPlumb katavorio supports scrolling into view
                const x = params.pos[0];
                const y = params.pos[1];
                const container = parent[0];
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
            },

            grid: [
                Config.container.settings.grid ? Config.container.settings.grid.x : 0,
                Config.container.settings.grid ? Config.container.settings.grid.y : 0,
            ]

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
        const node = Main.nodes[nodeID];
        if (node.editing) return;

        const nodeDiv = $('#' + node.id);
        const inputDiv = nodeDiv.find('.statementInput');
        const textDiv = nodeDiv.find('.statementText');

        nodeDiv.off('dblclick');
        nodeDiv.addClass("editing");
        node.editing = true;

        const text = node.text ? node.text : "";

        textDiv.hide();
        inputDiv.show();

        const txtArea = $('<textarea>',
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
        const width = Math.sqrt(text.length);
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
        const node = Main.nodes[nodeID];
        if (!node.editing) return;

        const nodeDiv = $('#' + node.id);
        const inputDiv = nodeDiv.find('.statementInput');
        const textDiv = nodeDiv.find('.statementText');
        const textArea = nodeDiv.find('.nodestatement');

        const text = textArea.val();
        textArea.remove();
        inputDiv.hide();
        textDiv.show();

        if (!cancel) node.text = text;
        updateNodeText(node.id);

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
        const orphanNodes = [];
        tree.nodes.forEach(function(nodeID)
        {
            const connections = tree.plumbInstance.getConnections(
            {
                target: nodeID
            });
            if (connections.length === 0) orphanNodes.push(nodeID);
        });
        return orphanNodes;
    }

    function getInterleaves()
    {
        const sortedTrees = Object.values(Main.trees)
            .sort(function(a, b)
            {
                return (a.topPos - b.topPos) || (a.leftPos - b.leftPos);
            });

        if (sortedTrees.length === 0) return [];

        const interleaves = [];
        let currentInterleave = [sortedTrees.shift()];
        let currentTopPos = currentInterleave[0].topPos;
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
        const subDiv = $("#" + id);
        subDiv.find('.subjectName').hide();

        const input = subDiv.find('.subjectNameInput');
        input.show();
        input.focus();
        if (selectAllInput) input.select();
    }

    function deleteAllSelected()
    {
        let zoomedTree;
        // If there are node or tree elements selected
        if (Main.selectedElements.length > 0)
        {
            let jsPlumbInstance = jsPlumb;
            if (!(Main.selectedElements[0] in Main.trees))
            {
                jsPlumbInstance = getPlumbInstanceByNodeID(Main.selectedElements[0]);
            }

            jsPlumbInstance.batch(function()
            {
                Main.selectedElements.forEach(function(selectedElement)
                {
                    deleteElement(selectedElement);
                });
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
                for (const connectionId in zoomedTree.selectedConnections)
                {
                    const cs = zoomedTree.plumbInstance.getConnections(
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
                const plumbInstance = elementId in Main.nodes ? Main.getPlumbInstanceByNodeID(elementId) : jsPlumb;
                plumbInstance.addToDragSelection(elementId);
            });
            const highlightAncestors = $("#highlightAncestors").hasClass("enabled");
            const highlightDescendants = $("#highlightDescendants").hasClass("enabled");
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
            const zoomedTree = Zoom.getZoomed();
            for (const connectionId in zoomedTree.selectedConnections)
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
        const zoomedTree = Zoom.getZoomed();
        const plumbInstance = zoomedTree ? zoomedTree.plumbInstance : jsPlumb;
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
        const cs = plumbInstance.getConnections(
        {
            source: selectedConnections[connectionId].source,
            target: selectedConnections[connectionId].target
        });

        // Connection could just have been removed so we need to check if it still exists
        if (cs.length > 0)
        {
            let paintStyle = PlumbGenerator.defaultPaintStyle;
            const colorValue = cs[0].getParameter("color");
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
        const subjectButtons = document.getElementsByClassName("subjectButton");
        const nodeButtons = document.getElementsByClassName("nodeButton");

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
        for (let i = 0, len = buttons.length; i < len; i++)
        {
            buttons[i].disabled = true;
        }
    }
    function showButtons(buttons)
    {
        for (let i = 0, len = buttons.length; i < len; i++)
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
        const node = Main.nodes[Main.selectedElement];
        node.parameterEffects = Config.getNewDefaultParameterEffects(node.characterIdRef);

        // Save user-defined parameter effects.
        $("#userDefinedParameterEffects").children().each(function()
        {
            const idRef = $(this).find(".parameter-idref-select").find("option:selected").val();
            node.parameterEffects.userDefined.push(
            {
                idRef: idRef,
                operator: $(this).find(".parameter-effect-operator-select").find("option:selected").val(),
                value: Parameters.container.byId[idRef].type.getFromDOM($(this).find(".parameter-effect-value-container"))
            });
        });

        // Save fixed parameter effects.
        const getFixedParameterEffectFromDOMAndSetInNode = function(effectContainer, parameterDefinitions, fixedParameterEffects, classPrefix)
        {
            const parameterIdRef = $(effectContainer).find('.' + $.escapeSelector(classPrefix) + '-effect-idref-select').val();
            const controlContainer = $(effectContainer).find('.' + $.escapeSelector(classPrefix) + '-effect-control-container');
            const parameterValue = parameterDefinitions[parameterIdRef].type.getFromDOM(controlContainer);
            const parameterOperator = $(effectContainer).find('.' + $.escapeSelector(classPrefix) + '-effect-operator-select').val();
            const parameterEffect = {
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

        const fixedParameterEffectsEl = $("#fixed-parameter-effects");
        fixedParameterEffectsEl.find('.' + fixedParameterEffectsEl.attr('id') + '-effect-container').each(function()
        {
            getFixedParameterEffectFromDOMAndSetInNode(this, Config.container.parameters.byId, node.parameterEffects.fixed.characterIndependent, fixedParameterEffectsEl.attr('id'));
        });
        const fixedCharacterParameterEffectsEl = $("#fixed-character-parameter-effects");
        for (const characterId in Config.container.characters.byId)
        {
            const classCharacterPrefix = fixedCharacterParameterEffectsEl.attr('id') + '-' + characterId;
            const parameterDefinitions = $.extend({}, Config.container.characters.parameters.byId, Config.container.characters.byId[characterId].parameters.byId);
            fixedCharacterParameterEffectsEl.find('.' + $.escapeSelector(classCharacterPrefix) + '-effect-container').each(function()
            {
                getFixedParameterEffectFromDOMAndSetInNode(this, parameterDefinitions, node.parameterEffects.fixed.perCharacter[characterId], classCharacterPrefix);
            });
        }
        if (node.type === Main.computerType)
        {
            const computerOwnParameterEffectsEl = $("#node-computer-own-parameter-effects");
            const classCharacterPrefix = computerOwnParameterEffectsEl.attr('id') + '-' + node.characterIdRef;
            const parameterDefinitions = $.extend({}, Config.container.characters.parameters.byId, Config.container.characters.byId[node.characterIdRef].parameters.byId);
            computerOwnParameterEffectsEl.find('.' + $.escapeSelector(classCharacterPrefix) + '-effect-container').each(function()
            {
                getFixedParameterEffectFromDOMAndSetInNode(this, parameterDefinitions, node.parameterEffects.fixed.perCharacter[node.characterIdRef], classCharacterPrefix);
            });
        }

        // Save preconditions.
        node.preconditions = Condition.getFromDOM($("#preconditionsDiv"));

        // Save property values.
        const acceptableScopes = ['per', 'per-' + node.type];
        if (node.type === Main.computerType) acceptableScopes.push('per-computer-own');

        const getPropertyFromDOMAndSetInNode = function(property, propertyValues, idPrefix, nodeCharacterIdRef, characterId)
        {
            if (!acceptableScopes.includes(property.scopes.statementScope)) return;
            if (property.scopes.statementScope === 'per-computer-own' && (!characterId || characterId !== nodeCharacterIdRef)) return;
            propertyValues[property.id] = property.type.getFromDOM($('#' + $.escapeSelector(idPrefix) + "-container-" + $.escapeSelector(property.id)));

            if (property.type.autoComplete && !property.autoCompleteList.includes(propertyValues[property.id]))
            {
                property.autoCompleteList.push(propertyValues[property.id]);
            }
        };

        for (const propertyId in Config.container.properties.byId)
        {
            getPropertyFromDOMAndSetInNode(Config.container.properties.byId[propertyId], node.propertyValues.characterIndependent, "node-property-values");
        }
        for (const propertyId in Config.container.characters.properties.byId)
        {
            for (const characterId in Config.container.characters.byId)
            {
                const property = Config.container.characters.properties.byId[propertyId];
                getPropertyFromDOMAndSetInNode(property, node.propertyValues.perCharacter[characterId], "node-character-property-values-" + characterId, node.characterIdRef, characterId);
            }
        }
        for (const characterId in Config.container.characters.byId)
        {
            for (const propertyId in Config.container.characters.byId[characterId].properties.byId)
            {
                const property = Config.container.characters.byId[characterId].properties.byId[propertyId];
                getPropertyFromDOMAndSetInNode(property, node.propertyValues.perCharacter[characterId], "node-character-property-values-" + characterId, node.characterIdRef, characterId);
            }
        }

        // Save other items.
        node.endNode = $("#endNodeCheckbox").prop("checked");
        node.allowDialogueEndNode = $("#allowDialogueEndNodeCheckbox").prop("checked");
        node.allowInterleaveNode = $("#allowInterleaveNodeCheckbox").prop("checked");
        node.comment = $("textarea#comment").val();

        stopEditingNode(node.id, false);

        updateNodeDecorations(Main.selectedElement);
    }

    function highlightLinealRelativesIncludingDirect(nearNodeID, settings)
    {
        const options = {};
        options[settings.nearKeyword] = nearNodeID;
        const connections = Main.getPlumbInstanceByNodeID(nearNodeID).getConnections(options);

        connections.forEach(function(connection)
        {
            const farNodeID = connection[settings.farIDKeyword];
            $("#" + farNodeID).addClass([settings.generalClass, settings.directClass]);
            highlightLinealRelatives(farNodeID, settings);
        });
    }

    function highlightLinealRelatives(nearNodeID, settings)
    {
        const options = {};
        options[settings.nearKeyword] = nearNodeID;
        const connections = Main.getPlumbInstanceByNodeID(nearNodeID).getConnections(options);

        connections.forEach(function(connection)
        {
            const farNodeID = connection[settings.farIDKeyword];
            const farNodeDiv = $("#" + farNodeID);
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
        for (let iStyleSheet = 0; iStyleSheet < document.styleSheets.length; iStyleSheet++)
        {
            const styleSheet = document.styleSheets[iStyleSheet];
            for (let iCSSRule = 0; iCSSRule < styleSheet.cssRules.length; iCSSRule++)
            {
                const cssRule = styleSheet.cssRules[iCSSRule];
                if (cssRule.selectorText == '.gridded')
                {
                    Main.gridX = Utils.parseDecimalIntWithDefault(cssRule.style.width);
                    Main.gridY = Utils.parseDecimalIntWithDefault(cssRule.style.height);
                    return;
                }
            }
        }
    }

    function checkGridAvailable(gridX, gridY, ignorePredicate)
    {
        return Object.values(Main.trees).every(function(tree)
        {
            if (ignorePredicate && ignorePredicate(tree)) return true;
            return !(tree.leftPos === gridX && tree.topPos === gridY);
        });
    }

    function getGridIndicatorPosition()
    {
        const position = Utils.cssPosition($("#gridIndicator"));
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
        const clone = $("#clone");
        if (clone.length !== 0)
        { // Jsplumb creates clones when nodes are being dragged. if one exists this event is on drop of a node and should not fire
            return;
        }

        $(".selected").removeClass("selected");
        $(".ui-selected").removeClass("ui-selected");
        Main.selectedElements = [];
        const zoomedTree = Zoom.getZoomed();
        const plumbInstance = zoomedTree ? zoomedTree.plumbInstance : jsPlumb;
        plumbInstance.clearDragSelection();

        const dragDiv = Main.trees[id].dragDiv;

        dragDiv.addClass("selected");
        Main.selectedElement = id;

        dragDiv.addClass("ui-selected");
        Main.selectedElements.push(Main.selectedElement);

        updateSideBar();

        $("#main").focus();
    }

    function updateNodeGraphics(nodeID)
    {
        updateNodeText(nodeID);
        updateNodeDecorations(nodeID);
    }

    // Update the node text in DOM
    function updateNodeText(nodeID)
    {
        const node = Main.nodes[nodeID];

        let text = "";
        let longestWord = "";
        switch (node.type)
        {
            case Main.computerType:
                // For computerType node: just input text
                // with characterId prefix when there are multiple characters
                if (Config.container.characters.sequence.length > 1)
                {
                    const character = Config.container.characters.byId[node.characterIdRef];
                    const characterPrefix = character.name ? Utils.escapeHTML(character.name) : character.id;
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
            longestWord = node.text.split(/[ \n]/).reduce(function(a, b)
            {
                return a.length > b.length ? a : b;
            });
        }
        const textLength = $(".lengthTest").text(longestWord)[0].clientWidth / 11;
        const width = Math.min(Math.max(4, textLength, Math.sqrt(node.text.length)), 25);

        const nodeHTML = $('#' + nodeID);

        const longNode = node.text.length > 140;
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

        const nodeTextDiv = nodeHTML.find('.statementText');
        nodeTextDiv.show();
        nodeTextDiv.html(text);

        // Make sure the text fits inside the node
        const h = Math.max(40, nodeTextDiv[0].clientHeight);
        nodeHTML.height(h);

        Main.trees[node.parent].plumbInstance.revalidate(node.id);

        ElementList.handleNodeTextUpdate(node);
    }

    function updateNodeDecorations(nodeID)
    {
        const node = Main.nodes[nodeID];
        const nodeHTML = $('#' + nodeID);
        // Fill div that can hold the images that visualize if the node has certain settings
        const imageDiv = nodeHTML.find('.imgDiv');
        imageDiv.empty();

        const appendNodePropertyImageIfHasValue = function(imgName, propertyValue, showTooltip)
        {
            if (propertyValue)
            {
                // Span wrapping required for relative tooltip position.
                const nodePropertyImage = $('<span>', { html: Utils.sIcon("icon-" + imgName) }).appendTo(imageDiv);
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

        nodeHTML.toggleClass('allowInterleaveNode', node.allowInterleaveNode);
        nodeHTML.toggleClass('allowDialogueEndNode', node.allowDialogueEndNode);
        nodeHTML.toggleClass("endNode", node.endNode);

        ElementList.handleNodeDecorationsUpdate(node);
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

        const node = Main.nodes[nodeID];
        const parentTree = Main.trees[node.parent];

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
        let hasChanges = !SaveIndicator.getSavedChanges();

        const tree = Main.trees[Main.selectedElement];

        const newTreeOptional = $('#optionalCheckbox').prop('checked');
        hasChanges = hasChanges || tree.optional !== newTreeOptional;
        tree.optional = newTreeOptional;
        $(Main.trees[Main.selectedElement].dragDiv).toggleClass("optional", tree.optional);
        const treeIcons = tree.dragDiv.find('.icons').empty();
        if (tree.optional) treeIcons.html(Utils.sIcon('icon-tree-is-optional'));

        const newTreeComment = $("textarea#comment").val();
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
            const node = Main.nodes[Main.selectedElement];
            let addedDiv;

            MiniMap.deactivate();

            // Show the correct divs for the type.
            $("#properties").attr("class", node.type);

            // Insert the preconditions in the sidebar
            const preconditionsContainer = $("#preconditionsDiv");
            Condition.appendControlsTo(preconditionsContainer);
            if (node.preconditions) Condition.setInDOM(preconditionsContainer, node.preconditions);

            // Show user-defined parameters
            node.parameterEffects.userDefined.forEach(function(parameter)
            {
                addedDiv = addEmptyUserDefinedParameterEffect();
                addedDiv.find(".parameter-idref-select").val(parameter.idRef).trigger('change');
                addedDiv.find(".parameter-effect-operator-select").val(parameter.operator);
                Parameters.container.byId[parameter.idRef].type.setInDOM(addedDiv.find(".parameter-effect-value-container"), parameter.value);
            });

            const scopes = ['per', 'per-' + node.type];

            // Show fixed parameters
            // Appends a default effect to the container, which changes dynamically based on the parameter selected
            const appendEffectContainerTo = function(effectsContainer, containerClassPrefix, parameterDefinitions)
            {
                // This element contains the dynamically changing operator and control for possible values
                // It is separate from the rest so that it can be emptied
                const effectSubContainer = $('<span>');

                // Dynamically changes the type of the effect according to the given parameter
                const changeEffectType = function(pId)
                {
                    const operatorSelect = $('<select>', { class: containerClassPrefix + "-effect-operator-select" });
                    parameterDefinitions[pId].type.assignmentOperators.forEach(function(op)
                    {
                        operatorSelect.append($('<option>', { value: op.name, text: op.uiName }));
                    });
                    effectSubContainer.append(operatorSelect);

                    const controlContainer = $('<span>', { class: containerClassPrefix + "-effect-control-container" });
                    parameterDefinitions[pId].type.appendControlTo(controlContainer);
                    effectSubContainer.append(controlContainer);
                };

                // Clone the hidden select accumulated for each separate section and put it in the parameter effect
                const idRefSelect = effectsContainer.parent().children('select.' + $.escapeSelector(containerClassPrefix) + '-idref-select.hidden').clone();
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
                const deleteButton = Parts.deleteButton();
                deleteButton.on('click', function() { $(this).parent().remove(); });

                const effectContainer = $('<div>', { class: "parameter-effect " + containerClassPrefix + "-effect-container" });
                const handle = $('<span>', { class: "handle", text: "↕" });
                effectContainer.append([handle, idRefSelect, effectSubContainer, deleteButton]);
                effectsContainer.append(effectContainer);
            };

            // Shows the sections and add buttons when there are effects that can be added
            const hStartLevel = 3;
            const showParameterItem = function(parameterDefinitions, acceptableScopes, parameterItem, hLevel, container, classPrefix, idRefToEffectsContainer)
            {
                if (!acceptableScopes.includes(parameterItem.scopes.statementScope)) return false;
                if (parameterItem.kind === 'section')
                {
                    const sectionContainer = $('<div>');
                    if (hLevel === hStartLevel) sectionContainer.addClass("section");
                    else sectionContainer.addClass("subsection");
                    sectionContainer.append($('<h' + hLevel + '>', { text: parameterItem.name }));
                    container.append(sectionContainer);

                    // Show all subsections or possibilities to add effects
                    let anyParameterShown = false;
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
                    let parameterIdRefSelect;
                    let effectsContainer;
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
                        const addEffectButton = container.children().last();
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
                    const parameterIdRefOption = $('<option>', { value: parameterItem.id, text: parameterItem.name });
                    parameterIdRefSelect.append(parameterIdRefOption);

                    idRefToEffectsContainer[parameterItem.id] = effectsContainer;

                    return true;
                }
            };

            // Show the sections for all character-independent fixed parameter effects
            const fixedParameterEffectsEl = $("#fixed-parameter-effects");
            const classPrefix = fixedParameterEffectsEl.attr('id');
            fixedParameterEffectsEl.removeClass(classPrefix + '-possible');
            // Accumulator for mapping a parameter id to its effects container
            const idRefToEffectsContainer = {};
            Config.container.parameters.sequence.forEach(function(subItem)
            {
                showParameterItem(Config.container.parameters.byId, scopes, subItem, hStartLevel, fixedParameterEffectsEl, classPrefix, idRefToEffectsContainer);
            });

            // Add the character-independent effects that were previously defined
            node.parameterEffects.fixed.characterIndependent.sequence.forEach(function(effect)
            {
                if (effect.idRef in idRefToEffectsContainer)
                {
                    const effectsContainer = idRefToEffectsContainer[effect.idRef];
                    appendEffectContainerTo(effectsContainer, classPrefix, Config.container.parameters.byId);
                    const addedEffectContainer = effectsContainer.children().last();

                    addedEffectContainer.find('.' + classPrefix + '-effect-idref-select').val(effect.idRef).trigger('change');
                    addedEffectContainer.find('.' + classPrefix + '-effect-operator-select').val(effect.operator);
                    Config.container.parameters.byId[effect.idRef].type.setInDOM(addedEffectContainer.find('.' + classPrefix + '-effect-control-container'), effect.value);
                }
            });

            if (node.type !== Main.computerType || Config.container.characters.sequence.length > 1)
            {
                // Show the sections for all per-character fixed parameter effects
                const fixedCharacterParameterEffectsEl = $("#fixed-character-parameter-effects");
                const characterClassPrefix = fixedCharacterParameterEffectsEl.attr('id');
                const accordionDiv = $('<div>');
                fixedCharacterParameterEffectsEl.append(accordionDiv);
                let anyCharacterParameterShown = false;
                // Accumulator for mapping a character parameter id to its effects container
                const idRefToCharacterEffectsContainer = {};
                Config.container.characters.sequence.forEach(function(character)
                {
                    const characterHeader = $('<h' + hStartLevel + '>', { value: character.id, text: character.name ? character.name : character.id });
                    const characterDiv = $('<div>');
                    accordionDiv.append(characterHeader).append(characterDiv);

                    const classCharacterPrefix = characterClassPrefix + '-' + character.id;

                    idRefToCharacterEffectsContainer[character.id] = {};

                    // The definitions for each parameter need to be available for changing the select,
                    // it can either be a parameter for an individual character or for all the characters,
                    // so we need to merge the definitions into one object and pass it.
                    const characterParameterDefinitions = $.extend({}, Config.container.characters.parameters.byId, Config.container.characters.byId[character.id].parameters.byId);

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
                for (const characterId in Config.container.characters.byId)
                {
                    const classCharacterPrefix = characterClassPrefix + '-' + characterId;
                    const characterParameterDefinitions = $.extend({}, Config.container.characters.parameters.byId, Config.container.characters.byId[characterId].parameters.byId);

                    node.parameterEffects.fixed.perCharacter[characterId].sequence.forEach(function(effect)
                    {
                        if (effect.idRef in idRefToCharacterEffectsContainer[characterId])
                        {
                            const effectsContainer = idRefToCharacterEffectsContainer[characterId][effect.idRef];
                            appendEffectContainerTo(effectsContainer, classCharacterPrefix, characterParameterDefinitions);
                            const addedEffectContainer = effectsContainer.children().last();

                            addedEffectContainer.find('.' + $.escapeSelector(classCharacterPrefix) + '-effect-idref-select').val(effect.idRef).trigger('change');
                            addedEffectContainer.find('.' + $.escapeSelector(classCharacterPrefix) + '-effect-operator-select').val(effect.operator);
                            characterParameterDefinitions[effect.idRef].type.setInDOM(addedEffectContainer.find('.' + $.escapeSelector(classCharacterPrefix) + '-effect-control-container'), effect.value);
                        }
                    });
                }
            }

            // Show the node's property values
            const showPropertyItem = function(propertyValues, acceptableScopes, propertyItem, hLevel, tableBody, idPrefix)
            {
                if (!acceptableScopes.includes(propertyItem.scopes.statementScope)) return;
                if (propertyItem.kind === 'section')
                {
                    const sectionTable = $('<table>');

                    const sectionTableHeader = $('<thead>').append($('<th colspan="2">').append($('<h' + hLevel + '>', { text: propertyItem.name })));
                    sectionTable.append(sectionTableHeader);

                    const sectionTableBody = $('<tbody>');
                    sectionTable.append(sectionTableBody);

                    const sectionContainer = $('<div>').append(sectionTable);
                    if (hLevel === hStartLevel) sectionContainer.addClass("section");
                    else sectionContainer.addClass("subsection");
                    tableBody.append($('<tr>').append($('<td colspan="2">').append(sectionContainer)));

                    let anyPropertyShown = false;
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
                    const controlHtmlId = idPrefix + '-' + propertyItem.id;
                    const controlFirst = propertyItem.type.labelControlOrder === Types.labelControlOrders.singleLineContainerLabel ||
                    propertyItem.type.labelControlOrder === Types.labelControlOrders.twoLineContainerLabel ||
                    propertyItem.type.labelControlOrder === Types.labelControlOrders.singleCellContainerLabel;
                    const propertyHeaderLabel = $('<label>', { text: propertyItem.name + (controlFirst ? '' : ':'), 'for': controlHtmlId });
                    const propertyHeader = $('<th>').append(propertyHeaderLabel);

                    const propertyData = $(propertyItem.type.labelControlOrder === 'singleCellContainerLabel' ? '<span>' : '<td>', {
                        id: idPrefix + '-container-' + propertyItem.id,
                        colspan: propertyItem.type.labelControlOrder === Types.labelControlOrders.twoLineLabelContainer || propertyItem.type.labelControlOrder === Types.labelControlOrders.twoLineContainerLabel ? 2 : 1
                    });
                    propertyItem.type.appendControlTo(propertyData, controlHtmlId);
                    propertyItem.type.setInDOM(propertyData, propertyValues[propertyItem.id]);

                    if (propertyItem.type.autoComplete)
                    {
                        if (!propertyItem.autoCompleteList) propertyItem.autoCompleteList = [];
                        propertyItem.type.autoCompleteControl(propertyData, propertyItem.autoCompleteList);
                    }

                    let propertyRow = $('<tr>');
                    let additionalPropertyRow;
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
                        case Types.labelControlOrders.singleCellContainerLabel:
                            propertyRow.append(
                                $('<td>', { colspan: 2 }).append(
                                    propertyData,
                                    propertyHeaderLabel
                                )
                            );
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
            const nodePropertyValuesEl = $('#node-property-values');
            const nodePropertyValuesTable = $('<table>');
            let anyNodePropertyShown = false;
            Config.container.properties.sequence.forEach(function(subItem)
            {
                if (showPropertyItem(node.propertyValues.characterIndependent, scopes, subItem, hStartLevel, nodePropertyValuesTable, nodePropertyValuesEl.attr('id')))
                {
                    anyNodePropertyShown = true;
                }
            });
            nodePropertyValuesEl.append(nodePropertyValuesTable);

            const nodeCharacterPropertyValuesEl = $('#node-character-property-values');
            if (node.type !== Main.computerType || Config.container.characters.sequence.length > 1)
            {
                const characterAccordion = $('<div>');
                nodeCharacterPropertyValuesEl.append(characterAccordion);
                let anyCharacterPropertyShown = false;
                Config.container.characters.sequence.forEach(function(character)
                {
                    const characterHeader = $('<h' + hStartLevel + '>', { value: character.id, text: character.name ? character.name : character.id });
                    const characterTab = $('<table>');
                    characterAccordion.append(characterHeader).append($('<div>').append(characterTab));

                    const containerIdPrefix = nodeCharacterPropertyValuesEl.attr('id') + '-' + character.id;

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
                const updateSideBarCharacterSection = function()
                {
                    let acceptableScopes = ['per-computer-own'];
                    if (Config.container.characters.sequence.length === 1)
                    {
                        acceptableScopes = acceptableScopes.concat(scopes);
                    }

                    // Show the sections for all per-character fixed parameter effects
                    const computerOwnParameterEffectsEl = $("#node-computer-own-parameter-effects");
                    computerOwnParameterEffectsEl.children().remove();
                    const computerOwnParameterEffectsDiv = $('<div>');
                    computerOwnParameterEffectsEl.append(computerOwnParameterEffectsDiv);
                    let anyCharacterParameterShown = false;
                    const classCharacterPrefix = computerOwnParameterEffectsEl.attr('id') + '-' + $.escapeSelector(node.characterIdRef);
                    const idRefToThisCharacterEffectsContainer = {};
                    // The definitions for each parameter need to be available for changing the select,
                    // it can either be a parameter for an individual character or for all the characters,
                    // so we need to merge the definitions into one object and pass it.
                    const characterParameterDefinitions = $.extend({}, Config.container.characters.parameters.byId, Config.container.characters.byId[node.characterIdRef].parameters.byId);
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
                        if (acceptableScopes.includes(characterParameterDefinitions[effect.idRef].scopes.statementScope))
                        {
                            const effectsContainer = idRefToThisCharacterEffectsContainer[effect.idRef];
                            appendEffectContainerTo(effectsContainer, classCharacterPrefix, characterParameterDefinitions);
                            const addedEffectContainer = effectsContainer.children().last();

                            addedEffectContainer.find('.' + classCharacterPrefix + '-effect-idref-select').val(effect.idRef).trigger('change');
                            addedEffectContainer.find('.' + classCharacterPrefix + '-effect-operator-select').val(effect.operator);
                            characterParameterDefinitions[effect.idRef].type.setInDOM(addedEffectContainer.find('.' + classCharacterPrefix + '-effect-control-container'), effect.value);
                        }
                    });

                    const computerOwnPropertyValuesEl = $("#node-computer-own-property-values");
                    computerOwnPropertyValuesEl.children().remove();
                    const computerOwnPropertyValuesTable = $('<table>');
                    computerOwnPropertyValuesEl.append(computerOwnPropertyValuesTable);
                    // The same id prefix as the other character property values, so they can be easily retrieved
                    const containerIdPrefix = nodeCharacterPropertyValuesEl.attr('id') + '-' + node.characterIdRef;
                    let anyPropertyShown = false;
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
                    const characterSelection = $("#characterSelection");
                    characterSelection.off('change');
                    characterSelection.on('change', function()
                    {
                        if (Main.selectedElement)
                        {
                            // Save the changes of the user if the character changed by the user, so we can store them in the new property values and parameter effects
                            applyNodeChanges();

                            const node = Main.nodes[Main.selectedElement];

                            const newCharacterIdRef = $(this).val();

                            const acceptableScopes = ['per', 'per-' + node.type, 'per-computer-own'];

                            const perCharacterParameterEffects = Config.getNewDefaultParameterEffects(newCharacterIdRef).fixed.perCharacter;

                            for (const characterId in node.parameterEffects.fixed.perCharacter)
                            {
                                node.parameterEffects.fixed.perCharacter[characterId].sequence.forEach(function(effect)
                                {
                                    let parameter = Config.container.characters.parameters.byId[effect.idRef];
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
                            const perCharacterPropertyValues = Config.getNewDefaultPropertyValues(acceptableScopes, newCharacterIdRef).perCharacter;
                            for (const characterId in perCharacterPropertyValues)
                            {
                                for (const propertyId in perCharacterPropertyValues[characterId])
                                {
                                    let property = Config.container.characters.properties.byId[propertyId];
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
                            updateNodeGraphics(Main.selectedElement);
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
        const parameterEffect = $('<div>', { class: "parameter-effect" });
        parameterEffect.append($('<span>', { class: "handle", text: '↕' }));
        const idRefSelect = $('<select>', { class: "parameter-idref-select" });
        parameterEffect.append(idRefSelect);
        const effectContainer = $('<span>', { class: "parameter-effect-container" });
        parameterEffect.append(effectContainer);
        parameterEffect.append(Parts.deleteButton());
        $("#userDefinedParameterEffects").append(parameterEffect);

        Parameters.insertInto(idRefSelect);
        const changeEffectType = function(pId)
        {
            const operatorSelect = $('<select>', { class: "parameter-effect-operator-select" });
            Parameters.container.byId[pId].type.assignmentOperators.forEach(function(op)
            {
                operatorSelect.append($('<option>', { value: op.name, text: op.uiName }));
            });
            effectContainer.append(operatorSelect);

            const controlContainer = $('<span>', { class: "parameter-effect-value-container" });
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
        const sourceNode = Main.nodes[sourceID];
        const targetNode = Main.nodes[targetID];

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
        const firstChildId = getFirstChildIdOrNull(sourceID);
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
        const connections = Main.getPlumbInstanceByNodeID(sourceId).getConnections({ source: sourceId });
        return connections.length === 0 ? null : connections[0].targetId;
    }

    // Make .collapsable div sections collapse and expand when .clickable sibling element is clicked
    function makeCollapsable()
    {
        // Set the initial state of collapsable and clickable elements:
        $(".collapsable").css("display", "block");
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
                let result = 0;
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
                const clickTag = $(this).find(".clicktag");
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

        const zoomedTree = Zoom.getZoomed();
        if (!zoomedTree) return null;

        const treeDiv = zoomedTree.div;
        const leftBound = treeDiv.offset().left;
        const upperBound = treeDiv.offset().top;
        const rightBound = leftBound + treeDiv.width();
        const lowerBound = upperBound + treeDiv.height();

        if (!(mousePos.x >= leftBound && mousePos.x < rightBound &&
            mousePos.y >= upperBound && mousePos.y < lowerBound))
        {
            return null;
        }

        return SnapToGrid.roundPosition({
            left: mousePos.x - leftBound + treeDiv.scrollLeft(),
            top: mousePos.y - upperBound + treeDiv.scrollTop()
        });
    }

    function isEditingInCanvas()
    {
        const inModal = $(document.body).children(".ui-widget-overlay.ui-front").length > 0;
        return !inModal && window.getSelection().isCollapsed &&
            ($("#main").closest(document.activeElement).length > 0 || document.activeElement === null);
    }

    function isMousePositionWithinEditingCanvas()
    {
        const zoomedTree = Zoom.getZoomed();
        const canvas = zoomedTree ? zoomedTree.div : $("#main");
        const offset = canvas.offset();
        const width = canvas.width();
        const height = canvas.height();
        return Main.mousePosition.x >= offset.left &&
            Main.mousePosition.y >= offset.top &&
            Main.mousePosition.x < offset.left + width &&
            Main.mousePosition.y < offset.top + height;
    }

    function updateDocumentTitle()
    {
        const savedIndicator = SaveIndicator.getSavedChanges() ? "" : "• ";
        const scenarioTitle = Metadata.container.name !== "" ? Metadata.container.name + " - " : "";
        document.title = savedIndicator + scenarioTitle + "Scenario Editor";
    }
})();
