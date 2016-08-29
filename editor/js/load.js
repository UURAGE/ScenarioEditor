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

    var loadedMetaObject;

    $(document).ready(function()
    {
        $("#importScreen").html(Parts.getImportScreenHTML());
        $("#importScenario").on('click', function()
        {
            importDialog();
        });

        // At the beginning no XML is loaded, so we need to define a metaObject
        Metadata.getNewDefaultMetaObject();
        loadedMetaObject = Metadata.metaObject;
    });

    function importDialog()
    {
        $("#importScreen").dialog(
        {
            title : LanguageManager.sLang("edt_load_import_title"),
            height: ParameterValues.heightImportScreen,
            width: ParameterValues.widthImportScreen,
            modal: true,
            buttons:
            [{
                text: LanguageManager.sLang("edt_load_import"),
                click: function()
                {
                    importScenario();
                    $("#importScreen").dialog('close');
                }
            },
            {
                text: LanguageManager.sLang("edt_common_close"),
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
                alert(LanguageManager.sLang("edt_load_invalid_xml"));
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
            if (Config.configObject.id !== $(scenarioXML).attr('configidref'))
            {
                alert("The config id does not match the config id referred to in the scenario");
            }

            loadMetadata($(scenarioXML).attr('version'), $(scenarioXML).children('definitions').eq(0), $(scenarioXML).children('metadata').eq(0));
            jsPlumb.batch(function()
            {
                generateGraph(xml);
            });
        }
        // Load versions 2 and 3
        else if (oldVersion)
        {
            Load3.loadMetadata($(scenarioXML).children('metadata').eq(0));
            jsPlumb.batch(function()
            {
                Load3.generateGraph(xml);
            });
        }
        // Load version 1
        else
        {
            Load3.loadMetadata($(scenarioXML).children('metadata').eq(0));
            jsPlumb.batch(function()
            {
                Load1.generateGraph(xml);
            });
        }
    }

    function prepareRebuild()
    {
        Main.selectElement(null);

        if (loadedMetaObject === undefined)
        {
            Metadata.getNewDefaultMetaObject();
            loadedMetaObject = Metadata.metaObject;
        }
        else
        {
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
            Metadata.parameterCounter = 0;
        }
    }

    // Generates the entire graph, including the objects.
    function generateGraph(xml)
    {
        var level = 0;
        $(xml).find('interleave').each(function()
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
        var name = $(metadata).children('name').text();
        $('#scenarioNameTab .scenarioName').text(name);
        var description = $(metadata).children('description').text();
        var difficulty = $(metadata).children('difficulty').text();

        var parameters = Metadata.getNewDefaultParameters();
        $(definitions).children('parameters').children('userDefined').children().each(function()
        {
            var parameterId = this.attributes.id.value;

            var parameterMatch = parameterId.match(/^p(\d+)$/);
            if (parameterMatch !== null)
            {
                var parameterNumber = parseInt(parameterMatch[1]);
                if (parameterNumber > Metadata.parameterCounter)
                    Metadata.parameterCounter = parameterNumber;
            }

            var typeXML = $(this).children('type').children();
            var parameter =
            {
                id: parameterId,
                name: this.attributes.name.value,
                type: Config.types[typeXML[0].nodeName].loadType(typeXML),
                description:$(this).children('description').text()
            };
            parameters.sequence.push(parameter);
            parameters.byId[parameter.id] = parameter;
        });

        var propertyValues = loadPropertyValues($(metadata).children('propertyValues'), ['independent']);

        var timePId = null;
        if (parameters.hasOwnProperty('t'))
            timePId = 't';

        Metadata.metaObject = {
            name: name,
            version: version ? version : null,
            difficulty: difficulty,
            description: description,
            propertyValues: propertyValues,
            parameters: parameters,
            timePId: timePId
        };
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
        var jumpPoint = Utils.parseBool($(statement).attr('jumpPoint'));
        var initsNode = Utils.parseBool($(statement).attr('inits'));
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
            characterIdRef: characterIdRef,
            preconditions: preconditions,
            parameterEffects: parameterEffects,
            propertyValues: propertyValues,
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
        Utils.cssPosition(node, {
            top: yPos,
            left: xPos
        });

        // fill the insides with text
        var txtArea = node.find('textarea.nodestatement');
        var txtView = node.find('.statementText');
        txtArea.val(text);
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
            if (preconditionChildren[i].nodeName == "condition" || preconditionChildren[i].nodeName == "characterCondition")
            {
                var parameterIdRef = preconditionChildren[i].attributes.idref.value;
                var characterIdRef;
                if (preconditionChildren[i].nodeName == "characterCondition" && preconditionChildren[i].attributes.characteridref)
                {
                    characterIdRef = preconditionChildren[i].attributes.characteridref.value;
                }

                var parameter;
                if (characterIdRef)
                {
                    if (parameterIdRef in Config.configObject.characters.parameters.byId)
                    {
                        parameter = Config.configObject.characters.parameters.byId[parameterIdRef];
                    }
                    else
                    {
                        if (parameterIdRef in Config.configObject.characters.byId[characterIdRef].parameters.byId)
                        {
                            parameter = Config.configObject.characters.byId[characterIdRef].parameters.byId[parameterIdRef];
                        }
                    }
                }
                else
                {
                    if (parameterIdRef in Metadata.metaObject.parameters.byId)
                    {
                        parameter = Metadata.metaObject.parameters.byId[parameterIdRef];
                    }
                    else if (parameterIdRef in Config.configObject.parameters.byId)
                    {
                        parameter = Config.configObject.parameters.byId[parameterIdRef];
                    }
                }

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
                value: Metadata.metaObject.parameters.byId[this.attributes.idref.value].type.fromXML(this)
            });
        });
        parameterEffectsXMLElement.children('fixed').children().each(function()
        {
            var parameterId = this.attributes.idref.value;
            if (this.attributes.characteridref)
            {
                var characterId = this.attributes.characteridref.value;
                if (characterId in Config.configObject.characters.byId)
                {
                    if (parameterId in parameterEffects.fixed.perCharacter[characterId])
                    {
                        if (parameterId in Config.configObject.characters.parameters.byId)
                        {
                            parameterEffects.fixed.perCharacter[characterId][parameterId].push(
                            {
                                idRef: parameterId,
                                operator: this.attributes.operator.value,
                                value: Config.configObject.characters.parameters.byId[parameterId].type.fromXML(this)
                            });
                        }
                        else if (parameterId in Config.configObject.characters.byId[characterId].parameters.byId)
                        {
                            parameterEffects.fixed.perCharacter[characterId][parameterId].push(
                            {
                                idRef: parameterId,
                                operator: this.attributes.operator.value,
                                value: Config.configObject.characters.byId[characterId].parameters.byId[parameterId].type.fromXML(this)
                            });
                        }
                    }
                }
            }
            else if (parameterId in Config.configObject.parameters.byId)
            {
                if (parameterId in parameterEffects.fixed.characterIndependent)
                {
                    parameterEffects.fixed.characterIndependent[parameterId].push(
                    {
                        idRef: parameterId,
                        operator: this.attributes.operator.value,
                        value: Config.configObject.parameters.byId[parameterId].type.fromXML(this)
                    });
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
            if (this.attributes.characteridref)
            {
                var characterId = this.attributes.characteridref.value;
                if (characterId in Config.configObject.characters.byId)
                {
                    if (propertyId in Config.configObject.characters.properties.byId)
                    {
                        propertyValues.perCharacter[characterId][propertyId] = Config.configObject.characters.properties.byId[propertyId].type.fromXML(this);
                    }
                    else if (propertyId in Config.configObject.characters.byId[characterId].properties.byId)
                    {
                        propertyValues.perCharacter[characterId][propertyId] = Config.configObject.characters.byId[characterId].properties.byId[propertyId].type.fromXML(this);
                    }
                }
            }
            else if (propertyId in Config.configObject.properties.byId)
            {
                propertyValues.characterIndependent[propertyId] = Config.configObject.properties.byId[propertyId].type.fromXML(this);
            }
        });
        return propertyValues;
    }
})();

