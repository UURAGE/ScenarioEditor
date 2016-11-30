/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

var Config;

(function ()
{
    "use strict";

    Config =
    {
        configObject: {},
        types: {},
        assignmentOperators: {},
        relationalOperators: {},
        atLeastOneParameter: atLeastOneParameter,
        getNewDefaultParameterEffects: getNewDefaultParameterEffects,
        getNewDefaultPropertyValues: getNewDefaultPropertyValues
    };

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
        settings.statement = {};
        var statementSettingXML = settingsXML.children('statement');
        if (statementSettingXML.length > 0)
        {
            settings.statement.type = loadType(statementSettingXML.children('type').children());
        }
        else
        {
            settings.statement.type = Config.types.string;
        }
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
                type: loadType($(nodeXML).children('type').children(), id)
            };
        }
        else if (nodeXML.nodeName === nodeName + "Section")
        {
            var subResult = loadCollection($(nodeXML), nodeName, 'section', parentScopes);
            subResult.name = nodeXML.getAttribute('name');
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

    function loadType(typeXML, id)
    {
        var typeName = typeXML[0].nodeName;
        return Config.types[typeName].loadType(typeXML, id);
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

    function appendChild(parentXML, name)
    {
        return parentXML.appendChild(document.createElementNS(parentXML.namespaceURI, name));
    }

    function toXMLSimple(valueXML, value)
    {
        valueXML.textContent = value;
    }

    Config.types =
    {
        'string':
        {
            name: 'string',
            defaultValue: "",
            assignmentOperators: [Config.assignmentOperators.assign],
            relationalOperators: [Config.relationalOperators.equalTo, Config.relationalOperators.notEqualTo],
            loadType: function(typeXML)
            {
                var type = this;

                var maxLengthAttr = typeXML.attr('maxLength');
                if (maxLengthAttr)
                {
                    type = $.extend({}, type, { maxLength: Utils.parseDecimalIntWithDefault(maxLengthAttr) });
                }

                var autoComplete = Utils.parseBool(typeXML.attr('autoComplete'));
                if (autoComplete)
                {
                    type = $.extend({}, type, { autoComplete: autoComplete });
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
                return appendChild(typeXML, 'string');
            },
            castFrom: function(type, value)
            {
                return String(value);
            },
            appendControlTo: function(containerEl, htmlId)
            {
                containerEl.append($('<input>', { id: htmlId, type: 'text', maxlength: this.maxLength }));
            },
            getFromDOM: function(containerEl)
            {
                return containerEl.children('input').first().val();
            },
            setInDOM: function(containerEl, value)
            {
                containerEl.children('input').first().val(value);
            },
            fromXML: function(valueXML)
            {
                return valueXML.textContent;
            },
            toXML: toXMLSimple
        },
        'integer':
        {
            name: 'integer',
            defaultValue: 0,
            assignmentOperators: [Config.assignmentOperators.assign,             Config.assignmentOperators.addAssign,
                                  Config.assignmentOperators.subtractAssign],
            relationalOperators: [Config.relationalOperators.equalTo,                Config.relationalOperators.notEqualTo,
                                  Config.relationalOperators.greaterThanEqualTo,     Config.relationalOperators.lessThanEqualTo,
                                  Config.relationalOperators.greaterThan,            Config.relationalOperators.lessThan],
            loadType: function(typeXML)
            {
                var type = this;

                var minimumAttr = typeXML.attr('minimum');
                if (minimumAttr)
                {
                    type = $.extend({}, type, { minimum: Utils.parseDecimalIntWithDefault(minimumAttr) });
                }

                var maximumAttr = typeXML.attr('maximum');
                if (maximumAttr)
                {
                    type = $.extend({}, type, { maximum: Utils.parseDecimalIntWithDefault(maximumAttr) });
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
                return $.extend({}, this, { defaultValue: this.getFromDOM(defaultValueContainer) });
            },
            castFrom: function(type, value)
            {
                switch(type.name)
                {
                    case "string": return Utils.parseDecimalIntWithDefault(value, 0);
                    case "integer": return value;
                    case "boolean": return Number(value);
                    case "enumeration": return Utils.parseDecimalIntWithDefault(value, 0);
                    default: return value;
                }
            },
            insertType: function(typeXML)
            {
                return appendChild(typeXML, 'integer');
            },
            appendControlTo: function(containerEl, htmlId)
            {
                containerEl.append($('<input>', { id: htmlId, type: 'number', value: this.minimum ? this.minimum : 0, min: this.minimum, max: this.maximum }));
            },
            getFromDOM: function(containerEl)
            {
                var value = Utils.parseDecimalIntWithDefault(containerEl.children('input').first().val(), this.minimum ? this.minimum : 0);
                if (this.minimum) value = Math.max(value, this.minimum);
                if (this.maximum) value = Math.min(value, this.maximum);
                return value;
            },
            setInDOM: function(containerEl, value)
            {
                containerEl.children('input').first().val(value);
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
            defaultValue: false,
            assignmentOperators: [Config.assignmentOperators.assign],
            relationalOperators: [Config.relationalOperators.equalTo, Config.relationalOperators.notEqualTo],
            loadType: function(typeXML)
            {
                var defaultEl = typeXML.children('default');
                if (defaultEl.length > 0) return $.extend({}, this, { defaultValue: Utils.parseBool(defaultEl[0].textContent) });
                else                      return this;
            },
            loadTypeFromDOM: function(typeEl, defaultValueContainer)
            {
                return $.extend({}, this, { defaultValue: this.getFromDOM(defaultValueContainer) });
            },
            castFrom: function(type, value)
            {
                switch(type.name)
                {
                    case "string": return Utils.parseBool(value.toLowerCase());
                    case "integer": return Boolean(value);
                    case "boolean": return value;
                    case "enumeration": return Utils.parseBool(value.toLowerCase());
                    default: return value;
                }
            },
            insertType: function(typeXML)
            {
                return appendChild(typeXML, 'boolean');
            },
            appendControlTo: function(containerEl, htmlId)
            {
                var booleanSelect = $('<select>', { id: htmlId });
                booleanSelect.append($('<option>', { value: String(false), text: i18next.t('config:types.boolean.false') }));
                booleanSelect.append($('<option>', { value: String(true),  text: i18next.t('config:types.boolean.true') }));
                containerEl.append(booleanSelect);
            },
            getFromDOM: function(containerEl)
            {
                return Utils.parseBool(containerEl.children('select').first().val());
            },
            setInDOM: function(containerEl, value)
            {
                containerEl.children('select').first().val(String(value));
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
            defaultValue: "",
            assignmentOperators: [Config.assignmentOperators.assign],
            relationalOperators: [Config.relationalOperators.equalTo, Config.relationalOperators.notEqualTo],
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
                var defaultValue = defaultValueContainer.length ? this.getFromDOM(defaultValueContainer) : options.sequence[0].text;
                return $.extend({ options: options }, this, { defaultValue: defaultValue });
            },
            castFrom: function(type, text)
            {
                // Only called for user-defined parameters
                var castValue = this.options.sequence[0].text;
                this.options.sequence.forEach(function(option)
                {
                    if (option.text === text)
                        castValue = option.text;
                });
                return castValue;
            },
            insertType: function(typeXML)
            {
                var enumerationXML = appendChild(typeXML, 'enumeration');
                var appendOptionChild = function(option)
                {
                    var optionXML = appendChild(enumerationXML, 'option');
                    this.toXML(optionXML, this.options.byValue ? option.value : option.text);
                };
                this.options.sequence.forEach(appendOptionChild.bind(this));
                return enumerationXML;
            },
            appendControlTo: function(containerEl, htmlId)
            {
                var selectEl = $('<select>', { id: htmlId });
                this.options.sequence.forEach(function(option)
                {
                    selectEl.append($('<option>', option));
                });
                containerEl.append(selectEl);
            },
            getFromDOM: function(containerEl)
            {
                return containerEl.children('select').first().val();
            },
            setInDOM: function(containerEl, value)
            {
                containerEl.children('select').first().val(value);
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

    function getNewDefaultParameterEffects(characterIdRef)
    {
        var parameterEffects = {};
        parameterEffects.userDefined = [];
        parameterEffects.fixed = {};
        parameterEffects.fixed.characterIndependent = {};
        var parameterId;
        for (parameterId in Config.configObject.parameters.byId)
        {
            parameterEffects.fixed.characterIndependent[parameterId] = [];
        }
        parameterEffects.fixed.perCharacter = {};
        for (var characterId in Config.configObject.characters.byId)
        {
            parameterEffects.fixed.perCharacter[characterId] = {};

            var statementScope;
            for (parameterId in Config.configObject.characters.parameters.byId)
            {
                statementScope = Config.configObject.characters.parameters.byId[parameterId].scopes.statementScope;
                if (statementScope === 'per-computer-own' && characterId !== characterIdRef) continue;
                parameterEffects.fixed.perCharacter[characterId][parameterId] = [];
            }
            for (parameterId in Config.configObject.characters.byId[characterId].parameters.byId)
            {
                statementScope = Config.configObject.characters.byId[characterId].parameters.byId[parameterId].scopes.statementScope;
                if (statementScope === 'per-computer-own' && characterId !== characterIdRef) continue;
                parameterEffects.fixed.perCharacter[characterId][parameterId] = [];
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
