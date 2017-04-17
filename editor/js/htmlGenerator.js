/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

var HtmlGenerator;

(function()
{
    "use strict";

    HtmlGenerator =
    {
        addEmptyUserDefinedParameterEffect: addEmptyUserDefinedParameterEffect,
        insertPreconditions: insertPreconditions
    };

    //Get all the raw HTLM from Parts.js
    var preconditionHTML = Parts.getPreconditionHTML();
    var groupPreconditionHTML = Parts.getGroupPreconditionHTML();
    var parameterEffectHTML = Parts.getParameterEffectHTML();
    var radioButtonCounter = 0;

    $(document).ready(function()
    {
        $("#preconditionsDiv").on('click', ".addPrecondition", function()
        {
            if (Parameters.atLeastOneUserDefined() || Config.atLeastOneParameter())
            {
                var container = $(this).parent().children(".groupPreconditionDiv");
                addEmptyPrecondition(container);
                var addedDiv = container.children(".precondition").last();
                Utils.focusFirstTabindexedDescendant(addedDiv);
            }
            else
            {
                alert(i18next.t('htmlGenerator:error.no_test'));
            }
        });
        $("#preconditionsDiv").on('click', ".addGroupPrecondition", function()
        {
            if (Parameters.atLeastOneUserDefined() || Config.atLeastOneParameter())
            {
                var container = $(this).parent().children(".groupPreconditionDiv");
                addEmptyGroupPrecondition(container);
                container.children(".precondition").last().find('button').first().focus();
            }
            else
            {
                alert(i18next.t('htmlGenerator:error.no_test'));
            }
        });

        $("#addUserDefinedParameterEffect").on('click', function()
        {
            if (Parameters.atLeastOneUserDefined())
            {
                addEmptyUserDefinedParameterEffect();
                Utils.focusFirstTabindexedDescendant($(".effect").last());
            }
            else
            {
                alert(i18next.t('htmlGenerator:error.no_effect'));
            }
        });

        // Event handlers for removing HTML.
        $("#preconditionsDiv").on('click', '.deleteParent', function()
        {
            var containingGroupPrecondition = $(this).parent().parent().closest(".groupprecondition");
            $(this).parent().remove();
            updateGroupPreconditionCounter(containingGroupPrecondition);
        });

        $("#userDefinedParameterEffects").on('click', '.deleteParent', function()
        {
            $(this).parent().remove();
        });
    });

    function addEmptyUserDefinedParameterEffect()
    {
        $("#userDefinedParameterEffects").append(parameterEffectHTML);
        var addedDiv = $("#userDefinedParameterEffects").children().last();

        insertParameters(addedDiv, Parameters.container);

        var idRefSelect = addedDiv.find(".parameter-idref-select");
        var effectDiv = addedDiv.find(".parameter-effect-container");
        var changeEffectType = function(pId)
        {
            var operatorSelect = $('<select>', { class: "parameter-effect-operator-select" });
            Parameters.container.byId[pId].type.assignmentOperators.forEach(function(op)
            {
                operatorSelect.append($('<option>', { value: op.name, text: op.uiName }));
            });
            effectDiv.append(operatorSelect);

            var controlContainer = $('<span>', { class: "parameter-effect-value-container" });
            Parameters.container.byId[pId].type.appendControlTo(controlContainer);
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
                var parameter = Config.findParameterById(currentPrecondition.idRef, currentPrecondition.characterIdRef);
                if (!parameter) parameter = Parameters.container.byId[currentPrecondition.idRef];

                addedDiv = addEmptyPrecondition(divToAddChildren);
                addedDiv.find(".parameter-idref-select").val(currentPrecondition.idRef).trigger('change');
                addedDiv.find(".character-idref-select").val(currentPrecondition.characterIdRef);
                addedDiv.find(".precondition-operator-select").val(currentPrecondition.operator);
                parameter.type.setInDOM(addedDiv.find(".precondition-value-container"), currentPrecondition.value);
            }
        }
    }

    function addEmptyPrecondition(divToAdd)
    {
        divToAdd.append(preconditionHTML);
        var addedDiv = $(divToAdd).children().last();

        insertParameters(addedDiv, Parameters.container);
        insertParameters(addedDiv, Config.container.parameters);
        insertParameters(addedDiv, Config.container.characters.parameters);
        for (var characterId in Config.container.characters.byId)
        {
            insertParameters(addedDiv, Config.container.characters.byId[characterId].parameters);
        }

        var idRefSelect = addedDiv.find(".parameter-idref-select");
        var testContainer = addedDiv.find(".precondition-test-container");
        var changeTestType = function(parameterIdRef)
        {
            var parameter = Config.findParameterById(parameterIdRef);
            if (!parameter) parameter = Parameters.container.byId[parameterIdRef];

            var characterIdRefSelect;
            if (Config.isCharacterParameter(parameterIdRef))
            {
                var inIndividualCharacter = Config.container.characters.sequence.some(function(character)
                {
                    if (parameterIdRef in Config.container.characters.byId[character.id].parameters.byId)
                    {
                        characterIdRefSelect = $('<select>', { class: "character-idref-select" });
                        characterIdRefSelect.append($('<option>', { value: character.id, text: character.name ? character.name : character.id }));
                        if (Config.container.characters.sequence.length === 1) characterIdRefSelect.hide();
                        testContainer.append(characterIdRefSelect);
                        return true;
                    }
                    return false;
                });

                if (!inIndividualCharacter)
                {
                    characterIdRefSelect = $('<select>', { class: "character-idref-select" });
                    Config.container.characters.sequence.forEach(function(character)
                    {
                        characterIdRefSelect.append($('<option>', { value: character.id, text: character.name ? character.name : character.id }));
                    });
                    if (Config.container.characters.sequence.length === 1) characterIdRefSelect.hide();
                    testContainer.append(characterIdRefSelect);
                }
            }

            var operatorSelect = $('<select>', { class: "precondition-operator-select" });
            parameter.type.relationalOperators.forEach(function(relOp)
            {
                operatorSelect.append($('<option>', { value: relOp.name, text: relOp.uiName }));
            });
            testContainer.append(operatorSelect);

            var controlContainer = $('<span>', { class: "precondition-value-container" });
            parameter.type.appendControlTo(controlContainer);
            testContainer.append(controlContainer);
        };
        changeTestType(idRefSelect.val());
        idRefSelect.on('change', function()
        {
            testContainer.empty();
            changeTestType($(this).val());
        });

        updateGroupPreconditionCounter(divToAdd.closest(".groupprecondition"));
        return addedDiv;
    }

    function addEmptyGroupPrecondition(divToAdd)
    {
        divToAdd.append(groupPreconditionHTML);
        var addedDiv = $(divToAdd).children().last();
        radioButtonCounter += 1;
        addedDiv.children(".groupPreconditionRadioDiv").find("input").each(function()
        {
            $(this).prop("name", "preconRadio" + radioButtonCounter);
        });
        updateGroupPreconditionCounter(divToAdd.closest(".groupprecondition"));
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
        var select = div.find(".parameter-idref-select");

        var appendParameter = function(parameterItem)
        {
            if (parameterItem.kind && parameterItem.kind !== "parameter")
            {
                parameterItem.sequence.forEach(appendParameter);
            }
            else
            {
                select.append($('<option>', { value: parameterItem.id, text: parameterItem.name }));
            }
        };
        parameters.sequence.forEach(appendParameter);
    }

})();
