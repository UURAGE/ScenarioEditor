/* © Utrecht University and DialogueTrainer */

var Validator;

(function()
{
    "use strict";

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
        var validationReport = []; // an array of objects containing the errors found

        // First save the latest changes.
        Main.applyChanges(Main.selectedElement);
        // Checks whether the scenario has a name
        if(Metadata.container.name === null || Metadata.container.name === "")
        {
            validationReport.push(
            {
                message: i18next.t('validator:no_name'),
                level: 'warning',
                jumpToFunction: function() {
                    Metadata.dialog();
                    $('#scenarioName').focus();
                }
            });
        }

        if (Object.keys(Main.trees).length === 0)
        {
            validationReport.push(
            {
                message: i18next.t('validator:empty_scenario'),
                level: 'error',
                jumpToFunction: null
            });
        }

        var numberOfTreesOnLevels = getNumberOfTreesOnLevels(Main.trees);
        var highestLevel = numberOfTreesOnLevels.length - 1; // note that trees with a high level are low on the editor screen
        var highestLevelHasOneTree = numberOfTreesOnLevels[highestLevel] === 1;
        var highestLevelHasEnd = false;

        $.each(Main.trees, function(treeID, tree)
        {
            var isHighestLevel = tree.level === highestLevel;
            var hasANode = false;
            var startNodes = [];

            $.each(tree.nodes, function(nodeIndex, nodeID)
            {
                if (!nodeID) return true;

                hasANode = true;
                var node = Main.nodes[nodeID];
                var incomingConnections = tree.plumbInstance.getConnections({ target: nodeID });
                var outgoingConnections = tree.plumbInstance.getConnections({ source: nodeID });

                if (incomingConnections.length === 0)
                {
                    startNodes.push(node);

                    // the tree on the first level can start with anything, but the trees following can only start with player nodes
                    if (tree.level !== 0 && node.type !== Main.playerType)
                    {
                        validationReport.push(
                        {
                            message: i18next.t('validator:subject_start_type_error',
                                { subject: tree.subject, type: i18next.t('common:' + Main.nodes[nodeID].type) }),
                            level: 'error',
                            jumpToFunction: function()
                            {
                                Zoom.zoomIn(tree);
                                Main.selectNode(nodeID);
                                var nodeContainer = $("#" + nodeID);
                                if (nodeContainer.length > 0)
                                {
                                    nodeContainer[0].scrollIntoView(false);
                                }
                            }
                        });
                    }
                }

                if (outgoingConnections.length > 0 && node.endNode)
                {
                    validationReport.push(
                    {
                        message: i18next.t('validator:end_with_outgoing_connections', { postProcess: 'sprintf', sprintf: [tree.subject] }),
                        level: 'error',
                        jumpToFunction: function()
                        {
                            Zoom.zoomIn(tree);
                            Main.selectNode(nodeID);
                            var nodeContainer = $("#" + nodeID);
                            if (nodeContainer.length > 0)
                            {
                                nodeContainer[0].scrollIntoView(false);
                            }
                        }
                    });
                }

                if (isHighestLevel)
                {
                    if (node.endNode)
                    {
                        highestLevelHasEnd = true;
                    }
                    else if (outgoingConnections.length === 0 && highestLevelHasOneTree)
                    {
                        // node is a dead end, but not marked as end node
                        validationReport.push(
                        {
                            message: i18next.t('validator:unmarked_end', { postProcess: 'sprintf', sprintf: [tree.subject] }),
                            level: 'error',
                            jumpToFunction: function()
                            {
                                Zoom.zoomIn(tree);
                                Main.selectNode(nodeID);
                                var nodeContainer = $("#" + nodeID);
                                if (nodeContainer.length > 0)
                                {
                                    nodeContainer[0].scrollIntoView(false);
                                }
                            }
                        });
                    }
                }
            });

            if (!hasANode)
            {
                validationReport.push(
                {
                    message: i18next.t('validator:empty_subject', { postProcess: 'sprintf', sprintf: [tree.subject] }),
                    level: 'error',
                    jumpToFunction: function() { Zoom.zoomIn(tree); }
                });
            }

            if (tree.subject === "")
            {
                validationReport.push(
                {
                    message: i18next.t('validator:unnamed_subject'),
                    level: 'info',
                    jumpToFunction: function()
                    {
                        Zoom.zoomOut();
                        Main.selectElement(tree.id);
                        Main.triggerSubjectNameInput(tree.id, false);
                    }
                });
            }

            if (tree.level === 0)
            {
                var startNodeTypes = {};

                $.each(startNodes, function(nodeIndex, node)
                {
                    startNodeTypes[node.type] = true;
                });

                if (Object.keys(startNodeTypes).length > 1)
                {
                    validationReport.push(
                    {
                        message: i18next.t('validator:first_subject_start_type_error', { subject: tree.subject }),
                        level: 'error',
                        jumpToFunction: function()
                        {
                            Zoom.zoomIn(tree);
                            Main.selectElements(startNodes.map(function(node) { return node.id; }));
                            var firstNodeContainer = $("#" + startNodes[0].id);
                            if (firstNodeContainer.length > 0)
                            {
                                firstNodeContainer[0].scrollIntoView(false);
                            }
                        }
                    });
                }
            }
        });

        if (numberOfTreesOnLevels[0] !== 1)
        {
            validationReport.push(
            {
                message: i18next.t('validator:first_layer_count'),
                level: 'error',
                jumpToFunction: null
            });
        }

        if (!highestLevelHasEnd)
        {
            // no single iteration errors, but there is no valid end
            if (numberOfTreesOnLevels.length === 1 && numberOfTreesOnLevels[0] === 1)
            {
                validationReport.push(
                {
                    message: i18next.t('validator:no_ending.single_subject'),
                    level: 'error',
                    jumpToFunction: null
                });

            }
            else
            {
                validationReport.push(
                {
                    message: i18next.t('validator:no_ending.multiple_subjects'),
                    level: 'error',
                    jumpToFunction: null
                });
            }
        }

        return validationReport; // add highest level unmarked end nodes and return
    }

    function getNumberOfTreesOnLevels(trees)
    {
        var treesOnLevels = [];
        $.each(trees, function(index, tree)
        {
            if (typeof treesOnLevels[tree.level] == 'undefined')
                treesOnLevels[tree.level] = 0;

            treesOnLevels[tree.level]++;
        });

        return treesOnLevels;
    }

    function show(errors)
    {
        var hasErrors = false;
        var hasWarningsOrInfo = false;
        $.each(errors, function(index, value)
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
            $.each(errors, function(index, e)
            {
                var row = $('<tr>').addClass('level-' + e.level);
                var error = $('<td>').text(i18next.t('common:' + e.level));
                var message = $('<td>').text(e.message);
                if (e.jumpToFunction) message.on('click', e.jumpToFunction).addClass('clickable');
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
        for(var nodeID in Main.nodes)
        {
            visited[nodeID] = false;
        }

        return testCycleDFS(currentNode, nodeToFind, visited);
    }

    function testCycleDFS(currentNode, nodeToFind, visited)
    {
        if (currentNode === nodeToFind)
            return true;

        visited[currentNode] = true;
        var plumbInstance = Main.getPlumbInstanceByNodeID(currentNode);
        var connections = plumbInstance.getConnections({source: currentNode});
        for (var i = 0; i < connections.length; i++)
            if(!visited[connections[i].targetId] && testCycleDFS(connections[i].targetId, nodeToFind, visited))
                return true;

        return false;
    }

    // Checks if a connection between the node already has been made.
    function testDuplicateConnection(sourceId, targetId)
    {
        var plumbInstance = Main.getPlumbInstanceByNodeID(sourceId);
        return plumbInstance.getConnections({ source: sourceId, target: targetId }).length > 0;
    }


})();
