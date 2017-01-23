/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

var Save;

(function()
{
    "use strict";

    Save =
    {
        exportScenario: exportScenario
    };

    var scenarioNameSpace = "http://uudsl.github.io/scenario/namespace";
    var schemaVersion = "4.2.0";

    $(document).ready(function()
    {
        $("#exportScenario").on('click', exportScenario);
    });

    // Generates the XML
    function generateXML()
    {
        var sortedTrees = sortTrees(Main.trees);

        var doc = document.implementation.createDocument(scenarioNameSpace, 'scenario', null);
        if (Main.unsavedChanges) Metadata.metaObject.version++;
        doc.documentElement.setAttribute("version", Metadata.metaObject.version);
        doc.documentElement.setAttribute("schemaVersion", schemaVersion);
        doc.documentElement.setAttribute("configidref", Config.configObject.id);

        // Save definitions
        generateDefinitionsXML(doc.documentElement);

        // Save metadata
        var metadataEl = addAndReturnElement("metadata", scenarioNameSpace, doc.documentElement);
        addAndReturnElement("name", scenarioNameSpace, metadataEl).textContent = Metadata.metaObject.name;
        addAndReturnElement("date", scenarioNameSpace, metadataEl).textContent = new Date().toISOString();
        if (Metadata.metaObject.language)
        {
            var languageEl = addAndReturnElement("language", scenarioNameSpace, metadataEl);
            languageEl.setAttribute("code", Metadata.metaObject.language.code);
            languageEl.textContent = Metadata.metaObject.language.name;
        }
        addAndReturnElement("description", scenarioNameSpace, metadataEl, true).textContent = Metadata.metaObject.description;

        if (Metadata.metaObject.authors.length > 0)
        {
            var authorsEl = addAndReturnElement("authors", scenarioNameSpace, metadataEl);
            Metadata.metaObject.authors.forEach(function(author)
            {
                var authorEl = addAndReturnElement("author", scenarioNameSpace, authorsEl);
                authorEl.setAttribute("name", author.name);
                if (author.email) authorEl.setAttribute("email", author.email);
                authorEl.setAttribute("startDate", author.startDate);
                if(author.endDate) authorEl.setAttribute("endDate", author.endDate);
            });
        }

        addAndReturnElement("difficulty", scenarioNameSpace, metadataEl).textContent = Metadata.metaObject.difficulty;

        // Save parameter initial values
        generateInitialParameterValuesXML(metadataEl);

        // Save property values
        generatePropertyValuesXML(metadataEl, Metadata.metaObject.propertyValues);

        var seqElement = addAndReturnElement("sequence", scenarioNameSpace, doc.documentElement);

        var i = 0;

        var makeTreeXML = function(id, tree, interleave)
        {
            generateTreeXML(interleave, tree);
        };

        while (i < sortedTrees.length) // this loop gets all the levels
        {
            //one interleave tag for each level
            var interleave = addAndReturnElement("interleave", scenarioNameSpace, seqElement);
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
            $.each(treeArray, function(i, tree) { makeTreeXML(i, tree, interleave); });
        }
        var s = new XMLSerializer();
        return s.serializeToString(doc);
    }

    function generateDefinitionsXML(parentElement)
    {
        var definitionsEl = addAndReturnElement("definitions", scenarioNameSpace, parentElement);

        // Save characters
        var charactersEl = addAndReturnElement("characters", scenarioNameSpace, definitionsEl);
        Config.configObject.characters.sequence.forEach(function(character)
        {
            var characterEl = addAndReturnElement("character", scenarioNameSpace, charactersEl);
            characterEl.setAttribute("id", character.id);
            if (character.name) characterEl.setAttribute("name", character.name);
        });

        var addDefinitionElement = function(definition, elementName, definitionsEl)
        {
            var definitionEl = addAndReturnElement(elementName, scenarioNameSpace, definitionsEl);

            definitionEl.setAttribute("id", definition.id);
            definitionEl.setAttribute("name", definition.name);
            if (definition.description)
            {
                addAndReturnElement("description", scenarioNameSpace, definitionEl, true).textContent = definition.description;
            }

            var typeContainerEl = addAndReturnElement("type", scenarioNameSpace, definitionEl);
            var typeEl = definition.type.insertType(typeContainerEl);
            var defaultEl = addAndReturnElement('default', scenarioNameSpace, typeEl);
            definition.type.toXML(defaultEl, definition.type.defaultValue);
        };

        var parametersEl = addAndReturnElement("parameters", scenarioNameSpace, definitionsEl);

        // Save user-defined parameters
        var userDefinedParametersEl = addAndReturnElement("userDefined", scenarioNameSpace, parametersEl);
        var parameterId, parameter;
        for (parameterId in Metadata.metaObject.parameters.byId)
        {
            parameter = Metadata.metaObject.parameters.byId[parameterId];
            addDefinitionElement(parameter, "parameter", userDefinedParametersEl);
        }

        // Save fixed parameters
        var fixedParametersEl = addAndReturnElement("fixed", scenarioNameSpace, parametersEl);
        var characterId;
        for (parameterId in Config.configObject.parameters.byId)
        {
            parameter = Config.configObject.parameters.byId[parameterId];
            addDefinitionElement(parameter, "parameter", fixedParametersEl);
        }
        for (parameterId in Config.configObject.characters.parameters.byId)
        {
            parameter = Config.configObject.characters.parameters.byId[parameterId];
            addDefinitionElement(parameter, "parameter", fixedParametersEl);
        }
        for (characterId in Config.configObject.characters.byId)
        {
            for (parameterId in Config.configObject.characters.byId[characterId].parameters.byId)
            {
                parameter = Config.configObject.characters.byId[characterId].parameters.byId[parameterId];
                addDefinitionElement(parameter, "parameter", fixedParametersEl);
            }
        }

        // Save properties
        var propertyDefinitionsEl = addAndReturnElement("properties", scenarioNameSpace, definitionsEl);
        var propertyId, property;
        for (propertyId in Config.configObject.properties.byId)
        {
            property = Config.configObject.properties.byId[propertyId];
            addDefinitionElement(property, "property", propertyDefinitionsEl);
        }
        for (propertyId in Config.configObject.characters.properties.byId)
        {
            property = Config.configObject.characters.properties.byId[propertyId];
            addDefinitionElement(property, "property", propertyDefinitionsEl);
        }
        for (characterId in Config.configObject.characters.byId)
        {
            for (propertyId in Config.configObject.characters.byId[characterId].properties.byId)
            {
                property = Config.configObject.characters.byId[characterId].properties.byId[propertyId];
                addDefinitionElement(property, "property", propertyDefinitionsEl);
            }
        }
    }

    function generateInitialParameterValuesXML(parentElement)
    {
        var initialParameterValuesEl = addAndReturnElement("initialParameterValues", scenarioNameSpace, parentElement);

        // Save user-defined parameter initial values
        var userDefinedEl = addAndReturnElement("userDefined", scenarioNameSpace, initialParameterValuesEl);
        var parameterId, parameter, parameterValueEl;
        for (parameterId in Metadata.metaObject.parameters.byId)
        {
            parameter = Metadata.metaObject.parameters.byId[parameterId];
            parameterValueEl = addAndReturnElement("parameterValue", scenarioNameSpace, userDefinedEl);
            parameterValueEl.setAttribute("idref", parameterId);
            parameter.type.toXML(parameterValueEl, parameter.type.defaultValue);
        }

        // Save fixed parameter initial values
        var fixedEl = addAndReturnElement("fixed", scenarioNameSpace, initialParameterValuesEl);
        for (parameterId in Config.configObject.parameters.byId)
        {
            parameter = Config.configObject.parameters.byId[parameterId];
            parameterValueEl = addAndReturnElement("parameterValue", scenarioNameSpace, fixedEl);
            parameterValueEl.setAttribute("idref", parameterId);
            parameter.type.toXML(parameterValueEl, parameter.type.defaultValue);
        }
        for (var characterId in Config.configObject.characters.byId)
        {
            for (parameterId in Config.configObject.characters.parameters.byId)
            {
                parameter = Config.configObject.characters.parameters.byId[parameterId];
                parameterValueEl = addAndReturnElement("characterParameterValue", scenarioNameSpace, fixedEl);
                parameterValueEl.setAttribute("idref", parameterId);
                parameterValueEl.setAttribute("characteridref", characterId);
                parameter.type.toXML(parameterValueEl, parameter.type.defaultValue);
            }

            for (parameterId in Config.configObject.characters.byId[characterId].parameters.byId)
            {
                parameter = Config.configObject.characters.byId[characterId].parameters.byId[parameterId];
                parameterValueEl = addAndReturnElement("characterParameterValue", scenarioNameSpace, fixedEl);
                parameterValueEl.setAttribute("idref", parameterId);
                parameterValueEl.setAttribute("characteridref", characterId);
                parameter.type.toXML(parameterValueEl, parameter.type.defaultValue);
            }
        }
    }

    // Offers the XML of the current scenario for download
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
            if (!window.confirm(i18next.t('save:error.export')))
            {
                return false;
            }
        }

        Main.applyChanges();

        var xml = generateXML();
        var blob = new Blob([xml], { type: 'text/xml' });
        saveAs(blob, Metadata.metaObject.name + '.xml');
    }

    function generateTreeXML(parentElement, tree)
    {
        var treeElement = addAndReturnElement("dialogue", scenarioNameSpace, parentElement);
        treeElement.setAttribute("id", tree.id.replace(/^ext_/, ''));
        treeElement.setAttribute("optional", tree.optional);

        addAndReturnElement('subject', scenarioNameSpace, treeElement).textContent = tree.subject;

        var editingDataElement = addAndReturnElement('editingData', scenarioNameSpace, treeElement);
        var positionElement = addAndReturnElement('position', scenarioNameSpace, editingDataElement);
        addAndReturnElement('x', scenarioNameSpace, positionElement).textContent = tree.leftPos;
        addAndReturnElement('y', scenarioNameSpace, positionElement).textContent = tree.topPos;

        var startsElement = addAndReturnElement('starts', scenarioNameSpace, treeElement);
        sortNodeIDs(Main.getStartNodeIDs(tree)).forEach(function(startNodeID)
        {
            addAndReturnElement("start", scenarioNameSpace, startsElement).setAttribute("idref", startNodeID.replace(/^ext_/, '').replace(/_/g, '.'));
        });

        var statementsElement = addAndReturnElement('statements', scenarioNameSpace, treeElement);
        generateNodesXML(statementsElement, tree);
    }

    function generateNodesXML(statementsElement, tree)
    {
        tree.nodes.forEach(function(nodeID)
        {
            // Get the node
            var node = Main.nodes[nodeID];

            // Generate the XML element for the node with the id
            var statementEl = addAndReturnElement(node.type + "Statement", scenarioNameSpace, statementsElement);
            statementEl.setAttribute('id', node.id.replace(/^ext_/, '').replace(/_/g, '.'));

            if (node.type === Main.computerType)
            {
                statementEl.setAttribute('characteridref', node.characterIdRef);
                statementEl.setAttribute('jumpPoint', node.jumpPoint);
                statementEl.setAttribute('inits', node.initsNode);
            }
            statementEl.setAttribute('end', node.endNode);

            // Add a text element to the XML element
            addAndReturnElement("text", scenarioNameSpace, statementEl, true).textContent = node.text;

            var editingDataEl = addAndReturnElement("editingData", scenarioNameSpace, statementEl);

            // Save the position
            var position = Utils.cssPosition($("#" + node.id));
            var positionEl = addAndReturnElement("position", scenarioNameSpace, editingDataEl);
            addAndReturnElement("x", scenarioNameSpace, positionEl).textContent = position.left;
            addAndReturnElement("y", scenarioNameSpace, positionEl).textContent = position.top;

            // Save the comment
            if (node.comment !== "")
                addAndReturnElement("comment", scenarioNameSpace, editingDataEl, true).textContent = node.comment;

            // Save the preconditions
            var preconditionsInXML = createAndReturnPreconditionXML(node.preconditions);
            if (preconditionsInXML !== null)
            {
                var preconditionsEl = addAndReturnElement("preconditions", scenarioNameSpace, statementEl);
                preconditionsEl.appendChild(preconditionsInXML);
            }

            // Save the parameter effects
            generateParameterEffectsXML(statementEl, node.parameterEffects);

            // Save the property values
            generatePropertyValuesXML(statementEl, node.propertyValues);

            // Get the outgoing connections of the node
            var connections = tree.plumbInstance.getConnections(
            {
                source: node.id
            });

            var targetNodeIDs = connections.map(function(connection) { return connection.targetId; });
            sortNodeIDs(targetNodeIDs);

            // Save the responses
            var responseElName = 'response';
            var responsesEl = addAndReturnElement(responseElName + "s", scenarioNameSpace, statementEl);
            targetNodeIDs.forEach(function(targetNodeID)
            {
                var responseEl = addAndReturnElement(responseElName, scenarioNameSpace, responsesEl);
                responseEl.setAttribute('idref', targetNodeID.replace(/^ext_/, '').replace(/_/g, '.'));
            });
        });
    }

    // Sorts nodes on the axis with the largest span and based on the position on that axis
    function sortNodeIDs(nodeIDs)
    {
        // Calculate the spans between the nodes on the X and Y axes
        var xPositions = nodeIDs.map(function(nodeID) { return Utils.cssPosition($("#" + nodeID)).left; });
        var yPositions = nodeIDs.map(function(nodeID) { return Utils.cssPosition($("#" + nodeID)).top;  });
        var spanX = Math.max.apply(null, xPositions) - Math.min.apply(null, xPositions);
        var spanY = Math.max.apply(null, yPositions) - Math.min.apply(null, yPositions);
        var sortProperty = spanX > spanY ? 'left' : 'top';

        // Sort the nodeIDs based on the largest span between the nodes
        return nodeIDs.sort(function(a, b)
        {
            return Utils.cssPosition($("#" + a))[sortProperty] - Utils.cssPosition($("#" + b))[sortProperty];
        });
    }

    function generateParameterEffectsXML(element, parameterEffects)
    {
        var parameterEffectsEl = addAndReturnElement("parameterEffects", scenarioNameSpace, element);

        var userDefinedParameterEffectsEl = addAndReturnElement("userDefined", scenarioNameSpace, parameterEffectsEl);
        for (var k = 0; k < parameterEffects.userDefined.length; k++)
        {
            var pEff = parameterEffects.userDefined[k];
            var pEffElement = addAndReturnElement("parameterEffect", scenarioNameSpace, userDefinedParameterEffectsEl);
            pEffElement.setAttribute("idref", pEff.idRef);
            pEffElement.setAttribute("operator", pEff.operator);
            Metadata.metaObject.parameters.byId[pEff.idRef].type.toXML(pEffElement, pEff.value);
        }

        var fixedParameterEffectsEl = addAndReturnElement("fixed", scenarioNameSpace, parameterEffectsEl);
        parameterEffects.fixed.characterIndependent.sequence.forEach(function(parameterEffect)
        {
            var pEffElement = addAndReturnElement("parameterEffect", scenarioNameSpace, fixedParameterEffectsEl);
            pEffElement.setAttribute("idref", parameterEffect.idRef);
            pEffElement.setAttribute("operator", parameterEffect.operator);
            Config.configObject.parameters.byId[parameterEffect.idRef].type.toXML(pEffElement, parameterEffect.value);
        });
        for (var characterId in Config.configObject.characters.byId)
        {
            parameterEffects.fixed.perCharacter[characterId].sequence.forEach(function(parameterEffect)
            {
                var pEffElement = addAndReturnElement("characterParameterEffect", scenarioNameSpace, fixedParameterEffectsEl);
                pEffElement.setAttribute("idref", parameterEffect.idRef);
                pEffElement.setAttribute("characteridref", characterId);
                pEffElement.setAttribute("operator", parameterEffect.operator);

                if (parameterEffect.idRef in Config.configObject.characters.parameters.byId)
                {
                    Config.configObject.characters.parameters.byId[parameterEffect.idRef].type.toXML(pEffElement, parameterEffect.value);
                }
                else
                {
                    Config.configObject.characters.byId[characterId].parameters.byId[parameterEffect.idRef].type.toXML(pEffElement, parameterEffect.value);
                }
            });
        }
    }

    function generatePropertyValuesXML(element, propertyValues)
    {
        var propertyValuesEl = addAndReturnElement("propertyValues", scenarioNameSpace, element);
        var propertyId;
        for (propertyId in propertyValues.characterIndependent)
        {
            var propertyValueEl = addAndReturnElement("propertyValue", scenarioNameSpace, propertyValuesEl);
            propertyValueEl.setAttribute("idref", propertyId);
            Config.configObject.properties.byId[propertyId].type.toXML(propertyValueEl, propertyValues.characterIndependent[propertyId]);
        }

        for (var characterId in Config.configObject.characters.byId)
        {
            for (propertyId in propertyValues.perCharacter[characterId])
            {
                var characterPropertyValueEl = addAndReturnElement("characterPropertyValue", scenarioNameSpace, propertyValuesEl);
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
    function addAndReturnElement(elNameToAdd, nameSpace, xmlElement, preserveSpaces)
    {
        var elToAdd = document.createElementNS(nameSpace, elNameToAdd);
        if (preserveSpaces) Utils.setPreserveSpace(elToAdd);
        xmlElement.appendChild(elToAdd);
        return elToAdd;
    }

    // Creates an XML element for the precondition
    function createAndReturnPreconditionXML(precondition)
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
                conditionEl = document.createElementNS(scenarioNameSpace, "characterCondition");
                conditionEl.setAttribute("characteridref", precondition.characterIdRef);
            }
            else
            {
                conditionEl = document.createElementNS(scenarioNameSpace, "condition");
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
            var typeEl = document.createElementNS(scenarioNameSpace,precondition.type);
            for (var i = 0; i < precondition.preconditions.length; i++)
            {
                var conditionObj = precondition.preconditions[i];
                conditionEl = createAndReturnPreconditionXML(conditionObj);
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
