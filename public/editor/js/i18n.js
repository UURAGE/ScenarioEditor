/* © Utrecht University and DialogueTrainer */

(function()
{
    "use strict";

    var namespaces =
    [
        'clipboard',
        'colorPicker',
        'common',
        'condition',
        'configXML',
        'draft',
        'evaluations',
        'load',
        'main',
        'metadata',
        'parameters',
        'print',
        'save',
        'types',
        'utils',
        'validator',
        'elementList'
    ];

    var resources = $.ajax(
    {
        url: site_url + 'editor/getlocales',
        type: 'GET',
        async: false,
        data:
        {
            lng: languageCode,
            ns: namespaces
        }
    }).responseJSON;

    i18next
        .use(i18nextSprintfPostProcessor)
        .init(
    {
        debug: false,
        // Setting this to false ensures setTimeout-free initialisation
        initImmediate: false,
        whitelist: ['en', 'nl'],
        lng: languageCode,
        fallbackLng: 'en',
        resources: resources,
        interpolation:
        {
            format: function(value, format)
            {
                if (format === 'uppercase') return value.toUpperCase();
                if (format === 'lowercase') return value.toLowerCase();
                // Future: For formatting dates in multiple locales we can use 'moment.js' and for numbers 'numerical.js'
                // if(value instanceof Date) return moment(value).format(format);
                return value;
            }
        }
    });
})();
