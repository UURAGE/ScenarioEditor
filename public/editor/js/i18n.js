// © DialogueTrainer

(function()
{
    "use strict";

    const namespaces =
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
        'playthroughItemAnalysis',
        'print',
        'save',
        'types',
        'utils',
        'validator',
        'elementList'
    ];

    const resources = $.ajax(
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

    i18next.init(
    {
        debug: false,
        // Setting this to false ensures setTimeout-free initialisation
        initImmediate: false,
        supportedLngs: ['en', 'nl'],
        lng: languageCode,
        fallbackLng: 'en',
        resources: resources,
        // Setting this (to its default value) disables natural language detection
        nsSeparator: ':'
    });
    i18next.services.formatter.add('uppercase', function(value)
    {
        return value.toUpperCase();
    });
    i18next.services.formatter.add('lowercase', function(value)
    {
        return value.toLowerCase();
    });
})();
