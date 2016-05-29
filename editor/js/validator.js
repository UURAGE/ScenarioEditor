/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

var Validator;

(function()
{
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
        if(Metadata.metaObject.name === null || Metadata.metaObject.name === "")
        {
            validationReport.push(
            {
                message: LanguageManager.sLang("edt_validator_no_name"),
                level: 'warning',
                jumpToFunction: function() {
                    Metadata.metadataDialog();
                    $('#scenarioName').focus();
                }
            });
        }

        if (Object.keys(Main.trees).length === 0)
        {
            validationReport.push(
            {
                message: LanguageManager.sLang("edt_validator_empty_scenario"),
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
            var startNodeIDs = Save.getStartNodeIDs(tree); //defined in save.js

            $.each(startNodeIDs, function(index, startNodeID)
            {
                if(startNodeID === -1)
                {
                    validationReport.push(
                    {
                        message: LanguageManager.fLang("edt_validator_empty_subject", [tree.subject]),
                        level: 'error',
                        jumpToFunction: function() { Zoom.zoomIn(tree); }
                    });
                }
                // the tree on the first level can start with anything, but the trees following can only start with player nodes
                else if(tree.level !== 0 && Main.nodes[startNodeID].type !== Main.playerType)
                {
                    if (Main.nodes[startNodeID].type === Main.computerType)
                    {
                        validationReport.push(
                        {
                            message: LanguageManager.fLang("edt_validator_subject_start_type_error_computer", [tree.subject]),
                            level: 'error',
                            jumpToFunction: function() { Zoom.zoomIn(tree); }
                        });
                    }
                    else
                    {
                        validationReport.push(
                        {
                            message: LanguageManager.fLang("edt_validator_subject_start_type_error_situation", [tree.subject]),
                            level: 'error',
                            jumpToFunction: function() { Zoom.zoomIn(tree); }
                        });
                    }
                }
            });

            // gets all nodes marked as end node
            var markedEnds = findAllMarkedEnds(tree);

            $.each(markedEnds, function(index, nodeID)
            {
                var connections = tree.plumbInstance.getConnections({ source: nodeID });
                if (connections.length > 0)
                {
                    validationReport.push(
                    {
                        message: LanguageManager.fLang("edt_validator_end_outgoing_connections", [tree.subject]),
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
                                message: LanguageManager.fLang("edt_validator_unmarked_end", [tree.subject]),
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
                    message: LanguageManager.sLang("edt_validator_unnamed_subject"),
                    level: 'info',
                    jumpToFunction: function() { Main.selectTree(tree.id); }
                });
            }
        });

        if(numberOfTreesOnLevels[0] !== 1)
        {
            validationReport.push(
            {
                message: LanguageManager.sLang("edt_validator_first_layer_count"),
                level: 'error',
                jumpToFunction: function() { }
            });
        }

        if(!highestLevelHasEnd)
        { // no single iteration errors, but there is no valid end
            validationReport.push(
            {
                message: LanguageManager.sLang("edt_validator_no_ending"),
                level: 'error',
                jumpToFunction: function() { }
            });
        }

        if(!hasValidEnd)
        { // no single iteration errors, but there is no valid end
            validationReport.push(
            {
                message: LanguageManager.sLang("edt_validator_no_valid_ending"),
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
        $.each(errors, function(index, value)
        {
            hasErrors = hasErrors || (value.level === 'error');
        });

        if (!hasErrors)
        {
            $('#validationReport table').hide().children()
                .remove();
            $('#validationReport span').remove();
            $('#validationReport br').remove();
            $('#validationReport').append($('<span>').text(LanguageManager.sLang("edt_validator_no_problems")).css('color', 'green')).append($('<br>')).append($('<br>'));
        }
        else
        {
            $('#validationReport span').remove();
            $('#validationReport table').show().children().remove();
            $.each(errors, function(index, e)
            {
                var row = $('<tr>').css('color', ParameterValues.messageColors[e.level]);
                var error = $('<td>').text(LanguageManager.sLang("edt_validator_"+e.level));
                var message = $('<td>').append($('<span>').text(e.message).on('click', e.jumpToFunction).css('cursor', 'pointer'));
                row.append(error).append(message);
                $('#validationReport table').append(row);
            });
        }
        $('#draftScreen').hide();
        $('#validationReport').show();
        $('#tabDock').show();
        $("#main").focus();
    }

    // Checks if there is a cycle in the graph.
    function testCycle(currentNode, nodeToFind)
    {
        for(var nodeID in Main.nodes)
            Main.nodes[nodeID].visited = false;

        return testCycleDFS(currentNode, nodeToFind);
    }

    function testCycleDFS(currentNode, nodeToFind)
    {
        if (currentNode === nodeToFind)
            return true;

        Main.nodes[currentNode].visited = true;
        var plumbInstance = Main.getPlumbInstanceByNodeID(currentNode);
        var connections = plumbInstance.getConnections({source: currentNode});
        for (var i = 0; i < connections.length; i++)
            if(!Main.nodes[connections[i].targetId].visited && testCycleDFS(connections[i].targetId, nodeToFind))
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
