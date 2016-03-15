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
    
    Config.types =
    {
        'string':
        {
            name: 'string',
            loadType: function(typeXML) { return this; }
        },
        'integer':
        {
            name: 'integer',
            loadType: function(typeXML) { return this; }
        },
        'boolean':
        {
            name: 'boolean',
            loadType: function(typeXML) { return this; }
        },
        'enumeration':
        {
            name: 'enumeration',
            loadType: function(typeXML)
            {
                var values = [];
                typeXML.children('value').each(function(index, valueXML)
                {
                    values.push(valueXML.textContent);
                });
                return $.extend({ values: values }, this);
            }
        }
    };
})();
