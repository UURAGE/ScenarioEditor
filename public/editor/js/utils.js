// © DialogueTrainer

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
        fitDialogWidthToWindow: fitDialogWidthToWindow,
        fitDialogHeightToWindow: fitDialogHeightToWindow,
        abbreviateText: abbreviateText,
        stopQueuedClicks: stopQueuedClicks,
        sIcon: sIcon,
        dialogSizes:
        {
            extraSmall: 360,
            small: 500,
            medium: 800,
            large: 1024,
            extraLarge: 1200
        },
        debounce: debounce,
        showExpressionDeletionWarning: showExpressionDeletionWarning
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
        for (const descendant of $(element).find('*'))
        {
            const toTest = $(descendant);
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
        let attachmentContainer = elem.next('.attachment-container');
        if (attachmentContainer.length === 0)
        {
            attachmentContainer = $('<span>', { class: "attachment-container" });
            attachmentContainer.insertAfter(elem);
        }
        const tooltipIcon = $('<span>', { class: "markdown-tooltip" }).append($(Utils.sIcon('mdi-information-slab-circle-outline')));
        const tooltipOptions = {
            content: i18next.t('utils:markdown_tooltip'),
            theme: "markdown",
            interactive: true
        };

        if (attachmentContainer.closest('dialog').length > 0)
        {
            tooltipOptions.appendTo = attachmentContainer.closest('dialog').get(0);
        }

        tooltipIcon.tooltip(tooltipOptions);
        attachmentContainer.append(tooltipIcon);
    }

    function detachMarkdownTooltip(elem)
    {
        const attachmentContainer = elem.next('.attachment-container');
        attachmentContainer.children('.markdown-tooltip').remove();
        if (attachmentContainer.children().length === 0)
        {
            attachmentContainer.remove();
        }
    }

    function makeSortable(container, connectWith, items, additonalOptions)
    {
        const options = {
            handle: '.handle',
            direction: 'vertical',
            animation: 150,
            ...additonalOptions
        };

        if (connectWith) options.group = connectWith;
        if (items) options.draggable = items;

        Sortable.create(container.get(0), options);
    }

    function getDialogIcon(type)
    {
        let icon = '';
        switch (type)
        {
            case 'warning':
                icon = 'mdi-alert';
                break;
            case 'error':
                icon = 'mdi-alert-circle';
                break;
        }
        return icon;
    }

    function alertDialog(content, type)
    {
        return new Promise(function(resolve)
        {
            const container = $('<div>');
            container.append($('<p>', { html: content })).dialog(
            {
                icon: getDialogIcon(type),
                title: i18next.t('common:' + type),
                classes: type,
                width: Utils.fitDialogWidthToWindow(Utils.dialogSizes.extraSmall),
                modal: true,
                buttons: [
                    {
                        text: i18next.t('common:close'),
                        class: 'col-dim roundedPill medium',
                        click: function() { $(this).dialog('close'); }
                    }
                ],
                close: function()
                {
                    resolve();
                    container.remove();
                }
            });
        });
    }

    function confirmDialog(content, type)
    {
        return new Promise(function(resolve)
        {
            const container = $('<div>');
            container.append($('<p>', { html: content })).dialog(
            {
                icon: getDialogIcon(type),
                title: i18next.t('common:' + type),
                classes: type,
                width: Utils.fitDialogWidthToWindow(Utils.dialogSizes.extraSmall),
                modal: true,
                buttons:
                [
                    {
                        text: i18next.t('common:confirm'),
                        class: 'col-highlight roundedPill medium',
                        click: function()
                        {
                            resolve(true);
                            $(this).dialog('close');
                        }
                    },
                    {
                        text: i18next.t('common:cancel'),
                        class: 'col-dim roundedPill medium',
                        click: function() { $(this).dialog('close'); }
                    }
                ],
                close: function()
                {
                    resolve(false);
                    container.remove();
                }
            });
        });
    }

    function fitDialogWidthToWindow(size)
    {
        return Math.min(size, $(window).width());
    }

    function fitDialogHeightToWindow(size)
    {
        return Math.min(size, $(window).height());
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

    function debounce(f, ms)
    {
        let timeout;
        return (...args) =>
        {
            clearTimeout(timeout);
            timeout = setTimeout(() =>
            {
                timeout = null;
                f(...args);
            }, ms);
        };
    }

    function showExpressionDeletionWarning(container, message)
    {
        return new Promise(resolve =>
        {
            container.addClass('candidateForDeletion');

            const previouslyEnabledElements = container.find(':enabled').not('button.delete').prop('disabled', true);
            const deleteButton = container.children('button.delete').removeClass('col-danger');
            const deleteDialog = $('<div>', { class: 'deleteDialog' });
            const messageElement = $('<span>', { text: message });
            const confirmButton = $('<button>', { class: "highlight", text: i18next.t('common:delete') });
            const cancelButton = $('<button>', { text: i18next.t('common:cancel') });
            const deleteIconUse = deleteButton.find('use');
            const originalDeleteIcon = deleteIconUse.attr('xlink:href');
            deleteIconUse.attr('xlink:href', '#mdi-arrow-left');

            const cancelHandler = event =>
            {
                event.stopImmediatePropagation();
                container.removeClass('candidateForDeletion');
                previouslyEnabledElements.prop('disabled', false);
                deleteButton.addClass('col-danger').get(0).removeEventListener('click', cancelHandler, true);
                deleteIconUse.attr('xlink:href', originalDeleteIcon);
                deleteDialog.remove();
                resolve(false);
            };

            confirmButton.on('click', () => { resolve(true); });
            cancelButton.on('click', cancelHandler);
            deleteButton.get(0).addEventListener('click', cancelHandler, true); // Capturing!

            deleteDialog.append(
                $('<div>', { class: 'container' }).append(
                    messageElement,
                    $('<div>').append(confirmButton, cancelButton)
                )
            );

            container.append(deleteDialog);
        });
    }
})();
