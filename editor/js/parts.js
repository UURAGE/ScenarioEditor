/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

var Parts;

(function ()
{
    "use strict";

    //Raw HTML that needs to be exported.
    Parts =
    {
        addButton: addButton,
        deleteButton: deleteButton,
    };

    function deleteButton()
    {
        return $('<button>', { type: "button", class: "delete", title: i18next.t('common:delete') })
            .append($('<img>', { src: editor_url + "png/others/minus.png", alt: "-" }));
    }

    function addButton(text, className)
    {
        return $('<button>', { type: "button", class: className, title: i18next.t('common:add') })
            .append($('<img>', { src: editor_url + "png/others/plus.png", alt: '+' }))
            .append(text ? ' ' + text : "");
    }
})();
