// © DialogueTrainer

/* exported SaveIndicator */
let SaveIndicator;

(function()
{
    "use strict";

    // eslint-disable-next-line no-global-assign
    SaveIndicator =
    {
        setSavedChanges: setSavedChanges,
        getSavedChanges: getSavedChanges
    };

    let savedChanges = true;

    function setSavedChanges(value)
    {
        if (value === savedChanges) return;

        savedChanges = value;
        $('#saveButton').toggleClass('unsavedChanges', !savedChanges);
        Main.updateDocumentTitle();
    }

    function getSavedChanges()
    {
        return savedChanges;
    }
})();
