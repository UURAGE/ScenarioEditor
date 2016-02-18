/*
//This program has been developed by students from the bachelor Computer Science at Utrecht University 
//within the Software and Game project courses 2013-2015
//©Copyright Utrecht University (Department of Information and Computing Sciences) 
*/

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
        intentionObject: IntentionObject,
        nullFromHTMLValue: NullFromHTMLValue
    };

    /*
     ** Public funtions
     */

    function ConversationObject(div)
    {
        return {
            type: $(div).attr("class").split(' ')[1],
            text: Main.escapeTags(div.find("textarea.text").val()),
        };
    }

    function ParameterObject(div)
    {
        var name = div.find(".name").val();
        // If the name is empty, we cannot create a valid parameter object.
        if (name === "") return null;

        var minimumScore = Load.parseDecimalIntWithDefault(div.find(
                ".minimumScore").val(), 0);
        var maximumScore =  Load.parseDecimalIntWithDefault(div.find(
                ".maximumScore").val(), 0);

        // Make sure maximumScore is always bigger than minimumScore!
        if (maximumScore <= minimumScore)
            maximumScore = minimumScore + 1;

        return {
            name: div.find(".name").val(),
            initialValue: Load.parseDecimalIntWithDefault(div.find(
                ".initialValue").val(), 0),
            weightForFinalScore: Load.parseDecimalIntWithDefault(div.find(
                ".weightForFinalScore").val(), 0),
            minimumScore: minimumScore,
            maximumScore: maximumScore,
            parameterDescription: div.find(".parameterDescription").val()        };
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
            parameterid: div.find(".parameterid").find(
                "option:selected").val(),
            changeType: div.find(".changeType").find("option:selected")
                .val(),
            value: Load.parseDecimalIntWithDefault(div.find(".value").val(),
                0)
        };
    }

    function IntentionObject(div)
    {
        var name = div.find(".name").val();
        return (name === "" ? null :
        {
            name: Main.escapeTags(div.find(".name").val())
        });
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
            parameterid: div.find(".parameterid").val(),
            test: div.find(".test").val(),
            value: Load.parseDecimalIntWithDefault(div.find(".value").val(),
                0)
        };
    }

})();
