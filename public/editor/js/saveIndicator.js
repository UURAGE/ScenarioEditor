/* © Utrecht University and DialogueTrainer */

/* exported SaveIndicator */
var SaveIndicator;

(function()
{
    "use strict";

    // eslint-disable-next-line no-global-assign
    SaveIndicator =
    {
        setSavedChanges: setSavedChanges,
        getSavedChanges: getSavedChanges
    };

    var savedChanges = true;

    function setSavedChanges(value)
    {
        if (value === savedChanges) return;

        savedChanges = value;
        $('#scenarioNameTab').toggleClass('unsavedChanges', !savedChanges);
        Main.updateDocumentTitle();
    }

    function getSavedChanges()
    {
        return savedChanges;
    }
})();
