// © DialogueTrainer

/* exported Load */
let Load;

(function()
{
    "use strict";

    // eslint-disable-next-line no-global-assign
    Load =
    {
        importDialog: importDialog,
        importScenario: importScenario
    };

    $(function()
    {
        $("#importScenario").on('click', importDialog);

        finishLoad();
    });

    function importDialog()
    {
        const importContainer = $('<input>', { type: 'file', accept: '.txt,.xml', multiple: false });
        const importDialog = $('<div>')
            .append($('<form>', { action: "", method: "post", enctype: "multipart/form-data" })
                .append($('<label>', { text: i18next.t('load:file_to_import') + ": " })
                    .append(importContainer)));

        importDialog.dialog(
        {
            title: i18next.t('load:import_title'),
            width: Utils.fitDialogWidthToWindow(Utils.dialogSizes.small),
            modal: true,
            closeOnBackdropClick: true,
            closeOnEscape: false,
            closeButton: false,
            buttons: [
                {
                    text: i18next.t('load:import'),
                    class: 'col-primary roundedPill medium',
                    click: function()
                    {
                        if (SaveIndicator.getSavedChanges()) importScenario(importContainer);
                        else
                        {
                            Utils.confirmDialog(i18next.t('load:import_warning'), 'warning').then(function(confirmed)
                            {
                                if (confirmed)importScenario(importContainer);
                            });
                        }
                        $(this).dialog('close');
                    }
                },
                {
                    text: i18next.t('common:close'),
                    class: 'col-dim roundedPill medium',
                    click: function() { $(this).dialog('close'); }
                }
            ],
            close: function()
            {
                $("#main").focus();
                importDialog.remove();
            }
        });
    }

    // Creates a graph and metadata from xml file provided by user
    function importScenario(importContainer)
    {
        const files = importContainer.prop('files');

        if (files.length < 1) return;

        const reader = new FileReader();

        reader.onload = function()
        {
            let xml;
            try
            {
                xml = $.parseXML(reader.result);
            }
            catch (err)
            {
                Utils.alertDialog(i18next.t('load:invalid_xml'), 'error');
                return;
            }

            loadScenario(xml);
        };

        reader.readAsText(files[0]);
    }

    function loadScenario(xml)
    {
        prepareRebuild();

        const scenarioXML = xml.documentElement;

        // Try to find the schemaVersion of the XML and to find the old version
        const schemaVersion = parseInt($(scenarioXML).attr('schemaVersion'));
        const oldVersion = parseInt($(scenarioXML).children('metadata').eq(0).children('version').text());

        // Load with the newest version of the schema
        if (schemaVersion)
        {
            if (Config.container.id !== $(scenarioXML).attr('configidref'))
            {
                Utils.alertDialog("The config id does not match the config id referred to in the scenario", 'warning');
            }
            loadDefinitions($(scenarioXML).children('definitions').eq(0));
            loadEvaluations($(scenarioXML).children('typedExpressions').eq(0));
            loadMetadata($(scenarioXML).attr('version'), $(scenarioXML).children('metadata').eq(0));
            jsPlumb.batch(function()
            {
                generateGraph(scenarioXML);
            });
        }
        // Load versions 2 and 3
        else if (oldVersion)
        {
            Load3.loadMetadata($(scenarioXML).children('metadata').eq(0));
            jsPlumb.batch(function()
            {
                Load3.generateGraph(scenarioXML);
            });
        }
        // Load version 1
        else
        {
            Load3.loadMetadata($(scenarioXML).children('metadata').eq(0));
            jsPlumb.batch(function()
            {
                Load1.generateGraph(scenarioXML);
            });
        }

        finishLoad();
    }

    function prepareRebuild()
    {
        TabDock.close();

        Main.selectElement(null);

        Zoom.zoomOut();

        if (Main.nodes.length !== 0)
        {
            Object.values(Main.trees).forEach(function(tree)
            {
                tree.plumbInstance.deleteEveryEndpoint();
            });
        }

        Main.trees = {};
        Main.nodes = {};
        $(".w").remove();

        Main.jsPlumbCounter = 0;
        Main.maxTreeNumber = 0;
        Metadata.reset();
        Parameters.reset();
        Evaluations.reset();
        ElementList.reset();
    }

    function finishLoad()
    {
        const trees = Object.values(Main.trees);
        if (trees.length === 0)
        {
            Zoom.zoomIn(Main.createEmptyTree(null, 0, 0));
        }
        else if (trees.length === 1)
        {
            Zoom.zoomIn(trees[0]);
        }
        else if (trees.length > 1 && Zoom.isZoomed)
        {
            trees.forEach(function(tree)
            {
                Main.updateTreePreview(tree);
            });
        }

        SaveIndicator.setSavedChanges(true);
        MiniMap.update(true);
    }

    // Generates the entire graph, including the objects.
    function generateGraph(xml)
    {
        $(xml).children('sequence').children('interleave').each(function()
        {
            $(this).children('dialogue').each(function()
            {
                const connections = {};

                let treeID = this.getAttribute('id').replace(/\./g, '_');
                const idMatch = treeID.match(/^dialogue(\d+)$/);
                if (idMatch)
                {
                    Main.maxTreeNumber = Math.max(parseInt(idMatch[1]) + 1, Main.maxTreeNumber);
                }
                else
                {
                    treeID = "ext_" + treeID;
                }

                // Get the position from the XML, note that this is in grid coordinates, not screen coordinates
                const editingDataXML = $(this).children('editingData');
                const position = editingDataXML.children('position')[0];
                const leftPos = Math.round(Utils.parseDecimalIntWithDefault($(position).children('x')[0].textContent, 0));
                const topPos = Math.round(Utils.parseDecimalIntWithDefault($(position).children('y')[0].textContent, 0));

                const tree = Main.createEmptyTree(treeID, leftPos, topPos);
                const plumbInstance = tree.plumbInstance;

                tree.subject = $(this).children('subject')[0].textContent;

                tree.optional = Utils.parseBool($(this).attr('optional'));
                const iconDiv = tree.dragDiv.find('.icons');
                if (tree.optional) iconDiv.html(Utils.sIcon('mdi-axis-arrow'));
                $(tree.dragDiv).toggleClass('optional', tree.optional);

                tree.comment = editingDataXML.children('comment').text();

                tree.dragDiv.find('.subjectName').text(tree.subject); // Set subject in HTML
                tree.dragDiv.find('.subjectNameInput').val(tree.subject); // Set subject in HTML

                plumbInstance.batch(() =>
                {
                    $(this).children('statements').children().each(function()
                    {
                        switch (this.nodeName)
                        {
                            case "computerStatement":
                                loadStatement(this, Main.computerType, connections, treeID);
                                break;
                            case "playerStatement":
                                loadStatement(this, Main.playerType, connections, treeID);
                                break;
                            case "situationStatement":
                                loadStatement(this, Main.situationType, connections, treeID);
                                break;
                        }
                    });

                    // Makes the connections between the nodes.
                    $.each(connections, function(sourceId, targets)
                    {
                        targets.forEach(function(target)
                        {
                            const connection = plumbInstance.connect(
                            {
                                source: sourceId,
                                target: target.id
                            });
                            connection.setParameter('color', target.colorValue);
                        });
                    });
                }, true);
            });
        });
    }

    function loadDefinitions(definitions)
    {
        $(definitions).children('parameters').children('userDefined').children().each(function()
        {
            const parameterId = this.attributes.id.value;

            const parameterMatch = parameterId.match(/^p(\d+)$/);
            if (parameterMatch !== null)
            {
                const parameterNumber = parseInt(parameterMatch[1]);
                if (parameterNumber > Parameters.counter) Parameters.counter = parameterNumber;
            }

            const typeXML = $(this).children('type').children();
            const parameter =
            {
                id: parameterId,
                name: this.attributes.name.value,
                type: Types.primitives[typeXML[0].nodeName].loadType(typeXML, parameterId),
                description: $(this).children('description').text()
            };
            Parameters.container.sequence.push(parameter);
            Parameters.container.byId[parameter.id] = parameter;
        });

        if ('t' in Parameters.container.byId) Parameters.timeId = 't';

        const annotations = $(definitions).children('annotations');
        if (annotations.length > 0)
        {
            ColorPicker.keyFromXML(annotations.eq(0));
        }
    }

    function loadEvaluations(evaluationsXML)
    {
        $(evaluationsXML).children().each(function()
        {
            const evaluationId = this.attributes.id.value;
            const evaluationIdPrefix = Evaluations.getIdPrefix();
            const evaluationMatch = evaluationId.match('^' + Utils.escapeRegex(evaluationIdPrefix) + 'e(\\d+)$');
            if (evaluationMatch !== null)
            {
                const evaluationCounter = parseInt(evaluationMatch[1]);
                if (evaluationCounter > Evaluations.counter)
                {
                    Evaluations.counter = evaluationCounter;
                }
            }

            for (const parameterId in Parameters.container.byId)
            {
                if (evaluationId === Evaluations.getParameterIdPrefix() + parameterId)
                {
                    Parameters.container.byId[parameterId].evaluated = true;
                }
            }

            const typeXML = $(this).children('type').children();
            let type = Types.primitives[typeXML[0].nodeName].loadType(typeXML);
            if (type.name === Types.primitives.string.name)
            {
                type = $.extend({}, type, { controlName: 'textarea', rows: 4, markdown: "gfm" });
            }

            const expressionXML = $(this).children('expression').children();
            const expression = Expression.fromXML(expressionXML[0], type);

            const evaluation =
            {
                id: evaluationId,
                name: this.attributes.name.value,
                description: $(this).children('description').text(),
                type: type,
                expression: expression
            };
            Evaluations.container.sequence.push(evaluation);
            Evaluations.container.byId[evaluation.id] = evaluation;
        });
    }

    // Load the metadata of the scenario.
    function loadMetadata(version, metadata)
    {
        Metadata.container.name = $(metadata).children('name').text();
        $('#breadcrumbs .scenarioName span').text(Metadata.container.name);
        Main.updateDocumentTitle();
        Metadata.container.description = $(metadata).children('description').text();

        if (version) Metadata.container.version = version;

        $(metadata).children('authors').children().each(function()
        {
            const author = {};
            author.name = this.attributes.name.value;
            if (this.attributes.email) author.email = this.attributes.email.value;
            author.startDate = this.attributes.startDate.value;
            if (this.attributes.endDate) author.endDate = this.attributes.endDate.value;
            Metadata.container.authors.push(author);
        });

        const languageXML = $(metadata).children('language');
        if (languageXML.length > 0)
        {
            const languageCode = $(languageXML).attr('code');
            if (languageCode in Config.container.settings.languages.byCode)
            {
                Metadata.container.language = { code: languageCode, name: $(languageXML).text() };
            }
        }

        Metadata.container.difficulty = $(metadata).children('difficulty').text();

        Metadata.container.propertyValues = loadPropertyValues($(metadata).children('propertyValues'), ['independent']);
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

        const characterIdRef = $(statement).attr('characteridref');
        let allowInterleaveNode = false;
        let allowInterleaveVal = $(statement).attr('jumpPoint');
        if (allowInterleaveVal !== undefined) allowInterleaveNode = Utils.parseBool(allowInterleaveVal);
        allowInterleaveVal = $(statement).attr('allowInterleave');
        if (allowInterleaveVal !== undefined) allowInterleaveNode = Utils.parseBool(allowInterleaveVal);
        let allowDialogueEndNode = false;
        let allowDialogueEndVal = $(statement).attr('inits');
        if (allowDialogueEndVal !== undefined) allowDialogueEndNode = Utils.parseBool(allowDialogueEndVal);
        allowDialogueEndVal = $(statement).attr('allowDialogueEnd');
        if (allowDialogueEndVal !== undefined) allowDialogueEndNode = Utils.parseBool(allowDialogueEndVal);
        const endNode = Utils.parseBool($(statement).attr('end'));

        const text = $(statement).children('text').text();

        const editingDataXML = $(statement).children('editingData');
        const positionXML = editingDataXML.children('position');
        const xPos = positionXML.children('x').text();
        const yPos = positionXML.children('y').text();
        const comment = editingDataXML.children('comment').text();

        // Load the preconditions of this node.
        const preconditionsXML = $(statement).children("preconditions");
        let preconditions;
        if (preconditionsXML.length === 0)
        {
            preconditions = null;
        }
        else
        {
            preconditions = Condition.fromXML(preconditionsXML.children()[0]);
        }

        const parameterEffects = loadParameterEffects($(statement).children('parameterEffects'), characterIdRef);

        const acceptableScopes = ['per', 'per-' + type];
        if (type === Main.computerType) acceptableScopes.push('per-computer-own');
        const propertyValues = loadPropertyValues($(statement).children('propertyValues'), acceptableScopes, characterIdRef);

        const targets = $(statement).children('responses').children();
        if (targets.length > 0)
        {
            // Save all the connections. We will create the connections when all nodes have been added.
            connections[id] = [];
            for (const target of targets)
            {
                let targetID = target.attributes.idref.value.replace(/\./g, '_');
                if (!/^edit_\d+$/.test(targetID)) targetID = 'ext_' + targetID;
                const connection = { id: targetID };

                const annotationValues = $(target).children('annotationValues');
                if (annotationValues.length > 0)
                {
                    connection.colorValue = ColorPicker.colorFromXML(annotationValues.eq(0));
                }
                connections[id].push(connection);
            }
        }

        const node = Main.createAndReturnNode(type, id, Main.trees[treeID].div, treeID);
        Main.nodes[id] = {
            text: text,
            type: type,
            preconditions: preconditions,
            parameterEffects: parameterEffects,
            propertyValues: propertyValues,
            comment: comment,
            allowDialogueEndNode: allowDialogueEndNode,
            allowInterleaveNode: allowInterleaveNode,
            endNode: endNode,
            id: id,
            parent: treeID
        };

        if (type === Main.computerType) Main.nodes[id].characterIdRef = characterIdRef;

        // Set the position of the node.
        Utils.cssPosition(node, {
            top: yPos,
            left: xPos
        });
    }

    function loadParameterEffects(parameterEffectsXMLElement, characterIdRef)
    {
        const parameterEffects = Config.getNewDefaultParameterEffects(characterIdRef);
        parameterEffectsXMLElement.children('userDefined').children().each(function()
        {
            parameterEffects.userDefined.push(
            {
                idRef: this.attributes.idref.value,
                operator: this.attributes.operator.value,
                value: Parameters.container.byId[this.attributes.idref.value].type.fromXML(this)
            });
        });
        parameterEffectsXMLElement.children('fixed').children().each(function()
        {
            const parameterId = this.attributes.idref.value;
            let effect;
            if (this.attributes.characteridref)
            {
                const characterId = this.attributes.characteridref.value;
                if (characterId in Config.container.characters.byId)
                {
                    if (parameterId in parameterEffects.fixed.perCharacter[characterId].byId)
                    {
                        if (parameterId in Config.container.characters.parameters.byId)
                        {
                            effect =
                            {
                                idRef: parameterId,
                                operator: this.attributes.operator.value,
                                value: Config.container.characters.parameters.byId[parameterId].type.fromXML(this)
                            };
                            parameterEffects.fixed.perCharacter[characterId].sequence.push(effect);
                            parameterEffects.fixed.perCharacter[characterId].byId[parameterId].push(effect);
                        }
                        else if (parameterId in Config.container.characters.byId[characterId].parameters.byId)
                        {
                            effect =
                            {
                                idRef: parameterId,
                                operator: this.attributes.operator.value,
                                value: Config.container.characters.byId[characterId].parameters.byId[parameterId].type.fromXML(this)
                            };
                            parameterEffects.fixed.perCharacter[characterId].sequence.push(effect);
                            parameterEffects.fixed.perCharacter[characterId].byId[parameterId].push(effect);
                        }
                    }
                }
            }
            else if (parameterId in Config.container.parameters.byId)
            {
                if (parameterId in parameterEffects.fixed.characterIndependent.byId)
                {
                    effect =
                    {
                        idRef: parameterId,
                        operator: this.attributes.operator.value,
                        value: Config.container.parameters.byId[parameterId].type.fromXML(this)
                    };
                    parameterEffects.fixed.characterIndependent.sequence.push(effect);
                    parameterEffects.fixed.characterIndependent.byId[parameterId].push(effect);
                }
            }
        });
        return parameterEffects;
    }

    function loadPropertyValues(propertyValuesXMLElement, acceptableScopes, characterIdRef)
    {
        const propertyValues = Config.getNewDefaultPropertyValues(acceptableScopes, characterIdRef);
        propertyValuesXMLElement.children().each(function()
        {
            const propertyId = this.attributes.idref.value;
            let property = null;
            let storage = null;
            if (this.attributes.characteridref)
            {
                const characterId = this.attributes.characteridref.value;
                if (characterId in Config.container.characters.byId)
                {
                    storage = propertyValues.perCharacter[characterId];
                    if (propertyId in Config.container.characters.properties.byId)
                    {
                        property = Config.container.characters.properties.byId[propertyId];
                    }
                    else if (propertyId in Config.container.characters.byId[characterId].properties.byId)
                    {
                        property = Config.container.characters.byId[characterId].properties.byId[propertyId];
                    }
                }
            }
            else if (propertyId in Config.container.properties.byId)
            {
                storage = propertyValues.characterIndependent;
                property = Config.container.properties.byId[propertyId];
            }
            if (property)
            {
                const propertyValue = property.type.fromXML(this);
                storage[propertyId] = propertyValue;
                if (property.type.autoComplete)
                {
                    if (!property.autoCompleteList) property.autoCompleteList = [];
                    property.autoCompleteList.push(propertyValue);
                }
            }
        });
        return propertyValues;
    }
})();
