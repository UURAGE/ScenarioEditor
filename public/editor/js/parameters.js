// © DialogueTrainer

/* exported Parameters */
let Parameters;

(function()
{
    "use strict";

    const defaultContainer = { byId: {}, sequence: [] };

    // eslint-disable-next-line no-global-assign
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

    $(function()
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
        const parametersDialog = $('<div>', { id: "parameters" });

        const parametersEmptyState = $('<p>', { style: 'opacity: .5', text: i18next.t('parameters:empty_state') });
        parametersDialog.append(parametersEmptyState);

        const parametersTable = $('<table>');
        const parametersTableHead = $('<thead>')
            .append($('<th>')) // For the sortable handle
            .append($('<th>', { text: i18next.t('common:name') }))
            .append($('<th>', { text: i18next.t('common:type') }))
            .append($('<th>', { text: i18next.t('common:evaluated') }))
            .append($('<th>', { text: i18next.t('common:initial_value') }))
            .append($('<th>', { text: i18next.t('common:description') }));

        parametersTable.append(parametersTableHead).appendTo(parametersDialog);
        const parametersContainer = $('<tbody>').appendTo(parametersTable);

        const actionButtons = $('<div>', { class: "flexbox gap-1" });
        const addParameterButton = Parts.addButton('', 'buttonIcon');
        addParameterButton.on('click', function()
        {
            const parameterContainer = addDefaultDefinition(parametersContainer);
            Utils.focusFirstTabindexedDescendant(parameterContainer);
            parametersTable.show();
            parametersEmptyState.hide();
        });
        actionButtons.append(addParameterButton);

        const addTimeParameterButton = $('<button>', { type: 'button', class: 'buttonIcon col-time roundedPill small', title: i18next.t('parameters:add_time_title') }).append(Utils.sIcon('mdi-timer-outline'));
        addTimeParameterButton.on('click', function()
        {
            const isTime = parametersContainer.find(".isT").length;
            const isTimeRemoved = parametersContainer.find(".isT.removedParameter").length;

            // If the timeId is empty, or if it is filled, but
            // the parameter in the dialog has been removed (in that case the
            // timeId has not been updated yet)
            if (Parameters.timeId === null || isTimeRemoved === isTime)
            {
                addTimeParameterDefinition(parametersContainer);

                Utils.focusFirstTabindexedDescendant(parametersContainer.children().last());
                addTimeParameterButton.hide();
                parametersTable.show();
            }
        });
        actionButtons.append(addTimeParameterButton);
        parametersDialog.append(actionButtons);
        // Animate textareas to expand on click
        parametersContainer.on("focus", ".parameter-description", function() { $(this).animate({ height: "10em" }, 500); });
        parametersContainer.on("focusout", ".parameter-description", function() { $(this).animate({ height: "2.2em" }, 500); });
        // Delete table row
        parametersContainer.on('click', '.delete', function()
        {
            const tr = $(this).closest('tr');
            tr.addClass("removedParameter");
            // For time parameter: make visible when Time-parameter has been removed
            if (tr[0].id === "t" && tr.not(".removedParameter")) addTimeParameterButton.show();
            if (parametersContainer.children().not(".removedParameter").length === 0)
            {
                parametersTable.hide();
                parametersEmptyState.show();
            }
        });

        if (Parameters.timeId !== null) addTimeParameterButton.hide();
        else addTimeParameterButton.show();

        parametersDialog.dialog(
        {
            title: i18next.t('parameters:title'),
            width: Utils.fitDialogWidthToWindow(Utils.dialogSizes.medium),
            modal: true,
            grid: false,
            buttons: [{
                text: i18next.t('common:confirm'),
                class: 'col-primary roundedPill medium',
                click: function()
                {
                    save(parametersContainer).then(saved =>
                    {
                        if (saved)
                        {
                            $(this).dialog('close');
                        }
                    });
                }
            },
            {
                text: i18next.t('common:cancel'),
                class: 'col-dim roundedPill medium',
                click: function() { $(this).dialog('close'); }
            }],
            close: function()
            {
                $("#main").focus();
                parametersDialog.remove();
            }
        });

        // Handle empty state and/or table head visibility
        parametersEmptyState.toggle(!Parameters.container.sequence.length > 0);
        parametersTable.toggle(Parameters.container.sequence.length > 0);

        Parameters.container.sequence.forEach(function(parameter)
        {
            let parameterContainer;
            if (parameter.id === "t") parameterContainer = addTimeParameterDefinition(parametersContainer);
            else parameterContainer = addDefaultDefinition(parametersContainer);

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
        const parameterContainer = $('<tr>', { class: "newParameter" });

        const typeSelectContainerInner = $('<div>', { class: "flexbox gap-1" });
        const typeSelectContainer = $('<td>').append(typeSelectContainerInner);

        const nameInput = $('<input>', { type: 'text', class: "name" });

        const initialValueContainer = $('<span>', { class: "parameter-initial-value-container" });

        const description = $('<textarea>', { class: "parameter-description alignMiddle", style: "height:2.2em;" });

        const evaluated = $('<input>', { type: 'checkbox', class: "parameter-evaluated alignMiddle" });
        evaluated.on('change', function()
        {
            if ($(this).prop('checked'))
            {
                if (Config.container.settings.evaluationName.type.markdown) Utils.attachMarkdownTooltip(nameInput);

                description.attr('maxlength', Config.container.settings.evaluationDescription.type.maxLength);
                if (Config.container.settings.evaluationDescription.type.markdown) Utils.attachMarkdownTooltip(description);
            }
            else
            {
                if (Config.container.settings.evaluationName.type.markdown) Utils.detachMarkdownTooltip(nameInput);

                description.removeAttr('maxlength');
                if (Config.container.settings.evaluationDescription.type.markdown) Utils.detachMarkdownTooltip(description);
            }
        });

        parameterContainer
            .append($('<td>', { class: "handle", text: "↕" }))
            .append($('<td>').append(nameInput))
            .append(typeSelectContainer)
            .append($('<td>').append(evaluated))
            .append($('<td>').append(initialValueContainer))
            .append($('<td>').append(description))
            .append(Parts.deleteButton());

        let previousType;
        const handleParameterTypeChange = function(newTypeName)
        {
            parameterContainer.addClass("changedTypeParameter");

            let initialValue;
            if (previousType) initialValue = previousType.getFromDOM(initialValueContainer);
            initialValueContainer.empty();
            const type = Types.primitives[newTypeName].loadTypeFromDOM(parameterContainer, initialValueContainer);
            type.appendControlTo(initialValueContainer);
            if (previousType) type.setInDOM(initialValueContainer, type.castFrom(previousType, initialValue));
            Types.attachDefinitionTooltip(typeSelectContainerInner, type);
            previousType = type;
        };

        Types.appendControlsTo(typeSelectContainerInner, '.name', 'parameter-type-select', handleParameterTypeChange);

        parameterContainer.removeClass("changedTypeParameter");

        parametersContainer.append(parameterContainer);

        return parameterContainer;
    }

    function addTimeParameterDefinition(parametersContainer)
    {
        const parameterContainer = addDefaultDefinition(parametersContainer);
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
        const consideredSave = function()
        {
            SaveIndicator.setSavedChanges(false);

            const previouslySelectedElement = Main.selectedElement;
            Main.selectElement(null);

            parametersContainer.find(".removedParameter").each(function()
            {
                const id = $(this).prop('id');

                const doesNotReferToParameterId = function(referrer)
                {
                    return referrer.idRef !== id;
                };
                // Remove the preconditions and effects for every node with this parameter.
                for (const nodeID in Main.nodes)
                {
                    const node = Main.nodes[nodeID];
                    node.parameterEffects.userDefined = node.parameterEffects.userDefined.filter(doesNotReferToParameterId);

                    if (node.preconditions)
                    {
                        node.preconditions = Condition.filter(doesNotReferToParameterId, node.preconditions);
                    }
                }

                Evaluations.handleParameterRemoval(id);

                if (id === Parameters.timeId && Parameters.timeId !== null) Parameters.timeId = null;

                // Remove the parameter from the html and the object.
                $(this).remove();

                const removedParameter = Parameters.container.byId[id];
                const indexOfRemovedParameter = Parameters.container.sequence.indexOf(removedParameter);
                delete Parameters.container.byId[id];
                Parameters.container.sequence.splice(indexOfRemovedParameter, 1);
            });

            const getParameterFromDOM = function(container)
            {
                const typeName = container.find(".parameter-type-select").val();
                const type = Types.primitives[typeName].loadTypeFromDOM(container, container.find(".parameter-initial-value-container"));

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
                const newParameter = getParameterFromDOM($(this));
                const oldParameter = Parameters.container.byId[newParameter.id];

                if (!newParameter.name)
                {
                    newParameter.name = oldParameter.name;
                }

                // If an already existing parameter changed type, the effects on the nodes need to be adjusted accordingly
                if ($(this).hasClass("changedTypeParameter"))
                {
                    for (const nodeID in Main.nodes)
                    {
                        Main.nodes[nodeID].parameterEffects.userDefined.forEach(function(effect)
                        {
                            if (effect.idRef === oldParameter.id)
                            {
                                const hasOperator = newParameter.type.assignmentOperators.includes(Types.assignmentOperators[effect.operator]);
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
                    ElementList.handleParameterTypeChange(oldParameter, newParameter);

                    $(this).removeClass("changedTypeParameter");
                }
                // Special case for triggering a type change for a reference calculation update
                else if (oldParameter.type.name === Types.primitives.integer.name && newParameter.type.name === Types.primitives.integer.name &&
                (oldParameter.type.minimum !== newParameter.type.minimum || oldParameter.type.maximum !== newParameter.type.maximum))
                {
                    Evaluations.handleParameterTypeChange(oldParameter, newParameter);
                }

                if ((oldParameter.evaluated || false) !== (newParameter.evaluated || false)) Evaluations.handleParameterEvaluatedChange(newParameter);
                if (newParameter.evaluated) Evaluations.handleEvaluatedParameterChange(newParameter);

                $.extend(oldParameter, newParameter);
            });

            // All new parameters
            parametersContainer.find(".newParameter").each(function()
            {
                if ($(this).prop('id') !== 't')
                {
                    const id = 'p' + (Parameters.counter += 1).toString();
                    $(this).prop('id', id);
                }

                const newParameter = getParameterFromDOM($(this));

                if (!newParameter.name) return;

                Parameters.container.byId[newParameter.id] = newParameter;

                $(this).removeClass("newParameter").addClass("existingParameter");
                $(this).removeClass("changedTypeParameter");

                if ($(this).prop('id') === 't')
                {
                    Parameters.timeId = newParameter.id;
                    $(this).addClass('isT');

                    const timeEffect =
                    {
                        idRef: newParameter.id,
                        type: Types.primitives.integer,
                        operator: "addAssign",
                        value: 1
                    };

                    for (const nodeId in Main.nodes)
                    {
                        const node = Main.nodes[nodeId];
                        if (node.type === Main.playerType)
                        {
                            if (node.parameterEffects.userDefined === undefined || node.parameterEffects.userDefined === null) node.parameterEffects.userDefined = [];
                            node.parameterEffects.userDefined.push(timeEffect);
                        }
                    }
                }

                if (newParameter.evaluated) Evaluations.handleParameterEvaluatedChange(newParameter);
            });

            // Save parameters in UI order.
            Parameters.container.sequence = parametersContainer.find(".existingParameter").map(function()
            {
                return Parameters.container.byId[$(this).prop('id')];
            }).get();


            ElementList.handleParametersChange();

            Main.selectElement(previouslySelectedElement);
        };

        const confirmParametersWithoutNameRemoval = function()
        {
            let noNameCounter = 0;
            parametersContainer.find(".newParameter").not(".removedParameter").each(function()
            {
                if (!$(this).find(".name").val()) noNameCounter++;
            });
            if (noNameCounter > 0) return Utils.confirmDialog(i18next.t('parameters:missing_name_warning'), 'warning');
            else return Promise.resolve(true);
        };

        const confirmRemovedParametersRemoval = function()
        {
            const removedExistingParameters = [];
            parametersContainer.find(".removedParameter").not(".newParameter").each(function()
            {
                removedExistingParameters.push(Parameters.container.byId[$(this).prop('id')]);
            });
            if (removedExistingParameters.length > 0)
            {
                const content = $('<div>', { text: i18next.t('parameters:removal_warning', { count: removedExistingParameters.length }) });
                const removedParameterList = $('<ul>');
                removedExistingParameters.forEach(function(existingParameter)
                {
                    removedParameterList.append($('<li>', { text: existingParameter.name }));
                });
                content.append(removedParameterList);
                return Utils.confirmDialog(content, 'warning');
            }
            else return Promise.resolve(true);
        };

        return confirmParametersWithoutNameRemoval().then(function(confirmed)
        {
            if (confirmed)
            {
                return confirmRemovedParametersRemoval().then(function(confirmed)
                {
                    if (confirmed) consideredSave();
                    return Promise.resolve(confirmed);
                });
            }
            else return Promise.resolve(false);
        });
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
            if (!type || parameter.type.equals(type)) container.append($('<option>', { value: parameter.id, text: parameter.name }));
        });
    }

    function hasWithType(type)
    {
        return Parameters.container.sequence.some(function(parameter) { return parameter.type.equals(type); });
    }
})();
