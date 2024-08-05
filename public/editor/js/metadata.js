// © DialogueTrainer

/* exported Metadata */
let Metadata;

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
        const metadataDialog = $('<div>', { id: "metadata" });

        const metadataIndex = $('<div>', { class: "index" });
        const metadataSearch = $('<input>', { type: 'text', placeholder: i18next.t('common:search'), id: "metadataSearch", class: "search", autofocus: true });

        const metadataIndexList = $('<ul>');
        metadataIndex.append(metadataSearch, metadataIndexList);

        const metadataContent = $('<div>', { class: "content" });

        metadataSearch.on('input',
            Utils.debounce(function()
            {
                metadataContent.find('.item').hide()
                    .parents('.container').hide()
                    .parents('.category').hide();

                const searchValue = metadataSearch.val().toLowerCase();

                $('#authors.category').toggle(!searchValue);

                metadataContent.find('.item').each(function()
                {
                    if ($(this).text().toLowerCase().indexOf(searchValue) > -1 || $(this).parents('.container').parents('.category').children(':header').text().toLowerCase().indexOf(searchValue) > -1)
                    {
                        $(this).show().parents('.container').show().parents('.category').show();
                    }
                });
            }, 50)
        );

        const generalCategory = $('<div>', { class: "category", id: "general" }).append($('<h2>', { text: i18next.t('metadata:general') }));
        metadataIndexList.append($('<li>').append($('<a>', { href: "#general", text: i18next.t('metadata:general') })));

        const generalContainer = $('<div>', { class: "container" });

        generalContainer.append(
            $('<div>', { class: "item" })
                .append(
                    $('<div>', { class: "itemLabel" }).append($('<label>', { for: "scenarioName", text: i18next.t('metadata:scenario_name') })),
                    $('<input>', { type: 'text', id: "scenarioName" })));

        if (Config.container.settings.languages.sequence.length > 0)
        {
            const scenarioLanguageSelect = $('<select>', { id: "scenarioLanguage" });
            Config.container.settings.languages.sequence.forEach(function(language)
            {
                scenarioLanguageSelect.append($('<option>', { value: language.code, text: language.name }));
            });
            const scenarioLanguageContainer = $('<div>', { class: "item" });
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

        const scenarioDescription = $('<textarea>', { id: "scenarioDescription" });
        scenarioDescription.attr('maxlength', Config.container.settings.description.type.maxLength);
        scenarioDescription.attr('rows', Config.container.settings.description.type.rows);

        generalContainer.append($('<div>', { class: "item" })
            .append($('<div>', { class: "itemLabel" })
                .append($('<label>', { for: "scenarioDescription", text: i18next.t('common:description') })),
            scenarioDescription));

        if (Config.container.settings.description.type.markdown) Utils.attachMarkdownTooltip(scenarioDescription);
        generalCategory.append(generalContainer);
        metadataContent.append(generalCategory);

        const authorsCategory = $('<div>', { class: "category", id: "authors" })
            .append($('<h2>', { text: i18next.t('metadata:authors') }));

        const authorsContainer = $('<div>', { class: "container table" }).append(
            $('<table>')
                .append($('<thead>').append($('<tr>')
                    .append($('<th>', { text: i18next.t('common:name'), class: "fill" }))
                    .append($('<th>', { text: i18next.t('metadata:start_date') }))
                    .append($('<th>', { text: i18next.t('metadata:end_date') })))
                )
        );

        authorsCategory.append(authorsContainer);
        metadataContent.append(authorsCategory);

        metadataContent.append($('<div>', { id: "meta-property-values" }));

        const firstCharacter = Config.container.characters.sequence[0];
        const characterSectionHeader = Config.container.characters.sequence.length > 1 ?
            i18next.t('common:characters') : firstCharacter.name ? firstCharacter.name : firstCharacter.id;
        const characterCategory = $('<div>', { class: "category", id: "characters" }).append($('<h2>', { text: characterSectionHeader })
        );

        const characterContainer = $('<div>', { id: "meta-character-property-values", class: "container" }).append(
            $('<div>', { id: "character-tabs", class: "category item" })
        );
        characterCategory.append(characterContainer);

        metadataContent.append(characterCategory);
        metadataDialog.append(metadataIndex);
        metadataDialog.append(metadataContent);

        metadataDialog.dialog(
        {
            title: i18next.t('metadata:title'),
            width: Utils.fitDialogWidthToWindow(Utils.dialogSizes.medium),
            modal: true,
            grid: true,
            buttons: [
                {
                    text: i18next.t('common:confirm'),
                    class: 'col-primary roundedPill medium',
                    click: function()
                    {
                        save();
                        $(this).dialog('close');
                    }
                },
                {
                    text: i18next.t('common:cancel'),
                    class: 'col-dim roundedPill medium',
                    click: function() { $(this).dialog('close'); }
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
                const authorContainer = $('<tr>');
                authorContainer.append($('<td>', { text: author.name }).append($('<span>', { text: author.email ? author.email : "" })));
                authorContainer.append($('<td>', { text: author.startDate }));
                authorContainer.append($('<td>', { text: author.endDate ? author.endDate : "" }));
                authorsContainer.children('table').append(authorContainer);
            });
        }
        else
        {
            authorsCategory.hide();
        }

        let anyPropertyShown = false;
        const hStartLevel = 2;

        const propertyValuesEl = $('#meta-property-values');
        const showPropertyItem = function(propertyItem, hLevel, container, idPrefix, isTopLevel)
        {
            if (propertyItem.scopes.statementScope !== 'independent') return;
            if (propertyItem.kind === 'section')
            {
                const sectionCategory = $('<div>', { class: "category", id: "section-" + propertyItem.id })
                    .append($('<h' + hLevel + '>', { text: propertyItem.name }));
                if (isTopLevel) metadataIndexList.append($('<li>').append($('<a>', { href: "#section-" + propertyItem.id, text: propertyItem.name })));

                const sectionContainer = $('<div>', { class: "container" });

                propertyItem.sequence.forEach(function(subItem)
                {
                    showPropertyItem(subItem, hLevel + 1, sectionContainer, idPrefix);
                });

                sectionCategory.append(sectionContainer);
                container.append(sectionCategory);
            }
            else
            {
                const controlHtmlId = idPrefix + '-' + propertyItem.id;
                const propertyRow = $('<div>', { id: idPrefix + '-container-' + propertyItem.id, class: "item " + propertyItem.type.labelControlOrder }).append(
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

        const characterPropertyValuesEl = $('#meta-character-property-values');
        const characterTabs = $("#character-tabs");
        const characterList = Config.container.characters.sequence.length > 1 ? $('<ul>') : $('<div>');
        characterTabs.append(characterList);

        Config.container.characters.sequence.forEach(function(character)
        {
            const characterTabId = characterPropertyValuesEl.attr('id') + '-' + character.id;

            if (Config.container.characters.sequence.length > 1)
            {
                // Make a character tab with a link to the div it contains
                const li = $('<li>').append($('<a>', { href: '#' + characterTabId, value: character.id, text: character.name ? character.name : character.id }));
                characterList.append(li);
            }

            const characterTab = $('<div>', { id: characterTabId });
            characterTabs.append(characterTab);

            Config.container.characters.properties.sequence.forEach(function(propertyItem)
            {
                showPropertyItem(propertyItem, hStartLevel + 1, characterTab, characterTabId, true);
            });

            Config.container.characters.byId[character.id].properties.sequence.forEach(function(propertyItem)
            {
                showPropertyItem(propertyItem, hStartLevel + 1, characterTab, characterTabId);
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

        const setPropertyInDOM = function(propertyValues, propertyContainerId, property)
        {
            if (property.scopes.statementScope !== "independent") return;
            property.type.setInDOM($(propertyContainerId + '-' + $.escapeSelector(property.id)), propertyValues[property.id]);
        };
        for (const propertyId in Config.container.properties.byId)
        {
            const property = Config.container.properties.byId[propertyId];
            setPropertyInDOM(Metadata.container.propertyValues.characterIndependent, "#meta-property-values-container", property);
        }
        for (const propertyId in Config.container.characters.properties.byId)
        {
            for (const characterId in Config.container.characters.byId)
            {
                const property = Config.container.characters.properties.byId[propertyId];
                setPropertyInDOM(Metadata.container.propertyValues.perCharacter[characterId], "#meta-character-property-values-" + $.escapeSelector(characterId) + "-container", property);
            }
        }
        for (const characterId in Config.container.characters.byId)
        {
            for (const propertyId in Config.container.characters.byId[characterId].properties.byId)
            {
                const property = Config.container.characters.byId[characterId].properties.byId[propertyId];
                setPropertyInDOM(Metadata.container.propertyValues.perCharacter[characterId], "#meta-character-property-values-" + $.escapeSelector(characterId) + "-container", property);
            }
        }

        loadIndex(metadataIndex, metadataDialog);
    }

    function save()
    {
        SaveIndicator.setSavedChanges(false);

        const previouslySelectedElement = Main.selectedElement;
        Main.selectElement(null);

        // Save all values in the dialog to the metaObject
        Metadata.container.name = formatScenarioName($("#scenarioName").val());
        $('#breadcrumbs .scenarioName span').text(Metadata.container.name);
        Main.updateDocumentTitle();
        const languageCode = $("#scenarioLanguage").val();
        if (languageCode) Metadata.container.language = Config.container.settings.languages.byCode[languageCode];
        Metadata.container.difficulty = $("#scenarioDifficulty").val();
        Metadata.container.description = $("#scenarioDescription").val();

        for (const propertyId in Config.container.properties.byId)
        {
            const property = Config.container.properties.byId[propertyId];
            if (property.scopes.statementScope !== "independent") continue;
            Metadata.container.propertyValues.characterIndependent[property.id] =
                property.type.getFromDOM($("#meta-property-values-container-" + property.id));
        }
        for (const propertyId in Config.container.characters.properties.byId)
        {
            for (const characterId in Config.container.characters.byId)
            {
                const property = Config.container.characters.properties.byId[propertyId];
                if (property.scopes.statementScope !== "independent") continue;
                Metadata.container.propertyValues.perCharacter[characterId][property.id] =
                    property.type.getFromDOM($("#meta-character-property-values-" + characterId + "-container-" + property.id));
            }
        }
        for (const characterId in Config.container.characters.byId)
        {
            for (const propertyId in Config.container.characters.byId[characterId].properties.byId)
            {
                const property = Config.container.characters.byId[characterId].properties.byId[propertyId];
                if (property.scopes.statementScope !== "independent") continue;
                Metadata.container.propertyValues.perCharacter[characterId][property.id] =
                    property.type.getFromDOM($("#meta-character-property-values-" + characterId + "-container-" + property.id));
            }
        }

        Main.selectElement(previouslySelectedElement);
    }

    function formatScenarioName(scenarioName)
    {
        scenarioName = scenarioName.trim();
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
        let found = false;
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
            const author = {};
            author.name = name;
            if (email) author.email = email;
            author.startDate = date;
            if (setEndDateToDate) author.endDate = date;

            Metadata.container.authors.push(author);
        }
    }

    function loadIndex(indexElement, dialog)
    {
        const menuItems = indexElement.find("a");

        // Smooth scrolling animation
        menuItems.click(function(e)
        {
            const href = $(this).attr("href");
            scrollToSection(dialog, href);
            e.preventDefault();
        });

        const observer = new IntersectionObserver(entries =>
        {
            entries.forEach(entry =>
            {
                if (entry.isIntersecting)
                {
                    const menuItem = $($(entry.target).prop('menuItem'));
                    menuItems.removeClass('active');
                    menuItem.addClass('active');
                }
            });
        }, {
            root: dialog.find('.content').get(0),
            rootMargin: "0px 0px -50% 0px"
        });

        menuItems.each(function()
        {
            const section = $($(this).attr('href'));
            section.prop('menuItem', this);
            observer.observe(section.get(0));
        });
    }

    function scrollToSection(dialog, href)
    {
        let offsetTop = $(href).position().top + $(dialog).find('.content').scrollTop();
        offsetTop -= $(dialog).siblings('.header').outerHeight();
        $(dialog).find('.content').stop().animate({
            scrollTop: offsetTop
        }, 300);
    }
})();
