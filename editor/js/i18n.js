/* © Utrecht University and DialogueTrainer */

(function()
{
    "use strict";

    i18next
    .use(i18nextXHRBackend)
    .use(i18nextLocalStorageCache)
    .use(i18nextSprintfPostProcessor)
    .init(
    {
        debug: false,
        // is actually initAsync and language loading should be synchronous, so its false
        initImmediate: false,
        whitelist: ['en', 'nl'],
        lng: languageCode,
        fallbackLng: 'en',
        // no region suffix distinction
        load: 'languageOnly',
        ns:
        [
            'clipboard',
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
            'validator'
        ],
        interpolation:
        {
            format: function(value, format, lng)
            {
                if (format === 'uppercase') return value.toUpperCase();
                if (format === 'lowercase') return value.toLowerCase();
                // Future: For formatting dates in multiple locales we can use 'moment.js' and for numbers 'numerical.js'
                // if(value instanceof Date) return moment(value).format(format);
                return value;
            }
        },
        backend:
        {
            // path where resources get loaded from, or a function
            // returning a path:
            // function(lngs, namespaces) { return customPath; }
            // the returned path will interpolate lng, ns if provided like giving a static path
            loadPath: editor_url + 'locales/{{lng}}/{{ns}}.json',

            // path to post missing resources
            addPath: editor_url + 'locales/add/{{lng}}/{{ns}}',

            // your backend server supports multiloading
            // /locales/resources.json?lng=de+en&ns=ns1+ns2
            allowMultiLoading: false,

            // parse data after it has been fetched
            // here it removes the letter a from the json (bad idea)
            // parse: function(data) { return data.replace(/a/g, ''); },

            // allow cross domain requests
            crossDomain: false,

            // allow credentials on cross domain requests
            withCredentials: false,

            // load languages synchronously, otherwise the editor won't work
            // taken from: https://github.com/i18next/i18next-xhr-backend/blob/master/i18nextXHRBackend.js#L166
            // and changed 'x.open(data ? 'POST' : 'GET', url, 1);' to 'x.open(data ? 'POST' : 'GET', url, false);'
            // and added the _typeof function
            ajax: function(url, options, callback, data, cache)
            {
                var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ?
                function (obj)
                {
                    return typeof obj;
                }
                :
                function (obj)
                {
                    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
                };

                // Must encode data
                if (data && (typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object')
                {
                    var y = '',
                        e = encodeURIComponent;
                    for (var m in data)
                    {
                        y += '&' + e(m) + '=' + e(data[m]);
                    }
                    data = y.slice(1) + (!cache ? '&_t=' + new Date() : '');
                }

                try
                {
                    var x = new (XMLHttpRequest || ActiveXObject)('MSXML2.XMLHTTP.3.0');
                    x.open(data ? 'POST' : 'GET', url, false);
                    if (!options.crossDomain)
                    {
                        x.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                    }
                    x.withCredentials = !!options.withCredentials;
                    if (data)
                    {
                        x.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
                    }
                    x.onreadystatechange = function ()
                    {
                        x.readyState > 3 && callback && callback(x.responseText, x);
                    };
                    x.send(data);
                }
                catch (e)
                {
                    window.console && console.log(e);
                }
            }
        },
        cache:
        {
            enabled: environment !== 'development',
            // prefix for stored languages
            prefix: 'i18next_res_',
            expirationTime: 24*60*60*1000
        }
    });
})();
