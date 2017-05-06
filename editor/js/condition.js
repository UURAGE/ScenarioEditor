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

    var radioButtonCounter = 0;

    $(document).ready(function()
    {
        $("#preconditionsDiv").on('click', ".addCondition", function()
        {
            if (Parameters.atLeastOneUserDefined() || Config.atLeastOneParameter())
            {
                var container = $(this).parent().children(".groupConditionDiv");
                appendCondition(container);
                var addedDiv = container.children(".condition").last();
                Utils.focusFirstTabindexedDescendant(addedDiv);
            }
            else
            {
                alert(i18next.t('condition:error.no_test'));
            }
        });
        $("#preconditionsDiv").on('click', ".addGroupCondition", function()
        {
            if (Parameters.atLeastOneUserDefined() || Config.atLeastOneParameter())
            {
                var container = $(this).parent().children(".groupConditionDiv");
                appendGroupCondition(container);
                container.children(".condition").last().find('button').first().focus();
            }
            else
            {
                alert(i18next.t('condition:error.no_test'));
            }
        });
    });

    function insert(container, condition)
    {
        var conditionContainer = appendGroupCondition(container);
        var subconditionsContainer = conditionContainer.children(".groupConditionDiv");
        var conditionTypeContainer = conditionContainer.children(".groupConditionRadioDiv");
        conditionTypeContainer.find("input[value=" + condition.type + "]").prop('checked', true);
        condition.subconditions.forEach(function(subcondition)
        {
            if ("type" in subcondition)
            {
                insert(subconditionsContainer, subcondition);
            }
            else
            {
                var parameter = Config.findParameterById(subcondition.idRef, subcondition.characterIdRef);
                if (!parameter) parameter = Parameters.container.byId[subcondition.idRef];

                var subconditionContainer = appendCondition(subconditionsContainer);
                subconditionContainer.find(".parameter-idref-select").val(subcondition.idRef).trigger('change');
                subconditionContainer.find(".character-idref-select").val(subcondition.characterIdRef);
                subconditionContainer.find(".condition-operator-select").val(subcondition.operator);
                parameter.type.setInDOM(subconditionContainer.find(".condition-value-container"), subcondition.value);
            }
        });
    }

    function appendCondition(container)
    {
        var condition = $('<div>', { class: "condition" });
        container.append(condition);
        var idRefSelect = $('<select>', { class: "parameter-idref-select" });
        condition.append(idRefSelect);
        var testContainer = $('<span>', { class: "condition-test-container" });
        condition.append(testContainer);
        var deleteButton = $(Parts.getDeleteParentButtonHTML());
        deleteButton.on('click', function()
        {
            condition.remove();
            updateGroupConditionCounter(container.closest(".groupcondition"));
        });
        condition.append(deleteButton);

        Parameters.insertInto(idRefSelect);
        Config.insertParametersInto(idRefSelect);

        var changeTestType = function(parameterIdRef)
        {
            var parameter = Config.findParameterById(parameterIdRef);
            if (!parameter) parameter = Parameters.container.byId[parameterIdRef];

            if (Config.isCharacterParameter(parameterIdRef))
            {
                var characterIdRefSelect = $('<select>', { class: "character-idref-select" });
                Config.insertCharactersInto(characterIdRefSelect, parameterIdRef);
                testContainer.append(characterIdRefSelect);
            }

            var operatorSelect = $('<select>', { class: "condition-operator-select" });
            parameter.type.relationalOperators.forEach(function(relOp)
            {
                operatorSelect.append($('<option>', { value: relOp.name, text: relOp.uiName }));
            });
            testContainer.append(operatorSelect);

            var controlContainer = $('<span>', { class: "condition-value-container" });
            parameter.type.appendControlTo(controlContainer);
            testContainer.append(controlContainer);
        };
        changeTestType(idRefSelect.val());
        idRefSelect.on('change', function()
        {
            testContainer.empty();
            changeTestType($(this).val());
        });

        updateGroupConditionCounter(container.closest(".groupcondition"));
        return condition;
    }

    function appendGroupCondition(container)
    {
        var groupCondition = $('<div>', { class: "condition groupcondition empty" });
        groupCondition.append($('<div>', { class: "emptyLabel", text: i18next.t('condition:empty_group') }));
        groupCondition.append($('<div>', { class: "singleLabel hidden", text: i18next.t('condition:one_condition_group') }));

        var groupConditionRadio = $('<div>', { class: "groupConditionRadioDiv" });
        var andLabel = $('<label>').append($('<input>', { type: 'radio', value: 'and', checked: 'checked' }));
        andLabel.append(i18next.t('condition:all_true'));
        var orLabel = $('<label>').append($('<input>', { type: 'radio', value: 'or' }));
        orLabel.append(i18next.t('condition:one_true'));
        groupConditionRadio.append(andLabel).append(orLabel);
        radioButtonCounter += 1;
        groupConditionRadio.find("input").each(function()
        {
            $(this).prop("name", "conRadio" + radioButtonCounter);
        });
        updateGroupConditionCounter(container.closest(".groupcondition"));
        groupCondition.append(groupConditionRadio);

        groupCondition.append($('<div>', { class: "groupConditionDiv" }));
        groupCondition.append(
            $('<button>', { class: "addCondition"})
                .append($('<img>', { src: editor_url + "png/others/plus.png", alt: '+' }))
                .append(i18next.t('condition:add_condition')
            )
        );
        groupCondition.append(
            $('<button>', { class: "addGroupCondition"})
                .append($('<img>', { src: editor_url + "png/others/plus.png", alt: '+' }))
                .append(i18next.t('condition:add_group')
            )
        );
        var deleteButton = $(Parts.getDeleteParentButtonHTML());
        deleteButton.append(i18next.t('condition:delete_group'));
        deleteButton.on('click', function()
        {
            groupCondition.remove();
            updateGroupConditionCounter(container.closest(".groupcondition"));
        });
        groupCondition.append(deleteButton);

        container.append(groupCondition);

        return groupCondition;
    }

    function updateGroupConditionCounter(div)
    {
        var childCount = div.children(".groupConditionDiv").children().length;
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
        var condition = {};
        // Save selected type of condition
        condition.type = container.children(".groupConditionRadioDiv").find('input[type=radio]:checked').val();

        // Save conditions.
        var subconditions = [];

        container.children(".groupConditionDiv").children().each(function()
        {
            if ($(this).hasClass("groupcondition"))
            {
                subconditions.push(extract($(this)));
            }
            else
            {
                var parameterIdRef = $(this).find(".parameter-idref-select").val();
                var characterIdRef = $(this).find(".character-idref-select").val();

                var parameter = Config.findParameterById(parameterIdRef, characterIdRef);
                if (!parameter) parameter = Parameters.container.byId[parameterIdRef];

                var subcondition =
                {
                    idRef: parameterIdRef,
                    operator: $(this).find(".condition-operator-select").val(),
                    value: parameter.type.getFromDOM($(this).find(".condition-value-container"))
                };

                if (characterIdRef) subcondition.characterIdRef = characterIdRef;
                subconditions.push(subcondition);
            }
        });
        condition.subconditions = subconditions;
        return condition;
    }
})();
