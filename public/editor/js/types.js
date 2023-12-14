// © DialogueTrainer

/* exported Types */
let Types;

(function()
{
    "use strict";

    // eslint-disable-next-line no-global-assign
    Types =
    {
        primitives: {},
        extensions: {},
        assignmentOperators: {},
        relationalOperators: {},
        unaryOperators: {},
        labelControlOrders: {},
        valueCategories: {},
        appendControlsTo: appendControlsTo,
        insertIntoDOM: insertIntoDOM,
        attachDefinitionTooltip: attachDefinitionTooltip
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
        'container': 'container',
        'singleCellContainerLabel': 'singleCellContainerLabel'
    };

    Types.valueCategories =
    {
        'positive': 'positive',
        'neutral': 'neutral',
        'negative': 'negative'
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
            loadType: function(typeXML, _, kind, scopes)
            {
                let type = this;

                const rowsAttr = typeXML.attr('rows');
                if (rowsAttr)
                {
                    const rows = Utils.parseDecimalIntWithDefault(rowsAttr);
                    if (rows > 1)
                    {
                        type = $.extend({}, type, {
                            controlName: 'textarea',
                            labelControlOrder: Types.labelControlOrders.twoLineLabelContainer
                        });
                        delete type.controlType;
                    }
                    type = $.extend({}, type, { rows: rows });
                }

                const maxLengthAttr = typeXML.attr('maxLength');
                if (maxLengthAttr)
                {
                    type = $.extend({}, type, { maxLength: Utils.parseDecimalIntWithDefault(maxLengthAttr) });
                }

                const autoComplete = Utils.parseBool(typeXML.attr('autoComplete'));
                if (autoComplete)
                {
                    const autoCompleteControl = function(containerEl, autoCompleteList)
                    {
                        containerEl.children(type.controlName).autocomplete({ autoFocus: true, source: autoCompleteList });
                    };

                    type = $.extend({}, type, { autoComplete: autoComplete, autoCompleteControl: autoCompleteControl });
                }

                if ($(typeXML)[0].hasAttribute('markdown'))
                {
                    const markdown = typeXML.attr('markdown');
                    type = $.extend({}, type, { markdown: markdown ? markdown : "gfm" });
                }

                const defaultEl = typeXML.children('default');
                if (defaultEl.length > 0)
                {
                    type = $.extend({}, type, { defaultValue: defaultEl[0].textContent });
                }

                if (kind === 'property' && scopes.statementScope === 'independent')
                {
                    type = $.extend({}, type, { labelControlOrder: Types.labelControlOrders.twoLineLabelContainer });
                }

                return type;
            },
            loadTypeFromDOM: function(typeEl, defaultValueContainer)
            {
                const type = $.extend({}, this);
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
            insertTypeIntoDOM: function() {},
            castFrom: function(type, value)
            {
                return String(value);
            },
            appendControlTo: function(containerEl, htmlId)
            {
                let control;
                if (this.controlType)
                {
                    control = $('<' + this.controlName + '>', { id: htmlId, type: this.controlType, maxlength: this.maxLength, rows: this.rows });
                }
                else
                {
                    control = $('<' + this.controlName + '>', { id: htmlId, maxlength: this.maxLength, rows: this.rows });
                }

                containerEl.append(control);

                if (this.markdown) Utils.attachMarkdownTooltip(control);
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
            assignmentOperators: [Types.assignmentOperators.assign, Types.assignmentOperators.addAssign,
                Types.assignmentOperators.subtractAssign],
            relationalOperators: [Types.relationalOperators.equalTo, Types.relationalOperators.notEqualTo,
                Types.relationalOperators.greaterThanEqualTo, Types.relationalOperators.lessThanEqualTo,
                Types.relationalOperators.greaterThan, Types.relationalOperators.lessThan],
            unaryOperators: [Types.unaryOperators.atMinimum, Types.unaryOperators.atMaximum],
            equals: function(otherType)
            {
                return this.name === otherType.name;
            },
            appendTypeControlsTo: function(typeEl)
            {
                const minContainer = $('<span>', { class: "min-container" });
                const maxContainer = $('<span>', { class: "max-container" });

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
            loadType: function(typeXML, _, kind, scopes)
            {
                let type = this;

                const minimumAttr = typeXML.attr('minimum');
                if (minimumAttr)
                {
                    type = $.extend({}, type, { minimum: parseInt(minimumAttr) });
                }

                const maximumAttr = typeXML.attr('maximum');
                if (maximumAttr)
                {
                    type = $.extend({}, type, { maximum: parseInt(maximumAttr) });
                }

                const defaultEl = typeXML.children('default');
                if (defaultEl.length > 0)
                {
                    type = $.extend({}, type, { defaultValue: parseInt(defaultEl[0].textContent, 10) });
                }

                if (kind === 'property' && scopes.statementScope === 'independent')
                {
                    type = $.extend({}, type, { labelControlOrder: Types.labelControlOrders.twoLineLabelContainer });
                }

                return type;
            },
            loadTypeFromDOM: function(typeEl, defaultValueContainer)
            {
                const type = $.extend({}, this);
                const minimum = parseInt(typeEl.find(".min-container").children(type.controlName).first().val());
                if (!isNaN(minimum))
                {
                    type.minimum = minimum;
                }
                const maximum = parseInt(typeEl.find(".max-container").children(type.controlName).first().val());
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
                switch (type.name)
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
                const integerXML = Utils.appendChild(typeXML, this.name);
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
                const control = $('<' + this.controlName + '>', { id: htmlId, type: this.controlType, value: 0 });
                if (this.labelControlOrder !== Types.labelControlOrders.twoLineLabelContainer)
                {
                    control.css('width', 60);
                }
                containerEl.append(control);
            },
            getFromDOM: function(containerEl)
            {
                return Utils.parseDecimalIntWithDefault(containerEl.children(this.controlName).first().val(), 0);
            },
            setInDOM: function(containerEl, value)
            {
                containerEl.children(this.controlName).first().val(value);
            },
            fromXML: function(valueXML)
            {
                return parseInt(valueXML.textContent, 10);
            },
            toXML: toXMLSimple,
            categoriseValue: function(value)
            {
                if (value > 0) return Types.valueCategories.positive;
                else if (value < 0) return Types.valueCategories.negative;
                else return Types.valueCategories.neutral;
            },
            simplifyEffect: function(effect)
            {
                if (effect.operator === Types.assignmentOperators.addAssign.name)
                {
                    if (effect.value === 0) return null;
                    return effect;
                }
                else if (effect.operator === Types.assignmentOperators.subtractAssign.name)
                {
                    if (effect.value === 0) return null;
                    return { operator: Types.assignmentOperators.addAssign.name, value: -effect.value };
                }
                else
                {
                    return effect;
                }
            },
            summariseEffects: function(effects)
            {
                if (effects.length === 0) return null;
                return effects.reduce(function(summary, current)
                {
                    if (current.operator === Types.assignmentOperators.assign.name)
                    {
                        return current;
                    }
                    else if (current.operator === Types.assignmentOperators.addAssign.name)
                    {
                        return { operator: summary.operator, value: summary.value + current.value };
                    }
                    else if (current.operator === Types.assignmentOperators.subtractAssign.name)
                    {
                        return { operator: summary.operator, value: summary.value - current.value };
                    }
                });
            }
        },
        'boolean':
        {
            name: 'boolean',
            controlName: 'input',
            controlType: 'checkbox',
            labelControlOrder: Types.labelControlOrders.singleCellContainerLabel,
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
                let type = this;

                if (kind !== 'property')
                {
                    type = $.extend({}, type, { controlName: 'select', labelControlOrder: Types.labelControlOrders.singleLineLabelContainer });
                    delete type.controlType;
                }

                const defaultEl = typeXML.children('default');
                if (defaultEl.length > 0)
                {
                    type = $.extend({}, type, { defaultValue: Utils.parseBool(defaultEl[0].textContent) });
                }

                return type;
            },
            loadTypeFromDOM: function(typeEl, defaultValueContainer)
            {
                const type = $.extend({}, this, { controlName: 'select' });
                delete type.controlType;

                if (defaultValueContainer)
                {
                    type.defaultValue = type.getFromDOM(defaultValueContainer);
                }

                return type;
            },
            castFrom: function(type, value)
            {
                switch (type.name)
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
                let control;
                if (this.controlType)
                {
                    control = $('<' + this.controlName + '>', { id: htmlId, type: this.controlType });
                }
                else
                {
                    control = $('<' + this.controlName + '>', { id: htmlId });
                    control.append($('<option>', { value: String(false), text: i18next.t('types:primitives.boolean.false') }));
                    control.append($('<option>', { value: String(true), text: i18next.t('types:primitives.boolean.true') }));
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
            toXML: toXMLSimple,
            categoriseValue: function(value)
            {
                return value ? Types.valueCategories.positive : Types.valueCategories.negative;
            }
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
                let equal = true;
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
                const valuesContainer = $('<ul>', { class: "enumeration-values-container" }).appendTo(typeEl);
                const valueInput = $('<input>', { autofocus: true, type: 'text' });
                const appendValue = function(value)
                {
                    // The value of an enumeration can not be the empty string
                    if (value && value.trim())
                    {
                        const deleteButton = Parts.deleteButton();
                        deleteButton.on('click', function()
                        {
                            $(this).parent().remove();
                            valueInput.focus();
                        });

                        const valueItem = $('<li>').append($('<span>', { text: value }));
                        valueItem.append(deleteButton);
                        valueItem.insertBefore(valuesContainer.children().last());

                        valueInput.val("").focus();
                    }
                };
                const valueAddButton = Parts.addButton("", "add-enumeration-value");
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
            loadType: function(typeXML, id, kind, scopes)
            {
                const options = { sequence: [] };
                const addOption = function(index, optionXML)
                {
                    const value = $(optionXML).attr('value');
                    let text = optionXML.textContent;
                    if (!text && id)
                    {
                        text = i18next.t('configXML:' + ['type', this.name, id, value].join('.'));
                    }

                    if (value && !options.byValue)
                    {
                        options.byValue = {};
                    }

                    const option = { text: text };
                    if (value)
                    {
                        option.value = value;
                        options.byValue[option.value] = option;
                    }
                    options.sequence.push(option);
                };
                typeXML.children('option').each(addOption.bind(this));

                let defaultValue = options.byValue ? options.sequence[0].value : options.sequence[0].text;
                const defaultEl = typeXML.children('default');
                if (defaultEl.length > 0)
                {
                    const value = $(defaultEl).attr('value');
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

                let labelControlOrder = this.labelControlOrder;
                if (kind === 'property' && scopes.statementScope === 'independent')
                {
                    labelControlOrder = Types.labelControlOrders.twoLineLabelContainer;
                }

                return $.extend({ options: options }, this, { defaultValue: defaultValue, labelControlOrder: labelControlOrder });
            },
            loadTypeFromDOM: function(typeEl, defaultValueContainer)
            {
                const valuesContainer = typeEl.find(".enumeration-values-container");
                const options = { sequence: [] };
                if (valuesContainer.find("input[type=text]").val())
                {
                    valuesContainer.find(".add-enumeration-value").trigger("click");
                }
                valuesContainer.children().not(":last-child").each(function(index, valueItem)
                {
                    const option = { text: $(valueItem).children('span').text() };
                    options.sequence.push(option);
                });
                let defaultValue;
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
                let castValue = this.options.sequence[0].text;
                this.options.sequence.forEach(function(option)
                {
                    if (option.text === String(value)) castValue = option.text;
                });
                return castValue;
            },
            insertType: function(typeXML, detailed)
            {
                const enumerationXML = Utils.appendChild(typeXML, this.name);
                const appendOptionChild = function(option)
                {
                    const optionXML = Utils.appendChild(enumerationXML, 'option');
                    if (this.options.byValue && detailed)
                    {
                        optionXML.setAttribute('value', option.value);
                        this.toXML(optionXML, option.text);
                    }
                    else
                    {
                        this.toXML(optionXML, this.options.byValue ? option.value : option.text);
                    }
                };
                this.options.sequence.forEach(appendOptionChild.bind(this));
                return enumerationXML;
            },
            insertTypeIntoDOM: function(typeEl)
            {
                const valuesContainer = typeEl.find(".enumeration-values-container");
                const addValueButton = valuesContainer.find(".add-enumeration-value");
                this.options.sequence.forEach(function(option)
                {
                    valuesContainer.children().last().children('input').val(option.text);
                    addValueButton.trigger('click');
                });
                valuesContainer.children().last().children('input').val("");
            },
            appendControlTo: function(containerEl, htmlId)
            {
                const control = $('<' + this.controlName + '>', { id: htmlId });
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

    function appendControlsTo(containerEl, titleClassSelector, htmlClass, handleChange)
    {
        const typeSelect = $('<select>', { class: htmlClass });
        for (const typeName in Types.primitives)
        {
            typeSelect.append($('<option>', { value: typeName, text: i18next.t('types:primitives.' + typeName + '.translation') }));
        }

        const typeDefinitionContainer = $('<div>');
        let previousTypeName;
        typeSelect.on('change', function(e)
        {
            const newTypeName = $(this).val();
            const userTypeChange = e.originalEvent;

            let definitionButton = containerEl.find(".define-type");
            if (Types.primitives[newTypeName].appendTypeControlsTo)
            {
                if (previousTypeName !== newTypeName)
                {
                    typeDefinitionContainer.empty();
                    definitionButton.remove();

                    definitionButton = $('<button>', { class: "define-type" });
                    definitionButton.html(Utils.sIcon(newTypeName === Types.primitives.enumeration.name ? "icon-list" : "icon-cog"));
                    definitionButton.on('click', function()
                    {
                        const title = containerEl.parent().find(titleClassSelector).val();
                        dialog(title, typeDefinitionContainer, typeSelect, previousTypeName, newTypeName, handleChange, false);
                    });
                    containerEl.append(definitionButton);

                    Types.primitives[newTypeName].appendTypeControlsTo(typeDefinitionContainer);
                }

                const type = Types.primitives[newTypeName].loadTypeFromDOM(typeDefinitionContainer);
                if (userTypeChange && newTypeName === Types.primitives.enumeration.name)
                {
                    typeDefinitionContainer.show();
                    const title = containerEl.parent().find(titleClassSelector).val();
                    dialog(title, typeDefinitionContainer, typeSelect, previousTypeName, newTypeName, handleChange, true);
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
        const typeSelect = containerEl.find("." + htmlClass);
        typeSelect.val(type.name).trigger('change');
        if (type.insertTypeIntoDOM)
        {
            type.insertTypeIntoDOM(typeSelect.parent());
            typeSelect.trigger('change');
        }
    }

    function attachDefinitionTooltip(containerEl, type)
    {
        const tooltipContent = $('<div>').append($('<b>', { text: i18next.t('types:primitives.' + type.name + '.definition.define') }));
        if (type.name === Types.primitives.integer.name)
        {
            if (type.minimum !== undefined)
            {
                tooltipContent.append($('<br>'), $('<span>', { text: i18next.t('common:minimum') + ': ' + type.minimum }));
            }
            if (type.maximum !== undefined)
            {
                tooltipContent.append($('<br>'), $('<span>', { text: i18next.t('common:maximum') + ': ' + type.maximum }));
            }
        }
        const defineTypeButton = containerEl.find(".define-type");
        if (defineTypeButton.tooltip('instance'))
        {
            defineTypeButton.tooltip('option', 'content', tooltipContent);
        }
        else
        {
            defineTypeButton.tooltip(
            {
                items: 'button:hover',
                content: tooltipContent,
                create: function() { $(this).data("ui-tooltip").liveRegion.remove(); }
            });
        }
    }

    function dialog(title, containerEl, typeSelect, previousTypeName, newTypeName, handleChange, isFirstTimeForEnumeration)
    {
        const currentType = Types.primitives[newTypeName].loadTypeFromDOM(containerEl);
        let hasValues;
        if (newTypeName === Types.primitives.enumeration.name)
        {
            hasValues = currentType.options.sequence.length > 0;
        }

        let confirmed = false;
        containerEl.dialog(
        {
            title: title || i18next.t('types:primitives.' + newTypeName + '.definition.title'),
            height: 'auto',
            width: 'auto',
            modal: true,
            buttons:
            [
                {
                    text: i18next.t('common:confirm'),
                    click: function()
                    {
                        if (newTypeName === Types.primitives.enumeration.name)
                        {
                            const newType = Types.primitives[newTypeName].loadTypeFromDOM(containerEl);
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
                }
            ],
            beforeClose: function()
            {
                if (confirmed && newTypeName === Types.primitives.enumeration.name && !hasValues)
                {
                    confirmed = false;

                    Utils.alertDialog(i18next.t('types:primitives.enumeration.definition.no_values'), 'warning');
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
