/* © Utrecht University and DialogueTrainer */

/* exported Evaluations */
let Evaluations;

(function()
{
    "use strict";

    const defaultContainer = { byId: {}, sequence: [] };

    // eslint-disable-next-line no-global-assign
    Evaluations =
    {
        counter: 0,
        container: $.extend(true, {}, defaultContainer),
        reset: reset,
        dialog: dialog,
        getIdPrefix: getIdPrefix,
        getParameterIdPrefix: getParameterIdPrefix,
        handleParameterTypeChange: handleParameterTypeChange,
        handleParameterRemoval: handleParameterRemoval,
        handleParameterEvaluatedChange: handleParameterEvaluatedChange,
        handleEvaluatedParameterChange: handleEvaluatedParameterChange
    };

    $(function()
    {
        $("#editEvaluations").on('click', dialog);
    });

    function reset()
    {
        Evaluations.container = $.extend(true, {}, defaultContainer);
        Evaluations.counter = 0;
    }

    function dialog()
    {
        const evaluationsDialog = $('<div>', { id: "evaluations" });

        const evaluationsTableHead = $('<thead>')
            .append($('<th>')) // For the sortable handle
            .append($('<th>', { text: i18next.t('common:name') }))
            .append($('<th>', { text: i18next.t('common:type') }))
            .append($('<th>', { text: i18next.t('common:description') }))
            .append($('<th>', { text: i18next.t('common:expression') }));
        const evaluationsContainer = $('<tbody>').appendTo($('<table>').append(evaluationsTableHead).appendTo(evaluationsDialog));

        const addButton = Parts.addButton();
        const appendNewEvaluationContainer = function()
        {
            const evaluationContainer = $('<tr>').appendTo(evaluationsContainer);
            evaluationContainer.addClass("added");

            evaluationContainer.append($('<td>', { class: 'handle', text: '↕' }));

            const nameInput = $('<input>', { type: 'text', class: 'evaluation-name' });
            evaluationContainer.append($('<td>').append(nameInput));
            if (Config.container.settings.evaluationName.type.markdown) Utils.attachMarkdownTooltip(nameInput);

            const typeContainer = $('<td>');
            const expressionKindContainer = $('<span>', { class: 'evaluation-expression' });

            let previousType;
            const handleEvaluationTypeChange = function(newTypeName)
            {
                let newType = Types.primitives[newTypeName].loadTypeFromDOM(typeContainer);
                if (newType.name === Types.primitives.string.name)
                {
                    newType = $.extend(newType, { controlName: 'textarea', rows: 4, markdown: "gfm" });
                }

                Expression.handleTypeChange(expressionKindContainer, previousType, newType);
                previousType = newType;
            };
            Types.appendControlsTo(typeContainer.appendTo(evaluationContainer), '.evaluation-name', 'evaluation-type', handleEvaluationTypeChange);

            const evaluationDescription = $('<textarea>', { class: 'evaluation-description' });
            evaluationDescription.attr('maxlength', Config.container.settings.evaluationDescription.type.maxLength);
            evaluationContainer.append($('<td>').append(evaluationDescription));
            if (Config.container.settings.evaluationDescription.type.markdown) Utils.attachMarkdownTooltip(evaluationDescription);

            const expressionContainer = $('<td>');
            expressionContainer.append(expressionKindContainer);
            evaluationContainer.append(expressionContainer);

            const deleteButton = Parts.deleteButton();
            deleteButton.on('click', function()
            {
                evaluationContainer.addClass("removed");
                evaluationContainer.hide();
                if (evaluationsContainer.children().not(".removed").length === 0)
                {
                    evaluationsTableHead.hide();
                }
            });
            evaluationContainer.append($('<td>').append(deleteButton));

            return evaluationContainer;
        };
        addButton.on('click', function()
        {
            evaluationsTableHead.show();
            appendNewEvaluationContainer();
        });
        evaluationsDialog.append(addButton);

        evaluationsDialog.dialog(
        {
            title: i18next.t('evaluations:title'),
            height: 800,
            width: 1200,
            modal: true,
            buttons:
            [
                {
                    text: i18next.t('common:confirm'),
                    click: function()
                    {
                        save(evaluationsContainer).done(function(saved)
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
                }
            ],
            close: function()
            {
                $("#main").focus();
                evaluationsDialog.remove();
            }
        });

        evaluationsTableHead.toggle(Evaluations.container.sequence.length > 0);

        Evaluations.container.sequence.forEach(function(evaluation)
        {
            const evaluationContainer = appendNewEvaluationContainer();
            evaluationContainer.removeClass("added").addClass("existed");

            evaluationContainer.prop('id', evaluation.id);

            const nameInput = evaluationContainer.find(".evaluation-name");
            nameInput.val(evaluation.name);

            Types.insertIntoDOM(evaluationContainer, 'evaluation-type', evaluation.type);

            const descriptionTextArea = evaluationContainer.find(".evaluation-description");
            descriptionTextArea.val(evaluation.description);

            const expressionContainer = evaluationContainer.find(".evaluation-expression");
            Expression.setInDOM(expressionContainer, evaluation.type, evaluation.expression);

            for (const parameterId in Parameters.container.byId)
            {
                if (evaluation.id === Evaluations.getParameterIdPrefix() + parameterId)
                {
                    nameInput.prop('disabled', true);
                    evaluationContainer.find(".evaluation-type").prop('disabled', true);
                    evaluationContainer.find('.define-type').remove();
                    descriptionTextArea.prop('disabled', true);
                    expressionContainer.find('button, checkbox, input, select, textarea').not('.reference-calculate').prop('disabled', true);

                    evaluationContainer.find(".delete").remove();
                }
            }
        });

        Utils.makeSortable(evaluationsContainer);
    }

    function save(evaluationsContainer)
    {
        const deferredSave = $.Deferred();

        const consideredSave = function()
        {
            SaveIndicator.setSavedChanges(false);

            const previouslySelectedElement = Main.selectedElement;
            Main.selectElement(null);

            evaluationsContainer.find(".removed").each(function()
            {
                const id = $(this).prop('id');
                $(this).remove();

                const removedEvaluation = Evaluations.container.byId[id];
                const indexOfRemovedEvaluation = Evaluations.container.sequence.indexOf(removedEvaluation);
                delete Evaluations.container.byId[id];
                Evaluations.container.sequence.splice(indexOfRemovedEvaluation, 1);
            });

            const getEvaluationFromDOM = function(container)
            {
                const typeName = container.find(".evaluation-type").val();
                let type = Types.primitives[typeName].loadTypeFromDOM(container);
                if (type.name === Types.primitives.string.name)
                {
                    type = $.extend(type, { controlName: 'textarea', rows: 4, markdown: "gfm" });
                }

                const evaluationId = container.prop('id');
                const expression = Expression.getFromDOM(container.find('.evaluation-expression'), type);
                if (type.name === Types.primitives.integer.name &&
                    evaluationId.indexOf(getParameterIdPrefix()) === 0)
                {
                    if (expression.reference.calculate === 'percentage')
                    {
                        type.minimum = 0;
                        type.maximum = 100;
                    }
                    else
                    {
                        type = $.extend({}, Parameters.container.byId[evaluationId.substring(Evaluations.getParameterIdPrefix().length)].type);
                    }
                }

                return {
                    id: evaluationId,
                    name: container.find(".evaluation-name").val(),
                    type: type,
                    description: container.find(".evaluation-description").val(),
                    expression: expression
                };
            };
            evaluationsContainer.find(".existed").each(function()
            {
                const newEvaluation = getEvaluationFromDOM($(this));
                const oldEvaluation = Evaluations.container.byId[newEvaluation.id];

                if (!newEvaluation.name)
                {
                    newEvaluation.name = oldEvaluation.name;
                }

                $.extend(oldEvaluation, newEvaluation);
            });
            evaluationsContainer.find(".added").each(function()
            {
                Evaluations.counter++;
                const id = Evaluations.getIdPrefix() + 'e' + Evaluations.counter.toString();
                $(this).prop('id', id);

                const newEvaluation = getEvaluationFromDOM($(this));

                if (newEvaluation.name)
                {
                    Evaluations.container.byId[newEvaluation.id] = newEvaluation;

                    $(this).removeClass("added").addClass("existed");
                }
            });

            Evaluations.container.sequence =
                evaluationsContainer.find(".existed").map(function()
                {
                    return Evaluations.container.byId[$(this).prop('id')];
                }).get();

            Main.selectElement(previouslySelectedElement);

            deferredSave.resolve(true);
        };

        const confirmEvaluationsWithoutNameRemoval = function()
        {
            let noNameCounter = 0;
            evaluationsContainer.find(".added").not(".removed").each(function()
            {
                if (!$(this).find(".evaluation-name").val())
                {
                    noNameCounter++;
                }
            });
            if (noNameCounter > 0)
            {
                return Utils.confirmDialog(i18next.t('evaluations:missing_name_warning'), 'warning');
            }
            else
            {
                return $.Deferred().resolve(true);
            }
        };

        const confirmRemovedEvaluationsRemoval = function()
        {
            const removedExistingEvaluations = [];
            evaluationsContainer.find(".removed").not(".added").each(function()
            {
                removedExistingEvaluations.push(Evaluations.container.byId[$(this).prop('id')]);
            });
            if (removedExistingEvaluations.length > 0)
            {
                const content = $('<div>', { text: i18next.t('evaluations:removal_warning', { count: removedExistingEvaluations.length }) });
                const removedEvaluationList = $('<ul>');
                removedExistingEvaluations.forEach(function(existingEvaluation)
                {
                    removedEvaluationList.append($('<li>', { text: existingEvaluation.name }));
                });
                content.append(removedEvaluationList);
                return Utils.confirmDialog(content, 'warning');
            }
            else
            {
                return $.Deferred().resolve(true);
            }
        };

        confirmEvaluationsWithoutNameRemoval().done(function(confirmed)
        {
            if (confirmed)
            {
                return confirmRemovedEvaluationsRemoval().done(function(confirmed)
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

    function getIdPrefix()
    {
        return 'evaluation.';
    }

    function getParameterIdPrefix()
    {
        return getIdPrefix() + 'parameter.';
    }

    function handleParameterTypeChange(oldParameter, newParameter)
    {
        const evaluatedParameterId = Evaluations.getParameterIdPrefix() + oldParameter.id;
        Evaluations.container.sequence.forEach(function(evaluation)
        {
            if (evaluation.id === evaluatedParameterId)
            {
                evaluation.type = $.extend({}, newParameter.type);

                evaluation.expression.kind.handleParameterTypeChange(oldParameter, newParameter, evaluation.type, evaluation.expression);

                if (evaluation.type.name === Types.primitives.integer.name && evaluation.expression.reference.calculate === 'percentage')
                {
                    evaluation.type.minimum = 0;
                    evaluation.type.maximum = 100;
                }
            }
            else
            {
                evaluation.expression.kind.handleParameterTypeChange(oldParameter, newParameter, evaluation.type, evaluation.expression);
            }
        });
    }

    function handleParameterRemoval(parameterId)
    {
        const evaluatedParameterId = Evaluations.getParameterIdPrefix() + parameterId;
        for (let i = 0; i < Evaluations.container.sequence.length; i++)
        {
            const evaluation = Evaluations.container.sequence[i];
            if (evaluation.id === evaluatedParameterId)
            {
                delete Evaluations.container.byId[evaluatedParameterId];
                Evaluations.container.sequence.splice(i, 1);
                i--;
            }
            else
            {
                evaluation.expression.kind.handleParameterRemoval(parameterId, evaluation.type, evaluation.expression);
            }
        }
    }

    function handleParameterEvaluatedChange(parameter)
    {
        const evaluatedParameterId = Evaluations.getParameterIdPrefix() + parameter.id;
        let evaluation;
        if (parameter.evaluated)
        {
            evaluation = {
                id: evaluatedParameterId,
                name: parameter.name,
                type: $.extend({}, parameter.type),
                description: parameter.description,
                expression: { kind: Expression.kinds.reference, reference: { parameterIdRef: parameter.id } }
            };
            if (parameter.type.name === Types.primitives.integer.name && 'maximum' in parameter.type && 'minimum' in parameter.type)
            {
                evaluation.expression.reference.calculate = 'percentage';
                evaluation.type.minimum = 0;
                evaluation.type.maximum = 100;
            }
            Evaluations.container.sequence.push(evaluation);
            Evaluations.container.byId[evaluatedParameterId] = evaluation;
        }
        else
        {
            evaluation = Evaluations.container.byId[evaluatedParameterId];
            const index = Evaluations.container.sequence.indexOf(evaluation);
            delete Evaluations.container.byId[evaluatedParameterId];
            Evaluations.container.sequence.splice(index, 1);
        }
    }

    function handleEvaluatedParameterChange(parameter)
    {
        const evaluatedParameterId = Evaluations.getParameterIdPrefix() + parameter.id;
        const evaluation = Evaluations.container.byId[evaluatedParameterId];
        evaluation.name = parameter.name;
        evaluation.description = parameter.description;
    }
})();
