/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

var HtmlGenerator;

(function()
{
    "use strict";

    HtmlGenerator =
    {
        addEmptyUserDefinedParameterDefinition: addEmptyUserDefinedParameterDefinition,
        addEmptyUserDefinedParameterEffect: addEmptyUserDefinedParameterEffect,
        insertPreconditions: insertPreconditions,
        nullToHTMLValue: nullToHTMLValue,
    };

    //Get all the raw HTLM from Parts.js
    var parameterHTML = Parts.getParameterDefinitionHTML();
    var preconditionHTML = Parts.getPreconditionHTML();
    var groupPreconditionHTML = Parts.getGroupPreconditionHTML();
    var parameterEffectHTML = Parts.getParameterEffectHTML();
    var radioButtonCounter = 0;

    $(document).ready(function()
    {
        // Set event handlers:
        // Event handlers for adding HTML.
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
                addEmptyUserDefinedParameterEffect();
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
            var addedDiv = addEmptyUserDefinedParameterDefinition();
            focusFirstTabindexedDescendant(addedDiv);
            $("#paramsTableHead").removeClass("hidden");
        });

        $("#addTimeParameter").on('click', function()
        {
            var isTime = $("#params").find(".isT").length;
            var isTimeRemoved = $("#params").find(".isT.removedParameter").length;
            //console.log('t\'s: \t'+ isTime);
            //console.log('t.R\'s: \t'+ isTimeRemoved);

            // if the timeParameterObject is empty, or if it is filled, but
            // the parameter in the dialog has been removed (in that case the
            // timeParameterObject has not been updated yet)
            if (Metadata.timePId === null || isTimeRemoved === isTime)
            {
                $("#params").append(parameterHTML);
                var div = $("#params").children().last();
                // console.log(div.children());
                // div.children().children().prop('disabled', true);
                $(div).prop('id', 't');
                div.find(".name").val(LanguageManager.sLang("edt_html_time"));
                div.find(".parameter-type-select").val("integer");
                div.find(".parameter-type-select").prop("disabled", "disabled");
                div.find(".parameter-initial-value-container").remove();
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
        $("#userDefinedParameterEffects"
        ).on('click', '.deleteParent', function()
        {
            $(this).parent().remove();
        });
    });

    /*
     ** Public Functions
     */

     function addEmptyUserDefinedParameterDefinition()
     {
        $("#params").append(parameterHTML);
        var addedDiv = $("#params").children().last();
        var typeSelect = addedDiv.find('.parameter-type-select');
        var changeParameterType = function(typeName)
        {
            addedDiv.addClass("changedTypeParameter");
            var initialValueContainer = addedDiv.find('.parameter-initial-value-container');
            initialValueContainer.empty();
            Config.types[typeName].appendControlTo(initialValueContainer);
        };
        typeSelect.on('change', function()
        {
            changeParameterType($(this).val());
        });
        typeSelect.change();
        addedDiv.removeClass("changedTypeParameter");
        return addedDiv;
     }

    function addEmptyUserDefinedParameterEffect()
    {
        $("#userDefinedParameterEffects").append(parameterEffectHTML);
        var addedDiv = $("#userDefinedParameterEffects").children().last();

        insertParameters(addedDiv, Metadata.metaObject.parameters);

        var idRefSelect = addedDiv.find(".parameter-idref-select");
        var effectDiv = addedDiv.find(".parameter-effect-container");
        var changeEffectType = function(pId)
        {
            var changeTypeSelect = $('<select>', { class: "parameter-effect-changetype-select" });
            Metadata.metaObject.parameters.byId[pId].type.assignmentOperators.forEach(function(op)
            {
                changeTypeSelect.append($('<option>', { value: op, text: op }));
            });
            effectDiv.append(changeTypeSelect);

            var controlContainer = $('<div>', { class: "parameter-effect-value-container", style:"display:inline" });
            Metadata.metaObject.parameters.byId[pId].type.appendControlTo(controlContainer);
            effectDiv.append(controlContainer);
        };
        changeEffectType(idRefSelect.val());
        idRefSelect.on('change', function()
        {
            effectDiv.empty();
            changeEffectType($(this).val());
        });

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

    /*
     ** Private Functions
     */

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
