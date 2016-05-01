/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

var Config;

(function ()
{
    Config =
    {
        configObject: {},
        types: {}
    };

    var defaultScopes = { statementScope: 'independent' };
    var defaultPropertyCollection = { kind: 'toplevel', scopes: defaultScopes, sequence: [], byId: {} };

    $(document).ready(loadConfig);

    function loadConfig()
    {
        var configXML = $($.parseXML($('#config').text())).children('config');
        var config = {};

        config.properties = loadPropertyCollection(configXML.children('properties'), 'toplevel', defaultScopes);

        if (configXML.children('character').length > 0)
        {
            config.characters = { properties: $.extend({}, defaultPropertyCollection) };
            config.characters['character'] = loadCharacterNode(configXML.children('character'), 'character');
        }
        else
        {
            config.characters = loadCharacterCollection(configXML.children('characters'));
        }

        Config.configObject = config;
    }

    function loadPropertyNode(nodeXML, parentScopes)
    {
        if (nodeXML.nodeName === "property")
        {
            var propertyScopes = loadScopes(nodeXML);
            mergeScopes(propertyScopes, parentScopes);
            return {
                kind: 'property',
                id: nodeXML.getAttribute('id'),
                name: nodeXML.getAttribute('name'),
                description: nodeXML.getAttribute('description'),
                optional: Boolean(nodeXML.getAttribute('optional')),
                scopes: propertyScopes,
                type: loadType($(nodeXML).children().eq(0))
            };
        }
        else if (nodeXML.nodeName === "propertySection")
        {
            var subResult = loadPropertyCollection($(nodeXML), 'section', parentScopes);
            subResult.name = nodeXML.getAttribute('name');
            return subResult;
        }
        else
        {
            return loadPropertyCollection($(nodeXML), 'group', parentScopes);
        }
    }

    function loadPropertyCollection(collectionXML, kind, parentScopes)
    {
        var collectionScopes = loadScopes(collectionXML[0]);
        mergeScopes(collectionScopes, parentScopes);

        var sequence = [];
        var byId = {};
        collectionXML.children().each(function (index, childXML)
        {
            var subResult = loadPropertyNode(childXML, collectionScopes);
            if (subResult.kind === 'property')
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

    function appendChild(parentXML, name)
    {
        parentXML.appendChild(document.createElementNS(parentXML.namespaceURI, name));
    }

    function toXMLSimple(valueXML, value)
    {
        valueXML.textContent = value;
    }

    function loadCharacterCollection(collectionXML)
    {
        var characters = {};
        collectionXML.children('character').each(function(index, childXML)
        {
            var characterID = 'character' + index;
            characters[characterID] = loadCharacterNode(childXML, characterID);
        });
        characters.properties = loadPropertyCollectionOrDefault($(collectionXML).children('properties'));
        return characters;
    }

    function loadCharacterNode(nodeXML, characterID)
    {
        var properties = loadPropertyCollectionOrDefault($(nodeXML).children('properties'));
        return { id: characterID, properties: properties};
    }

    function loadPropertyCollectionOrDefault(propertiesXML)
    {
        var properties = {};
        if (propertiesXML.length > 0)
        {
            properties = loadPropertyCollection(propertiesXML, 'toplevel', defaultScopes);
        }
        else
        {
            $.extend(properties, defaultPropertyCollection);
        }
        return properties;
    }

    Config.types =
    {
        'string':
        {
            name: 'string',
            loadType: function(typeXML) { return this; },
            insertUnderlyingType: function(typeXML)
            {
                appendChild(typeXML, 'typeString');
            },
            appendControlTo: function(containerEl, htmlId)
            {
                containerEl.append($('<input>', { id: htmlId, type: 'text' }));
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
            loadType: function(typeXML) { return this; },
            insertUnderlyingType: function(typeXML)
            {
                appendChild(typeXML, 'typeInteger');
            },
            appendControlTo: function(containerEl, htmlId)
            {
                containerEl.append($('<input>', { id: htmlId, type: 'number', value: 0 }));
            },
            getFromDOM: function(containerEl)
            {
                // Note the defaulting of NaN to 0: we want to avoid
                // NaNs where integers are expected at all costs.
                var value = parseInt(containerEl.children('input').first().val(), 10);
                return isNaN(value) ? 0 : parseInt(value, 10);
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
            loadType: function(typeXML) { return this; },
            insertUnderlyingType: function(typeXML)
            {
                appendChild(typeXML, 'typeBoolean');
            },
            appendControlTo: function(containerEl, htmlId)
            {
                containerEl.append($('<input>', { id: htmlId, type: 'checkbox' }));
            },
            getFromDOM: function(containerEl)
            {
                return Boolean(containerEl.children('input').first().prop('checked'));
            },
            setInDOM: function(containerEl, value)
            {
                containerEl.children('input').first().prop('checked', value);
            },
            fromXML: function(valueXML)
            {
                return Boolean(valueXML.textContent);
            },
            toXML: toXMLSimple
        },
        'enumeration':
        {
            name: 'enumeration',
            loadType: function(typeXML)
            {
                var values = [];
                typeXML.children('option').each(function(index, valueXML)
                {
                    values.push(valueXML.textContent);
                });
                return $.extend({ values: values }, this);
            },
            insertUnderlyingType: function(typeXML)
            {
                appendChild(typeXML, 'typeString');
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
})();
