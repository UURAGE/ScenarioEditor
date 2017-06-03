/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

var Parameters;

(function()
{
    "use strict";

    var defaultContainer = { byId: {}, sequence: [] };

    Parameters =
    {
        counter: 0,
        timeId: null,
        container: $.extend(true, {}, defaultContainer),
        reset: reset,
        dialog: dialog,
        atLeastOneUserDefined: atLeastOneUserDefined,
        insertInto: insertInto,
        hasWithType: hasWithType
    };

    $(document).ready(function()
    {
         var parameterScreenHTML = Parts.getParameterScreenHTML();
        $("#parameterScreen").html(parameterScreenHTML);
        $("#editParameters").on('click', dialog);

        $("#params").on("focus", ".description", function()
        {
            $(this).animate({ height: "10em" }, 500);
        });
        $("#params").on("focusout", ".description", function()
        {
            $(this).animate({height:"1em"}, 500);
        });
        $("#params").on('click', '.deleteParent', function()
        {
            var tr = $(this).closest('tr');
            tr.addClass("removedParameter");
            if(tr[0].id === "t" && tr.not(".removedParameter"))
            {
                // for time parameter: make visible when Time-parameter has been removed
                $("#addTimeParameter").removeClass("hidden");
            }
            if ($("#params").children().not(".removedParameter").length === 0)
                $("#paramsTableHead").addClass("hidden");
        });

        $("#addParameter").on('click', function()
        {
            var addedDiv = addDefaultDefinition();
            Utils.focusFirstTabindexedDescendant(addedDiv);
            $("#paramsTableHead").removeClass("hidden");
        });

        $("#addTimeParameter").on('click', function()
        {
            var isTime = $("#params").find(".isT").length;
            var isTimeRemoved = $("#params").find(".isT.removedParameter").length;

            // if the timeParameterObject is empty, or if it is filled, but
            // the parameter in the dialog has been removed (in that case the
            // timeParameterObject has not been updated yet)
            if (Parameters.timeId === null || isTimeRemoved === isTime)
            {
                $("#params").append(Parts.getParameterDefinitionHTML());
                var div = $("#params").children().last();
                // div.children().children().prop('disabled', true);
                $(div).prop('id', 't');
                div.find(".name").val(i18next.t('parameters:time'));
                div.find(".parameter-type-select").val(Types.primitives.integer.name);
                div.find(".parameter-type-select").prop("disabled", "disabled");
                div.find(".parameter-evaluated").remove();
                div.find(".parameter-initial-value-container").remove();

                Utils.focusFirstTabindexedDescendant($("#params").children().last());
                $("#paramsTableHead").removeClass("hidden");
                $("#addTimeParameter").addClass("hidden");
            }
        });
    });

    // Resets the parameters to the default
    function reset()
    {
        Parameters.container = $.extend(true, {}, defaultContainer);
        Parameters.counter = 0;
        Parameters.timeId = null;
    }

    function dialog()
    {
        if (Parameters.timeId !== null)
        {
            $("#addTimeParameter").addClass("hidden");
        }
        else
        {
            $("#addTimeParameter").removeClass("hidden");
        }

        $("#parameterScreen").dialog(
        {
            title: i18next.t('parameters:title'),
            height: Constants.heightParameterScreen,
            width: Constants.widthParameterScreen,
            modal: true,
            buttons: [
            {
                text: i18next.t('common:confirm'),
                click: function()
                {
                    save();
                    $(this).dialog('close');
                }
            },
            {
                text: i18next.t('common:cancel'),
                click: function()
                {
                    $(this).dialog('close');
                }
            }],
            close: function()
            {
                $("#main").focus();
            }
        });

        $("#params").empty();
        $("#paramsTableHead").addClass("hidden");

        Parameters.container.sequence.forEach(function(parameter)
        {
            var addedDiv = addDefaultDefinition();
            addedDiv.removeClass("newParameter").addClass("existingParameter");

            addedDiv.prop('id', parameter.id);

            var typeSelect = addedDiv.find(".parameter-type-select");

            if (parameter.id === "t")
            {
                addedDiv.addClass("isT");
                typeSelect.val(Types.primitives.integer.name);
                typeSelect.prop("disabled", "disabled");
                addedDiv.find(".parameter-evaluated").remove();
                addedDiv.find(".parameter-initial-value-container").remove();
                addedDiv.find(".parameter-min-container").remove();
                addedDiv.find(".parameter-max-container").remove();
            }

            addedDiv.find(".name").val(parameter.name);

            if (parameter.type.name === Types.primitives.enumeration.name)
            {
                parameter.type.insertTypeIntoDOM(typeSelect.parent());
            }
            typeSelect.val(parameter.type.name).trigger('change');
            addedDiv.removeClass("changedTypeParameter");

            addedDiv.find(".parameter-evaluated").prop('checked', parameter.evaluated);

            parameter.type.setInDOM(addedDiv.find(".parameter-initial-value-container"), parameter.type.defaultValue);

            if ('minimum' in parameter.type) parameter.type.setInDOM(addedDiv.find(".parameter-min-container"), parameter.type.minimum);
            if ('maximum' in parameter.type) parameter.type.setInDOM(addedDiv.find(".parameter-max-container"), parameter.type.maximum);

            addedDiv.find(".description").val(parameter.description);
        });
        if ($("#params").children().length > 0)
            $("#paramsTableHead").removeClass("hidden");

        Utils.makeSortable($("#params"));
    }

    function addDefaultDefinition()
    {
        $("#params").append(Parts.getParameterDefinitionHTML());
        var addedDiv = $("#params").children().last();

        var typeSelect = addedDiv.find('.parameter-type-select');
        var parent = typeSelect.parent();
        typeSelect.remove();

        var previousType;
        var handleParameterTypeChange = function(newTypeName, userTypeChange)
        {
            addedDiv.addClass("changedTypeParameter");

            var replaceInitialValueContainer = function()
            {
                var initialValueContainer = addedDiv.find(".parameter-initial-value-container");
                var initialValue;
                if (previousType) initialValue = previousType.getFromDOM(initialValueContainer);
                initialValueContainer.empty();
                var type = Types.primitives[newTypeName].loadTypeFromDOM(addedDiv, initialValueContainer);
                type.appendControlTo(initialValueContainer);
                if (previousType) type.setInDOM(initialValueContainer, type.castFrom(previousType, initialValue));
                previousType = type;
            };

            var parameterMinContainer = addedDiv.find(".parameter-min-container");
            var parameterMaxContainer = addedDiv.find(".parameter-max-container");
            if (newTypeName === Types.primitives.integer.name)
            {
                if (!parameterMinContainer.children(Types.primitives.integer.controlName).length)
                {
                    Types.primitives[newTypeName].appendControlTo(parameterMinContainer);
                    Types.primitives[newTypeName].setInDOM(parameterMinContainer, "");
                }
                if (!parameterMaxContainer.children(Types.primitives.integer.controlName).length)
                {
                    Types.primitives[newTypeName].appendControlTo(parameterMaxContainer);
                    Types.primitives[newTypeName].setInDOM(parameterMaxContainer, "");
                }
            }
            else
            {
                parameterMinContainer.empty();
                parameterMaxContainer.empty();
            }

            if (newTypeName === Types.primitives.enumeration.name)
            {
                if (!userTypeChange)
                {
                    replaceInitialValueContainer();
                }
            }
            else
            {
                replaceInitialValueContainer();
            }
        };

        Types.appendSelectTo(parent, 'parameter-type-select', handleParameterTypeChange);

        addedDiv.removeClass("changedTypeParameter");

        return addedDiv;
    }

    function save()
    {
        Main.unsavedChanges = true;

        var previouslySelectedElement = Main.selectedElement;
        Main.selectElement(null);

        $(".removedParameter").each(function()
        {
            var id = $(this).prop('id');

            // Remove the preconditions and effects for every node with this parameter.
            for (var nodeID in Main.nodes)
            {
                var node = Main.nodes[nodeID];
                for (var i = 0; i < node.parameterEffects.userDefined.length; i++)
                {
                    if (node.parameterEffects.userDefined[i].idRef === id)
                    {
                        node.parameterEffects.userDefined.splice(i, 1);
                    }
                }
                Condition.handleParameterRemoval(id, node.preconditions);
            }

            Evaluations.handleParameterRemoval(id);

            if (id === Parameters.timeId && Parameters.timeId !== null)
                Parameters.timeId = null;

            // Remove the parameter from the html and the object.
            $(this).remove();

            var removedParameter = Parameters.container.byId[id];
            var indexOfRemovedParameter = Parameters.container.sequence.indexOf(removedParameter);
            delete Parameters.container.byId[id];
            Parameters.container.sequence.splice(indexOfRemovedParameter, 1);
        });

        var getParameterFromDOM = function(container, exists)
        {
            var name = container.find(".name").val();
            // If the name is empty, we cannot create a valid parameter object.
            if (!name && !exists) return null;

            var typeName = container.find(".parameter-type-select").val();
            var type = Types.primitives[typeName].loadTypeFromDOM(container, container.find(".parameter-initial-value-container"));
            // If it's an enumeration and there are no values defined, we can't define it either
            if (typeName === Types.primitives.enumeration.name && type.options.sequence.length === 0) return;
            return {
                id: container.prop('id'),
                name: name,
                evaluated: container.find(".parameter-evaluated").prop('checked'),
                type: type,
                description: container.find(".description").val()
            };
        };

        $(".existingParameter").each(function()
        {
            var newParameter = getParameterFromDOM($(this), true);
            var oldParameter = Parameters.container.byId[newParameter.id];

            if (!newParameter.name)
            {
                newParameter.name = oldParameter.name;
            }

            // If an already existing parameter changed type, the effects on the nodes need to be adjusted accordingly
            if ($(this).hasClass("changedTypeParameter"))
            {
                for (var nodeID in Main.nodes)
                {
                    Main.nodes[nodeID].parameterEffects.userDefined.forEach(function(effect)
                    {
                        if (effect.idRef === oldParameter.id)
                        {
                            var hasOperator = newParameter.type.assignmentOperators.indexOf(Types.assignmentOperators[effect.operator]) !== -1;
                            if (!hasOperator) effect.operator = newParameter.type.assignmentOperators[0].name;

                            effect.value = newParameter.type.castFrom(oldParameter.type, effect.value);
                        }
                    });

                    Condition.handleParameterTypeChange(oldParameter, newParameter, Main.nodes[nodeID].preconditions);
                }

                Evaluations.handleParameterTypeChange(oldParameter, newParameter);

                $(this).removeClass("changedTypeParameter");
            }
            // Special case for triggering a type change for a reference calculation update
            else if (oldParameter.type.name === Types.primitives.integer.name && newParameter.type.name === Types.primitives.integer.name &&
               (oldParameter.type.minimum !== newParameter.type.minimum || oldParameter.type.maximum !== newParameter.type.maximum))
            {
                Evaluations.handleParameterTypeChange(oldParameter, newParameter);
            }

            if (oldParameter.evaluated && !newParameter.evaluated || !oldParameter.evaluated && newParameter.evaluated)
            {
                Evaluations.handleParameterEvaluatedChange(newParameter);
            }

            if (newParameter.evaluated)
            {
                Evaluations.handleEvaluatedParameterChange(newParameter);
            }

            $.extend(oldParameter, newParameter);
        });

        // All new parameters
        $(".newParameter").each(function()
        {
            if ($(this).prop('id') !== 't')
            {
                var id = 'p' + (Parameters.counter += 1).toString();
                $(this).prop('id', id);
            }

            var newParameter = getParameterFromDOM($(this));

            if (!newParameter) return;

            Parameters.container.sequence.push(newParameter);
            Parameters.container.byId[newParameter.id] = newParameter;

            $(this).removeClass("newParameter").addClass("existingParameter");
            $(this).removeClass("changedTypeParameter");

            if ($(this).prop('id') === 't')
            {
                 Parameters.timeId = newParameter.id;
                 $(this).addClass('isT');

                 var timeEffect =
                {
                    idRef: newParameter.id,
                    type: Types.primitives.integer,
                    operator: "addAssign",
                    value: 1
                };

                for (var nodeId in Main.nodes)
                {
                    var node = Main.nodes[nodeId];
                    if (node.type === Main.playerType)
                    {
                        if (node.parameterEffects.userDefined !== undefined && node.parameterEffects.userDefined !== null)
                            node.parameterEffects.userDefined.push(timeEffect);
                        else
                            node.parameterEffects.userDefined = [timeEffect];
                    }
                }
            }

            if (newParameter.evaluated)
            {
                Evaluations.handleParameterEvaluatedChange(newParameter);
            }
        });

        // Save parameters in UI order.
        Parameters.container.sequence =
            $(".existingParameter").map(function()
            {
                return Parameters.container.byId[$(this).prop('id')];
            }).get();


        Main.selectElement(previouslySelectedElement);
    }

    function atLeastOneUserDefined()
    {
        return Parameters.container.sequence.length > 0;
    }

    // If the type is given, only inserts parameters with the same type
    function insertInto(container, type)
    {
        Parameters.container.sequence.forEach(function(parameter)
        {
            if (!type || parameter.type.equals(type))
            {
                container.append($('<option>', { value: parameter.id, text: parameter.name }));
            }
        });
    }

    function hasWithType(type)
    {
        return Parameters.container.sequence.some(function(parameter) { return parameter.type.equals(type); });
    }

})();
