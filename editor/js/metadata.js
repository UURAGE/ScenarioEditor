/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

var Metadata;

(function()
{
    var parameterCounter = 0;

    Metadata =
    {
        metaObject: {},
        getNewDefaultMetaObject: getNewDefaultMetaObject,
        getNewDefaultCharactersObject: getNewDefaultCharactersObject,
        parameterCounter: parameterCounter,
        parameterDialog: parameterDialog,
        atLeastOneParameter: atLeastOneParameter,
        metadataDialog: metadataDialog,
        timePId : null,
        addTimeParameter: addTimeParameter,
        formatScriptName: formatScriptName
    };

    $(document).ready(function()
    {
        // Event handlers.
        $("#editMetadata").on('click', metadataDialog);
        $("#editParameters").on('click', parameterDialog);

        var metaScreenHTML = Parts.getMetaScreenHTML();
        $("#metaScreen").html(metaScreenHTML);
        $("#metaForm").on('submit', function()
        {
            saveMetaObject();
            return false;
        });

        var parameterScreenHTML = Parts.getParameterScreenHTML();
        $("#parameterScreen").html(parameterScreenHTML);

        $("#params").on("focus", ".description", function()
        {
            $(this).animate({ height: "10em" }, 500);
        });
        $("#params").on("focusout", ".description", function()
        {
            $(this).animate({height:"1em"}, 500);
        });

        $("#params").on('click', '.deleteParent', function()
        {
            var tr = $(this).closest('tr');
            tr.addClass("toBeRemoved");
            // console.log("removed parameter with id:\t"+tr[0].id);
            if(tr[0].id === "t" && tr.not(".toBeRemoved"))
            {
                // for time parameter: make visible when Time-parameter has been removed
                $("#addTimeParameter").removeClass("hidden");
            }
            if ($("#params").children().not(".toBeRemoved").length === 0)
                $("#paramsTableHead").addClass("hidden");
        });

        var anyPropertyShown = false;
        var hStartLevel = 4;

        var propertiesEl = $('#meta-properties');
        var showPropertyItem = function (propertyItem, hLevel, container, idPrefix)
        {
            if (propertyItem.scopes.statementScope !== 'independent') return;
            if (propertyItem.kind === 'section')
            {
                propertyItem.sequence.forEach(function (subItem)
                {
                    var headerContainer = $('<div>');
                    headerContainer.append($('<h' + hLevel + '>', { text: propertyItem.name }));
                    container.append(headerContainer);
                    showPropertyItem(subItem, hLevel + 1, container, idPrefix);
                });
            }
            else
            {
                var controlHtmlId = idPrefix + '-' + propertyItem.id;

                var propertyContainer = $('<div>', { id: idPrefix + '-container-' + propertyItem.id });
                container.append(propertyContainer);
                propertyContainer.append($('<label>', { text: propertyItem.name + ':', 'for': controlHtmlId }));
                propertyItem.type.appendControlTo(propertyContainer, controlHtmlId);
                anyPropertyShown = true;
            }
        };
        Config.configObject.properties.sequence.forEach(function (propertyItem)
        {
            showPropertyItem(propertyItem, hStartLevel, propertiesEl, propertiesEl.attr('id'));
        });
        if (anyPropertyShown) propertiesEl.show();

        anyPropertyShown = false;

        characterPropertiesEl = $('#meta-character-properties');
        var characterTabs = $("#character-tabs");
        var characterTabList = $('<ul>');
        characterTabs.append(characterTabList);

        Config.configObject.characters.sequence.forEach(function (character)
        {
            var characterTabId = characterPropertiesEl.attr('id') + '-' + character.id;

            // Make a character tab with a link to the div it contains
            var li = $('<li>').append($('<a>', { href:'#' + characterTabId, text: character.id }));
            characterTabList.append(li);

            var characterTabDiv = $('<div>', { id: characterTabId });
            characterTabs.append(characterTabDiv);

            Config.configObject.characters.properties.sequence.forEach(function(propertyItem)
            {
                showPropertyItem(propertyItem, hStartLevel, characterTabDiv, characterTabId);
            });

            Config.configObject.characters.byId[character.id].properties.sequence.forEach(function(propertyItem)
            {
                showPropertyItem(propertyItem, hStartLevel, characterTabDiv, characterTabId);
            });
        });

        characterTabs.tabs(
        {
            active: false,
            collapsible: true
        });
        if (anyPropertyShown) characterPropertiesEl.show();
    });

    /*
     ** Public Functions
     */

    // Creates and returns a new default meta object containing sensible defaults.
    // If needed, change the defaults here.
    function getNewDefaultMetaObject()
    {
        Metadata.parameterCounter = 0;
        Metadata.metaObject = {
            name: "",
            difficulty: "medium",
            characters: getNewDefaultCharactersObject(),
            description: "",
            properties: {},
            parameters: {},
            defaultChangeType: LanguageManager.sLang("edt_parts_delta"),
        };
    }

    function getNewDefaultCharactersObject()
    {
        var characters = {};
        for (var characterId in Config.configObject.characters.byId)
        {
            characters[characterId] = {};
            characters[characterId].properties = {};
        }
        return characters;
    }

    //Create the dialog to change the script description.
    function metadataDialog()
    {
        Main.selectNode(null);

        $("#metaScreen").dialog(
        {
            title: LanguageManager.sLang("edt_metadata_title"),
            height: ParameterValues.heightMetaScreen,
            width: ParameterValues.widthMetaScreen,
            modal: true,
            buttons: [
            {
                text: LanguageManager.sLang("edt_common_confirm"),
                click: function()
                {
                    saveMetaObject();
                }
            },
            {
                text: LanguageManager.sLang("edt_common_cancel"),
                click: function()
                {
                    $("#metaScreen").dialog('close');
                }
            }],
            close: function()
            {
                $("#main").focus();
            }
        });

        // Show the stored values for the metadata.
        $("#scriptName").val(Metadata.metaObject.name);
        $("#scriptDifficulty").val(Metadata.metaObject.difficulty);
        $("#scriptDescription").val(Metadata.metaObject.description);
        $("#defaultChangeTypeSelect").val(Metadata.metaObject.defaultChangeType);

        var setPropertyInDOM = function(propertiesObject, propertyContainerId, property)
        {
            if (property.scopes.statementScope !== "independent") return;
            if (property.id in propertiesObject)
            {
                property.type.setInDOM($(propertyContainerId + '-' + property.id),
                    propertiesObject[property.id]);
            }
        };
        for (var propertyId in Config.configObject.properties.byId)
        {
            var property = Config.configObject.properties.byId[propertyId];
            setPropertyInDOM(Metadata.metaObject.properties, "#meta-properties-container", property);
        }
        for (var propertyId in Config.configObject.characters.properties.byId)
        {
            for (var characterId in Config.configObject.characters.byId)
            {
                var property = Config.configObject.characters.properties.byId[propertyId];
                setPropertyInDOM(Metadata.metaObject.characters[characterId].properties, "#meta-character-properties-" + characterId + "-container", property);
            }
        }
        for (var characterId in Config.configObject.characters.byId)
        {
            for (var propertyId in Config.configObject.characters.byId[characterId].properties.byId)
            {
                var property = Config.configObject.characters.byId[characterId].properties.byId[propertyId];
                setPropertyInDOM(Metadata.metaObject.characters[characterId].properties, "#meta-character-properties-" + characterId + "-container", property);
            }
        }
    }

    function parameterDialog()
    {
        Main.selectNode(null);

        //console.log('timePId:\t'+Metadata.timePId);
        if (Metadata.timePId !== null )
        {
            $("#addTimeParameter").addClass("hidden");
        }

        $("#parameterScreen").dialog(
        {
            title: LanguageManager.sLang("edt_metadata_parameters_title"),
            height: ParameterValues.heightParameterScreen,
            width: ParameterValues.widthParameterScreen,
            modal: true,
            buttons: [
            {
                text: LanguageManager.sLang("edt_metadata_parameters_to_feedback"),
                click: function()
                {
                    saveParameters();
                    $(this).dialog('close');
                    FeedbackForm.feedbackFormDialog();
                }
            },
            {
                text: LanguageManager.sLang("edt_common_confirm"),
                click: function()
                {
                    saveParameters();
                    $(this).dialog('close');
                }
            },
            {
                text: LanguageManager.sLang("edt_common_cancel"),
                click: function()
                {
                    $(this).dialog('close');
                }
            }],
            close: function()
            {
                $(".toBeRemoved").removeClass("toBeRemoved");
                $(".newParameter").remove();
                //Ugly test to determine if there are parameters. If there are, the table headers need to be visible in the metascreen the next time.
                if (atLeastOneParameter())
                {
                    $("#paramsTableHead").removeClass("hidden");
                }
            }
        });

        $("#params").empty();
        $("#paramsTableHead").addClass("hidden");

        for (var pId in Metadata.metaObject.parameters)
        {
            var parameter = Metadata.metaObject.parameters[pId];
            var addedDiv = $("#params").append(HtmlGenerator.parameterHTML).children().last();
            addedDiv.removeClass("newParameter").addClass("existingParameter");

            addedDiv.prop('id', pId);
            if(pId === "t")
                addedDiv.addClass("isT");
            addedDiv.find(".name").val(parameter.name);
            addedDiv.find(".initialValue").val(parameter.initialValue);
            addedDiv.find(".weightForFinalScore").val(parameter.weightForFinalScore);
            addedDiv.find(".minimumScore").val(parameter.minimumScore);
            addedDiv.find(".maximumScore").val(parameter.maximumScore);
            addedDiv.find(".description").val(parameter.description);
        }
        if ($("#params").children().length > 0)
            $("#paramsTableHead").removeClass("hidden");

        $("#scriptDescription").val(Metadata.metaObject.description);
        $("#defaultChangeTypeSelect").val(Metadata.metaObject.defaultChangeType);
    }

    function atLeastOneParameter()
    {
        return (!$.isEmptyObject(Metadata.metaObject.parameters));
    }

    function addTimeParameter(div)
    {
        var newParameter = ObjectGenerator.parameterObject(div);

        if (!newParameter) return;

        var id = 't';
        $(div).prop('id', id);
        Metadata.metaObject.parameters[id] = newParameter;

        Metadata.timePId = id;

        $(div).removeClass("newParameter").addClass("existingParameter").addClass('isT');

        var timeEffect =
        {
            idRef: id,
            changeType: "delta",
            value: 1
        };

        for (var nodeId in Main.nodes)
        {
            var node = Main.nodes[nodeId];
            if (node.type === Main.playerType)
            {
                if (node.parameters !== undefined && node.parameters !== null)
                    node.parameters.push(timeEffect);
                else
                    node.parameters = [timeEffect];
            }
        }
    }

    /*
     ** Private Functions
     */

    function saveParameters()
    {
        Main.unsavedChanges = true;

        $(".toBeRemoved").each(function()
        {
            var id = $(this).prop('id');

            // Remove the preconditions and effects for every node with this parameter.
            for (var nodeID in Main.nodes)
            {
                var node = Main.nodes[nodeID];
                for (var i = 0; i < node.parameters.length; i++)
                    if (node.parameters[i].idRef === id)
                        node.parameters.splice(i, 1);
                removeAllPreconditionsWithParam(id, node.preconditions);
            }

            delete FeedbackForm.conditions[id];

            if (id === Metadata.timePId && Metadata.timePId !== null)
                Metadata.timePId = null;

            // Remove the parameter from the html and the object.
            $(this).remove();

            delete Metadata.metaObject.parameters[id];
        });

        $(".existingParameter").each(function()
        {
            var id = $(this).prop('id');
            var newParameters = ObjectGenerator.parameterObject($(this));

            Metadata.metaObject.parameters[id] = newParameters;
        });

        // All new parameters.
        $(".newParameter").each(function()
        {
            var newParameters = ObjectGenerator.parameterObject($(this));

            if (newParameters === null) return;

            var id = 'p' + (Metadata.parameterCounter += 1).toString();

            $(this).prop('id', id);
            Metadata.metaObject.parameters[id] = newParameters;

            $(this).removeClass("newParameter").addClass("existingParameter");
        });

        //console.log(Metadata.metaObject.parameters);
    }

    // Save all changes to the metaObject.
    function saveMetaObject()
    {
        Main.unsavedChanges = true;

        // All parameters that should be removed.
        var previouslySelectedNode = Main.selectedElement;
        Main.selectNode(null);

        Metadata.metaObject.defaultChangeType = $("#defaultChangeTypeSelect").val();

        // Save all values in the dialog to the metaObject
        Metadata.metaObject.name = formatScriptName($("#scriptName").val());
        $('#scriptNameTab .scriptName').text(Metadata.metaObject.name);

        Metadata.metaObject.difficulty = $("#scriptDifficulty").val();
        Metadata.metaObject.description = $("#scriptDescription").val();

        for (var propertyId in Config.configObject.properties.byId)
        {
            var property = Config.configObject.properties.byId[propertyId];
            if (property.scopes.statementScope !== "independent") continue;
            Metadata.metaObject.properties[property.id] =
                property.type.getFromDOM($("#meta-properties-container-" + property.id));
        }
        for (var propertyId in Config.configObject.characters.properties.byId)
        {
            for (var characterId in Config.configObject.characters.byId)
            {
                var property = Config.configObject.characters.properties.byId[propertyId];
                if (property.scopes.statementScope !== "independent") continue;
                Metadata.metaObject.characters[characterId].properties[property.id] =
                    property.type.getFromDOM($("#meta-character-properties-" + characterId + "-container-" + property.id));
            }
        }
        for (var characterId in Config.configObject.characters.byId)
        {
            for (var propertyId in Config.configObject.characters.byId[characterId].properties.byId)
            {
                var property = Config.configObject.characters.byId[characterId].properties.byId[propertyId];
                if (property.scopes.statementScope !== "independent") continue;
                Metadata.metaObject.characters[characterId].properties[property.id] =
                    property.type.getFromDOM($("#meta-character-properties-" + characterId + "-container-" + property.id));
            }
        }

        $("#metaScreen").dialog('close');
        Main.selectNode(previouslySelectedNode);
    }

    function removeAllPreconditionsWithParam(paramIdToRemove, precondition)
    {
        for (var i = 0; i < precondition.preconditions.length; i++)
        {
            var currentPrecondition = precondition.preconditions[i];
            if ("type" in currentPrecondition)
            {
                removeAllPreconditionsWithParam(paramIdToRemove,
                    currentPrecondition);
                if (currentPrecondition.preconditions.length === 0)
                {
                    precondition.preconditions.splice(i, 1);
                    i--;
                }
            }
            else
            {
                if (currentPrecondition.idRef === paramIdToRemove)
                {
                    precondition.preconditions.splice(i, 1);
                    i--;
                }
            }
        }
    }

    function formatScriptName(scriptName)
    {
        scriptName = scriptName.trim().substr(0, 35);
        if (scriptName !== "")
        {
            return scriptName;
        }
        else
        {
            return Metadata.metaObject.name;
        }
    }
})();
