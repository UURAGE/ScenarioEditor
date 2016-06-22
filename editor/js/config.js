/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

var Config;

(function ()
{
    Config =
    {
        configObject: {},
        types: {},
        relationalOperators: {},
        atLeastOneParameter: atLeastOneParameter,
        getNewDefaultParameterEffects: getNewDefaultParameterEffects,
        getNewDefaultPropertyValues: getNewDefaultPropertyValues
    };

    var defaultPropertyScopes = { statementScope: 'independent' };
    var defaultPropertyCollection = { kind: 'toplevel', scopes: defaultPropertyScopes, sequence: [], byId: {} };

    var defaultParameterScopes = { statementScope: 'per' };
    var defaultParameterCollection = { kind: 'toplevel', scopes: defaultParameterScopes, sequence: [], byId: {} };

    $(document).ready(loadConfig);

    function loadConfig()
    {
        var configXML = $($.parseXML($('#config').text())).children('config');
        var config = {};
        config.id = configXML.attr('id');

        config.properties = loadCollection(configXML.children('properties'), 'property', 'toplevel', defaultPropertyScopes);
        config.parameters = loadCollection(configXML.children('parameters'), 'parameter', 'toplevel', defaultParameterScopes);

        if (configXML.children('character').length === 1)
        {
            config.characters = { properties: $.extend({}, defaultPropertyCollection), byId: {} };
            var character = loadCharacterNode(configXML.children('character')[0]);
            config.characters.byId[character.id] = character;
            config.characters.sequence = [character];
        }
        else
        {
            config.characters = loadCharacterCollection(configXML.children('characters'));
        }

        Config.configObject = config;
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
                description: nodeXML.getAttribute('description'),
                optional: Utils.parseBool(nodeXML.getAttribute('optional')),
                scopes: nodeScopes,
                type: loadType($(nodeXML).children().eq(0))
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
            assignmentOperators: ['set'],
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
            castTo: function(type, value)
            {
                switch(type.name)
                {
                    case "string": return value;
                    case "integer": return Utils.parseDecimalIntWithDefault(value, 0);
                    case "boolean": return Utils.parseBool(value);
                    case "enumeration":
                        var index = type.values.indexOf(value);
                        if (index !== -1) return type.values[index];
                        else              return type.values[0];
                    default: return value;
                }
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
            assignmentOperators: ['set', 'delta'],
            relationalOperators: [Config.relationalOperators.equalTo,            Config.relationalOperators.notEqualTo,
                                  Config.relationalOperators.greaterThanEqualTo, Config.relationalOperators.lessThanEqualTo,
                                  Config.relationalOperators.greaterThan,        Config.relationalOperators.lessThan],
            loadType: function(typeXML)
            {
                var defaultEl = typeXML.children('default');
                if (defaultEl.length > 0) return $.extend({}, this, { defaultValue: parseInt(defaultEl[0].textContent, 10) });
                else                      return this;
            },
            loadTypeFromDOM: function(typeEl, defaultValueContainer)
            {
                return $.extend({}, this, { defaultValue: this.getFromDOM(defaultValueContainer) });
            },
            castTo: function(type, value)
            {
                switch(type.name)
                {
                    case "string": return String(value);
                    case "integer": return value;
                    case "boolean": return Boolean(value);
                    case "enumeration":
                        var index = type.values.indexOf(String(value));
                        if (index !== -1) return type.values[index];
                        else              return type.values[0];
                    default: return value;
                }
            },
            insertType: function(typeXML)
            {
                return appendChild(typeXML, 'typeInteger');
            },
            appendControlTo: function(containerEl, htmlId)
            {
                containerEl.append($('<input>', { id: htmlId, type: 'number', value: 0 }));
            },
            getFromDOM: function(containerEl)
            {
                // Note the defaulting of NaN to 0: we want to avoid
                // NaNs where integers are expected at all costs.
                return Utils.parseDecimalIntWithDefault(containerEl.children('input').first().val(), 0);
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
            assignmentOperators: ['set'],
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
            castTo: function(type, value)
            {
                switch(type.name)
                {
                    case "string": return String(value);
                    case "integer": return Number(value);
                    case "boolean": return value;
                    case "enumeration":
                        var index = type.values.indexOf(String(value));
                        if (index !== -1) return type.values[index];
                        else              return type.values[0];
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
            assignmentOperators: ['set'],
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
            castTo: function(type, value)
            {
                switch(type.name)
                {
                    case "string": return value;
                    case "integer": return Utils.parseDecimalIntWithDefault(value, 0);
                    case "boolean": return Utils.parseBool(value);
                    case "enumeration":
                        // The enumeration values could have changed, so we need to check if the current one is still valid
                        // TODO: Check if only the name changed and not the option by index for example
                        var index = type.values.indexOf(value);
                        if (index !== -1) return type.values[index];
                        else              return type.values[0];
                    default: return value;
                }
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

        propertyValues.characterIndependent = {};
        for (var propertyId in Config.configObject.properties.byId)
        {
            if (acceptableStatementScopes.indexOf(Config.configObject.properties.byId[propertyId].scopes.statementScope) === -1) continue;
            propertyValues.characterIndependent[propertyId] = Config.configObject.properties.byId[propertyId].type.defaultValue;
        }

        propertyValues.perCharacter = {};
        for (var characterId in Config.configObject.characters.byId)
        {
            propertyValues.perCharacter[characterId] = {};
            for (var propertyId in Config.configObject.characters.properties.byId)
            {
                if (acceptableStatementScopes.indexOf(Config.configObject.characters.properties.byId[propertyId].scopes.statementScope) === -1) continue;
                propertyValues.perCharacter[characterId][propertyId] = Config.configObject.characters.properties.byId[propertyId].type.defaultValue;
            }
            for (var propertyId in Config.configObject.characters.byId[characterId].properties.byId)
            {
                if (acceptableStatementScopes.indexOf(Config.configObject.characters.byId[characterId].properties.byId[propertyId].scopes.statementScope) === -1) continue;
                propertyValues.perCharacter[characterId][propertyId] = Config.configObject.characters.byId[characterId].properties.byId[propertyId].type.defaultValue;
            }
        }

        return propertyValues;
    }

})();
