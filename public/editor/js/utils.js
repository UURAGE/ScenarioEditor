/* © Utrecht University and DialogueTrainer */

/* exported Utils */
let Utils;

(function()
{
    "use strict";

    // eslint-disable-next-line no-global-assign
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
        abbreviateText: abbreviateText,
        stopQueuedClicks: stopQueuedClicks,
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
        const value = parseInt(string, 10);
        return isNaN(value) ? defaultValue : value;
    }

    function parseBool(str)
    {
        return str == "true";
    }

    // Taken from https://stackoverflow.com/a/6969486
    function escapeRegex(str)
    {
        return str.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&");
    }

    function escapeHTML(str)
    {
        if (str === undefined) return str;
        else
        {
            return str
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;')
                .replace(/\n/g, "<br/>");
        }
    }

    function unEscapeHTML(str)
    {
        if (str === undefined) return str;
        else
        {
            return str
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, '\'')
                .replace(/<br\/>/g, "\n");
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
            const position = elem.css(['left', 'top']);
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
        const descendants = $(element).find('*');
        for (let i = 0; i < descendants.length; i++)
        {
            const toTest = $(descendants[i]);
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
        const tooltipIcon = $('<span>', { class: "markdown-tooltip" });
        tooltipIcon.append($('<span>').append($(Utils.sIcon('icon-markdown'))));
        tooltipIcon.tooltip(
        {
            items: ":hover",
            content: i18next.t('utils:markdown_tooltip'),
            // Taken from: http://stackoverflow.com/a/15014759
            create: function() { $(this).data("ui-tooltip").liveRegion.remove(); },
            close: function(event, ui)
            {
                ui.tooltip.hover(
                    function()
                    {
                        $(this).stop(true).fadeIn();
                    },
                    function()
                    {
                        $(this).fadeOut(function() { $(this).remove(); });
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
                const sort = $(this).sortable('instance');
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
        const deferredClose = $.Deferred();
        const container = $('<div>');
        container.append(content).dialog(
        {
            title: i18next.t('common:' + type),
            classes:
            {
                "ui-dialog-titlebar": type
            },
            height: 'auto',
            maxHeight: 768,
            width: 400,
            modal: true,
            buttons:
            [
                {
                    text: i18next.t('common:close'),
                    click: function()
                    {
                        $(this).dialog('close');
                    }
                }
            ],
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
        const deferredConfirmation = $.Deferred();
        const container = $('<div>');
        container.append(content).dialog(
        {
            title: i18next.t('common:' + type),
            classes:
            {
                "ui-dialog-titlebar": type
            },
            height: 'auto',
            maxHeight: 768,
            width: 400,
            modal: true,
            buttons:
            [
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
                }
            ],
            close: function()
            {
                deferredConfirmation.resolve(false);
                container.remove();
            }
        });
        return deferredConfirmation;
    }

    function abbreviateText(text, separator, maxLength)
    {
        if (!text) return "";
        if (!separator) separator = "";

        let abbreviatedText = text.trim();
        if (abbreviatedText.length > maxLength)
        {
            const words = abbreviatedText.split(/[' \n\r\t]/g);
            const firstWord = words[0];
            const lastWord = words[words.length - 1];
            if (words.length === 1 ||
                firstWord.length > maxLength ||
                firstWord.length + separator.length + lastWord.length > maxLength)
            {
                abbreviatedText = words[0].substr(0, maxLength - separator.trim().length) + (words.length !== 1 ? separator.trim() : "");
            }
            else
            {
                abbreviatedText = firstWord + separator + lastWord;
                const front = [firstWord];
                const back = [lastWord];
                let pushToFront = true;
                while (front.length + back.length < words.length)
                {
                    if (pushToFront)
                    {
                        front.push(words[front.length]);
                    }
                    else
                    {
                        back.unshift(words[words.length - back.length - 1]);
                    }

                    const tentativeAbbreviatedText = front.join(' ') + separator + back.join(' ');
                    if (tentativeAbbreviatedText.length < maxLength)
                    {
                        abbreviatedText = tentativeAbbreviatedText;
                    }
                    else
                    {
                        break;
                    }

                    pushToFront = !pushToFront;
                }
            }
        }
        return abbreviatedText;
    }

    function stopClick(e)
    {
        e.stopPropagation();
    }

    function stopQueuedClicks()
    {
        document.addEventListener('click', stopClick, true);
        setTimeout(function()
        {
            document.removeEventListener('click', stopClick, true);
        });
    }

    function sIcon(icon, extraClass)
    {
        if (typeof extraClass === 'undefined') { extraClass = ''; }
        return '<svg xmlns="http://www.w3.org/2000/svg" class="icon ' + extraClass + '"><use xlink:href="#' + icon + '"></use></svg>';
    }
})();
