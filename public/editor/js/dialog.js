// © DialogueTrainer

(function()
{
    "use strict";

    $.fn.extend(
    {
        dialog: function(options, option, value)
        {
            const preventDefault = function(event)
            {
                event.preventDefault();
            };

            const addButtons = (container, buttons) =>
            {
                buttons.forEach(buttonOptions =>
                {
                    // If it is an element
                    if (buttonOptions.length)
                    {
                        container.append(buttonOptions);
                    }
                    else
                    {
                        const buttonElement = $('<button>', buttonOptions);
                        container.append(buttonElement);
                    }
                });
            };

            const addCloseButton = (dialog) =>
            {
                dialog.find('.header .buttonContainer').prepend(
                    $('<button>', { class: "close", title: i18next.t('common:close') })
                        .append($(Utils.sIcon('mdi-close-thick')))
                        .on('click', function()
                        {
                            dialog.data('dialog').dialogClose();
                        })
                );
            };

            const addMinimizeButton = (dialog) =>
            {
                dialog.find('.header .buttonContainer').append(
                    $('<button>', { class: "minimize", title: i18next.t('common:minimize') })
                        .append($(Utils.sIcon('mdi-window-minimize')))
                        .on('click', function()
                        {
                            dialog.data('dialog').dialogMinimize();
                        })
                );
            };

            const open = (dialogElement, isModal) =>
            {
                if (isModal === true) dialogElement.showModal();
                else dialogElement.show();
            };

            if (typeof options === 'string')
            {
                const dialog = $(this).closest('dialog');
                const instance = dialog.data('dialog');

                if (options === 'open')
                {
                    open(dialog.get(0), instance.options.modal);
                }
                else if (options === 'close')
                {
                    instance.dialogClose();
                }
                else if (options === 'destroy')
                {
                    // Revert back to state before calling dialog...
                    instance.originalParent.append(instance.dialogContent.removeClass('content'));
                    instance.dialogDestroy();
                }
                else if (options === 'isOpen')
                {
                    return dialog.attr('open');
                }
                else if (options === 'option')
                {
                    if (option && value === undefined)
                    {
                        return instance.options[option];
                    }
                    else
                    {
                        instance.options[option] = value;

                        if (option === 'closeOnEscape')
                        {
                            if (value)
                            {
                                dialog.off('cancel');
                            }
                            else
                            {
                                dialog.on('cancel', preventDefault);
                            }
                        }
                        else if (option === 'buttons')
                        {
                            const dialogActions = dialog.children('.actions');
                            dialogActions.empty();
                            addButtons(dialogActions, value);
                        }
                        else if (option === 'closeButton')
                        {
                            dialog.find('.header .buttonContainer button.close').remove();
                            if (value) addCloseButton(dialog);
                        }
                        else if (option === 'minimizeButton')
                        {
                            dialog.find('.header .buttonContainer button.minimize').remove();
                            if (value) addMinimizeButton(dialog);
                        }

                        // Rewrite new options
                        dialog.data('dialog', instance);
                    }
                }

                return;
            }
            else
            {
                const dialog = $(this).parent('dialog');
                const instance = dialog.data('dialog');

                if (instance)
                {
                    // When calling .dialog() on an element that is already a dialog.
                    open(dialog.get(0), instance.options.modal);
                    return;
                }
            }

            const dialogContent = $(this).addClass('content').show();
            const originalParent = dialogContent.parent(); // Save original parent when calling `destroy`.
            const dialog = $('<dialog>');
            const dialogElement = dialog.get(0);

            if (options.title) this.test += " " + options.title;
            if (options.classes) dialog.addClass(options.classes);
            if (options.scrollable) dialog.addClass('scrollable');
            if (options.grid) dialog.addClass('grid');
            if (options.width) dialog.css('width', `${options.width}px`);
            if (options.modal) dialog.addClass('modal');

            // Header container
            const dialogHeader = $('<div>', { class: 'header' });
            if (options.draggable) dialogHeader.attr('data-dialog-draggable', true);

            let title = null;
            if (options.title) title = $('<h1>', { class: 'title', text: options.title });
            let subtitle = null;
            if (options.subtitle) subtitle = $('<p>', { class: 'label', html: options.subtitle });
            if (options.icon) title.prepend(Utils.sIcon(options.icon));
            const buttonContainer = $('<div>', { class: 'buttonContainer' });
            dialogHeader.append(title, subtitle, buttonContainer);
            dialog.append(dialogHeader);
            if (!('closeButton' in options) || options.closeButton) addCloseButton(dialog);
            if ('minimizeButton' in options && options.minimizeButton) addMinimizeButton(dialog);

            dialog.append(dialogContent);

            // Actions (bottom buttons) container
            const dialogActions = $('<div>', { class: 'actions' });
            if (options.buttons)
            {
                addButtons(dialogActions, options.buttons);
            }
            if (options.buttons) dialog.append(dialogActions);

            const dialogDestroy = () =>
            {
                dialog.remove();
            };

            let wayOfClosing = 'close';

            const dialogClose = async () =>
            {
                wayOfClosing = 'close';
                if (options.beforeClose)
                {
                    if (await options.beforeClose() === false) return;
                }

                dialog.get(0).close();
            };

            const dialogMinimize = () =>
            {
                wayOfClosing = 'minimize';
                dialog.get(0).close();
            };

            dialog.on('close', () =>
            {
                if (wayOfClosing === 'close' && options.close) options.close.bind(dialog)();
                else if (wayOfClosing === 'minimize' && options.minimize) options.minimize.bind(dialog)();

                // Dialog no longer has content, so let's destroy it.
                if (dialogContent.parent().length === 0) dialogDestroy();
            });

            if ('closeOnEscape' in options && !options.closeOnEscape)
            {
                dialog.on('cancel', preventDefault);
            }

            if (options.closeOnBackdropClick)
            {
                dialog.on('pointerdown', function(event)
                {
                    event.target == this && this.close();
                });
            }

            dialog.data('dialog', {
                options,
                originalParent,
                dialogContent,
                dialogDestroy,
                dialogClose,
                dialogMinimize
            });

            // Place dialog in DOM
            $("body").append(dialog);

            if (!('autoOpen' in options) || options.autoOpen)
            {
                open(dialogElement, options.modal);
                if (options.open) options.open.bind(dialog)();
            }
        }
    });

    $(function()
    {
        makeDialogDraggable();
    });
})();
