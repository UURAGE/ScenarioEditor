/* © Utrecht University and DialogueTrainer */

/* exported Condition */
let Condition;

(function()
{
    "use strict";

    // eslint-disable-next-line no-global-assign
    Condition =
    {
        appendControlsTo: appendControlsTo,
        getFromDOM: getFromDOM,
        setInDOM: setInDOM,
        fromXML: fromXML,
        toXML: toXML,
        handleParameterTypeChange: handleParameterTypeChange,
        filter: filter
    };

    let radioButtonCounter = 0;

    function appendControlsTo(container, allowReferenceConditions)
    {
        appendGroupConditionControlsTo(container, allowReferenceConditions, true);
    }

    // May return null if container contains no conditions
    function getFromDOM(container)
    {
        const getConditionFromDOM = function(conditionContainer)
        {
            const type = conditionContainer.children(".groupConditionRadioDiv").find('input[type=radio]:checked').val();

            const subconditions = [];
            conditionContainer.children(".groupConditionDiv").children().each(function()
            {
                let subcondition;
                if ($(this).hasClass("groupcondition"))
                {
                    subcondition = getConditionFromDOM($(this));
                    if (subcondition) subconditions.push(subcondition);
                }
                else
                {
                    const parameterIdRef = $(this).find(".parameter-idref-select").val();
                    const characterIdRef = $(this).find(".character-idref-select").val();

                    let parameter = Config.findParameterById(parameterIdRef, characterIdRef);
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
        const setConditionInDOM = function(parentContainer, condition, isRoot)
        {
            if ("type" in condition)
            {
                let groupConditionContainer;
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
                let parameter = Config.findParameterById(condition.idRef, condition.characterIdRef);
                if (!parameter) parameter = Parameters.container.byId[condition.idRef];

                const conditionContainer = appendCondition(parentContainer, allowReferenceConditions);
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
            const parameterIdRef = conditionXML.attributes.idref.value;
            let characterIdRef;
            if (conditionXML.nodeName == "characterCondition" || conditionXML.nodeName == "characterReferenceCondition")
            {
                characterIdRef = conditionXML.attributes.characteridref.value;
            }

            let parameter = Config.findParameterById(parameterIdRef, characterIdRef);
            if (!parameter) parameter = Parameters.container.byId[parameterIdRef];

            if (parameter)
            {
                const condition = {
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
            const typeXML = Utils.appendChild(parentXML, condition.type);
            condition.subconditions.forEach(function(subcondition)
            {
                toXML(typeXML, subcondition);
            });
        }
        else
        {
            let parameter = Config.findParameterById(condition.idRef, condition.characterIdRef);
            if (!parameter) parameter = Parameters.container.byId[condition.idRef];

            const isReferenceCondition = condition.operator in Types.unaryOperators;

            let conditionXML;
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
            const hasRelationalOperator = newParameter.type.relationalOperators.includes(Types.relationalOperators[condition.operator]);
            const hasUnaryOperator = newParameter.type.unaryOperators.includes(Types.unaryOperators[condition.operator]);
            if (!hasRelationalOperator && !hasUnaryOperator)
            {
                condition.operator = newParameter.type.relationalOperators[0].name;
            }

            condition.value = newParameter.type.castFrom(oldParameter.type, condition.value);
        }
    }

    // Returns the condition object or null if there are no conditions left
    function filter(predicate, condition, onConditionPreservation, onConditionRemoval)
    {
        if ("type" in condition)
        {
            for (let i = 0; i < condition.subconditions.length; i++)
            {
                let subcondition = condition.subconditions[i];
                subcondition = filter(predicate, subcondition, onConditionPreservation, onConditionRemoval);
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
            const result = predicate(condition);
            if (result)
            {
                if (onConditionPreservation) onConditionPreservation(condition, result);
                return condition;
            }
            else
            {
                if (onConditionRemoval) onConditionRemoval(condition);
                return null;
            }
        }
    }

    function appendGroupConditionControlsTo(container, allowReferenceConditions, isRoot)
    {
        const conditionContainer = appendGroupCondition(container, allowReferenceConditions);
        if (isRoot)
        {
            conditionContainer.children('.delete').remove();
        }
        return conditionContainer;
    }

    function appendCondition(container, allowReferenceConditions)
    {
        const condition = $('<div>', { class: "condition" });
        container.append(condition);
        const handle = $('<span>', { class: "handle", text: "↕" });
        condition.append(handle);
        const idRefSelect = $('<select>', { class: "parameter-idref-select" });
        condition.append(idRefSelect);
        const testContainer = $('<span>', { class: "condition-test-container" });
        condition.append(testContainer);
        const deleteButton = Parts.deleteButton();
        deleteButton.on('click', function()
        {
            condition.remove();
            updateGroupConditionCounter(container.closest(".groupcondition"));
        });
        condition.append(deleteButton);

        Parameters.insertInto(idRefSelect);
        Config.insertParametersInto(idRefSelect);

        const changeTestType = function(parameterIdRef)
        {
            let parameter = Config.findParameterById(parameterIdRef);
            if (!parameter) parameter = Parameters.container.byId[parameterIdRef];

            if (Config.isCharacterParameter(parameterIdRef))
            {
                const characterIdRefSelect = $('<select>', { class: "character-idref-select" });
                Config.insertCharactersInto(characterIdRefSelect, parameterIdRef);
                testContainer.append(characterIdRefSelect);
            }

            const operatorSelect = $('<select>', { class: "condition-operator-select" });
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
            const handleOperatorChange = function(operatorName)
            {
                const previousValueContainer = testContainer.children(".condition-value-container");
                let previousValue;
                if (previousValueContainer.length > 0)
                {
                    previousValue = parameter.type.getFromDOM(previousValueContainer);
                }
                previousValueContainer.remove();

                if (operatorName in Types.relationalOperators)
                {
                    const controlContainer = $('<span>', { class: "condition-value-container" });
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
        const groupCondition = $('<div>', { class: "condition groupcondition empty" });
        groupCondition.append($('<div>', { class: "emptyLabel", text: i18next.t('condition:empty_group') }));
        groupCondition.append($('<div>', { class: "singleLabel hidden", text: i18next.t('condition:one_condition_group') }));

        const groupConditionRadio = $('<div>', { class: "groupConditionRadioDiv" });
        const andLabel = $('<label>').append($('<input>', { type: 'radio', value: 'and', checked: 'checked' }));
        andLabel.append(i18next.t('condition:all_true'));
        const orLabel = $('<label>').append($('<input>', { type: 'radio', value: 'or' }));
        orLabel.append(i18next.t('condition:one_true'));
        groupConditionRadio.append(andLabel).append(orLabel);
        radioButtonCounter += 1;
        groupConditionRadio.find("input").each(function()
        {
            $(this).prop("name", "conRadio" + radioButtonCounter);
        });
        groupCondition.append(groupConditionRadio);

        const subconditionsContainer = $('<div>', { class: "groupConditionDiv" });
        groupCondition.append(subconditionsContainer);

        Utils.makeSortable(subconditionsContainer);

        const addConditionButton = Parts.addButton(i18next.t('condition:add_condition'));
        addConditionButton.on('click', function()
        {
            if (Parameters.atLeastOneUserDefined() || Config.atLeastOneParameter())
            {
                const condition = appendCondition(subconditionsContainer, allowReferenceConditions);
                Utils.focusFirstTabindexedDescendant(condition);
            }
            else
            {
                Utils.alertDialog(i18next.t('condition:error.no_test'), 'error');
            }
        });
        groupCondition.append(addConditionButton);

        const addGroupConditionButton = Parts.addButton(i18next.t('condition:add_group'));
        addGroupConditionButton.on('click', function()
        {
            if (Parameters.atLeastOneUserDefined() || Config.atLeastOneParameter())
            {
                appendGroupCondition(subconditionsContainer, allowReferenceConditions);
                addConditionButton.focus();
            }
            else
            {
                Utils.alertDialog(i18next.t('condition:error.no_test'), 'error');
            }
        });
        groupCondition.append(addGroupConditionButton);

        const deleteButton = Parts.deleteButton();
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
        const childCount = div.children(".groupConditionDiv").children().length;
        const states = {
            empty: childCount === 0,
            single: childCount === 1,
            multiple: childCount > 1
        };

        for (const state in states)
        {
            div.toggleClass(state, states[state]);
        }
    }
})();
