/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

var Types;

(function()
{
    "use strict";

    Types =
    {
        primitives: {},
        extensions: {},
        assignmentOperators: {},
        relationalOperators: {},
        unaryOperators: {},
        labelControlOrders: {},
        appendControlsTo: appendControlsTo,
        insertIntoDOM: insertIntoDOM
    };

    Types.assignmentOperators =
    {
        'assign':
        {
            name: 'assign',
            uiName: ":="
        },
        'addAssign':
        {
            name: 'addAssign',
            uiName: "+="
        },
        'subtractAssign':
        {
            name: 'subtractAssign',
            uiName: "-="
        }
    };

    Types.relationalOperators =
    {
        'equalTo':
        {
            name: 'equalTo',
            uiName: "="
        },
        'notEqualTo':
        {
            name: 'notEqualTo',
            uiName: "≠"
        },
        'greaterThanEqualTo':
        {
            name: 'greaterThanEqualTo',
            uiName: "≥"
        },
        'lessThanEqualTo':
        {
            name: 'lessThanEqualTo',
            uiName: "≤"
        },
        'greaterThan':
        {
            name: 'greaterThan',
            uiName: ">"
        },
        'lessThan':
        {
            name: 'lessThan',
            uiName: "<"
        }
    };

    Types.unaryOperators =
    {
        'atMinimum':
        {
            name: 'atMinimum',
            uiName: i18next.t('types:unaryOperators.minimal')
        },
        'atMaximum':
        {
            name: 'atMaximum',
            uiName: i18next.t('types:unaryOperators.maximal')
        }
    };

    Types.labelControlOrders =
    {
        'singleLineLabelContainer': 'singleLineLabelContainer',
        'singleLineContainerLabel': 'singleLineContainerLabel',
        'twoLineLabelContainer': 'twoLineLabelContainer',
        'twoLineContainerLabel': 'twoLineContainerLabel',
        'container': 'container'
    };

    function toXMLSimple(valueXML, value)
    {
        valueXML.textContent = value;
    }

    Types.primitives =
    {
        'string':
        {
            name: 'string',
            controlName: 'input',
            controlType: 'text',
            labelControlOrder: Types.labelControlOrders.singleLineLabelContainer,
            defaultValue: "",
            assignmentOperators: [Types.assignmentOperators.assign],
            relationalOperators: [Types.relationalOperators.equalTo, Types.relationalOperators.notEqualTo],
            unaryOperators: [],
            equals: function(otherType)
            {
                return this.name === otherType.name;
            },
            loadType: function(typeXML)
            {
                var type = this;

                var rowsAttr = typeXML.attr('rows');
                if (rowsAttr)
                {
                    var rows = Utils.parseDecimalIntWithDefault(rowsAttr);
                    if (rows > 1)
                    {
                        type = $.extend({}, type, { controlName: 'textarea' });
                        delete type.controlType;
                    }
                    type = $.extend({}, type, { rows: rows });
                }

                var maxLengthAttr = typeXML.attr('maxLength');
                if (maxLengthAttr)
                {
                    type = $.extend({}, type, { maxLength: Utils.parseDecimalIntWithDefault(maxLengthAttr) });
                }

                var autoComplete = Utils.parseBool(typeXML.attr('autoComplete'));
                if (autoComplete)
                {
                    var autoCompleteControl = function(containerEl, autoCompleteList)
                    {
                        containerEl.children(type.controlName).autocomplete({ autoFocus: true, source: autoCompleteList });
                    };

                    type = $.extend({}, type, { autoComplete: autoComplete, autoCompleteControl: autoCompleteControl });
                }

                if ($(typeXML)[0].hasAttribute('markdown'))
                {
                    var markdown = typeXML.attr('markdown');
                    type = $.extend({}, type, { markdown: markdown ? markdown : "gfm" });
                }

                var defaultEl = typeXML.children('default');
                if (defaultEl.length > 0)
                {
                    type = $.extend({}, type, { defaultValue: defaultEl[0].textContent });
                }

                return type;
            },
            loadTypeFromDOM: function(typeEl, defaultValueContainer)
            {
                var type = $.extend({}, this);
                if (defaultValueContainer)
                {
                    type.defaultValue = type.getFromDOM(defaultValueContainer);
                }
                return type;
            },
            insertType: function(typeXML)
            {
                return Utils.appendChild(typeXML, this.name);
            },
            insertTypeIntoDOM: function(containerEl) {},
            castFrom: function(type, value)
            {
                return String(value);
            },
            appendControlTo: function(containerEl, htmlId)
            {
                var control;
                if (this.controlType)
                {
                    control = $('<' + this.controlName + '>', { id: htmlId, type: this.controlType, maxlength: this.maxLength, rows: this.rows });
                }
                else
                {
                    control = $('<' + this.controlName + '>', { id: htmlId, maxlength: this.maxLength, rows: this.rows });
                }

                if (this.markdown) Utils.attachMarkdownTooltip(control);

                containerEl.append(control);
            },
            getFromDOM: function(containerEl)
            {
                return containerEl.children(this.controlName).first().val();
            },
            setInDOM: function(containerEl, value)
            {
                containerEl.children(this.controlName).first().val(value);
            },
            fromXML: function(valueXML)
            {
                return valueXML.textContent;
            },
            toXML: function(valueXML, value)
            {
                valueXML.textContent = value;
                if (this.rows > 1) Utils.setPreserveSpace(valueXML);
            }
        },
        'integer':
        {
            name: 'integer',
            controlName: 'input',
            controlType: 'number',
            labelControlOrder: Types.labelControlOrders.singleLineLabelContainer,
            defaultValue: 0,
            assignmentOperators: [Types.assignmentOperators.assign,             Types.assignmentOperators.addAssign,
                                  Types.assignmentOperators.subtractAssign],
            relationalOperators: [Types.relationalOperators.equalTo,                Types.relationalOperators.notEqualTo,
                                  Types.relationalOperators.greaterThanEqualTo,     Types.relationalOperators.lessThanEqualTo,
                                  Types.relationalOperators.greaterThan,            Types.relationalOperators.lessThan],
            unaryOperators: [Types.unaryOperators.atMinimum, Types.unaryOperators.atMaximum],
            equals: function(otherType)
            {
                return this.name === otherType.name;
            },
            appendTypeControlsTo: function(typeEl)
            {
                var minContainer = $('<span>', { class: "min-container" });
                var maxContainer = $('<span>', { class: "max-container" });

                if (!minContainer.children(Types.primitives.integer.controlName).length)
                {
                    this.appendControlTo(minContainer);
                    this.setInDOM(minContainer, "");
                }

                if (!maxContainer.children(Types.primitives.integer.controlName).length)
                {
                    this.appendControlTo(maxContainer);
                    this.setInDOM(maxContainer, "");
                }

                typeEl.append($('<div>', { text: i18next.t('common:minimum') + ": " }).append(minContainer));
                typeEl.append($('<div>', { text: i18next.t('common:maximum') + ": " }).append(maxContainer));
            },
            loadType: function(typeXML)
            {
                var type = this;

                var minimumAttr = typeXML.attr('minimum');
                if (minimumAttr)
                {
                    type = $.extend({}, type, { minimum: parseInt(minimumAttr) });
                }

                var maximumAttr = typeXML.attr('maximum');
                if (maximumAttr)
                {
                    type = $.extend({}, type, { maximum: parseInt(maximumAttr) });
                }

                var defaultEl = typeXML.children('default');
                if (defaultEl.length > 0)
                {
                    type = $.extend({}, type, { defaultValue: parseInt(defaultEl[0].textContent, 10) });
                }

                return type;
            },
            loadTypeFromDOM: function(typeEl, defaultValueContainer)
            {
                var type = $.extend({}, this);
                var minimum = parseInt(typeEl.find(".min-container").children(type.controlName).first().val());
                if (!isNaN(minimum))
                {
                    type.minimum = minimum;
                }
                var maximum = parseInt(typeEl.find(".max-container").children(type.controlName).first().val());
                if (!isNaN(maximum))
                {
                    type.maximum = maximum;
                }
                if (defaultValueContainer)
                {
                    type.defaultValue = type.getFromDOM(defaultValueContainer);
                }
                return type;
            },
            castFrom: function(type, value)
            {
                switch(type.name)
                {
                    case Types.primitives.string.name: return Utils.parseDecimalIntWithDefault(value, 0);
                    case Types.primitives.integer.name: return value;
                    case Types.primitives.boolean.name: return Number(value);
                    case Types.primitives.enumeration.name: return Utils.parseDecimalIntWithDefault(value, 0);
                    default: return Utils.parseDecimalIntWithDefault(value, 0);
                }
            },
            insertType: function(typeXML)
            {
                var integerXML = Utils.appendChild(typeXML, this.name);
                if ('minimum' in this) integerXML.setAttribute('minimum', this.minimum);
                if ('maximum' in this) integerXML.setAttribute('maximum', this.maximum);
                return integerXML;
            },
            insertTypeIntoDOM: function(typeEl)
            {
                if ('minimum' in this) this.setInDOM(typeEl.find(".min-container"), this.minimum);
                if ('maximum' in this) this.setInDOM(typeEl.find(".max-container"), this.maximum);
            },
            appendControlTo: function(containerEl, htmlId)
            {
                var control = $('<' + this.controlName + '>', { id: htmlId, type: this.controlType, value: 0 });
                control.css('width', 50);
                containerEl.append(control);
            },
            getFromDOM: function(containerEl)
            {
                var value = Utils.parseDecimalIntWithDefault(containerEl.children(this.controlName).first().val(), 0);
                return value;
            },
            setInDOM: function(containerEl, value)
            {
                containerEl.children(this.controlName).first().val(value);
            },
            fromXML: function(valueXML)
            {
                return parseInt(valueXML.textContent, 10);
            },
            toXML: toXMLSimple
        },
        'boolean':
        {
            name: 'boolean',
            controlName: 'input',
            controlType: 'checkbox',
            labelControlOrder: Types.labelControlOrders.singleLineContainerLabel,
            defaultValue: false,
            assignmentOperators: [Types.assignmentOperators.assign],
            relationalOperators: [Types.relationalOperators.equalTo, Types.relationalOperators.notEqualTo],
            unaryOperators: [],
            equals: function(otherType)
            {
                return this.name === otherType.name;
            },
            loadType: function(typeXML, id, kind)
            {
                var type = this;

                if (kind !== 'property')
                {
                    type = $.extend({}, type, { controlName: 'select', labelControlOrder: Types.labelControlOrders.singleLineLabelContainer });
                    delete type.controlType;
                }

                var defaultEl = typeXML.children('default');
                if (defaultEl.length > 0)
                {
                    type = $.extend({}, type, { defaultValue: Utils.parseBool(defaultEl[0].textContent) });
                }

                return type;
            },
            loadTypeFromDOM: function(typeEl, defaultValueContainer)
            {
                var type = $.extend({}, this, { controlName: 'select' });
                delete type.controlType;

                if (defaultValueContainer)
                {
                    type.defaultValue = type.getFromDOM(defaultValueContainer);
                }

                return type;
            },
            castFrom: function(type, value)
            {
                switch(type.name)
                {
                    case Types.primitives.string.name: return Utils.parseBool(value.toLowerCase());
                    case Types.primitives.integer.name: return Boolean(value);
                    case Types.primitives.boolean.name: return value;
                    case Types.primitives.enumeration.name: return Utils.parseBool(value.toLowerCase());
                    default: return Utils.parseBool(value);
                }
            },
            insertType: function(typeXML)
            {
                return Utils.appendChild(typeXML, this.name);
            },
            appendControlTo: function(containerEl, htmlId)
            {
                var control;
                if (this.controlType)
                {
                    control = $('<' + this.controlName + '>', { id: htmlId, type: this.controlType });
                }
                else
                {
                    control = $('<' + this.controlName + '>', { id: htmlId });
                    control.append($('<option>', { value: String(false), text: i18next.t('types:primitives.boolean.false') }));
                    control.append($('<option>', { value: String(true),  text: i18next.t('types:primitives.boolean.true') }));
                }
                containerEl.append(control);
            },
            getFromDOM: function(containerEl)
            {
                if (this.controlType === 'checkbox')
                {
                    return containerEl.children(this.controlName).prop('checked');
                }
                else
                {
                    return Utils.parseBool(containerEl.children(this.controlName).first().val());
                }
            },
            setInDOM: function(containerEl, value)
            {
                if (this.controlType === 'checkbox')
                {
                    containerEl.children(this.controlName).first().prop('checked', value);
                }
                else
                {
                    containerEl.children(this.controlName).first().val(String(value));
                }
            },
            fromXML: function(valueXML)
            {
                return Utils.parseBool(valueXML.textContent);
            },
            toXML: toXMLSimple
        },
        'enumeration':
        {
            name: 'enumeration',
            controlName: 'select',
            labelControlOrder: Types.labelControlOrders.singleLineLabelContainer,
            defaultValue: "",
            assignmentOperators: [Types.assignmentOperators.assign],
            relationalOperators: [Types.relationalOperators.equalTo, Types.relationalOperators.notEqualTo],
            unaryOperators: [],
            equals: function(otherType)
            {
                var equal = true;
                if (this.name === otherType.name && this.options.sequence.length === otherType.options.sequence.length)
                {
                    if (this.options.byValue && otherType.options.byValue)
                    {
                        this.options.sequence.forEach(function(option, index)
                        {
                            equal = equal && option.value === otherType.options.sequence[index].value;
                        });
                    }
                    else if (!this.options.byValue && !otherType.options.byValue)
                    {
                        this.options.sequence.forEach(function(option, index)
                        {
                            equal = equal && option.text === otherType.options.sequence[index].text;
                        });
                    }
                    else
                    {
                        equal = false;
                    }
                }
                else
                {
                    equal = false;
                }
                return equal;
            },
            appendTypeControlsTo: function(typeEl)
            {
                typeEl.append($('<div>', { text: i18next.t('types:primitives.enumeration.definition.values') }));
                var valuesContainer = $('<ul>', { class: "enumeration-values-container" }).appendTo(typeEl);
                var valueInput = $('<input>', { autofocus: true, type: 'text' });
                var appendValue = function(value)
                {
                    // The value of an enumeration can not be the empty string
                    if (value)
                    {
                        var deleteButton = Parts.deleteButton();
                        deleteButton.on('click', function()
                        {
                            $(this).parent().remove();
                            valueInput.focus();
                        });

                        var valueItem = $('<li>').append($('<span>', { text: value }));
                        valueItem.append(deleteButton);
                        valueItem.insertBefore(valuesContainer.children().last());

                        valueInput.val("").focus();
                    }
                };
                var valueAddButton = Parts.addButton("", "add-enumeration-value");
                valueAddButton.on('click', function()
                {
                    appendValue(valueInput.val());
                });
                valueInput.on('keydown', function(e)
                {
                    if (e.which === 13) // ENTER
                    {
                        appendValue(valueInput.val());
                    }
                });
                valuesContainer.append($('<li>').append(valueInput).append(valueAddButton));
            },
            loadType: function(typeXML, id)
            {
                var options = { sequence: [] };
                var addOption = function(index, optionXML)
                {
                    var value = $(optionXML).attr('value');
                    var text = optionXML.textContent;
                    if (!text)
                    {
                        text = i18next.t('configXML:' + ['type', this.name, id, value].join('.'));
                        if (!options.byValue) options.byValue = {};
                    }
                    var option = { text: text };
                    if (options.byValue)
                    {
                        option.value = value;
                        options.byValue[option.value] = option;
                    }
                    options.sequence.push(option);
                };
                typeXML.children('option').each(addOption.bind(this));

                var defaultValue = options.byValue ? options.sequence[0].value : options.sequence[0].text;
                var defaultEl = typeXML.children('default');
                if (defaultEl.length > 0)
                {
                    var value = $(defaultEl).attr('value');
                    if (defaultEl[0].textContent)
                    {
                        options.sequence.forEach(function(option)
                        {
                            if (option.text === defaultEl[0].textContent)
                            {
                                defaultValue = option.text;
                            }
                        });
                    }
                    else if (options.byValue && value)
                    {
                        defaultValue = value;
                    }
                }

                return $.extend({ options: options }, this, { defaultValue: defaultValue });
            },
            loadTypeFromDOM: function(typeEl, defaultValueContainer)
            {
                var options = { sequence: [] };
                typeEl.find(".enumeration-values-container").children().not(":last-child").each(function(index, valueItem)
                {
                    var option = { text: $(valueItem).children('span').text() };
                    options.sequence.push(option);
                });
                var defaultValue;
                if (defaultValueContainer)
                {
                    defaultValue = this.getFromDOM(defaultValueContainer);
                }
                else if (options.sequence.length > 0)
                {
                    defaultValue = options.sequence[0].text;
                }
                return $.extend({ options: options }, this, { defaultValue: defaultValue });
            },
            castFrom: function(type, value)
            {
                var castValue = this.options.sequence[0].text;
                this.options.sequence.forEach(function(option)
                {
                    if (option.text === String(value)) castValue = option.text;
                });
                return castValue;
            },
            insertType: function(typeXML)
            {
                var enumerationXML = Utils.appendChild(typeXML, this.name);
                var appendOptionChild = function(option)
                {
                    var optionXML = Utils.appendChild(enumerationXML, 'option');
                    this.toXML(optionXML, this.options.byValue ? option.value : option.text);
                };
                this.options.sequence.forEach(appendOptionChild.bind(this));
                return enumerationXML;
            },
            insertTypeIntoDOM: function(typeEl)
            {
                var valuesContainer = typeEl.find(".enumeration-values-container");
                var addValueButton = valuesContainer.find(".add-enumeration-value");
                this.options.sequence.forEach(function(option)
                {
                    valuesContainer.children().last().children('input').val(option.text);
                    addValueButton.trigger('click');
                });
            },
            appendControlTo: function(containerEl, htmlId)
            {
                var control = $('<' + this.controlName + '>', { id: htmlId });
                this.options.sequence.forEach(function(option)
                {
                    control.append($('<option>', option));
                });
                containerEl.append(control);
            },
            getFromDOM: function(containerEl)
            {
                return containerEl.children(this.controlName).first().val();
            },
            setInDOM: function(containerEl, value)
            {
                containerEl.children(this.controlName).first().val(value);
            },
            fromXML: function(valueXML)
            {
                return valueXML.textContent;
            },
            toXML: toXMLSimple
        }
    };

    function appendControlsTo(containerEl, htmlClass, handleChange)
    {
        var typeSelect = $('<select>', { class: htmlClass });
        for (var typeName in Types.primitives)
        {
            typeSelect.append($('<option>', { value: typeName, text: i18next.t('types:primitives.' + typeName + '.translation') }));
        }

        var typeDefinitionContainer = $('<div>');
        var previousTypeName;
        typeSelect.on('change', function(e)
        {
            var newTypeName = $(this).val();
            var userTypeChange = e.originalEvent;

            var definitionButton = containerEl.find(".define-type");
            if (Types.primitives[newTypeName].appendTypeControlsTo)
            {
                if (previousTypeName !== newTypeName)
                {
                    typeDefinitionContainer.empty();
                    definitionButton.remove();

                    definitionButton = $('<button>', { class: "define-type" });
                    definitionButton.attr('title', i18next.t('types:primitives.' + newTypeName + '.definition.define'));
                    var buttonIcon = $('<img>', { src: editor_url + "png/others/list.png" });
                    definitionButton.on('mouseover', function()
                    {
                        buttonIcon.attr('src', editor_url + "png/others/list_hover.png");
                    });
                    definitionButton.on('mouseout', function()
                    {
                        buttonIcon.attr('src', editor_url + "png/others/list.png");
                    });
                    buttonIcon.attr('alt', i18next.t('types:primitives.' + newTypeName + '.definition.define'));
                    definitionButton.append(buttonIcon);
                    definitionButton.on('click', function()
                    {
                        dialog(typeDefinitionContainer, typeSelect, previousTypeName, newTypeName, handleChange, false);
                    });
                    containerEl.append(definitionButton);

                    Types.primitives[newTypeName].appendTypeControlsTo(typeDefinitionContainer);
                }

                var type = Types.primitives[newTypeName].loadTypeFromDOM(typeDefinitionContainer);
                if (userTypeChange && newTypeName === Types.primitives.enumeration.name)
                {
                    typeDefinitionContainer.show();
                    dialog(typeDefinitionContainer, typeSelect, previousTypeName, newTypeName, handleChange, true);
                }
                else if (newTypeName !== Types.primitives.enumeration.name || type.options.sequence.length > 0)
                {
                    typeDefinitionContainer.hide();
                    handleChange(newTypeName);
                }
            }
            else
            {
                typeDefinitionContainer.hide();
                definitionButton.remove();
                handleChange(newTypeName);
            }

            previousTypeName = newTypeName;
        });

        containerEl.append(typeSelect);
        typeSelect.val(Types.primitives.integer.name);
        typeSelect.trigger('change');

        containerEl.append(typeDefinitionContainer);
    }

    function insertIntoDOM(containerEl, htmlClass, type)
    {
        var typeSelect = containerEl.find("." + htmlClass);
        typeSelect.val(type.name).trigger('change');
        if (type.insertTypeIntoDOM)
        {
            type.insertTypeIntoDOM(typeSelect.parent());
            typeSelect.trigger('change');
        }
    }

    function dialog(containerEl, typeSelect, previousTypeName, newTypeName, handleChange, isFirstTimeForEnumeration)
    {
        var currentType = Types.primitives[newTypeName].loadTypeFromDOM(containerEl);
        var hasValues;
        if (newTypeName === Types.primitives.enumeration.name)
        {
            hasValues = currentType.options.sequence.length > 0;
        }

        var confirmed = false;
        containerEl.dialog(
        {
            title: i18next.t('types:primitives.' + newTypeName + '.definition.title'),
            height: 'auto',
            width: 'auto',
            modal: true,
            buttons: [
            {
                text: i18next.t('common:confirm'),
                click: function()
                {
                    if (newTypeName === Types.primitives.enumeration.name)
                    {
                        var newType = Types.primitives[newTypeName].loadTypeFromDOM(containerEl);
                        hasValues = newType.options.sequence.length > 0;
                    }

                    confirmed = true;

                    $(this).dialog('close');
                }
            },
            {
                text: i18next.t('common:cancel'),
                click: function()
                {
                    confirmed = false;

                    $(this).dialog('close');
                }
            }],
            beforeClose: function()
            {
                if (confirmed && newTypeName === Types.primitives.enumeration.name && !hasValues)
                {
                    confirmed = false;

                    alert(i18next.t('types:primitives.enumeration.definition.no_values'));
                    hasValues = currentType.options.sequence.length > 0;
                    return false;
                }
            },
            close: function()
            {
                $(this).dialog('destroy');

                if (!confirmed && previousTypeName && isFirstTimeForEnumeration)
                {
                    typeSelect.val(previousTypeName).trigger('change');
                }
                else if (confirmed)
                {
                    handleChange(newTypeName);
                }
                else
                {
                    // Restore the original type in the DOM
                    containerEl.empty();
                    currentType.appendTypeControlsTo(containerEl);
                    currentType.insertTypeIntoDOM(containerEl);
                }

                containerEl.hide();
            }
        });
    }


})();
