/*
//This program has been developed by students from the bachelor Computer Science at Utrecht University 
//within the Software and Game project courses 2013-2015
//©Copyright Utrecht University (Department of Information and Computing Sciences) 
*/

var Load;

(function()
{
    "use strict";

    Load =
    {
        importScript: importScript,
        suspendedly: suspendedly
    };

    var loadedMetaObject;
    
    $(document).ready(function()
    {
        $("#importScreen").html(Parts.getImportScreenHTML());
        $("#importScript").on('click', function()
        {
            $("#importScreen").dialog(
            {
                title : LanguageManager.sLang("edt_load_import_title"),
                height: ParameterValues.heightMedia,
                width: ParameterValues.widthMedia,
                modal: true,
                buttons: 
                [{
                    text: LanguageManager.sLang("edt_load_import"),
                    click: function()
                    {
                        importScript();
                        $("#importScreen").dialog('close');
                    }
                },
                {
                    text: LanguageManager.sLang("edt_common_close"),
                    click: function()
                    {
                        $("#importScreen").dialog('close');
                    }
                }]
            });
        });
        
        // At the beginning no XML is loaded, so we need to define a metaObject
        Metadata.getNewDefaultMetaObject();
        loadedMetaObject = Metadata.metaObject;
    });

    /*
     ** Public Functions
     */

    function importScript()
    {
        var input = document.getElementById("import").files;

        if (input.length < 1)
            return;

        var reader = new FileReader();

        $("#loading").show();
        reader.onload = function()
        {
            var xml;
            try
            {
                xml = $($.parseXML(reader.result));
            }
            catch (err)
            {
                alert(LanguageManager.sLang("edt_load_invalid_xml"));
                return;
            }

            prepareRebuild();

            loadMetadata($($('metadata', xml)[0]));
            loadFeedbackForm($($('feedbackform', xml)[0]));
            suspendedly(generateGraph)(xml);
        };

        reader.readAsText(input[0]);

        //Loading of script complete, hide loading div:
        $("#loading").hide();
    }

    // Wraps a function so that it is executed while jsPlumb drawing is suspended.
    function suspendedly(func)
    {
        return function()
        {
            var args = Array.prototype.slice.call(arguments);
            jsPlumb.doWhileSuspended(function()
            {
                func.apply(this, args);
            });
        };
    }

    /*
     ** Private Functions
     */
     
    function prepareRebuild()
    {
        Main.selectElement(null);
        Main.nodes = {};
        Main.trees = {};

        if (loadedMetaObject === undefined)
        {
            Metadata.getNewDefaultMetaObject();
            loadedMetaObject = Metadata.metaObject;
        }

        jsPlumb.deleteEveryEndpoint();
        $(".w").remove();

        Main.jsPlumbCounter = 0;
    }

    // Generates the entire graph, including the objects.
    function generateGraph(xml)
    {
        var connections = {};

        if (!loadedMetaObject.scriptVersion) //version is undefined. script does not have sequence, interleave or tree tags
        {
            generateGraphLegacy(xml);
        }
        else
        {
            var level = 0;
            $('interleave', xml).each(function()
            {
                $(this).children('tree').each(function()
                {
                    var treeID = this.getAttribute('id');
                    Main.maxTreeNumber = Math.max(parseInt(treeID.substring(4)) + 1, Main.maxTreeNumber);
                    var tree = Main.createEmptyTree(treeID, false, 0, 0);

                    // get the subject from the XML
                    tree.subject = $(this).children('subject')[0].textContent; 

                    tree.optional = $(this).attr('optional') == "true";

                    // get the position from the XML, note that this is in grid coordinates, not screen coordinates
                    var position = $(this).children('position')[0]; 
                    tree.leftPos = Math.round(Utils.parseDecimalIntWithDefault($(position).children('x')[0].textContent, 0)); // set x
                    tree.topPos  = Math.round(Utils.parseDecimalIntWithDefault($(position).children('y')[0].textContent, 0)); // set y
                    tree.level = Math.round(level); // set level

                    tree.dragDiv.css(
                    { // set style position
                        top : tree.topPos  * (Main.gridY) + "px", //grid variables are from main.js
                        left: tree.leftPos * (Main.gridX) + "px"
                    });

                    $('.subjectName', tree.dragDiv).text(Main.unEscapeTags(tree.subject)); // set subject in HTML
                    $('.subjectNameInput', tree.dragDiv).val(Main.unEscapeTags(tree.subject)); // set subject in HTML

                    tree.dragDiv.css('border-color', '');

                    $(this).children().each(function() 
                    { // parse the tree in the container
                        switch (this.nodeName)
                        {
                            case "computerStatement":
                                loadStatement(this, Main.computerType, connections, treeID);
                                break;
                            case "playerStatement":
                                loadStatement(this, Main.playerType, connections, treeID);
                                break;
                            case "conversation":
                                loadStatement(this, Main.conversationType, connections, treeID);
                                break;
                        }
                    });
                });
                
                level++;
            });
        }

        // Makes the connections between the nodes.
        $.each(connections, function(sourceId, targets)
        {
            for (var i = 0; i < targets.length; i++)
                jsPlumb.connect(
                {
                    source: sourceId,
                    target: targets[i]
                });
        });
    }

    function generateGraphLegacy(xml)
    {
        var tree = Main.createEmptyTree(null, false, 0, 0);
        var connections = {};

        $('script', xml).children().each(function()
        { //xml has one child: the script
            switch (this.nodeName)
            {
                case "computerStatement":
                    loadStatement(this, Main.computerType,
                        connections, tree.id);
                    break;
                case "playerStatement":
                    loadStatement(this, Main.playerType,
                        connections, tree.id);
                    break;
                case "conversation":
                    loadStatement(this, Main.conversationType,
                        connections, tree.id);
                    break;
            }
        });

        // Makes the connections between the nodes.
        $.each(connections, function(sourceId, targets)
        {
            for (var i = 0; i < targets.length; i++)
                jsPlumb.connect(
                {
                    source: sourceId,
                    target: targets[i]
                });
        });
    }

    // Load the metadata of the script.
    function loadMetadata(metadata)
    {
        var character;
        character = $(metadata).find('character').attr('id');

        var version = parseInt($(metadata).find('version').text());
        var name = $(metadata).find('name').text(); 
        // set the name in the main screen of the editor
        $('#scriptNameTab .scriptName').text(Main.unEscapeTags(name)); 
        var description = $(metadata).find('description').text();
        var difficulty = $(metadata).find('difficulty').text();
        var parameterObject = {};
        var parameters = $(metadata).find('parameters').children();
        var defaultChangeType = $(metadata).find('defaultChangeType').text();
        // Allows the editor to load older XML versions without defaultChangeType
        if (defaultChangeType === "")
            defaultChangeType = LanguageManager.sLang("edt_parts_delta");
        $("#defaultChangeTypeSelect").val(defaultChangeType);

        for (var i = 0; i < parameters.length; i++)
        {
            var parameter = parameters[i];
            var paramId = parameter.attributes.id.value;

            var paramMatch = paramId.match(/^p(\d+)$/);
            if (paramMatch !== null)
            {
                var paramNumber = parseInt(paramMatch[1]);
                if (paramNumber > Metadata.parameterCounter)
                    Metadata.parameterCounter = paramNumber;
            }
            
            parameterObject[paramId] = 
            {
                name: Main.unEscapeTags(parameter.attributes.name.value),
                initialValue: (parameter.hasAttribute('initialValue') ?
                    Utils.parseDecimalIntWithDefault(parameter.attributes.initialValue.value, 0) : 0),
                weightForFinalScore: 0,
                minimumScore: parameter.attributes.minimumScore.value,
                maximumScore: parameter.attributes.maximumScore.value,
                parameterDescription: parameter.hasAttribute("parameterDescription") ? Main.unEscapeTags(parameter.attributes.parameterDescription.value) : ""
            };
        }

        $(metadata).children('scoringFunction').children('sum').children('scale').children('paramRef').each(function()
        {
            var parameterId = this.attributes.idref.value;
            //if the parameter exists...
            if (parameterId in parameterObject)
            {
                //...add the weight of the parameter.
                parameterObject[parameterId].weightForFinalScore =
                    Utils.parseDecimalIntWithDefault($(this).parent().attr('scalar'), 0);
                    
            }
        });

        var timePId = null;

        if (parameterObject.hasOwnProperty('t'))
            timePId = 't';

        Metadata.timePId = timePId;

        Metadata.metaObject = {
            name: name,
            difficulty: difficulty,
            character: character,
            description: description,
            parameterObject: parameterObject,
            scriptVersion: version,
            defaultChangeType: defaultChangeType
        };
    }

    function loadFeedbackForm(feedbackForm)
    {
        var allConditions = {};
        $(feedbackForm).find("parameter").each(function() {
            var paramID = $(this).attr("id");
            var conditions = [];
            $(this).find("condition").each(function() {

                    var condition = {
                        ID: null,
                        test: null,
                        values: [],
                        feedbackString: null
                    };

                    var conditionTest = $(this).attr('test');
                    var conditionValue = $(this).attr('value');
                    var conditionFeedbackString = $(this).text();

                    if (conditionValue === undefined)
                    {
                        var lowerBound = $(this).attr('lowerBound');
                        var upperBound = $(this).attr('upperBound');

                        if (parseInt(lowerBound) >= parseInt(upperBound))
                        {
                            upperBound = parseInt(lowerBound) + 1;
                        }

                        if (lowerBound !== undefined)
                        {
                            if (parseInt(lowerBound) >= parseInt(upperBound))
                            {
                                upperBound = parseInt(lowerBound) + 1;
                            }

                            condition.values.push(lowerBound);
                            condition.values.push(upperBound);

                        }
                    }
                    else 
                    {
                        if (conditionTest !== "min" || conditionTest !== "max")
                        {
                            condition.values.push(conditionValue);
                        }
                    }


                    condition.ID = paramID;
                    condition.test = conditionTest;
                    condition.feedbackString = conditionFeedbackString;

                    conditions.push(condition);
            });

            var defaultConditionEl = $(this).find("default");

            var defaultCondition = {
                ID: null,
                feedbackString: null
            };

            defaultCondition.ID = paramID;
            defaultCondition.feedbackString = defaultConditionEl.text();

            conditions.push(defaultCondition);

            allConditions[paramID] = conditions;
        });

        FeedbackForm.conditions = allConditions;
    }

    // Load a statement.
    function loadStatement(statement, type, connections, treeID)
    {
        var id = $(statement).attr('id').replace(/\./g, '_');

        var idMatch = id.match(/^edit_(\d+)$/);
        if (idMatch !== null)
            Main.jsPlumbCounter = Math.max(Main.jsPlumbCounter, parseInt(idMatch[1]));
        else
            id = "ext_" + id;
        
        var jumpPoint = $(statement).attr('jumpPoint') == "true";
        var initsNode = $(statement).attr('inits') == "true";
        var endNode = $(statement).attr('possibleEnd') == "true";
            
        var text = "";
        var conversationArray = [];
        if (type == Main.conversationType)
        {
            var allChildren = $(statement).children();
            // Get all the text elements of the conversation.
            for (var i = 0; i < allChildren.length; i++)
            {
                var conversationTextType = allChildren[i].nodeName;
                if (conversationTextType == "computerText" ||
                    conversationTextType == "playerText" ||
                    conversationTextType == "situationText")
                {
                    text += allChildren[i].textContent + "<br />";
                    conversationArray.push(
                    {
                        type: conversationTextType,
                        text: allChildren[i].textContent
                    });
                }
            }
        }
        // Load the stored values for the node.
        else
            text = $(statement).find('text').text();
        var xPos = $(statement).find('x').text();
        var yPos = $(statement).find('y').text();

        // Load media.
        var video = nullIfMissing($(statement).find('video').attr('extid'));
        var image = nullIfMissing($(statement).find('image').attr('extid'));
        var audio = nullIfMissing($(statement).find('audio').attr('extid'));

        // Load the preconditions of this node.
        var preconditionsXML = $(statement).find("preconditions");
        var preconditionsJS;
        if (preconditionsXML.length === 0)
            preconditionsJS = {type: "alwaysTrue", preconditions: []};
        else
            preconditionsJS = loadPreconditions(preconditionsXML.children()[0]);

        var parameterEffects = [];
        var intentsArray = [];
        var targets;
        if (type === Main.playerType)
        {
            var pEffEl = $(statement).find('parameterEffects');
            var pEffs = pEffEl.children(); //all parameter effects of the node.
            for (var j = 0; j < pEffs.length; j++)
            {
                var parameter = pEffs[j];
                parameterEffects.push(
                {
                    parameterid: parameter.attributes.idref.value,
                    changeType: parameter.attributes.changeType.value,
                    value: parseInt(parameter.attributes.value.value)
                });
            }

            var intents = $(statement).find('intents').children();

            for (var l = 0; l < intents.length; l++)
                intentsArray.push(
                {
                    name: $(intents[l]).text()
                });

            targets = $(statement).find('nextComputerStatements').children();
            if (targets.length === 0)
                targets = $(statement).find('nextComputerStatement');
        }
        else
            targets = $(statement).find('responses').children();

        var comment = $(statement).find('comment').text();

        if (targets.length > 0)
        {
            // Save all the connections. We will create the connections when all nodes have been added.
            connections[id] = [];
            for (var m = 0; m < targets.length; m++)
            {
                var targetID = targets[m].attributes.idref.value.replace(/\./g, '_');
                if (!/^edit_\d+$/.test(targetID))
                    targetID = 'ext_' + targetID;
                connections[id].push(targetID);
            }
        }

        var node = Main.createAndReturnNode(type, id, Main.trees[treeID].div, Main.trees[treeID].dragDiv.attr('id'));
        Main.nodes[id] = {
            text: (type == Main.conversationType ? "" : text),
            conversation: conversationArray,
            type: type,
            parameters: parameterEffects,
            preconditions: preconditionsJS,
            intent: intentsArray,
            video: video,
            image: image,
            audio: audio,
            comment: comment,
            endNode: endNode,
            initsNode: initsNode,
            jumpPoint: jumpPoint,
            visited: false,
            topologicalRank: 0,
            id: id,
            parent: treeID
        };

        // Set the position of the node.
        node.css({
            top: yPos + "px",
            left: xPos + "px"
        });

        // fill the insides with text
        var txtArea = node.find('textarea.nodestatement');
        var txtView = node.find('.statementText');
        txtArea.empty().append(text);
        txtView.empty().append(text);
    }

    // Load all preconditions from a given precondition element tree.
    function loadPreconditions(preconditionXMLElement)
    {
        var preconditionType = preconditionXMLElement.nodeName;
        var preconditionsArray = [];

        var preconditionChildren = $(preconditionXMLElement).children();
        for (var i = 0; i < preconditionChildren.length; i++)
        {
            if (preconditionChildren[i].nodeName == "condition")
            {
                if (preconditionChildren[i].attributes.idref.value in Metadata.metaObject.parameterObject)
                {
                    preconditionsArray.push(
                    {
                        parameterid: preconditionChildren[i].attributes.idref.value,
                        test: preconditionChildren[i].attributes.test .value,
                        value: parseInt(preconditionChildren[i].attributes.value.value)
                    });
                }
            }
            else
            {
                preconditionsArray.push(loadPreconditions(preconditionChildren[i]));
            }
        }
        return {
            type: preconditionType,
            preconditions: preconditionsArray
        };
    }

    function nullIfMissing(elements)
    {
        if (elements === undefined || elements.length === 0)
            return null;
        else if (typeof elements == "string")
            return elements;
        else
            return elements.text();
    }
})();
