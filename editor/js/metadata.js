/* © Utrecht University and DialogueTrainer */

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
        $("#editMetadata").on('click', dialog);
        reset();
    });

    // Resets the metadata to the default
    function reset()
    {
        Metadata.container =
        {
            name: "",
            version: 0,
            difficulty: "medium",
            description: Config.container.settings.description.type.defaultValue,
            authors: [],
            propertyValues: Config.getNewDefaultPropertyValues(['independent'])
        };

        if (Config.container.settings.languages.sequence.length > 0)
        {
            Metadata.container.language = Config.container.settings.languages.sequence[0];
        }
    }

    function dialog()
    {
        var metadataDialog = $('<div>', { id: "metadata" });

        var metadataContainer = $('<table>');

        var generalHeader = $('<thead>').append($('<th>', { colspan: 2 }).append($('<h3>', { text: i18next.t('metadata:general') })));
        metadataContainer.append(generalHeader);

        var generalContainer = $('<tbody>');
        generalContainer.append($('<tr>')
            .append($('<th>').append($('<label>', { for: "scenarioName", text: i18next.t('metadata:scenario_name'), maxlength: 50 })))
            .append($('<td>').append($('<input>', { type: 'text', id: "scenarioName" }))));
        if (Config.container.settings.languages.sequence.length > 0)
        {
            var scenarioLanguageSelect = $('<select>', { id: "scenarioLanguage" });
            Config.container.settings.languages.sequence.forEach(function(language)
            {
                scenarioLanguageSelect.append($('<option>', { value: language.code, text: language.name }));
            });
            var scenarioLanguageContainer = $('<tr>');
            scenarioLanguageContainer.append($('<th>').append($('<label>', { for: "scenarioLanguage", text: i18next.t('metadata:language') + ':' })));
            scenarioLanguageContainer.append($('<td>').append(scenarioLanguageSelect));
            generalContainer.append(scenarioLanguageContainer);
        }
        generalContainer.append($('<tr>')
            .append($('<th>').append($('<label>', { for: "scenarioDifficulty", text: i18next.t('metadata:difficulty.translation') })))
            .append($('<td>').append($('<select>', { id: "scenarioDifficulty" } )
                .append($('<option>', { value: "very_easy", text: i18next.t('metadata:difficulty.very_easy') }))
                .append($('<option>', { value: "easy", text: i18next.t('metadata:difficulty.easy') }))
                .append($('<option>', { value: "medium", text: i18next.t('metadata:difficulty.medium') }))
                .append($('<option>', { value: "difficult", text: i18next.t('metadata:difficulty.hard') }))
                .append($('<option>', { value: "very_difficult", text: i18next.t('metadata:difficulty.very_hard') })))));
        var scenarioDescription = $('<textarea>', { id: "scenarioDescription", class: "description" } );
        scenarioDescription.attr('maxlength', Config.container.settings.description.type.maxLength);
        generalContainer.append($('<tr>')
        .append($('<th>').append($('<label>', { for: "scenarioDescription", text: i18next.t('common:description') })))
        .append($('<td>').append(scenarioDescription)));
        if (Config.container.settings.description.type.markdown) Utils.attachMarkdownTooltip(scenarioDescription);
        metadataContainer.append(generalContainer);

        var authorsHeader = $('<thead>').append($('<th>').append($('<h3>', { text: i18next.t('metadata:authors') })));
        metadataContainer.append(authorsHeader);

        var authorsContainer = $('<table>').append($('<tr>')
            .append($('<th>').append($('<h4>', { text: i18next.t('common:name') })))
            .append($('<th>').append($('<h4>', { text: i18next.t('metadata:email') })))
            .append($('<th>').append($('<h4>', { text: i18next.t('metadata:start_date') })))
            .append($('<th>').append($('<h4>', { text: i18next.t('metadata:end_date') }))));
        metadataContainer.append($('<tbody>').append($('<tr>').append($('<td>', { colspan: 2 }).append(authorsContainer))));

        metadataContainer.append($('<thead>'));
        metadataContainer.append($('<tbody>', { id: "meta-property-values" }));

        metadataContainer.append($('<thead>').append($('<th>', { colspan: 2 }).append($('<h3>', { text: i18next.t('common:characters') }))));
        metadataContainer.append($('<tbody>', { id: "meta-character-property-values" }).append($('<tr>').append($('<td>', { colspan: 2 , id: "character-tabs" }))));

        metadataDialog.append(metadataContainer);

        metadataDialog.dialog(
        {
            title: i18next.t('metadata:title'),
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
                metadataDialog.remove();
            }
        });

        // Show the stored values for the metadata.
        $("#scenarioName").val(Metadata.container.name);
        if (Metadata.container.language) $("#scenarioLanguage").val(Metadata.container.language.code).trigger('change');
        $("#scenarioDifficulty").val(Metadata.container.difficulty);
        scenarioDescription.val(Metadata.container.description);

        authorsContainer.find("tr").not("tr:first").remove();
        if (Metadata.container.authors.length > 0)
        {
            authorsHeader.show();
            authorsContainer.show();
            Metadata.container.authors.forEach(function(author)
            {
                var authorContainer = $('<tr>');
                authorContainer.append($('<td>', { text: author.name }));
                authorContainer.append($('<td>', { text: author.email ? author.email : "" }));
                authorContainer.append($('<td>', { text: author.startDate }));
                authorContainer.append($('<td>', { text: author.endDate ? author.endDate : "" }));
                authorsContainer.append(authorContainer);
            });
        }
        else
        {
            authorsHeader.hide();
            authorsContainer.hide();
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
                var controlFirst = propertyItem.type.labelControlOrder === Types.labelControlOrders.singleLineContainerLabel ||
                                   propertyItem.type.labelControlOrder === Types.labelControlOrders.twoLineContainerLabel;
                propertyHeader.append($('<label>', { text: propertyItem.name + (controlFirst ? '' : ':'), 'for': controlHtmlId }));

                var propertyData = $('<td>', { id: idPrefix + '-container-' + propertyItem.id });
                propertyItem.type.appendControlTo(propertyData, controlHtmlId);

                var propertyRow = $('<tr>');
                var additionalPropertyRow;
                switch (propertyItem.type.labelControlOrder)
                {
                    case Types.labelControlOrders.singleLineLabelContainer:
                        propertyRow.append(propertyHeader);
                        propertyRow.append(propertyData);
                        break;
                    case Types.labelControlOrders.singleLineContainerLabel:
                        propertyRow.append(propertyHeader);
                        propertyRow.prepend(propertyData);
                        break;
                    case Types.labelControlOrders.container:
                        propertyData.prop('colspan', "2");
                        propertyRow.append(propertyData);
                        break;
                    case Types.labelControlOrders.twoLineLabelContainer:
                        propertyRow.append(propertyHeader);
                        additionalPropertyRow = $('<tr>').append(propertyData);
                        break;
                    case Types.labelControlOrders.twoLineContainerLabel:
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
        Config.container.properties.sequence.forEach(function (propertyItem)
        {
            showPropertyItem(propertyItem, hStartLevel, propertyValuesEl, propertyValuesEl.attr('id'));
        });
        propertyValuesEl.toggle(anyPropertyShown);

        anyPropertyShown = false;

        var characterPropertyValuesEl = $('#meta-character-property-values');
        var characterTabs = $("#character-tabs");
        var characterList = Config.container.characters.sequence.length > 1 ? $('<ul>') : $('<div>');
        characterTabs.append(characterList);

        Config.container.characters.sequence.forEach(function (character)
        {
            var characterTabId = characterPropertyValuesEl.attr('id') + '-' + character.id;

            var characterHeaderText = character.name ? character.name : character.id;

            if (Config.container.characters.sequence.length > 1)
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

            Config.container.characters.properties.sequence.forEach(function(propertyItem)
            {
                showPropertyItem(propertyItem, hStartLevel, characterTab, characterTabId);
            });

            Config.container.characters.byId[character.id].properties.sequence.forEach(function(propertyItem)
            {
                showPropertyItem(propertyItem, hStartLevel, characterTab, characterTabId);
            });
        });

        if (Config.container.characters.sequence.length > 1)
        {
            characterTabs.tabs(
            {
                active: 0,
                collapsible: true
            });
        }
        characterPropertyValuesEl.toggle(anyPropertyShown);

        var setPropertyInDOM = function(propertyValues, propertyContainerId, property)
        {
            if (property.scopes.statementScope !== "independent") return;
            property.type.setInDOM($(propertyContainerId + '-' + $.escapeSelector(property.id)), propertyValues[property.id]);
        };
        var propertyId, characterId, property;
        for (propertyId in Config.container.properties.byId)
        {
            property = Config.container.properties.byId[propertyId];
            setPropertyInDOM(Metadata.container.propertyValues.characterIndependent, "#meta-property-values-container", property);
        }
        for (propertyId in Config.container.characters.properties.byId)
        {
            for (characterId in Config.container.characters.byId)
            {
                property = Config.container.characters.properties.byId[propertyId];
                setPropertyInDOM(Metadata.container.propertyValues.perCharacter[characterId], "#meta-character-property-values-" + $.escapeSelector(characterId) + "-container", property);
            }
        }
        for (characterId in Config.container.characters.byId)
        {
            for (propertyId in Config.container.characters.byId[characterId].properties.byId)
            {
                property = Config.container.characters.byId[characterId].properties.byId[propertyId];
                setPropertyInDOM(Metadata.container.propertyValues.perCharacter[characterId], "#meta-character-property-values-" + $.escapeSelector(characterId) + "-container", property);
            }
        }
    }

    function save()
    {
        SaveIndicator.setSavedChanges(false);

        var previouslySelectedElement = Main.selectedElement;
        Main.selectElement(null);

        // Save all values in the dialog to the metaObject
        Metadata.container.name = formatScenarioName($("#scenarioName").val());
        $('#scenarioNameTab .scenarioName').text(Metadata.container.name);
        var languageCode = $("#scenarioLanguage").val();
        if (languageCode) Metadata.container.language = Config.container.settings.languages.byCode[languageCode];
        Metadata.container.difficulty = $("#scenarioDifficulty").val();
        Metadata.container.description = $("#scenarioDescription").val();

        var propertyId, characterId, property;
        for (propertyId in Config.container.properties.byId)
        {
            property = Config.container.properties.byId[propertyId];
            if (property.scopes.statementScope !== "independent") continue;
            Metadata.container.propertyValues.characterIndependent[property.id] =
                property.type.getFromDOM($("#meta-property-values-container-" + property.id));
        }
        for (propertyId in Config.container.characters.properties.byId)
        {
            for (characterId in Config.container.characters.byId)
            {
                property = Config.container.characters.properties.byId[propertyId];
                if (property.scopes.statementScope !== "independent") continue;
                Metadata.container.propertyValues.perCharacter[characterId][property.id] =
                    property.type.getFromDOM($("#meta-character-property-values-" + characterId + "-container-" + property.id));
            }
        }
        for (characterId in Config.container.characters.byId)
        {
            for (propertyId in Config.container.characters.byId[characterId].properties.byId)
            {
                property = Config.container.characters.byId[characterId].properties.byId[propertyId];
                if (property.scopes.statementScope !== "independent") continue;
                Metadata.container.propertyValues.perCharacter[characterId][property.id] =
                    property.type.getFromDOM($("#meta-character-property-values-" + characterId + "-container-" + property.id));
            }
        }

        Main.selectElement(previouslySelectedElement);
    }

    function formatScenarioName(scenarioName)
    {
        scenarioName = scenarioName.trim().substr(0, 50);
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
