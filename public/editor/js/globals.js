// © DialogueTrainer

(function()
{
    "use strict";

    const globals = JSON.parse(document.getElementById("globals").textContent);
    for (const globalName in globals)
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
