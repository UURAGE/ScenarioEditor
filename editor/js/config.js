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
            settings.statement.type = loadType(statementSettingXML.children().eq(0));
        }
        else
        {
            settings.statement.type = Config.types.string;
        }
        return settings;
    }

    function loadNode(nodeXML, nodeName, parentScopes)
    {
        if (nodeXML.nodeName === nodeName)
        {
            var nodeScopes = loadScopes(nodeXML);
            mergeScopes(nodeScopes, parentScopes);
            return {
                kind: nodeName,
                id: nodeXML.getAttribute('id'),
                name: nodeXML.getAttribute('name'),
                description: $(nodeXML).children('description').text(),
                scopes: nodeScopes,
                type: loadType($(nodeXML).children().last())
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

    function loadType(typeXML)
    {
        var typeName = typeXML[0].nodeName.substr('type'.length).toLowerCase();
        return Config.types[typeName].loadType(typeXML);
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
        return { id: nodeXML.getAttribute('id'), properties: properties, parameters: parameters};
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
                return appendChild(typeXML, 'typeString');
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
                return appendChild(typeXML, 'typeInteger');
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
                return appendChild(typeXML, 'typeBoolean');
            },
            appendControlTo: function(containerEl, htmlId)
            {
                var booleanSelect = $('<select>', { id: htmlId });
                booleanSelect.append($('<option>', { value: String(false), text: LanguageManager.sLang("edt_config_types_boolean_false") }));
                booleanSelect.append($('<option>', { value: String(true),  text: LanguageManager.sLang("edt_config_types_boolean_true")  }));
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
            loadType: function(typeXML)
            {
                var values = [];
                typeXML.children('option').each(function(index, valueXML)
                {
                    values.push(valueXML.textContent);
                });

                var defaultValue = values[0];
                var defaultEl = typeXML.children('default');
                if (defaultEl.length > 0 && values.indexOf(defaultEl[0].textContent) !== -1)
                {
                    defaultValue = defaultEl[0].textContent;
                }

                return $.extend({ values: values }, this, { defaultValue: defaultValue });
            },
            loadTypeFromDOM: function(typeEl, defaultValueContainer)
            {
                var values = [];
                typeEl.find(".enumeration-value-list").children().each(function(index, valueItem)
                {
                    values.push($(valueItem).text());
                });
                var defaultValue = defaultValueContainer.length ? this.getFromDOM(defaultValueContainer) : values[0];
                return $.extend({ values: values }, this, { defaultValue: defaultValue });
            },
            castFrom: function(type, value)
            {
                var index = this.values.indexOf(String(value));
                if (index !== -1) return this.values[index];
                else              return this.values[0];
            },
            insertType: function(typeXML)
            {
                var enumerationXML = appendChild(typeXML, 'typeEnumeration');
                var appendOptionChild = function(value)
                {
                    var optionXML = appendChild(enumerationXML, 'option');
                    this.toXML(optionXML, value);
                };
                this.values.forEach(appendOptionChild.bind(this));
                return enumerationXML;
            },
            appendControlTo: function(containerEl, htmlId)
            {
                var selectEl = $('<select>', { id: htmlId });
                this.values.forEach(function(value)
                {
                    selectEl.append($('<option>', { text: value, value: value }));
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

    function getNewDefaultParameterEffects()
    {
        var parameterEffects = {};
        parameterEffects.userDefined = [];
        parameterEffects.fixed = {};
        parameterEffects.fixed.characterIndependent = {};
        parameterEffects.fixed.perCharacter = {};
        for (var characterId in Config.configObject.characters.byId)
        {
            parameterEffects.fixed.perCharacter[characterId] = {};
        }
        return parameterEffects;
    }

    function getNewDefaultPropertyValues(acceptableStatementScopes)
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
            propertyValues.perCharacter[characterId] = {};
            for (propertyId in Config.configObject.characters.properties.byId)
            {
                if (acceptableStatementScopes.indexOf(Config.configObject.characters.properties.byId[propertyId].scopes.statementScope) === -1) continue;
                propertyValues.perCharacter[characterId][propertyId] = Config.configObject.characters.properties.byId[propertyId].type.defaultValue;
            }
            for (propertyId in Config.configObject.characters.byId[characterId].properties.byId)
            {
                if (acceptableStatementScopes.indexOf(Config.configObject.characters.byId[characterId].properties.byId[propertyId].scopes.statementScope) === -1) continue;
                propertyValues.perCharacter[characterId][propertyId] = Config.configObject.characters.byId[characterId].properties.byId[propertyId].type.defaultValue;
            }
        }

        return propertyValues;
    }

})();
