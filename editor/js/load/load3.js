/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

var Load3;

(function()
{
    "use strict";

    Load3 =
    {
        generateGraph: generateGraph,
        loadMetadata: loadMetadata,
        loadFeedbackForm: loadFeedbackForm,
        loadStatement: loadStatement
    };

    // Generates the entire graph, including the objects.
    function generateGraph(xml)
    {
        var level = 0;
        $('interleave', xml).each(function()
        {
            $(this).children('tree').each(function()
            {
                var connections = {};

                var treeID = this.getAttribute('id');
                Main.maxTreeNumber = Math.max(parseInt(treeID.substring(4)) + 1, Main.maxTreeNumber);
                var tree = Main.createEmptyTree(treeID, false, 0, 0);
                var plumbInstance = tree.plumbInstance;

                // get the subject from the XML
                tree.subject = Main.unEscapeTags($(this).children('subject')[0].textContent);

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

                $('.subjectName', tree.dragDiv).text(tree.subject); // set subject in HTML
                $('.subjectNameInput', tree.dragDiv).val(tree.subject); // set subject in HTML

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

                // Makes the connections between the nodes.
                $.each(connections, function(sourceId, targets)
                {
                    for (var i = 0; i < targets.length; i++)
                        plumbInstance.connect(
                        {
                            source: sourceId,
                            target: targets[i]
                        });
                });
            });

            level++;
        });
    }

    // Load the metadata of the script.
    function loadMetadata(metadata)
    {
        var name = Main.unEscapeTags($(metadata).find('name').text());
        $('#scriptNameTab .scriptName').text(name);
        var description = Main.unEscapeTags($(metadata).find('description').text());
        var difficulty = $(metadata).find('difficulty').text();
        var parameterObject = {};
        var parameters = $(metadata).find('parameters').children();
        var defaultChangeType = $(metadata).find('defaultChangeType').text();
        // Allows the editor to load older XML versions without defaultChangeType
        if (defaultChangeType === "")
            defaultChangeType = LanguageManager.sLang("edt_parts_delta");

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
                description: parameter.hasAttribute("parameterDescription") ? Main.unEscapeTags(parameter.attributes.parameterDescription.value) : ""
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
            description: description,
            properties: {},
            characters: Metadata.getNewDefaultCharactersObject(),
            parameterObject: parameterObject,
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
                    var conditionFeedbackString = Main.unEscapeTags($(this).text());

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
                    text += Main.unEscapeTags(allChildren[i].textContent) + "<br />";
                    conversationArray.push(
                    {
                        type: conversationTextType,
                        text: Main.unEscapeTags(allChildren[i].textContent)
                    });
                }
            }
        }
        // Load the stored values for the node.
        else
            text = Main.unEscapeTags($(statement).find('text').text());
        var xPos = $(statement).find('x').text();
        var yPos = $(statement).find('y').text();

        // Load media.
        var video = Load.nullIfMissing($(statement).find('video').attr('extid'));
        var image = Load.nullIfMissing($(statement).find('image').attr('extid'));
        var audio = Load.nullIfMissing($(statement).find('audio').attr('extid'));

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
                    name: Main.unEscapeTags($(intents[l]).text())
                });

            targets = $(statement).find('nextComputerStatements').children();
            if (targets.length === 0)
                targets = $(statement).find('nextComputerStatement');
        }
        else
            targets = $(statement).find('responses').children();

        var comment = Main.unEscapeTags($(statement).find('comment').text());

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
            characterIdRef: Config.configObject.characters.sequence[0].id,
            parameters: parameterEffects,
            preconditions: preconditionsJS,
            intent: intentsArray,
            properties: {},
            characters: Metadata.getNewDefaultCharactersObject(),
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
        txtArea.val(text);
        txtView.html(Main.escapeTags(text));
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
})();