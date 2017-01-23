/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

var Metadata;

(function()
{
    "use strict";

    var parameterCounter = 0;

    Metadata =
    {
        metaObject: {},
        reset: reset,
        getNewDefaultParameters: getNewDefaultParameters,
        parameterCounter: parameterCounter,
        parameterDialog: parameterDialog,
        atLeastOneUserDefinedParameter: atLeastOneUserDefinedParameter,
        metadataDialog: metadataDialog,
        timePId : null,
        addTimeParameter: addTimeParameter,
        formatScenarioName: formatScenarioName,
        addOrExtendAuthor: addOrExtendAuthor
    };

    $(document).ready(function()
    {
        // Event handlers.
        $("#editMetadata").on('click', metadataDialog);
        $("#editParameters").on('click', parameterDialog);

        var metaScreenHTML = Parts.getMetaScreenHTML();
        $("#metaScreen").html(metaScreenHTML);

        var scenarioDescription = $("#scenarioDescription");
        scenarioDescription.attr('maxlength', Config.configObject.settings.description.type.maxLength);
        if (Config.configObject.settings.description.type.markdown) Utils.attachMarkdownTooltip(scenarioDescription);

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
            tr.addClass("removedParameter");
            if(tr[0].id === "t" && tr.not(".removedParameter"))
            {
                // for time parameter: make visible when Time-parameter has been removed
                $("#addTimeParameter").removeClass("hidden");
            }
            if ($("#params").children().not(".removedParameter").length === 0)
                $("#paramsTableHead").addClass("hidden");
        });

        var anyPropertyShown = false;
        var hStartLevel = 3;

        var propertyValuesEl = $('#meta-property-values');
        var showPropertyItem = function (propertyItem, hLevel, tableBody, idPrefix)
        {
            if (propertyItem.scopes.statementScope !== 'independent') return;
            if (propertyItem.kind === 'section')
            {
                var sectionTable = $('<table>');

                var sectionTableHeader = $('<thead>').append($('<th colspan="2">').append($('<h' + hLevel + '>', { text: propertyItem.name })));
                sectionTable.append(sectionTableHeader);

                var sectionTableBody = $('<tbody>');
                sectionTable.append(sectionTableBody);

                var sectionContainer = $('<div>').append(sectionTable);
                if (hLevel !== hStartLevel) sectionContainer.addClass("subsection");
                tableBody.append($('<tr>').append($('<td colspan="2">').append(sectionContainer)));

                propertyItem.sequence.forEach(function (subItem)
                {
                     showPropertyItem(subItem, hLevel + 1, sectionTableBody, idPrefix);
                });
            }
            else
            {
                var propertyRow = $('<tr>');

                var propertyHeader = $('<th>');
                var controlHtmlId = idPrefix + '-' + propertyItem.id;
                propertyHeader.append($('<label>', { text: propertyItem.name + (propertyItem.type.controlFirst ? '' : ':'), 'for': controlHtmlId }));
                propertyRow.append(propertyHeader);

                var propertyData = $('<td>', { id: idPrefix + '-container-' + propertyItem.id });
                propertyItem.type.appendControlTo(propertyData, controlHtmlId);
                if (propertyItem.type.controlFirst)
                {
                    propertyRow.prepend(propertyData);
                }
                else
                {
                    propertyRow.append(propertyData);
                }

                tableBody.append(propertyRow);

                anyPropertyShown = true;
            }
        };
        Config.configObject.properties.sequence.forEach(function (propertyItem)
        {
            showPropertyItem(propertyItem, hStartLevel, propertyValuesEl, propertyValuesEl.attr('id'));
        });
        if (anyPropertyShown) propertyValuesEl.show();

        anyPropertyShown = false;

        var characterPropertyValuesEl = $('#meta-character-property-values');
        var characterTabs = $("#character-tabs");
        var characterList = Config.configObject.characters.sequence.length > 1 ? $('<ul>') : $('<div>');
        characterTabs.append(characterList);

        Config.configObject.characters.sequence.forEach(function (character)
        {
            var characterTabId = characterPropertyValuesEl.attr('id') + '-' + character.id;

            var characterHeaderText = character.name ? character.name : character.id;

            if (Config.configObject.characters.sequence.length > 1)
            {
                // Make a character tab with a link to the div it contains
                var li = $('<li>').append($('<a>', { href:'#' + characterTabId, value: character.id, text: characterHeaderText }));
                characterList.append(li);
            }
            else
            {
                var characterHeader = $('<h4>', { text: characterHeaderText });
                characterList.append(characterHeader);
            }

            var characterTab = $('<table>', { id: characterTabId });
            characterTabs.append(characterTab);

            Config.configObject.characters.properties.sequence.forEach(function(propertyItem)
            {
                showPropertyItem(propertyItem, hStartLevel, characterTab, characterTabId);
            });

            Config.configObject.characters.byId[character.id].properties.sequence.forEach(function(propertyItem)
            {
                showPropertyItem(propertyItem, hStartLevel, characterTab, characterTabId);
            });
        });

        if (Config.configObject.characters.sequence.length > 1)
        {
            characterTabs.tabs(
            {
                active: 0,
                collapsible: true
            });
        }
        if (anyPropertyShown) characterPropertyValuesEl.show();
    });

    // Resets the metadata to the default
    function reset()
    {
        Metadata.parameterCounter = 0;
        Metadata.metaObject = {
            name: "",
            version: 0,
            difficulty: "medium",
            description: Config.configObject.settings.description.type.defaultValue,
            authors: [],
            parameters: getNewDefaultParameters(),
            propertyValues: Config.getNewDefaultPropertyValues(['independent'])
        };

        if (Config.configObject.settings.languages.sequence.length > 0)
        {
            Metadata.metaObject.language = Config.configObject.settings.languages.sequence[0];
        }
    }

    // This function returns an object suitable for user-defined parameter definitions
    function getNewDefaultParameters()
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
            title: i18next.t('metadata:properties_title'),
            height: ParameterValues.heightMetaScreen,
            width: ParameterValues.widthMetaScreen,
            modal: true,
            buttons: [
            {
                text: i18next.t('common:confirm'),
                click: function()
                {
                    saveMetaObject();
                }
            },
            {
                text: i18next.t('common:cancel'),
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
        if (Metadata.metaObject.language) $("#scenarioLanguage").val(Metadata.metaObject.language.code).change();
        $("#scenarioDifficulty").val(Metadata.metaObject.difficulty);
        $("#scenarioDescription").val(Metadata.metaObject.description);

        var authorsHeaderEl = $("#authors-header");
        var authorsEl = $("#authors");
        authorsEl.find("tr").not("tr:first").remove();
        if (Metadata.metaObject.authors.length > 0)
        {
            authorsHeaderEl.show();
            authorsEl.show();
            Metadata.metaObject.authors.forEach(function(author)
            {
                var authorRow = $('<tr>');
                authorRow.append($('<td>', { text: author.name }));
                authorRow.append($('<td>', { text: author.email ? author.email : "" }));
                authorRow.append($('<td>', { text: author.startDate }));
                authorRow.append($('<td>', { text: author.endDate ? author.endDate : "" }));
                authorsEl.append(authorRow);
            });
        }
        else
        {
            authorsHeaderEl.hide();
            authorsEl.hide();
        }

        var setPropertyInDOM = function(propertyValues, propertyContainerId, property)
        {
            if (property.scopes.statementScope !== "independent") return;
            property.type.setInDOM($(propertyContainerId + '-' + Utils.escapeSelector(property.id)), propertyValues[property.id]);
        };
        var propertyId, characterId, property;
        for (propertyId in Config.configObject.properties.byId)
        {
            property = Config.configObject.properties.byId[propertyId];
            setPropertyInDOM(Metadata.metaObject.propertyValues.characterIndependent, "#meta-property-values-container", property);
        }
        for (propertyId in Config.configObject.characters.properties.byId)
        {
            for (characterId in Config.configObject.characters.byId)
            {
                property = Config.configObject.characters.properties.byId[propertyId];
                setPropertyInDOM(Metadata.metaObject.propertyValues.perCharacter[characterId], "#meta-character-property-values-" + Utils.escapeSelector(characterId) + "-container", property);
            }
        }
        for (characterId in Config.configObject.characters.byId)
        {
            for (propertyId in Config.configObject.characters.byId[characterId].properties.byId)
            {
                property = Config.configObject.characters.byId[characterId].properties.byId[propertyId];
                setPropertyInDOM(Metadata.metaObject.propertyValues.perCharacter[characterId], "#meta-character-property-values-" + Utils.escapeSelector(characterId) + "-container", property);
            }
        }
    }

    function parameterDialog()
    {
        Main.selectNode(null);

        if (Metadata.timePId !== null )
        {
            $("#addTimeParameter").addClass("hidden");
        }

        $("#parameterScreen").dialog(
        {
            title: i18next.t('metadata:parameters_title'),
            height: ParameterValues.heightParameterScreen,
            width: ParameterValues.widthParameterScreen,
            modal: true,
            buttons: [
            {
                text: i18next.t('common:confirm'),
                click: function()
                {
                    saveParameters();
                    $(this).dialog('close');
                }
            },
            {
                text: i18next.t('common:cancel'),
                click: function()
                {
                    $(this).dialog('close');
                }
            }],
            close: function()
            {
                $(".removedParameter").removeClass("removedParameter");
                $(".newParameter").remove();

                if (atLeastOneUserDefinedParameter())
                {
                    // The table headers need to be visible in the metascreen the next time.
                    $("#paramsTableHead").removeClass("hidden");
                }

                $("#main").focus();
            }
        });

        $("#params").empty();
        $("#paramsTableHead").addClass("hidden");

        Metadata.metaObject.parameters.sequence.forEach(function(parameter)
        {
            var addedDiv = HtmlGenerator.addEmptyUserDefinedParameterDefinition();
            addedDiv.removeClass("newParameter").addClass("existingParameter");

            addedDiv.prop('id', parameter.id);

            var typeSelect = addedDiv.find(".parameter-type-select");

            if(parameter.id === "t")
            {
                addedDiv.addClass("isT");
                typeSelect.val(Config.types.integer.name);
                typeSelect.prop("disabled", "disabled");
                addedDiv.find(".parameter-initial-value-container").remove();
            }

            addedDiv.find(".name").val(parameter.name);

            if (parameter.type.name === Config.types.enumeration.name)
            {
                var enumerationValues = parameter.type.options.sequence.map(function(option) { return option.text; });
                HtmlGenerator.appendEnumerationValueListTo(typeSelect.parent(), enumerationValues);
            }
            typeSelect.val(parameter.type.name).trigger('change');
            addedDiv.removeClass("changedTypeParameter");

            parameter.type.setInDOM(addedDiv.find(".parameter-initial-value-container"), parameter.type.defaultValue);

            addedDiv.find(".description").val(parameter.description);
        });
        if ($("#params").children().length > 0)
            $("#paramsTableHead").removeClass("hidden");

        $("#scenarioDescription").val(Metadata.metaObject.description);
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
        $(div).removeClass("changedTypeParameter");

        var timeEffect =
        {
            idRef: newParameter.id,
            type: Config.types.integer,
            operator: "addAssign",
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

    function saveParameters()
    {
        Main.unsavedChanges = true;

        $(".removedParameter").each(function()
        {
            var id = $(this).prop('id');

            // Remove the preconditions and effects for every node with this parameter.
            for (var nodeID in Main.nodes)
            {
                var node = Main.nodes[nodeID];
                for (var i = 0; i < node.parameterEffects.userDefined.length; i++)
                {
                    if (node.parameterEffects.userDefined[i].idRef === id)
                    {
                        node.parameterEffects.userDefined.splice(i, 1);
                    }
                }
                removeAllPreconditionsWithParam(id, node.preconditions);
            }

            if (id === Metadata.timePId && Metadata.timePId !== null)
                Metadata.timePId = null;

            // Remove the parameter from the html and the object.
            $(this).remove();

            var removedParameter = Metadata.metaObject.parameters.byId[id];
            var indexOfRemovedParameter = Metadata.metaObject.parameters.sequence.indexOf(removedParameter);
            delete Metadata.metaObject.parameters.byId[id];
            Metadata.metaObject.parameters.sequence.splice(indexOfRemovedParameter, 1);
        });

        $(".existingParameter").each(function()
        {
            var newParameter = ObjectGenerator.parameterObject($(this));
            var oldParameter = Metadata.metaObject.parameters.byId[newParameter.id];

            // If an already existing parameter changed type, the effects on the nodes need to be adjusted accordingly
            if ($(this).hasClass("changedTypeParameter"))
            {
                for (var nodeID in Main.nodes)
                {
                    Main.nodes[nodeID].parameterEffects.userDefined.forEach(function(effect)
                    {
                        if (effect.idRef === oldParameter.id)
                        {
                            var hasOperator = newParameter.type.assignmentOperators.indexOf(Config.assignmentOperators[effect.operator]) !== -1;
                            if (!hasOperator) effect.operator = newParameter.type.assignmentOperators[0].name;

                            effect.value = newParameter.type.castFrom(oldParameter.type, effect.value);
                        }
                    });

                    var changeTypeOfPreconditionParameter = function(precondition)
                    {
                        if (!precondition.type && precondition.idRef === oldParameter.id)
                        {
                            var hasRelationalOperator = newParameter.type.relationalOperators.indexOf(Config.relationalOperators[precondition.operator]) !== -1;
                            if (!hasRelationalOperator) precondition.operator = newParameter.type.relationalOperators[0].name;

                            precondition.value = newParameter.type.castFrom(oldParameter.type, precondition.value);
                        }

                        if (precondition.type !== "alwaysTrue" && precondition.preconditions)
                        {
                            precondition.preconditions.map(function(precondition)
                            {
                                changeTypeOfPreconditionParameter(precondition);
                            });
                        }
                    };
                    changeTypeOfPreconditionParameter(Main.nodes[nodeID].preconditions);
                }

                $(this).removeClass("changedTypeParameter");
            }

            $.extend(oldParameter, newParameter);
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
            $(this).removeClass("changedTypeParameter");
        });
    }

    // Save all changes to the metaObject.
    function saveMetaObject()
    {
        Main.unsavedChanges = true;

        // All parameters that should be removed.
        var previouslySelectedNode = Main.selectedElement;
        Main.selectNode(null);

        // Save all values in the dialog to the metaObject
        Metadata.metaObject.name = formatScenarioName($("#scenarioName").val());
        $('#scenarioNameTab .scenarioName').text(Metadata.metaObject.name);
        var languageCode = $("#scenarioLanguage").val();
        if (languageCode) Metadata.metaObject.language = Config.configObject.settings.languages.byCode[languageCode];
        Metadata.metaObject.difficulty = $("#scenarioDifficulty").val();
        Metadata.metaObject.description = $("#scenarioDescription").val();

        var propertyId, characterId, property;
        for (propertyId in Config.configObject.properties.byId)
        {
            property = Config.configObject.properties.byId[propertyId];
            if (property.scopes.statementScope !== "independent") continue;
            Metadata.metaObject.propertyValues.characterIndependent[property.id] =
                property.type.getFromDOM($("#meta-property-values-container-" + property.id));
        }
        for (propertyId in Config.configObject.characters.properties.byId)
        {
            for (characterId in Config.configObject.characters.byId)
            {
                property = Config.configObject.characters.properties.byId[propertyId];
                if (property.scopes.statementScope !== "independent") continue;
                Metadata.metaObject.propertyValues.perCharacter[characterId][property.id] =
                    property.type.getFromDOM($("#meta-character-property-values-" + characterId + "-container-" + property.id));
            }
        }
        for (characterId in Config.configObject.characters.byId)
        {
            for (propertyId in Config.configObject.characters.byId[characterId].properties.byId)
            {
                property = Config.configObject.characters.byId[characterId].properties.byId[propertyId];
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

    function addOrExtendAuthor(name, email, date, setEndDateToDate)
    {
        var found = false;
        Metadata.metaObject.authors.forEach(function(existingAuthor)
        {
            if (existingAuthor.name === name)
            {
                if (email) existingAuthor.email = email;
                if (setEndDateToDate) existingAuthor.endDate = date;
                found = true;
            }
        });

        if (!found)
        {
            var author = {};
            author.name = name;
            if (email) author.email = email;
            author.startDate = date;
            if (setEndDateToDate) author.endDate = date;

            Metadata.metaObject.authors.push(author);
        }
    }
})();
