/* © Utrecht University and DialogueTrainer */

var SaveIndicator;

(function()
{
    "use strict";

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
