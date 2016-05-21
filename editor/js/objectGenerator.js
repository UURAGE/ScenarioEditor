/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

// Functions to create specific objects.

var ObjectGenerator;

(function()
{
    ObjectGenerator =
    {
        conversationObject: ConversationObject,
        parameterObject: ParameterObject,
        preconditionObject: PreconditionObject,
        effectObject: EffectObject,
        nullFromHTMLValue: NullFromHTMLValue
    };

    /*
     ** Public funtions
     */

    function ConversationObject(div)
    {
        return {
            type: $(div).attr("class").split(' ')[1],
            text: div.find("textarea.text").val(),
        };
    }

    function ParameterObject(div)
    {
        var id = div.prop('id');
        var name = div.find(".name").val();
        // If the name is empty, we cannot create a valid parameter object.
        if (!name) return null;

        var minimumScore = Utils.parseDecimalIntWithDefault(div.find(
                ".minimumScore").val(), 0);
        var maximumScore =  Utils.parseDecimalIntWithDefault(div.find(
                ".maximumScore").val(), 0);

        // Make sure maximumScore is always bigger than minimumScore!
        if (maximumScore <= minimumScore)
            maximumScore = minimumScore + 1;

        return {
            id: id,
            name: name,
            initialValue: Utils.parseDecimalIntWithDefault(div.find(
                ".initialValue").val(), 0),
            weightForFinalScore: Utils.parseDecimalIntWithDefault(div.find(
                ".weightForFinalScore").val(), 0),
            minimumScore: minimumScore,
            maximumScore: maximumScore,
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
        return {
            idRef: div.find(".parameter-idref-select").find("option:selected").val(),
            changeType: div.find(".changeType").find("option:selected").val(),
            value: Utils.parseDecimalIntWithDefault(div.find(".value").val(),0)
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
