/* © Utrecht University and DialogueTrainer */

var Evaluations;

(function()
{
    "use strict";

    var defaultContainer = { byId: {}, sequence: [] };

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

    $(document).ready(function()
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
        var evaluationsDialog = $('<div>', { id: "evaluations" });

        var evaluationsTableHead = $('<thead>')
            .append($('<th>')) // For the sortable handle
            .append($('<th>', { text: i18next.t('common:name') }))
            .append($('<th>', { text: i18next.t('common:type') }))
            .append($('<th>', { text: i18next.t('common:description') }))
            .append($('<th>', { text: i18next.t('common:expression') }));
        var evaluationsContainer = $('<tbody>').appendTo($('<table>').append(evaluationsTableHead).appendTo(evaluationsDialog));

        var addButton = Parts.addButton();
        var appendNewEvaluationContainer = function()
        {
            var evaluationContainer = $('<tr>').appendTo(evaluationsContainer);
            evaluationContainer.addClass("added");

            evaluationContainer.append($('<td>', { class: 'handle', text: '↕' }));

            evaluationContainer.append($('<td>').append($('<input>', { type: 'text', class: 'evaluation-name' })));

            var typeContainer = $('<td>');
            var expressionKindContainer = $('<span>', { class: 'evaluation-expression' });

            var previousType;
            var handleEvaluationTypeChange = function(newTypeName)
            {
                var newType = Types.primitives[newTypeName].loadTypeFromDOM(typeContainer);
                if (newType.name === Types.primitives.string.name)
                {
                    newType = $.extend(newType, { controlName: 'textarea', rows: 4, markdown: "gfm" });
                }

                Expression.handleTypeChange(expressionKindContainer, previousType, newType);
                previousType = newType;
            };
            Types.appendControlsTo(typeContainer.appendTo(evaluationContainer), 'evaluation-type', handleEvaluationTypeChange);

            var evaluationDescription = $('<textarea>', { class: 'evaluation-description' });
            evaluationDescription.attr('maxlength', Config.container.settings.evaluationDescription.type.maxLength);
            evaluationContainer.append($('<td>').append(evaluationDescription));
            if (Config.container.settings.evaluationDescription.type.markdown) Utils.attachMarkdownTooltip(evaluationDescription);

            var expressionContainer = $('<td>');
            expressionContainer.append(expressionKindContainer);
            evaluationContainer.append(expressionContainer);

            var deleteButton = Parts.deleteButton();
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
            height: 768,
            width: 1024,
            modal: true,
            buttons: [
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
            }],
            close: function()
            {
                $("#main").focus();
                evaluationsDialog.remove();
            }
        });

        evaluationsTableHead.toggle(Evaluations.container.sequence.length > 0);

        Evaluations.container.sequence.forEach(function(evaluation)
        {
            var evaluationContainer = appendNewEvaluationContainer();
            evaluationContainer.removeClass("added").addClass("existed");

            evaluationContainer.prop('id', evaluation.id);

            var nameInput = evaluationContainer.find(".evaluation-name");
            nameInput.val(evaluation.name);

            Types.insertIntoDOM(evaluationContainer, 'evaluation-type', evaluation.type);

            var descriptionTextArea = evaluationContainer.find(".evaluation-description");
            descriptionTextArea.val(evaluation.description);

            var expressionContainer = evaluationContainer.find(".evaluation-expression");
            Expression.setInDOM(expressionContainer, evaluation.type, evaluation.expression);

            for (var parameterId in Parameters.container.byId)
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
        var deferredSave = $.Deferred();

        var consideredSave = function()
        {
            Main.unsavedChanges = true;

            var previouslySelectedElement = Main.selectedElement;
            Main.selectElement(null);

            evaluationsContainer.find(".removed").each(function()
            {
                var id = $(this).prop('id');
                $(this).remove();

                var removedEvaluation = Evaluations.container.byId[id];
                var indexOfRemovedEvaluation = Evaluations.container.sequence.indexOf(removedEvaluation);
                delete Evaluations.container.byId[id];
                Evaluations.container.sequence.splice(indexOfRemovedEvaluation, 1);
            });

            var getEvaluationFromDOM = function(container)
            {
                var typeName = container.find(".evaluation-type").val();
                var type = Types.primitives[typeName].loadTypeFromDOM(container);
                if (type.name === Types.primitives.string.name)
                {
                    type = $.extend(type, { controlName: 'textarea', rows: 4, markdown: "gfm" });
                }

                var evaluationId = container.prop('id');
                var expression = Expression.getFromDOM(container.find('.evaluation-expression'), type);
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
                        type = Parameters.container.byId[evaluationId.substring(Evaluations.getParameterIdPrefix().length)].type;
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
                var newEvaluation = getEvaluationFromDOM($(this));
                var oldEvaluation = Evaluations.container.byId[newEvaluation.id];

                if (!newEvaluation.name)
                {
                    newEvaluation.name = oldEvaluation.name;
                }

                $.extend(oldEvaluation, newEvaluation);
            });
            evaluationsContainer.find(".added").each(function()
            {
                Evaluations.counter++;
                var id = Evaluations.getIdPrefix() + 'e' + Evaluations.counter.toString();
                $(this).prop('id', id);

                var newEvaluation = getEvaluationFromDOM($(this));

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

        var confirmEvaluationsWithoutNameRemoval = function()
        {
            var noNameCounter = 0;
            evaluationsContainer.find(".added").not(".removed").each(function()
            {
                if (!$(this).find(".evaluation-name").val())
                {
                    noNameCounter++;
                }
            });
            if (noNameCounter > 0)
            {
                return Utils.confirmDialog(i18next.t('evaluations:missing_name_warning'));
            }
            else
            {
                return $.Deferred().resolve(true);
            }
        };

        var confirmRemovedEvaluationsRemoval = function()
        {
            var removedExistingEvaluations = [];
            evaluationsContainer.find(".removed").not(".added").each(function()
            {
                removedExistingEvaluations.push(Evaluations.container.byId[$(this).prop('id')]);
            });
            if (removedExistingEvaluations.length > 0)
            {
                var content = $('<div>', { text: i18next.t('evaluations:removal_warning', { count: removedExistingEvaluations.length }) });
                var removedEvaluationList = $('<ul>');
                removedExistingEvaluations.forEach(function(existingEvaluation)
                {
                    removedEvaluationList.append($('<li>', { text: existingEvaluation.name }));
                });
                content.append(removedEvaluationList);
                return Utils.confirmDialog(content);
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
        var evaluatedParameterId = Evaluations.getParameterIdPrefix() + oldParameter.id;
        Evaluations.container.sequence.forEach(function(evaluation)
        {
            if (evaluation.id === evaluatedParameterId)
            {
                evaluation.type = newParameter.type;

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
        var evaluatedParameterId = Evaluations.getParameterIdPrefix() + parameterId;
        for (var i = 0; i < Evaluations.container.sequence.length; i++)
        {
            var evaluation = Evaluations.container.sequence[i];
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
        var evaluatedParameterId = Evaluations.getParameterIdPrefix() + parameter.id;
        var evaluation;
        if (parameter.evaluated)
        {
            evaluation = {
                id: evaluatedParameterId,
                name: parameter.name,
                type: parameter.type,
                description: parameter.description,
                expression: { kind: Expression.kinds.reference, reference: { parameterIdRef: parameter.id } }
            };
            Evaluations.container.sequence.push(evaluation);
            Evaluations.container.byId[evaluatedParameterId] = evaluation;
        }
        else
        {
            evaluation = Evaluations.container.byId[evaluatedParameterId];
            var index = Evaluations.container.sequence.indexOf(evaluation);
            delete Evaluations.container.byId[evaluatedParameterId];
            Evaluations.container.sequence.splice(index, 1);
        }
    }

    function handleEvaluatedParameterChange(parameter)
    {
        var evaluatedParameterId = Evaluations.getParameterIdPrefix() + parameter.id;
        var evaluation = Evaluations.container.byId[evaluatedParameterId];
        evaluation.name = parameter.name;
        evaluation.description = parameter.description;
    }

})();
