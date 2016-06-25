/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

var Save;

(function()
{
    "use strict";

    Save =
    {
        exportScenario: exportScenario,
        getStartNodeIDs: getStartNodeIDs
    };

    $(document).ready(function()
    {
        $("#exportScenario").on('click', exportScenario);
    });

    // Generates the XML
    function generateXML()
    {
        var sortedTrees = sortTrees(Main.trees);

        var nameSpace = "urn:uurage-temporary";
        var doc = document.implementation.createDocument(nameSpace, 'scenario', null);

        doc.documentElement.setAttribute("schemaVersion", 4);
        doc.documentElement.setAttribute("configidref", Config.configObject.id);

        // Handles the metadata
        var metadataEl = addAndReturnElement("metadata", nameSpace, doc.documentElement);
        addAndReturnElement("name", nameSpace, metadataEl).textContent = Utils.escapeHTML(Metadata.metaObject.name);
        addAndReturnElement("date", nameSpace, metadataEl).textContent =new Date().toISOString();
        addAndReturnElement("description", nameSpace, metadataEl).textContent = Utils.escapeHTML(Metadata.metaObject.description);
        addAndReturnElement("difficulty", nameSpace, metadataEl).textContent = Metadata.metaObject.difficulty;
        addAndReturnElement("defaultChangeType", nameSpace, metadataEl).textContent = Metadata.metaObject.defaultChangeType;

        var definitionsEl = addAndReturnElement("definitions", nameSpace, metadataEl);

        // Save characters
        var charactersEl = addAndReturnElement("characters", nameSpace, definitionsEl);
        Config.configObject.characters.sequence.forEach(function (character)
        {
            var characterEl = addAndReturnElement("character", nameSpace, charactersEl);
            characterEl.setAttribute("id", character.id);
        });

        var addDefinitionElement = function (definition, elementName, nameSpace, definitionsEl)
        {
            var definitionEl = addAndReturnElement(elementName, nameSpace, definitionsEl);

            definitionEl.setAttribute("id", definition.id);
            definitionEl.setAttribute("name", Utils.escapeHTML(definition.name));
            if (definition.description) definitionEl.setAttribute("description", Utils.escapeHTML(definition.description));

            var typeEl = definition.type.insertType(definitionEl);
            var defaultEl = addAndReturnElement('default', nameSpace, typeEl);
            definition.type.toXML(defaultEl, definition.type.defaultValue);
        };

        var parametersEl = addAndReturnElement("parameters", nameSpace, definitionsEl);

        // Save user-defined parameters
        var userDefinedParametersEl = addAndReturnElement("userDefined", nameSpace, parametersEl);
        var parameterId, parameter;
        for (parameterId in Metadata.metaObject.parameters.byId)
        {
            parameter = Metadata.metaObject.parameters.byId[parameterId];
            addDefinitionElement(parameter, "parameter", nameSpace, userDefinedParametersEl);
        }

        // Save fixed parameters
        var fixedParametersEl = addAndReturnElement("fixed", nameSpace, parametersEl);
        var characterId;
        for (parameterId in Config.configObject.parameters.byId)
        {
            parameter = Config.configObject.parameters.byId[parameterId];
            addDefinitionElement(parameter, "parameter", nameSpace, fixedParametersEl);
        }
        for (parameterId in Config.configObject.characters.parameters.byId)
        {
            parameter = Config.configObject.characters.parameters.byId[parameterId];
            addDefinitionElement(parameter, "parameter", nameSpace, fixedParametersEl);
        }
        for (characterId in Config.configObject.characters.byId)
        {
            for (parameterId in Config.configObject.characters.byId[characterId].parameters.byId)
            {
                parameter = Config.configObject.characters.byId[characterId].parameters.byId[parameterId];
                addDefinitionElement(parameter, "parameter", nameSpace, fixedParametersEl);
            }
        }

        // Save properties
        var propertyDefinitionsEl = addAndReturnElement("properties", nameSpace, definitionsEl);
        var propertyId, property;
        for (propertyId in Config.configObject.properties.byId)
        {
            property = Config.configObject.properties.byId[propertyId];
            addDefinitionElement(property, "property", nameSpace, propertyDefinitionsEl);
        }
        for (propertyId in Config.configObject.characters.properties.byId)
        {
            property = Config.configObject.characters.properties.byId[propertyId];
            addDefinitionElement(property, "property", nameSpace, propertyDefinitionsEl);
        }
        for (characterId in Config.configObject.characters.byId)
        {
            for (propertyId in Config.configObject.characters.byId[characterId].properties.byId)
            {
                property = Config.configObject.characters.byId[characterId].properties.byId[propertyId];
                addDefinitionElement(property, "property", nameSpace, propertyDefinitionsEl);
            }
        }

        // Save property values
        generatePropertyValuesXML(metadataEl, Metadata.metaObject.propertyValues, nameSpace);

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

    // Offers the XML of the current scenario for download
    // Adapted from work by Eric Bidelman (ericbidelman@chromium.org)
    function exportScenario()
    {
        // Warn user before exporting an invalid scenario
        var errors = Validator.validate();
        var hasErrors = false;
        $.each(errors, function(index, value)
        {
            hasErrors = hasErrors || value.level === 'error';
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
        a.draggable = true; // Don't really need, but good practice
        a.classList.add('dragout');

        $('#impExp').append(a);

        document.body.appendChild(a);

        a.click();

        document.body.removeChild(a);
    }

    function generateTreeXML(parentElement, tree, nameSpace)
    {
        var treeElement = addAndReturnElement("dialogue", nameSpace, parentElement);
        treeElement.setAttribute("id", tree.id.replace(/^ext_/, ''));
        treeElement.setAttribute("optional", tree.optional);

        addAndReturnElement('subject', nameSpace, treeElement).textContent = Utils.escapeHTML(tree.subject);

        var positionElement = addAndReturnElement('position', nameSpace, treeElement);

        addAndReturnElement('x', nameSpace,positionElement).textContent = tree.leftPos;
        addAndReturnElement('y', nameSpace,positionElement).textContent = tree.topPos;

        var startsElement = addAndReturnElement('starts', nameSpace, treeElement);
        var startNodeIDs = getStartNodeIDs(tree);
        $.each(startNodeIDs, function(index, startNodeID)
        {
            if (startNodeID !== -1)
                addAndReturnElement("start", nameSpace, startsElement).setAttribute("idref", startNodeID.replace(/^ext_/, '').replace(/_/g, '.'));
        });

        var statementsElement = addAndReturnElement('statements', nameSpace, treeElement);
        generateNodesXML(statementsElement, tree, nameSpace);
    }

    function generateNodesXML(statementsElement, tree, nameSpace)
    {
        tree.nodes.forEach(function(nodeID)
        {
            // Get the node
            var node = Main.nodes[nodeID];

            // Generate the XML element for the node with the id
            var statementEl = addAndReturnElement(node.type + "Statement", nameSpace, statementsElement);
            statementEl.setAttribute('id', node.id.replace(/^ext_/, '').replace(/_/g, '.'));

            if (node.type === Main.computerType)
            {
                statementEl.setAttribute('characteridref', node.characterIdRef);
                statementEl.setAttribute('jumpPoint', node.jumpPoint);
                statementEl.setAttribute('inits', node.initsNode);
            }
            statementEl.setAttribute('end', node.endNode);

            // Add a text element to the XML element
            addAndReturnElement("text", nameSpace, statementEl).textContent = Utils.escapeHTML(node.text);

            // Save the position
            var visible = $("#" + node.id).is(":visible");
            if (!visible) // cannot get pos for hidden elements
                $("#" + node.id).show();

            var position = $("#" + node.id).position();
            var positionEl = addAndReturnElement("position", nameSpace, statementEl);
            addAndReturnElement("x", nameSpace, positionEl).textContent = position.left;
            addAndReturnElement("y", nameSpace, positionEl).textContent = position.top;

            if (!visible)
                $("#" + node.id).hide();

            // Save the comment
            if (node.comment !== "")
                addAndReturnElement("comment", nameSpace, statementEl).textContent = Utils.escapeHTML(node.comment);

            // Save the preconditions
            var preconditionsInXML = createAndReturnPreconditionXML(node.preconditions, nameSpace);
            if (preconditionsInXML !== null)
            {
                var preconditionsEl = addAndReturnElement("preconditions", nameSpace, statementEl);
                preconditionsEl.appendChild(preconditionsInXML);
            }

            // Save the parameter effects
            generateParameterEffectsXML(statementEl, node.parameterEffects, nameSpace);

            // Save the property values
            generatePropertyValuesXML(statementEl, node.propertyValues, nameSpace);

            var connectionElName = 'response';

            // Get the outgoing connections of the node
            var connections = tree.plumbInstance.getConnections(
            {
                source: node.id
            });

            // Save the connections
            var connectionsEl = addAndReturnElement(connectionElName + "s", nameSpace,statementEl);
            for (var l = 0; l < connections.length; l++)
            {
                var connectionEl = addAndReturnElement(connectionElName, nameSpace,connectionsEl);
                connectionEl.setAttribute('idref', connections[l].targetId.replace(/^ext_/, '').replace(/_/g, '.'));
            }
        });
    }

    function generateParameterEffectsXML(element, parameterEffects, nameSpace)
    {
        var parameterEffectsEl = addAndReturnElement("parameterEffects", nameSpace, element);

        var userDefinedParameterEffectsEl = addAndReturnElement("userDefined", nameSpace, parameterEffectsEl);
        for (var k = 0; k < parameterEffects.userDefined.length; k++)
        {
            var pEff = parameterEffects.userDefined[k];
            var pEffElement = addAndReturnElement("parameterEffect", nameSpace, userDefinedParameterEffectsEl);
            pEffElement.setAttribute("idref", pEff.idRef);
            pEffElement.setAttribute("changeType", pEff.changeType);
            Metadata.metaObject.parameters.byId[pEff.idRef].type.toXML(pEffElement, pEff.value);
        }

        var fixedParameterEffectsEl = addAndReturnElement("fixed", nameSpace, parameterEffectsEl);
        var parameterId;
        for (parameterId in parameterEffects.fixed.characterIndependent)
        {
            parameterEffects.fixed.characterIndependent[parameterId].forEach(function(parameterEffect)
            {
                var pEffElement = addAndReturnElement("parameterEffect", nameSpace, fixedParameterEffectsEl);
                pEffElement.setAttribute("idref", parameterEffect.idRef);
                pEffElement.setAttribute("changeType", parameterEffect.changeType);
                Config.configObject.parameters.byId[parameterId].type.toXML(pEffElement, parameterEffect.value);
            });
        }
        for (var characterId in Config.configObject.characters.byId)
        {
            for (parameterId in parameterEffects.fixed.perCharacter[characterId])
            {
                parameterEffects.fixed.perCharacter[characterId][parameterId].forEach(function(parameterEffect)
                {
                    var pEffElement = addAndReturnElement("characterParameterEffect", nameSpace, fixedParameterEffectsEl);
                    pEffElement.setAttribute("idref", parameterEffect.idRef);
                    pEffElement.setAttribute("characteridref", characterId);
                    pEffElement.setAttribute("changeType", parameterEffect.changeType);

                    if (parameterId in Config.configObject.characters.parameters.byId)
                    {
                        Config.configObject.characters.parameters.byId[parameterId].type.toXML(pEffElement, parameterEffect.value);
                    }
                    else
                    {
                        Config.configObject.characters.byId[characterId].parameters.byId[parameterId].type.toXML(pEffElement, parameterEffect.value);
                    }
                });
            }
        }
    }

    function generatePropertyValuesXML(element, propertyValues, nameSpace)
    {
        var propertyValuesEl = addAndReturnElement("propertyValues", nameSpace, element);
        var propertyId;
        for (propertyId in propertyValues.characterIndependent)
        {
            var propertyValueEl = addAndReturnElement("propertyValue", nameSpace, propertyValuesEl);
            propertyValueEl.setAttribute("idref", propertyId);
            Config.configObject.properties.byId[propertyId].type.toXML(propertyValueEl, propertyValues.characterIndependent[propertyId]);
        }

        for (var characterId in Config.configObject.characters.byId)
        {
            for (propertyId in propertyValues.perCharacter[characterId])
            {
                var characterPropertyValueEl = addAndReturnElement("characterPropertyValue", nameSpace, propertyValuesEl);
                characterPropertyValueEl.setAttribute("characteridref", characterId);
                characterPropertyValueEl.setAttribute("idref", propertyId);

                var propertyValue = propertyValues.perCharacter[characterId][propertyId];
                if (propertyId in Config.configObject.characters.properties.byId)
                {
                    Config.configObject.characters.properties.byId[propertyId].type.toXML(characterPropertyValueEl, propertyValue);
                }
                else
                {
                    Config.configObject.characters.byId[characterId].properties.byId[propertyId].type.toXML(characterPropertyValueEl, propertyValue);
                }
            }
        }
    }

    // Creates an XML element, adds it to another element, and returns the created element
    function addAndReturnElement(elNameToAdd, nameSpace, xmlElement)
    {
        var elToAdd = document.createElementNS(nameSpace, elNameToAdd);
        xmlElement.appendChild(elToAdd);
        return elToAdd;
    }

    // Creates an XML element for the precondition
    function createAndReturnPreconditionXML(precondition, nameSpace)
    {
        var conditionEl;
        if (!("type" in precondition))
        {
            var parameter;
            if (precondition.characterIdRef)
            {
                if (precondition.idRef in Config.configObject.characters.parameters.byId)
                {
                    parameter = Config.configObject.characters.parameters.byId[precondition.idRef];
                }
                else
                {
                    if (precondition.idRef in Config.configObject.characters.byId[precondition.characterIdRef].parameters.byId)
                    {
                        parameter = Config.configObject.characters.byId[precondition.characterIdRef].parameters.byId[precondition.idRef];
                    }
                }
            }
            else
            {
                if (precondition.idRef in Metadata.metaObject.parameters.byId)
                {
                    parameter = Metadata.metaObject.parameters.byId[precondition.idRef];
                }
                else if (precondition.idRef in Config.configObject.parameters.byId)
                {
                    parameter = Config.configObject.parameters.byId[precondition.idRef];
                }
            }

            if (precondition.characterIdRef)
            {
                conditionEl = document.createElementNS(nameSpace, "characterCondition");
                conditionEl.setAttribute("characteridref", precondition.characterIdRef);
            }
            else
            {
                conditionEl = document.createElementNS(nameSpace, "condition");
            }

            conditionEl.setAttribute("idref", precondition.idRef);
            conditionEl.setAttribute("operator", precondition.operator);
            parameter.type.toXML(conditionEl, precondition.value);
            return conditionEl;
        }

        if (precondition.type == "alwaysTrue")
        {
            // Return null to signal that no preconditions should be added
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

            // If there aren't any child preconditions, this element is illegal
            if (typeEl.childNodes.length === 0)
                return null;
            else
                return typeEl;
        }
    }

    // Get all nodes without parents
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
