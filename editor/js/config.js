/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

var Config;

(function ()
{
    Config = 
    {
        configObject: {},
        types: {}
    };
    
    $(document).ready(loadConfig);
    
    function loadConfig()
    {
        var configXML = $($.parseXML($('#config').text())).children('config');
        var config = {};
        
        var defaultScopes = { statementScope: 'independent' };
        config.properties = loadPropertyGroup(configXML.children('properties'), defaultScopes);
        
        Config.configObject = config;
    }
    
    function loadPropertyGroup(groupXML, parentScopes)
    {
        var groupScopes = loadScopes(groupXML[0]);
        mergeScopes(groupScopes, parentScopes);
        
        var properties = {};
        groupXML.children().each(function (index, childXML)
        {
            if (childXML.nodeName === "property")
            {
                var id = childXML.getAttribute('id');
                var propertyScopes = loadScopes(childXML);
                mergeScopes(propertyScopes, groupScopes);
                properties[id] =
                {
                    id: id,
                    name: childXML.getAttribute('name'),
                    description: childXML.getAttribute('description'),
                    optional: Boolean(childXML.getAttribute('optional')),
                    scopes: propertyScopes,
                    type: loadType($(childXML).children().eq(0))
                }
            }
            else
            {
                $.extend(properties, loadPropertyGroup($(childXML), groupScopes));
            }
        });
        return properties;
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
