/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

var Metadata;

(function()
{
    var parameterCounter = 0;

    Metadata =
    {
        metaObject: {},
        getNewDefaultMetaObject: getNewDefaultMetaObject,
        getNewDefaultParametersObject: getNewDefaultParametersObject,
        getNewDefaultPropertyValuesObject: getNewDefaultPropertyValuesObject,
        parameterCounter: parameterCounter,
        parameterDialog: parameterDialog,
        atLeastOneUserDefinedParameter: atLeastOneUserDefinedParameter,
        metadataDialog: metadataDialog,
        timePId : null,
        addTimeParameter: addTimeParameter,
        formatScenarioName: formatScenarioName
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

        var propertyValuesEl = $('#meta-property-values');
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
            showPropertyItem(propertyItem, hStartLevel, propertyValuesEl, propertyValuesEl.attr('id'));
        });
        if (anyPropertyShown) propertyValuesEl.show();

        anyPropertyShown = false;

        characterPropertyValuesEl = $('#meta-character-property-values');
        var characterTabs = $("#character-tabs");
        var characterTabList = $('<ul>');
        characterTabs.append(characterTabList);

        Config.configObject.characters.sequence.forEach(function (character)
        {
            var characterTabId = characterPropertyValuesEl.attr('id') + '-' + character.id;

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
        if (anyPropertyShown) characterPropertyValuesEl.show();
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
            description: "",
            parameters: getNewDefaultParametersObject(),
            propertyValues: getNewDefaultPropertyValuesObject({ statementScope: 'independent'}),
            defaultChangeType: LanguageManager.sLang("edt_parts_delta"),
        };
    }

    function getNewDefaultPropertyValuesObject(scopes)
    {
        var propertyValues = {};

        propertyValues.characterIndependent = {};
        for (var propertyId in Config.configObject.properties.byId)
        {
            if (Config.configObject.properties.byId[propertyId].scopes.statementScope !== scopes.statementScope) continue;
            propertyValues.characterIndependent[propertyId] = Config.configObject.properties.byId[propertyId].type.default;
        }

        propertyValues.perCharacter = {};
        for (var characterId in Config.configObject.characters.byId)
        {
            propertyValues.perCharacter[characterId] = {};
            for (var propertyId in Config.configObject.characters.properties.byId)
            {
                if (Config.configObject.characters.properties.byId[propertyId].scopes.statementScope !== scopes.statementScope) continue;
                propertyValues.perCharacter[characterId][propertyId] = Config.configObject.characters.properties.byId[propertyId].type.default;
            }
            for (var propertyId in Config.configObject.characters.byId[characterId].properties.byId)
            {
                if (Config.configObject.characters.byId[characterId].properties.byId[propertyId].scopes.statementScope !== scopes.statementScope) continue;
                propertyValues.perCharacter[characterId][propertyId] = Config.configObject.characters.byId[characterId].properties.byId[propertyId].type.default;
            }
        }

        return propertyValues;
    }

    // This function returns an object suitable for user-defined parameter definitions
    function getNewDefaultParametersObject()
    {
        var parameters = {};
        parameters.byId = {};
        parameters.sequence = [];
        return parameters;
    }

    //Create the dialog to change the scenario description.
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
        $("#scenarioName").val(Metadata.metaObject.name);
        $("#scenarioDifficulty").val(Metadata.metaObject.difficulty);
        $("#scenarioDescription").val(Metadata.metaObject.description);
        $("#defaultChangeTypeSelect").val(Metadata.metaObject.defaultChangeType);

        var setPropertyInDOM = function(propertyValues, propertyContainerId, property)
        {
            if (property.scopes.statementScope !== "independent") return;
            property.type.setInDOM($(propertyContainerId + '-' + property.id), propertyValues[property.id]);
        };
        for (var propertyId in Config.configObject.properties.byId)
        {
            var property = Config.configObject.properties.byId[propertyId];
            setPropertyInDOM(Metadata.metaObject.propertyValues.characterIndependent, "#meta-property-values-container", property);
        }
        for (var propertyId in Config.configObject.characters.properties.byId)
        {
            for (var characterId in Config.configObject.characters.byId)
            {
                var property = Config.configObject.characters.properties.byId[propertyId];
                setPropertyInDOM(Metadata.metaObject.propertyValues.perCharacter[characterId], "#meta-character-property-values-" + characterId + "-container", property);
            }
        }
        for (var characterId in Config.configObject.characters.byId)
        {
            for (var propertyId in Config.configObject.characters.byId[characterId].properties.byId)
            {
                var property = Config.configObject.characters.byId[characterId].properties.byId[propertyId];
                setPropertyInDOM(Metadata.metaObject.propertyValues.perCharacter[characterId], "#meta-character-property-values-" + characterId + "-container", property);
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

                if (atLeastOneUserDefinedParameter())
                {
                    // The table headers need to be visible in the metascreen the next time.
                    $("#paramsTableHead").removeClass("hidden");
                }
            }
        });

        $("#params").empty();
        $("#paramsTableHead").addClass("hidden");

        Metadata.metaObject.parameters.sequence.forEach(function(parameter)
        {
            var addedDiv = HtmlGenerator.addEmptyUserDefinedParameterDefinition();
            addedDiv.removeClass("newParameter").addClass("existingParameter");

            addedDiv.prop('id', parameter.id);
            if(parameter.id === "t")
            {
                addedDiv.addClass("isT");
                addedDiv.find(".parameter-type-select").val("integer");
                addedDiv.find(".parameter-type-select").prop("disabled", "disabled");
                addedDiv.find(".parameter-initial-value-container").remove();
            }
            addedDiv.find(".name").val(parameter.name);
            addedDiv.find(".parameter-type-select").val(parameter.type.name).change();
            parameter.type.setInDOM(addedDiv.find(".parameter-initial-value-container"), parameter.initialValue);
            addedDiv.find(".description").val(parameter.description);
        });
        if ($("#params").children().length > 0)
            $("#paramsTableHead").removeClass("hidden");

        $("#scenarioDescription").val(Metadata.metaObject.description);
        $("#defaultChangeTypeSelect").val(Metadata.metaObject.defaultChangeType);
    }

    function atLeastOneUserDefinedParameter()
    {
        return Metadata.metaObject.parameters.sequence.length > 0;
    }

    function addTimeParameter(div)
    {
        var newParameter = ObjectGenerator.parameterObject(div);

        if (!newParameter) return;

        Metadata.metaObject.parameters.sequence.push(newParameter);
        Metadata.metaObject.parameters.byId[newParameter.id] = newParameter;

        Metadata.timePId = newParameter.id;

        $(div).removeClass("newParameter").addClass("existingParameter").addClass('isT');

        var timeEffect =
        {
            idRef: newParameter.id,
            type: Config.types["integer"],
            changeType: "delta",
            value: 1
        };

        for (var nodeId in Main.nodes)
        {
            var node = Main.nodes[nodeId];
            if (node.type === Main.playerType)
            {
                if (node.parameterEffects.userDefined !== undefined && node.parameterEffects.userDefined !== null)
                    node.parameterEffects.userDefined.push(timeEffect);
                else
                    node.parameterEffects.userDefined = [timeEffect];
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
                for (var i = 0; i < node.parameterEffects.userDefined.length; i++)
                    if (node.parameterEffects.userDefined[i].idRef === id)
                        node.parameterEffects.userDefined.splice(i, 1);
                removeAllPreconditionsWithParam(id, node.preconditions);
            }

            if (id === Metadata.timePId && Metadata.timePId !== null)
                Metadata.timePId = null;

            // Remove the parameter from the html and the object.
            $(this).remove();

            parameterToBeRemoved = Metadata.metaObject.parameters.byId[id];
            indexOfParameterToBeRemoved = Metadata.metaObject.parameters.sequence.indexOf(parameterToBeRemoved);
            delete Metadata.metaObject.parameters.byId[id];
            delete Metadata.metaObject.parameters.sequence.splice(indexOfParameterToBeRemoved, 1);
        });

        $(".existingParameter").each(function()
        {
            var parameter = ObjectGenerator.parameterObject($(this));
            $.extend(Metadata.metaObject.parameters.byId[parameter.id], parameter);
        });

        // All new parameters.
        $(".newParameter").each(function()
        {
            var id = 'p' + (Metadata.parameterCounter += 1).toString();
            $(this).prop('id', id);
            var newParameter = ObjectGenerator.parameterObject($(this));

            if (!newParameter) return;

            Metadata.metaObject.parameters.sequence.push(newParameter);
            Metadata.metaObject.parameters.byId[newParameter.id] = newParameter;

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
        Metadata.metaObject.name = formatScenarioName($("#scenarioName").val());
        $('#scenarioNameTab .scenarioName').text(Metadata.metaObject.name);

        Metadata.metaObject.difficulty = $("#scenarioDifficulty").val();
        Metadata.metaObject.description = $("#scenarioDescription").val();

        for (var propertyId in Config.configObject.properties.byId)
        {
            var property = Config.configObject.properties.byId[propertyId];
            if (property.scopes.statementScope !== "independent") continue;
            Metadata.metaObject.propertyValues.characterIndependent[property.id] =
                property.type.getFromDOM($("#meta-property-values-container-" + property.id));
        }
        for (var propertyId in Config.configObject.characters.properties.byId)
        {
            for (var characterId in Config.configObject.characters.byId)
            {
                var property = Config.configObject.characters.properties.byId[propertyId];
                if (property.scopes.statementScope !== "independent") continue;
                Metadata.metaObject.propertyValues.perCharacter[characterId][property.id] =
                    property.type.getFromDOM($("#meta-character-property-values-" + characterId + "-container-" + property.id));
            }
        }
        for (var characterId in Config.configObject.characters.byId)
        {
            for (var propertyId in Config.configObject.characters.byId[characterId].properties.byId)
            {
                var property = Config.configObject.characters.byId[characterId].properties.byId[propertyId];
                if (property.scopes.statementScope !== "independent") continue;
                Metadata.metaObject.propertyValues.perCharacter[characterId][property.id] =
                    property.type.getFromDOM($("#meta-character-property-values-" + characterId + "-container-" + property.id));
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

    function formatScenarioName(scenarioName)
    {
        scenarioName = scenarioName.trim().substr(0, 35);
        if (scenarioName !== "")
        {
            return scenarioName;
        }
        else
        {
            return Metadata.metaObject.name;
        }
    }
})();
