/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

var HtmlGenerator;

(function()
{
    "use strict";

    HtmlGenerator =
    {
        addEmptyUserDefinedParameterDefinition: addEmptyUserDefinedParameterDefinition,
        addEmptyUserDefinedParameterEffect: addEmptyUserDefinedParameterEffect,
        appendEnumerationValueListTo: appendEnumerationValueListTo,
        insertPreconditions: insertPreconditions
    };

    //Get all the raw HTLM from Parts.js
    var parameterHTML = Parts.getParameterDefinitionHTML();
    var preconditionHTML = Parts.getPreconditionHTML();
    var groupPreconditionHTML = Parts.getGroupPreconditionHTML();
    var parameterEffectHTML = Parts.getParameterEffectHTML();
    var radioButtonCounter = 0;

    $(document).ready(function()
    {
        var enumerationScreenHTML = Parts.getEnumerationScreenHTML();
        $("#enumerationScreen").html(enumerationScreenHTML);

        // Set event handlers:
        // Event handlers for adding HTML.

        $("#add-enumeration-value-button").on('click', function()
        {
            addEnumerationValue($(this).parent(), $("#enumeration-value-input").val());
        });

        $("#enumeration-value-input").on('keydown', function(e)
        {
            if (e.which === 13) // ENTER
            {
                addEnumerationValue($(this).parent(), $(this).val());
            }
        });

        $("#preconditionsDiv").on('click', ".addPrecondition", function()
        {
            if (Parameters.atLeastOneUserDefined() || Config.atLeastOneParameter())
            {
                var container = $(this).parent().children(".groupPreconditionDiv");
                addEmptyPrecondition(container);
                var addedDiv = container.children(".precondition").last();
                focusFirstTabindexedDescendant(addedDiv);
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
                focusFirstTabindexedDescendant($(".effect").last());
            }
            else
            {
                alert(i18next.t('htmlGenerator:error.no_effect'));
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

            // if the timeParameterObject is empty, or if it is filled, but
            // the parameter in the dialog has been removed (in that case the
            // timeParameterObject has not been updated yet)
            if (Metadata.timePId === null || isTimeRemoved === isTime)
            {
                $("#params").append(parameterHTML);
                var div = $("#params").children().last();
                // div.children().children().prop('disabled', true);
                $(div).prop('id', 't');
                div.find(".name").val(i18next.t('htmlGenerator:time'));
                div.find(".parameter-type-select").val(Config.types.integer.name);
                div.find(".parameter-type-select").prop("disabled", "disabled");
                div.find(".parameter-initial-value-container").remove();

                focusFirstTabindexedDescendant($("#params").children().last());
                $("#paramsTableHead").removeClass("hidden");
                $("#addTimeParameter").addClass("hidden");
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

    function addEmptyUserDefinedParameterDefinition()
    {
        $("#params").append(parameterHTML);
        var addedDiv = $("#params").children().last();

        var typeSelect = addedDiv.find('.parameter-type-select');

        var previousType;
        var changeParameterType = function(newTypeName, userTypeChange)
        {
            addedDiv.addClass("changedTypeParameter");

            var replaceInitialValueContainer = function()
            {
                var initialValueContainer = addedDiv.find(".parameter-initial-value-container");
                var initialValue;
                if (previousType) initialValue = previousType.getFromDOM(initialValueContainer);
                initialValueContainer.empty();
                var type = Config.types[newTypeName].loadTypeFromDOM(addedDiv, initialValueContainer, 'parameter');
                type.appendControlTo(initialValueContainer);
                if (previousType) type.setInDOM(initialValueContainer, type.castFrom(previousType, initialValue));
                previousType = type;
            };

            var parameterMinContainer = addedDiv.find(".parameter-min-container");
            var parameterMaxContainer = addedDiv.find(".parameter-max-container");
            if (newTypeName === Config.types.integer.name)
            {
                if (!parameterMinContainer.children(Config.types.integer.controlName).length)
                {
                    Config.types[newTypeName].appendControlTo(parameterMinContainer);
                    Config.types[newTypeName].setInDOM(parameterMinContainer, "");
                }
                if (!parameterMaxContainer.children(Config.types.integer.controlName).length)
                {
                    Config.types[newTypeName].appendControlTo(parameterMaxContainer);
                    Config.types[newTypeName].setInDOM(parameterMaxContainer, "");
                }
            }
            else
            {
                parameterMinContainer.empty();
                parameterMaxContainer.empty();
            }

            if (newTypeName === Config.types.enumeration.name)
            {
                // If this was an enumeration already, use the old button
                if (!addedDiv.find(".enumeration-screen-button").length)
                {
                    var enumerationScreenButton = $('<button>', { class: "enumeration-screen-button" });
                    enumerationScreenButton.attr('title', i18next.t('htmlGenerator:enumeration.button_alt'));
                    var buttonIcon = $('<img>', { src: editor_url + "png/others/list.png" });
                    enumerationScreenButton.on('mouseover', function()
                    {
                        buttonIcon.attr('src', editor_url + "png/others/list_hover.png");
                    });
                    enumerationScreenButton.on('mouseout', function()
                    {
                        buttonIcon.attr('src', editor_url + "png/others/list.png");
                    });
                    buttonIcon.attr('alt', i18next.t('htmlGenerator:enumeration.button_alt'));
                    enumerationScreenButton.append($('<div>').append(buttonIcon));
                    enumerationScreenButton.on('click', function()
                    {
                        enumerationDefinitionDialog(addedDiv);
                    });
                    addedDiv.find(".parameter-type-select").parent().append(enumerationScreenButton);
                }

                if (userTypeChange)
                {
                    enumerationDefinitionDialog(addedDiv);
                }
                else
                {
                    replaceInitialValueContainer();
                }
            }
            else
            {
                addedDiv.find(".enumeration-screen-button").remove();
                addedDiv.find(".enumeration-value-list").remove();
                replaceInitialValueContainer();
            }
        };
        typeSelect.on('change', function(e)
        {
            changeParameterType($(this).val(), e.originalEvent);
        });

        // The default type for a user-defined parameter is integer
        typeSelect.val(Config.types.integer.name);
        typeSelect.trigger('change');

        addedDiv.removeClass("changedTypeParameter");

        return addedDiv;
    }

    function enumerationDefinitionDialog(enumerationDiv)
    {
        var enumerationValueInput = $("#enumeration-value-input");
        enumerationDiv.find(".enumeration-value-list").children().each(function()
        {
            addEnumerationValue(enumerationValueInput.parent(), $(this).text());
        });

        var alertUserNoEnumValuesDefined = function() { alert(i18next.t('htmlGenerator:enumeration.no_values_defined')); };

        $("#enumerationScreen").dialog(
        {
            title: i18next.t('htmlGenerator:enumeration.title'),
            height: Constants.heightEnumerationScreen,
            width: Constants.widthEnumerationScreen,
            modal: true,
            buttons: [
            {
                text: i18next.t('common:confirm'),
                click: function()
                {
                    var success = saveEnumerationDefinition(enumerationDiv);
                    if (success) $(this).dialog('close');
                    else         alertUserNoEnumValuesDefined();
                }
            },
            {
                text: i18next.t('common:cancel'),
                click: function()
                {
                    $(this).dialog('close');
                }
            }],
            beforeClose: function()
            {
                if (enumerationDiv.find(".enumeration-value-list").children().length === 0)
                {
                    alertUserNoEnumValuesDefined();
                    return false;
                }
            },
            close: function()
            {
                $("#enumeration-value-list").children().not(":last-child").each(function() { $(this).remove(); });
                $("#enumeration-value-input").val("");
            }
        });
    }

    function addEnumerationValue(enumerationValueInputItem, enumerationValue)
    {
        // The value of an enumeration can not be the empty string
        if (enumerationValue)
        {
            var enumerationValueInput = $("#enumeration-value-input");

            var deleteParentButton = $(Parts.getDeleteParentButtonHTML());
            deleteParentButton.on('click', function()
            {
                $(this).parent().remove(); enumerationValueInput.focus();
            });

            var enumerationValueItem = $('<li>').append($('<div>', { class: 'enumeration-value', text: enumerationValue }));
            enumerationValueItem.append(deleteParentButton);
            enumerationValueItem.insertBefore(enumerationValueInputItem);

            enumerationValueInput.val("").focus();
        }
    }

    function saveEnumerationDefinition(enumerationDiv)
    {
        var values = [];
        // Last child is the input so don't include it
        $("#enumeration-value-list").children().not(":last-child").each(function()
        {
            values.push($(this).text());
        });

        if (values.length === 0) return false;

        var enumerationList = enumerationDiv.find(".enumeration-value-list");
        if (enumerationList.length) enumerationList.remove();

        var typeSelect = enumerationDiv.find(".parameter-type-select");
        appendEnumerationValueListTo(typeSelect.parent(), values);
        typeSelect.trigger('change');
        return true;
    }

    function appendEnumerationValueListTo(el, values)
    {
        var enumerationValueList = $('<ul class="enumeration-value-list hidden">');
        values.forEach(function(value)
        {
            enumerationValueList.append($('<li>', { text: value }));
        });
        el.append(enumerationValueList);
        return el;
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
            var operatorSelect = $('<select>', { class: "parameter-effect-operator-select" });
            Metadata.metaObject.parameters.byId[pId].type.assignmentOperators.forEach(function(op)
            {
                operatorSelect.append($('<option>', { value: op.name, text: op.uiName }));
            });
            effectDiv.append(operatorSelect);

            var controlContainer = $('<span>', { class: "parameter-effect-value-container" });
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
                var parameter = Config.findParameterById(currentPrecondition.idRef, currentPrecondition.characterIdRef);

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

        insertParameters(addedDiv, Metadata.metaObject.parameters);
        insertParameters(addedDiv, Config.configObject.parameters);
        insertParameters(addedDiv, Config.configObject.characters.parameters);
        for (var characterId in Config.configObject.characters.byId)
        {
            insertParameters(addedDiv, Config.configObject.characters.byId[characterId].parameters);
        }

        var idRefSelect = addedDiv.find(".parameter-idref-select");
        var testContainer = addedDiv.find(".precondition-test-container");
        var changeTestType = function(parameterIdRef)
        {
            var parameter = Config.findParameterById(parameterIdRef);
            var characterIdRefSelect;
            if (Config.isCharacterParameter(parameterIdRef))
            {
                var inIndividualCharacter = Config.configObject.characters.sequence.some(function(character)
                {
                    if (parameterIdRef in Config.configObject.characters.byId[character.id].parameters.byId)
                    {
                        characterIdRefSelect = $('<select>', { class: "character-idref-select" });
                        characterIdRefSelect.append($('<option>', { value: character.id, text: character.name ? character.name : character.id }));
                        if (Config.configObject.characters.sequence.length === 1) characterIdRefSelect.hide();
                        testContainer.append(characterIdRefSelect);
                        return true;
                    }
                    return false;
                });

                if (!inIndividualCharacter)
                {
                    characterIdRefSelect = $('<select>', { class: "character-idref-select" });
                    Config.configObject.characters.sequence.forEach(function(character)
                    {
                        characterIdRefSelect.append($('<option>', { value: character.id, text: character.name ? character.name : character.id }));
                    });
                    if (Config.configObject.characters.sequence.length === 1) characterIdRefSelect.hide();
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
        parameters.sequence.forEach(function (parameter)
        {
            select.append($('<option>', { value: parameter.id, text: parameter.name }));
        });
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
