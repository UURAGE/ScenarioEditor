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
        atLeastOneUserDefined: atLeastOneUserDefined
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
        Main.selectNode(null);

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
            title: i18next.t('metadata:parameters_title'),
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
            var addedDiv = HtmlGenerator.addEmptyUserDefinedParameterDefinition();
            addedDiv.removeClass("newParameter").addClass("existingParameter");

            addedDiv.prop('id', parameter.id);

            var typeSelect = addedDiv.find(".parameter-type-select");

            if (parameter.id === "t")
            {
                addedDiv.addClass("isT");
                typeSelect.val(Config.types.integer.name);
                typeSelect.prop("disabled", "disabled");
                addedDiv.find(".parameter-initial-value-container").remove();
                addedDiv.find(".parameter-min-container").remove();
                addedDiv.find(".parameter-max-container").remove();
            }

            addedDiv.find(".name").val(parameter.name);

            if (parameter.type.name === Config.types.enumeration.name)
            {
                var enumerationValues = parameter.type.options.sequence.map(function(option) { return option.text; });
                HtmlGenerator.appendEnumerationValueListTo(typeSelect.parent(), enumerationValues);
            }
            typeSelect.val(parameter.type.name).trigger('change');
            addedDiv.removeClass("changedTypeParameter");

            parameter.type.setInDOM(addedDiv.find(".parameter-initial-value-container"), parameter.type.defaultValue);

            if ('minimum' in parameter.type) parameter.type.setInDOM(addedDiv.find(".parameter-min-container"), parameter.type.minimum);
            if ('maximum' in parameter.type) parameter.type.setInDOM(addedDiv.find(".parameter-max-container"), parameter.type.maximum);

            addedDiv.find(".description").val(parameter.description);
        });
        if ($("#params").children().length > 0)
            $("#paramsTableHead").removeClass("hidden");

        $("#params").sortable({
            handle: ".handle",
            axis: "y",
            forceHelperSize: true,
            helper: function(e, helper)
            {
                $(helper).children().each(function()
                {
                    $(this).width($(this).width());
                });
                return helper;
            },
            beforeStop: function(e, ui)
            {
                $(ui.helper).children().each(function()
                {
                    $(this).width("");
                });
            }
        });
    }

    function save()
    {
        Main.unsavedChanges = true;

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
                removeAllPreconditionsWithParameter(id, node.preconditions);
            }

            if (id === Parameters.timeId && Parameters.timeId !== null)
                Parameters.timeId = null;

            // Remove the parameter from the html and the object.
            $(this).remove();

            var removedParameter = Parameters.container.byId[id];
            var indexOfRemovedParameter = Parameters.container.sequence.indexOf(removedParameter);
            delete Parameters.container.byId[id];
            Parameters.container.sequence.splice(indexOfRemovedParameter, 1);
        });

        $(".existingParameter").each(function()
        {
            var newParameter = ObjectGenerator.parameterObject($(this));
            var oldParameter = Parameters.container.byId[newParameter.id];

            // If an already existing parameter changed type, the effects on the nodes need to be adjusted accordingly
            if ($(this).hasClass("changedTypeParameter"))
            {
                for (var nodeID in Main.nodes)
                {
                    Main.nodes[nodeID].parameterEffects.userDefined.forEach(function(effect)
                    {
                        if (effect.idRef === oldParameter.id)
                        {
                            var hasOperator = newParameter.type.assignmentOperators.indexOf(Config.assignmentOperators[effect.operator]) !== -1;
                            if (!hasOperator) effect.operator = newParameter.type.assignmentOperators[0].name;

                            effect.value = newParameter.type.castFrom(oldParameter.type, effect.value);
                        }
                    });

                    var changeTypeOfPreconditionParameter = function(precondition)
                    {
                        if (!precondition.type && precondition.idRef === oldParameter.id)
                        {
                            var hasRelationalOperator = newParameter.type.relationalOperators.indexOf(Config.relationalOperators[precondition.operator]) !== -1;
                            if (!hasRelationalOperator) precondition.operator = newParameter.type.relationalOperators[0].name;

                            precondition.value = newParameter.type.castFrom(oldParameter.type, precondition.value);
                        }

                        if (precondition.type !== "alwaysTrue" && precondition.preconditions)
                        {
                            precondition.preconditions.map(function(precondition)
                            {
                                changeTypeOfPreconditionParameter(precondition);
                            });
                        }
                    };
                    changeTypeOfPreconditionParameter(Main.nodes[nodeID].preconditions);
                }

                $(this).removeClass("changedTypeParameter");
            }

            $.extend(oldParameter, newParameter);
        });

        // All new parameters
        $(".newParameter").each(function()
        {
            if ($(this).prop('id') === 't')
            {
                addTimeParameter($(this));
            }
            else
            {
                var id = 'p' + (Parameters.counter += 1).toString();
                $(this).prop('id', id);
                var newParameter = ObjectGenerator.parameterObject($(this));

                if (!newParameter) return;

                Parameters.container.sequence.push(newParameter);
                Parameters.container.byId[newParameter.id] = newParameter;

                $(this).removeClass("newParameter").addClass("existingParameter");
                $(this).removeClass("changedTypeParameter");
            }
        });

        // Save parameters in UI order.
        Parameters.container.sequence =
            $(".existingParameter").map(function()
            {
                return Parameters.container.byId[$(this).prop('id')];
            }).get();
    }

    function addTimeParameter(div)
    {
        var newParameter = ObjectGenerator.parameterObject(div);

        if (!newParameter) return;

        Parameters.container.sequence.push(newParameter);
        Parameters.container.byId[newParameter.id] = newParameter;

        Parameters.timeId = newParameter.id;

        $(div).removeClass("newParameter").addClass("existingParameter").addClass('isT');
        $(div).removeClass("changedTypeParameter");

        var timeEffect =
        {
            idRef: newParameter.id,
            type: Config.types.integer,
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

    function removeAllPreconditionsWithParameter(paramIdToRemove, precondition)
    {
        for (var i = 0; i < precondition.preconditions.length; i++)
        {
            var currentPrecondition = precondition.preconditions[i];
            if ("type" in currentPrecondition)
            {
                removeAllPreconditionsWithParameter(paramIdToRemove,
                    currentPrecondition);
                if (currentPrecondition.preconditions.length === 0)
                {
                    precondition.preconditions.splice(i, 1);
                    i--;
                }
            }
            else
            {
                if (currentPrecondition.idRef === paramIdToRemove)
                {
                    precondition.preconditions.splice(i, 1);
                    i--;
                }
            }
        }
    }

    function atLeastOneUserDefined()
    {
        return Parameters.container.sequence.length > 0;
    }
})();
