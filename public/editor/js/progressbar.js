// © DialogueTrainer

(function()
{
    "use strict";

    $.fn.extend(
    {
        progressbar: function(options, value)
        {
            const setOrRemoveValue = (element, value) =>
            {
                if (typeof value === 'number')
                {
                    element.prop('value', value / 100);
                }
                else
                {
                    element.removeProp('value');
                }
            };

            if (typeof options === 'string')
            {
                const progress = $(this).is('progress') ? $(this) : $(this).children('progress');

                if (options === 'value')
                {
                    setOrRemoveValue(progress, value);
                }

                return;
            }

            const progressbar = $(this).hasClass('.progressbar') ? $(this) : $(this).closest('.progressbar');

            // When calling on existing progressbar
            if (progressbar.length)
            {
                const progressElement = progressbar.children('progress');
                setOrRemoveValue(progressElement, options?.value);
            }
            else
            {
                const progressElement = $('<progress>');
                setOrRemoveValue(progressElement, options?.value);

                $(this).addClass('progressbar').prepend(progressElement);

                return this;
            }
        }
    });
})();
