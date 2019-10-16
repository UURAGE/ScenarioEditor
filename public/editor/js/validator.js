/* © Utrecht University and DialogueTrainer */

/* exported Validator */
var Validator;

(function()
{
    "use strict";

    // eslint-disable-next-line no-global-assign
    Validator =
    {
        validate: validate,
        show: show,
        testCycle: testCycle,
        testDuplicateConnection: testDuplicateConnection
    };

    $(document).ready(function()
    {
        // Event handlers.
        $("#validation").on('click', function()
        {
            var errors = validate();
            show(errors);
        });
    });

    function validate()
    {
        var validationReport = []; // An array of objects containing the errors found

        // First save the latest changes.
        Main.applyChanges(Main.selectedElement);
        // Checks whether the scenario has a name
        if (Metadata.container.name === null || Metadata.container.name === "")
        {
            validationReport.push(
            {
                message: i18next.t('validator:no_name'),
                level: 'warning',
                jumpToFunctions:
                [
                    function()
                    {
                        Metadata.dialog();
                        $('#scenarioName').focus();
                    }
                ]
            });
        }

        if (Object.keys(Main.trees).length === 0)
        {
            validationReport.push(
            {
                message: i18next.t('validator:empty_scenario'),
                level: 'error',
                jumpToFunctions: []
            });
            return validationReport;
        }

        var specialProperties = ['allowInterleaveNode', 'allowDialogueEndNode'];

        var pushIntoSubArray = function(container, name, element)
        {
            if (!container[name]) container[name] = [];
            container[name].push(element);
        };
        var createJumpToTrees = function(trees)
        {
            return function()
            {
                Zoom.zoomOut();
                Main.selectElements(trees.map(function(tree) { return tree.id; }));
            };
        };
        var createJumpToNodes = function(tree, nodeIDs)
        {
            return function()
            {
                Zoom.zoomIn(tree);
                Main.selectElements(nodeIDs);
                var firstNodeContainer = $("#" + nodeIDs[0]);
                if (firstNodeContainer.length > 0)
                {
                    firstNodeContainer[0].scrollIntoView(false);
                }
            };
        };

        var interleaves = Main.getInterleaves();
        var lastInterleaveIndex = interleaves.length - 1;
        var lastInterleaveHasOneTree = interleaves[lastInterleaveIndex].length === 1;
        var lastInterleaveHasEnd = false;

        var previousInterleave = null;
        var previousInterleaveStartNodeType = null;
        var previousInterleaveHasOptionalTree = false;
        var previousInterleaveSpecialNodesByChildTypeByProperty = null;

        interleaves.forEach(function(interleave, interleaveIndex)
        {
            var isLastInterleave = interleaveIndex === lastInterleaveIndex;

            var interleaveHasOptionalTree = false;
            var interleaveSpecialNodesByChildTypeByProperty = {};
            specialProperties.forEach(function(property) { interleaveSpecialNodesByChildTypeByProperty[property] = {}; });
            var interleaveTreesByStartNodeType = {};
            interleave.forEach(function(tree)
            {
                if (tree.optional) interleaveHasOptionalTree = true;

                var treeHasANode = false;
                var treeStartNodesByType = {};
                tree.nodes.forEach(function(nodeID)
                {
                    if (!nodeID) return true;

                    treeHasANode = true;
                    var node = Main.nodes[nodeID];
                    var incomingConnections = tree.plumbInstance.getConnections({ target: nodeID });
                    var outgoingConnections = tree.plumbInstance.getConnections({ source: nodeID });

                    if (incomingConnections.length === 0) pushIntoSubArray(treeStartNodesByType, node.type, node);

                    if (outgoingConnections.length > 0)
                    {
                        if (node.endNode)
                        {
                            validationReport.push(
                            {
                                message: i18next.t('validator:end_with_outgoing_connections', { subject: tree.subject }),
                                level: 'error',
                                jumpToFunctions:
                                [
                                    function()
                                    {
                                        Zoom.zoomIn(tree);
                                    },
                                    createJumpToNodes(tree, [nodeID])
                                ]
                            });
                        }

                        // Type equality of siblings is enforced when attempting to create a connection
                        var childType = Main.nodes[outgoingConnections[0].targetId].type;
                        specialProperties.forEach(function(property)
                        {
                            if (node[property])
                            {
                                pushIntoSubArray(interleaveSpecialNodesByChildTypeByProperty[property], childType, node);
                            }
                        });
                    }

                    if (isLastInterleave)
                    {
                        if (node.endNode)
                        {
                            lastInterleaveHasEnd = true;
                        }
                        else if (outgoingConnections.length === 0 && lastInterleaveHasOneTree)
                        {
                            // Node is a dead end, but not marked as end node
                            validationReport.push(
                            {
                                message: i18next.t('validator:unmarked_end', { subject: tree.subject }),
                                level: 'warning',
                                jumpToFunctions:
                                [
                                    function() { Zoom.zoomIn(tree); },
                                    createJumpToNodes(tree, [nodeID])
                                ]
                            });
                        }
                    }
                });

                if (tree.subject === "")
                {
                    validationReport.push(
                    {
                        message: i18next.t('validator:unnamed_subject'),
                        level: 'info',
                        jumpToFunctions:
                        [
                            function()
                            {
                                Zoom.zoomOut();
                                Main.selectElement(tree.id);
                                Main.triggerSubjectNameInput(tree.id, false);
                            }
                        ]
                    });
                }

                if (!treeHasANode)
                {
                    validationReport.push(
                    {
                        message: i18next.t('validator:empty_subject', { subject: tree.subject }),
                        level: 'error',
                        jumpToFunctions: [ function() { Zoom.zoomIn(tree); } ]
                    });
                    return;
                }

                var treeStartNodeTypes = Object.keys(treeStartNodesByType);
                if (treeStartNodeTypes.length > 1)
                {
                    validationReport.push(
                    {
                        message: i18next.t('validator:subject_start_type_error',
                        {
                            subject: tree.subject,
                            types: treeStartNodeTypes
                                .map(function(nodeType)
                                {
                                    return '<a>' + i18next.t('common:' + nodeType).toLowerCase() + '</a>';
                                })
                                .join(', ')
                        }),
                        level: 'error',
                        jumpToFunctions: [function() { Zoom.zoomIn(tree); }]
                            .concat($.map(treeStartNodesByType, function(startNodes)
                            {
                                return createJumpToNodes(tree, startNodes.map(function(node) { return node.id; }));
                            }))
                    });
                }
                else if (treeStartNodeTypes.length === 1)
                {
                    pushIntoSubArray(interleaveTreesByStartNodeType, treeStartNodeTypes[0], tree);
                }
            });

            var interleaveStartNodeType = null;
            var interleaveStartNodeTypes = Object.keys(interleaveTreesByStartNodeType);

            if (interleaveStartNodeTypes.length > 1)
            {
                validationReport.push(
                {
                    message: i18next.t('validator:layer_start_type_error',
                    {
                        layerNumber: interleave[0].topPos + 1,
                        types: interleaveStartNodeTypes
                            .map(function(nodeType)
                            {
                                return '<a>' + i18next.t('common:' + nodeType).toLowerCase() + '</a>';
                            })
                            .join(', ')
                    }),
                    level: 'error',
                    jumpToFunctions: [createJumpToTrees(interleave)]
                        .concat($.map(interleaveTreesByStartNodeType, createJumpToTrees))
                });
            }
            else if (interleaveStartNodeTypes.length === 1)
            {
                interleaveStartNodeType = interleaveStartNodeTypes[0];

                if (previousInterleaveHasOptionalTree &&
                    previousInterleaveStartNodeType !== null &&
                    interleaveStartNodeType !== previousInterleaveStartNodeType)
                {
                    validationReport.push(
                    {
                        message: i18next.t('validator:optional_layer_start_type_error',
                        {
                            previousLayerNumber: previousInterleave[0].topPos + 1,
                            thisLayerNumber: interleave[0].topPos + 1,
                            types: [previousInterleaveStartNodeType, interleaveStartNodeType]
                                .map(function(nodeType)
                                {
                                    return '<a>' + i18next.t('common:' + nodeType).toLowerCase() + '</a>';
                                })
                                .join(', ')
                        }),
                        level: 'error',
                        jumpToFunctions:
                        [
                            createJumpToTrees(previousInterleave.filter(function(tree) { return tree.optional; })),
                            createJumpToTrees(interleave),
                            createJumpToTrees(previousInterleave),
                            createJumpToTrees(interleave)
                        ]
                    });
                }

                if (interleave.length > 1)
                {
                    specialProperties.map(function(property)
                    {
                        var specialNodesByChildType = interleaveSpecialNodesByChildTypeByProperty[property];
                        for (var specialNodeChildType in specialNodesByChildType)
                        {
                            if (specialNodeChildType === interleaveStartNodeType) continue;
                            specialNodesByChildType[specialNodeChildType].forEach(function(badNode)
                            {
                                var badTree = Main.trees[badNode.parent];
                                validationReport.push(
                                {
                                    message: i18next.t('validator:special_node_layer_start_type_error',
                                    {
                                        layerNumber: interleave[0].topPos + 1,
                                        type: i18next.t('common:' + interleaveStartNodeType).toLocaleLowerCase(),
                                        property: i18next.t('validator:special_node.' + property),
                                        otherType: i18next.t('common:' + specialNodeChildType).toLocaleLowerCase()
                                    }),
                                    level: 'error',
                                    jumpToFunctions:
                                    [
                                        createJumpToTrees(interleave),
                                        createJumpToNodes(badTree, [badNode.id]),
                                        createJumpToNodes(badTree,
                                            badTree.plumbInstance.getConnections({ source: badNode.id })
                                                .map(function(connection) { return connection.targetId; }))
                                    ]
                                });
                            });
                        }
                    });
                }

                if (previousInterleaveSpecialNodesByChildTypeByProperty !== null)
                {
                    var allowDialogueEndNodesByChildType =
                        previousInterleaveSpecialNodesByChildTypeByProperty.allowDialogueEndNode;
                    for (var allowDialogueEndNodeChildType in allowDialogueEndNodesByChildType)
                    {
                        if (allowDialogueEndNodeChildType === interleaveStartNodeType) continue;
                        allowDialogueEndNodesByChildType[allowDialogueEndNodeChildType].forEach(function(badNode)
                        {
                            var badTree = Main.trees[badNode.parent];
                            validationReport.push(
                            {
                                message: i18next.t('validator:special_node_previous_layer_start_type_error',
                                {
                                    previousLayerNumber: previousInterleave[0].topPos + 1,
                                    thisLayerNumber: interleave[0].topPos + 1,
                                    property: i18next.t('validator:special_node.allowDialogueEndNode'),
                                    type: i18next.t('common:' + interleaveStartNodeType).toLocaleLowerCase(),
                                    otherType: i18next.t('common:' + allowDialogueEndNodeChildType).toLocaleLowerCase()
                                }),
                                level: 'error',
                                jumpToFunctions:
                                [
                                    createJumpToTrees(interleave),
                                    createJumpToTrees(previousInterleave),
                                    createJumpToNodes(badTree, [badNode.id]),
                                    createJumpToNodes(badTree,
                                        badTree.plumbInstance.getConnections({ source: badNode.id })
                                            .map(function(connection) { return connection.targetId; }))
                                ]
                            });
                        });
                    }
                }
            }

            previousInterleave = interleave;
            previousInterleaveStartNodeType = interleaveStartNodeType;
            previousInterleaveHasOptionalTree = interleaveHasOptionalTree;
            previousInterleaveSpecialNodesByChildTypeByProperty = interleaveSpecialNodesByChildTypeByProperty;
        });

        if (!lastInterleaveHasEnd)
        {
            if (interleaves.length === 1 && interleaves[0].length === 1)
            {
                validationReport.push(
                {
                    message: i18next.t('validator:no_ending.single_subject'),
                    level: 'warning',
                    jumpToFunctions: []
                });
            }
            else
            {
                validationReport.push(
                {
                    message: i18next.t('validator:no_ending.multiple_subjects'),
                    level: 'warning',
                    jumpToFunctions: [createJumpToTrees(interleaves[lastInterleaveIndex])]
                });
            }
        }

        return validationReport;
    }

    function show(errors)
    {
        var hasErrors = false;
        var hasWarningsOrInfo = false;
        errors.forEach(function(value)
        {
            hasErrors = hasErrors || value.level === 'error';
            hasWarningsOrInfo = hasWarningsOrInfo || value.level === 'warning' || value.level === 'info';
        });

        $('#validationReport').empty();
        if (!hasErrors && !hasWarningsOrInfo)
        {
            $('#validationReport').append($('<p>').addClass('no-problems').text(i18next.t('validator:no_problems')));
        }
        else
        {
            var table = $('<table>');
            errors.forEach(function(e)
            {
                var row = $('<tr>').addClass('level-' + e.level);
                var error = $('<td>').append($('<span>', { class: "badge", text: i18next.t('common:' + e.level) }));
                var message = $('<td>').html(e.message);
                message.find('a').each(function(index, linkEl)
                {
                    $(linkEl).addClass('clickable').on('click', function()
                    {
                        e.jumpToFunctions[index]();
                        return false;
                    });
                });
                row.append(error).append(message);
                table.append(row);
            });
            $('#validationReport').append(table);
        }
        $('#draftScreen').hide();
        $('#validationReport').show();
        $('#tabDock').show();
        $("#main").focus();
    }

    // Checks if there is a cycle in the graph.
    function testCycle(currentNode, nodeToFind)
    {
        var visited = {};
        for (var nodeID in Main.nodes)
        {
            visited[nodeID] = false;
        }

        return testCycleDFS(currentNode, nodeToFind, visited);
    }

    function testCycleDFS(currentNode, nodeToFind, visited)
    {
        if (currentNode === nodeToFind) return true;

        visited[currentNode] = true;
        var plumbInstance = Main.getPlumbInstanceByNodeID(currentNode);
        var connections = plumbInstance.getConnections({ source: currentNode });
        for (var i = 0; i < connections.length; i++)
        {
            if (!visited[connections[i].targetId] && testCycleDFS(connections[i].targetId, nodeToFind, visited)) return true;
        }

        return false;
    }

    // Checks if a connection between the node already has been made.
    function testDuplicateConnection(sourceId, targetId)
    {
        var plumbInstance = Main.getPlumbInstanceByNodeID(sourceId);
        return plumbInstance.getConnections({ source: sourceId, target: targetId }).length > 0;
    }
})();
