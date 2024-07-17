// © DialogueTrainer

(function()
{
    "use strict";

    $.fn.extend(
    {
        autocomplete: function(options)
        {
            const inputElement = $(this);

            const id = `${inputElement.id}-datalist`;
            const dataList = $('<datalist>', { id });
            options?.source?.forEach(item =>
            {
                dataList.append($('<option>', { value: item }));
            });

            inputElement.after(dataList).attr('list', id);
        }
    });
})();
