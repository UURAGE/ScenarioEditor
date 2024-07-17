// © DialogueTrainer

(function()
{
    "use strict";

    $.fn.extend(
    {
        accordion: function(options)
        {
            if (typeof options === 'string')
            {
                const accordion = $(this).hasClass('.accordion') ? $(this) : $(this).closest('.accordion');

                if (options === 'expand')
                {
                    accordion.addClass('open');
                }
                else if (options === 'collapse')
                {
                    accordion.removeClass('open');
                }

                return;
            }

            const accordionElement = $(this);

            accordionElement.addClass('accordion');
            accordionElement.addClass('open');

            const header = accordionElement.find(options?.header || 'h3');

            if (!header.length)
            {
                console.error("Missing header");
                return;
            }

            const arrow = $('<button>', { html: Utils.sIcon('mdi-menu-down'), class: "buttonIcon text arrow" });
            header.prepend(arrow);

            header.on('click', function(event)
            {
                if (options?.beforeActivate)
                {
                    const result = options.beforeActivate(event);
                    if (result === false) return;
                }

                const contentVisible = accordionElement.hasClass('open');
                accordionElement.toggleClass('open', !contentVisible);
            });
        }
    });
})();
