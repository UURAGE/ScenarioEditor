/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

var Main;

(function()
{
    //Public Variables
    var gridX,
        gridY,
        domainID;

    Main = 
    {
        nodes: [],
        selectedElement: null,
        selectedElements: [],
        jsPlumbCounter: 0,
        computerType: "computer",
        playerType: "player",
        conversationType: "conversation",
        trees: [],
        maxTreeNumber: 0,
        gridX: gridX,
        gridY: gridY,
        domainID: domainID,
        unsavedChanges: false,
        //Functions
        addNewNode: addNewNode,
        addNewTree: addNewTree,
        applyChanges: applyChanges,
        changeZoomedNodeTexts: changeZoomedNodeTexts,
        changeNodeText: changeNodeText,
        createChildNode: createChildNode,
        createEmptyTree: createEmptyTree,
        createAndReturnNode: createAndReturnNode,
        dehighlightParents: dehighlightParents,
        deleteAllSelected: deleteAllSelected,
        escapeTags: escapeTags,
        highlightParents: highlightParents,
        makeConnection: makeConnection,
        openConversation: openConversation,
        placeNewNode: placeNewNode,
        placeNewTree: placeNewTree,
        repaintZoomedNodes: repaintZoomedNodes,
        selectElement: selectElement,
        selectNode: selectNode,
        unEscapeTags: unEscapeTags,
        updateButtons: updateButtons
    };

    //Private Variables.
    var xselectableSelected = [],
        ctrlDown = false;

    $(document).ready(function()
    {
        makeCollapsable();

        MiniMap.initialise();

        jsPlumb.setSuspendDrawing(true);
        
        updateButtons();
        
        $("#main").focus();
        
        var scriptNameInput = $('<input type="text" maxlength="35">');
        var scriptNameInputSpan = $('<span>', { class: "scriptNameInput" }).append(scriptNameInput);
        scriptNameInputSpan.on('focusout', function(e, cancel)
        {
            KeyControl.hotKeysActive = true;
            
            var nameInput = $('#scriptNameTab .scriptNameInput input');

            if(!cancel)
            {
                var inputName = Metadata.formatScriptName(nameInput.val());
                Metadata.metaObject.name = inputName;
                $('#scriptNameTab .scriptName').text(Metadata.metaObject.name);
            }

            $(this).hide();
            $('#scriptNameTab .scriptName').show();
        });            
        scriptNameInputSpan.on('keydown', function(e)
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
        scriptNameInputSpan.hide();
        
        $('#scriptNameTab').append(scriptNameInputSpan);
        
        $('#scriptNameTab .scriptName').on('dblclick', function(e)
        {
            KeyControl.hotKeysActive = false;
            
            $(this).hide();
            
            var nameInputSpan = $('#scriptNameTab .scriptNameInput');
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
        $('#manual').on('click', function()
        {
            window.open(site_url + 'guide');
        });
        $('#newTree').on('mousedown', function(e)
        {
            selectElement(null);

            e.preventDefault(); // Prevent selecting text
            var text = "[+" + LanguageManager.sLang("edt_common_subject") + "]";

            Zoom.zoomOut();

            DragBox.startDragging(e, text, function(pos)
            {
                addNewTree(null, true, 0, 0);
                return true;
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
                placeNewNode(Main.computerType,pos);
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
                placeNewNode(Main.playerType,pos);
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
        });
        $("#labelText").on('click', function()
        {
            // Toggle between the labels.
            if ($("#labelText").hasClass("statements"))
            {
                $("#labelText").attr("class", "intents enabled");
            }
            else
                $("#labelText").attr("class", "statements");

            changeZoomedNodeTexts();
        });

        $("#main").on('mouseenter', function()
        {
            $("#gridIndicator").show();
            //the method checks for previous initialisation itself
            initialiseGrid($("#gridIndicator"));
        });

        $("#main").on('mouseleave', function()
        {
            $("#gridIndicator").hide();
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
        $("#main").xselectable(
        {
            distance: 5,
            filter: ".w", // Only select the nodes.
            cancel: "#main *"
        });

        $("#main").on('mousedown', function(event)
        {
            ctrlDown = event.ctrlKey;
        });
        $("#main").on('xselectablestart', function()
        {
            $(this).focus();
            // Make sure no node is selected when we start selecting.
            if (!ctrlDown)
            {
                Main.selectedElements = [];
                selectElement(null);
            }
            xselectableSelected = [];
        });
        $("#main").on('xselectableselected', function(event, ui)
        {
            // Add all selected nodes to a array.
            for (var i = 0; i < ui.selected.length; i++)
            {
                var id = ui.selected[i].id;

                //not zoomed into a tree, nodes may not be selected
                if (!Zoom.isZoomed() && !(id in Main.trees))
                {
                    $("#" + id).removeClass("multiSelected");
                    $("#" + id).removeClass(
                        "xselectable-selected");
                    continue;
                }
                // Prevent duplicate nodes.
                if (!$("#" + id).hasClass("multiSelected"))
                    Main.selectedElements.push(id);
                xselectableSelected.push(id); // This must also be done with duplicate nodes to remove the xselectable.
            }
            MiniMap.update(true);
        });
        $("#main").on('xselectablestop', function()
        {
            for (var i = 0; i < xselectableSelected.length; i++)
                $("#" + xselectableSelected[i]).removeClass(
                    "xselectable-selected").addClass(
                    "multiSelected");

            // If there's only one node selected, show the node.
            if (Main.selectedElements.length === 1)
                selectElement(Main.selectedElements[0]);
        });
        $('#allConversationsHTML').hide();

        $("#conversationDiv").sortable(
        {
            axis: "y",
            containment: "parent",
            cursor: "move",
            tolerance: "pointer"
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
    { // confirmation for leaving the page
        if (Main.unsavedChanges)
        {
            return LanguageManager.sLang("edt_main_pending_changes");
        }
    });

    /*
     ** Public Functions
     */

    function createEmptyTree(id, indicatorSnap, offsetX, offsetY)
    {
        if (!id)
        {
            id = "tree" + Main.maxTreeNumber;
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
            }
        });
        treeDiv.xselectable(
        {
            distance: 5,
            filter: ".w", // Only select the nodes.
        });
        treeDiv.xselectable('disable'); //box selection only useful in zoomed state

        var zoomTreeButton = $('<div>',{text:"[+]", class:"zoomTreeButton button"});
        zoomTreeButton.on("click", function()
        {
            Zoom.toggleZoom(Main.trees[id]);
            MiniMap.update(true);
        });

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

        var dragDiv = $('<div>', {class: "w treeContainer selectable", id: id});
        dragDiv.append(subjectDiv);
        dragDiv.append(treeDiv);

        $("#main").append(dragDiv);

        Main.trees[id] = {
            dragDiv: dragDiv,
            div: treeDiv,
            id: id,
            subject: defaultName,
            optional: false,
            leftPos: 0, //necessary to return to the right spot after zooming out
            topPos: 0, //left and topPos are in grid coordinates (if leftPos == 2 screen pos == 2*gridX)
            leftScroll: 0, //necessary to zoom in to the spot on the graph where last zoomed out
            topScroll: 0,
            level: 0,
            nodes: []
        };

        //first time a treecontainer is made we set the grid all containers will snap to (if the grid indicator has not displayed already)
        //height and width are known only after the append to main
        //the method checks or previous initialisations itself
        initialiseGrid(dragDiv);

        if (indicatorSnap)
        {
            var position = $("#gridIndicator").position();
            var leftOffsetPos = position.left + Main.gridX*offsetX; //+ $("#main").scrollLeft()
            var topOffsetPos = position.top  + Main.gridY*offsetY; //+ $("#main").scrollTop()
            dragDiv.css(
            {
                "top": topOffsetPos,
                "left": leftOffsetPos
            });
        }

        Main.trees[id].leftPos = dragDiv.position().left / Main.gridX;
        Main.trees[id].topPos = dragDiv.position().top / Main.gridY;
        Main.trees[id].level = Main.trees[id].topPos;

        //(x,y) of upper left of containment and (x,y) of lower right
        jsPlumb.draggable(dragDiv,
        {
            containment: [0, $("#toolbar").outerHeight(), $(
                    "#main").outerWidth(), $("#toolbar").outerHeight() +
                $("#main").outerHeight()
            ],

            stop:function(event)
            {
                dropHandler(event, id);
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

        $(".pathToDeadEnd").removeClass("pathToDeadEnd");
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

        var node = createAndReturnNode(type, null, $('.treeDiv', container), container.attr('id'));

        container.focus();

        var id = node.attr('id');

        var parameters = [];
        var timeObject = {
            parameterid : 't',
            changeType: "delta",
            value: 1
        };

        if (Metadata.timePId !== null && type === Main.playerType)
            parameters.push(timeObject);

        Main.nodes[id] = {
            text: "",
            conversation: [],
            type: type,
            parameters: parameters,
            preconditions:
            {
                type: "alwaysTrue",
                preconditions: []
            },
            intent: [],
            video: null,
            image: null,
            audio: null,
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
        var leftBound = $('#main').position().left;
        var rightBound = leftBound + treeDiv.width();
        var upperBound = $('#main').position().top + 50;
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
                case Main.conversationType: 
                    node = addNewNode(Main.playerType);    
                    break;
            }

            // If there are errors (cycles, invalid pairs, existing connections)
            // regarding the connection to be created, delete the new node and cancel.

            var connection = makeConnection(parent.id, node.id);

            if (!connection)
            {
                deleteNode(node.id);
                return;
            }

            // Reposition the new node
            var nodeDiv = $('#'+node.id);
            var parentDiv = $('#'+parent.id);
            var left = parentDiv.position().left;
            var top = parentDiv.position().top + 55 + parentDiv.height();
            
            // Actually move node
            nodeDiv.css({"top": top, "left": left});
            repaintZoomedNodes();
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

        // Add the node to the html.
        var node = $('<div id="'+id+'" class="w '+ type+'">');
        node.append( $('<div>',{class:"ep"}) );

        var input =  $('<div>',{class:"statementInput"});
        if(type !== Main.conversationType)
        {
            var txtArea = $('<textarea>',{class:"nodestatement"});
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
                    jsPlumb.repaint(id);
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
        }
        else
        {
            input.text(LanguageManager.sLang("edt_main_see_conversation"));
        }
        
        node.append( input );
        node.append( $('<div>',{class:"statementText"}).hide() );
        node.append( $('<div>',{class:'imgDiv'} ) );

        parent.append(node);
    
        node.on("dblclick", function() 
        { 
            // Make nodes configurable, only for the player nodes if they are not showing an intention
            if (Main.nodes[id].type != Main.playerType || $("#labelText").hasClass("statements"))
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

                if(Main.nodes[id].type !== Main.conversationType)
                {
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
                }
                else
                {
                    // For a conversation node, do nothing but give a warning
                    // that this text is supposed to be changed in the sidebar
                    thisNode.width = 50;
                    // Open converstation popup
                    selectElement(id);
                    openConversation();
                }
            }
        });

        var topOffset = parent.scrollTop();
        var leftOffset = parent.scrollLeft();
        node.css({"top": topOffset, "left": leftOffset});

        // initialise draggable elements.
        jsPlumb.draggable(node,
        {
            containment: "parent"
        });

        // make each ".ep" div a source and give it some parameters to work with.  here we tell it
        // to use a Continuous anchor and the StateMachine connectors, and also we give it the
        // connector's paint style.  note that in this demo the strokeStyle is dynamically generated,
        // which prevents us from just setting a jsPlumb.Defaults.PaintStyle.  but that is what i
        // would recommend you do. Note also here that we use the 'filter' option to tell jsPlumb
        // which parts of the element should actually respond to a drag start.
        jsPlumb.makeSource(node,
        {
            filter: ".ep", // only supported by jquery
            //anchor: "Continuous",
            //connector: ["StateMachine", {curviness: 20 }],
            //connectorStyle:
            //{
            //    strokeStyle: "#5c96bc",
            //    lineWidth: 2,
            //    outlineColor: "transparent",
            //    outlineWidth: 4
            //}
        });

        // initialise all '.w' elements as connection targets.
        jsPlumb.makeTarget(node,
        {
            dropOptions:
            {
                hoverClass: "dragHover"
            },
            anchor: "Continuous"
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

        // When we drag a node that is not part of the selected nodes, we remove the selection.
        node.on("mousedown", function(event)
        {
            event.stopPropagation();
            if (!event.ctrlKey)
            {
                if (!$(this).hasClass("multiSelected"))
                    $(".multiSelected").removeClass(
                        "multiSelected");
            }
        });

        return node;
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

    function openConversation()
    {
        var node = Main.nodes[Main.selectedElement];
        if (!node || node.type != Main.conversationType) return;
        
        $("#conversationDiv").empty();

        // set content of popup (current converstation statements)
        for (var i = 0; i < node.conversation.length; i++) {
            var conversation = node.conversation[i];
            var addedDiv = HtmlGenerator.addConversationOfType(conversation.type);
            addedDiv.find("textarea.text").val(conversation.text);
        }

        $(".addConversation").each( function() { $(this).show(); } );

        //open popup
        $('#allConversationsHTML').dialog(
        { 
            title: LanguageManager.sLang("edt_main_conversation"), 
            height: 600, 
            width: 600, 
            modal: true,
            appendTo: "#wrap",
            closeOnEscape: true,
            resizable: false,
            draggable: false,    
            buttons: [
            {
                text: LanguageManager.sLang("edt_common_confirm"),
                click: function() 
                {
                    // Save changes made to the conversation fields.
                    if (node.type === Main.conversationType) 
                    {
                        var conversationArray = [];
                        $("#conversationDiv").children().each(function() 
                        {
                            conversationArray.push(ObjectGenerator.conversationObject($(this)));
                        });
                        node.conversation = conversationArray;
                    } 
                    changeNodeText(node.id);
                    $("#allConversationsHTML").dialog('close'); 
                    
                }
            }, 
            {
                text: LanguageManager.sLang("edt_common_cancel"), click: function()
                { 
                    $("#allConversationsHTML").dialog('close'); 
                }
            }],
            close: function() 
            {  
                // do nothing but close the dialog 
                KeyControl.hotKeysActive = true;
                $("#main").focus();
            }
         });
    }
    
    function changeZoomedNodeTexts()
    {
        if (!Zoom.isZoomed()) return;
        Zoom.getZoomed().nodes.forEach(function (nodeID)
        {
            changeNodeText(nodeID);
        });
        repaintZoomedNodes();
    }

    function deleteAllSelected()
    {
        $(".pathToDeadEnd").removeClass("pathToDeadEnd");
        jsPlumb.doWhileSuspended(function()
        {
            for (var i = 0; i < Main.selectedElements.length; i++)
            {
                deleteElement(Main.selectedElements[i]);
            }
            if (Main.selectedElement !== null)
                deleteElement(Main.selectedElement);
            Main.selectedElements = [];
        }, true);

        repaintZoomedNodes();
        MiniMap.update(true);
    }

    function selectElement(elementId)
    {
        if (elementId in Main.trees)
            selectTree(elementId);
        else
            selectNode(elementId);
    }

    // Select a node.
    function selectNode(nodeID)
    {
        // Before we change the node, we first apply the changes that may have been made.
        if (Main.selectedElement !== null)
            applyChanges();

        // Currently selected node(s) should now not be selected.
        $(".selected").removeClass("selected");
        $(".multiSelected").removeClass("multiSelected");
        $(".bestPath").removeClass("bestPath");
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

        // Save parameter effects.
        var parameterEffects = [];

        $("#effectParameterDiv").children().each(function()
        {
            parameterEffects.push(ObjectGenerator.effectObject(
                $(this)));
        });

        node.parameters = parameterEffects;

        // Save preconditions.
        node.preconditions = ObjectGenerator.preconditionObject($("#preconditionsDiv").children().first());

        // Save intents.
        var intentsArray = [];
        $("#intentions").children().each(function()
        {
            var intentObj = ObjectGenerator.intentionObject($(this));
            if (intentObj !== null)
                intentsArray.push(intentObj);
        });
        node.intent = intentsArray;

        // Save the media.
        node.video = ObjectGenerator.nullFromHTMLValue($("#videoOptions").val());
        node.image = ObjectGenerator.nullFromHTMLValue($("#imageOptions").val());
        node.audio = ObjectGenerator.nullFromHTMLValue($("#audioOptions").val());

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

        // Repaint the selected node after all changes.
        jsPlumb.repaint($('#' + Main.selectedElement));
    }

    function highlightParents(nodeID)
    {
        if (nodeID === null) return;

        var connections = jsPlumb.getConnections(
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

    function repaintZoomedNodes()
    {
        if (!Zoom.isZoomed()) return;
        Zoom.getZoomed().nodes.forEach(function (nodeID) {
            jsPlumb.repaint(nodeID);
        });
    }

    function escapeTags(str) 
    {
        if (str === undefined)
            return str;
        else
        {
            return str
                .replace(/&/g, '&amp;')   // &
                .replace(/</g, '&lt;')  // <
                .replace(/>/g, '&gt;')  // >
                .replace(/\"/g, '&quot;') // "
                .replace(/\'/g, '&#39;')  // '
                .replace(/\n/g, "<br/>"); // \n
        }
    }

    function unEscapeTags(str)
    {
        if (str === undefined)
            return str;
        else
        {
            return str
                .replace(/&amp;/g, '&') // &
                .replace(/&lt;/g, '<') // <
                .replace(/&gt;/g, '>') // >
                .replace(/&quot;/g, '"') // "
                .replace(/&#39;/g, '\'') // '
                .replace(/<br\/>/g, "\n"); // \n
        }
    }

    /*
     ** Private Functions
     */

    //grid is based on the css specified size of tree containers.
    function initialiseGrid(domGridElement)
    {
        if (Main.gridX === undefined && Main.gridY === undefined)
        {
            Main.gridX = domGridElement.outerWidth();
            Main.gridY = domGridElement.outerHeight();

            var screenWidth = $("#main").innerWidth();
            var screenHeight = $("#main").innerHeight();
            //when the grid size is not an integer pixel amount some browsers do a floor, others do a ceiling
            //if the browser does a ceiling the grid is 1px too large for the screen and tree containers will not snap to grid properly
            if (4 * Main.gridX > screenWidth) //the browser did a ceiling, grid is too large
                Main.gridX--;
            if (4 * Main.gridY > screenHeight)
                Main.gridY--;
        }
    }

    //keeps the tree's position up to date for zooming out. handles snapping to grid
    function dropHandler(event, id)
    {
        Main.unsavedChanges = true;

        var tree = Main.trees[id];

        if (Zoom.isZoomed(id)) //when someone drags a node, the dragstop event is also captured by the tree conatiner. only an issue when zoomed in because it erases the coordinates to return to post zoom
            return;

        var position = $("#gridIndicator").position();
        var leftOffsetPos = position.left; // + $("#main").scrollLeft();
        var topOffsetPos = position.top; //+ $("#main").scrollTop();
        tree.dragDiv.css(
        {
            "top": topOffsetPos,
            "left": leftOffsetPos
        });

        tree.leftPos = Math.round(leftOffsetPos / Main.gridX); //store position to return to this point when zoomed in and out again
        tree.topPos = Math.round(topOffsetPos / Main.gridY);
        tree.level = Math.round(tree.topPos); //trees have a conversation level. trees on the same level are interleaved. trees on different levels are sequenced from top to bottom (low y to high y)
    
        MiniMap.update(true);
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
    }

    // Change the text of the node. 
    // also inputs images that show if the node has audio/visuals. 
    // We might want to refactor the function name
    function changeNodeText(nodeID)
    {
        var node = Main.nodes[nodeID];

        var text = "";
        var longestWord = "";
        switch (node.type)
        {
            case Main.computerType:
                // for computerType node: just input text
                text = escapeTags(node.text);
                break;
            case Main.playerType:
                // for playerType node: show text input, if the "Intentions"-option is off
                // (the relevant toolbar button then shows "Statements")
                if ($("#labelText").hasClass("statements"))
                    text = escapeTags(node.text);
                else
                {
                    // if the "Intentions"-option is on, show a list of intentions
                    text += "<ul>";
                    for (var i = 0; i < node.intent.length; i++)
                    {
                        var intent = escapeTags(node.intent[i].name);
                        text += "<li>" + intent + "</li>";
                        var longestIntentWord = intent.split(" ").reduce(
                            function(a, b)
                            {
                                return a.length > b.length ? a : b;
                            });
                        if (longestIntentWord.length > longestWord.length)
                            longestWord = longestIntentWord;
                    }
                    text += "</ul>";
                }
                break;
            case Main.conversationType:
                // for conversation type node: prefix textlines by the one that says them
                for (var j = 0; j < node.conversation.length; j++)
                {
                    var type;
                    switch (node.conversation[j].type)
                    {
                        case "computerText":
                            type = LanguageManager.sLang("edt_common_computer");
                            break;
                        case "playerText":
                            type = LanguageManager.sLang("edt_common_player");
                            break;
                        case "situationText":
                            type = LanguageManager.sLang("edt_common_situation");
                            break;
                    }
                    text += type + ": " + escapeTags(node.conversation[j].text) + "\n";
                }
                break;
        }
        //decide node-width
        if (longestWord === "")
            longestWord = text.split(" ").reduce(function(a, b)
            {
                return a.length > b.length ? a : b;
            });

        var textLength = $(".lengthTest").text(longestWord)[0].clientWidth / 11;

        var width = Math.max(3, textLength * 1.08, Math.sqrt(text.length));

        // get the node
        var nodeHTML = $('#' + nodeID);
        // fill div that can hold the images that visualize if the node has video/audio 
        var imageDiv = $('.imgDiv', nodeHTML);
        imageDiv.empty();
        if (node.comment !== "")                         
            imageDiv.append("<img src='"+editor_url+"png/node_properties/node_has_comments.png'>");
        if (node.audio !== null)                         
            imageDiv.append("<img src='"+editor_url+"png/node_properties/node_has_audio.png'>");
        if (node.video !== null)                         
            imageDiv.append("<img src='"+editor_url+"png/node_properties/node_has_video.png'>");
        if (node.image !== null)                         
            imageDiv.append("<img src='"+editor_url+"png/node_properties/node_has_image.png'>");
        if (node.jumpPoint)                              
            imageDiv.append("<img src='"+editor_url+"png/node_properties/node_has_jump.png'>");
        if (node.endNode)                                
            imageDiv.append("<img src='"+editor_url+"png/node_properties/node_has_end.png'>");
        if (node.initsNode)                              
            imageDiv.append("<img src='"+editor_url+"png/node_properties/node_has_premature_end.png'>");
        
        // add the text and imageDiv to the node itself
        // apply text changes
        nodeHTML.width(width + "em");
        var nodeTextDiv = $('.statementText', nodeHTML);
        nodeTextDiv.show();
        nodeTextDiv.html(text);
        
        // make sure the text fits inside the node
        var h = nodeTextDiv[0].clientHeight;
        nodeHTML.height(h);
        var nodeTextInput = nodeHTML.find('.statementInput');
        nodeTextInput.hide();
        nodeTextInput.height("100%");
        nodeTextInput.hide();

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

        $(".pathToDeadEnd").removeClass("pathToDeadEnd");

        var toDelete = nodeID;

        // No node should be selected after we remove a node.
        if (nodeID === Main.selectedElement)
            selectElement(null);

        var parentTree = Main.trees[Main.nodes[toDelete].parent];
        parentTree.nodes.splice(parentTree.nodes.indexOf(toDelete), 1);

        // Delete the node of our object and remove it from the graph.
        delete Main.nodes[toDelete];
        jsPlumb.remove($('#' + toDelete));
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
        // Don't show the table of best paths anymore.
        $("#bestPath").addClass("hidden");

        // Clear everything in the sidebar.
        $(
            "#preconditionsDiv, #effectParameterDiv, #intentions"
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

            for (var k = 0; k < node.parameters.length; k++)
            {
                var parameter = node.parameters[k];

                addedDiv = HtmlGenerator.addEmptyParameterEffect();
                addedDiv.find(".parameterid").val(parameter.parameterid);
                addedDiv.find(".changeType").val(parameter.changeType);
                addedDiv.find(".value").val(parameter.value);
            }

            // Intents:
            for (var l = 0; l < node.intent.length; l++)
            {
                var intent = node.intent[l];
                addedDiv = HtmlGenerator.addEmptyIntention();
                addedDiv.find(".name").val(intent.name);
            }

            $("#endNodeCheckbox").prop("checked", node.endNode);
            $("#initsNodeCheckbox").prop("checked", node.initsNode);
            $("#jumpNodeCheckbox").prop("checked", node.jumpPoint);

            // Media:
            //Media.fillMediaSelectors();
            $("#videoOptions").val(HtmlGenerator.nullToHTMLValue(node.video));
            $("#imageOptions").val(HtmlGenerator.nullToHTMLValue(node.image));
            $("#audioOptions").val(HtmlGenerator.nullToHTMLValue(node.audio));

            $("textarea#comment").val(node.comment);

            $("#scores").empty();
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

    function makeConnection(sourceID, targetID) 
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
        // The following tests assume and ensure the following invariants:
        // * Conversations can not be followed by a computer statement
        // * Conversations are single children.
        // * Siblings are of the same type.
        if(sourceNode.type === Main.conversationType && targetNode.type === Main.computerType)
        {
            alert(LanguageManager.sLang("edt_plumb_error_conversation_child"));
            return false;
        }
        var firstChildId = getFirstChildIdOrNull(sourceID);
        if (firstChildId !== null)
        {
            if (Main.nodes[firstChildId].type === Main.conversationType || targetNode.type === Main.conversationType)
            {
                alert(LanguageManager.sLang("edt_plumb_error_conversation_siblings"));
                return false;
            }
            if (targetNode.type != Main.nodes[firstChildId].type)
            {
                alert(LanguageManager.sLang("edt_plumb_error_child_type"));
                return false;
            }
        }
        
        // This check needs revision, maybe we can allow a node to have more than 10 outgoing connections
        if (jsPlumb.getConnections({source: sourceID}).length >= 10)
        {
            alert(LanguageManager.sLang("edt_plumb_error_child_type"));
            return false;
        }
        if(Validator.testDuplicateConnection(sourceID, targetID))
        {
            return false;
        }

        jsPlumb.connect({ source: sourceID, target: targetID });
        
        return true;
    }
    
    function getFirstChildIdOrNull(sourceId)
    {
        var connections = jsPlumb.getConnections({ source: sourceId });
        return (connections.length === 0 ? null : connections[0].targetId);
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
