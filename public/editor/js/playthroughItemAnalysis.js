// © DialogueTrainer

(function()
{
    "use strict";

    $(function()
    {
        $("#togglePlaythroughsScreen").on('click', function()
        {
            const calculateNodeCounts = function(playthroughs, nodeIDs)
            {
                const nodeCounts = {};
                let count = 0;
                playthroughs.forEach(function(playthrough)
                {
                    playthrough.statements.forEach(function(statement)
                    {
                        const nodeID = statement.id.replace(/^(.+?\.){3}/, '').replace(/\./g, '_');
                        if (nodeID in Main.nodes &&
                            (nodeIDs.length === 0 || nodeIDs.includes(nodeID)))
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

            const container = $('<div>');

            container.append($('<p>', { text: i18next.t('playthroughItemAnalysis:experimental_warning'), class: 'warning alert' }));

            const fileInputContainer = $('<div>', { class: 'flexbox gap-2' }).appendTo(container);
            fileInputContainer.append($('<label>', { text: i18next.t('playthroughItemAnalysis:import_playthroughs') + ' ' }));
            const fileInput = $('<input>', { type: 'file', accept: 'application/json' }).appendTo(fileInputContainer);

            const itemAnalysisTypeContainer = $('<div>', { class: 'flexbox gap-2' }).appendTo(container);
            itemAnalysisTypeContainer.append($('<label>', { text: i18next.t('common:type') + ' ' }));
            const itemAnalysisType = $('<select>').appendTo(itemAnalysisTypeContainer);
            itemAnalysisType.append($('<option>', { value: 'frequency', text: i18next.t('playthroughItemAnalysis:frequency') }));
            itemAnalysisType.append($('<option>', { value: 'difficulty', text: i18next.t('playthroughItemAnalysis:difficulty') }));
            itemAnalysisType.append($('<option>', { value: 'discrimination', text: i18next.t('playthroughItemAnalysis:discrimination') }));

            $('<hr>', { class: 'divider' }).appendTo(container);

            const detailsContainer = $('<div>', { class: 'flexColumn gap-2' }).appendTo(container);

            let percentageCalculation = null;
            const addPercentageCalculationContainer = function()
            {
                const scope = i18next.t('playthroughItemAnalysis:percentage_calculation_scope.' + (Main.selectedElements.length > 0 ? 'selected' : 'all'));
                percentageCalculation = $('<select>', { class: 'fullWidth' })
                    .append(['playthroughs', 'nodes'].map((kind) => $('<option>', {
                        value: kind, text: i18next.t('playthroughItemAnalysis:percentage_calculation_kind.' + kind, { scope: scope })
                    })));
                detailsContainer.append(
                    $('<p>', {
                        class: 'label',
                        text: `${i18next.t('playthroughItemAnalysis:percentage_calculation')}
                        ${i18next.t('playthroughItemAnalysis:number_of_node_occurrences')}
                        ${i18next.t('playthroughItemAnalysis:divided_by')}
                        ${i18next.t('playthroughItemAnalysis:number_of')}` })
                ).append(percentageCalculation);
            };

            let correctNodeSelect = null;
            let resultContainer = null;
            let childrenOfSelected = null;
            const addCorrectNodeSelect = function()
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
                    const node = Main.nodes[Main.selectedElement];
                    const issues =
                    {
                        allowInterleave: node.allowInterleaveNode,
                        allowDialogueEnd: node.allowDialogueEndNode,
                        preconditions: childrenOfSelected.some(function(nodeID) { return Main.nodes[nodeID].preconditions; })
                    };
                    const presentIssues = Object.keys(issues).filter(function(issue) { return issues[issue]; });
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
                subtitle: i18next.t('playthroughItemAnalysis:explanation'),
                width: Utils.fitDialogWidthToWindow(Utils.dialogSizes.small),
                modal: true,
                closeOnBackdropClick: true,
                buttons: [
                    {
                        text: i18next.t('common:confirm'),
                        class: 'col-primary roundedPill medium',
                        click: function()
                        {
                            if (fileInput[0].files.length === 0) return;
                            const reader = new FileReader();
                            reader.onerror = function()
                            {
                                Utils.alertDialog('Error reading file', 'error');
                            };
                            reader.onload = function(e)
                            {
                                const playthroughs = JSON.parse(e.target.result);

                                let correctNodeID, correctCount;
                                for (const nodeID in Main.nodes)
                                {
                                    $('#' + nodeID).find('.indicator').remove();
                                }

                                let result;
                                if (itemAnalysisType.val() === 'frequency')
                                {
                                    result = calculateNodeCounts(playthroughs, Main.selectedElements);

                                    for (const nodeID in result.nodeCounts)
                                    {
                                        const percentage = result.nodeCounts[nodeID] / (percentageCalculation.val() === 'nodes' ? result.count : playthroughs.length) * 100;
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
                                    const difficulty = correctCount / result.count;
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

                                    const playthroughsWithTotalScore = playthroughs.filter(function(playthrough)
                                    {
                                        return playthrough.totalScore !== null || playthrough.totalScore !== undefined;
                                    });
                                    if (playthroughsWithTotalScore.length < 4)
                                    {
                                        Utils.alertDialog(i18next.t('playthroughItemAnalysis:not_enough_playthroughs'), 'warning');
                                        return;
                                    }

                                    const sortedPlaythroughs = playthroughsWithTotalScore.sort(function(a, b)
                                    {
                                        return a.totalScore - b.totalScore;
                                    });
                                    const groupLength = Math.round(sortedPlaythroughs.length / 4);
                                    const lowestTotalScorePlaythroughs = sortedPlaythroughs.slice(0, groupLength);
                                    const highestTotalScorePlaythroughs = sortedPlaythroughs.slice(-groupLength);

                                    const lowestTotalScoreResult = calculateNodeCounts(lowestTotalScorePlaythroughs, childrenOfSelected);
                                    const lowestTotalScoreCorrectCount = correctNodeID in lowestTotalScoreResult.nodeCounts ?
                                        lowestTotalScoreResult.nodeCounts[correctNodeID] : 0;
                                    const highestTotalScoreResult = calculateNodeCounts(highestTotalScorePlaythroughs, childrenOfSelected);
                                    const highestTotalScoreCorrectCount = correctNodeID in highestTotalScoreResult.nodeCounts ?
                                        highestTotalScoreResult.nodeCounts[correctNodeID] : 0;
                                    const discriminationIndex = highestTotalScoreCorrectCount / groupLength - lowestTotalScoreCorrectCount / groupLength;
                                    const lowerThreshold = 0.2;
                                    const higherThreshold = 1 - (1 / childrenOfSelected.length);
                                    const fairThreshold = 0.3;
                                    const getQualificationForTooltip = function()
                                    {
                                        if (discriminationIndex < lowerThreshold)
                                        {
                                            return 'too_low';
                                        }
                                        else if (discriminationIndex > higherThreshold)
                                        {
                                            return 'too_high';
                                        }
                                        else if (discriminationIndex > fairThreshold)
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
                                            text: i18next.t('playthroughItemAnalysis:discrimination_index.' + getQualificationForTooltip(),
                                                {
                                                    lowerThreshold: lowerThreshold.toFixed(2),
                                                    higherThreshold: higherThreshold.toFixed(2),
                                                    fairThreshold: fairThreshold.toFixed(2)
                                                })
                                        })
                                    );
                                }
                            };
                            reader.readAsText(fileInput[0].files[0]);
                        }
                    },
                    {
                        text: i18next.t('common:close'),
                        class: 'col-dim roundedPill medium',
                        click: function()
                        {
                            $(this).dialog('close');
                        }
                    }
                ],
            });
        });
    });
})();
