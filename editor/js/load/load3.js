/* © Utrecht University (Department of Information and Computing Sciences) */

var Load3;

(function()
{
    "use strict";

    Load3 =
    {
        generateGraph: generateGraph,
        loadMetadata: loadMetadata,
        loadStatement: loadStatement,
        loadConversation: loadConversation,
        expandConversations: expandConversations
    };

    // Generates the entire graph, including the objects.
    function generateGraph(xml)
    {
        var level = 0;
        // Conversations stores all the accumulated conversations so we can expand them and give the nodes fresh ids at the end
        var conversations = {};

        $(xml).find('interleave').each(function()
        {
            $(this).children('tree').each(function()
            {
                var connections = {};

                var treeID = this.getAttribute('id').replace(/\./g, '_');
                var idMatch = treeID.match(/^tree(\d+)$/);
                if (idMatch)
                {
                    var treeNumber = parseInt(idMatch[1]);
                    Main.maxTreeNumber = Math.max(treeNumber + 1, Main.maxTreeNumber);
                    treeID = "dialogue" + treeNumber;
                }
                else
                {
                    treeID = "ext_" + treeID;
                }

                // get the position from the XML, note that this is in grid coordinates, not screen coordinates
                var position = $(this).children('position')[0];
                var leftPos = Math.round(Utils.parseDecimalIntWithDefault($(position).children('x')[0].textContent, 0));
                var topPos  = Math.round(Utils.parseDecimalIntWithDefault($(position).children('y')[0].textContent, 0));

                var tree = Main.createEmptyTree(treeID, leftPos, topPos);
                var plumbInstance = tree.plumbInstance;

                tree.subject = Utils.unEscapeHTML($(this).children('subject')[0].textContent);

                tree.optional = Utils.parseBool($(this).attr('optional'));

                $(tree.dragDiv).toggleClass('optional', tree.optional);

                tree.level = level;

                tree.dragDiv.find('.subjectName').text(tree.subject); // set subject in HTML
                tree.dragDiv.find('.subjectNameInput').val(tree.subject); // set subject in HTML

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
                            loadConversation(this, conversations, treeID);
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

        expandConversations(conversations);
    }

    // Load the metadata of the scenario.
    function loadMetadata(metadata)
    {
        Metadata.container.name = Utils.unEscapeHTML($(metadata).find('name').text());
        $('#scenarioNameTab .scenarioName').text(Metadata.container.name);
        Metadata.container.description = Utils.unEscapeHTML($(metadata).find('description').text());
        Metadata.container.difficulty = $(metadata).find('difficulty').text();

        var parameters = Parameters.container;
        $(metadata).find('parameters').children().each(function()
        {
            var paramId = this.attributes.id.value;

            var paramMatch = paramId.match(/^p(\d+)$/);
            if (paramMatch !== null)
            {
                var paramNumber = parseInt(paramMatch[1]);
                if (paramNumber > Parameters.counter)
                    Parameters.counter = paramNumber;
            }

            var defaultValue = this.hasAttribute('initialValue') ? Utils.parseDecimalIntWithDefault(this.attributes.initialValue.value, 0) : 0;

            var minimum, maximum;
            if (this.hasAttribute('minimumScore')) minimum = parseInt(this.getAttribute('minimumScore'));
            if (this.hasAttribute('maximumScore')) maximum = parseInt(this.getAttribute('maximumScore'));

            parameters.byId[paramId] =
            {
                id: paramId,
                name: Utils.unEscapeHTML(this.attributes.name.value),
                type: $.extend({}, Types.primitives.integer, { defaultValue: defaultValue, minimum: minimum, maximum: maximum }),
                description: this.hasAttribute("parameterDescription") ? Utils.unEscapeHTML(this.attributes.parameterDescription.value) : ""
            };
            parameters.sequence.push(parameters.byId[paramId]);
        });

        if ('t' in parameters.byId) Parameters.timeId = 't';
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

        var characterIdRef;
        if (type === Main.computerType)
        {
            characterIdRef = Config.container.characters.sequence[0].id;
        }

        var allowInterleaveNode = Utils.parseBool($(statement).attr('jumpPoint'));
        var allowDialogueEndNode = Utils.parseBool($(statement).attr('inits'));
        var endNode = Utils.parseBool($(statement).attr('possibleEnd'));

        var text = Utils.unEscapeHTML($(statement).find('text').text());

        var xPos = $(statement).find('x').text();
        var yPos = $(statement).find('y').text();

        // Load the preconditions of this node.
        var preconditionsXML = $(statement).find("preconditions");
        var preconditions;
        if (preconditionsXML.length === 0)
            preconditions = null;
        else
            preconditions = loadPreconditions(preconditionsXML.children()[0]);

        var parameterEffects = Config.getNewDefaultParameterEffects(characterIdRef);
        var acceptableScopes = ['per', 'per-' + type];
        if (type === Main.computerType) acceptableScopes.push('per-' + type + '-own');
        var propertyValues = Config.getNewDefaultPropertyValues(acceptableScopes, characterIdRef);
        var targets;
        if (type === Main.playerType)
        {
            var pEffEl = $(statement).find('parameterEffects');
            var pEffs = pEffEl.children(); //all parameter effects of the node.
            for (var j = 0; j < pEffs.length; j++)
            {
                var parameter = pEffs[j];
                parameterEffects.userDefined.push(
                {
                    idRef: parameter.attributes.idref.value,
                    operator: parameter.attributes.changeType.value == "delta" ? Types.assignmentOperators.addAssign.name : Types.assignmentOperators.assign.name,
                    value: parseInt(parameter.attributes.value.value)
                });
            }

            var intents = $(statement).children('intents');
            if (intents.length > 0)
            {
                migrateProperty(intents[0], 'intent', 'intentProperty', propertyValues, true);
            }

            targets = $(statement).find('nextComputerStatements').children();
            if (targets.length === 0)
                targets = $(statement).find('nextComputerStatement');
        }
        else
            targets = $(statement).find('responses').children();

        var comment = Utils.unEscapeHTML($(statement).find('comment').text());

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
            text: text,
            type: type,
            preconditions: preconditions,
            parameterEffects: parameterEffects,
            propertyValues: propertyValues,
            comment: comment,
            endNode: endNode,
            allowDialogueEndNode: allowDialogueEndNode,
            allowInterleaveNode: allowInterleaveNode,
            visited: false,
            topologicalRank: 0,
            id: id,
            parent: treeID
        };

        if (type === Main.computerType) Main.nodes[id].characterIdRef = characterIdRef;

        // Set the position of the node.
        Utils.cssPosition(node, {
            top: yPos,
            left: xPos
        });

        // fill the insides with text
        var txtView = node.find('.statementText');
        txtView.html(Utils.escapeHTML(text));
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
                if (preconditionChildren[i].attributes.idref.value in Parameters.container.byId)
                {
                    preconditionsArray.push(
                    {
                        idRef: preconditionChildren[i].attributes.idref.value,
                        operator: preconditionChildren[i].attributes.test.value,
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
            subconditions: preconditionsArray
        };
    }

    /*
     * Migrates the child with the propertyId as the element name of the parentXML into the given migration property as a value.
     * attributeName is an optional parameter, when set, it uses the attribute value of the given attribute as the property value.
     */
    function migrateProperty(parentXML, propertyId, migrationPropertyName, propertyValues, needsUnEscaping, attributeName)
    {
        if (migrationPropertyName in Config.container.migration)
        {
            var valueXML = $(parentXML).children(propertyId);
            if (valueXML.length > 0)
            {
                if (attributeName) valueXML.text(valueXML.attr(attributeName));
                var propertyValue;
                var type;
                var migrationPropertyIdRef = Config.container.migration[migrationPropertyName].idRef;
                var firstCharacterId = Config.container.characters.sequence[0].id;
                if (migrationPropertyIdRef in propertyValues.characterIndependent)
                {
                    type = Config.container.properties.byId[migrationPropertyIdRef].type;
                    propertyValue = type.fromXML(valueXML[0]);
                    propertyValues.characterIndependent[migrationPropertyIdRef] = needsUnEscaping? Utils.unEscapeHTML(propertyValue) : propertyValue;
                }
                else if (migrationPropertyIdRef in propertyValues.perCharacter[firstCharacterId])
                {
                    if (migrationPropertyIdRef in Config.container.characters.properties.byId)
                    {
                        type = Config.container.characters.properties.byId[migrationPropertyIdRef].type;
                        propertyValue = type.fromXML(valueXML[0]);
                    }
                    else
                    {
                        type = Config.container.characters.byId[firstCharacterId].properties.byId[migrationPropertyIdRef].type;
                        propertyValue = type.fromXML(valueXML[0]);
                    }
                    propertyValues.perCharacter[firstCharacterId][migrationPropertyIdRef] = needsUnEscaping ? Utils.unEscapeHTML(propertyValue) : propertyValue;
                }
            }
        }
    }

    function loadConversation(conversationXMLElement, conversations, treeID)
    {
        var id = $(conversationXMLElement).attr('id').replace(/\./g, '_');

        var idMatch = id.match(/^edit_(\d+)$/);
        if (idMatch !== null)
            Main.jsPlumbCounter = Math.max(Main.jsPlumbCounter, parseInt(idMatch[1]));
        else
            id = "ext_" + id;

        var endNode = Utils.parseBool($(conversationXMLElement).attr('possibleEnd'));
        var comment = Utils.unEscapeHTML($(conversationXMLElement).find('comment').text());

        var xPos = $(conversationXMLElement).find('x').text();
        var yPos = $(conversationXMLElement).find('y').text();

        conversations[id] = {};
        conversations[id].xPos = xPos;
        conversations[id].yPos = yPos;
        conversations[id].textNodes = [];
        // Get all the text elements of the conversation.
        $(conversationXMLElement).children().each(function()
        {
            if (this.nodeName == "computerText")
            {
                conversations[id].textNodes.push(
                {
                    type: Main.computerType,
                    text: Utils.unEscapeHTML(this.textContent)
                });
            }
            else if (this.nodeName == "playerText")
            {
                conversations[id].textNodes.push(
                {
                    type: Main.playerType,
                    text: Utils.unEscapeHTML(this.textContent)
                });
            }
            else if (this.nodeName == "situationText")
            {
                conversations[id].textNodes.push(
                {
                    type: Main.situationType,
                    text: Utils.unEscapeHTML(this.textContent)
                });
            }
        });

        // Load the preconditions of this node.
        var preconditionsXML = $(conversationXMLElement).find("preconditions");
        var preconditionsJS;
        if (preconditionsXML.length === 0)
            preconditionsJS = null;
        else
            preconditionsJS = loadPreconditions(preconditionsXML.children()[0]);

        var targets = $(conversationXMLElement).find('responses').children();
        conversations[id].connections = [];
        if (targets.length > 0)
        {
            // Save all the connections so we can expand the conversation later on and connect the expanded nodes
            for (var m = 0; m < targets.length; m++)
            {
                var targetID = targets[m].attributes.idref.value.replace(/\./g, '_');
                if (!/^edit_\d+$/.test(targetID))
                    targetID = 'ext_' + targetID;
                conversations[id].connections.push(targetID);
            }
        }

        var firstConversationNode = conversations[id].textNodes.length > 0 ? conversations[id].textNodes[0] : null;
        if (!firstConversationNode)
        {
            firstConversationNode = { type: Main.playerType, text: "" };
        }

        var characterIdRef;
        if (firstConversationNode.type === Main.computerType)
        {
            characterIdRef = Config.container.characters.sequence[0].id;
        }

        var node = Main.createAndReturnNode(firstConversationNode.type, id, Main.trees[treeID].div, Main.trees[treeID].dragDiv.attr('id'));
        Main.nodes[id] = {
            text: firstConversationNode.text,
            type: firstConversationNode.type,
            parameterEffects: Config.getNewDefaultParameterEffects(characterIdRef),
            preconditions: preconditionsJS,
            propertyValues: Config.getNewDefaultPropertyValues(['independent']),
            comment: comment,
            endNode: endNode,
            allowDialogueEndNode: false,
            allowInterleaveNode: false,
            visited: false,
            topologicalRank: 0,
            id: id,
            parent: treeID
        };

        if (firstConversationNode.type === Main.computerType) Main.nodes[id].characterIdRef = characterIdRef;

        // Set the position of the node.
        Utils.cssPosition(node, {
            top: yPos,
            left: xPos
        });

        // fill the insides with text
        var txtView = node.find('.statementText');
        txtView.html(Utils.escapeHTML(firstConversationNode.text));
    }

    function expandConversations(conversations)
    {
        for (var firstConversationNodeId in conversations)
        {
            var firstConversationNode = Main.nodes[firstConversationNodeId];
            var lastConversationNodeId = firstConversationNodeId;
            // Stores the connections single between conversation nodes
            var singleConnections = {};
            var previousConversationNodeId = firstConversationNodeId;

            // Loop over all textNodes except for the first, it has already been created
            for (var i = 1; i < conversations[firstConversationNodeId].textNodes.length; i++)
            {
                var textNode = conversations[firstConversationNodeId].textNodes[i];

                var node = Main.createAndReturnNode(textNode.type, null, Main.trees[firstConversationNode.parent].div, Main.trees[firstConversationNode.parent].dragDiv.attr('id'));
                var id = node.attr('id');

                var endNode = false;
                if (i === conversations[firstConversationNodeId].textNodes.length - 1)
                {
                    endNode = firstConversationNode.endNode;
                    firstConversationNode.endNode = false;
                    lastConversationNodeId = id;
                }

                singleConnections[previousConversationNodeId] = id;

                var characterIdRef;
                var acceptableScopes = ['per', 'per-' + textNode.type];
                if (textNode.type === Main.computerType)
                {
                    characterIdRef = Config.container.characters.sequence[0].id;
                    acceptableScopes.push('per-' + textNode.type + '-own');
                }

                Main.nodes[id] = {
                    text: textNode.text,
                    type: textNode.type,
                    parameterEffects: Config.getNewDefaultParameterEffects(characterIdRef),
                    preconditions: null,
                    propertyValues: Config.getNewDefaultPropertyValues(acceptableScopes, characterIdRef),
                    comment: "",
                    endNode: endNode,
                    allowDialogueEndNode: false,
                    allowInterleaveNode: false,
                    visited: false,
                    topologicalRank: 0,
                    id: id,
                    parent: firstConversationNode.parent
                };

                if (textNode.type === Main.computerType) Main.nodes[id].characterIdRef = characterIdRef;

                // Set the position of the node and offset it by a small amount to show underlying nodes
                Utils.cssPosition(node, {
                    top: Utils.parseDecimalIntWithDefault(conversations[firstConversationNodeId].yPos, 0) + i * 8,
                    left: Utils.parseDecimalIntWithDefault(conversations[firstConversationNodeId].xPos, 0) + i * 8
                });

                // fill the insides with text
                var txtView = node.find('.statementText');
                txtView.html(Utils.escapeHTML(textNode.text));

                previousConversationNodeId = id;
            }

            var plumbInstance = Main.getPlumbInstanceByNodeID(firstConversationNodeId);

            // Connect each conversation node sequentially
            for (var source in singleConnections)
            {
                plumbInstance.connect(
                {
                    source: source,
                    target: singleConnections[source]
                });
            }

            // Connect last node to the original conversation's targets
            conversations[firstConversationNodeId].connections.forEach(function(target)
            {
                plumbInstance.connect(
                {
                    source: lastConversationNodeId,
                    target: target
                });
            });
        }
    }

})();
