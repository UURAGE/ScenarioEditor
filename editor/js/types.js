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
        labelControlOrders: {}
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
                return $.extend({}, this, { defaultValue: this.getFromDOM(defaultValueContainer) });
            },
            insertType: function(typeXML)
            {
                return Utils.appendChild(typeXML, this.name);
            },
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
                var type = $.extend({}, this, { defaultValue: this.getFromDOM(defaultValueContainer) });
                var minimum = parseInt(typeEl.find(".parameter-min-container").children(type.controlName).first().val());
                if (!isNaN(minimum)) type.minimum = minimum;
                var maximum = parseInt(typeEl.find(".parameter-max-container").children(type.controlName).first().val());
                if (!isNaN(maximum)) type.maximum = maximum;
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
            loadType: function(typeXML, id, kind)
            {
                var type = this;

                if (kind === 'parameter')
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
            loadTypeFromDOM: function(typeEl, defaultValueContainer, kind)
            {
                var type = $.extend({}, this);
                if (kind === 'parameter')
                {
                    type.controlName = 'select';
                    delete type.controlType;
                }
                type.defaultValue = type.getFromDOM(defaultValueContainer);
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
                typeEl.find(".enumeration-value-list").children().each(function(index, valueItem)
                {
                    var option = { text: $(valueItem).text() };
                    options.sequence.push(option);
                });
                var defaultValue = defaultValueContainer.length > 0 ? this.getFromDOM(defaultValueContainer) : options.sequence[0].text;
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
})();
