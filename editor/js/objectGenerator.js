/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

// Functions to create specific objects.

var ObjectGenerator;

(function()
{
    ObjectGenerator =
    {
        parameterObject: ParameterObject,
        preconditionObject: PreconditionObject,
        effectObject: EffectObject,
        nullFromHTMLValue: NullFromHTMLValue
    };

    /*
     ** Public funtions
     */

    function ParameterObject(div)
    {
        var name = div.find(".name").val();
        // If the name is empty, we cannot create a valid parameter object.
        if (!name) return null;

        var type;
        var typeName = div.find(".parameter-type-select").val();
        if (typeName === "enumeration")
        {
            type = Config.types[typeName].loadTypeFromDOM(div.find(".enumeration-value-list"));
        }
        else
        {
            type = Config.types[typeName];
        }

        return {
            id: div.prop('id'),
            name: name,
            // TODO: use type.default instead of separate initialValue
            initialValue: Config.types[typeName].getFromDOM(div.find(".parameter-initial-value-container")),
            type: type,
            description: div.find(".description").val()
        };
    }

    function PreconditionObject(preconditionDiv)
    {
        var preconditionObject = {};
        // Save selected type of precondition
        preconditionObject.type = preconditionDiv.children(
            ".groupPreconditionRadioDiv").find(
            'input[type=radio]:checked').val();

        // Save preconditions.
        var preconditionsArray = [];

        preconditionDiv.children(".groupPreconditionDiv").children().each(
            function()
            {
                if ($(this).hasClass("groupprecondition"))
                {
                    preconditionsArray.push(PreconditionObject($(this)));
                }
                else
                {
                    preconditionsArray.push(
                        SinglePreconditionObject($(this)));
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

    function NullFromHTMLValue(value)
    {
        return (value != "(null)" ? value : null);
    }

    /*
     ** Private Functions
     */

    function SinglePreconditionObject(div)
    {
        return {
            idRef: div.find(".parameter-idref-select").val(),
            test: div.find(".test").val(),
            value: Utils.parseDecimalIntWithDefault(div.find(".value").val(),
                0)
        };
    }

})();
