/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

var Load;

(function()
{
    "use strict";

    Load =
    {
        importScenario: importScenario,
        suspendedly: suspendedly,
        nullIfMissing: nullIfMissing
    };

    var loadedMetaObject;

    $(document).ready(function()
    {
        $("#importScreen").html(Parts.getImportScreenHTML());
        $("#importScenario").on('click', function()
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
                }]
            });
        });

        // At the beginning no XML is loaded, so we need to define a metaObject
        Metadata.getNewDefaultMetaObject();
        loadedMetaObject = Metadata.metaObject;
    });

    /*
     ** Public Functions
     */

    // Creates a graph and metadata from xml file provided by user
    function importScenario()
    {
        var input = document.getElementById("import").files;

        if (input.length < 1)
            return;

        var reader = new FileReader();

        $("#loading").show();
        reader.onload = function()
        {
            var xml;
            try
            {
                xml = $($.parseXML(reader.result));
            }
            catch (err)
            {
                alert(LanguageManager.sLang("edt_load_invalid_xml"));
                return;
            }

            prepareRebuild();

            // Try to find the schemaVersion of the XML and to find the old version
            var schemaVersion = parseInt($('scenario', xml).attr('schemaVersion'));
            var oldVersion = parseInt($($('metadata', xml)[0]).find('version').text());

            // Load with the newest version of the schema
            if (schemaVersion)
            {
                loadMetadata($($('metadata', xml)[0]));
                suspendedly(generateGraph, jsPlumb)(xml);
            }
            // Load versions 2 and 3
            else if (oldVersion)
            {
                Load3.loadMetadata($($('metadata', xml)[0]));
                suspendedly(Load3.generateGraph, jsPlumb)(xml);
            }
            // Load version 1
            else
            {
                Load1.generateGraph(xml);
            }
        };

        reader.readAsText(input[0]);

        //Loading of scenario complete, hide loading div:
        $("#loading").hide();
    }

    // Wraps a function so that it is executed while jsPlumb drawing is suspended.
    function suspendedly(func, plumbInstance)
    {
        return function()
        {
            var args = Array.prototype.slice.call(arguments);
            plumbInstance.doWhileSuspended(function()
            {
                func.apply(this, args);
            });
        };
    }

    /*
     ** Private Functions
     */

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
    function loadMetadata(metadata)
    {
        var name = Main.unEscapeTags($(metadata).find('name').text());
        $('#scenarioNameTab .scenarioName').text(name);
        var description = Main.unEscapeTags($(metadata).find('description').text());
        var difficulty = $(metadata).find('difficulty').text();
        var definitions = $(metadata).find('definitions');

        var defaultChangeType = $(metadata).find('defaultChangeType').text();
        // Allows the editor to load older XML versions without defaultChangeType
        if (defaultChangeType === "")
            defaultChangeType = LanguageManager.sLang("edt_parts_delta");

        var parameters = Metadata.getNewDefaultParametersObject();
        $(definitions).children('parameters').children('userDefined').children().each(function()
        {
            var paramId = this.attributes.id.value;

            var paramMatch = paramId.match(/^p(\d+)$/);
            if (paramMatch !== null)
            {
                var paramNumber = parseInt(paramMatch[1]);
                if (paramNumber > Metadata.parameterCounter)
                    Metadata.parameterCounter = paramNumber;
            }

            var parameter =
            {
                id: paramId,
                name: Main.unEscapeTags(this.attributes.name.value),
                initialValue: (this.hasAttribute('initialValue') ?
                    Utils.parseDecimalIntWithDefault(this.attributes.initialValue.value, 0) : 0),
                weightForFinalScore: 0,
                minimumScore: this.attributes.minimumScore.value,
                maximumScore: this.attributes.maximumScore.value,
                description: this.hasAttribute("description") ? Main.unEscapeTags(this.attributes.description.value) : ""
            };
            parameters.sequence.push(parameter);
            parameters.byId[parameter.id] = parameter;
        });

        var properties = loadProperties($(metadata).children('propertyValues'));

        $(metadata).children('scoringFunction').children('sum').children('scale').children('paramRef').each(function()
        {
            var parameterIdRef = this.attributes.idref.value;
            //if the parameter exists...
            if (parameterIdRef in parameters.byId)
            {
                //...add the weight of the parameter.
                parameters.byId[parameterIdRef].weightForFinalScore =
                    Utils.parseDecimalIntWithDefault($(this).parent().attr('scalar'), 0);

            }
        });

        var timePId = null;
        if (parameters.hasOwnProperty('t'))
            timePId = 't';

        Metadata.metaObject = {
            name: name,
            difficulty: difficulty,
            description: description,
            properties: properties.characterIndependent,
            characters: properties.perCharacter,
            parameters: parameters,
            timePId: timePId,
            defaultChangeType: defaultChangeType
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
        var jumpPoint = $(statement).attr('jumpPoint') == "true";
        var initsNode = $(statement).attr('inits') == "true";
        var endNode = $(statement).attr('end') == "true";

        var text = Main.unEscapeTags($(statement).find('text').text());

        var xPos = $(statement).find('x').text();
        var yPos = $(statement).find('y').text();

        // Load the preconditions of this node.
        var preconditionsXML = $(statement).find("preconditions");
        var preconditionsJS;
        if (preconditionsXML.length === 0)
            preconditionsJS = {type: "alwaysTrue", preconditions: []};
        else
            preconditionsJS = loadPreconditions(preconditionsXML.children()[0]);

        var parameterEffects = [];
        var pEffEl = $(statement).find('parameterEffects');
        var pEffs = pEffEl.children(); //all parameter effects of the node.
        for (var j = 0; j < pEffs.length; j++)
        {
            var parameter = pEffs[j];
            parameterEffects.push(
            {
                idRef: parameter.attributes.idref.value,
                changeType: parameter.attributes.changeType.value,
                value: parseInt(parameter.attributes.value.value)
            });
        }

        var properties = loadProperties($(statement).children('propertyValues'));

        var comment = Main.unEscapeTags($(statement).find('comment').text());

        var targets = $(statement).find('responses').children();
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
            parameters: parameterEffects,
            fixedParameterEffects: {},
            preconditions: preconditionsJS,
            properties: properties.characterIndependent,
            characters: properties.perCharacter,
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
                if (preconditionChildren[i].attributes.idref.value in Metadata.metaObject.parameters.byId)
                {
                    preconditionsArray.push(
                    {
                        idRef: preconditionChildren[i].attributes.idref.value,
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

    function loadProperties(propertiesXMLElement)
    {
        var properties = {};
        var characters = Metadata.getNewDefaultCharactersObject();
        propertiesXMLElement.children().each(function()
        {
            var propertyId = this.attributes.idref.value;
            if (this.attributes.characteridref)
            {
                var characterId = this.attributes.characteridref.value;
                if (characterId in Config.configObject.characters.byId)
                {
                    if (propertyId in Config.configObject.characters.properties.byId)
                    {
                        characters[characterId].properties[propertyId] = Config.configObject.characters.properties.byId[propertyId].type.fromXML(this);
                    }
                    else if (propertyId in Config.configObject.characters.byId[characterId].properties.byId)
                    {
                        characters[characterId].properties[propertyId] = Config.configObject.characters.byId[characterId].properties.byId[propertyId].type.fromXML(this);
                    }
                }
            }
            else if (propertyId in Config.configObject.properties.byId)
            {
                properties[propertyId] = Config.configObject.properties.byId[propertyId].type.fromXML(this);
            }
        });
        return { characterIndependent: properties, perCharacter: characters };
    }

    function nullIfMissing(elements)
    {
        if (elements === undefined || elements.length === 0)
            return null;
        else if (typeof elements == "string")
            return elements;
        else
            return elements.text();
    }
})();

