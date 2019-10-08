/* © Utrecht University and DialogueTrainer */

(function()
{
    "use strict";

    var globals = JSON.parse(document.getElementById("globals").textContent);
    for (var globalName in globals)
    {
        Object.defineProperty(window, globalName,
        {
            writable: false,
            enumerable: true,
            configurable: false,
            value: globals[globalName]
        });
    }
})();
