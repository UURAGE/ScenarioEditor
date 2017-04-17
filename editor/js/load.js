/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

var Load;

(function()
{
    "use strict";

    Load =
    {
        importDialog: importDialog,
        importScenario: importScenario
    };

    $(document).ready(function()
    {
        $("#importScreen").html(Parts.getImportScreenHTML());
        $("#importScenario").on('click', function()
        {
            importDialog();
        });
    });

    function importDialog()
    {
        $("#importScreen").dialog(
        {
            title : i18next.t('load:import_title'),
            height: Constants.heightImportScreen,
            width: Constants.widthImportScreen,
            modal: true,
            buttons:
            [{
                text: i18next.t('load:import'),
                click: function()
                {
                    importScenario();
                    $("#importScreen").dialog('close');
                }
            },
            {
                text: i18next.t('common:close'),
                click: function()
                {
                    $("#importScreen").dialog('close');
                }
            }],
            close: function()
            {
                $("#main").focus();
            }
        });
    }

    // Creates a graph and metadata from xml file provided by user
    function importScenario()
    {
        var input = document.getElementById("import").files;

        if (input.length < 1)
            return;

        var reader = new FileReader();

        reader.onload = function()
        {
            var xml;
            try
            {
                xml = $.parseXML(reader.result);
            }
            catch (err)
            {
                alert(i18next.t('load:invalid_xml'));
                return;
            }

            loadScenario(xml);
        };

        reader.readAsText(input[0]);
    }

    function loadScenario(xml)
    {
        prepareRebuild();

        var scenarioXML = xml.documentElement;

        // Try to find the schemaVersion of the XML and to find the old version
        var schemaVersion = parseInt($(scenarioXML).attr('schemaVersion'));
        var oldVersion = parseInt($(scenarioXML).children('metadata').eq(0).children('version').text());

        // Load with the newest version of the schema
        if (schemaVersion)
        {
            if (Config.container.id !== $(scenarioXML).attr('configidref'))
            {
                alert("The config id does not match the config id referred to in the scenario");
            }

            loadMetadata($(scenarioXML).attr('version'), $(scenarioXML).children('definitions').eq(0), $(scenarioXML).children('metadata').eq(0));
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
    }

    function prepareRebuild()
    {
        Main.selectElement(null);

        if(Main.nodes.length !== 0)
        {
            $.each(Main.trees, function(id, tree)
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
    }

    // Generates the entire graph, including the objects.
    function generateGraph(xml)
    {
        var level = 0;
        $(xml).children('sequence').children('interleave').each(function()
        {
            $(this).children('dialogue').each(function()
            {
                var connections = {};

                var treeID = this.getAttribute('id').replace(/\./g, '_');
                var idMatch = treeID.match(/^dialogue(\d+)$/);
                if (idMatch)
                {
                    Main.maxTreeNumber = Math.max(parseInt(idMatch[1]) + 1, Main.maxTreeNumber);
                }
                else
                {
                    treeID = "ext_" + treeID;
                }

                // get the position from the XML, note that this is in grid coordinates, not screen coordinates
                var position = $(this).children('editingData').children('position')[0];
                var leftPos = Math.round(Utils.parseDecimalIntWithDefault($(position).children('x')[0].textContent, 0));
                var topPos  = Math.round(Utils.parseDecimalIntWithDefault($(position).children('y')[0].textContent, 0));

                var tree = Main.createEmptyTree(treeID, leftPos, topPos);
                var plumbInstance = tree.plumbInstance;

                tree.subject = $(this).children('subject')[0].textContent;

                tree.optional = Utils.parseBool($(this).attr('optional'));

                $(tree.dragDiv).toggleClass('optional', tree.optional);

                tree.level = level;

                tree.dragDiv.find('.subjectName').text(tree.subject); // set subject in HTML
                tree.dragDiv.find('.subjectNameInput').val(tree.subject); // set subject in HTML

                tree.dragDiv.css('border-color', '');

                $(this).children('statements').children().each(function()
                { // parse the tree in the container
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

    // Load the metadata of the scenario.
    function loadMetadata(version, definitions, metadata)
    {
        Metadata.container.name = $(metadata).children('name').text();
        $('#scenarioNameTab .scenarioName').text(Metadata.container.name);
        Metadata.container.description = $(metadata).children('description').text();

        if (version) Metadata.container.version = version;

        $(metadata).children('authors').children().each(function()
        {
            var author = {};
            author.name = this.attributes.name.value;
            if (this.attributes.email) author.email = this.attributes.email.value;
            author.startDate = this.attributes.startDate.value;
            if (this.attributes.endDate) author.endDate = this.attributes.endDate.value;
            Metadata.container.authors.push(author);
        });

        var languageXML = $(metadata).children('language');
        if (languageXML.length > 0)
        {
            var languageCode = $(languageXML).attr('code');
            if (languageCode in Config.container.settings.languages.byCode)
            {
                Metadata.container.language = { code: languageCode, name: $(languageXML).text() };
            }
        }

        Metadata.container.difficulty = $(metadata).children('difficulty').text();

        var parameters = Parameters.container;
        $(definitions).children('parameters').children('userDefined').children().each(function()
        {
            var parameterId = this.attributes.id.value;

            var parameterMatch = parameterId.match(/^p(\d+)$/);
            if (parameterMatch !== null)
            {
                var parameterNumber = parseInt(parameterMatch[1]);
                if (parameterNumber > Parameters.counter)
                    Parameters.counter = parameterNumber;
            }

            var typeXML = $(this).children('type').children();
            var parameter =
            {
                id: parameterId,
                name: this.attributes.name.value,
                type: Types.primitives[typeXML[0].nodeName].loadType(typeXML, parameterId, 'parameter'),
                description: $(this).children('description').text()
            };
            parameters.sequence.push(parameter);
            parameters.byId[parameter.id] = parameter;
        });

        if ('t' in parameters.byId) Parameters.timeId = 't';

        Metadata.container.propertyValues = loadPropertyValues($(metadata).children('propertyValues'), ['independent']);
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

        var characterIdRef = $(statement).attr('characteridref');
        var allowInterleaveNode = false;
        var allowInterleaveVal = $(statement).attr('jumpPoint');
        if (allowInterleaveVal !== undefined) allowInterleaveNode = Utils.parseBool(allowInterleaveVal);
        allowInterleaveVal = $(statement).attr('allowInterleave');
        if (allowInterleaveVal !== undefined) allowInterleaveNode = Utils.parseBool(allowInterleaveVal);
        var allowDialogueEndNode = false;
        var allowDialogueEndVal = $(statement).attr('inits');
        if (allowDialogueEndVal !== undefined) allowDialogueEndNode = Utils.parseBool(allowDialogueEndVal);
        allowDialogueEndVal = $(statement).attr('allowDialogueEnd');
        if (allowDialogueEndVal !== undefined) allowDialogueEndNode = Utils.parseBool(allowDialogueEndVal);
        var endNode = Utils.parseBool($(statement).attr('end'));

        var text = $(statement).children('text').text();

        var editingDataXML = $(statement).children('editingData');
        var positionXML = editingDataXML.children('position');
        var xPos = positionXML.children('x').text();
        var yPos = positionXML.children('y').text();
        var comment = editingDataXML.children('comment').text();

        // Load the preconditions of this node.
        var preconditionsXML = $(statement).children("preconditions");
        var preconditions;
        if (preconditionsXML.length === 0)
            preconditions = {type: "alwaysTrue", preconditions: []};
        else
            preconditions = loadPreconditions(preconditionsXML.children()[0]);

        var parameterEffects = loadParameterEffects($(statement).children('parameterEffects'), characterIdRef);

        var acceptableScopes = ['per', 'per-' + type];
        if (type === Main.computerType) acceptableScopes.push('per-computer-own');
        var propertyValues = loadPropertyValues($(statement).children('propertyValues'), acceptableScopes, characterIdRef);

        var targets = $(statement).children('responses').children();
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
    }

    // Load all preconditions from a given precondition element tree.
    function loadPreconditions(preconditionXMLElement)
    {
        var preconditionType = preconditionXMLElement.nodeName;
        var preconditionsArray = [];

        var preconditionChildren = $(preconditionXMLElement).children();
        for (var i = 0; i < preconditionChildren.length; i++)
        {
            if (preconditionChildren[i].nodeName == "condition" || preconditionChildren[i].nodeName == "characterCondition")
            {
                var parameterIdRef = preconditionChildren[i].attributes.idref.value;
                var characterIdRef;
                if (preconditionChildren[i].nodeName == "characterCondition" && preconditionChildren[i].attributes.characteridref)
                {
                    characterIdRef = preconditionChildren[i].attributes.characteridref.value;
                }

                var parameter = Config.findParameterById(parameterIdRef, characterIdRef);
                if (!parameter) parameter = Parameters.container.byId[parameterIdRef];

                if (parameter)
                {
                    var precondition = {
                        idRef: parameterIdRef,
                        operator: preconditionChildren[i].attributes.operator.value,
                        value: parameter.type.fromXML(preconditionChildren[i])
                    };
                    if (characterIdRef) precondition.characterIdRef = characterIdRef;
                    preconditionsArray.push(precondition);
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

    function loadParameterEffects(parameterEffectsXMLElement, characterIdRef)
    {
        var parameterEffects = Config.getNewDefaultParameterEffects(characterIdRef);
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
            var parameterId = this.attributes.idref.value;
            var effect;
            if (this.attributes.characteridref)
            {
                var characterId = this.attributes.characteridref.value;
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
        var propertyValues = Config.getNewDefaultPropertyValues(acceptableScopes, characterIdRef);
        propertyValuesXMLElement.children().each(function()
        {
            var propertyId = this.attributes.idref.value;
            var property = null;
            var storage = null;
            if (this.attributes.characteridref)
            {
                var characterId = this.attributes.characteridref.value;
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
                var propertyValue = property.type.fromXML(this);
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

