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
        //var unmarkedEndNodes = []; // nodes without children not marked as end node

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
                jumpToFunction: function() { }
            });
        }

        var numberOfTreesOnLevels = getNumberOfTreesOnLevels(Main.trees);
        var highestLevel = numberOfTreesOnLevels.length - 1; // note that trees with a high level are low on the editor screen
        var hasValidEnd = false; // if the highest level has an end node this becomes true
        var highestLevelHasEnd = false;

        $.each(Main.trees, function(id, tree)
        {
            // Check whether there is exactly one node without parents.
            var startNodeIDs = Main.getStartNodeIDs(tree);

            if (startNodeIDs.length === 0)
            {
                validationReport.push(
                {
                    message: i18next.t('validator:empty_subject', { postProcess: 'sprintf', sprintf: [tree.subject] }),
                    level: 'error',
                    jumpToFunction: function() { Zoom.zoomIn(tree); }
                });
            }
            else
            {
                var firstStartNodeType = Main.nodes[startNodeIDs[0]].type;
                $.each(startNodeIDs, function(index, startNodeID)
                {
                    // the tree on the first level can start with anything, but the trees following can only start with player nodes
                    if (tree.level !== 0 && Main.nodes[startNodeID].type !== Main.playerType)
                    {
                        validationReport.push(
                        {
                            message: i18next.t('validator:subject_start_type_error',
                                { subject: tree.subject, type: i18next.t('common:' + Main.nodes[startNodeID].type) }),
                            level: 'error',
                            jumpToFunction: function()
                            {
                                Zoom.zoomIn(tree);
                                Main.selectNode(startNodeID);
                            }
                        });
                    }

                    if (tree.level === 0 && Main.nodes[startNodeID].type !== firstStartNodeType)
                    {
                        validationReport.push(
                        {
                            message: i18next.t('validator:first_subject_start_type_error', { subject: tree.subject }),
                            level: 'error',
                            jumpToFunction: function()
                            {
                                Zoom.zoomIn(tree);
                                Main.selectNode(startNodeID);
                            }
                        });
                    }
                });
            }

            // gets all nodes marked as end node
            var markedEnds = findAllMarkedEnds(tree);

            $.each(markedEnds, function(index, nodeID)
            {
                var connections = tree.plumbInstance.getConnections({ source: nodeID });
                if (connections.length > 0)
                {
                    validationReport.push(
                    {
                        message: i18next.t('validator:end_with_outgoing_connections', { postProcess: 'sprintf', sprintf: [tree.subject] }),
                        level: 'error',
                        jumpToFunction: function() {
                            Zoom.zoomIn(tree);
                            Main.selectNode(nodeID);
                        }
                    });
                }
                else if (tree.level === highestLevel)
                {
                    hasValidEnd = true;
                }
            });

            if (tree.level === highestLevel)
            {
                // gets all nodes without children from the tree
                var deadEnds = findAllDeadEnds(tree);

                if (numberOfTreesOnLevels[tree.level] === 1)
                {
                    $.each(deadEnds, function(index, nodeID)
                    {
                        if (markedEnds.indexOf(nodeID) === -1)
                        { // node is a dead end, but not marked as end node
                            validationReport.push(
                            {
                                message: i18next.t('validator:unmarked_end', { postProcess: 'sprintf', sprintf: [tree.subject] }),
                                level: 'error',
                                jumpToFunction: function() {
                                    Zoom.zoomIn(tree);
                                    Main.selectNode(nodeID);
                                }
                            });
                        }
                        else
                        {
                            highestLevelHasEnd = true;
                        }
                    });
                }
                else
                {
                    $.each(deadEnds, function(index, nodeID)
                    {
                        if (markedEnds.indexOf(nodeID) !== -1)
                        {
                            highestLevelHasEnd = true;
                        }
                    });
                }
            }

            if (tree.subject === "")
            {
                validationReport.push(
                {
                    message: i18next.t('validator:unnamed_subject'),
                    level: 'info',
                    jumpToFunction: function() { Main.selectElement(tree.id); }
                });
            }
        });

        if(numberOfTreesOnLevels[0] !== 1)
        {
            validationReport.push(
            {
                message: i18next.t('validator:first_layer_count'),
                level: 'error',
                jumpToFunction: function() { }
            });
        }

        if(!highestLevelHasEnd)
        { // no single iteration errors, but there is no valid end
            validationReport.push(
            {
                message: i18next.t('validator:no_ending'),
                level: 'error',
                jumpToFunction: function() { }
            });
        }

        if(!hasValidEnd)
        { // no single iteration errors, but there is no valid end
            validationReport.push(
            {
                message: i18next.t('validator:no_valid_ending'),
                level: 'error',
                jumpToFunction: function() { }
            });
        }

        return validationReport; // add highest level unmarked end nodes and return
    }



    function findAllDeadEnds(tree)
    { // finds all nodes without children
        var result = [];

        $.each(tree.nodes, function(index, nodeID) {
            if(!nodeID) {
                return true;
            }

            var connections = tree.plumbInstance.getConnections({ source: nodeID });
            if(connections.length === 0) {
                result.push(nodeID);
            }
        });

        return result;
    }

    function findAllMarkedEnds(tree)
    { // find all nodes that are marked as end
        var result = [];
        $.each(tree.nodes, function(index, nodeID) {
            if(!nodeID) {
                return true;
            }

            if(Main.nodes[nodeID].endNode) {
                result.push(nodeID);
            }
        });

        return result;
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
                var error = $('<td>').text(i18next.t('validator:' + e.level));
                var message = $('<td>').append($('<span>').text(e.message).on('click', e.jumpToFunction).css('cursor', 'pointer'));
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
