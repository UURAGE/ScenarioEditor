// © DialogueTrainer

(function()
{
    "use strict";

    $.fn.extend(
    {
        accordion: function(options)
        {
            const findHeaders = (elem) => { return elem.find("> li > :first-child").add(elem.find("> :not(li)").even()); };

            if (typeof options === 'string')
            {
                const accordionElement = $(this).hasClass('.accordion') ? $(this) : $(this).closest('.accordion');
                const instance = accordionElement.data('accordion');

                if (options === 'expand')
                {
                    const headers = instance.header ? accordionElement.find(instance?.header) : findHeaders(this);
                    headers.addClass('open');
                }
                else if (options === 'collapse')
                {
                    const headers = instance.header ? accordionElement.find(instance?.header) : findHeaders(this);
                    headers.removeClass('open');
                }

                return;
            }

            const accordionElement = $(this);

            accordionElement.addClass('accordion');
            accordionElement.addClass('open');

            const headers = options.header ? accordionElement.find(options?.header) : findHeaders(this);

            if (!headers.length)
            {
                console.error("No headers");
                return;
            }

            headers.each(function()
            {
                const header = $(this).addClass('header');
                const content = header.next();
                header.after($('<div>', { class: 'expander' }).append(content));

                const arrow = $('<button>', { html: Utils.sIcon('mdi-menu-down'), class: "buttonIcon text arrow" });
                header.prepend(arrow);

                header.on('click', function(event)
                {
                    if (options?.beforeActivate)
                    {
                        const result = options.beforeActivate(event);
                        if (result === false) return;
                    }
                    const contentVisible = header.hasClass('open');
                    if (!options?.multiple) headers.removeClass('open');

                    if (options?.collapsible)
                    {
                        header.toggleClass('open', !contentVisible);
                    }
                    else
                    {
                        header.addClass('open');
                    }
                });
            });

            headers.eq(0).addClass('open');
            accordionElement.data('accordion', options);
        }
    });
})();
