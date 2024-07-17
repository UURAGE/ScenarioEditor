// © DialogueTrainer

/* exported Parts */
let Parts;

(function()
{
    "use strict";

    // eslint-disable-next-line no-global-assign
    Parts =
    {
        addButton: addButton,
        addButtonIcon: addButtonIcon,
        deleteButton: deleteButton
    };

    function deleteButton()
    {
        // Keep 'delete' as a class name for JS code to work in other files for deleting elements
        return $('<button>', { type: "button", class: "buttonIcon col-danger text delete", title: i18next.t('common:delete') })
            .append(Utils.sIcon('mdi-minus-circle-outline'));
    }

    function addButton(text, className)
    {
        let classNames = "col-default roundedPill ";
        classNames += text ? "medium " : "small ";
        if (className) classNames += " " + className;
        return $('<button>', { type: "button", class: classNames, title: i18next.t('common:add') })
            .append(Utils.sIcon(text ? 'mdi-plus' : 'mdi-plus-circle-outline'))
            .append(text ? text : "");
    }

    function addButtonIcon(className)
    {
        let classNames = "col-default roundedPill buttonIcon";
        if (className) classNames += " " + className;
        return $('<button>', { type: "button", class: classNames, title: i18next.t('common:add') })
            .append(Utils.sIcon('mdi-plus-circle-outline'));
    }
})();
