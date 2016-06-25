/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

var Utils;

(function()
{
    "use strict";

    Utils =
    {
        clone: clone,
        ensurePreventDefault: ensurePreventDefault,
        parseDecimalIntWithDefault: parseDecimalIntWithDefault,
        parseBool: parseBool
    };

    // Taken from stackoverflow
    // http: //stackoverflow.com/questions/728360/most-elegant-way-to-clone-a-javascript-object
    function clone(obj)
    {
        return $.extend(true, {}, obj);
    }

    // Ensures the default event trigger is really prevented,
    // because of a bug in firefox it is still triggered,
    // when just calling event.preventDefault()
    // http://stackoverflow.com/questions/14860759/cant-override-ctrls-in-firefox-using-jquery-hotkeys
    function ensurePreventDefault(div, event, eventFunction)
    {
        event.preventDefault();

        div.blur();

        setTimeout(function() { eventFunction(); }, 50);
    }

    function parseDecimalIntWithDefault(string, defaultValue)
    {
        // Make sure radix 10 is used (the default is browser-dependent).
        var value = parseInt(string, 10);
        return (isNaN(value) ? defaultValue : value);
    }

    function parseBool(string)
    {
        return string == "true";
    }
})();