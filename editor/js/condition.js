/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

var Condition;

(function()
{
    "use strict";

    Condition =
    {
        insert: insert,
        extract: extract
    };

    //Get all the raw HTLM from Parts.js
    var preconditionHTML = Parts.getPreconditionHTML();
    var groupPreconditionHTML = Parts.getGroupPreconditionHTML();
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
                alert(i18next.t('condition:error.no_test'));
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
                alert(i18next.t('condition:error.no_test'));
            }
        });

        // Event handlers for removing HTML.
        $("#preconditionsDiv").on('click', '.deleteParent', function()
        {
            var containingGroupPrecondition = $(this).parent().parent().closest(".groupprecondition");
            $(this).parent().remove();
            updateGroupPreconditionCounter(containingGroupPrecondition);
        });
    });

    function insert(container, conditions)
    {
        var addedDiv = addEmptyGroupPrecondition(container);
        addedDiv.children(".groupPreconditionRadioDiv").find(
            "input[value=" + conditions.type + "]").prop(
            'checked', true);

        var divToAddChildren = addedDiv.children(".groupPreconditionDiv");
        for (var i = 0; i < conditions.preconditions.length; i++)
        {
            var currentPrecondition = conditions.preconditions[i];
            if ("type" in currentPrecondition)
            {
                insert(divToAddChildren, currentPrecondition);
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

        var idRefSelect = addedDiv.find(".parameter-idref-select");
        Parameters.insertInto(idRefSelect);
        Config.insertParametersInto(idRefSelect);

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

    function extract(container)
    {
        var preconditionObject = {};
        // Save selected type of precondition
        preconditionObject.type = container.children(".groupPreconditionRadioDiv").find('input[type=radio]:checked').val();

        // Save preconditions.
        var preconditionsArray = [];

        container.children(".groupPreconditionDiv").children().each(function()
        {
            if ($(this).hasClass("groupprecondition"))
            {
                preconditionsArray.push(extract($(this)));
            }
            else
            {
                var parameterIdRef = $(this).find(".parameter-idref-select").val();
                var characterIdRef = $(this).find(".character-idref-select").val();

                var parameter = Config.findParameterById(parameterIdRef, characterIdRef);
                if (!parameter) parameter = Parameters.container.byId[parameterIdRef];

                var precondition = {
                    idRef: parameterIdRef,
                    operator: $(this).find(".precondition-operator-select").val(),
                    value: parameter.type.getFromDOM($(this).find(".precondition-value-container"))
                };

                if (characterIdRef) precondition.characterIdRef = characterIdRef;
                preconditionsArray.push(precondition);
            }
        });
        preconditionObject.preconditions = preconditionsArray;
        return preconditionObject;
    }
})();
