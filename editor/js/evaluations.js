/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

var Evaluations;

(function()
{
    "use strict";

    var defaultEvaluations = { byId: {}, sequence: [] };

    Evaluations =
    {
        counter: 0,
        container: $.extend(true, {}, defaultEvaluations),
        reset: reset,
        dialog: dialog,
        onParameterTypeChange: onParameterTypeChange
    };

    $(document).ready(function()
    {
        $("#editEvaluations").on('click', dialog);
    });

    function reset()
    {
        Evaluations.container = $.extend(true, {}, defaultEvaluations);
        Evaluations.counter = 0;
    }

    function dialog()
    {
        var evaluationsDialog = $('<div>', { id: "evaluationsScreen" });

        var evaluationsTableHead = $('<thead>')
            .append($('<th>')) // For the sortable handle
            .append($('<th>', { text: i18next.t('common:name') }))
            .append($('<th>', { text: i18next.t('common:type') }))
            .append($('<th>', { text: i18next.t('common:description') }))
            .append($('<th>', { text: i18next.t('common:expression') }));
        var evaluationsContainer = $('<tbody>').appendTo($('<table>').append(evaluationsTableHead).appendTo(evaluationsDialog));

        var addButton = $('<button>', { type: 'button' }).append($('<img>', { src: editor_url + "png/others/plus.png", title: i18next.t('common:add') }));
        var appendNewEvaluationContainer = function()
        {
            var evaluationContainer = $('<tr>').appendTo(evaluationsContainer);
            evaluationContainer.addClass("added");

            evaluationContainer.append($('<td>', { class: 'handle', text: '↕' }));

            evaluationContainer.append($('<td>').append($('<input>', { type: 'text', class: 'evaluation-name' })));

            var typeContainer = $('<td>');
            var expressionKindContainer = $('<span>', { class: 'evaluation-expression' });

            var previousType;
            var onEvaluationTypeChange = function(newTypeName, userTypeChange)
            {
                var changeType = function()
                {
                    var newType = Types.primitives[newTypeName].loadTypeFromDOM(typeContainer);
                    if (newType.name === Types.primitives.string.name)
                    {
                        newType = $.extend(newType, { controlName: 'textarea', rows: 4, markdown: "gfm" });
                    }

                    Expression.onTypeChange(expressionKindContainer, previousType, newType, userTypeChange);
                    previousType = newType;
                };
                if (newTypeName === Types.primitives.enumeration.name)
                {
                    if (!userTypeChange)
                    {
                        changeType();
                    }
                }
                else
                {
                    changeType();
                }
            };
            Types.appendSelectTo(typeContainer.appendTo(evaluationContainer), 'evaluation-type', onEvaluationTypeChange);

            var evaluationDescription = $('<textarea>', { class: 'evaluation-description' });
            Utils.attachMarkdownTooltip(evaluationDescription);
            evaluationContainer.append($('<td>').append(evaluationDescription));

            var expressionContainer = $('<td>');
            expressionContainer.append(expressionKindContainer);
            evaluationContainer.append(expressionContainer);

            var deleteButton = $(Parts.getDeleteParentButtonHTML());
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
                    save(evaluationsContainer);
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

        if (Evaluations.container.sequence.length > 0)
        {
            evaluationsTableHead.show();
        }
        else
        {
            evaluationsTableHead.hide();
        }

        Evaluations.container.sequence.forEach(function(evaluation)
        {
            var evaluationContainer = appendNewEvaluationContainer();
            evaluationContainer.removeClass("added").addClass("existed");

            evaluationContainer.prop('id', evaluation.id);

            var typeSelect = evaluationContainer.find(".evaluation-type");

            evaluationContainer.find(".evaluation-name").val(evaluation.name);

            if (evaluation.type.name === Types.primitives.enumeration.name)
            {
                evaluation.type.insertTypeIntoDOM(typeSelect.parent());
            }
            typeSelect.val(evaluation.type.name).trigger('change');

            evaluationContainer.find(".evaluation-description").val(evaluation.description);

            Expression.setInDOM(evaluationContainer.find(".evaluation-expression"), evaluation.type, evaluation.expression);
        });

        Utils.makeSortable(evaluationsContainer);
    }

    function save(evaluationsContainer)
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
            var name = container.find(".evaluation-name").val();
            // If the name is empty, a valid evaluation cannot be created
            if (!name) return null;

            var typeName = container.find(".evaluation-type").val();
            var type = Types.primitives[typeName].loadTypeFromDOM(container);
            if (type.name === Types.primitives.string.name)
            {
                type = $.extend(type, { controlName: 'textarea', rows: 4, markdown: "gfm" });
            }
            // If it's an enumeration and there are no values defined, we can't define it either
            if (typeName === Types.primitives.enumeration.name && type.options.sequence.length === 0) return;

            return {
                id: container.prop('id'),
                name: name,
                type: type,
                description: container.find(".evaluation-description").val(),
                expression: Expression.getFromDOM(container.find('.evaluation-expression'), type)
            };
        };
        evaluationsContainer.find(".existed").each(function()
        {
            var newEvaluation = getEvaluationFromDOM($(this));
            if (!newEvaluation) return;
            var oldEvaluation = Evaluations.container.byId[newEvaluation.id];
            $.extend(oldEvaluation, newEvaluation);
        });
        evaluationsContainer.find(".added").each(function()
        {
            var id = 'evaluation-' + Evaluations.counter.toString();
            Evaluations.counter++;
            $(this).prop('id', id);

            var newEvaluation = getEvaluationFromDOM($(this));

            if (!newEvaluation) return;

            Evaluations.container.sequence.push(newEvaluation);
            Evaluations.container.byId[newEvaluation.id] = newEvaluation;

            $(this).removeClass("added").addClass("existed");
        });

        Evaluations.container.sequence =
            evaluationsContainer.find(".existed").map(function()
            {
                return Evaluations.container.byId[$(this).prop('id')];
            }).get();

        Main.selectElement(previouslySelectedElement);
    }

    function onParameterTypeChange(parameter)
    {
        Evaluations.container.sequence.forEach(function(evaluation)
        {
            evaluation.expression.kind.onParameterTypeChange(parameter, evaluation.type, evaluation.expression);
        });
    }

})();
