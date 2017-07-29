/* © Utrecht University (Department of Information and Computing Sciences) */

var Condition;

(function()
{
    "use strict";

    Condition =
    {
        appendControlsTo: appendControlsTo,
        getFromDOM: getFromDOM,
        setInDOM: setInDOM,
        fromXML: fromXML,
        toXML: toXML,
        handleParameterTypeChange: handleParameterTypeChange,
        handleParameterRemoval: handleParameterRemoval
    };

    var radioButtonCounter = 0;

    function appendControlsTo(container, allowReferenceConditions)
    {
        appendGroupConditionControlsTo(container, allowReferenceConditions, true);
    }

    // May return null if container contains no conditions
    function getFromDOM(container)
    {
        var getConditionFromDOM = function(conditionContainer)
        {
            var type = conditionContainer.children(".groupConditionRadioDiv").find('input[type=radio]:checked').val();

            var subconditions = [];
            conditionContainer.children(".groupConditionDiv").children().each(function()
            {
                var subcondition;
                if ($(this).hasClass("groupcondition"))
                {
                    subcondition = getConditionFromDOM($(this));
                    if (subcondition) subconditions.push(subcondition);
                }
                else
                {
                    var parameterIdRef = $(this).find(".parameter-idref-select").val();
                    var characterIdRef = $(this).find(".character-idref-select").val();

                    var parameter = Config.findParameterById(parameterIdRef, characterIdRef);
                    if (!parameter) parameter = Parameters.container.byId[parameterIdRef];

                    subcondition = {};
                    subcondition.idRef = parameterIdRef;
                    subcondition.operator = $(this).find(".condition-operator-select").val();
                    if (subcondition.operator in Types.relationalOperators)
                    {
                        subcondition.value = parameter.type.getFromDOM($(this).find(".condition-value-container"));
                    }

                    if (characterIdRef) subcondition.characterIdRef = characterIdRef;
                    subconditions.push(subcondition);
                }
            });

            if (subconditions.length > 1)
            {
                return {
                    type: type,
                    subconditions: subconditions
                };
            }
            else if (subconditions.length === 1)
            {
                return subconditions[0];
            }
            else
            {
                return null;
            }
        };
        return getConditionFromDOM(container.children('.condition'));
    }

    function setInDOM(container, rootCondition, allowReferenceConditions)
    {
        var setConditionInDOM = function(parentContainer, condition, isRoot)
        {
            if ("type" in condition)
            {
                var groupConditionContainer;
                if (!isRoot)
                {
                    groupConditionContainer = appendGroupConditionControlsTo(parentContainer, allowReferenceConditions, false);
                }
                else
                {
                    groupConditionContainer = parentContainer;
                }
                groupConditionContainer.children(".groupConditionRadioDiv").find("input[value=" + condition.type + "]").prop('checked', true);
                condition.subconditions.forEach(function(subcondition)
                {
                    setConditionInDOM(groupConditionContainer.children(".groupConditionDiv"), subcondition, false);
                });
            }
            else
            {
                if (isRoot)
                {
                    parentContainer = parentContainer.children(".groupConditionDiv");
                }
                var parameter = Config.findParameterById(condition.idRef, condition.characterIdRef);
                if (!parameter) parameter = Parameters.container.byId[condition.idRef];

                var conditionContainer = appendCondition(parentContainer, allowReferenceConditions);
                conditionContainer.find(".parameter-idref-select").val(condition.idRef).trigger('change');
                conditionContainer.find(".character-idref-select").val(condition.characterIdRef);
                conditionContainer.find(".condition-operator-select").val(condition.operator).trigger('change');
                if (condition.operator in Types.relationalOperators)
                {
                    parameter.type.setInDOM(conditionContainer.find(".condition-value-container"), condition.value);
                }
            }
        };
        setConditionInDOM(container.children('.condition'), rootCondition, true);
    }

    function fromXML(conditionXML)
    {
        if (conditionXML.nodeName == "condition" || conditionXML.nodeName == "characterCondition" ||
            conditionXML.nodeName == "referenceCondition" || conditionXML.nodeName == "characterReferenceCondition")
        {
            var parameterIdRef = conditionXML.attributes.idref.value;
            var characterIdRef;
            if (conditionXML.nodeName == "characterCondition" || conditionXML.nodeName == "characterReferenceCondition")
            {
                characterIdRef = conditionXML.attributes.characteridref.value;
            }

            var parameter = Config.findParameterById(parameterIdRef, characterIdRef);
            if (!parameter) parameter = Parameters.container.byId[parameterIdRef];

            if (parameter)
            {
                var condition = {
                    idRef: parameterIdRef,
                    operator: conditionXML.attributes.operator.value
                };
                if (conditionXML.nodeName == "condition" || conditionXML.nodeName == "characterCondition")
                {
                    condition.value = parameter.type.fromXML(conditionXML);
                }
                if (characterIdRef) condition.characterIdRef = characterIdRef;
                return condition;
            }
            return null;
        }
        else
        {
            return {
                type: conditionXML.nodeName,
                subconditions: $(conditionXML).children().map(function()
                {
                    return fromXML(this);
                }).get()
            };
        }
    }

    function toXML(parentXML, condition)
    {
        if ("type" in condition)
        {
            var typeXML = Utils.appendChild(parentXML, condition.type);
            condition.subconditions.forEach(function(subcondition)
            {
                toXML(typeXML, subcondition);
            });
        }
        else
        {
            var parameter = Config.findParameterById(condition.idRef, condition.characterIdRef);
            if (!parameter) parameter = Parameters.container.byId[condition.idRef];

            var isReferenceCondition = condition.operator in Types.unaryOperators;

            var conditionXML;
            if (condition.characterIdRef)
            {
                conditionXML = Utils.appendChild(parentXML, isReferenceCondition ? "characterReferenceCondition" : "characterCondition");
                conditionXML.setAttribute("characteridref", condition.characterIdRef);
            }
            else
            {
                conditionXML = Utils.appendChild(parentXML, isReferenceCondition ? "referenceCondition" : "condition");
            }

            conditionXML.setAttribute("idref", condition.idRef);
            conditionXML.setAttribute("operator", condition.operator);
            if (!isReferenceCondition) parameter.type.toXML(conditionXML, condition.value);
            return conditionXML;
        }
    }

    function handleParameterTypeChange(oldParameter, newParameter, condition)
    {
        if ("type" in condition)
        {
            condition.subconditions.forEach(function(subcondition)
            {
                handleParameterTypeChange(oldParameter, newParameter, subcondition);
            });
        }
        else if (condition.idRef === oldParameter.id)
        {
            var hasRelationalOperator = newParameter.type.relationalOperators.indexOf(Types.relationalOperators[condition.operator]) !== -1;
            var hasUnaryOperator = newParameter.type.unaryOperators.indexOf(Types.unaryOperators[condition.operator]) !== -1;
            if (!hasRelationalOperator && !hasUnaryOperator)
            {
                condition.operator = newParameter.type.relationalOperators[0].name;
            }

            condition.value = newParameter.type.castFrom(oldParameter.type, condition.value);
        }
    }

    // Returns the condition object or null if there are no conditions left
    function handleParameterRemoval(parameterId, condition)
    {
        if ("type" in condition)
        {
            for (var i = 0; i < condition.subconditions.length; i++)
            {
                var subcondition = condition.subconditions[i];
                subcondition = handleParameterRemoval(parameterId, subcondition);
                if (subcondition)
                {
                    condition.subconditions[i] = subcondition;
                }
                else
                {
                    condition.subconditions.splice(i, 1);
                    i--;
                }
            }

            if (condition.subconditions.length > 1)
            {
                return condition;
            }
            else if (condition.subconditions.length === 1)
            {
                return condition.subconditions[0];
            }
            else
            {
                return null;
            }
        }
        else
        {
            if (condition.idRef === parameterId)
            {
                return null;
            }
            else
            {
                return condition;
            }
        }
    }

    function appendGroupConditionControlsTo(container, allowReferenceConditions, isRoot)
    {
        var conditionContainer = appendGroupCondition(container, allowReferenceConditions);
        if (isRoot)
        {
            conditionContainer.children('.delete').remove();
        }
        return conditionContainer;
    }

    function appendCondition(container, allowReferenceConditions)
    {
        var condition = $('<div>', { class: "condition" });
        container.append(condition);
        var idRefSelect = $('<select>', { class: "parameter-idref-select" });
        condition.append(idRefSelect);
        var testContainer = $('<span>', { class: "condition-test-container" });
        condition.append(testContainer);
        var deleteButton = Parts.deleteButton();
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
            if (allowReferenceConditions)
            {
                parameter.type.unaryOperators.forEach(function(unaryOp)
                {
                    operatorSelect.append($('<option>', { value: unaryOp.name, text: unaryOp.uiName }));
                });
            }
            var handleOperatorChange = function(operatorName)
            {
                var previousValueContainer = testContainer.children(".condition-value-container");
                var previousValue;
                if (previousValueContainer.length > 0)
                {
                    previousValue = parameter.type.getFromDOM(previousValueContainer);
                }
                previousValueContainer.remove();

                if (operatorName in Types.relationalOperators)
                {
                    var controlContainer = $('<span>', { class: "condition-value-container" });
                    parameter.type.appendControlTo(controlContainer);
                    if (previousValue) parameter.type.setInDOM(controlContainer, previousValue);
                    testContainer.append(controlContainer);
                }
            };
            operatorSelect.on('change', function() { handleOperatorChange($(this).val()); });
            testContainer.append(operatorSelect);
            handleOperatorChange(operatorSelect.val());
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

    function appendGroupCondition(container, allowReferenceConditions)
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
        groupCondition.append(groupConditionRadio);

        var subconditionsContainer = $('<div>', { class: "groupConditionDiv" });
        groupCondition.append(subconditionsContainer);

        var addConditionButton = Parts.addButton(i18next.t('condition:add_condition'));
        addConditionButton.on('click', function()
        {
            if (Parameters.atLeastOneUserDefined() || Config.atLeastOneParameter())
            {
                var condition = appendCondition(subconditionsContainer, allowReferenceConditions);
                Utils.focusFirstTabindexedDescendant(condition);
            }
            else
            {
                alert(i18next.t('condition:error.no_test'));
            }
        });
        groupCondition.append(addConditionButton);

        var addGroupConditionButton = Parts.addButton(i18next.t('condition:add_group'));
        addGroupConditionButton.on('click', function()
        {
            if (Parameters.atLeastOneUserDefined() || Config.atLeastOneParameter())
            {
                appendGroupCondition(subconditionsContainer, allowReferenceConditions);
                addConditionButton.focus();
            }
            else
            {
                alert(i18next.t('condition:error.no_test'));
            }
        });
        groupCondition.append(addGroupConditionButton);

        var deleteButton = Parts.deleteButton();
        deleteButton.append(i18next.t('condition:delete_group'));
        deleteButton.on('click', function()
        {
            groupCondition.remove();
            updateGroupConditionCounter(container.closest(".groupcondition"));
        });
        groupCondition.append(deleteButton);

        container.append(groupCondition);

        updateGroupConditionCounter(container.closest(".groupcondition"));

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
        {
            if (states[state])
                div.addClass(state);
            else
                div.removeClass(state);
        }
    }

})();
