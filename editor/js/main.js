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
        getPlumbInstanceByNodeID: getPlumbInstanceByNodeID,
        getStartNodeIDs: getStartNodeIDs,
        highlightParents: highlightParents,
        makeConnection: makeConnection,
        placeNewNode: placeNewNode,
        placeNewTree: placeNewTree,
        selectElements: selectElements,
        selectElement: selectElement,
        selectNode: selectNode,
        updateButtons: updateButtons
    };

    var ctrlDown = false,
        invalidateNodeClick = false;//a drag event also triggers a click event, use this flag to catch and stop these events

    $(document).ready(function()
    {
        makeCollapsable();

        MiniMap.initialise();

        updateButtons();

        $("#main").focus();

        initialiseGrid();

        if (Config.configObject.characters.sequence.length > 1)
        {
            var characterSelection = $("#characterSelection");
            Config.configObject.characters.sequence.forEach(function (character)
            {
                var option = $("<option>");
                option.text(character.id);
                characterSelection.append(option);
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
                Metadata.metaObject.name = inputName;
                $('#scenarioNameTab .scenarioName').text(Metadata.metaObject.name);
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
            nameInput.val(Metadata.metaObject.name);
            nameInputSpan.show();
            nameInput.focus();
        });

        // Event handlers.
        $(".dropdown").hover(function () {
            $(this).find(".dropdownItems:first").slideDown('medium');
            $(this).find(".dropdownButton:first").addClass("hovered");
        },
            function () {
                $(this).find(".dropdownItems:first").stop().slideUp('medium');
                $(this).find('.dropdownButton:first').removeClass("hovered");
            }
        );

        //handle movement of the div indicating which grid cell youre hovering over
        $('#main').on('mousemove', function(e)
        {
            var mainPos = $("#main").offset();
            var leftPos = gridPos(e.pageX - mainPos.left + $("#main").scrollLeft(), Main.gridX);
            var topPos  = gridPos(e.pageY - mainPos.top  + $("#main").scrollTop(), Main.gridY);

            //the grid positions refer to the upper left corners of the cells, the grid indicator
            //should not snap to the closest upper left corner but to the cell the mouse is currently on
            if (leftPos > e.pageX - mainPos.left + $("#main").scrollLeft())
                leftPos -= Main.gridX;
            if (topPos > e.pageY - mainPos.top + $("#main").scrollTop())
                topPos -= Main.gridY;

            $("#gridIndicator").css(
            {
                "top": topPos,
                "left": leftPos
            });
        });

        $('#main').on('dblclick', function()
        {
            if(!Zoom.isZoomed())
                addNewTree(null, true, 0, 0);//first argument of false generates a new id
        });
        $('#newTree').on('mousedown', function(e)
        {
            selectElement(null);

            e.preventDefault(); // Prevent selecting text
            var text = "[+" + LanguageManager.sLang("edt_common_subject") + "]";

            Zoom.zoomOut();

            DragBox.startDragging(e, text, function(pos)
            {
                var position = $("#gridIndicator").position();
                var leftOffsetPos = position.left + $("#main").scrollLeft();
                var topOffsetPos = position.top + $("#main").scrollTop();

                var gridLeftPos = Math.round(leftOffsetPos / Main.gridX);
                var gridTopPos = Math.round(topOffsetPos / Main.gridY);

                //make sure no trees can be dragged on top of each other
                if(checkGridAvailable(gridLeftPos, gridTopPos))
                {

                    addNewTree(null, true, 0, 0);
                    return true;
                }
                else
                {
                    return false;
                }
            });

        });
        $('#newComputerNode').on("mousedown", function(e)
        {
            selectElement(null);

            e.preventDefault(); // Prevent selecting text
            var text = "[+" + LanguageManager.sLang("edt_common_computer") + "]";

            if (!Zoom.isZoomed())
            {
                DragBox.showError(e, LanguageManager.sLang("edt_main_no_subject_open"));
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
            var text = "[+" + LanguageManager.sLang("edt_common_player") + "]";

            if (!Zoom.isZoomed())
            {
                DragBox.showError(e, LanguageManager.sLang("edt_main_no_subject_open"));
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
            var text = "[+" + LanguageManager.sLang("edt_common_situation") + "]";

            if (!Zoom.isZoomed())
            {
                DragBox.showError(e, LanguageManager.sLang("edt_main_no_subject_open"));
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
                    $("#" + id).removeClass("multiSelected");
                    $("#" + id).removeClass("selectable-selected");

                    Main.selectedElements.push(id);

                    Zoom.getZoomed().plumbInstance.addToDragSelection(element.selected);
                }
            }
            else
            {
                if(id in Main.trees)
                {
                    $("#" + id).removeClass("multiSelected");
                    $("#" + id).removeClass(
                        "selectable-selected");

                    Main.selectedElements.push(id);
                }
            }
        });
        $("#main").on('selectablestop', function()
        {
            for (var i = 0; i < Main.selectedElements.length; i++)
                $("#" + Main.selectedElements[i]).removeClass(
                    "selectable-selected").addClass(
                    "multiSelected");

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

    });

    $(window).bind('beforeunload', function()
    {
        // confirmation for leaving the page
        if (Main.unsavedChanges)
        {
            return LanguageManager.sLang("edt_main_pending_changes");
        }
    });

    function createEmptyTree(id, indicatorSnap, offsetX, offsetY)
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
            appendTo: treeDiv
        });
        treeDiv.selectable('disable'); //box selection only useful in zoomed state

        var defaultName = LanguageManager.sLang("edt_main_default_subject");
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
                changeNameInput.trigger("focusout");
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
            var selectAllInput = false;
            triggerSubjectNameInput(id, selectAllInput);
            e.stopPropagation();
        });

        var dragDiv = $('<div>', {class: "w treeContainer gridded selectable", id: id});
        dragDiv.append($('<div>').append(subjectDiv));
        dragDiv.append($('<div>').append($('<div>').append(treeDiv)));

        $("#main").append(dragDiv);

        var leftPos = offsetX;
        var topPos = offsetY;

        if (indicatorSnap)
        {
            var position = $("#gridIndicator").css(["left", "top"]);
            leftPos += Math.round(Utils.parseDecimalIntWithDefault(position.left) / Main.gridX);
            topPos += Math.round(Utils.parseDecimalIntWithDefault(position.top) / Main.gridY);
        }

        dragDiv.css({
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

    function addNewTree(id, indicatorSnap, offsetX, offsetY)
    {
        Zoom.zoomOut();

        //creates empty tree and selects it
        var tree = createEmptyTree(id, indicatorSnap, offsetX, offsetY);
        selectTree(tree.id);

        // Triggers the input for a subject name
        var selectAllInput = true;
        triggerSubjectNameInput(tree.id, selectAllInput);

        return tree;
    }

    // Creates a new subject and ensures it does not spawn on top of an existing one
    function placeNewTree()
    {
        var maxY = -1;
        $.each(Main.trees,function(k,t)
        {
            if(maxY < t.topPos)
                maxY = t.topPos;
        });
        var newT = addNewTree(null, false, 0, 0);
        newT.topPos = maxY+1;
        newT.level = Math.round(newT.topPos);
        newT.dragDiv.css({"top":newT.topPos*Main.gridY});
        return newT;
    }

    // Add a new node with the given type.
    function addNewNode(type)
    {
        Main.unsavedChanges = true;

        var container = $(".selected.treeContainer"); //when multiple things are selected their class is .multiselected.

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
            if (Config.configObject.characters.sequence.length > 1)
            {
                characterIdRef = $("#characterSelection option:selected").val();
            }
            else
            {
                characterIdRef = Config.configObject.characters.sequence[0].id;
            }
        }

        var parameterEffects = Config.getNewDefaultParameterEffects(characterIdRef);

        if (Metadata.timePId && type === Main.playerType)
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
            text: "",
            type: type,
            characterIdRef: characterIdRef,
            parameterEffects: parameterEffects,
            preconditions:
            {
                type: "alwaysTrue",
                preconditions: []
            },
            propertyValues:  Config.getNewDefaultPropertyValues(acceptableScopes, characterIdRef),
            comment: "",
            endNode: false,
            initsNode: false,
            jumpPoint: false,
            visited: false,
            topologicalRank: 0,
            id: id,
            parent: container.attr("id")
        };

        // Always select the node after the creation.
        selectElement(id);

        if (Zoom.isZoomed())
            node.trigger("dblclick");
        return Main.nodes[id];
    }

    // Creates a new node and places it on the specified position (within canvas bounds)
    function placeNewNode(nodeType, pos)
    {
        selectElement(null);
        // create a node of the right type
        var node = addNewNode(nodeType);

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
                    node = addNewNode(Main.computerType);
                    break;
                case Main.computerType:
                    node = addNewNode(Main.playerType);
                    break;
                case Main.situationType:
                    node = addNewNode(Main.playerType);
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
            var left = Utils.parseDecimalIntWithDefault(parentDiv.css("left"), 0);
            var top = Utils.parseDecimalIntWithDefault(parentDiv.css("top"), 0) + 55 + parentDiv.height();

            // Actually move node
            nodeDiv.css({"top": top, "left": left});

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
        var node = $('<div id="'+id+'" class="w '+ type +'">');
        node.append( $('<div>',{class:"ep"}) );

        var input =  $('<div>',{class:"statementInput"});
        var txtArea = $('<textarea>',{ class:"nodestatement", maxlength: Config.configObject.settings.statement.type.maxLength, text: Config.configObject.settings.statement.type.defaultValue });
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
        input.append(txtArea);

        input.on('focusout',function(e, cancel)
        {
            // Turn hotkeys on again (they are turned off while typing in the node)
            KeyControl.hotKeysActive = true;
            var thisNode = $('#'+id);

            var val = thisNode.find('textarea').val();
            var text = val ? val : "";

            thisNode.find('.statementInput').hide();
            thisNode.find('.statementText').text(text).show();

            if(cancel)
            {
                thisNode.find('textarea').val(Main.nodes[id].text);
            }
            else
            {
                Main.nodes[id].text = text;
                changeNodeText(id);
            }
            //Enable dragging for this component
            jsPlumb.setDraggable(thisNode, true);
        });

        input.on('keydown', function(e)
        {
            if(e.ctrlKey && e.keyCode === 13) // enter
            {
                input.trigger('focusout', [false]);
            }
            if(e.keyCode === 27) // escape
            {
                input.trigger('focusout', [true]);
            }
        });

        node.append( input );
        node.append( $('<div>',{class:"statementText"}).hide() );
        node.append( $('<div>',{class:'imgDiv'} ) );

        parent.append(node);

        node.on("dblclick", function()
        {
            var thisNode = $('#'+id);
            var text = Main.nodes[id].text ? Main.nodes[id].text : "";

            KeyControl.hotKeysActive = false;

            // Make sure the text fits inside the node
            var nodeTextDiv = thisNode.find('.statementText');
            var nodeTextInput = thisNode.find('.statementInput');
            // Retrieve the height before the div becomes invisible
            var h = nodeTextDiv[0].clientHeight;
            nodeTextDiv.hide();
            nodeTextInput.show();

            // Disable dragging for this component
            jsPlumb.setDraggable(thisNode, false);

            // Make room for typing text in the node
            thisNode.height(h+35);
            if (thisNode.width() < 128)
                thisNode.width(128);

            nodeTextInput.height("100%");

            // Fill node with current node text
            var txtArea = thisNode.find('textarea.nodestatement');
            txtArea.value = text;
            txtArea.focus();
        });

        var topOffset = parent.scrollTop();
        var leftOffset = parent.scrollLeft();
        node.css({"top": topOffset, "left": leftOffset});

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

        // Used for dragging of multiple nodes.
        //node.multiDraggable(
        //{
        //    container: parent,
        //    groupSel: ".multiSelected"
        //});

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
            var zoomedTree = Zoom.getZoomed();
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

        var zoomedTree = Zoom.getZoomed();
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
                $("#" + elementId).addClass("multiSelected");
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
        if(nodeID !== null)
            Main.getPlumbInstanceByNodeID(nodeID).clearDragSelection();

        // Before we change the node, we first apply the changes that may have been made.
        if (Main.selectedElement !== null)
        {
            applyChanges();

            if(Main.selectedElement in Main.nodes)
                Main.getPlumbInstanceByNodeID(Main.selectedElement).clearDragSelection();
        }

        // Currently selected node(s) should now not be selected.
        $(".selected").removeClass("selected");
        $(".multiSelected").removeClass("multiSelected");
        Main.selectedElements = [];
        dehighlightParents();

        // Change the selected node.
        Main.selectedElement = nodeID;

        // Only make a node selected if it isn't null.
        if (Main.selectedElement !== null)
        {
            $("#" + Main.selectedElement).addClass("selected");
            Main.selectedElements.push(Main.selectedElement);
            $("#" + nodeID).addClass("multiSelected");
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
            var parameterIdRef = $(effectContainer).find('.' + classPrefix + '-effect-idref-select').val();
            var controlContainer = $(effectContainer).find('.' + classPrefix + '-effect-control-container');
            var parameterValue = parameterDefinitions[parameterIdRef].type.getFromDOM(controlContainer);
            var parameterOperator = $(effectContainer).find('.' + classPrefix + '-effect-operator-select').val();
            var parameterEffect = {
                idRef: parameterIdRef,
                operator: parameterOperator,
                value: parameterValue
            };

            if (parameterEffect.idRef in fixedParameterEffects)
            {
                fixedParameterEffects[parameterEffect.idRef].push(parameterEffect);
            }
        };

        var fixedParameterEffectsEl = $("#fixed-parameter-effects");
        fixedParameterEffectsEl.find('.' + fixedParameterEffectsEl.attr('id') + '-effect-container').each(function()
        {
            getFixedParameterEffectFromDOMAndSetInNode(this, Config.configObject.parameters.byId, node.parameterEffects.fixed.characterIndependent, fixedParameterEffectsEl.attr('id'));
        });
        var fixedCharacterParameterEffectsEl = $("#fixed-character-parameter-effects");
        var characterId, classCharacterPrefix, parameterDefinitions;
        for (characterId in Config.configObject.characters.byId)
        {
            classCharacterPrefix = fixedCharacterParameterEffectsEl.attr('id') + '-' + characterId;
            parameterDefinitions = $.extend({}, Config.configObject.characters.parameters.byId, Config.configObject.characters.byId[characterId].parameters.byId);
            fixedCharacterParameterEffectsEl.find('.' + classCharacterPrefix + '-effect-container').each(function()
            {
                getFixedParameterEffectFromDOMAndSetInNode(this, parameterDefinitions, node.parameterEffects.fixed.perCharacter[characterId], classCharacterPrefix);
            });
        }
        if (node.type === Main.computerType)
        {
            var computerOwnParameterEffectsEl = $("#node-computer-own-parameter-effects");
            classCharacterPrefix = computerOwnParameterEffectsEl.attr('id') + '-' + node.characterIdRef;
            parameterDefinitions = $.extend({}, Config.configObject.characters.parameters.byId, Config.configObject.characters.byId[node.characterIdRef].parameters.byId);
            computerOwnParameterEffectsEl.find('.' + classCharacterPrefix + '-effect-container').each(function()
            {
                getFixedParameterEffectFromDOMAndSetInNode(this, parameterDefinitions, node.parameterEffects.fixed.perCharacter[node.characterIdRef], classCharacterPrefix);
            });
        }

        // Save preconditions.
        node.preconditions = ObjectGenerator.preconditionObject($("#preconditionsDiv").children().first());

        // Save property values.
        var acceptableScopes = ['per', 'per-' + node.type];
        if (node.type === Main.computerType) acceptableScopes.push('per-computer-own');
        var propertyId, property;
        for (propertyId in Config.configObject.properties.byId)
        {
            property = Config.configObject.properties.byId[propertyId];
            if (acceptableScopes.indexOf(property.scopes.statementScope) === -1) continue;
            node.propertyValues.characterIndependent[propertyId] = property.type.getFromDOM($("#node-property-values-container-" + property.id));
        }
        for (propertyId in Config.configObject.characters.properties.byId)
        {
            for (characterId in Config.configObject.characters.byId)
            {
                property = Config.configObject.characters.properties.byId[propertyId];
                if (acceptableScopes.indexOf(property.scopes.statementScope) === -1) continue;
                if (property.scopes.statementScope === 'per-computer-own' && characterId !== node.characterIdRef) continue;
                node.propertyValues.perCharacter[characterId][propertyId] = property.type.getFromDOM($("#node-character-property-values-" + characterId + "-container-" + property.id));
            }
        }
        for (characterId in Config.configObject.characters.byId)
        {
            for (propertyId in Config.configObject.characters.byId[characterId].properties.byId)
            {
                property = Config.configObject.characters.byId[characterId].properties.byId[propertyId];
                if (acceptableScopes.indexOf(property.scopes.statementScope) === -1) continue;
                if (property.scopes.statementScope === 'per-computer-own' && characterId !== node.characterIdRef) continue;
                node.propertyValues.perCharacter[characterId][propertyId] = property.type.getFromDOM($("#node-character-property-values-" + characterId + "-container-" + property.id));
            }
        }

        // Save endNode.
        node.endNode = $("#endNodeCheckbox").prop("checked");

        // Save initsNode.
        node.initsNode = $("#initsNodeCheckbox").prop("checked");

        // Save jumpPoint.
        node.jumpPoint = $("#jumpNodeCheckbox").prop("checked");

        // Save comment.
        node.comment = $("textarea#comment").val();

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

        var position = $("#gridIndicator").position();
        var leftOffsetPos = position.left + $("#main").scrollLeft();
        var topOffsetPos = position.top + $("#main").scrollTop();

        var gridLeftPos = Math.round(leftOffsetPos / Main.gridX);
        var gridTopPos = Math.round(topOffsetPos / Main.gridY);

        //make sure no trees can be dragged on top of each other
        if(checkGridAvailable(gridLeftPos, gridTopPos))
        {
            tree.dragDiv.css(
            {
                "top": topOffsetPos,
                "left": leftOffsetPos
            });

            tree.leftPos = gridLeftPos; //store position to return to this point when zoomed in and out again
            tree.topPos = gridTopPos;
            tree.level = Math.round(tree.topPos); //trees have a conversation level. trees on the same level are interleaved. trees on different levels are sequenced from top to bottom (low y to high y)

            MiniMap.update(true);
        }
        else
        {
            tree.dragDiv.css(
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

    //transforms a free position, for example x=43 and grid size=15, to a grid position x=45 (round to nearest multiple of gridsize)
    function gridPos(freePos, gridSize)
    {
        var quotient = Math.floor(freePos / gridSize);

        var remainder = freePos / gridSize - quotient; //leaves decimal part

        if (remainder >= 0.5)
        {
            return gridSize * (quotient + 1);
        }
        else
        {
            return gridSize * quotient;
        }
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
        $(".multiSelected").removeClass("multiSelected");
        Main.selectedElements = [];

        dragDiv.addClass("selected");
        Main.selectedElement = id;

        dragDiv.addClass("multiSelected");
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
                if (Config.configObject.characters.sequence.length > 1)
                {
                    text += "<b>" + node.characterIdRef + ": </b>";
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
        if (node.comment !== "")
            imageDiv.append("<img src='"+editor_url+"png/node_properties/node_has_comments.png'>");
        if (node.jumpPoint)
            imageDiv.append("<img src='"+editor_url+"png/node_properties/node_has_jump.png'>");
        if (node.endNode)
            imageDiv.append("<img src='"+editor_url+"png/node_properties/node_has_end.png'>");
        if (node.initsNode)
            imageDiv.append("<img src='"+editor_url+"png/node_properties/node_has_premature_end.png'>");

        // add the text and imageDiv to the node itself
        // apply text changes
        nodeHTML.width(width + "em");
        var nodeTextDiv = nodeHTML.find('.statementText');
        nodeTextDiv.show();
        nodeTextDiv.html(text);

        // make sure the text fits inside the node
        var h = nodeTextDiv[0].clientHeight;
        nodeHTML.height(h);
        var nodeTextInput = nodeHTML.find('.statementInput');
        nodeTextInput.hide();
        nodeTextInput.height("100%");
        nodeTextInput.hide();

        Main.trees[node.parent].plumbInstance.updateOffset({elId:nodeID, recalc:true});
        Main.trees[node.parent].plumbInstance.repaint(nodeID, null, 0);

        // Add the jumpnode class to the node for a graphical indication
        if (node.jumpPoint)
            nodeHTML.addClass('jumpnode');
        else
            nodeHTML.removeClass('jumpnode');

        // Add the endnode class to the node for a graphical indication
        if(node.endNode)
            nodeHTML.addClass("endnode");
        else
            nodeHTML.removeClass("endnode");
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

            // Show the values of the node in the side bar.
            // Statement:
            $("textarea#statement").val(node.text);

            // Insert the preconditions in the sidebar
            HtmlGenerator.insertPreconditions(node.preconditions, $("#preconditionsDiv"));

            // Show user-defined parameters
            for (var k = 0; k < node.parameterEffects.userDefined.length; k++)
            {
                var parameter = node.parameterEffects.userDefined[k];

                addedDiv = HtmlGenerator.addEmptyUserDefinedParameterEffect();
                addedDiv.find(".parameter-idref-select").val(parameter.idRef).trigger('change');
                addedDiv.find(".parameter-effect-operator-select").val(parameter.operator);
                Metadata.metaObject.parameters.byId[parameter.idRef].type.setInDOM(addedDiv.find(".parameter-effect-value-container"), parameter.value);
            }

            var acceptableScopes = [];
            if (node.type !== Main.computerType || Config.configObject.characters.sequence.length > 1)
            {
                acceptableScopes.push('per');
                acceptableScopes.push("per-" + node.type);
            }

            // Show fixed parameters
            // Appends a default effect to the container, which changes dynamically based on the parameter selected
            var appendEffectContainerTo = function(effectsContainer, containerClassPrefix, parameterDefinitions)
            {
                // This element contains the dynamically changing operator and control for possible values
                // It is separate from the rest so that it can be emptied
                var effectDiv = $('<div>', { style:"display:inline" });

                // Dynamically changes the type of the effect according to the given parameter
                var changeEffectType = function(pId)
                {
                    var operatorSelect = $('<select>', { class: containerClassPrefix + "-effect-operator-select" });
                    parameterDefinitions[pId].type.assignmentOperators.forEach(function(op)
                    {
                        operatorSelect.append($('<option>', { value: op.name, text: op.uiName }));
                    });
                    effectDiv.append(operatorSelect);

                    var controlContainer = $('<div>', { class: containerClassPrefix + "-effect-control-container", style:"display:inline" });
                    parameterDefinitions[pId].type.appendControlTo(controlContainer);
                    effectDiv.append(controlContainer);
                };

                // Clone the hidden select accumulated for each separate section and put it in the parameter effect
                var idRefSelect = effectsContainer.parent().children('select.' + containerClassPrefix + '-idref-select.hidden').clone();
                idRefSelect.removeClass(containerClassPrefix + '-idref-select');
                idRefSelect.addClass(containerClassPrefix + '-effect-idref-select');
                changeEffectType($(idRefSelect).val());
                idRefSelect.on('change', function()
                {
                    effectDiv.empty();
                    changeEffectType($(this).val());
                });
                idRefSelect.removeClass('hidden');

                // This button deletes the effect (container)
                var deleteButton = $(Parts.getDeleteParentButtonHTML());
                deleteButton.on('click', function() { $(this).parent().remove(); });

                var effectContainer = $('<div>', { class: containerClassPrefix + "-effect-container" });
                effectContainer.append(idRefSelect).append(effectDiv).append(deleteButton);
                effectsContainer.append(effectContainer);
            };

            // Shows the sections and add buttons when there are effects that can be added
            var showParameterItem = function(parameterDefinitions, parameterItem, hLevel, container, classPrefix, idRefToEffectsContainer)
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
                        if (showParameterItem(parameterDefinitions, subItem, hLevel + 1, sectionContainer, classPrefix, idRefToEffectsContainer))
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
                        parameterIdRefSelect = container.children('select.' + classPrefix + '-idref-select.hidden');
                        effectsContainer = container.children('.' + classPrefix + '-container');
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
            var hStartLevel = 3;
            // Accumulator for mapping a parameter id to its effects container
            var idRefToEffectsContainer = {};
            Config.configObject.parameters.sequence.forEach(function(subItem)
            {
                showParameterItem(Config.configObject.parameters.byId, subItem, hStartLevel, fixedParameterEffectsEl, classPrefix, idRefToEffectsContainer);
            });

            // Show the sections for all per-character fixed parameter effects
            var fixedCharacterParameterEffectsEl = $("#fixed-character-parameter-effects");
            var characterClassPrefix = fixedCharacterParameterEffectsEl.attr('id');
            var accordionDiv = $('<div>');
            fixedCharacterParameterEffectsEl.append(accordionDiv);
            var anyCharacterParameterShown = false;
            // Accumulator for mapping a character parameter id to its effects container
            var idRefToCharacterEffectsContainer = {};
            Config.configObject.characters.sequence.forEach(function(character)
            {
                var characterHeader = $('<h' + hStartLevel +'>', { text: character.id });
                var characterDiv = $('<div>');
                accordionDiv.append(characterHeader).append(characterDiv);

                var classCharacterPrefix = characterClassPrefix + '-' + character.id;

                idRefToCharacterEffectsContainer[character.id] = {};

                // The definitions for each parameter need to be available for changing the select,
                // it can either be a parameter for an individual character or for all the characters,
                // so we need to merge the definitions into one object and pass it.
                var characterParameterDefinitions = $.extend({}, Config.configObject.characters.parameters.byId, Config.configObject.characters.byId[character.id].parameters.byId);

                Config.configObject.characters.parameters.sequence.forEach(function(parameterItem)
                {
                    if (showParameterItem(characterParameterDefinitions, parameterItem, hStartLevel,
                                          characterDiv, classCharacterPrefix, idRefToCharacterEffectsContainer[character.id]))
                    {
                        anyCharacterParameterShown = true;
                    }
                });

                Config.configObject.characters.byId[character.id].parameters.sequence.forEach(function(parameterItem)
                {
                    if (showParameterItem(characterParameterDefinitions, parameterItem, hStartLevel,
                                          characterDiv, classCharacterPrefix, idRefToCharacterEffectsContainer[character.id]))
                    {
                        anyCharacterParameterShown = true;
                    }
                });
            });

            if (anyCharacterParameterShown)
            {
                fixedCharacterParameterEffectsEl.prepend($('<h3>', { text: LanguageManager.sLang('edt_common_characters') }));
                // Set the heightStyle to "content", because the content changes dynamically
                accordionDiv.accordion({ active: false, collapsible: true, heightStyle: "content" });
            }
            else
            {
                accordionDiv.remove();
            }

            // Add the character-independent effects that were previously defined
            var parameterIdRef;
            for (parameterIdRef in node.parameterEffects.fixed.characterIndependent)
            {
                if (parameterIdRef in idRefToEffectsContainer)
                {
                    node.parameterEffects.fixed.characterIndependent[parameterIdRef].forEach(function(effect)
                    {
                        var effectsContainer = idRefToEffectsContainer[parameterIdRef];
                        appendEffectContainerTo(effectsContainer, classPrefix, Config.configObject.parameters.byId);
                        var addedEffectContainer = effectsContainer.children().last();

                        addedEffectContainer.find('.' + classPrefix + '-effect-idref-select').val(effect.idRef).trigger('change');
                        addedEffectContainer.find('.' + classPrefix + '-effect-operator-select').val(effect.operator);
                        Config.configObject.parameters.byId[effect.idRef].type.setInDOM(addedEffectContainer.find('.' + classPrefix + '-effect-control-container'), effect.value);
                    });
                }
            }

            // Add the per-character effects that were previously defined
            for (var characterId in Config.configObject.characters.byId)
            {
                var classCharacterPrefix = characterClassPrefix + '-' + characterId;
                var characterParameterDefinitions = $.extend({}, Config.configObject.characters.parameters.byId, Config.configObject.characters.byId[characterId].parameters.byId);

                for (parameterIdRef in node.parameterEffects.fixed.perCharacter[characterId])
                {
                    if (parameterIdRef in idRefToCharacterEffectsContainer[characterId])
                    {
                        node.parameterEffects.fixed.perCharacter[characterId][parameterIdRef].forEach(function(effect)
                        {
                            var effectsContainer = idRefToCharacterEffectsContainer[characterId][parameterIdRef];
                            appendEffectContainerTo(effectsContainer, classCharacterPrefix, characterParameterDefinitions);
                            var addedEffectContainer = effectsContainer.children().last();

                            addedEffectContainer.find('.' + classCharacterPrefix + '-effect-idref-select').val(effect.idRef).trigger('change');
                            addedEffectContainer.find('.' + classCharacterPrefix + '-effect-operator-select').val(effect.operator);
                            characterParameterDefinitions[effect.idRef].type.setInDOM(addedEffectContainer.find('.' + classCharacterPrefix + '-effect-control-container'), effect.value);
                        });
                    }
                }
            }

            // Show the node's property values
            var anyPropertyShown = false;
            var showPropertyItem = function (propertyValues, propertyItem, hLevel, tableBody, idPrefix)
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

                    propertyItem.sequence.forEach(function (subItem)
                    {
                         showPropertyItem(propertyValues, subItem, hLevel + 1, sectionTableBody, idPrefix);
                    });
                }
                else
                {
                    var propertyRow = $('<tr>');

                    var propertyHeader = $('<th>');
                    var controlHtmlId = idPrefix + '-' + propertyItem.id;
                    propertyHeader.append($('<label>', { text: propertyItem.name + ':', 'for': controlHtmlId }));
                    propertyRow.append(propertyHeader);

                    var propertyData = $('<td>', { id: idPrefix + '-container-' + propertyItem.id });
                    propertyItem.type.appendControlTo(propertyData, controlHtmlId);
                    propertyItem.type.setInDOM(propertyData, propertyValues[propertyItem.id]);

                    propertyRow.append(propertyData);

                    tableBody.append(propertyRow);

                    anyPropertyShown = true;
                }
            };
            var nodePropertyValuesEl = $('#node-property-values');
            var nodePropertyValuesTable = $('<table>');
            Config.configObject.properties.sequence.forEach(function (subItem)
            {
                showPropertyItem(node.propertyValues.characterIndependent, subItem, hStartLevel, nodePropertyValuesTable, nodePropertyValuesEl.attr('id'));
            });
            nodePropertyValuesEl.append(nodePropertyValuesTable);

            var nodePropertyShown = anyPropertyShown;
            anyPropertyShown = false;

            var nodeCharacterPropertyValuesEl = $('#node-character-property-values');
            var characterAccordion = $('<div>');
            nodeCharacterPropertyValuesEl.append(characterAccordion);
            Config.configObject.characters.sequence.forEach(function(character)
            {
                var characterHeader = $('<h' + hStartLevel +'>', { text: character.id });
                var characterTab = $('<table>');
                characterAccordion.append(characterHeader).append($('<div>').append(characterTab));

                var containerIdPrefix = nodeCharacterPropertyValuesEl.attr('id') + '-' + character.id;

                Config.configObject.characters.properties.sequence.forEach(function(propertyItem)
                {
                    showPropertyItem(node.propertyValues.perCharacter[character.id], propertyItem, hStartLevel, characterTab, containerIdPrefix);
                });

                Config.configObject.characters.byId[character.id].properties.sequence.forEach(function(propertyItem)
                {
                    showPropertyItem(node.propertyValues.perCharacter[character.id], propertyItem, hStartLevel, characterTab, containerIdPrefix);
                });
            });

            if (!nodePropertyShown && ! anyPropertyShown)
            {
                $("#propertyValuesSection").hide();
            }
            else if (!anyPropertyShown)
            {
                $("#propertyValuesSection").show();
                characterAccordion.remove();
            }
            else
            {
                $("#propertyValuesSection").show();
                nodeCharacterPropertyValuesEl.prepend($('<h3>', { text: LanguageManager.sLang('edt_common_characters') }));
                characterAccordion.accordion({ active: false, collapsible: true, heightStyle: "content" });
            }

            // Show the per-computer-own parameter effects and property values
            if (node.type === Main.computerType)
            {
                var updateSideBarCharacterSection = function()
                {
                    acceptableScopes = ['per-computer-own'];
                    if (Config.configObject.characters.sequence.length === 1)
                    {
                        acceptableScopes.push('per');
                        acceptableScopes.push('per-' + Main.computerType);
                    }

                    // Show the sections for all per-character fixed parameter effects
                    var computerOwnParameterEffectsEl = $("#node-computer-own-parameter-effects");
                    computerOwnParameterEffectsEl.children().remove();
                    var computerOwnParameterEffectsDiv = $('<div>');
                    computerOwnParameterEffectsEl.append(computerOwnParameterEffectsDiv);
                    var anyCharacterParameterShown = false;
                    var classCharacterPrefix = computerOwnParameterEffectsEl.attr('id') + '-' + node.characterIdRef;
                    // The definitions for each parameter need to be available for changing the select,
                    // it can either be a parameter for an individual character or for all the characters,
                    // so we need to merge the definitions into one object and pass it.
                    var characterParameterDefinitions = $.extend({}, Config.configObject.characters.parameters.byId, Config.configObject.characters.byId[node.characterIdRef].parameters.byId);
                    Config.configObject.characters.parameters.sequence.forEach(function(parameterItem)
                    {
                        if (showParameterItem(characterParameterDefinitions, parameterItem, hStartLevel,
                                              computerOwnParameterEffectsDiv, classCharacterPrefix, idRefToCharacterEffectsContainer[node.characterIdRef]))
                        {
                            anyCharacterParameterShown = true;
                        }
                    });

                    Config.configObject.characters.byId[node.characterIdRef].parameters.sequence.forEach(function(parameterItem)
                    {
                        if (showParameterItem(characterParameterDefinitions, parameterItem, hStartLevel,
                                              computerOwnParameterEffectsDiv, classCharacterPrefix, idRefToCharacterEffectsContainer[node.characterIdRef]))
                        {
                            anyCharacterParameterShown = true;
                        }
                    });
                    if (!anyCharacterParameterShown)
                    {
                        computerOwnParameterEffectsEl.parent().hide();
                    }
                    else
                    {
                        computerOwnParameterEffectsEl.parent().show();
                    }

                    // Add the previously defined per-computer-own fixed parameter effects
                    for (parameterIdRef in node.parameterEffects.fixed.perCharacter[node.characterIdRef])
                    {
                        if (parameterIdRef in idRefToCharacterEffectsContainer[node.characterIdRef])
                        {
                            node.parameterEffects.fixed.perCharacter[node.characterIdRef][parameterIdRef].forEach(function(effect)
                            {
                                var effectsContainer = idRefToCharacterEffectsContainer[node.characterIdRef][parameterIdRef];
                                appendEffectContainerTo(effectsContainer, classCharacterPrefix, characterParameterDefinitions);
                                var addedEffectContainer = effectsContainer.children().last();

                                addedEffectContainer.find('.' + classCharacterPrefix + '-effect-idref-select').val(effect.idRef).trigger('change');
                                addedEffectContainer.find('.' + classCharacterPrefix + '-effect-operator-select').val(effect.operator);
                                characterParameterDefinitions[effect.idRef].type.setInDOM(addedEffectContainer.find('.' + classCharacterPrefix + '-effect-control-container'), effect.value);
                            });
                        }
                    }

                    var computerOwnPropertyValuesEl = $("#node-computer-own-property-values");
                    computerOwnPropertyValuesEl.children().remove();
                    anyPropertyShown = false;
                    var computerOwnPropertyValuesTable = $('<table>');
                    computerOwnPropertyValuesEl.append(computerOwnPropertyValuesTable);
                    // The same id prefix as the other character property values, so they can be easily retrieved
                    var containerIdPrefix = nodeCharacterPropertyValuesEl.attr('id') + '-' + node.characterIdRef;
                    Config.configObject.characters.properties.sequence.forEach(function(propertyItem)
                    {
                        showPropertyItem(node.propertyValues.perCharacter[node.characterIdRef], propertyItem, hStartLevel + 1, computerOwnPropertyValuesTable, containerIdPrefix);
                    });
                    Config.configObject.characters.byId[node.characterIdRef].properties.sequence.forEach(function(propertyItem)
                    {
                        showPropertyItem(node.propertyValues.perCharacter[node.characterIdRef], propertyItem, hStartLevel + 1, computerOwnPropertyValuesTable, containerIdPrefix);
                    });
                    if (!anyPropertyShown)
                    {
                        computerOwnPropertyValuesEl.parent().hide();
                    }
                    else
                    {
                        computerOwnPropertyValuesEl.parent().show();
                    }
                };

                var characterSelection = $("#characterSelection");
                if (characterSelection)
                {
                    characterSelection.unbind('change');
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

                            for (characterId in node.parameterEffects.fixed.perCharacter)
                            {
                                for (var parameterId in node.parameterEffects.fixed.perCharacter[characterId])
                                {
                                    var parameter = Config.configObject.characters.parameters.byId[parameterId];
                                    if (!parameter) parameter = Config.configObject.characters.byId[newCharacterIdRef].parameters.byId[parameterId];

                                    if (parameter)
                                    {
                                        if (parameter.scopes.statementScope === 'per-computer-own')
                                        {
                                            perCharacterParameterEffects[newCharacterIdRef][parameterId] = node.parameterEffects.fixed.perCharacter[characterId][parameterId];
                                        }
                                        else
                                        {
                                            perCharacterParameterEffects[characterId][parameterId] = node.parameterEffects.fixed.perCharacter[characterId][parameterId];
                                        }
                                    }
                                }
                            }
                            node.parameterEffects.fixed.perCharacter = perCharacterParameterEffects;

                            // Store old property values in the new property values and
                            // check for each per-character property value if it is per-computer-own and
                            // if the other character also has that property then store it in the new character property values
                            var perCharacterPropertyValues = Config.getNewDefaultPropertyValues(acceptableScopes, newCharacterIdRef).perCharacter;
                            var characterId;
                            for (characterId in perCharacterPropertyValues)
                            {
                                for (var propertyId in perCharacterPropertyValues[characterId])
                                {
                                    var property = Config.configObject.characters.properties.byId[propertyId];
                                    if (!property) property = Config.configObject.characters.byId[characterId].properties.byId[propertyId];

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
            $("#initsNodeCheckbox").prop("checked", node.initsNode);
            $("#jumpNodeCheckbox").prop("checked", node.jumpPoint);

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
            console.log(LanguageManager.sLang("edt_plumb_error_tree_connection"));
            return false;
        }

        if (Validator.testCycle(targetID, sourceID))
        {
            alert(LanguageManager.sLang("edt_plumb_error_cycle"));
            return false;
        }

        // Ensure that siblings are of the same type only
        var firstChildId = getFirstChildIdOrNull(sourceID);
        if (firstChildId !== null)
        {
            if (targetNode.type != Main.nodes[firstChildId].type)
            {
                alert(LanguageManager.sLang("edt_plumb_error_child_type"));
                return false;
            }
        }

        // This check needs revision, maybe we can allow a node to have more than 10 outgoing connections
        if (plumbInstance.getConnections({source: sourceID}).length >= 10)
        {
            alert(LanguageManager.sLang("edt_plumb_error_child_type"));
            return false;
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
