/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

/*
    This file exports the LanguageManager for use in other js files.
    It is loaded by default in editorView.php.
    The exported object is filled with translations by files located in editor/lang.
    The correct one of these is automatically loaded by editorView.php
*/

/*global
  $: false,
*/

var LanguageManager;

(function()
{
    "use strict";

    LanguageManager ={

        sLang: function(id)
        {
            var line = LanguageManager[id];

            if(line === undefined)
                throw "id not present: "+id;

            return line;
        },

        //inserts is an array of strings
        fLang: function(id, inserts)
        {
            var line = LanguageManager[id];

            if(line === undefined)
                throw "id not present: "+id;

            return vsprintf(line, inserts);            
        }
    }
})();
