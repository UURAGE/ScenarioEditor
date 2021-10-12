/* © Utrecht University and DialogueTrainer */

/* exported Validator */
let Validator;

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

    $(function()
    {
        // Event handlers.
        $("#validation").on('click', function()
        {
            const errors = validate();
            show(errors);
        });
    });

    function validate()
    {
        const validationReport = []; // An array of objects containing the errors found

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

        const specialProperties = ['allowInterleaveNode', 'allowDialogueEndNode'];

        const pushIntoSubArray = function(container, name, element)
        {
            if (!container[name]) container[name] = [];
            container[name].push(element);
        };
        const createJumpToTrees = function(trees)
        {
            return function()
            {
                Zoom.zoomOut();
                Main.selectElements(trees.map(function(tree) { return tree.id; }));
            };
        };
        const createJumpToNodes = function(tree, nodeIDs)
        {
            return function()
            {
                Zoom.zoomIn(tree);
                Main.selectElements(nodeIDs);
                const firstNodeContainer = $("#" + nodeIDs[0]);
                if (firstNodeContainer.length > 0)
                {
                    firstNodeContainer[0].scrollIntoView(false);
                }
            };
        };

        const interleaves = Main.getInterleaves();
        const hasSingleTree = interleaves.length === 1 && interleaves[0].length === 1;

        let previousInterleave = null;
        let previousInterleaveStartNodeType = null;
        let previousInterleaveHasOptionalTree = false;
        let previousInterleaveSpecialNodesByChildTypeByProperty = null;

        interleaves.forEach(function(interleave)
        {
            let interleaveHasOptionalTree = false;
            const interleaveSpecialNodesByChildTypeByProperty = {};
            specialProperties.forEach(function(property) { interleaveSpecialNodesByChildTypeByProperty[property] = {}; });
            const interleaveTreesByStartNodeType = {};
            interleave.forEach(function(tree)
            {
                if (tree.optional) interleaveHasOptionalTree = true;

                let treeHasANode = false;
                let treeHasEndNodeOrAllowDialogueEndNode = false;
                const treeStartNodesByType = {};
                tree.nodes.forEach(function(nodeID)
                {
                    if (!nodeID) return true;

                    treeHasANode = true;
                    const node = Main.nodes[nodeID];
                    const incomingConnections = tree.plumbInstance.getConnections({ target: nodeID });
                    const outgoingConnections = tree.plumbInstance.getConnections({ source: nodeID });

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
                        const childType = Main.nodes[outgoingConnections[0].targetId].type;
                        specialProperties.forEach(function(property)
                        {
                            if (node[property])
                            {
                                pushIntoSubArray(interleaveSpecialNodesByChildTypeByProperty[property], childType, node);
                            }
                        });
                    }

                    if (node.endNode || node.allowDialogueEndNode)
                    {
                        treeHasEndNodeOrAllowDialogueEndNode = true;
                    }
                    else if (outgoingConnections.length === 0)
                    {
                        // Node is a dead end, but not marked as end or allowDialogueEnd
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

                const treeStartNodeTypes = Object.keys(treeStartNodesByType);
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

                if (!treeHasEndNodeOrAllowDialogueEndNode)
                {
                    if (hasSingleTree)
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
                            message: i18next.t('validator:no_ending.multiple_subjects', { subject: tree.subject }),
                            level: 'warning',
                            jumpToFunctions: [ function() { Zoom.zoomIn(tree); } ]
                        });
                    }
                }
            });

            let interleaveStartNodeType = null;
            const interleaveStartNodeTypes = Object.keys(interleaveTreesByStartNodeType);

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
                        const specialNodesByChildType = interleaveSpecialNodesByChildTypeByProperty[property];
                        for (const specialNodeChildType in specialNodesByChildType)
                        {
                            if (specialNodeChildType === interleaveStartNodeType) continue;
                            specialNodesByChildType[specialNodeChildType].forEach(function(badNode)
                            {
                                const badTree = Main.trees[badNode.parent];
                                validationReport.push(
                                {
                                    message: i18next.t('validator:special_node_layer_start_type_error',
                                    {
                                        layerNumber: interleave[0].topPos + 1,
                                        type: i18next.t('common:' + interleaveStartNodeType).toLocaleLowerCase(),
                                        property: i18next.t('common:special_node.' + property),
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
                    const allowDialogueEndNodesByChildType =
                        previousInterleaveSpecialNodesByChildTypeByProperty.allowDialogueEndNode;
                    for (const allowDialogueEndNodeChildType in allowDialogueEndNodesByChildType)
                    {
                        if (allowDialogueEndNodeChildType === interleaveStartNodeType) continue;
                        allowDialogueEndNodesByChildType[allowDialogueEndNodeChildType].forEach(function(badNode)
                        {
                            const badTree = Main.trees[badNode.parent];
                            validationReport.push(
                            {
                                message: i18next.t('validator:special_node_previous_layer_start_type_error',
                                {
                                    previousLayerNumber: previousInterleave[0].topPos + 1,
                                    thisLayerNumber: interleave[0].topPos + 1,
                                    property: i18next.t('common:special_node.allowDialogueEndNode'),
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

        return validationReport;
    }

    function show(errors)
    {
        TabDock.close();

        let hasErrors = false;
        let hasWarningsOrInfo = false;
        errors.forEach(function(value)
        {
            hasErrors = hasErrors || value.level === 'error';
            hasWarningsOrInfo = hasWarningsOrInfo || value.level === 'warning' || value.level === 'info';
        });

        if (!hasErrors && !hasWarningsOrInfo)
        {
            $('#validationReport').append($('<p>').addClass('no-problems').text(i18next.t('validator:no_problems')));
        }
        else
        {
            const table = $('<table>');
            errors.forEach(function(e)
            {
                const row = $('<tr>').addClass('level-' + e.level);
                const error = $('<td>').append($('<span>', { class: "badge", text: i18next.t('common:' + e.level) }));
                const message = $('<td>').html(e.message);
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
        $('#validationReport').show();
        TabDock.closeHandler = function()
        {
            $('#validationReport').empty();
        };
        $('#tabDock')
            .find('.title').text(i18next.t('validator:validator_title')).end()
            .find('.controls').empty().end()
            .show();
        $("#main").focus();
    }

    // Checks if there is a cycle in the graph.
    function testCycle(currentNode, nodeToFind)
    {
        const visited = {};
        for (const nodeID in Main.nodes)
        {
            visited[nodeID] = false;
        }

        return testCycleDFS(currentNode, nodeToFind, visited);
    }

    function testCycleDFS(currentNode, nodeToFind, visited)
    {
        if (currentNode === nodeToFind) return true;

        visited[currentNode] = true;
        const plumbInstance = Main.getPlumbInstanceByNodeID(currentNode);
        const connections = plumbInstance.getConnections({ source: currentNode });
        for (let i = 0; i < connections.length; i++)
        {
            if (!visited[connections[i].targetId] && testCycleDFS(connections[i].targetId, nodeToFind, visited)) return true;
        }

        return false;
    }

    // Checks if a connection between the node already has been made.
    function testDuplicateConnection(sourceId, targetId)
    {
        const plumbInstance = Main.getPlumbInstanceByNodeID(sourceId);
        return plumbInstance.getConnections({ source: sourceId, target: targetId }).length > 0;
    }
})();
