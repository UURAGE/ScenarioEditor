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
        if (savedChanges)
        {
            $('#scenarioNameTab').removeClass('unsavedChanges');
            document.title = document.title.substr(2, document.title.length);
        }
        else
        {
            $('#scenarioNameTab').addClass('unsavedChanges');
            document.title = '• ' + document.title;
        }
    }

    function getSavedChanges()
    {
        return savedChanges;
    }

})();
