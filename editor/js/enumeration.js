/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

var Enumeration;

(function()
{
    "use strict";

    Enumeration =
    {
        addDefinition: addDefinition,
        removeDefinition: removeDefinition
    };

    function addDefinition(containerEl, openDialogImmediately, handleSave)
    {
        // If this was an enumeration already, use the old button
        if (containerEl.find(".enumeration-dialog-button").length === 0)
        {
            var enumerationScreenButton = $('<button>', { class: "enumeration-dialog-button" });
            enumerationScreenButton.attr('title', i18next.t('enumeration:button_alt'));
            var buttonIcon = $('<img>', { src: editor_url + "png/others/list.png" });
            enumerationScreenButton.on('mouseover', function()
            {
                buttonIcon.attr('src', editor_url + "png/others/list_hover.png");
            });
            enumerationScreenButton.on('mouseout', function()
            {
                buttonIcon.attr('src', editor_url + "png/others/list.png");
            });
            buttonIcon.attr('alt', i18next.t('enumeration:button_alt'));
            enumerationScreenButton.append(buttonIcon);
            enumerationScreenButton.on('click', function()
            {
                dialog(containerEl, handleSave);
            });
            containerEl.append(enumerationScreenButton);
        }

        if (openDialogImmediately)
        {
            dialog(containerEl, handleSave);
        }
    }

    function removeDefinition(containerEl)
    {
        containerEl.find(".enumeration-values").remove();
        containerEl.find(".enumeration-dialog-button").remove();
    }

    function dialog(containerEl, handleSave)
    {
        var enumerationDialog = $('<div>').append($('<div>', { text: i18next.t('enumeration:values') }));

        var valuesContainer = $('<ul>', { class: "enumeration-values-container" }).appendTo(enumerationDialog);
        var valueInput = $('<input>', { autofocus: true, type: 'text' });
        var valueAddButton = $('<button>', { type: 'button' })
            .append($('<img>', { src: editor_url + "png/others/plus.png", title: i18next.t('common:add') }));
        valueAddButton.on('click', function()
        {
            appendValue(valuesContainer, valueInput, valueInput.val());
        });
        valueInput.on('keydown', function(e)
        {
            if (e.which === 13) // ENTER
            {
                appendValue(valuesContainer, valueInput, valueInput.val());
            }
        });
        valuesContainer.append($('<li>').append(valueInput).append(valueAddButton));

        var type = Types.primitives.enumeration.loadTypeFromDOM(containerEl);
        type.options.sequence.forEach(function(option)
        {
            appendValue(valuesContainer, valueInput, option.text);
        });

        var hasValues = type.options.sequence.length > 0;

        enumerationDialog.dialog(
        {
            title: i18next.t('enumeration:title'),
            height: Constants.heightEnumerationScreen,
            width: Constants.widthEnumerationScreen,
            modal: true,
            buttons: [
            {
                text: i18next.t('common:confirm'),
                click: function()
                {
                    hasValues = save(containerEl, valuesContainer, handleSave);
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
            beforeClose: function()
            {
                if (!hasValues)
                {
                    alert(i18next.t('enumeration:no_values_defined'));
                    hasValues = type.options.sequence.length > 0;
                    return false;
                }
            },
            close: function()
            {
                enumerationDialog.remove();
            }
        });
    }

    function appendValue(valuesContainer, valueInput, value)
    {
        // The value of an enumeration can not be the empty string
        if (value)
        {
            var deleteParentButton = $(Parts.getDeleteParentButtonHTML());
            deleteParentButton.on('click', function()
            {
                $(this).parent().remove();
                valueInput.focus();
            });

            var valueItem = $('<li>').append($('<span>', { text: value }));
            valueItem.append(deleteParentButton);
            valueItem.insertBefore(valuesContainer.children().last());

            valueInput.val("").focus();
        }
    }

    function save(containerEl, valuesContainer, handleSave)
    {
        var values = $('<ul>', { class: "enumeration-values" });
        var atLeastOneValue = false;
        // Last child is the input so don't include it
        valuesContainer.children().not(":last-child").each(function()
        {
            values.append($('<li>', { text: $(this).text() }));
            atLeastOneValue = true;
        });

        if (!atLeastOneValue) return false;

        var typeContainer = $('<span>');
        typeContainer.append(values);

        var type = Types.primitives.enumeration.loadTypeFromDOM(typeContainer);
        type.insertTypeIntoDOM(containerEl);
        handleSave(Types.primitives.enumeration.name);

        return true;
    }

})();
