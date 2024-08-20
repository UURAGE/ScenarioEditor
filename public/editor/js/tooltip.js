// © DialogueTrainer

(function()
{
    "use strict";

    $.fn.extend(
    {
        tooltip: function(options, option, value)
        {
            const tooltipElement = this.get(0);

            if (typeof options === 'string')
            {
                if (options === 'instance')
                {
                    return tooltipElement?._tippy;
                }
                else if (options === 'option')
                {
                    if (option === 'content')
                    {
                        const content = value instanceof $ ? value.get(0) : value;
                        const instance = $(this).data('tippy-instance');
                        instance.setContent(content);
                    }
                }

                return;
            }

            let content = options.content;

            if (content instanceof $)
            {
                content = content.get(0);
            }

            if (!content)
            {
                content = this.attr('title');
                this.attr('title', '');
            }

            const tippyOptions = {
                content,
                allowHTML: true,
                interactive: options.interactive,
                theme: options.theme,
                popperOptions: {
                    strategy: 'fixed'
                },
            };

            if (options.appendTo) tippyOptions.appendTo = options.appendTo;
            const instance = tippy(tooltipElement, tippyOptions);

            $(this).data('tippy-instance', instance);
        }
    });
})();
