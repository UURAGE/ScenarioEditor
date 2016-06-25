/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

// Functions to create specific objects.

var ObjectGenerator;

(function()
{
    "use strict";

    ObjectGenerator =
    {
        parameterObject: ParameterObject,
        preconditionObject: PreconditionObject,
        effectObject: EffectObject
    };

    function ParameterObject(div)
    {
        var name = div.find(".name").val();
        // If the name is empty, we cannot create a valid parameter object.
        if (!name) return null;

        var typeName = div.find(".parameter-type-select").val();
        return {
            id: div.prop('id'),
            name: name,
            type: Config.types[typeName].loadTypeFromDOM(div, div.find(".parameter-initial-value-container")),
            description: div.find(".description").val()
        };
    }

    function PreconditionObject(preconditionDiv)
    {
        var preconditionObject = {};
        // Save selected type of precondition
        preconditionObject.type = preconditionDiv.children(".groupPreconditionRadioDiv").find('input[type=radio]:checked').val();

        // Save preconditions.
        var preconditionsArray = [];

        preconditionDiv.children(".groupPreconditionDiv").children().each(function()
        {
            if ($(this).hasClass("groupprecondition"))
            {
                preconditionsArray.push(PreconditionObject($(this)));
            }
            else
            {
                preconditionsArray.push(SinglePreconditionObject($(this)));
            }
        });
        preconditionObject.preconditions = preconditionsArray;
        return preconditionObject;
    }

    function EffectObject(div)
    {
        var idRef = div.find(".parameter-idref-select").find("option:selected").val();
        return {
            idRef: idRef,
            changeType: div.find(".parameter-effect-changetype-select").find("option:selected").val(),
            value: Metadata.metaObject.parameters.byId[idRef].type.getFromDOM(div.find(".parameter-effect-value-container"))
        };
    }

    function SinglePreconditionObject(div)
    {
        var parameterIdRef = div.find(".parameter-idref-select").val();
        var characterIdRef = div.find(".character-idref-select").val();

        var parameter;
        if (characterIdRef)
        {
            if (parameterIdRef in Config.configObject.characters.parameters.byId)
            {
                parameter = Config.configObject.characters.parameters.byId[parameterIdRef];
            }
            else
            {
                if (parameterIdRef in Config.configObject.characters.byId[characterIdRef].parameters.byId)
                {
                    parameter = Config.configObject.characters.byId[characterIdRef].parameters.byId[parameterIdRef];
                }
            }
        }
        else
        {
            if (parameterIdRef in Metadata.metaObject.parameters.byId)
            {
                parameter = Metadata.metaObject.parameters.byId[parameterIdRef];
            }
            else if (parameterIdRef in Config.configObject.parameters.byId)
            {
                parameter = Config.configObject.parameters.byId[parameterIdRef];
            }
        }

        var precondition = {
            idRef: parameterIdRef,
            operator: div.find(".precondition-operator-select").val(),
            value: parameter.type.getFromDOM(div.find(".precondition-value-container"))
        };

        if (characterIdRef) precondition.characterIdRef = characterIdRef;
        return precondition;
    }

})();
