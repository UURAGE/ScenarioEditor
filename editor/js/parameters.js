/* © Utrecht University and DialogueTrainer */

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
        $("#editParameters").on('click', dialog);
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
        var parametersDialog = $('<div>', { id: "parameters" });

        var parametersTableHead = $('<thead>')
            .append($('<th>')) // For the sortable handle
            .append($('<th>', { text: i18next.t('common:name') }))
            .append($('<th>', { text: i18next.t('common:type') }))
            .append($('<th>', { text: i18next.t('common:evaluated') }))
            .append($('<th>', { text: i18next.t('common:initial_value') }))
            .append($('<th>', { text: i18next.t('common:description') }));
        var parametersContainer = $('<tbody>').appendTo($('<table>').append(parametersTableHead).appendTo(parametersDialog));

        var addParameterButton = Parts.addButton();
        addParameterButton.on('click', function()
        {
            var parameterContainer = addDefaultDefinition(parametersContainer);
            Utils.focusFirstTabindexedDescendant(parameterContainer);
            parametersTableHead.show();
        });
        parametersDialog.append(addParameterButton);

        var addTimeParameterButton = $('<button>', { type: 'button', title: i18next.t('parameters:add_time_title') }).append($('<img>', { src: editor_url + "png/others/stopwatch.png" }));
        addTimeParameterButton.on('click', function()
        {
            var isTime = parametersContainer.find(".isT").length;
            var isTimeRemoved = parametersContainer.find(".isT.removedParameter").length;

            // if the timeId is empty, or if it is filled, but
            // the parameter in the dialog has been removed (in that case the
            // timeId has not been updated yet)
            if (Parameters.timeId === null || isTimeRemoved === isTime)
            {
                addTimeParameterDefinition(parametersContainer);

                Utils.focusFirstTabindexedDescendant(parametersContainer.children().last());
                addTimeParameterButton.hide();
                parametersTableHead.show();
            }
        });
        parametersDialog.append(addTimeParameterButton);

        parametersContainer.on("focus", ".parameter-description", function()
        {
            $(this).animate({ height: "10em" }, 500);
        });
        parametersContainer.on("focusout", ".parameter-description", function()
        {
            $(this).animate({height:"1em"}, 500);
        });
        parametersContainer.on('click', '.delete', function()
        {
            var tr = $(this).closest('tr');
            tr.addClass("removedParameter");
            if(tr[0].id === "t" && tr.not(".removedParameter"))
            {
                // for time parameter: make visible when Time-parameter has been removed
                addTimeParameterButton.show();
            }
            if (parametersContainer.children().not(".removedParameter").length === 0)
                parametersTableHead.hide();
        });

        if (Parameters.timeId !== null)
        {
            addTimeParameterButton.hide();
        }
        else
        {
            addTimeParameterButton.show();
        }

        parametersDialog.dialog(
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
                    save(parametersContainer).done(function(saved)
                    {
                        if (saved)
                        {
                            $(this).dialog('close');
                        }
                    }.bind(this));
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
                parametersDialog.remove();
            }
        });

        parametersTableHead.toggle(Parameters.container.sequence.length > 0);

        Parameters.container.sequence.forEach(function(parameter)
        {
            var parameterContainer;
            if (parameter.id === "t")
            {
                parameterContainer = addTimeParameterDefinition(parametersContainer);
            }
            else
            {
                parameterContainer = addDefaultDefinition(parametersContainer);
            }

            parameterContainer.removeClass("newParameter").addClass("existingParameter");

            parameterContainer.prop('id', parameter.id);

            parameterContainer.find(".name").val(parameter.name);

            Types.insertIntoDOM(parameterContainer, 'parameter-type-select', parameter.type);

            parameterContainer.removeClass("changedTypeParameter");

            parameterContainer.find(".parameter-evaluated").prop('checked', parameter.evaluated).trigger('change');

            parameter.type.setInDOM(parameterContainer.find(".parameter-initial-value-container"), parameter.type.defaultValue);

            parameterContainer.find(".parameter-description").val(parameter.description);
        });

        Utils.makeSortable(parametersContainer);
    }

    function addDefaultDefinition(parametersContainer)
    {
        var typeSelectContainer = $('<td>');

        var initialValueContainer = $('<span>', { class: "parameter-initial-value-container" });

        var description = $('<textarea>', { class: "parameter-description", style: "height:1em;" });

        var evaluated = $('<input>', { type: 'checkbox', class: "parameter-evaluated"  });
        evaluated.on('change', function()
        {
            if ($(this).prop('checked'))
            {
                description.attr('maxlength', Config.container.settings.evaluationDescription.type.maxLength);
                if (Config.container.settings.evaluationDescription.type.markdown) Utils.attachMarkdownTooltip(description);
            }
            else
            {
                description.removeAttr('maxlength');
                if (description.data('ui-tooltip')) description.tooltip('destroy');
            }
        });

        var parameterContainer = $('<tr>', { class: "newParameter" })
            .append($('<td>', { class: "handle", text: "↕" }))
            .append($('<td>').append($('<input>', { type: 'text', class: "name", style: "width: 197px;" })))
            .append(typeSelectContainer)
            .append($('<td>').append(evaluated))
            .append($('<td>').append(initialValueContainer))
            .append($('<td>').append(description))
            .append(Parts.deleteButton());

        var previousType;
        var handleParameterTypeChange = function(newTypeName)
        {
            parameterContainer.addClass("changedTypeParameter");

            var initialValue;
            if (previousType) initialValue = previousType.getFromDOM(initialValueContainer);
            initialValueContainer.empty();
            var type = Types.primitives[newTypeName].loadTypeFromDOM(parameterContainer, initialValueContainer);
            type.appendControlTo(initialValueContainer);
            if (previousType) type.setInDOM(initialValueContainer, type.castFrom(previousType, initialValue));
            previousType = type;
        };

        Types.appendControlsTo(typeSelectContainer, 'parameter-type-select', handleParameterTypeChange);

        parameterContainer.removeClass("changedTypeParameter");

        parametersContainer.append(parameterContainer);

        return parameterContainer;
    }

    function addTimeParameterDefinition(parametersContainer)
    {
        var parameterContainer = addDefaultDefinition(parametersContainer);
        parameterContainer.prop('id', 't');
        parameterContainer.find(".name").val(i18next.t('parameters:time'));
        parameterContainer.find(".parameter-type-select").val(Types.primitives.integer.name);
        parameterContainer.find(".parameter-type-select").prop("disabled", "disabled");
        parameterContainer.find(".parameter-evaluated").remove();
        parameterContainer.find(".parameter-initial-value-container").remove();
        parametersContainer.append(parameterContainer);
        return parameterContainer;
    }

    function save(parametersContainer)
    {
        var deferredSave = $.Deferred();

        var consideredSave = function()
        {
            Main.unsavedChanges = true;

            var previouslySelectedElement = Main.selectedElement;
            Main.selectElement(null);

            parametersContainer.find(".removedParameter").each(function()
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
                    if (node.preconditions)
                    {
                        node.preconditions = Condition.handleParameterRemoval(id, node.preconditions);
                    }
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

            var getParameterFromDOM = function(container)
            {
                var typeName = container.find(".parameter-type-select").val();
                var type = Types.primitives[typeName].loadTypeFromDOM(container, container.find(".parameter-initial-value-container"));

                return {
                    id: container.prop('id'),
                    name: container.find(".name").val(),
                    evaluated: container.find(".parameter-evaluated").prop('checked'),
                    type: type,
                    description: container.find(".parameter-description").val()
                };
            };

            parametersContainer.find(".existingParameter").each(function()
            {
                var newParameter = getParameterFromDOM($(this));
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

                        if (Main.nodes[nodeID].preconditions)
                        {
                            Condition.handleParameterTypeChange(oldParameter, newParameter, Main.nodes[nodeID].preconditions);
                        }
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
            parametersContainer.find(".newParameter").each(function()
            {
                if ($(this).prop('id') !== 't')
                {
                    var id = 'p' + (Parameters.counter += 1).toString();
                    $(this).prop('id', id);
                }

                var newParameter = getParameterFromDOM($(this));

                if (!newParameter.name) return;

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
                parametersContainer.find(".existingParameter").map(function()
                {
                    return Parameters.container.byId[$(this).prop('id')];
                }).get();


            Main.selectElement(previouslySelectedElement);

            deferredSave.resolve(true);
        };

        var confirmParametersWithoutNameRemoval = function()
        {
            var noNameCounter = 0;
            parametersContainer.find(".newParameter").not(".removedParameter").each(function()
            {
                if (!$(this).find(".name").val())
                {
                    noNameCounter++;
                }
            });
            if (noNameCounter > 0)
            {
                return Utils.confirmDialog(i18next.t('parameters:missing_name_warning'), 'warning');
            }
            else
            {
                return $.Deferred().resolve(true);
            }
        };

        var confirmRemovedParametersRemoval = function()
        {
            var removedExistingParameters = [];
            parametersContainer.find(".removedParameter").not(".newParameter").each(function()
            {
                removedExistingParameters.push(Parameters.container.byId[$(this).prop('id')]);
            });
            if (removedExistingParameters.length > 0)
            {
                var content = $('<div>', { text: i18next.t('parameters:removal_warning', { count: removedExistingParameters.length }) });
                var removedParameterList = $('<ul>');
                removedExistingParameters.forEach(function(existingParameter)
                {
                    removedParameterList.append($('<li>', { text: existingParameter.name }));
                });
                content.append(removedParameterList);
                return Utils.confirmDialog(content, 'warning');
            }
            else
            {
                return $.Deferred().resolve(true);
            }
        };

        confirmParametersWithoutNameRemoval().done(function(confirmed)
        {
            if (confirmed)
            {
                return confirmRemovedParametersRemoval().done(function(confirmed)
                {
                    if (confirmed)
                    {
                        consideredSave();
                    }
                    else
                    {
                        deferredSave.resolve(false);
                    }
                });
            }
            else
            {
                deferredSave.resolve(false);
            }
        });

        return deferredSave;
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
