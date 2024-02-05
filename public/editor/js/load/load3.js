// © DialogueTrainer

/* exported Load3 */
let Load3;

(function()
{
    "use strict";

    // eslint-disable-next-line no-global-assign
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
        // Conversations stores all the accumulated conversations so we can expand them and give the nodes fresh ids at the end
        const conversations = {};

        $(xml).find('interleave').each(function()
        {
            $(this).children('tree').each(function()
            {
                const connections = {};

                let treeID = this.getAttribute('id').replace(/\./g, '_');
                const idMatch = treeID.match(/^tree(\d+)$/);
                if (idMatch)
                {
                    const treeNumber = parseInt(idMatch[1]);
                    Main.maxTreeNumber = Math.max(treeNumber + 1, Main.maxTreeNumber);
                    treeID = "dialogue" + treeNumber;
                }
                else
                {
                    treeID = "ext_" + treeID;
                }

                // Get the position from the XML, note that this is in grid coordinates, not screen coordinates
                const position = $(this).children('position')[0];
                const leftPos = Math.round(Utils.parseDecimalIntWithDefault($(position).children('x')[0].textContent, 0));
                const topPos = Math.round(Utils.parseDecimalIntWithDefault($(position).children('y')[0].textContent, 0));

                const tree = Main.createEmptyTree(treeID, leftPos, topPos);
                const plumbInstance = tree.plumbInstance;

                tree.subject = Utils.unEscapeHTML($(this).children('subject')[0].textContent);

                tree.optional = Utils.parseBool($(this).attr('optional'));
                const iconDiv = tree.dragDiv.find('.icons');
                if (tree.optional) iconDiv.html(Utils.sIcon('icon-tree-is-optional'));
                $(tree.dragDiv).toggleClass('optional', tree.optional);

                tree.dragDiv.find('.subjectName').text(tree.subject); // Set subject in HTML
                tree.dragDiv.find('.subjectNameInput').val(tree.subject); // Set subject in HTML

                plumbInstance.batch(() =>
                {
                    $(this).children().each(function()
                    { // Parse the tree in the container
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
                        for (const target of targets)
                        {
                            plumbInstance.connect(
                            {
                                source: sourceId,
                                target: target
                            });
                        }
                    });
                }, true);
            });
        });

        expandConversations(conversations);
    }

    // Load the metadata of the scenario.
    function loadMetadata(metadata)
    {
        Metadata.container.name = Utils.unEscapeHTML($(metadata).find('name').text());
        $('#scenarioNameTab .scenarioName').text(Metadata.container.name);
        Main.updateDocumentTitle();
        Metadata.container.description = Utils.unEscapeHTML($(metadata).find('description').text());
        Metadata.container.difficulty = $(metadata).find('difficulty').text();

        const parameters = Parameters.container;
        $(metadata).find('parameters').children().each(function()
        {
            const paramId = this.attributes.id.value;

            const paramMatch = paramId.match(/^p(\d+)$/);
            if (paramMatch !== null)
            {
                const paramNumber = parseInt(paramMatch[1]);
                if (paramNumber > Parameters.counter) Parameters.counter = paramNumber;
            }

            const defaultValue = this.hasAttribute('initialValue') ? Utils.parseDecimalIntWithDefault(this.attributes.initialValue.value, 0) : 0;

            let minimum, maximum;
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
        let id = $(statement).attr('id').replace(/\./g, '_');

        const idMatch = id.match(/^edit_(\d+)$/);
        if (idMatch !== null)
        {
            Main.jsPlumbCounter = Math.max(Main.jsPlumbCounter, parseInt(idMatch[1]));
        }
        else
        {
            id = "ext_" + id;
        }

        let characterIdRef;
        if (type === Main.computerType)
        {
            characterIdRef = Config.container.characters.sequence[0].id;
        }

        const allowInterleaveNode = Utils.parseBool($(statement).attr('jumpPoint'));
        const allowDialogueEndNode = Utils.parseBool($(statement).attr('inits'));
        const endNode = Utils.parseBool($(statement).attr('possibleEnd'));

        const text = Utils.unEscapeHTML($(statement).find('text').text());

        const xPos = $(statement).find('x').text();
        const yPos = $(statement).find('y').text();

        // Load the preconditions of this node.
        const preconditionsXML = $(statement).find("preconditions");
        let preconditions;
        if (preconditionsXML.length === 0)
        {
            preconditions = null;
        }
        else
        {
            preconditions = loadPreconditions(preconditionsXML.children()[0]);
        }

        const parameterEffects = Config.getNewDefaultParameterEffects(characterIdRef);
        const acceptableScopes = ['per', 'per-' + type];
        if (type === Main.computerType) acceptableScopes.push('per-' + type + '-own');
        const propertyValues = Config.getNewDefaultPropertyValues(acceptableScopes, characterIdRef);
        let targets;
        if (type === Main.playerType)
        {
            $(statement).find('parameterEffects').children().each(function()
            {
                parameterEffects.userDefined.push(
                {
                    idRef: this.attributes.idref.value,
                    operator: this.attributes.changeType.value == "delta" ? Types.assignmentOperators.addAssign.name : Types.assignmentOperators.assign.name,
                    value: parseInt(this.attributes.value.value)
                });
            });

            const intents = $(statement).children('intents');
            if (intents.length > 0)
            {
                migrateProperty(intents[0], 'intent', 'intentProperty', propertyValues, true);
            }

            targets = $(statement).find('nextComputerStatements').children();
            if (targets.length === 0) targets = $(statement).find('nextComputerStatement');
        }
        else
        {
            targets = $(statement).find('responses').children();
        }

        const comment = Utils.unEscapeHTML($(statement).find('comment').text());

        if (targets.length > 0)
        {
            // Save all the connections. We will create the connections when all nodes have been added.
            connections[id] = [];
            for (const target of targets)
            {
                let targetID = target.attributes.idref.value.replace(/\./g, '_');
                if (!/^edit_\d+$/.test(targetID)) targetID = 'ext_' + targetID;
                connections[id].push(targetID);
            }
        }

        const node = Main.createAndReturnNode(type, id, Main.trees[treeID].div, Main.trees[treeID].dragDiv.attr('id'));
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
            id: id,
            parent: treeID
        };

        if (type === Main.computerType) Main.nodes[id].characterIdRef = characterIdRef;

        // Set the position of the node.
        Utils.cssPosition(node, {
            top: yPos,
            left: xPos
        });

        // Fill the insides with text
        const txtView = node.find('.statementText');
        txtView.html(Utils.escapeHTML(text));
    }

    // Load all preconditions from a given precondition element tree.
    function loadPreconditions(preconditionXMLElement)
    {
        const preconditionType = preconditionXMLElement.nodeName;
        const preconditionsArray = [];

        $(preconditionXMLElement).children().each(function()
        {
            if (this.nodeName == "condition")
            {
                if (this.attributes.idref.value in Parameters.container.byId)
                {
                    preconditionsArray.push(
                    {
                        idRef: this.attributes.idref.value,
                        operator: this.attributes.test.value,
                        value: parseInt(this.attributes.value.value)
                    });
                }
            }
            else
            {
                preconditionsArray.push(loadPreconditions(this));
            }
        });
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
            const valueXML = $(parentXML).children(propertyId);
            if (valueXML.length > 0)
            {
                if (attributeName) valueXML.text(valueXML.attr(attributeName));
                let propertyValue;
                let type;
                const migrationPropertyIdRef = Config.container.migration[migrationPropertyName].idRef;
                const firstCharacterId = Config.container.characters.sequence[0].id;
                if (migrationPropertyIdRef in propertyValues.characterIndependent)
                {
                    type = Config.container.properties.byId[migrationPropertyIdRef].type;
                    propertyValue = type.fromXML(valueXML[0]);
                    propertyValues.characterIndependent[migrationPropertyIdRef] = needsUnEscaping ? Utils.unEscapeHTML(propertyValue) : propertyValue;
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
        let id = $(conversationXMLElement).attr('id').replace(/\./g, '_');

        const idMatch = id.match(/^edit_(\d+)$/);
        if (idMatch !== null)
        {
            Main.jsPlumbCounter = Math.max(Main.jsPlumbCounter, parseInt(idMatch[1]));
        }
        else
        {
            id = "ext_" + id;
        }

        const endNode = Utils.parseBool($(conversationXMLElement).attr('possibleEnd'));
        const comment = Utils.unEscapeHTML($(conversationXMLElement).find('comment').text());

        const xPos = $(conversationXMLElement).find('x').text();
        const yPos = $(conversationXMLElement).find('y').text();

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
        const preconditionsXML = $(conversationXMLElement).find("preconditions");
        let preconditionsJS;
        if (preconditionsXML.length === 0)
        {
            preconditionsJS = null;
        }
        else
        {
            preconditionsJS = loadPreconditions(preconditionsXML.children()[0]);
        }

        const targets = $(conversationXMLElement).find('responses').children();
        conversations[id].connections = [];
        if (targets.length > 0)
        {
            // Save all the connections so we can expand the conversation later on and connect the expanded nodes
            for (const target of targets)
            {
                let targetID = target.attributes.idref.value.replace(/\./g, '_');
                if (!/^edit_\d+$/.test(targetID)) targetID = 'ext_' + targetID;
                conversations[id].connections.push(targetID);
            }
        }

        let firstConversationNode = conversations[id].textNodes.length > 0 ? conversations[id].textNodes[0] : null;
        if (!firstConversationNode)
        {
            firstConversationNode = { type: Main.playerType, text: "" };
        }

        let characterIdRef;
        const acceptableScopes = ['per', 'per-' + firstConversationNode.type];
        if (firstConversationNode.type === Main.computerType)
        {
            characterIdRef = Config.container.characters.sequence[0].id;
            acceptableScopes.push('per-' + firstConversationNode.type + '-own');
        }

        const node = Main.createAndReturnNode(firstConversationNode.type, id, Main.trees[treeID].div, Main.trees[treeID].dragDiv.attr('id'));
        Main.nodes[id] = {
            text: firstConversationNode.text,
            type: firstConversationNode.type,
            parameterEffects: Config.getNewDefaultParameterEffects(characterIdRef),
            preconditions: preconditionsJS,
            propertyValues: Config.getNewDefaultPropertyValues(acceptableScopes, characterIdRef),
            comment: comment,
            endNode: endNode,
            allowDialogueEndNode: false,
            allowInterleaveNode: false,
            id: id,
            parent: treeID
        };

        if (firstConversationNode.type === Main.computerType) Main.nodes[id].characterIdRef = characterIdRef;

        // Set the position of the node.
        Utils.cssPosition(node, {
            top: yPos,
            left: xPos
        });

        // Fill the insides with text
        const txtView = node.find('.statementText');
        txtView.html(Utils.escapeHTML(firstConversationNode.text));
    }

    function expandConversations(conversations)
    {
        for (const firstConversationNodeId in conversations)
        {
            const firstConversationNode = Main.nodes[firstConversationNodeId];
            let lastConversationNodeId = firstConversationNodeId;
            // Stores the connections single between conversation nodes
            const singleConnections = {};
            let previousConversationNodeId = firstConversationNodeId;

            // Loop over all textNodes except for the first, it has already been created
            for (let i = 1; i < conversations[firstConversationNodeId].textNodes.length; i++)
            {
                const textNode = conversations[firstConversationNodeId].textNodes[i];

                const node = Main.createAndReturnNode(textNode.type, null, Main.trees[firstConversationNode.parent].div, Main.trees[firstConversationNode.parent].dragDiv.attr('id'));
                const id = node.attr('id');

                let endNode = false;
                if (i === conversations[firstConversationNodeId].textNodes.length - 1)
                {
                    endNode = firstConversationNode.endNode;
                    firstConversationNode.endNode = false;
                    lastConversationNodeId = id;
                }

                singleConnections[previousConversationNodeId] = id;

                let characterIdRef;
                const acceptableScopes = ['per', 'per-' + textNode.type];
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
                    id: id,
                    parent: firstConversationNode.parent
                };

                if (textNode.type === Main.computerType) Main.nodes[id].characterIdRef = characterIdRef;

                // Set the position of the node and offset it by a small amount to show underlying nodes
                Utils.cssPosition(node, {
                    top: Utils.parseDecimalIntWithDefault(conversations[firstConversationNodeId].yPos, 0) + i * 8,
                    left: Utils.parseDecimalIntWithDefault(conversations[firstConversationNodeId].xPos, 0) + i * 8
                });

                // Fill the insides with text
                const txtView = node.find('.statementText');
                txtView.html(Utils.escapeHTML(textNode.text));

                previousConversationNodeId = id;
            }

            const plumbInstance = Main.getPlumbInstanceByNodeID(firstConversationNodeId);
            plumbInstance.batch(function()
            {
                // Connect each conversation node sequentially
                for (const source in singleConnections)
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
            }, true);
        }
    }
})();
