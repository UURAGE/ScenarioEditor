/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

var Config;

(function ()
{
    Config =
    {
        configObject: {},
        types: {}
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

    Config.types =
    {
        'string':
        {
            name: 'string',
            assignmentOperators: ['set'],
            relationalOperators: ['equalTo', 'notEqualTo'],
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
            assignmentOperators: ['set', 'delta'],
            relationalOperators: ['equalTo', 'notEqualTo', 'greaterThanEqualTo', 'lessThanEqualTo', 'greaterThan', 'lessThan'],
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
            assignmentOperators: ['set'],
            relationalOperators: ['equalTo', 'notEqualTo'],
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
                return containerEl.children('input').first().prop('checked');
            },
            setInDOM: function(containerEl, value)
            {
                containerEl.children('input').first().prop('checked', value);
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
            assignmentOperators: ['set'],
            relationalOperators: ['equalTo', 'notEqualTo'],
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
