/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

var Save;

(function()
{
    Save =
    {
        generateXML: generateXML,
        getStartNodeIDs: getStartNodeIDs
    };

    $(document).ready(function()
    {
        $("#exportScript").on('click', exportScript);
    });

    /*
     ** Public Functions
     */

    // Generates the XML.
    function generateXML()
    {
        var sortedTrees = sortTrees(Main.trees);

        var nameSpace = "urn:uurage-temporary";
        var doc = document.implementation.createDocument(nameSpace,'script', null);

        doc.documentElement.setAttribute("schemaVersion", 4);

        // Handles the metadata.
        var metadataEl = addAndReturnElement("metadata", nameSpace, doc.documentElement);
        addAndReturnElement("name", nameSpace, metadataEl).textContent = Main.escapeTags(Metadata.metaObject.name);
        addAndReturnElement("date", nameSpace, metadataEl).textContent =new Date().toISOString();
        addAndReturnElement("description", nameSpace, metadataEl).textContent = Main.escapeTags(Metadata.metaObject.description);
        addAndReturnElement("difficulty", nameSpace, metadataEl).textContent = Metadata.metaObject.difficulty;
        addAndReturnElement("defaultChangeType", nameSpace, metadataEl).textContent = Metadata.metaObject.defaultChangeType;
        addAndReturnElement("character", nameSpace, metadataEl).setAttribute('id', Main.escapeTags(Metadata.metaObject.character));

        var definitionsEl = addAndReturnElement("definitions", nameSpace, metadataEl);

        // Save property definitions.
        var propertyDefinitionsEl = addAndReturnElement("properties", nameSpace, definitionsEl);
        var addPropertyDefinitionElement = function (property, nameSpace, propertyDefinitionsEl)
        {
            var propertyEl = addAndReturnElement("property", nameSpace, propertyDefinitionsEl);
            propertyEl.setAttribute("id", property.id);
            property.type.insertUnderlyingType(propertyEl);
        };
        for (var propertyId in Config.configObject.properties.byId)
        {
            var property = Config.configObject.properties.byId[propertyId];
            addPropertyDefinitionElement(property, nameSpace, propertyDefinitionsEl);
        }
        for (var propertyId in Config.configObject.characters.properties.byId)
        {
            var property = Config.configObject.characters.properties.byId[propertyId];
            addPropertyDefinitionElement(property, nameSpace, propertyDefinitionsEl);
        }
        $.each(Config.configObject.characters.ids, function(_, characterId)
        {
            for (var propertyId in Config.configObject.characters[characterId].properties.byId)
            {
                var property = Config.configObject.characters[characterId].properties.byId[propertyId];
                addPropertyDefinitionElement(property, nameSpace, propertyDefinitionsEl);
            }
        });

        // Save parameters and collect data for saving weights.
        var parametersEl = addAndReturnElement("parameters", nameSpace, definitionsEl);
        var scoringFunctionEl = document.createElementNS(nameSpace, "scoringFunction");
        var scoringSumEl = document.createElementNS(nameSpace, "sum");

        for (var parameterID in Metadata.metaObject.parameterObject)
        {
            var parameterObj = Metadata.metaObject.parameterObject[parameterID];
            var parameterEl = addAndReturnElement("parameter", nameSpace, parametersEl);

            parameterEl.setAttribute("id", parameterID);
            parameterEl.setAttribute("name", Main.escapeTags(parameterObj.name));
            parameterEl.setAttribute("initialValue", parameterObj.initialValue);
            parameterEl.setAttribute("minimumScore", parameterObj.minimumScore);
            parameterEl.setAttribute("maximumScore", parameterObj.maximumScore);
            parameterEl.setAttribute("description", Main.escapeTags(parameterObj.description));

            if (parameterObj.weightForFinalScore !== 0)
                parameterEl.setAttribute("scored", "true");

            var scaleEl = addAndReturnElement("scale", nameSpace, scoringSumEl);
            scaleEl.setAttribute("scalar", parameterObj.weightForFinalScore);
            var paramRefEl = addAndReturnElement("paramRef", nameSpace, scaleEl);
            paramRefEl.setAttribute("idref", parameterID);
        }

        // Save statement-independent properties.
        var propertiesEl = addAndReturnElement("properties", nameSpace, metadataEl);
        for (var propertyId in Metadata.metaObject.properties)
        {
            var propertyValue = Metadata.metaObject.properties[propertyId];
            var propertyEl = addAndReturnElement("property", nameSpace, propertiesEl);
            propertyEl.setAttribute("idref", propertyId);
            Config.configObject.properties.byId[propertyId].type.toXML(propertyEl, propertyValue);
        }

        // Save parameter weights.
        if (scoringSumEl.childNodes.length === 0)
        {
            var constantEl = addAndReturnElement("constant", nameSpace, scoringFunctionEl);
            constantEl.setAttribute("value", 0);
        }
        else
        {
            scoringFunctionEl.appendChild(scoringSumEl);
        }
        metadataEl.appendChild(scoringFunctionEl);

        // This part saves the feedback form.
        var feedbackFormEl = addAndReturnElement("feedbackForm", nameSpace, doc.documentElement);
        for (var parameter in FeedbackForm.conditions)
        {
            var currentParamEl = addAndReturnElement("parameter", nameSpace, feedbackFormEl);
            currentParamEl.setAttribute("idref", parameter);

            for (var loopCounter = 0; loopCounter < FeedbackForm.conditions[parameter].length; loopCounter++)
            {
                // Special case, the default condition.
                if (loopCounter == FeedbackForm.conditions[parameter].length -1)
                {
                    var defaultCondition = FeedbackForm.conditions[parameter][loopCounter];
                    var currentDefaultConditionEl = addAndReturnElement("default", nameSpace, currentParamEl);
                    currentDefaultConditionEl.textContent = defaultCondition.feedbackString;
                }
                else
                {
                    var condition = FeedbackForm.conditions[parameter][loopCounter];
                    var currentConditionEl = addAndReturnElement("condition", nameSpace, currentParamEl);
                    currentConditionEl.setAttribute("test", condition.test);
                    // Some checks to make sure the values of the condition are only added if they exist.
                    if (condition.values.length !== 0)
                    {
                        if (condition.values[1] !== undefined)
                        {
                            var value1, value2;
                            value1 = condition.values[0];
                            value2 = condition.values[1];

                            if (parseInt(value1) >= parseInt(value2))
                            {
                                value2 = parseInt(value1) + 1;
                            }
                            currentConditionEl.setAttribute("lowerBound", value1);
                            currentConditionEl.setAttribute("upperBound", value2);
                        }
                        else if (condition.values[0] !== undefined)
                        {
                            currentConditionEl.setAttribute("value", condition.values[0]);
                        }
                    }
                    else
                    {
                        // Min/Max situation. Check which one it is and pass the correct value.
                        var testValue = 0;
                        if (condition.test === "min")
                        {
                            testValue = Metadata.metaObject.parameterObject[parameter].minimumScore;
                        }
                        else if (condition.test === "max")
                        {
                            testValue = Metadata.metaObject.parameterObject[parameter].maximumScore;
                        }
                        currentConditionEl.setAttribute("value", testValue);
                    }
                    currentConditionEl.textContent = Main.escapeTags(condition.feedbackString);
                }
            }
        }

        var seqElement = addAndReturnElement("sequence", nameSpace, doc.documentElement);

        var i = 0;

        var makeTreeXML = function(id, tree)
        {
            generateTreeXML(interleave, tree, nameSpace);
        };

        while (i < sortedTrees.length) // this loop gets all the levels
        {
            //one interleave tag for each level
            var interleave = addAndReturnElement("interleave", nameSpace, seqElement);
            var treeArray = [];
            treeArray.push(sortedTrees[i]);
            i++;
            // lets see if more trees are at this level
            for (i; i < sortedTrees.length; i++)
            {
                var tree = sortedTrees[i];

                if (tree.level == treeArray[0].level)
                    treeArray.push(tree);
                else
                    break;
            }

            //for each tree at this level, make the xml
            $.each(treeArray, makeTreeXML);
        }
        var s = new XMLSerializer();
        return s.serializeToString(doc);
    }

    // Gets all the starting nodes of a tree. Returns -1 if none is found
    function getStartNodeIDs(tree)
    {
        var orphanNodes = getNodesWithoutParents(tree);
        var error = [];

        if (orphanNodes.length === 0)
        {
            error.push(-1);
            return error;
        }

        return orphanNodes;
    }

    /*
     ** Private Functions
     */

    // Offers the XML of the current script for download
    // Adapted from work by Eric Bidelman (ericbidelman@chromium.org)
    function exportScript()
    {
        // Warn user before exporting an invalid script
        var errors = Validator.validate();
        var hasErrors = false;
        $.each(errors, function(index, value)
        {
            hasErrors = hasErrors || (value.level === 'error');
        });

        if (hasErrors)
        {
            if (!window.confirm(
                    LanguageManager.sLang("edt_save_export_error")
                ))
            {
                return false;
            }
        }

        Main.applyChanges();

        window.URL = window.webkitURL || window.URL;

        var MIME_TYPE = 'text/xml';
        var prevLink = $('#impExp a');

        if (prevLink)
        {
            window.URL.revokeObjectURL(prevLink.href);
            prevLink.remove();
        }

        var xml = generateXML();
        var bb = new Blob([xml],
        {
            type: MIME_TYPE
        });

        var a = document.createElement('a');
        a.download = Metadata.metaObject.name + ".xml";
        a.href = window.URL.createObjectURL(bb);
        a.textContent = LanguageManager.sLang("edt_save_download_available");

        a.dataset.downloadurl = [MIME_TYPE, a.download, a.href].join(
            ':');
        a.draggable = true; // Don't really need, but good practice.
        a.classList.add('dragout');

        $('#impExp').append(a);

        document.body.appendChild(a);

        a.click();

        document.body.removeChild(a);
    }

    function generateTreeXML(parentElement, tree, nameSpace)
    {
        var treeElement = addAndReturnElement("tree", nameSpace, parentElement);
        treeElement.setAttribute("id", tree.id);
        treeElement.setAttribute("optional", tree.optional);

        addAndReturnElement('subject', nameSpace, treeElement).textContent = Main.escapeTags(tree.subject);

        var positionElement = addAndReturnElement('position', nameSpace, treeElement);

        addAndReturnElement('x', nameSpace,positionElement).textContent = tree.leftPos;
        addAndReturnElement('y', nameSpace,positionElement).textContent = tree.topPos;

        var startNodeIDs = getStartNodeIDs(tree);

        $.each(startNodeIDs, function(index, startNodeID)
        {
            if (startNodeID !== -1)
                addAndReturnElement("start", nameSpace, treeElement).setAttribute("idref", startNodeID.replace(/^ext_/, '').replace(/_/g, '.'));
        });

        generateNodesXML(treeElement, tree, nameSpace);
    }

    function generateNodesXML(treeElement, tree, nameSpace)
    {
        tree.nodes.forEach(function(nodeID)
        {
            // Get the node.
            var node = Main.nodes[nodeID];

            // Generate the XML element for the node with the id.
            var statementEl = addAndReturnElement(
                node.type + (node.type == Main.conversationType ? "" : "Statement"), nameSpace, treeElement);
            statementEl.setAttribute('id', node.id.replace(/^ext_/, '').replace(/_/g, '.'));

            if (node.type === Main.computerType)
            {
                statementEl.setAttribute('jumpPoint', node.jumpPoint);
                statementEl.setAttribute('inits', node.initsNode);
            }
            statementEl.setAttribute('possibleEnd', node.endNode);

            // Add a text element to the XML element.
            if (node.type == Main.conversationType)
                for (var i = 0; i < node.conversation.length; i++)
                {
                    var conversationObj = node.conversation[i];
                    addAndReturnElement(conversationObj.type, nameSpace, statementEl).textContent =
                        Main.escapeTags(conversationObj.text);
                }
            else
                addAndReturnElement("text", nameSpace, statementEl).textContent = Main.escapeTags(node.text);

            // Save the position.
            var visible = $("#" + node.id).is(":visible");
            if (!visible) // cannot get pos for hidden elements
                $("#" + node.id).show();

            var position = $("#" + node.id).position();
            var positionEl = addAndReturnElement("position", nameSpace, statementEl);
            addAndReturnElement("x", nameSpace, positionEl).textContent = position.left;
            addAndReturnElement("y", nameSpace, positionEl).textContent = position.top;

            if (!visible)
                $("#" + node.id).hide();

            // Save the comment.
            if (node.comment !== "")
                addAndReturnElement("comment", nameSpace, statementEl).textContent = Main.escapeTags(node.comment);

            // Save the media.
            if (node.image !== null || node.video !== null ||
                node.audio !== null)
            {
                var mediaEl = addAndReturnElement("media", nameSpace, statementEl);

                // Save the visuals
                var visualsEl = addAndReturnElement("visuals", nameSpace, mediaEl);
                // Save the video.
                if (node.video !== null)
                    addAndReturnElement("video", nameSpace, visualsEl).setAttribute("extid", node.video);
                // Save the imagery
                if (node.image !== null)
                    addAndReturnElement("image", nameSpace, visualsEl).setAttribute("extid", node.image);

                // Save the audio.
                var audiosEl = addAndReturnElement("audios", nameSpace, mediaEl);
                if (node.audio !== null)
                    addAndReturnElement("audio", nameSpace, audiosEl).setAttribute("extid", node.audio);
            }

            // Save the preconditions.
            var preconditionsInXML = createAndReturnPreconditionXML(node.preconditions, nameSpace);
            if (preconditionsInXML !== null)
            {
                var preconditionsEl = addAndReturnElement("preconditions", nameSpace, statementEl);
                preconditionsEl.appendChild(preconditionsInXML);
            }

            // Save per-statement properties.
            var propertiesEl = addAndReturnElement("properties", nameSpace, statementEl);
            for (var propertyId in node.properties)
            {
                var propertyValue = node.properties[propertyId];
                var propertyEl = addAndReturnElement("property", nameSpace, propertiesEl);
                propertyEl.setAttribute("idref", propertyId);
                Config.configObject.properties.byId[propertyId].type.toXML(propertyEl, propertyValue);
            }

            var connectionElName = '';
            switch (node.type)
            {
                case Main.conversationType:
                case Main.computerType:
                    connectionElName = "response";
                    break;
                case Main.playerType:
                    connectionElName = "nextComputerStatement";
                    // Save the intents.
                    var intentsEl = document.createElementNS(nameSpace, "intents");
                    for (var j = 0; j < node.intent.length; j++)
                    {
                        var intentObj = node.intent[j];
                        addAndReturnElement("intent", nameSpace, intentsEl).textContent = Main.escapeTags(intentObj.name);
                    }
                    if (intentsEl.childNodes.length !== 0)
                        statementEl.appendChild(intentsEl);
                    // Save the parameter effects.
                    var parameterEffectsEl = addAndReturnElement("parameterEffects", nameSpace, statementEl);

                    for (var k = 0; k < node.parameters.length; k++)
                    {
                        var pEff = node.parameters[k];
                        var pEffElement = addAndReturnElement("parameterEffect", nameSpace, parameterEffectsEl);
                        pEffElement.setAttribute("idref", pEff.parameterid);
                        pEffElement.setAttribute("changeType", pEff.changeType);
                        pEffElement.setAttribute("value", pEff.value);
                    }

                    break;
            }

            // Get the outgoing connections of the node.
            var connections = tree.plumbInstance.getConnections(
            {
                source: node.id
            });

            // Save the connections.
            var connectionsEl = addAndReturnElement(connectionElName + "s", nameSpace,statementEl);
            for (var l = 0; l < connections.length; l++)
            {
                var connectionEl = addAndReturnElement(connectionElName, nameSpace,connectionsEl);
                connectionEl.setAttribute('idref', connections[l].targetId.replace(/^ext_/, '').replace(/_/g, '.'));
            }
        });
    }

    // Creates an XML element, adds it to another element, and returns the created element.
    function addAndReturnElement(elNameToAdd, nameSpace, xmlElement)
    {
        var elToAdd = document.createElementNS(nameSpace, elNameToAdd);
        xmlElement.appendChild(elToAdd);
        return elToAdd;
    }

    // Creates an XML element for the precondition.
    function createAndReturnPreconditionXML(precondition, nameSpace)
    {
        var conditionEl;
        if (!("type" in precondition))
        {
            conditionEl = document.createElementNS(nameSpace, "condition");
            conditionEl.setAttribute("idref", precondition.parameterid);
            conditionEl.setAttribute("test", precondition.test);
            conditionEl.setAttribute("value", precondition.value);
            return conditionEl;
        }

        if (precondition.type == "alwaysTrue")
        {
            // Return null to signal that no preconditions should be added.
            return null;
        }
        else
        {
            var typeEl = document.createElementNS(nameSpace,precondition.type);
            for (var i = 0; i < precondition.preconditions.length; i++)
            {
                var conditionObj = precondition.preconditions[i];
                conditionEl = createAndReturnPreconditionXML(conditionObj, nameSpace);
                if (conditionEl !== null)
                    typeEl.appendChild(conditionEl);
            }

            // If there aren't any child preconditions, this element is illegal.
            if (typeEl.childNodes.length === 0)
                return null;
            else
                return typeEl;
        }
    }

    // Get all nodes without parents.
    function getNodesWithoutParents(tree) //nodes is an array
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

    //trees is now an object with individual trees as properties
    //objects cant be sorted, so we return an array of trees, sorted by level
    function sortTrees(trees)
    {
        var result = [];

        for (var prop in trees)
        {
            result.push(trees[prop]);
        }

        result.sort(function(a, b)
        {
            return a.level - b.level;
        });

        return result;
    }
})();
