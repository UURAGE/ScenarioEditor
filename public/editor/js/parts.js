/* © Utrecht University and DialogueTrainer */

/* exported Parts */
var Parts;

(function()
{
    "use strict";

    // eslint-disable-next-line no-global-assign
    Parts =
    {
        addButton: addButton,
        deleteButton: deleteButton
    };

    function deleteButton()
    {
        return $('<button>', { type: "button", class: "iconButton delete", title: i18next.t('common:delete') })
            .append(Utils.sIcon('icon-minus'));
    }

    function addButton(text, className)
    {
        var classNames = "iconButton add";
        if (className) classNames += " " + className;
        return $('<button>', { type: "button", class: classNames, title: i18next.t('common:add') })
            .append(Utils.sIcon('icon-plus'))
            .append(text ? text : "");
    }
})();
