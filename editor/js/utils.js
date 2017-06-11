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
        appendChild: appendChild,
        appendChildNS: appendChildNS,
        focusFirstTabindexedDescendant: focusFirstTabindexedDescendant,
        setPreserveSpace: setPreserveSpace,
        attachMarkdownTooltip: attachMarkdownTooltip,
        makeSortable: makeSortable,
        confirmDialog: confirmDialog
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

    function appendChild(parentXML, name)
    {
        return parentXML.appendChild(document.createElementNS(parentXML.namespaceURI, name));
    }

    function appendChildNS(parentXML, nameSpace, name)
    {
        return parentXML.appendChild(document.createElementNS(nameSpace, name));
    }

    function setPreserveSpace(elem)
    {
        elem.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space", "preserve");
    }

    // Focuses on the first descendant that has a non-negative tabindex.
    // This includes elements that are focusable by default, like <input> and <select>.
    function focusFirstTabindexedDescendant(element)
    {
        var descendants = $(element).find('*');
        for (var i = 0; i < descendants.length; i++)
        {
            var toTest = $(descendants[i]);
            if (toTest.prop('tabIndex') >= 0)
            {
                return toTest.focus();
            }
        }
        return $();
    }

    function attachMarkdownTooltip(elem)
    {
        elem.tooltip(
        {
            items: ":focus",
            content: i18next.t('utils:markdown_tooltip')
        });
        elem.tooltip().off('mouseover mouseout');
    }

    function makeSortable(container)
    {
        container.sortable({
            handle: ".handle",
            axis: "y",
            forceHelperSize: true,
            helper: function(e, helper)
            {
                $(helper).children().each(function()
                {
                    $(this).width($(this).width());
                });
                return helper;
            },
            beforeStop: function(e, ui)
            {
                $(ui.helper).children().each(function()
                {
                    $(this).width("");
                });
            }
        });
    }

    function confirmDialog(content)
    {
        var deferredConfirmation = $.Deferred();
        var container = $('<div>');
        container.append(content).dialog(
        {
            height: 'auto',
            maxHeight: 768,
            width: 400,
            modal: true,
            buttons: [
            {
                text: i18next.t('common:confirm'),
                click: function()
                {
                    deferredConfirmation.resolve(true);
                    $(this).dialog('close');
                }
            },
            {
                text: i18next.t('common:cancel'),
                click: function()
                {
                    deferredConfirmation.resolve(false);
                    $(this).dialog('close');
                }
            }],
            close: function()
            {
                container.remove();
            }
        });
        return deferredConfirmation;
    }

})();
