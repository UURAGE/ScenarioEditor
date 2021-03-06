/* © Utrecht University and DialogueTrainer */

(function()
{
    "use strict";

    $(function()
    {
        $("#togglePlaythroughsScreen").on('click', function()
        {
            var calculateNodeCounts = function(playthroughs, nodeIDs)
            {
                var nodeCounts = {};
                var count = 0;
                playthroughs.forEach(function(playthrough)
                {
                    playthrough.statements.forEach(function(statement)
                    {
                        var nodeID = statement.id.replace(/^(.+?\.){3}/, '').replace(/\./g, '_');
                        if (nodeID in Main.nodes &&
                            (nodeIDs.length === 0 || nodeIDs.indexOf(nodeID) !== -1))
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

            var detailsContainer = $('<div>').appendTo(container);

            var percentageCalculation = null;
            var addPercentageCalculationContainer = function()
            {
                var scope = i18next.t('playthroughItemAnalysis:percentage_calculation_scope.' + (Main.selectedElements.length > 0 ? 'selected' : 'all'));
                percentageCalculation = $('<select>')
                    .append(['playthroughs', 'nodes'].map(function(kind)
                    {
                        return $('<option>', { value: kind, text: i18next.t('playthroughItemAnalysis:percentage_calculation_kind.' + kind, { scope: scope }) });
                    }));
                detailsContainer.append(
                    $('<div>', { style: 'margin-top: 20px;' }).append(
                        $('<div>', { text: i18next.t('playthroughItemAnalysis:percentage_calculation') }),
                        $('<div>', { class: 'indent' }).append(
                            $('<div>', { text: i18next.t('playthroughItemAnalysis:number_of_node_occurrences') }),
                            $('<div>', { class: 'indent', text: i18next.t('playthroughItemAnalysis:divided_by') }),
                            $('<div>', { text: i18next.t('playthroughItemAnalysis:number_of') + ' ' }).append(percentageCalculation)
                        )
                    )
                );
            };

            var correctNodeSelect = null;
            var resultContainer = null;
            var childrenOfSelected = null;
            var addCorrectNodeSelect = function()
            {
                if (Main.selectedElement)
                {
                    childrenOfSelected = Main.getPlumbInstanceByNodeID(Main.selectedElement)
                        .getConnections(
                        {
                            source: Main.selectedElement
                        })
                        .map(function(connection)
                        {
                            return connection.targetId;
                        });
                    var node = Main.nodes[Main.selectedElement];
                    var issues =
                    {
                        allowInterleave: node.allowInterleaveNode,
                        allowDialogueEnd: node.allowDialogueEndNode,
                        preconditions: childrenOfSelected.some(function(nodeID) { return Main.nodes[nodeID].preconditions; })
                    };
                    var presentIssues = Object.keys(issues).filter(function(issue) { return issues[issue]; });
                    if (presentIssues.length > 0)
                    {
                        detailsContainer.append($('<div>', { class: 'warning alert', style: 'margin-top: 20px;' }).append(
                            i18next.t('playthroughItemAnalysis:accuracy_warning',
                            {
                                presentIssues: presentIssues.map(function(issue)
                                {
                                    return '<li>' + i18next.t('playthroughItemAnalysis:accuracy_issues.' + issue) + '</li>';
                                }).join("")
                            })
                        ));
                    }
                    correctNodeSelect = $('<select>', { class: 'correctNodeSelect', style: 'margin-top: 20px;' }).appendTo(detailsContainer);
                    resultContainer = $('<div>', { style: 'margin-top: 20px;' }).appendTo(detailsContainer);
                    correctNodeSelect.on('change', function()
                    {
                        resultContainer.empty();
                    });
                    childrenOfSelected.forEach(function(nodeID)
                    {
                        correctNodeSelect.append($('<option>', { value: nodeID, text: Utils.abbreviateText(Main.nodes[nodeID].text, " - ", 36) }));
                    });
                }
            };

            itemAnalysisType.on('change', function()
            {
                detailsContainer.empty();
                childrenOfSelected = null;

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
                                    result = calculateNodeCounts(playthroughs, Main.selectedElements);

                                    for (nodeID in result.nodeCounts)
                                    {
                                        var percentage = result.nodeCounts[nodeID] / (percentageCalculation.val() === 'nodes' ? result.count : playthroughs.length) * 100;
                                        $('#' + nodeID).append($('<div>', { text: percentage.toFixed(1) + "%" + " (" + result.nodeCounts[nodeID] + "x)", class: 'indicator' }));
                                    }

                                    container.dialog('close');
                                }
                                else if (itemAnalysisType.val() === 'difficulty')
                                {
                                    if (correctNodeSelect === null)
                                    {
                                        Utils.alertDialog(i18next.t('playthroughItemAnalysis:select_exactly_one_node'), 'warning');
                                        return;
                                    }
                                    correctNodeID = correctNodeSelect.val();

                                    result = calculateNodeCounts(playthroughs, childrenOfSelected);
                                    correctCount = correctNodeID in result.nodeCounts ? result.nodeCounts[correctNodeID] : 0;
                                    var difficulty = correctCount / result.count;
                                    resultContainer.empty().append($('<div>', { text: (difficulty * 100).toFixed(2) + "%" }));
                                }
                                else if (itemAnalysisType.val() === 'discrimination')
                                {
                                    if (correctNodeSelect === null)
                                    {
                                        Utils.alertDialog(i18next.t('playthroughItemAnalysis:select_exactly_one_node'), 'warning');
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

                                    var lowestTotalScoreResult = calculateNodeCounts(lowestTotalScorePlaythroughs, childrenOfSelected);
                                    var lowestTotalScoreCorrectCount = correctNodeID in lowestTotalScoreResult.nodeCounts ?
                                        lowestTotalScoreResult.nodeCounts[correctNodeID] : 0;
                                    var highestTotalScoreResult = calculateNodeCounts(highestTotalScorePlaythroughs, childrenOfSelected);
                                    var highestTotalScoreCorrectCount = correctNodeID in highestTotalScoreResult.nodeCounts ?
                                        highestTotalScoreResult.nodeCounts[correctNodeID] : 0;
                                    var discriminationIndex = highestTotalScoreCorrectCount / groupLength - lowestTotalScoreCorrectCount / groupLength;
                                    var getQualificationForTooltip = function()
                                    {
                                        if (discriminationIndex < 0.2)
                                        {
                                            return 'too_low';
                                        }
                                        else if (discriminationIndex > 1 - (1 / childrenOfSelected.length))
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
                                    resultContainer.empty().append(
                                        $('<div>',
                                        {
                                            text: discriminationIndex.toFixed(2)
                                        }),
                                        $('<div>',
                                        {
                                            text: i18next.t('playthroughItemAnalysis:discrimination_index.' + getQualificationForTooltip())
                                        })
                                    );
                                }
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
