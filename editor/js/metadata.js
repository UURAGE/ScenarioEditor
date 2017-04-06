/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

var Metadata;

(function()
{
    "use strict";

    Metadata =
    {
        container: {},
        reset: reset,
        dialog: dialog,
        formatScenarioName: formatScenarioName,
        addOrExtendAuthor: addOrExtendAuthor
    };

    $(document).ready(function()
    {
        // Event handlers.
        $("#editMetadata").on('click', dialog);

        var metaScreenHTML = Parts.getMetaScreenHTML();
        $("#metaScreen").html(metaScreenHTML);

        var scenarioDescription = $("#scenarioDescription");
        scenarioDescription.attr('maxlength', Config.configObject.settings.description.type.maxLength);
        if (Config.configObject.settings.description.type.markdown) Utils.attachMarkdownTooltip(scenarioDescription);
    });

    // Resets the metadata to the default
    function reset()
    {
        Metadata.container = {
            name: "",
            version: 0,
            difficulty: "medium",
            description: Config.configObject.settings.description.type.defaultValue,
            authors: [],
            propertyValues: Config.getNewDefaultPropertyValues(['independent'])
        };

        if (Config.configObject.settings.languages.sequence.length > 0)
        {
            Metadata.container.language = Config.configObject.settings.languages.sequence[0];
        }
    }

    //Create the dialog to change the scenario description.
    function dialog()
    {
        $("#meta-property-values, #character-tabs").empty();

        $("#metaScreen").dialog(
        {
            title: i18next.t('metadata:properties_title'),
            height: Constants.heightMetaScreen,
            width: Constants.widthMetaScreen,
            modal: true,
            buttons: [
            {
                text: i18next.t('common:confirm'),
                click: function()
                {
                    save();
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
                $("#main").focus();
            }
        });

        // Show the stored values for the metadata.
        $("#scenarioName").val(Metadata.container.name);
        if (Metadata.container.language) $("#scenarioLanguage").val(Metadata.container.language.code).change();
        $("#scenarioDifficulty").val(Metadata.container.difficulty);
        $("#scenarioDescription").val(Metadata.container.description);

        var authorsHeaderEl = $("#authors-header");
        var authorsEl = $("#authors");
        authorsEl.find("tr").not("tr:first").remove();
        if (Metadata.container.authors.length > 0)
        {
            authorsHeaderEl.show();
            authorsEl.show();
            Metadata.container.authors.forEach(function(author)
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
                var propertyHeader = $('<th>');
                var controlHtmlId = idPrefix + '-' + propertyItem.id;
                var controlFirst = propertyItem.type.labelControlOrder === Config.labelControlOrders.singleLineContainerLabel ||
                                   propertyItem.type.labelControlOrder === Config.labelControlOrders.twoLineContainerLabel;
                propertyHeader.append($('<label>', { text: propertyItem.name + (controlFirst ? '' : ':'), 'for': controlHtmlId }));

                var propertyData = $('<td>', { id: idPrefix + '-container-' + propertyItem.id });
                propertyItem.type.appendControlTo(propertyData, controlHtmlId);

                var propertyRow = $('<tr>');
                var additionalPropertyRow;
                switch (propertyItem.type.labelControlOrder)
                {
                    case Config.labelControlOrders.singleLineLabelContainer:
                        propertyRow.append(propertyHeader);
                        propertyRow.append(propertyData);
                        break;
                    case Config.labelControlOrders.singleLineContainerLabel:
                        propertyRow.append(propertyHeader);
                        propertyRow.prepend(propertyData);
                        break;
                    case Config.labelControlOrders.container:
                        propertyData.prop('colspan', "2");
                        propertyRow.append(propertyData);
                        break;
                    case Config.labelControlOrders.twoLineLabelContainer:
                        propertyRow.append(propertyHeader);
                        additionalPropertyRow = $('<tr>').append(propertyData);
                        break;
                    case Config.labelControlOrders.twoLineContainerLabel:
                        additionalPropertyRow = propertyRow.append(propertyHeader);
                        propertyRow = $('<tr>').append(propertyData);
                        break;
                    default:
                        console.error("Not implemented");
                        break;
                }
                tableBody.append(propertyRow);
                if (additionalPropertyRow) tableBody.append(additionalPropertyRow);

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

        var setPropertyInDOM = function(propertyValues, propertyContainerId, property)
        {
            if (property.scopes.statementScope !== "independent") return;
            property.type.setInDOM($(propertyContainerId + '-' + Utils.escapeSelector(property.id)), propertyValues[property.id]);
        };
        var propertyId, characterId, property;
        for (propertyId in Config.configObject.properties.byId)
        {
            property = Config.configObject.properties.byId[propertyId];
            setPropertyInDOM(Metadata.container.propertyValues.characterIndependent, "#meta-property-values-container", property);
        }
        for (propertyId in Config.configObject.characters.properties.byId)
        {
            for (characterId in Config.configObject.characters.byId)
            {
                property = Config.configObject.characters.properties.byId[propertyId];
                setPropertyInDOM(Metadata.container.propertyValues.perCharacter[characterId], "#meta-character-property-values-" + Utils.escapeSelector(characterId) + "-container", property);
            }
        }
        for (characterId in Config.configObject.characters.byId)
        {
            for (propertyId in Config.configObject.characters.byId[characterId].properties.byId)
            {
                property = Config.configObject.characters.byId[characterId].properties.byId[propertyId];
                setPropertyInDOM(Metadata.container.propertyValues.perCharacter[characterId], "#meta-character-property-values-" + Utils.escapeSelector(characterId) + "-container", property);
            }
        }
    }

    function save()
    {
        Main.unsavedChanges = true;

        var previouslySelectedElement = Main.selectedElement;
        Main.selectElement(null);

        // Save all values in the dialog to the metaObject
        Metadata.container.name = formatScenarioName($("#scenarioName").val());
        $('#scenarioNameTab .scenarioName').text(Metadata.container.name);
        var languageCode = $("#scenarioLanguage").val();
        if (languageCode) Metadata.container.language = Config.configObject.settings.languages.byCode[languageCode];
        Metadata.container.difficulty = $("#scenarioDifficulty").val();
        Metadata.container.description = $("#scenarioDescription").val();

        var propertyId, characterId, property;
        for (propertyId in Config.configObject.properties.byId)
        {
            property = Config.configObject.properties.byId[propertyId];
            if (property.scopes.statementScope !== "independent") continue;
            Metadata.container.propertyValues.characterIndependent[property.id] =
                property.type.getFromDOM($("#meta-property-values-container-" + property.id));
        }
        for (propertyId in Config.configObject.characters.properties.byId)
        {
            for (characterId in Config.configObject.characters.byId)
            {
                property = Config.configObject.characters.properties.byId[propertyId];
                if (property.scopes.statementScope !== "independent") continue;
                Metadata.container.propertyValues.perCharacter[characterId][property.id] =
                    property.type.getFromDOM($("#meta-character-property-values-" + characterId + "-container-" + property.id));
            }
        }
        for (characterId in Config.configObject.characters.byId)
        {
            for (propertyId in Config.configObject.characters.byId[characterId].properties.byId)
            {
                property = Config.configObject.characters.byId[characterId].properties.byId[propertyId];
                if (property.scopes.statementScope !== "independent") continue;
                Metadata.container.propertyValues.perCharacter[characterId][property.id] =
                    property.type.getFromDOM($("#meta-character-property-values-" + characterId + "-container-" + property.id));
            }
        }

        Main.selectElement(previouslySelectedElement);
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
            return Metadata.container.name;
        }
    }

    function addOrExtendAuthor(name, email, date, setEndDateToDate)
    {
        var found = false;
        Metadata.container.authors.forEach(function(existingAuthor)
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

            Metadata.container.authors.push(author);
        }
    }
})();
