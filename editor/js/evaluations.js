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
        dialog: dialog
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
        var evaluationsDialog = $('<div>');

        var evaluationsContainer = $('<tbody>')
            .appendTo($('<table>')
                .append($('<thead>')
                    .append($('<th>')) // For the sortable handle
                    .append($('<th>', { text: i18next.t('common:name') }))
                    .append($('<th>', { text: i18next.t('common:type') }))
                    .append($('<th>', { text: i18next.t('common:description') }))
            ).appendTo(evaluationsDialog));

        var addButton = $('<button>', { type: 'button' }).append($('<img>', { src: editor_url + "png/others/plus.png", title: i18next.t('common:add') }));
        var appendNewEvaluation = function()
        {
            var evaluationContainer = $('<tr>').appendTo(evaluationsContainer);

            evaluationContainer.append($('<td>', { class: 'handle', text: '↕' }));

            evaluationContainer.append($('<td>').append($('<input>', { type: 'text', class: 'evaluation-name' })));

            Types.appendSelectTo($('<td>').appendTo(evaluationContainer), 'evaluation-type', function() {});

            evaluationContainer.append($('<td>').append($('<textarea>', { class: 'evaluation-description' })));
        };
        addButton.on('click', appendNewEvaluation);
        evaluationsDialog.append(addButton);

        evaluationsDialog.dialog(
        {
            title: i18next.t('evaluations:title'),
            height: 768,
            width: 960,
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

        // TODO: add evaluations to UI
        Evaluations.container.sequence.forEach(function(evaluation)
        {

        });

        // TODO: make evaluations sortable
        Utils.makeSortable(evaluationsContainer);
    }

    function save(evaluationsContainer)
    {
        Main.unsavedChanges = true;

        var previouslySelectedElement = Main.selectedElement;
        Main.selectElement(null);

        // TODO: save evaluations

        // TODO: save evaluations in UI order
        Evaluations.container.sequence =
            $(".existingEvaluation").map(function()
            {
                return Evaluations.container.byId[$(this).prop('id')];
            }).get();

        Main.selectElement(previouslySelectedElement);
    }

})();
