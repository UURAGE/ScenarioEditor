/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

var Config;

(function ()
{
    "use strict";

    Config =
    {
        configObject: {},
        types: {},
        extensionTypes: {},
        assignmentOperators: {},
        relationalOperators: {},
        unaryOperators: {},
        labelControlOrders: {},
        additionalNameSpaces: {},
        atLeastOneParameter: atLeastOneParameter,
        findParameterById: findParameterById,
        isCharacterParameter: isCharacterParameter,
        getNewDefaultParameterEffects: getNewDefaultParameterEffects,
        getNewDefaultPropertyValues: getNewDefaultPropertyValues
    };

    var configNameSpace = "http://uurage.github.io/ScenarioEditor/config/namespace";

    // The default scopes used when there is no statementScope attribute specified for the property in the config
    var defaultPropertyScopes = { statementScope: 'independent' };
    // The default collection used when the property collection is not present in the XML
    var defaultPropertyCollection = { kind: 'toplevel', scopes: defaultPropertyScopes, sequence: [], byId: {} };

    // The default scopes used when there is no statementScope attribute specified for the parameter in the config
    var defaultParameterScopes = { statementScope: 'per' };
    // The default collection used when the parameter collection is not present in the XML
    var defaultParameterCollection = { kind: 'toplevel', scopes: defaultParameterScopes, sequence: [], byId: {} };

    $(document).ready(loadConfig);

    function loadConfig()
    {
        // The config.xml is loaded into the DOM on the server-side, so we can parse the XML from the DOM
        var configXML = $($.parseXML($('#config').text())).children('config');
        if (!configXML.length)
        {
            alert("The configuration for the editor was not loaded");
            return;
        }

        var config = {};
        config.id = configXML.attr('id');
        config.version = configXML.attr('version');
        config.settings = loadSettings(configXML.children('settings'));
        config.properties = loadCollection(configXML.children('properties'), 'property', 'toplevel', defaultPropertyScopes);
        config.parameters = loadCollection(configXML.children('parameters'), 'parameter', 'toplevel', defaultParameterScopes);

        if (configXML.children('character').length === 1)
        {
            config.characters = { parameters: $.extend({}, defaultParameterCollection), properties: $.extend({}, defaultPropertyCollection), byId: {} };
            var character = loadCharacterNode(configXML.children('character')[0]);
            config.characters.byId[character.id] = character;
            config.characters.sequence = [character];
        }
        else
        {
            config.characters = loadCharacterCollection(configXML.children('characters'));
        }

        config.migration = loadMigration(configXML.children('migration'), config.properties, config.parameters, config.characters);

        Config.configObject = config;
    }

    function loadSettings(settingsXML)
    {
        var settings = {};

        var loadSettingWithType = function(settingXML)
        {
            if (settingXML.length > 0)
            {
                return { type: loadType(settingXML.children('type').children()) };
            }
            else
            {
                return { type: Config.types.string };
            }
        };

        settings.statement = loadSettingWithType(settingsXML.children('statement'));
        settings.description = loadSettingWithType(settingsXML.children('description'));

        settings.languages = {};
        settings.languages.sequence = [];
        settings.languages.byCode = {};
        var languageSettingsXML = settingsXML.children('languages');
        if (languageSettingsXML.length > 0)
        {
            languageSettingsXML.children().each(function(index, languageSettingXML)
            {
                var languageName = $(languageSettingXML).text();
                var languageCode = languageSettingXML.getAttribute('code');
                if (!languageName) languageName = i18next.t('configXML:language.' + languageCode);
                var language = { code: languageCode, name: languageName };
                settings.languages.byCode[language.code] = language;
                settings.languages.sequence.push(language);
            });
        }

        return settings;
    }

    function loadNode(nodeXML, nodeName, parentScopes)
    {
        if (nodeXML.nodeName === nodeName)
        {
            var nodeScopes = loadScopes(nodeXML);
            mergeScopes(nodeScopes, parentScopes);
            var id = nodeXML.getAttribute('id');
            var name = nodeXML.getAttribute('name');
            if (!name) name = i18next.t('configXML:' + nodeName + '.' + id);
            return {
                kind: nodeName,
                id: id,
                name: name,
                description: $(nodeXML).children('description').text(),
                scopes: nodeScopes,
                type: loadType($(nodeXML).children('type').children(), id, nodeName)
            };
        }
        else if (nodeXML.nodeName === nodeName + "Section")
        {
            var subResult = loadCollection($(nodeXML), nodeName, 'section', parentScopes);
            subResult.name = nodeXML.getAttribute('name');
            if (!subResult.name) subResult.name = i18next.t('configXML:section.' + nodeXML.getAttribute('id'));
            return subResult;
        }
        else
        {
            return loadCollection($(nodeXML), nodeName, 'group', parentScopes);
        }
    }

    function loadCollection(collectionXML, nodeName, kind, parentScopes)
    {
        var collectionScopes = loadScopes(collectionXML[0]);
        mergeScopes(collectionScopes, parentScopes);

        var sequence = [];
        var byId = {};
        collectionXML.children().each(function (index, childXML)
        {
            var subResult = loadNode(childXML, nodeName, collectionScopes);
            if (subResult.kind === nodeName)
            {
                sequence.push(subResult);
                byId[subResult.id] = subResult;
            }
            else if (subResult.kind === 'group')
            {
                sequence = sequence.concat(subResult.sequence);
                $.extend(byId, subResult.byId);
            }
            else if (subResult.kind === 'section')
            {
                sequence.push(subResult);
                $.extend(byId, subResult.byId);
            }
        });
        return { kind: kind, scopes: collectionScopes, sequence: sequence, byId: byId };
    }

    function loadScopes(scopedXML)
    {
        return { statementScope: scopedXML.getAttribute('statementScope') };
    }

    // Merges the parent's scopes and it's local scopes
    // The local scope always has precedence over the parent scope
    function mergeScopes(localScopes, parentScopes)
    {
        for (var scopeName in parentScopes)
        {
            if (!localScopes[scopeName])
            {
                localScopes[scopeName] = parentScopes[scopeName];
            }
        }
    }

    function loadType(typeXML, id, kind)
    {
        var nameSpace = typeXML[0].namespaceURI;
        var type = nameSpace === configNameSpace ?
            Config.types[typeXML[0].localName] :
            Config.extensionTypes[nameSpace][typeXML[0].localName];
        return type.loadType(typeXML, id, kind);
    }

    function loadCharacterCollection(collectionXML)
    {
        var characters = {};
        characters.sequence = [];
        characters.byId = {};
        collectionXML.children('character').each(function(index, childXML)
        {
            var character = loadCharacterNode(childXML);
            characters.sequence.push(character);
            characters.byId[character.id] = character;
        });
        characters.properties = loadCollectionOrDefault($(collectionXML).children('properties'), 'property', defaultPropertyCollection, defaultPropertyScopes);
        characters.parameters = loadCollectionOrDefault($(collectionXML).children('parameters'), 'parameter', defaultParameterCollection, defaultParameterScopes);
        return characters;
    }

    function loadCharacterNode(nodeXML)
    {
        var properties = loadCollectionOrDefault($(nodeXML).children('properties'), 'property', defaultPropertyCollection, defaultPropertyScopes);
        var parameters = loadCollectionOrDefault($(nodeXML).children('parameters'), 'parameter', defaultParameterCollection, defaultParameterScopes);

        var id = nodeXML.getAttribute('id');
        var name = nodeXML.getAttribute('name');
        if (!name && i18next.exists('configXML:character.' + id))
        {
            name = i18next.t('configXML:character.' + id);
        }
        return { id: id, name: name, properties: properties, parameters: parameters};
    }

    function loadCollectionOrDefault(collectionXML, nodeName, defaultCollection, defaultScopes)
    {
        var collection = {};
        if (collectionXML.length > 0)
        {
            collection = loadCollection(collectionXML, nodeName, 'toplevel', defaultScopes);
        }
        else
        {
            $.extend(collection, defaultCollection);
        }
        return collection;
    }

    function loadMigration(migrationXML, properties, parameters, characters)
    {
        var migration = {};
        if (migrationXML.length > 0)
        {
            var intentPropertyXML = migrationXML.children('intentProperty').eq(0);
            if (intentPropertyXML.length > 0)
            {
                migration.intentProperty = { idRef: intentPropertyXML[0].getAttribute('idref') };
            }
        }
        return migration;
    }

    Config.assignmentOperators =
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

    Config.relationalOperators =
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

    Config.unaryOperators =
    {
        'atMinimum':
        {
            name: 'atMinimum',
            uiName: i18next.t('config:minimal')
        },
        'atMaximum':
        {
            name: 'atMaximum',
            uiName: i18next.t('config:maximal')
        }
    };

    Config.labelControlOrders =
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

    Config.types =
    {
        'string':
        {
            name: 'string',
            controlName: 'input',
            controlType: 'text',
            labelControlOrder: Config.labelControlOrders.singleLineLabelContainer,
            defaultValue: "",
            assignmentOperators: [Config.assignmentOperators.assign],
            relationalOperators: [Config.relationalOperators.equalTo, Config.relationalOperators.notEqualTo],
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
            labelControlOrder: Config.labelControlOrders.singleLineLabelContainer,
            defaultValue: 0,
            assignmentOperators: [Config.assignmentOperators.assign,             Config.assignmentOperators.addAssign,
                                  Config.assignmentOperators.subtractAssign],
            relationalOperators: [Config.relationalOperators.equalTo,                Config.relationalOperators.notEqualTo,
                                  Config.relationalOperators.greaterThanEqualTo,     Config.relationalOperators.lessThanEqualTo,
                                  Config.relationalOperators.greaterThan,            Config.relationalOperators.lessThan],
            unaryOperators: [Config.unaryOperators.atMinimum, Config.unaryOperators.atMaximum],
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
                    case Config.types.string.name: return Utils.parseDecimalIntWithDefault(value, 0);
                    case Config.types.integer.name: return value;
                    case Config.types.boolean.name: return Number(value);
                    case Config.types.enumeration.name: return Utils.parseDecimalIntWithDefault(value, 0);
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
            labelControlOrder: Config.labelControlOrders.singleLineContainerLabel,
            defaultValue: false,
            assignmentOperators: [Config.assignmentOperators.assign],
            relationalOperators: [Config.relationalOperators.equalTo, Config.relationalOperators.notEqualTo],
            unaryOperators: [],
            loadType: function(typeXML, id, kind)
            {
                var type = this;

                if (kind === 'parameter')
                {
                    type = $.extend({}, type, { controlName: 'select', labelControlOrder: Config.labelControlOrders.singleLineLabelContainer });
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
                    case Config.types.string.name: return Utils.parseBool(value.toLowerCase());
                    case Config.types.integer.name: return Boolean(value);
                    case Config.types.boolean.name: return value;
                    case Config.types.enumeration.name: return Utils.parseBool(value.toLowerCase());
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
                    control.append($('<option>', { value: String(false), text: i18next.t('config:types.boolean.false') }));
                    control.append($('<option>', { value: String(true),  text: i18next.t('config:types.boolean.true') }));
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
            labelControlOrder: Config.labelControlOrders.singleLineLabelContainer,
            defaultValue: "",
            assignmentOperators: [Config.assignmentOperators.assign],
            relationalOperators: [Config.relationalOperators.equalTo, Config.relationalOperators.notEqualTo],
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
                        text = i18next.t(['configXML:type', this.name, id, value].join('.'));
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
                var defaultValue = options.sequence.length > 0 ? options.sequence[0].text : this.getFromDOM(defaultValueContainer);
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

    function atLeastOneParameter()
    {
        var atLeastOnePerCharacterParameter;
        for (var characterId in Config.configObject.characters.byId)
        {
            if (Config.configObject.characters.byId[characterId].parameters.sequence.length > 0)
            {
                atLeastOnePerCharacterParameter = true;
                break;
            }
        }
        return Config.configObject.parameters.sequence.length > 0 || Config.configObject.characters.parameters.sequence.length > 0 || atLeastOnePerCharacterParameter;
    }

    function findParameterById(parameterId, characterId)
    {
        var parameter;
        if (!characterId && parameterId in Metadata.metaObject.parameters.byId)
        {
            parameter = Metadata.metaObject.parameters.byId[parameterId];
        }
        else if (!characterId && parameterId in Config.configObject.parameters.byId)
        {
            parameter = Config.configObject.parameters.byId[parameterId];
        }
        else if (parameterId in Config.configObject.characters.parameters.byId)
        {
            parameter = Config.configObject.characters.parameters.byId[parameterId];
        }
        else
        {
            if (characterId)
            {
                if (parameterId in Config.configObject.characters.byId[characterId].parameters.byId)
                {
                    parameter = Config.configObject.characters.byId[characterId].parameters.byId[parameterId];
                }
            }
            else
            {
                Config.configObject.characters.sequence.some(function(character)
                {
                    if (parameterId in Config.configObject.characters.byId[character.id].parameters.byId)
                    {
                        parameter = Config.configObject.characters.byId[character.id].parameters.byId[parameterId];
                        return true;
                    }
                    return false;
                });
            }
        }
        return parameter;
    }

    function isCharacterParameter(parameterId)
    {
        return parameterId in Config.configObject.characters.parameters.byId ||
        Config.configObject.characters.sequence.some(function(character)
        {
            return parameterId in Config.configObject.characters.byId[character.id].parameters.byId;
        });
    }

    function getNewDefaultParameterEffects(characterIdRef)
    {
        var parameterEffects = { userDefined: [], fixed: {} };
        parameterEffects.fixed.characterIndependent = { byId: {}, sequence: [] };
        var parameterId;
        for (parameterId in Config.configObject.parameters.byId)
        {
            parameterEffects.fixed.characterIndependent.byId[parameterId] = [];
        }
        parameterEffects.fixed.perCharacter = { };
        for (var characterId in Config.configObject.characters.byId)
        {
            parameterEffects.fixed.perCharacter[characterId] = { byId: {}, sequence: [] };

            var statementScope;
            for (parameterId in Config.configObject.characters.parameters.byId)
            {
                statementScope = Config.configObject.characters.parameters.byId[parameterId].scopes.statementScope;
                if (statementScope === 'per-computer-own' && characterId !== characterIdRef) continue;
                parameterEffects.fixed.perCharacter[characterId].byId[parameterId] = [];
            }
            for (parameterId in Config.configObject.characters.byId[characterId].parameters.byId)
            {
                statementScope = Config.configObject.characters.byId[characterId].parameters.byId[parameterId].scopes.statementScope;
                if (statementScope === 'per-computer-own' && characterId !== characterIdRef) continue;
                parameterEffects.fixed.perCharacter[characterId].byId[parameterId] = [];
            }
        }
        return parameterEffects;
    }

    function getNewDefaultPropertyValues(acceptableStatementScopes, characterIdRef)
    {
        var propertyValues = {};
        var propertyId;

        propertyValues.characterIndependent = {};
        for (propertyId in Config.configObject.properties.byId)
        {
            if (acceptableStatementScopes.indexOf(Config.configObject.properties.byId[propertyId].scopes.statementScope) === -1) continue;
            propertyValues.characterIndependent[propertyId] = Config.configObject.properties.byId[propertyId].type.defaultValue;
        }

        propertyValues.perCharacter = {};
        for (var characterId in Config.configObject.characters.byId)
        {
            var statementScope;
            propertyValues.perCharacter[characterId] = {};
            for (propertyId in Config.configObject.characters.properties.byId)
            {
                statementScope = Config.configObject.characters.properties.byId[propertyId].scopes.statementScope;
                if (acceptableStatementScopes.indexOf(statementScope) === -1) continue;
                if (statementScope === 'per-computer-own' && characterId !== characterIdRef) continue;
                propertyValues.perCharacter[characterId][propertyId] = Config.configObject.characters.properties.byId[propertyId].type.defaultValue;
            }
            for (propertyId in Config.configObject.characters.byId[characterId].properties.byId)
            {
                statementScope = Config.configObject.characters.byId[characterId].properties.byId[propertyId].scopes.statementScope;
                if (acceptableStatementScopes.indexOf(statementScope) === -1) continue;
                if (statementScope === 'per-computer-own' && characterId !== characterIdRef) continue;
                propertyValues.perCharacter[characterId][propertyId] = Config.configObject.characters.byId[characterId].properties.byId[propertyId].type.defaultValue;
            }
        }

        return propertyValues;
    }

})();
