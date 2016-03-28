/*
//This program has been developed by students from the bachelor Computer Science at Utrecht University 
//within the Software and Game project courses 2013-2015
//©Copyright Utrecht University (Department of Information and Computing Sciences) 
*/

var Utils;

(function()
{
    Utils =
    {
        clone: clone,
        ensurePreventDefault: ensurePreventDefault
    };
    
    // Taken from stackoverflow
    // http: //stackoverflow.com/questions/728360/most-elegant-way-to-clone-a-javascript-object
    function clone(obj)
    {
        return $.extend(true, {}, obj);
    }
    
    // Ensures the default event trigger is really prevented, 
    // because of a bug in firefox it is still triggered, 
    // when just calling event.preventDefault() 
    // http://stackoverflow.com/questions/14860759/cant-override-ctrls-in-firefox-using-jquery-hotkeys
    function ensurePreventDefault(div, event, eventFunction)
    {
        event.preventDefault();
                        
        div.blur();
                        
        setTimeout(function() { eventFunction(); }, 50);
    }
    
})();