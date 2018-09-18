/* © Utrecht University and DialogueTrainer */

var Utils;

(function()
{
    "use strict";

    Utils =
    {
        clone: clone,
        parseDecimalIntWithDefault: parseDecimalIntWithDefault,
        parseBool: parseBool,
        escapeRegex: escapeRegex,
        escapeHTML: escapeHTML,
        unEscapeHTML: unEscapeHTML,
        cssPosition: cssPosition,
        appendChild: appendChild,
        appendChildNS: appendChildNS,
        focusFirstTabindexedDescendant: focusFirstTabindexedDescendant,
        setPreserveSpace: setPreserveSpace,
        attachMarkdownTooltip: attachMarkdownTooltip,
        detachMarkdownTooltip: detachMarkdownTooltip,
        makeSortable: makeSortable,
        alertDialog: alertDialog,
        confirmDialog: confirmDialog,
        sIcon: sIcon
    };

    // Taken from stackoverflow
    // http: //stackoverflow.com/questions/728360/most-elegant-way-to-clone-a-javascript-object
    function clone(obj)
    {
        return $.extend(true, {}, obj);
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

    // Taken from https://stackoverflow.com/a/6969486
    function escapeRegex(str)
    {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
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

    // Attaches a tooltip to an element, only works when the element has a parent
    function attachMarkdownTooltip(elem)
    {
        var tooltipIcon = $('<span>', { class: "markdown-tooltip" });
        tooltipIcon.append($('<img>', { src: editor_url + "svg/icon_markdown.svg" }));
        tooltipIcon.tooltip(
        {
            items: ":hover",
            content: i18next.t('utils:markdown_tooltip'),
            // Taken from: http://stackoverflow.com/a/15014759
            close: function(event, ui)
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
        tooltipIcon.insertAfter(elem);
    }

    function detachMarkdownTooltip(elem)
    {
        elem.next('.markdown-tooltip').remove();
    }

    function makeSortable(container)
    {
        container.sortable({
            handle: ".handle",
            axis: "y",
            forceHelperSize: true,
            containment: container,
            start: function(e, ui)
            {
                // Taken from: https://stackoverflow.com/a/36554073
                // Makes the containment area larger so that the element can be sorted into the top and bottom
                var sort = $(this).sortable('instance');
                ui.placeholder.height(ui.helper.height());
                sort.containment[3] += ui.helper.height() * 1.5 - sort.offset.click.top;
                sort.containment[1] -= sort.offset.click.top;
            },
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

    function alertDialog(content, type)
    {
        var deferredClose = $.Deferred();
        var container = $('<div>');
        container.append(content).dialog(
        {
            title: i18next.t('common:' + type),
            classes:
            {
                "ui-dialog-titlebar": type,
            },
            height: 'auto',
            maxHeight: 768,
            width: 400,
            modal: true,
            buttons: [
            {
                text: i18next.t('common:close'),
                click: function()
                {
                    $(this).dialog('close');
                }
            }],
            close: function()
            {
                deferredClose.resolve();
                container.remove();
            }
        });
        return deferredClose;
    }

    function confirmDialog(content, type)
    {
        var deferredConfirmation = $.Deferred();
        var container = $('<div>');
        container.append(content).dialog(
        {
            title: i18next.t('common:' + type),
            classes:
            {
                "ui-dialog-titlebar": type,
            },
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
                    $(this).dialog('close');
                }
            }],
            close: function()
            {
                deferredConfirmation.resolve(false);
                container.remove();
            }
        });
        return deferredConfirmation;
    }

    function sIcon(icon, extraClass)
    {
        if (typeof extraClass === 'undefined') { extraClass = ''; }
        return '<svg xmlns="http://www.w3.org/2000/svg" class="' + extraClass + '"><use xlink:href="#' + icon + '"></use></svg>';
    }

})();
