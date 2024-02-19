// © DialogueTrainer

/* exported Save */
let Save;

(function()
{
    "use strict";

    // eslint-disable-next-line no-global-assign
    Save =
    {
        exportScenario: exportScenario
    };

    const scenarioNameSpace = "http://uudsl.github.io/scenario/namespace";
    const schemaVersion = "4.12.0";

    $(function()
    {
        $("#exportScenario").on('click', exportScenario);
    });

    // Generates the XML
    function generateXML()
    {
        const doc = document.implementation.createDocument(scenarioNameSpace, 'scenario', null);

        for (const nameSpace in Config.additionalNameSpaces)
        {
            doc.documentElement.setAttributeNS('http://www.w3.org/2000/xmlns/',
                'xmlns:' + Config.additionalNameSpaces[nameSpace], nameSpace);
        }

        if (!SaveIndicator.getSavedChanges()) Metadata.container.version++;
        doc.documentElement.setAttribute("version", Metadata.container.version);
        doc.documentElement.setAttribute("schemaVersion", schemaVersion);
        doc.documentElement.setAttribute("configidref", Config.container.id);
        if (Config.container.version !== undefined) doc.documentElement.setAttribute("configVersion", Config.container.version);

        // Save definitions
        generateDefinitionsXML(doc.documentElement);

        // Save evaluations
        generateEvaluationsXML(doc.documentElement);

        // Save metadata
        const metadataEl = addAndReturnElement("metadata", scenarioNameSpace, doc.documentElement);
        addAndReturnElement("name", scenarioNameSpace, metadataEl).textContent = Metadata.container.name;
        addAndReturnElement("date", scenarioNameSpace, metadataEl).textContent = new Date().toISOString();
        if (Metadata.container.language)
        {
            const languageEl = addAndReturnElement("language", scenarioNameSpace, metadataEl);
            languageEl.setAttribute("code", Metadata.container.language.code);
            languageEl.textContent = Metadata.container.language.name;
        }
        addAndReturnElement("description", scenarioNameSpace, metadataEl, true).textContent = Metadata.container.description;

        if (Metadata.container.authors.length > 0)
        {
            const authorsEl = addAndReturnElement("authors", scenarioNameSpace, metadataEl);
            Metadata.container.authors.forEach(function(author)
            {
                const authorEl = addAndReturnElement("author", scenarioNameSpace, authorsEl);
                authorEl.setAttribute("name", author.name);
                if (author.email) authorEl.setAttribute("email", author.email);
                authorEl.setAttribute("startDate", author.startDate);
                if (author.endDate) authorEl.setAttribute("endDate", author.endDate);
            });
        }

        addAndReturnElement("difficulty", scenarioNameSpace, metadataEl).textContent = Metadata.container.difficulty;

        // Save parameter initial values
        generateInitialParameterValuesXML(metadataEl);

        // Save property values
        generatePropertyValuesXML(metadataEl, Metadata.container.propertyValues);

        // Save sequence
        const seqElement = addAndReturnElement("sequence", scenarioNameSpace, doc.documentElement);
        Main.getInterleaves().forEach(function(interleave)
        {
            const interleaveElement = addAndReturnElement("interleave", scenarioNameSpace, seqElement);
            interleave.forEach(function(tree)
            {
                generateTreeXML(interleaveElement, tree);
            });
        });

        const s = new XMLSerializer();
        return s.serializeToString(doc);
    }

    function generateDefinitionsXML(parentElement)
    {
        const definitionsEl = addAndReturnElement("definitions", scenarioNameSpace, parentElement);

        // Save characters
        const charactersEl = addAndReturnElement("characters", scenarioNameSpace, definitionsEl);
        Config.container.characters.sequence.forEach(function(character)
        {
            const characterEl = addAndReturnElement("character", scenarioNameSpace, charactersEl);
            characterEl.setAttribute("id", character.id);
            if (character.name) characterEl.setAttribute("name", character.name);
        });

        const addDefinitionElement = function(definition, elementName, definitionsEl)
        {
            const definitionEl = addAndReturnElement(elementName, scenarioNameSpace, definitionsEl);

            definitionEl.setAttribute("id", definition.id);
            definitionEl.setAttribute("name", definition.name);
            if (definition.description)
            {
                addAndReturnElement("description", scenarioNameSpace, definitionEl, true).textContent = definition.description;
            }

            const typeContainerEl = addAndReturnElement("type", scenarioNameSpace, definitionEl);
            const typeEl = definition.type.insertType(typeContainerEl);
            if (definition.type.defaultValue !== undefined)
            {
                const defaultEl = addAndReturnElement('default', scenarioNameSpace, typeEl);
                definition.type.toXML(defaultEl, definition.type.defaultValue);
            }
        };

        const parametersEl = addAndReturnElement("parameters", scenarioNameSpace, definitionsEl);

        // Save user-defined parameters
        const userDefinedParametersEl = addAndReturnElement("userDefined", scenarioNameSpace, parametersEl);
        Parameters.container.sequence.forEach(function(parameter)
        {
            addDefinitionElement(parameter, "parameter", userDefinedParametersEl);
        });

        // Save fixed parameters
        const fixedParametersEl = addAndReturnElement("fixed", scenarioNameSpace, parametersEl);
        for (const parameterId in Config.container.parameters.byId)
        {
            const parameter = Config.container.parameters.byId[parameterId];
            addDefinitionElement(parameter, "parameter", fixedParametersEl);
        }
        for (const parameterId in Config.container.characters.parameters.byId)
        {
            const parameter = Config.container.characters.parameters.byId[parameterId];
            addDefinitionElement(parameter, "parameter", fixedParametersEl);
        }
        for (const characterId in Config.container.characters.byId)
        {
            for (const parameterId in Config.container.characters.byId[characterId].parameters.byId)
            {
                const parameter = Config.container.characters.byId[characterId].parameters.byId[parameterId];
                addDefinitionElement(parameter, "parameter", fixedParametersEl);
            }
        }

        // Save properties
        const propertyDefinitionsEl = addAndReturnElement("properties", scenarioNameSpace, definitionsEl);
        for (const propertyId in Config.container.properties.byId)
        {
            const property = Config.container.properties.byId[propertyId];
            addDefinitionElement(property, "property", propertyDefinitionsEl);
        }
        for (const propertyId in Config.container.characters.properties.byId)
        {
            const property = Config.container.characters.properties.byId[propertyId];
            addDefinitionElement(property, "property", propertyDefinitionsEl);
        }
        for (const characterId in Config.container.characters.byId)
        {
            for (const propertyId in Config.container.characters.byId[characterId].properties.byId)
            {
                const property = Config.container.characters.byId[characterId].properties.byId[propertyId];
                addDefinitionElement(property, "property", propertyDefinitionsEl);
            }
        }

        const annotationsEl = Utils.appendChild(definitionsEl, "annotations");
        ColorPicker.keyToXML(annotationsEl);
    }

    function generateInitialParameterValuesXML(parentElement)
    {
        const initialParameterValuesEl = addAndReturnElement("initialParameterValues", scenarioNameSpace, parentElement);

        // Save user-defined parameter initial values
        const userDefinedEl = addAndReturnElement("userDefined", scenarioNameSpace, initialParameterValuesEl);
        for (const parameterId in Parameters.container.byId)
        {
            const parameter = Parameters.container.byId[parameterId];
            const parameterValueEl = addAndReturnElement("parameterValue", scenarioNameSpace, userDefinedEl);
            parameterValueEl.setAttribute("idref", parameterId);
            parameter.type.toXML(parameterValueEl, parameter.type.defaultValue);
        }

        // Save fixed parameter initial values
        const fixedEl = addAndReturnElement("fixed", scenarioNameSpace, initialParameterValuesEl);
        for (const parameterId in Config.container.parameters.byId)
        {
            const parameter = Config.container.parameters.byId[parameterId];
            const parameterValueEl = addAndReturnElement("parameterValue", scenarioNameSpace, fixedEl);
            parameterValueEl.setAttribute("idref", parameterId);
            parameter.type.toXML(parameterValueEl, parameter.type.defaultValue);
        }
        for (const characterId in Config.container.characters.byId)
        {
            for (const parameterId in Config.container.characters.parameters.byId)
            {
                const parameter = Config.container.characters.parameters.byId[parameterId];
                const parameterValueEl = addAndReturnElement("characterParameterValue", scenarioNameSpace, fixedEl);
                parameterValueEl.setAttribute("idref", parameterId);
                parameterValueEl.setAttribute("characteridref", characterId);
                parameter.type.toXML(parameterValueEl, parameter.type.defaultValue);
            }

            for (const parameterId in Config.container.characters.byId[characterId].parameters.byId)
            {
                const parameter = Config.container.characters.byId[characterId].parameters.byId[parameterId];
                const parameterValueEl = addAndReturnElement("characterParameterValue", scenarioNameSpace, fixedEl);
                parameterValueEl.setAttribute("idref", parameterId);
                parameterValueEl.setAttribute("characteridref", characterId);
                parameter.type.toXML(parameterValueEl, parameter.type.defaultValue);
            }
        }
    }

    function generateEvaluationsXML(parentElement)
    {
        const evaluationsEl = addAndReturnElement("typedExpressions", scenarioNameSpace, parentElement);
        Evaluations.container.sequence.forEach(function(evaluation)
        {
            const evaluationEl = addAndReturnElement("typedExpression", scenarioNameSpace, evaluationsEl);
            evaluationEl.setAttribute("id", evaluation.id);
            evaluationEl.setAttribute("name", evaluation.name);
            if (evaluation.description)
            {
                addAndReturnElement("description", scenarioNameSpace, evaluationEl, true).textContent = evaluation.description;
            }
            const typeContainerEl = addAndReturnElement("type", scenarioNameSpace, evaluationEl);
            evaluation.type.insertType(typeContainerEl);
            const expressionEl = addAndReturnElement("expression", scenarioNameSpace, evaluationEl);
            Expression.toXML(expressionEl, evaluation.type, evaluation.expression);
        });
    }

    // Offers the XML of the current scenario for download
    function exportScenario()
    {
        // Warn user before exporting an invalid scenario
        const errors = Validator.validate();
        const hasErrors = errors.some(function(error) { return error.level === 'error'; });

        const consideredExport = function()
        {
            Main.applyChanges();

            const xml = generateXML();
            const blob = new Blob([xml], { type: 'text/xml' });
            saveAs(blob, Metadata.container.name + '.xml');
        };

        if (hasErrors)
        {
            Utils.confirmDialog(i18next.t('save:warning.export'), 'warning').then(function(confirmed)
            {
                if (confirmed)
                {
                    consideredExport();
                }
            });
        }
        else
        {
            consideredExport();
        }
    }

    function generateTreeXML(parentElement, tree)
    {
        const treeElement = addAndReturnElement("dialogue", scenarioNameSpace, parentElement);
        treeElement.setAttribute("id", tree.id.replace(/^ext_/, ''));
        treeElement.setAttribute("optional", tree.optional);

        addAndReturnElement('subject', scenarioNameSpace, treeElement).textContent = tree.subject;

        const editingDataElement = addAndReturnElement('editingData', scenarioNameSpace, treeElement);
        const positionElement = addAndReturnElement('position', scenarioNameSpace, editingDataElement);
        addAndReturnElement('x', scenarioNameSpace, positionElement).textContent = tree.leftPos;
        addAndReturnElement('y', scenarioNameSpace, positionElement).textContent = tree.topPos;

        // Save the comment
        if (tree.comment !== "")
        {
            addAndReturnElement("comment", scenarioNameSpace, editingDataElement, true).textContent = tree.comment;
        }

        const startsElement = addAndReturnElement('starts', scenarioNameSpace, treeElement);
        sortIdentifiables(Main.getStartNodeIDs(tree).map(function(startNodeID) { return { id: startNodeID }; })).forEach(function(startNode)
        {
            addAndReturnElement("start", scenarioNameSpace, startsElement).setAttribute("idref", startNode.id.replace(/^ext_/, '').replace(/_/g, '.'));
        });

        const statementsElement = addAndReturnElement('statements', scenarioNameSpace, treeElement);
        generateNodesXML(statementsElement, tree);
    }

    function generateNodesXML(statementsElement, tree)
    {
        tree.nodes.forEach(function(nodeID)
        {
            // Get the node
            const node = Main.nodes[nodeID];

            // Generate the XML element for the node with the id
            const statementEl = addAndReturnElement(node.type + "Statement", scenarioNameSpace, statementsElement);
            statementEl.setAttribute('id', node.id.replace(/^ext_/, '').replace(/_/g, '.'));

            if (node.type === Main.computerType)
            {
                statementEl.setAttribute('characteridref', node.characterIdRef);
            }
            statementEl.setAttribute('allowInterleave', node.allowInterleaveNode);
            statementEl.setAttribute('allowDialogueEnd', node.allowDialogueEndNode);
            statementEl.setAttribute('end', node.endNode);

            // Add a text element to the XML element
            addAndReturnElement("text", scenarioNameSpace, statementEl, true).textContent = node.text;

            const editingDataEl = addAndReturnElement("editingData", scenarioNameSpace, statementEl);

            // Save the position
            const position = Utils.cssPosition($("#" + node.id));
            const positionEl = addAndReturnElement("position", scenarioNameSpace, editingDataEl);
            addAndReturnElement("x", scenarioNameSpace, positionEl).textContent = position.left;
            addAndReturnElement("y", scenarioNameSpace, positionEl).textContent = position.top;

            // Save the comment
            if (node.comment !== "")
            {
                addAndReturnElement("comment", scenarioNameSpace, editingDataEl, true).textContent = node.comment;
            }

            // Save the preconditions
            if (node.preconditions)
            {
                const preconditionsEl = addAndReturnElement("preconditions", scenarioNameSpace, statementEl);
                Condition.toXML(preconditionsEl, node.preconditions);
            }

            // Save the parameter effects
            generateParameterEffectsXML(statementEl, node.parameterEffects);

            // Save the property values
            generatePropertyValuesXML(statementEl, node.propertyValues);

            // Get the outgoing connections of the node
            const connections = tree.plumbInstance.getConnections(
            {
                source: node.id
            });

            const targetNodes = connections.map(function(connection)
            {
                return { id: connection.targetId, colorValue: connection.getParameter('color') };
            });
            sortIdentifiables(targetNodes);

            // Save the responses
            const responseElName = 'response';
            const responsesEl = addAndReturnElement(responseElName + "s", scenarioNameSpace, statementEl);
            targetNodes.forEach(function(targetNode)
            {
                const responseEl = addAndReturnElement(responseElName, scenarioNameSpace, responsesEl);
                responseEl.setAttribute('idref', targetNode.id.replace(/^ext_/, '').replace(/_/g, '.'));

                if (targetNode.colorValue)
                {
                    const annotationValuesEl = Utils.appendChild(responseEl, "annotationValues");
                    ColorPicker.colorToXML(annotationValuesEl, targetNode.colorValue);
                }
            });
        });
    }

    // Sorts based on the axis with the largest span and based on the position on that axis
    function sortIdentifiables(identifiables)
    {
        // Calculate the spans between the nodes on the X and Y axes
        const xPositions = identifiables.map(function(identifiable) { return Utils.cssPosition($("#" + identifiable.id)).left; });
        const yPositions = identifiables.map(function(identifiable) { return Utils.cssPosition($("#" + identifiable.id)).top; });
        const spanX = Math.max.apply(null, xPositions) - Math.min.apply(null, xPositions);
        const spanY = Math.max.apply(null, yPositions) - Math.min.apply(null, yPositions);
        const sortProperty = spanX > spanY ? 'left' : 'top';

        // Sort the identifiables based on the largest span between the identifiables and their position
        return identifiables.sort(function(a, b)
        {
            return Utils.cssPosition($("#" + a.id))[sortProperty] - Utils.cssPosition($("#" + b.id))[sortProperty];
        });
    }

    function generateParameterEffectsXML(element, parameterEffects)
    {
        const parameterEffectsEl = addAndReturnElement("parameterEffects", scenarioNameSpace, element);

        const userDefinedParameterEffectsEl = addAndReturnElement("userDefined", scenarioNameSpace, parameterEffectsEl);
        parameterEffects.userDefined.forEach(function(pEff)
        {
            const pEffElement = addAndReturnElement("parameterEffect", scenarioNameSpace, userDefinedParameterEffectsEl);
            pEffElement.setAttribute("idref", pEff.idRef);
            pEffElement.setAttribute("operator", pEff.operator);
            Parameters.container.byId[pEff.idRef].type.toXML(pEffElement, pEff.value);
        });

        const fixedParameterEffectsEl = addAndReturnElement("fixed", scenarioNameSpace, parameterEffectsEl);
        parameterEffects.fixed.characterIndependent.sequence.forEach(function(parameterEffect)
        {
            const pEffElement = addAndReturnElement("parameterEffect", scenarioNameSpace, fixedParameterEffectsEl);
            pEffElement.setAttribute("idref", parameterEffect.idRef);
            pEffElement.setAttribute("operator", parameterEffect.operator);
            Config.container.parameters.byId[parameterEffect.idRef].type.toXML(pEffElement, parameterEffect.value);
        });
        for (const characterId in Config.container.characters.byId)
        {
            parameterEffects.fixed.perCharacter[characterId].sequence.forEach(function(parameterEffect)
            {
                const pEffElement = addAndReturnElement("characterParameterEffect", scenarioNameSpace, fixedParameterEffectsEl);
                pEffElement.setAttribute("idref", parameterEffect.idRef);
                pEffElement.setAttribute("characteridref", characterId);
                pEffElement.setAttribute("operator", parameterEffect.operator);

                if (parameterEffect.idRef in Config.container.characters.parameters.byId)
                {
                    Config.container.characters.parameters.byId[parameterEffect.idRef].type.toXML(pEffElement, parameterEffect.value);
                }
                else
                {
                    Config.container.characters.byId[characterId].parameters.byId[parameterEffect.idRef].type.toXML(pEffElement, parameterEffect.value);
                }
            });
        }
    }

    function generatePropertyValuesXML(element, propertyValues)
    {
        const propertyValuesEl = addAndReturnElement("propertyValues", scenarioNameSpace, element);
        for (const propertyId in propertyValues.characterIndependent)
        {
            const propertyValueEl = addAndReturnElement("propertyValue", scenarioNameSpace, propertyValuesEl);
            propertyValueEl.setAttribute("idref", propertyId);
            Config.container.properties.byId[propertyId].type.toXML(propertyValueEl, propertyValues.characterIndependent[propertyId]);
        }

        for (const characterId in Config.container.characters.byId)
        {
            for (const propertyId in propertyValues.perCharacter[characterId])
            {
                const characterPropertyValueEl = addAndReturnElement("characterPropertyValue", scenarioNameSpace, propertyValuesEl);
                characterPropertyValueEl.setAttribute("characteridref", characterId);
                characterPropertyValueEl.setAttribute("idref", propertyId);

                const propertyValue = propertyValues.perCharacter[characterId][propertyId];
                if (propertyId in Config.container.characters.properties.byId)
                {
                    Config.container.characters.properties.byId[propertyId].type.toXML(characterPropertyValueEl, propertyValue);
                }
                else
                {
                    Config.container.characters.byId[characterId].properties.byId[propertyId].type.toXML(characterPropertyValueEl, propertyValue);
                }
            }
        }
    }

    // Creates an XML element, adds it to another element, and returns the created element
    function addAndReturnElement(elNameToAdd, nameSpace, xmlElement, preserveSpaces)
    {
        const elToAdd = document.createElementNS(nameSpace, elNameToAdd);
        if (preserveSpaces) Utils.setPreserveSpace(elToAdd);
        xmlElement.appendChild(elToAdd);
        return elToAdd;
    }
})();
