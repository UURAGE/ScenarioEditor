/* © Utrecht University and DialogueTrainer */

/* exported Metadata */
var Metadata;

(function()
{
    "use strict";

    // eslint-disable-next-line no-global-assign
    Metadata =
    {
        container: {},
        reset: reset,
        dialog: dialog,
        formatScenarioName: formatScenarioName,
        addOrExtendAuthor: addOrExtendAuthor
    };

    $(function()
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

        var metadataIndex = $('<div>', { class: "index" }).append();
        var metadataIndexList = $('<ul>');
        metadataIndex.append(metadataIndexList);

        var metadataContainer = $('<div>', { class: "content" });
        var generalCategory = $('<div>', { class: "category", id: "general" })
            .append($('<h1>', { text: i18next.t('metadata:general') }));
        metadataIndexList.append($('<li>').append($('<a>', { href: "#general", text: i18next.t('metadata:general') })));

        var generalContainer = $('<div>', { class: "container" });

        generalContainer.append(
            $('<div>', { class: "item" })
                .append(
                    $('<div>', { class: "itemLabel" })
                        .append(
                            $('<label>', { for: "scenarioName", text: i18next.t('metadata:scenario_name') })),
                    $('<input>', { type: 'text', id: "scenarioName", maxlength: 50 })));

        if (Config.container.settings.languages.sequence.length > 0)
        {
            var scenarioLanguageSelect = $('<select>', { id: "scenarioLanguage" });
            Config.container.settings.languages.sequence.forEach(function(language)
            {
                scenarioLanguageSelect.append($('<option>', { value: language.code, text: language.name }));
            });
            var scenarioLanguageContainer = $('<div>', { class: "item" });
            scenarioLanguageContainer.append(
                $('<div>', { class: "itemLabel" })
                    .append($('<label>', { for: "scenarioLanguage", text: i18next.t('metadata:language') })));
            scenarioLanguageContainer.append(scenarioLanguageSelect);
            generalContainer.append(scenarioLanguageContainer);
        }

        generalContainer.append($('<div>', { class: "item" }).append(
            $('<div>', { class: "itemLabel" })
                .append(
                    $('<label>', { for: "scenarioDifficulty", text: i18next.t('metadata:difficulty.translation') })),
            $('<select>', { id: "scenarioDifficulty" })
                .append($('<option>', { value: "very_easy", text: i18next.t('metadata:difficulty.very_easy') }))
                .append($('<option>', { value: "easy", text: i18next.t('metadata:difficulty.easy') }))
                .append($('<option>', { value: "medium", text: i18next.t('metadata:difficulty.medium') }))
                .append($('<option>', { value: "difficult", text: i18next.t('metadata:difficulty.hard') }))
                .append($('<option>', { value: "very_difficult", text: i18next.t('metadata:difficulty.very_hard') }))));

        var scenarioDescription = $('<textarea>', { id: "scenarioDescription" });
        scenarioDescription.attr('maxlength', Config.container.settings.description.type.maxLength);
        scenarioDescription.attr('rows', Config.container.settings.description.type.rows);

        generalContainer.append($('<div>', { class: "item" })
            .append(
                $('<div>', { class: "itemLabel" })
                    .append(
                        $('<label>', { for: "scenarioDescription", text: i18next.t('common:description') })),
                scenarioDescription));

        if (Config.container.settings.description.type.markdown) Utils.attachMarkdownTooltip(scenarioDescription);
        generalCategory.append(generalContainer);
        metadataContainer.append(generalCategory);

        var authorsCategory = $('<div>', { class: "category", id: "authors" })
            .append($('<h1>', { text: i18next.t('metadata:authors') }));

        var authorsContainer = $('<table>', { class: "container" })
            .append($('<thead>').append($('<tr>')
                .append($('<th>', { text: i18next.t('common:name'), class: "fill" }))
                .append($('<th>', { text: i18next.t('metadata:start_date') }))
                .append($('<th>', { text: i18next.t('metadata:end_date') }))));

        authorsCategory.append(authorsContainer);
        metadataContainer.append(authorsCategory);

        metadataContainer.append($('<div>', { id: "meta-property-values" }));

        var firstCharacter = Config.container.characters.sequence[0];
        var characterSectionHeader = Config.container.characters.sequence.length > 1 ?
            i18next.t('common:characters') : firstCharacter.name ? firstCharacter.name : firstCharacter.id;
        var characterCategory = $('<div>', { class: "category", id: "characters" }).append($('<h1>', { text: characterSectionHeader })
        );

        var characterContainer = $('<div>', { id: "meta-character-property-values", class: "container" }).append(
            $('<div>', { id: "character-tabs", class: "category item" })
        );
        characterCategory.append(characterContainer);

        metadataContainer.append(characterCategory);
        metadataDialog.append(metadataIndex);
        metadataDialog.append(metadataContainer);

        metadataDialog.dialog(
        {
            title: i18next.t('metadata:title'),
            height: Constants.heightMetaScreen,
            width: Constants.widthMetaScreen,
            modal: true,
            buttons:
            [
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
                }
            ],
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
            authorsCategory.show();
            metadataIndexList.append($('<li>').append($('<a>', { href: "#authors", text: i18next.t('metadata:authors') })));

            Metadata.container.authors.forEach(function(author)
            {
                var authorContainer = $('<tr>');
                authorContainer.append($('<td>', { text: author.name }).append($('<span>', { text: author.email ? author.email : "" })));
                authorContainer.append($('<td>', { text: author.startDate }));
                authorContainer.append($('<td>', { text: author.endDate ? author.endDate : "" }));
                authorsContainer.append(authorContainer);
            });
        }
        else
        {
            authorsCategory.hide();
        }

        var anyPropertyShown = false;
        var hStartLevel = 3;

        var propertyValuesEl = $('#meta-property-values');
        var showPropertyItem = function(propertyItem, hLevel, container, idPrefix, isTopLevel)
        {
            if (propertyItem.scopes.statementScope !== 'independent') return;
            if (propertyItem.kind === 'section')
            {
                var sectionCategory = $('<div>', { class: "category", id: "section-" + propertyItem.id })
                    .append($('<h' + hLevel + '>', { text: propertyItem.name }));
                if (isTopLevel) metadataIndexList.append($('<li>').append($('<a>', { href: "#section-" + propertyItem.id, text: propertyItem.name })));

                var sectionContainer = $('<div>', { class: "container" });

                propertyItem.sequence.forEach(function(subItem)
                {
                    showPropertyItem(subItem, hLevel + 1, sectionContainer, idPrefix);
                });

                sectionCategory.append(sectionContainer);
                container.append(sectionCategory);
            }
            else
            {
                var controlHtmlId = idPrefix + '-' + propertyItem.id;
                var propertyRow = $('<div>', { id: idPrefix + '-container-' + propertyItem.id, class: "item " + propertyItem.type.labelControlOrder }).append(
                    $('<div>', { class: "itemLabel" }).append(
                        $('<label>', { text: propertyItem.name, 'for': controlHtmlId }),
                        $('<label>', { class: "description", text: propertyItem.description, 'for': controlHtmlId })
                    ));
                propertyItem.type.appendControlTo(propertyRow, controlHtmlId);
                container.append(propertyRow);
                anyPropertyShown = true;
            }
        };
        Config.container.properties.sequence.forEach(function(propertyItem)
        {
            showPropertyItem(propertyItem, hStartLevel, propertyValuesEl, propertyValuesEl.attr('id'), true);
        });
        propertyValuesEl.toggle(anyPropertyShown);

        anyPropertyShown = false;

        var characterPropertyValuesEl = $('#meta-character-property-values');
        var characterTabs = $("#character-tabs");
        var characterList = Config.container.characters.sequence.length > 1 ? $('<ul>') : $('<div>');
        characterTabs.append(characterList);

        Config.container.characters.sequence.forEach(function(character)
        {
            var characterTabId = characterPropertyValuesEl.attr('id') + '-' + character.id;

            if (Config.container.characters.sequence.length > 1)
            {
                // Make a character tab with a link to the div it contains
                var li = $('<li>').append($('<a>', { href: '#' + characterTabId, value: character.id, text: character.name ? character.name : character.id }));
                characterList.append(li);
            }

            var characterTab = $('<div>', { id: characterTabId });
            characterTabs.append(characterTab);

            Config.container.characters.properties.sequence.forEach(function(propertyItem)
            {
                showPropertyItem(propertyItem, hStartLevel, characterTab, characterTabId, true);
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
        if (anyPropertyShown)
        {
            metadataIndexList.append($('<li>').append($('<a>', { href: "#characters", text: characterSectionHeader })));
        }

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

        loadIndex(metadataIndex, metadataDialog);
    }

    function save()
    {
        SaveIndicator.setSavedChanges(false);

        var previouslySelectedElement = Main.selectedElement;
        Main.selectElement(null);

        // Save all values in the dialog to the metaObject
        Metadata.container.name = formatScenarioName($("#scenarioName").val());
        $('#scenarioNameTab .scenarioName').text(Metadata.container.name);
        Main.updateDocumentTitle();
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

    function loadIndex(indexElement, dialog)
    {
        var topMenu = indexElement,
            menuItems = topMenu.find("a");

        // Smooth scrolling animation
        menuItems.click(function(e)
        {
            var href = $(this).attr("href"),
                offsetTop = $(href).position().top + $(dialog).scrollTop();
            $(dialog).stop().animate({
                scrollTop: offsetTop
            }, 300);
            e.preventDefault();
        });
    }
})();
