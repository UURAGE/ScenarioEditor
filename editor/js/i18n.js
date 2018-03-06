/* © Utrecht University and DialogueTrainer */

(function()
{
    "use strict";

    i18next
    .use(i18nextXHRBackend)
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
            loadPath: base_url + 'editor/getlocales?lng={{lng}}&ns={{ns}}',

            // your backend server supports multiloading
            // /locales/resources.json?lng=de+en&ns=ns1+ns2
            allowMultiLoading: true,

            // parse data after it has been fetched
            // here it removes the letter a from the json (bad idea)
            // parse: function(data) { return data.replace(/a/g, ''); },

            // allow cross domain requests
            crossDomain: false,

            // allow credentials on cross domain requests
            withCredentials: false,

            // load languages synchronously, otherwise the editor won't work
            // taken from: https://github.com/i18next/i18next-xhr-backend/
            // and changed 'x.open(data ? 'POST' : 'GET', url, 1);' to 'x.open(data ? 'POST' : 'GET', url, 0);'
            // and added the _typeof and addQueryString functions
            ajax: function(url, options, callback, data, cache) {
                var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ?
                    function (obj) { return typeof obj; } :
                    function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

                var addQueryString = function(url, params) {
                    if (params && (typeof params === 'undefined' ? 'undefined' : _typeof(params)) === 'object') {
                        var queryString = '',
                            e = encodeURIComponent;

                        // Must encode data
                        for (var paramName in params) {
                        queryString += '&' + e(paramName) + '=' + e(params[paramName]);
                        }

                        if (!queryString) {
                        return url;
                        }

                        url = url + (url.indexOf('?') !== -1 ? '&' : '?') + queryString.slice(1);
                    }

                    return url;
                    };

                if (data && (typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object') {
                  if (!cache) {
                    data['_t'] = new Date();
                  }
                  // URL encoded form data must be in querystring format
                  data = addQueryString('', data).slice(1);
                }

                if (options.queryStringParams) {
                  url = addQueryString(url, options.queryStringParams);
                }

                try {
                  var x;
                  if (XMLHttpRequest) {
                    x = new XMLHttpRequest();
                  } else {
                    x = new ActiveXObject('MSXML2.XMLHTTP.3.0');
                  }
                  x.open(data ? 'POST' : 'GET', url, 0);
                  if (!options.crossDomain) {
                    x.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                  }
                  x.withCredentials = !!options.withCredentials;
                  if (data) {
                    x.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
                  }
                  if (x.overrideMimeType) {
                    x.overrideMimeType("application/json");
                  }
                  var h = options.customHeaders;
                  if (h) {
                    for (var i in h) {
                      x.setRequestHeader(i, h[i]);
                    }
                  }
                  x.onreadystatechange = function () {
                    x.readyState > 3 && callback && callback(x.responseText, x);
                  };
                  x.send(data);
                } catch (e) {
                  console && console.log(e);
                }
              }
        }
    });
})();
