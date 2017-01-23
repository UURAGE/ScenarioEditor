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
        parseBool: parseBool,
        escapeSelector: escapeSelector,
        escapeHTML: escapeHTML,
        unEscapeHTML: unEscapeHTML,
        cssPosition: cssPosition,
        setPreserveSpace: setPreserveSpace,
        attachMarkdownTooltip: attachMarkdownTooltip
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
        return isNaN(value) ? defaultValue : value;
    }

    function parseBool(str)
    {
        return str == "true";
    }

    // Taken from https://learn.jquery.com/using-jquery-core/faq/how-do-i-select-an-element-by-an-id-that-has-characters-used-in-css-notation/
    function escapeSelector(str)
    {
        return str.replace( /(:|\.|\[|\]|,|=)/g, "\\$1" );
    }

    function escapeHTML(str)
    {
        if (str === undefined)
            return str;
        else
        {
            return str
                .replace(/&/g, '&amp;')   // &
                .replace(/</g, '&lt;')  // <
                .replace(/>/g, '&gt;')  // >
                .replace(/\"/g, '&quot;') // "
                .replace(/\'/g, '&#39;')  // '
                .replace(/\n/g, "<br/>"); // \n
        }
    }

    function unEscapeHTML(str)
    {
        if (str === undefined)
            return str;
        else
        {
            return str
                .replace(/&amp;/g, '&') // &
                .replace(/&lt;/g, '<') // <
                .replace(/&gt;/g, '>') // >
                .replace(/&quot;/g, '"') // "
                .replace(/&#39;/g, '\'') // '
                .replace(/<br\/>/g, "\n"); // \n
        }
    }

    // Gets or sets the "CSS position", which is defined as the combination of
    // the "left" and "top" CSS properties of an element.
    // The values in the argument/return value are expected to be/returned as
    // plain Numbers representing pixels, not strings ending with a unit.
    function cssPosition(elem, newPosition)
    {
        if (newPosition === undefined)
        {
            // "Computed styles of dimensions are almost always pixels"
            // (http://api.jquery.com/css/). We assume this is the case.
            var position = elem.css(['left', 'top']);
            return {
                'left': parseDecimalIntWithDefault(position.left, 0),
                'top': parseDecimalIntWithDefault(position.top, 0)
            };
        }
        else
        {
            return elem.css({
               'left': newPosition.left + 'px',
               'top': newPosition.top + 'px'
            });
        }
    }

    function setPreserveSpace(elem)
    {
        elem.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space", "preserve");
    }

    function attachMarkdownTooltip(elem)
    {
        elem.tooltip(
        {
            items: ":hover",
            content: i18next.t('utils:markdown_tooltip'),
            // Taken from: http://stackoverflow.com/a/15014759
            close: function( event, ui )
            {
                ui.tooltip.hover(
                    function ()
                    {
                        $(this).stop(true).fadeIn();
                    },
                    function ()
                    {
                        $(this).fadeOut(function(){ $(this).remove(); });
                    }
                );
            }
        });
    }
})();