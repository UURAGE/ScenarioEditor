/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

var Main;

(function()
{
    "use strict";

    var gridX,
        gridY;

    Main =
    {
        nodes: {},
        selectedElement: null,
        selectedElements: [],
        jsPlumbCounter: 0,
        computerType: "computer",
        playerType: "player",
        situationType: "situation",
        trees: {},
        maxTreeNumber: 0,
        gridX: gridX,
        gridY: gridY,
        unsavedChanges: false,
        //Functions
        addNewNode: addNewNode,
        addNewTree: addNewTree,
        applyChanges: applyChanges,
        changeNodeText: changeNodeText,
        createChildNode: createChildNode,
        createEmptyTree: createEmptyTree,
        createAndReturnNode: createAndReturnNode,
        dehighlightParents: dehighlightParents,
        deleteAllSelected: deleteAllSelected,
        deselectConnection: deselectConnection,
        getGridIndicatorPosition: getGridIndicatorPosition,
        getPlumbInstanceByNodeID: getPlumbInstanceByNodeID,
        getStartNodeIDs: getStartNodeIDs,
        highlightParents: highlightParents,
        makeConnection: makeConnection,
        placeNewNode: placeNewNode,
        selectElements: selectElements,
        selectElement: selectElement,
        selectNode: selectNode,
        updateButtons: updateButtons
    };

    var ctrlDown = false, spaceDown = false, isSelecting = false, isPanning = false,
        invalidateNodeClick = false;//a drag event also triggers a click event, use this flag to catch and stop these events

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
                .on("mouseup", function(e)
                {
                    isPanning = false;
                })
                .on("mousemove", function(e)
                {
                    if (!isPanning) return;
                    if (spaceDown)
                    {
                        position = [e.clientX, e.clientY];
                        difference = [ position[0]-lastPosition[0], position[1]-lastPosition[1] ];
                        $(this).scrollLeft( $(this).scrollLeft() - difference[0] );
                        $(this).scrollTop( $(this).scrollTop() - difference[1] );
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

    $(document).ready(function()
    {
        makeCollapsable();

        MiniMap.initialise();

        updateButtons();

        $("#main").focus();

        initialiseMenuBar();

        initialiseGrid();

        if (Config.container.characters.sequence.length > 1)
        {
            var characterSelection = $("#characterSelection");
            Config.container.characters.sequence.forEach(function (character)
            {
                characterSelection.append($("<option>", { value: character.id, text: character.name ? character.name : character.id }));
            });
        }
        else
        {
            $("#characterSelection").remove();
        }

        var scenarioNameInput = $('<input type="text" maxlength="35">');
        var scenarioNameInputSpan = $('<span>', { class: "scenarioNameInput" }).append(scenarioNameInput);
        scenarioNameInputSpan.on('focusout', function(e, cancel)
        {
            KeyControl.hotKeysActive = true;

            var nameInput = $('#scenarioNameTab .scenarioNameInput input');

            if(!cancel)
            {
                var inputName = Metadata.formatScenarioName(nameInput.val());
                Metadata.container.name = inputName;
                $('#scenarioNameTab .scenarioName').text(Metadata.container.name);
            }

            $(this).hide();
            $('#scenarioNameTab .scenarioName').show();
        });
        scenarioNameInputSpan.on('keydown', function(e)
        {
            if(e.keyCode === 13)// enter
            {
                $(this).trigger('focusout',[false]);
            }
            if(e.keyCode === 27)// escape
            {
                $(this).trigger('focusout',[true]);
            }
        });
        scenarioNameInputSpan.hide();

        $('#scenarioNameTab').append(scenarioNameInputSpan);

        $('#scenarioNameTab .scenarioName').on('dblclick', function(e)
        {
            KeyControl.hotKeysActive = false;

            $(this).hide();

            var nameInputSpan = $('#scenarioNameTab .scenarioNameInput');
            var nameInput = nameInputSpan.children('input');
            nameInput.val(Metadata.container.name);
            nameInputSpan.show();
            nameInput.focus();
        });

        //handle movement of the div indicating which grid cell youre hovering over
        $('#main').on('mousemove', function(e)
        {
            var mainPos = $("#main").offset();

            Utils.cssPosition($("#gridIndicator"),
            {
                "top":  gridPos(e.pageY - mainPos.top  + $("#main").scrollTop(),  Main.gridY),
                "left": gridPos(e.pageX - mainPos.left + $("#main").scrollLeft(), Main.gridX)
            });
        });

        $('#main').on('dblclick', function()
        {
            if(!Zoom.isZoomed())
                addNewTree();
        });
        $('#newTree').on('mousedown', function(e)
        {
            selectElement(null);

            e.preventDefault(); // Prevent selecting text
            var text = "[+" + i18next.t('common:subject') + "]";

            Zoom.zoomOut();

            DragBox.startDragging(e, text, function(pos)
            {
                return addNewTree();
            });
        });
        $('#newComputerNode').on("mousedown", function(e)
        {
            selectElement(null);

            e.preventDefault(); // Prevent selecting text
            var text = "[+" + i18next.t('common:computer') + "]";

            if (!Zoom.isZoomed())
            {
                DragBox.showError(e, i18next.t('main:no_subject_open'));
                return;
            }

            DragBox.startDragging(e, text, function(pos)
            {
                placeNewNode(Main.computerType, pos);
                return true;
            });
        });
        $('#newPlayerNode').on("mousedown", function(e)
        {
            selectElement(null);

            e.preventDefault(); // Prevent selecting text
            var text = "[+" + i18next.t('common:player') + "]";

            if (!Zoom.isZoomed())
            {
                DragBox.showError(e, i18next.t('main:no_subject_open'));
                return;
            }

            DragBox.startDragging(e, text, function(pos)
            {
                placeNewNode(Main.playerType, pos);
                return true;
            });
        });
        $('#newSituationNode').on("mousedown", function(e)
        {
            selectElement(null);

            e.preventDefault(); // Prevent selecting text
            var text = "[+" + i18next.t('common:situation') + "]";

            if (!Zoom.isZoomed())
            {
                DragBox.showError(e, i18next.t('main:no_subject_open'));
                return;
            }

            DragBox.startDragging(e, text, function(pos)
            {
                placeNewNode(Main.situationType, pos);
                return true;
            });
        });
        $("#newChildNode").on('click', function(e)
        {
            createChildNode();
        });
        $("#deleteNode").on('click', function()
        {
            deleteAllSelected();
        });
        $("#allParents").on('click', function()
        {
            if ($(this).hasClass("enabled"))
            {
                $(this).removeClass("enabled");
                dehighlightParents();
            }
            else
            {
                $(this).addClass("enabled");
                highlightParents(Main.selectedElement);
            }

            $("#main").focus();
        });

        $("#userDefinedParameterEffects").sortable({
            handle: ".handle",
            axis: "y",
            forceHelperSize: true
        });

        $("#main").on('mouseenter', function()
        {
            $("#gridIndicator").show();
        });

        $("#main").on('mouseleave', function()
        {
            //$("#gridIndicator").hide();
        });

        $("#main").on('click', function(e)
        {
            $(this).focus();
            if (e.target == this)
            {
                selectElement(null);
            }
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
            ctrlDown = event.ctrlKey;
        });
        $("#main").on('selectablestart', function()
        {
            $(this).focus();
            // Make sure no node is selected when we start selecting.
            if (!ctrlDown)
            {
                Main.selectedElements = [];
                selectElement(null);
            }
        });
        $("#main").on('selectableselected', function(event, element)
        {
            // Add all selected nodes to a array.
            var id = element.selected.id;

            //zoomed, select nodes
            if (Zoom.isZoomed())
            {
                if(!(id in Main.trees))
                {
                    Main.selectedElements.push(id);

                    Zoom.getZoomed().plumbInstance.addToDragSelection(element.selected);
                }
            }
            else
            {
                if(id in Main.trees)
                {
                    Main.selectedElements.push(id);
                }
            }
        });
        $("#main").on('selectablestop', function()
        {
            // If there's only one node selected, show the node.
            if (Main.selectedElements.length === 1)
                selectElement(Main.selectedElements[0]);

            MiniMap.update(true);
        });

        $("#closeTabDock").on('click', function()
        {
            $('#tabDock').hide();
            $("#main").focus();
        });

        $(document).on('keydown', function(e)
        {
            if (e.which === 8 && !$(e.target).is('input, textarea'))
            {
                e.preventDefault();
            }
        });

        Metadata.reset();

        initialiseSidebar();
    });

    $(window).on('beforeunload', function()
    {
        // confirmation for leaving the page
        if (Main.unsavedChanges)
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

    $(window).on('keyup', function(e) {
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
            // Let the button's regular click handler close the button's own menu
            // (closing it here would cause the click handler to open it again)
            if (e && (e.target == dropdownButton[0] || $.contains(dropdownButton[0], e.target))) return;

            closeMenu.call(dropdownButton);
        };

        // The following functions use this instead of an argument so they can be
        // used as event handlers without wrapping.
        // The non-jQuery capturing event handler ensures all clicks are handled.

        closeMenu = function()
        {
            $(this).removeClass("dropped");
            $(this).closest(".dropdown").find(".dropdownItems").hide();
            document.removeEventListener("click", closeOpenMenu, true);
            buttons.off("mouseenter", openMenu);
        };

        openMenu = function()
        {
            if ($(this).hasClass("dropped")) return;
            closeOpenMenu();
            $(this).addClass("dropped");
            $(this).closest(".dropdown").find(".dropdownItems").show();
            document.addEventListener("click", closeOpenMenu, true);
            buttons.on("mouseenter", openMenu);
        };

        buttons.on("click", function()
        {
            var handler = $(this).hasClass("dropped") ? closeMenu : openMenu;
            handler.call(this);
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
              {  // Chrome
                window.getSelection().empty();
              }
              else if (window.getSelection().removeAllRanges)
              {  // Firefox
                window.getSelection().removeAllRanges();
              }
            }
            else if (document.selection)
            {  // IE?
              document.selection.empty();
            }

            var parentOffset = $(this).offset();
            mouseX = (event.pageX - parentOffset.left) / 2;
            $(document).on("mousemove", mouseMoveHandler);
            $(document).on("mouseup", mouseUpHandler);
            $('#sidebar').addClass('dragging');
        });

        $(domSidebarGrip).dblclick(function(event)
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
            Main.unsavedChanges = true;
        }

        var treeDiv = $('<div>', { class: "treeDiv" });

        treeDiv.on("click", function(e)
        {
            $(this).focus();
            if (e.target == this)
            {
                selectElement(null);
                Main.trees[id].plumbInstance.clearDragSelection();
            }
        });

        treeDiv.selectable(
        {
            distance: 5,
            filter: ".w", // Only select the nodes.
            appendTo: treeDiv,
            start: function( event, ui )
            {
                isSelecting = true;
            },
            stop: function( event, ui )
            {
                isSelecting = false;
            }
        });
        treeDiv.selectable('disable'); //box selection only useful in zoomed state
        treeDiv.attachDragger();

        var defaultName = i18next.t('main:default_subject');
        var changeNameInput = $('<input type="text" class="subjectNameInput" maxlength="20">');
        changeNameInput.val(defaultName);
        changeNameInput.hide();
        changeNameInput.on('focusout', function(e, cancel)
        {
            KeyControl.hotKeysActive = true;

            var subDiv = $("#"+id);
            var subjectName = subDiv.find('.subjectName').show();
            var input = subDiv.find('.subjectNameInput').hide();

            if(cancel)
            {
                subjectName.text(Main.trees[id].subject);
                input.text(Main.trees[id].subject);
                input.val(Main.trees[id].subject);
            }
            // Save subject on defocus of textbox
            else
            {
                Main.trees[id].subject = input.val();
                subjectName.text(Main.trees[id].subject);
            }

            updateSideBar();
        });
        changeNameInput.on('keydown', function(e)
        {
            if(e.keyCode === 13) // enter
            {
                changeNameInput.trigger('focusout', [false]);
                $("#main").focus();
            }
            if(e.keyCode === 27) // escape
            {
                changeNameInput.trigger('focusout', [true]);
                $("#main").focus();
            }
        });

        var zoomTreeButton = $('<div>',{text:"[+]", class:"zoomTreeButton button"});
        zoomTreeButton.on("click", function()
        {
            if(!DragBox.dragging())
            {
                // open/close tree
                Main.trees[id].subject = changeNameInput.val();
                $("#"+id).find('.subjectName').text(Main.trees[id].subject);
                Zoom.toggleZoom(Main.trees[id]);
                MiniMap.update(true);
            }
        });

        var inputSpan = $('<span>');
        inputSpan.append(changeNameInput);

        var subjTextSpan = $('<span>',{text: defaultName, class:"subjectName"});
        var subjSpan = $('<span>', { class: "subjectNameSpan noSelect" });
        subjSpan.prepend(zoomTreeButton);
        subjSpan.append(subjTextSpan);
        subjSpan.append(inputSpan);

        var subjectDiv = $('<div>', {class:"subjectDiv"});
        subjectDiv.append(subjSpan);

        subjectDiv.on("click", function(e)
        {
            e.stopPropagation();

            if (Main.selectedElement === id)
                return;
            if (e.ctrlKey)
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

        var dragDiv = $('<div>', {class: "w treeContainer gridded selectable", id: id});
        dragDiv.append($('<div>').append(subjectDiv));
        dragDiv.append($('<div>').append($('<div>').append(treeDiv)));

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
            leftPos: leftPos, //necessary to return to the right spot after zooming out
            topPos: topPos, //left and topPos are in grid coordinates (if leftPos == 2 screen pos == 2*gridX)
            leftScroll: 0, //necessary to zoom in to the spot on the graph where last zoomed out
            topScroll: 0,
            level: topPos,
            nodes: [],
            selectedConnections: {}, // The keys for this object are the connection ids
            plumbInstance: PlumbGenerator.genJsPlumbInstance(treeDiv)
        };

        //(x,y) of upper left of containment and (x,y) of lower right
        jsPlumb.draggable(dragDiv,
        {
            filter: ".zoomTreeButton",

            //the constrain function retuts the array with coordinates that will be assigned to the dragged element
            constrain: function(currentCoordinates,element){
                return [currentCoordinates[0],Math.max(0,currentCoordinates[1])];
            },

            start: function(event)
            {
                if(Main.selectedElements[0]!==id)
                    selectTree(id);
            },

            stop:function(event)
            {
                treeDropHandler(event, id);
            }
        }); //we cannot use the built in grid functionality because it doesnt allow to drag "outside" the graph area to expand it

        // Attach minimap scroll event listener to treeDiv
        MiniMap.attachScrollListener(treeDiv);

        return Main.trees[id];
    }

    function addNewTree()
    {
        Zoom.zoomOut();

        var indicatorPos = getGridIndicatorPosition();
        if (!checkGridAvailable(indicatorPos.left, indicatorPos.top)) return null;

        var tree = createEmptyTree(null, indicatorPos.left, indicatorPos.top);
        selectTree(tree.id);
        triggerSubjectNameInput(tree.id, true);

        return tree;
    }

    // Add a new node with the given type.
    function addNewNode(type, triggerEdit, text)
    {
        Main.unsavedChanges = true;

        var container = $(".selected.treeContainer");

        if (container.length === 0)
        {
            var zoomedTree = Zoom.getZoomed();
            if (zoomedTree) container = zoomedTree.dragDiv;
        }

        if (container.length === 0)
        {
            return null; //no selected or zoomed in tree container
        }

        var node = createAndReturnNode(type, null, container.find('.treeDiv'), container.attr('id'));

        container.focus();

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
            var timeEffect = {
                idRef: 't',
                operator: "addAssign",
                value: 1
            };
            parameterEffects.userDefined.push(timeEffect);
        }

        var acceptableScopes = ['per', 'per-' + type];
        if (type === Main.computerType) acceptableScopes.push('per-computer-own');

        Main.nodes[id] = {
            text: text ? text : "",
            type: type,
            parameterEffects: parameterEffects,
            preconditions:
            {
                type: "alwaysTrue",
                preconditions: []
            },
            propertyValues:  Config.getNewDefaultPropertyValues(acceptableScopes, characterIdRef),
            comment: "",
            endNode: false,
            allowDialogueEndNode: false,
            allowInterleaveNode: false,
            visited: false,
            topologicalRank: 0,
            id: id,
            parent: container.attr("id")
        };

        if (type === Main.computerType) Main.nodes[id].characterIdRef = characterIdRef;

        // Always select the node after the creation.
        selectElement(id);

        if (triggerEdit && Zoom.isZoomed())
            node.trigger("dblclick");
        return Main.nodes[id];
    }

    // Creates a new node and places it on the specified position (within canvas bounds)
    function placeNewNode(nodeType, pos)
    {
        selectElement(null);
        // create a node of the right type
        var node = addNewNode(nodeType, true);

        // node is undefined if there is no zoomed .TreeContainer
        if (node === undefined) return;

        // the canvas is open; get the canvas div
        var treeDiv = Zoom.getZoomed().div;
        // calculate canvas boundaries
        var leftBound = treeDiv.offset().left;
        var rightBound = leftBound + treeDiv.width();
        var upperBound = treeDiv.offset().top;
        var underBound = upperBound + treeDiv.height();
        // get mouseposition
        var posL = pos.left;
        var posT = pos.top;
        // check mouse inbetween boundaries
        var nodeL = posL-leftBound+treeDiv.scrollLeft();
        var nodeT = posT-upperBound+treeDiv.scrollTop();

        if (!(leftBound < posL && posL < rightBound && upperBound < posT && posT < underBound) )
        {
            // clamp funtion
            var clamp = function(val, min, max){
                if(val <= min)
                    return min;
                else if(max <= val)
                    return max;
                else return val;
            };
            // clamp within boundaries
            var m2L = clamp(posL,leftBound, rightBound-75);
            nodeL = m2L-leftBound+treeDiv.scrollLeft();
            var m2T = clamp(posT,upperBound, underBound-50);
            nodeT = m2T-upperBound+treeDiv.scrollTop();
        }
        $('#'+node.id).css({top:nodeT,left:nodeL, width:"128px"});

        Main.trees[node.parent].plumbInstance.updateOffset({elId:node.id, recalc:true});
        Main.trees[node.parent].plumbInstance.repaint(node.id, null, 0);
    }

    function createChildNode(event)
    {
        // Check if a parent node is selected
        if(Main.selectedElement !== null && Main.selectedElement in Main.nodes)
        {
            var parent = Main.nodes[Main.selectedElement];
            var node;
            switch(parent.type)
            {
                case Main.playerType:
                    node = addNewNode(Main.computerType, true);
                    break;
                case Main.computerType:
                    node = addNewNode(Main.playerType, true);
                    break;
                case Main.situationType:
                    node = addNewNode(Main.playerType, true);
                    break;
            }

            // If there are errors (cycles, invalid pairs, existing connections)
            // regarding the connection to be created, delete the new node and cancel.

            var connection = makeConnection(parent.id, node.id, Zoom.getZoomed().plumbInstance);

            if (!connection)
            {
                deleteNode(node.id);
                return;
            }

            // Reposition the new node
            var nodeDiv = $('#'+node.id);
            var parentDiv = $('#'+parent.id);
            var parentPosition = Utils.cssPosition(parentDiv);
            Utils.cssPosition(nodeDiv, {
                "top": parentPosition.top + parentDiv.height() + 55,
                "left": parentPosition.left
            });

            Zoom.getZoomed().plumbInstance.revalidate(node.id, 0);
        }
    }

    // Creates a node, adds it to the html and returns the html of the node.
    function createAndReturnNode(type, id, parent, parentID)
    {
        if (id === null)
        {
            Main.jsPlumbCounter++;
            id = "edit_" + Main.jsPlumbCounter;
        }

        Main.trees[parentID].nodes.push(id);
        var plumbInstance = Main.trees[parentID].plumbInstance;

        // Add the node to the html.
        var node = $('<div>', { id: id, class: 'w ' + type });
        node.append( $('<div>', { class: "ep" }));

        var inputDiv =  $('<div>', { class: "statementInput" });
        node.append(inputDiv);

        var textDiv = $('<div>', { class:"statementText" });
        node.append(textDiv);

        node.append($('<div>', { class:'imgDiv' }));

        parent.append(node);

        node.on('dblclick', function(e)
        {
             startEditingNode(id);
        });

        Utils.cssPosition(node,
        {
            "top": parent.scrollTop(),
            "left": parent.scrollLeft()
        });

        // initialise draggable elements.
        plumbInstance.draggable(node,
        {
            constrain: function(currentCoordinates,element){
                return [Math.max(0, currentCoordinates[0]),Math.max(0,currentCoordinates[1])];
            },

            start: function(event)
            {
                invalidateNodeClick = true;
                if(Main.selectedElement === null)
                {
                    if(Main.selectedElements.indexOf(id) === -1)
                        selectElement(id);
                }
                else
                {
                    if(Main.selectedElement !== id)
                        selectElement(id);
                }
            }
            //we do not set invalidateNodeClick in a stop handler since it fires before the click handler
        });

        // make each ".ep" div a source
        plumbInstance.makeSource(node,
        {
            filter: ".ep"
        });

        // initialise all '.w' elements as connection targets.
        plumbInstance.makeTarget(node,
        {
            dropOptions:
            {
                hoverClass: "dragHover"
            }
        });

        // Make the node selected when we click on it.
        node.on("click", function(event)
        {
            event.stopPropagation();
            if(invalidateNodeClick)
            {
                invalidateNodeClick = false;
                return;
            }
            if (Main.selectedElement === id)
                return;
            if (event.ctrlKey)
            {
                KeyControl.ctrlClickOnElement(id);
            }
            else
            {
                selectElement(id);
            }
        });

        return node;
    }

    function startEditingNode(nodeID)
    {
        var node = Main.nodes[nodeID];
        var nodeDiv = $('#' + node.id);
        var inputDiv = nodeDiv.find('.statementInput');
        var textDiv = nodeDiv.find('.statementText');

        nodeDiv.off('dblclick');
        node.editing = true;

        var text = node.text ? node.text : "";

        KeyControl.hotKeysActive = false;

        // Make sure the text fits inside the node
        // Retrieve the height before the div becomes invisible
        var height = textDiv.height();
        textDiv.hide();
        inputDiv.show();

        var txtArea = $('<textarea>',
        {
            class: "nodestatement",
            maxlength: Config.container.settings.statement.type.maxLength,
            text: Config.container.settings.statement.type.defaultValue
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

        txtArea.on('focusout', function(e)
        {
            if (!txtArea.data('ui-tooltip') || txtArea.tooltip( "option", "disabled" ))
            {
                stopEditingNode(node.id, false);
            }
        });

        txtArea.on('keydown', function(e)
        {
            if(e.ctrlKey && e.keyCode === 13) // enter
            {
                stopEditingNode(node.id, false);
            }
            if(e.keyCode === 27) // escape
            {
                stopEditingNode(node.id, true);
            }
        });

        inputDiv.append(txtArea);

        // Disable dragging for this component
        getPlumbInstanceByNodeID(node.id).setDraggable(nodeDiv, false);

        // Make room for typing text in the node
        nodeDiv.height(height + 35);
        if (nodeDiv.width() < 128) nodeDiv.width(128);

        inputDiv.height("100%");

        // Fill node with current node text
        txtArea.val(text);
        txtArea.focus();

        if (Config.container.settings.statement.type.markdown) Utils.attachMarkdownTooltip(txtArea);
    }

    function stopEditingNode(nodeID, cancel)
    {
        var node = Main.nodes[nodeID];
        if (!node.editing) return;

        // Turn hotkeys on again (they are turned off while typing in the node)
        KeyControl.hotKeysActive = true;

        var nodeDiv = $('#' + node.id);
        var inputDiv = nodeDiv.find('.statementInput');
        var textDiv = nodeDiv.find('.statementText');
        var textArea = nodeDiv.find('.nodestatement');

        var text = textArea.val();
        inputDiv.empty();
        inputDiv.hide();
        textDiv.show();

        if (!cancel) node.text = text;

        changeNodeText(node.id);

        //Enable dragging for this component
        getPlumbInstanceByNodeID(node.id).setDraggable(nodeDiv, true);

        nodeDiv.on('dblclick', function(e)
        {
            startEditingNode(node.id);
        });
        node.editing = false;
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
            if (connections.length === 0)
                orphanNodes.push(nodeID);
        });
        return orphanNodes;
    }

    function triggerSubjectNameInput(id, selectAllInput)
    {
        KeyControl.hotKeysActive = false;

        // hide subject name span and show textbox
        var subDiv = $("#"+id);
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
            // Suspend the jsplumb instance that handles the tree containers
            jsPlumb.batch(function()
            {
                for (var i = 0; i < Main.selectedElements.length; i++)
                {
                    deleteElement(Main.selectedElements[i]);
                }
                if (Main.selectedElement !== null)
                {
                    deleteElement(Main.selectedElement);
                }
                Main.selectedElements = [];
            }, true);
        }
        // If there is a tree zoomed and if there are selected connections, delete them
        else if (Zoom.isZoomed())
        {
            zoomedTree = Zoom.getZoomed();
            for (var connectionId in zoomedTree.selectedConnections)
            {
                var c = zoomedTree.plumbInstance.getConnections(
                {
                    source: zoomedTree.selectedConnections[connectionId].source,
                    target: zoomedTree.selectedConnections[connectionId].target
                });
                delete zoomedTree.selectedConnections[connectionId];

                // Pick the first element in the array, because connections are unique
                // and detach it
                zoomedTree.plumbInstance.detach(c[0]);
            }
        }

        zoomedTree = Zoom.getZoomed();
        if (zoomedTree) zoomedTree.plumbInstance.repaintEverything();
        MiniMap.update(true);
    }

    function selectElements(elementIds)
    {
        if (elementIds.length == 1)
        {
            selectElement(elementIds[0]);
        }
        else
        {
            selectElement(null);
            Main.selectedElements = elementIds.slice();
            elementIds.forEach(function (elementId)
            {
                $("#" + elementId).addClass("ui-selected");
                if (elementId in Main.nodes) Main.getPlumbInstanceByNodeID(elementId).addToDragSelection(elementId);
            });
        }
    }

    function selectElement(elementId)
    {
        if (elementId in Main.trees)
            selectTree(elementId);
        else
            selectNode(elementId);

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
        if (zoomedTree) zoomedTree.plumbInstance.clearDragSelection();
        dehighlightParents();

        // Change the selected node.
        Main.selectedElement = nodeID;

        // Only make a node selected if it isn't null.
        if (Main.selectedElement !== null)
        {
            $("#" + Main.selectedElement).addClass("selected");
            Main.selectedElements.push(Main.selectedElement);
            $("#" + nodeID).addClass("ui-selected");
            if ($("#allParents").hasClass("enabled"))
                highlightParents(nodeID);
        }
        else if ($("#allParents").hasClass("enabled"))
        {
            $("#allParents").removeClass("enabled");
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
        if(cs.length > 0)
        {
            // Pick the first element in the array, because connections are unique
            // and give the original color back to the connection
            cs[0].setPaintStyle({strokeStyle:"#5c96bc"});
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
        else
        {
            if ($("#allParents").hasClass("enabled"))
            {
                $("#allParents").removeClass("enabled");
            }
        }
    }
    function hideButtons(buttons)
    {
        for (var i = 0, len = buttons.length; i < len; i++) {
            buttons[i].disabled = true;
        }
    }
    function showButtons(buttons)
    {
        for (var i = 0, len = buttons.length; i < len; i++){
            buttons[i].disabled = false;
        }
    }

    function applyChanges()
    {
        if (Main.selectedElement in Main.trees)
            applyTreeChanges();
        else
            applyNodeChanges();
    }

    // Apply the changes that have been made to the node.
    function applyNodeChanges()
    {
        if (Main.selectedElement === null) return; // No node selected, so do nothing.

        Main.unsavedChanges = true;

        // Get the selected node.
        var node = Main.nodes[Main.selectedElement];
        node.parameterEffects = Config.getNewDefaultParameterEffects(node.characterIdRef);

        // Save user-defined parameter effects.
        $("#userDefinedParameterEffects").children().each(function()
        {
            node.parameterEffects.userDefined.push(ObjectGenerator.effectObject($(this)));
        });

        // Save fixed parameter effects.
        var getFixedParameterEffectFromDOMAndSetInNode = function(effectContainer, parameterDefinitions, fixedParameterEffects, classPrefix)
        {
            var parameterIdRef = $(effectContainer).find('.' + Utils.escapeSelector(classPrefix) + '-effect-idref-select').val();
            var controlContainer = $(effectContainer).find('.' + Utils.escapeSelector(classPrefix) + '-effect-control-container');
            var parameterValue = parameterDefinitions[parameterIdRef].type.getFromDOM(controlContainer);
            var parameterOperator = $(effectContainer).find('.' + Utils.escapeSelector(classPrefix) + '-effect-operator-select').val();
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
            fixedCharacterParameterEffectsEl.find('.' + Utils.escapeSelector(classCharacterPrefix) + '-effect-container').each(function()
            {
                getFixedParameterEffectFromDOMAndSetInNode(this, parameterDefinitions, node.parameterEffects.fixed.perCharacter[characterId], classCharacterPrefix);
            });
        }
        if (node.type === Main.computerType)
        {
            var computerOwnParameterEffectsEl = $("#node-computer-own-parameter-effects");
            classCharacterPrefix = computerOwnParameterEffectsEl.attr('id') + '-' + node.characterIdRef;
            parameterDefinitions = $.extend({}, Config.container.characters.parameters.byId, Config.container.characters.byId[node.characterIdRef].parameters.byId);
            computerOwnParameterEffectsEl.find('.' + Utils.escapeSelector(classCharacterPrefix) + '-effect-container').each(function()
            {
                getFixedParameterEffectFromDOMAndSetInNode(this, parameterDefinitions, node.parameterEffects.fixed.perCharacter[node.characterIdRef], classCharacterPrefix);
            });
        }

        // Save preconditions.
        node.preconditions = ObjectGenerator.preconditionObject($("#preconditionsDiv").children().first());

        // Save property values.
        var acceptableScopes = ['per', 'per-' + node.type];
        if (node.type === Main.computerType) acceptableScopes.push('per-computer-own');

        var getPropertyFromDOMAndSetInNode = function(property, propertyValues, idPrefix, nodeCharacterIdRef, characterId)
        {
            if (acceptableScopes.indexOf(property.scopes.statementScope) === -1) return;
            if (property.scopes.statementScope === 'per-computer-own' && (!characterId || characterId !== nodeCharacterIdRef)) return;
            propertyValues[property.id] = property.type.getFromDOM($('#' + Utils.escapeSelector(idPrefix) + "-container-" + Utils.escapeSelector(property.id)));

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

    function highlightParents(nodeID)
    {
        if (nodeID === null) return;

        var connections = Main.getPlumbInstanceByNodeID(nodeID).getConnections(
        {
            target: nodeID
        });

        for (var i = 0; i < connections.length; i++)
        {
            if (!$("#" + connections[i].sourceId).hasClass(
                    "parentSelected"))
            {
                $("#" + connections[i].sourceId).addClass(
                    "parentSelected");
                highlightParents(connections[i].sourceId);
            }
        }
    }


    function dehighlightParents()
    {
        $(".parentSelected").removeClass("parentSelected");
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

    //keeps the tree's position up to date for zooming out. handles snapping to grid
    function treeDropHandler(event, id)
    {
        Main.unsavedChanges = true;

        var tree = Main.trees[id];

        if (Zoom.isZoomed(id)) //when someone drags a node, the dragstop event is also captured by the tree conatiner. only an issue when zoomed in because it erases the coordinates to return to post zoom
            return;

        var position = Utils.cssPosition($("#gridIndicator"));
        var gridLeftPos = Math.round(position.left / Main.gridX);
        var gridTopPos = Math.round(position.top / Main.gridY);

        //make sure no trees can be dragged on top of each other
        if(checkGridAvailable(gridLeftPos, gridTopPos))
        {
            Utils.cssPosition(tree.dragDiv,
            {
                "top": gridTopPos*Main.gridY,
                "left": gridLeftPos*Main.gridX
            });

            tree.leftPos = gridLeftPos; //store position to return to this point when zoomed in and out again
            tree.topPos = gridTopPos;
            tree.level = Math.round(tree.topPos); //trees have a conversation level. trees on the same level are interleaved. trees on different levels are sequenced from top to bottom (low y to high y)

            MiniMap.update(true);
        }
        else
        {
            Utils.cssPosition(tree.dragDiv,
            {
                "top": tree.topPos*Main.gridY,
                "left": tree.leftPos*Main.gridX
            });
        }
    }

    function checkGridAvailable(gridX, gridY)
    {
        var available = true;

        $.each(Main.trees, function(id, tree)
        {
            available = available && !(tree.leftPos === gridX && tree.topPos === gridY);
        });

        return available;
    }

    function getGridIndicatorPosition()
    {
        var position = Utils.cssPosition($("#gridIndicator"));
        return {
            "left": Math.round(position.left / Main.gridX),
            "top": Math.round(position.top / Main.gridY)
        };
    }

    // Transforms a free position to a grid position
    // (finds the greatest multiple of gridSize less than freePos)
    function gridPos(freePos, gridSize)
    {
        // The grid positions refer to the upper left corners of the cells, we want to find
        // not the closest upper left corner but the cell that contains the position
        return Math.floor(freePos / gridSize) * gridSize;
    }

    function selectTree(id)
    {
        if (Main.selectedElement !== null)
        {
            applyChanges();
        }

        var dragDiv = Main.trees[id].dragDiv;
        if (Zoom.isZoomed(id))
        { //cancel select if the tree is zoomed to prevent acidental deletion and duplication of trees.
            selectElement(null);
            return;
        }
        var clone = $("#clone");
        if (clone.length !== 0)
        { //jsplumb creates clones when nodes are being dragged. if one exists this event is on drop of a node and should not fire
            return;
        }

        $(".selected").removeClass("selected");
        $(".ui-selected").removeClass("ui-selected");
        Main.selectedElements = [];

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
                // for computerType node: just input text
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
                // for playerType node: show text input
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
        var width = Math.max(3, textLength * 1.08, Math.sqrt(text.length));

        // get the node
        var nodeHTML = $('#' + nodeID);
        // fill div that can hold the images that visualize if the node has certain settings
        var imageDiv = nodeHTML.find('.imgDiv');
        imageDiv.empty();
        var appendNodePropertyImage = function(imgName)
        {
            imageDiv.append($('<img>', { src: editor_url + "png/node_properties/" + imgName + ".png" }));
        };

        if (node.comment) appendNodePropertyImage("node_has_comments");
        if (node.allowInterleaveNode) appendNodePropertyImage("node_has_jump");
        if (node.allowDialogueEndNode) appendNodePropertyImage("node_has_premature_end");
        if (node.endNode) appendNodePropertyImage("node_has_end");

        // add the text and imageDiv to the node itself
        // apply text changes
        nodeHTML.width(width + "em");
        var nodeTextDiv = nodeHTML.find('.statementText');
        nodeTextDiv.show();
        nodeTextDiv.html(text);

        // make sure the text fits inside the node
        var h = nodeTextDiv[0].clientHeight;
        nodeHTML.height(h);

        Main.trees[node.parent].plumbInstance.updateOffset({elId:nodeID, recalc:true});
        Main.trees[node.parent].plumbInstance.repaint(nodeID, null, 0);

        // Add the allowInterleaveNode class to the node for a graphical indication
        if (node.allowInterleaveNode)
            nodeHTML.addClass('allowInterleaveNode');
        else
            nodeHTML.removeClass('allowInterleaveNode');

        // Add the endNode class to the node for a graphical indication
        if(node.endNode)
            nodeHTML.addClass("endNode");
        else
            nodeHTML.removeClass("endNode");
    }

    function deleteElement(elementID)
    {
        Main.unsavedChanges = true;

        if (elementID in Main.trees)
            deleteTree(elementID);
        else
            deleteNode(elementID);
    }

    function deleteTree(treeID)
    {
        Main.trees[treeID].nodes.forEach(function(nodeID)
        {
            deleteNode(nodeID);
        });

        if (treeID === Main.selectedElement)
            selectElement(null);

        Main.trees[treeID].dragDiv.remove();

        delete Main.trees[treeID];
    }

    // Deletes the selected node.
    function deleteNode(nodeID)
    {
        if (nodeID === null) return; // No node selected, so do nothing

        var toDelete = nodeID;

        // No node should be selected after we remove a node.
        if (nodeID === Main.selectedElement)
            selectElement(null);

        var parentTree = Main.trees[Main.nodes[toDelete].parent];
        parentTree.nodes.splice(parentTree.nodes.indexOf(toDelete), 1);

        // Delete the node of our object and remove it from the graph.
        delete Main.nodes[toDelete];
        parentTree.plumbInstance.remove($('#' + toDelete));
    }

    function applyTreeChanges()
    {
        Main.unsavedChanges = true;

        var tree = Main.trees[Main.selectedElement];

        var subInput = tree.dragDiv.find('input.subjectNameInput');
        tree.subject = subInput.val();

        var subname = tree.dragDiv.find('.subjectName');
        subname.text(tree.subject);

        var zoomTreeButton = tree.dragDiv.find('.zoomTreeButton');
        if (Zoom.isZoomed(tree.id))
            zoomTreeButton.text('[-]');
        else
            zoomTreeButton.text('[+]');

        tree.dragDiv.css('border-color', '');

        tree.optional = $('#optionalCheckbox').prop('checked');

        $(Main.trees[Main.selectedElement].dragDiv).toggleClass("optional", tree.optional);

        Main.trees[Main.selectedElement] = tree;
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
            HtmlGenerator.insertPreconditions(node.preconditions, $("#preconditionsDiv"));

            // Show user-defined parameters
            for (var k = 0; k < node.parameterEffects.userDefined.length; k++)
            {
                var parameter = node.parameterEffects.userDefined[k];

                addedDiv = HtmlGenerator.addEmptyUserDefinedParameterEffect();
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
                var idRefSelect = effectsContainer.parent().children('select.' + Utils.escapeSelector(containerClassPrefix) + '-idref-select.hidden').clone();
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
                var deleteButton = $(Parts.getDeleteParentButtonHTML());
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
                    else                        sectionContainer.addClass("subsection");
                    sectionContainer.append($('<h' + hLevel + '>', { text: parameterItem.name }));
                    container.append(sectionContainer);

                    // Show all subsections or possibilities to add effects
                    var anyParameterShown = false;
                    parameterItem.sequence.forEach(function (subItem)
                    {
                        if (showParameterItem(parameterDefinitions, acceptableScopes, subItem, hLevel + 1, sectionContainer, classPrefix, idRefToEffectsContainer))
                            anyParameterShown = true;
                    });

                    // Remove the section if there are no effects inside it and no effects inside subsections to add
                    if (!anyParameterShown)
                        sectionContainer.remove();

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

                        effectsContainer = $('<div>', { class: classPrefix + "-container"});
                        effectsContainer.sortable({
                            handle: ".handle",
                            axis: "y",
                            forceHelperSize: true
                        });
                        container.append(effectsContainer);

                        container.append(Parts.getAddParameterEffectButtonHTML());
                        var addEffectButton = container.children().last();
                        addEffectButton.on('click', function()
                        {
                            appendEffectContainerTo(effectsContainer, classPrefix, parameterDefinitions);
                        });
                    }
                    else
                    {
                        parameterIdRefSelect = container.children('select.' + Utils.escapeSelector(classPrefix) + '-idref-select.hidden');
                        effectsContainer = container.children('.' + Utils.escapeSelector(classPrefix) + '-container');
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
                    var characterHeader = $('<h' + hStartLevel +'>', { value: character.id, text: character.name ? character.name : character.id });
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

                            addedEffectContainer.find('.' + Utils.escapeSelector(classCharacterPrefix) + '-effect-idref-select').val(effect.idRef).trigger('change');
                            addedEffectContainer.find('.' + Utils.escapeSelector(classCharacterPrefix) + '-effect-operator-select').val(effect.operator);
                            characterParameterDefinitions[effect.idRef].type.setInDOM(addedEffectContainer.find('.' + Utils.escapeSelector(classCharacterPrefix) + '-effect-control-container'), effect.value);
                        }
                    });
                }
            }

            // Show the node's property values
            var showPropertyItem = function (propertyValues, acceptableScopes, propertyItem, hLevel, tableBody, idPrefix)
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
                    else                        sectionContainer.addClass("subsection");
                    tableBody.append($('<tr>').append($('<td colspan="2">').append(sectionContainer)));

                    var anyPropertyShown = false;
                    propertyItem.sequence.forEach(function (subItem)
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
            Config.container.properties.sequence.forEach(function (subItem)
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
                    var characterHeader = $('<h' + hStartLevel +'>', { value: character.id, text: character.name ? character.name : character.id });
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
                    var classCharacterPrefix = computerOwnParameterEffectsEl.attr('id') + '-' + Utils.escapeSelector(node.characterIdRef);
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
                };

                var characterSelection = $("#characterSelection");
                if (characterSelection)
                {
                    characterSelection.off('change');
                    characterSelection.on('change', function(e)
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

            // Fill subject name line for current subject
            var currentName = Main.trees[Main.selectedElement].subject;
            var sideBarSub = $('#treeSubject');
            sideBarSub.empty();
            sideBarSub.append($('<h1>', { text: currentName }));

            $("#optionalCheckbox").prop("checked", Main.trees[Main.selectedElement].optional);

        }
    }

    function makeConnection(sourceID, targetID, plumbInstance)
    {
        var sourceNode = Main.nodes[sourceID];
        var targetNode = Main.nodes[targetID];

        //do not connect between trees
        if(targetNode.parent !== sourceNode.parent)
        {
            console.log(i18next.t('main:error.tree_connection'));
            return false;
        }

        if (Validator.testCycle(targetID, sourceID))
        {
            alert(i18next.t('main:error.cycle'));
            return false;
        }

        // Ensure that siblings are of the same type only
        var firstChildId = getFirstChildIdOrNull(sourceID);
        if (firstChildId !== null)
        {
            if (targetNode.type != Main.nodes[firstChildId].type)
            {
                alert(i18next.t('main:error.child_type'));
                return false;
            }
        }

        if(Validator.testDuplicateConnection(sourceID, targetID))
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

    //Make .collapsable div sections collapse and expand when .clickable sibling element is clicked
    function makeCollapsable()
    {
        //Set the initial state of collapsable and clickable elements:
        $(".collapsable").css("display", "inline-block");
        $(".collapsable").show();
        $(".clicktag").text("[-]");
        $(".masterclicktag").text("[-]");
        //Optional: disable display of "[+]" clicktag span elements...
        //$(".clicktag").hide();
        //$(".masterclicktag").hide();

        // click element header to toggle slide property elements
        $(".clickable").on("click", function(e)
        {
                  //The main header was clicked, it can collapse all the property elements
                  if ($(this).hasClass("collapseAll"))
                  {
                    //If there is at least one collapsable element open, close all
                    var result = 0;
                    $(".collapsable").each(function()
                        {
                            if($(this).css("display") != "none")
                            {
                               $("#properties").find(".collapsable").slideUp(400);
                               $(".clicktag").text("[+]");
                               $(".masterclicktag").text("[+]");
                               result++;
                               return false;
                            }
                        });
                    //If there are no collapsable elements open, open all
                    if(result === 0)
                    {
                        $("#properties").find(".collapsable").slideDown(400);
                        $(".clicktag").text("[-]");
                        $(".masterclicktag").text("[-]");
                    }
                  }
                  //A property element header was clicked
                  else
                  {
                    var mySpan = $(this).find(".clicktag");
                    //An element was opened
                    if (mySpan.text()=="[+]")
                    {
                        mySpan.text("[-]");
                        $(".masterclicktag").text("[-]");
                    }
                    //An element was closed
                    else
                    {
                        mySpan.text("[+]");

                        $(".clickable").each(function()
                        {
                            //Check if there is at least one element open
                            if($(this).find(".clicktag").text()=="[-]")
                            {
                                $(".masterclicktag").text("[-]");
                                return false;
                            }
                            else $(".masterclicktag").text("[+]");
                        });
                    }
                    //Close or open a single element
                    $(this).parent().closest("div").find(".collapsable").slideToggle(400);
                  }
            e.stopPropagation();
        });

        //Exceptions to stop propagation: .collapsable is clicked directly
        $(".collapsable").on("click", function(e)
        {
            e.stopPropagation();
        });
    }

})();
