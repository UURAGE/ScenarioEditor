/* © Utrecht University and DialogueTrainer */

(function()
{
    "use strict";

    $(function()
    {
        $("#togglePlaythroughsScreen").on('click', function()
        {
            var calculateNodeCounts = function(playthroughs)
            {
                var nodeCounts = {};
                var count = 0;
                playthroughs.forEach(function(playthrough)
                {
                    playthrough.statements.forEach(function(statement)
                    {
                        var nodeID = statement.id.replace(/^(.+?\.){3}/, '').replace(/\./g, '_');
                        if (nodeID in Main.nodes &&
                            (!Main.selectedElement || nodeID === Main.selectedElement) &&
                            (Main.selectedElements.length === 0 || Main.selectedElements.indexOf(nodeID) !== -1))
                        {
                            if (!(nodeID in nodeCounts))
                            {
                                nodeCounts[nodeID] = 0;
                            }
                            nodeCounts[nodeID]++;
                            count++;
                        }
                    });
                });
                return { nodeCounts: nodeCounts, count: count };
            };

            var container = $('<div>');

            container.append($('<p>', { text: i18next.t('playthroughItemAnalysis:explanation') }));

            container.append($('<p>', { text: i18next.t('playthroughItemAnalysis:experimental_warning'), class: 'warning alert' }));

            var fileInputContainer = $('<div>', { style: 'margin-top: 20px;' }).appendTo(container);
            fileInputContainer.append($('<label>', { text: i18next.t('playthroughItemAnalysis:import_playthroughs') + ' ' }));
            var fileInput = $('<input>', { type: 'file', accept: 'application/json' }).appendTo(fileInputContainer);

            var itemAnalysisTypeContainer = $('<div>', { style: 'margin-top: 20px;' }).appendTo(container);
            itemAnalysisTypeContainer.append($('<label>', { text: i18next.t('common:type') + ' ' }));
            var itemAnalysisType = $('<select>').appendTo(itemAnalysisTypeContainer);
            itemAnalysisType.append($('<option>', { value: 'frequency', text: i18next.t('playthroughItemAnalysis:frequency') }));
            itemAnalysisType.append($('<option>', { value: 'difficulty', text: i18next.t('playthroughItemAnalysis:difficulty') }));
            itemAnalysisType.append($('<option>', { value: 'discrimination', text: i18next.t('playthroughItemAnalysis:discrimination') }));

            // For item frequency: relative to selected nodes or to all nodes
            var percentageCalculation = null;
            var addPercentageCalculationContainer = function()
            {
                var percentageCalculationContainer = $('<div>', { style: 'margin-top: 20px;' }).appendTo(container);
                percentageCalculation = $('<input>', { type: 'checkbox' }).appendTo(percentageCalculationContainer);
                percentageCalculationContainer.append($('<label>', { text: i18next.t('playthroughItemAnalysis:relative_percentage_calculation') }));
            };

            var correctNodeSelect = null;
            var addCorrectNodeSelect = function()
            {
                if (Main.selectedElements.length > 0)
                {
                    correctNodeSelect = $('<select>', { class: 'correctNodeSelect' }).appendTo(container);
                    Main.selectedElements.forEach(function(nodeID)
                    {
                        correctNodeSelect.append($('<option>', { value: nodeID, text: Utils.abbreviateText(Main.nodes[nodeID].text, " - ", 36) }));
                    });
                }
            };

            itemAnalysisType.on('change', function()
            {
                if (percentageCalculation) percentageCalculation.parent().remove();
                if (correctNodeSelect) correctNodeSelect.remove();

                if (itemAnalysisType.val() === 'frequency')
                {
                    addPercentageCalculationContainer();
                }
                else if (itemAnalysisType.val() === 'difficulty' || itemAnalysisType.val() === 'discrimination')
                {
                    addCorrectNodeSelect();
                }
            });
            itemAnalysisType.trigger('change');

            container.dialog(
            {
                title: i18next.t('playthroughItemAnalysis:title'),
                height: 'auto',
                width: 480,
                modal: true,
                buttons:
                [
                    {
                        text: i18next.t('common:confirm'),
                        click: function()
                        {
                            if (fileInput[0].files.length === 0) return;
                            var reader = new FileReader();
                            reader.onerror = function()
                            {
                                Utils.alertDialog('Error reading file', 'error');
                            };
                            reader.onload = function(e)
                            {
                                var playthroughs = JSON.parse(e.target.result);

                                var correctNodeID, correctCount;
                                var nodeID;
                                for (nodeID in Main.nodes)
                                {
                                    $('#' + nodeID).find('.indicator').remove();
                                }

                                var result;
                                if (itemAnalysisType.val() === 'frequency')
                                {
                                    result = calculateNodeCounts(playthroughs);

                                    for (nodeID in result.nodeCounts)
                                    {
                                        var percentage = result.nodeCounts[nodeID] / (percentageCalculation.prop('checked') ? result.count : playthroughs.length) * 100;
                                        $('#' + nodeID).append($('<div>', { text: percentage.toFixed(1) + "%" + " (" + result.nodeCounts[nodeID] + "x)", class: 'indicator' }));
                                    }
                                }
                                else if (itemAnalysisType.val() === 'difficulty')
                                {
                                    if (correctNodeSelect === null)
                                    {
                                        Utils.alertDialog(i18next.t('playthroughItemAnalysis:no_nodes_selected'), 'warning');
                                        return;
                                    }
                                    correctNodeID = correctNodeSelect.val();

                                    result = calculateNodeCounts(playthroughs);
                                    correctCount = correctNodeID in result.nodeCounts ? result.nodeCounts[correctNodeID] : 0;
                                    var difficulty = correctCount / result.count;
                                    $('#' + correctNodeID).append($('<div>', { text: (difficulty * 100).toFixed(2) + "%", class: 'indicator' }));
                                }
                                else if (itemAnalysisType.val() === 'discrimination')
                                {
                                    if (correctNodeSelect === null)
                                    {
                                        Utils.alertDialog(i18next.t('playthroughItemAnalysis:no_nodes_selected'), 'warning');
                                        return;
                                    }
                                    correctNodeID = correctNodeSelect.val();

                                    var playthroughsWithTotalScore = playthroughs.filter(function(playthrough)
                                    {
                                        return playthrough.totalScore !== null || playthrough.totalScore !== undefined;
                                    });
                                    if (playthroughsWithTotalScore.length < 4)
                                    {
                                        Utils.alertDialog(i18next.t('playthroughItemAnalysis:not_enough_playthroughs'), 'warning');
                                        return;
                                    }

                                    var sortedPlaythroughs = playthroughsWithTotalScore.sort(function(a, b)
                                    {
                                        return a.totalScore - b.totalScore;
                                    });
                                    var groupLength = Math.round(sortedPlaythroughs.length / 4);
                                    var lowestTotalScorePlaythroughs = sortedPlaythroughs.slice(0, groupLength);
                                    var highestTotalScorePlaythroughs = sortedPlaythroughs.slice(-groupLength);

                                    var lowestTotalScoreResult = calculateNodeCounts(lowestTotalScorePlaythroughs);
                                    var lowestTotalScoreCorrectCount = correctNodeID in lowestTotalScoreResult.nodeCounts ?
                                        lowestTotalScoreResult.nodeCounts[correctNodeID] : 0;
                                    var highestTotalScoreResult = calculateNodeCounts(highestTotalScorePlaythroughs);
                                    var highestTotalScoreCorrectCount = correctNodeID in highestTotalScoreResult.nodeCounts ?
                                        highestTotalScoreResult.nodeCounts[correctNodeID] : 0;
                                    var discriminationIndex = highestTotalScoreCorrectCount / groupLength - lowestTotalScoreCorrectCount / groupLength;
                                    var getQualificationForTooltip = function()
                                    {
                                        if (discriminationIndex < 0.2)
                                        {
                                            return 'too_low';
                                        }
                                        else if (discriminationIndex > 1 - (1 / Main.selectedElements.length))
                                        {
                                            return 'too_high';
                                        }
                                        else if (discriminationIndex > 0.3)
                                        {
                                            return 'good';
                                        }
                                        else
                                        {
                                            return 'fair';
                                        }
                                    };
                                    $('#' + correctNodeID).append($('<div>',
                                    {
                                        text: discriminationIndex.toFixed(2),
                                        class: 'indicator',
                                        title: i18next.t('playthroughItemAnalysis:discrimination_index_' + getQualificationForTooltip())
                                    }));
                                }
                                container.dialog('close');
                            };
                            reader.readAsText(fileInput[0].files[0]);
                        }
                    },
                    {
                        text: i18next.t('common:close'),
                        click: function()
                        {
                            $(this).dialog('close');
                        }
                    }
                ],
                close: function()
                {
                    $(this).remove();
                }
            });
        });
    });
})();
