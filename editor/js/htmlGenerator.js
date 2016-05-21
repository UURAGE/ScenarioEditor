/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

var HtmlGenerator;

(function()
{
    "use strict";

    var parameterHTML = Parts.getParameterDefinitionHTML();

    HtmlGenerator =
    {
        parameterHTML: parameterHTML,
        addConversationOfType: addConversationOfType,
        addEmptyParameterEffect: addEmptyParameterEffect,
        insertPreconditions: insertPreconditions,
        nullToHTMLValue: nullToHTMLValue,
        showScores: showScores
    };

    //Get all the raw HTLM from Parts.js
    var conversationHTML = Parts.getConversationTextHTML();
    var preconditionHTML = Parts.getPreconditionHTML();
    var groupPreconditionHTML = Parts.getGroupPreconditionHTML();
    var parameterEffectHTML = Parts.getParameterEffectHTML();
    var scoreHTML = Parts.getScoreHTML();
    var radioButtonCounter = 0;

    $(document).ready(function()
    {
        // Set event handlers:
        // Event handlers for adding HTML.
        $(".addConversation").on('click', function()
        {
            addConversation(this);
        });
        $("#preconditionsDiv").on('click', ".addPrecondition",
            function()
            {
                if (Metadata.atLeastOneUserDefinedParameter())
                {
                    var container = $(this).parent().children(".groupPreconditionDiv");
                    addEmptyPrecondition(container);
                    var addedDiv = container.children(".precondition").last();
                    focusFirstTabindexedDescendant(addedDiv);
                }
                else
                {
                    alert(
                        LanguageManager.sLang("edt_html_error_no_test")
                    );
                }
            });
        $("#preconditionsDiv").on('click', ".addGroupPrecondition",
            function()
            {
                if (Metadata.atLeastOneUserDefinedParameter())
                {
                    var container = $(this).parent().children(".groupPreconditionDiv");
                    addEmptyGroupPrecondition(container);
                    container.children(".precondition").last().find(
                        'button').first().focus();
                }
                else
                {
                    alert(
                        LanguageManager.sLang("edt_html_error_no_test")
                    );
                }
            });
        $("#addUserDefinedParameterEffect").on('click', function()
        {
            if (Metadata.atLeastOneUserDefinedParameter())
            {
                addEmptyParameterEffect(Metadata.metaObject.parameters);
                focusFirstTabindexedDescendant($(".effect").last());
            }
            else
            {
                alert(
                    LanguageManager.sLang("edt_html_error_no_effect")
                );
            }
        });

        $("#addParameter").on('click', function()
        {
            $("#params").append(HtmlGenerator.parameterHTML);
            focusFirstTabindexedDescendant($("#params").children().last());
            $("#paramsTableHead").removeClass("hidden");
        });

        $("#addTimeParameter").on('click', function()
        {
            var isTime = $("#params").find(".isT").length;
            var isTimeRemoved = $("#params").find(".isT.toBeRemoved").length;
            //console.log('t\'s: \t'+ isTime);
            //console.log('t.R\'s: \t'+ isTimeRemoved);

            // if the timeParameterObject is empty, or if it is filled, but
            // the parameter in the dialog has been removed (in that case the
            // timeParameterObject has not been updated yet)
            if (Metadata.timePId === null || isTimeRemoved === isTime)
            {
                $("#params").append(HtmlGenerator.parameterHTML);
                var div = $("#params").children().last();
                // console.log(div.children());
                // div.children().children().prop('disabled', true);
                $(div).prop('id', 't');
                div.find(".name").val(LanguageManager.sLang("edt_html_time"));
                div.find(".initialValue").val(0);
                div.find(".weightForFinalScore").val(0);
                Metadata.addTimeParameter(div);

                focusFirstTabindexedDescendant($("#params").children().last());
                $("#paramsTableHead").removeClass("hidden");
                $("#addTimeParameter").addClass("hidden");
            }
        });

        // Event handlers for removing HTML.
        $("#preconditionsDiv").on('click', '.deleteParent',
            function()
            {
                var containingGroupPrecondition =
                    $(this).parent().parent().closest(".groupprecondition");
                $(this).parent().remove();
                updateGroupPreconditionCounter(containingGroupPrecondition);
            });
        $("#userDefinedParameterEffects, #conversationDiv"
        ).on('click', '.deleteParent', function()
        {
            $(this).parent().remove();
        });
    });

    /*
     ** Public Functions
     */

    function addConversationOfType(type)
    {
        $("#conversationDiv").append(conversationHTML);
        var addedDiv = $("#conversationDiv").children().last();
        return addedDiv.addClass(type);
    }

    function addEmptyParameterEffect(parameters)
    {
        $("#userDefinedParameterEffects").append(parameterEffectHTML);
        var addedDiv = $("#userDefinedParameterEffects").children().last();
        insertParameters(addedDiv, parameters);
        return addedDiv;
    }

    function insertPreconditions(precondition, divToAddTo)
    {
        var addedDiv = addEmptyGroupPrecondition(divToAddTo);
        addedDiv.children(".groupPreconditionRadioDiv").find(
            "input[value=" + precondition.type + "]").prop(
            'checked', true);

        var divToAddChildren = addedDiv.children(".groupPreconditionDiv");
        for (var i = 0; i < precondition.preconditions.length; i++)
        {
            var currentPrecondition = precondition.preconditions[i];
            if ("type" in currentPrecondition)
            {
                insertPreconditions(currentPrecondition, divToAddChildren);
            }
            else
            {
                addedDiv = addEmptyPrecondition(divToAddChildren);
                addedDiv.find(".parameter-idref-select").val(currentPrecondition.idRef);
                addedDiv.find(".test").val(currentPrecondition.test);
                addedDiv.find(".value").val(currentPrecondition.value);
            }
        }
    }

    function nullToHTMLValue(value)
    {
        return (value !== null ? value : "(null)");
    }

    function showScores(scores)
    {
        $("#scores").empty();
        var addedDiv;
        for (var name in scores)
        {
            $("#scores").append(scoreHTML);
            addedDiv = $("#scores").children().last();
            addedDiv.find(".name").text(name);
            if (scores[name].min == scores[name].max)
                addedDiv.find(".score").append(scores[name].min);
            else
                addedDiv.find(".score").append(scores[name].min +
                    " "+LanguageManager.sLang("edt_html_up_to")+" " + scores[name].max);
        }
        return addedDiv;
    }

    /*
     ** Private Functions
     */

    // Appends and returns html to show the objects.
    function addConversation(object)
    {
        var addedConversation = addConversationOfType($(object).data("type"));
        focusFirstTabindexedDescendant($(".conversation").last());
        return addedConversation;
    }

    function addEmptyPrecondition(divToAdd)
    {
        divToAdd.append(preconditionHTML);
        var addedDiv = $(divToAdd).children().last();
        insertParameters(addedDiv, Metadata.metaObject.parameters);
        insertParameters(addedDiv, Config.configObject.parameters);
        updateGroupPreconditionCounter(divToAdd.closest(".groupprecondition"));
        return addedDiv;
    }

    function addEmptyGroupPrecondition(divToAdd)
    {
        divToAdd.append(groupPreconditionHTML);
        var addedDiv = $(divToAdd).children().last();
        radioButtonCounter += 1;
        addedDiv.children(".groupPreconditionRadioDiv").find("input").each(
            function()
            {
                $(this).prop("name", "preconRadio" + radioButtonCounter);
            });
        updateGroupPreconditionCounter(divToAdd.closest(
            ".groupprecondition"));
        return addedDiv;
    }

    function updateGroupPreconditionCounter(div)
    {
        var childCount = div.children(".groupPreconditionDiv").children().length;
        var states = {
            empty: childCount === 0,
            single: childCount === 1,
            multiple: childCount > 1
        };

        for (var state in states)
            if (states[state])
                div.addClass(state);
            else
                div.removeClass(state);
    }

    // Inserts all the parameters for the effects and preconditions.
    function insertParameters(div, parameters)
    {
        for (var pId in parameters.byId)
        {
            div.find(".parameter-idref-select").append('<option value="' + pId + '">' +
                Main.escapeTags(parameters.byId[pId].name) + '</option>');
        }
    }

    // Focuses on the first descendant that has a non-negative tabindex.
    // This includes elements that are focusable by default, like <input> and <select>.
    function focusFirstTabindexedDescendant(element)
    {
        var descendants = $(element).find('*');
        for (var i = 0; i < descendants.length; i++)
        {
            var toTest = $(descendants[i]);
            if (toTest.prop('tabIndex') >= 0)
            {
                return toTest.focus();
            }
        }
        return $();
    }
})();
