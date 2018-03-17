/* © Utrecht University and DialogueTrainer */

var Clipboard;

(function()
{
    "use strict";

    Clipboard =
    {
        copyElement: copyElement,
        cutElement: cutElement,
        pasteElement: pasteElement
    };

    var copiedElement = null,
        copiedElements = [],
        copiedTrees = false;

    $(document).ready(function()
    {
        $("#copyNode").on('click', function()
        {
            copyElement();
        });
        $("#cutNode").on('click', function ()
        {
            cutElement();
        });
        $("#pasteNode").on('click', function()
        {
            pasteElement();
        });
    });

    function copyElement()
    {
        //Check if we're saving tree(s) or node(s)
        copiedTrees = !Zoom.isZoomed();

        //Save element(s) in memory
        if (Main.selectedElement !== null && Main.selectedElement !==
            undefined)
        {
            if (copiedTrees)
            {
                copiedElement = copyTree(Main.selectedElement);
            }
            else
            {
                copiedElement = copyNode(Main.selectedElement);
            }
            copiedElements = null;
        }
        else if (Main.selectedElements !== null && Main.selectedElements !==
            undefined)
        {
            copiedElements = [];
            if (copiedTrees)
            {
                $.each(Main.selectedElements, function(index, treeId)
                {
                    copiedElements.push(copyTree(treeId));
                });
            }
            else
            {
                $.each(Main.selectedElements, function(index, nodeId)
                {
                    copiedElements.push(copyNode(nodeId));
                });
            }
            copiedElement = null;
        }
    }

    function copyTree(treeId)
    {
        //Save tree data
        var toCopy = Utils.clone(Main.trees[treeId]),
        nodes = [];
        //Save all node data in tree
        $.each(Main.trees[treeId].nodes, function(index, nodeId)
        {
            nodes.push(copyNode(nodeId));
        });
        toCopy.nodes = nodes;

        return toCopy;
    }

    function copyNode(nodeID)
    {
        var toCopy = Utils.clone(Main.nodes[nodeID]);
        var plumbInstance = Main.getPlumbInstanceByNodeID(nodeID);

        toCopy.connections = plumbInstance.getConnections({ target: nodeID });
        toCopy.position = Utils.cssPosition($('#' + nodeID));

        return toCopy;
    }

    function cutElement()
    {
        copyElement();
        Main.deleteAllSelected();
    }

    function pasteElement()
    {
        var indicatorPos = Main.getGridIndicatorPosition();
        if (copiedElement !== null && copiedElement !== undefined)
        {
            if (copiedTrees && !Zoom.isZoomed())
            {
                var newTree = pasteTree(copiedElement, indicatorPos.left, indicatorPos.top);
                Main.selectElement(newTree.id);
            }
            else if (Zoom.isZoomed() && !copiedTrees)
            {
                var newNode = pasteNode(copiedElement, { left: 0, top: 0 });
                Main.selectElement(newNode.id);
            }
        }
        else if (copiedElements !== null && copiedElements !== undefined)
        {
            if (copiedTrees && !Zoom.isZoomed())
            {
                // In grid positions
                var minX = Number.MAX_VALUE;
                var minY = Number.MAX_VALUE;

                $.each(copiedElements, function(index, tree)
                {
                    if (tree.leftPos < minX) minX = tree.leftPos;
                    if (tree.topPos < minY) minY = tree.topPos;
                });

                // Paste trees relative to top left of smallest bounding box
                var pastedTreeIds = $.map(copiedElements, function(tree, index)
                {
                    var leftPos = tree.leftPos - minX + indicatorPos.left;
                    var topPos = tree.topPos - minY + indicatorPos.top;
                    return pasteTree(tree, leftPos, topPos).id;
                });

                Main.selectElements(pastedTreeIds);
            }
            else if (Zoom.isZoomed() && !copiedTrees)
            {
                //Needed to save jsPlumb connections
                var idMappings = {};
                var plumbInstance = Zoom.getZoomed().plumbInstance;
                plumbInstance.batch(function()
                {
                    $.each(copiedElements, function(index, node)
                    {
                        var offset = { left: node.position.left - copiedElements[0].position.left, top: node.position.top - copiedElements[0].position.top };
                        newNode = pasteNode(node, offset);
                        idMappings[node.id] = newNode.id;
                    });

                    // Paste jsPlumb connections
                    $.each(copiedElements, function(index, node)
                    {
                        if (!node) //due to deleting from arrays in js leaving values undefined
                            return true;

                        var connections = node.connections;

                        $.each(connections, function(index, connection)
                        {
                            var target = idMappings[
                                connection.targetId]; //map original target to copied target
                            if (!target)
                                return true;
                            var source = idMappings[
                                connection.sourceId]; //map original source to copied source
                            if (!source)
                                return true;
                            plumbInstance.connect(
                            {
                                "source": source,
                                "target": target
                            });
                        });
                    });
                });

                // select all nodes just copied
                Main.selectElements($.map(idMappings, function (newId) { return newId; }));
            }
        }
    }

    function pasteNode(copiedNode, offset, tree, doNotPosition)
    {
        if (!tree) tree = Zoom.getZoomed();
        if (!tree) return;

        var node = Utils.clone(copiedNode); //no dom action just yet. this just copies the object in the nodes object
        var nodeElem = Main.createAndReturnNode(node.type, null, tree.div, tree.id); //to do dom manipulations and create the id

        node.id = nodeElem.attr('id');
        node.parent = tree.id;
        delete node.position;
        delete node.connections;

        Main.nodes[node.id] = node;

        if (!doNotPosition)
        {
            var position = Main.mousePositionToDialoguePosition(Main.mousePosition);
            Utils.cssPosition(nodeElem, { left: position.left + offset.left, top: position.top + offset.top });
        }

        Main.changeNodeText(node.id);

        return node;
    }

    function pasteTree(toCopy, leftPos, topPos)
    {
        var idMappings = {}; //record wich original node id was copied to which id
        //idmappings[originalID] = copyID
        //all other information like dom elements and position should not be copied

        var newTree = Main.createEmptyTree(null, leftPos, topPos);

        newTree.subject = i18next.t('clipboard:copy_of', { postProcess: 'sprintf', sprintf: [toCopy.subject]});
        newTree.optional = toCopy.optional;

        newTree.leftScroll = toCopy.leftScroll;
        newTree.topScroll = toCopy.topScroll;

        var treeDiv = $("#" + newTree.id);
        treeDiv.find(".subjectName").text(newTree.subject);
        treeDiv.find(".subjectNameInput").val(newTree.subject);

        newTree.plumbInstance.batch(function()
        {
            $.each(toCopy.nodes, function(index, node)
            {
                if (!node) //due to deleting from arrays in js leaving values undefined
                    return true; //$.each version of continue

                var newNode = pasteNode(node, { left: 0, top: 0 }, newTree, true);

                idMappings[node.id] = newNode.id; //needed to also copy over jsplumb connectors.

                Utils.cssPosition($("#" + newNode.id), node.position);
            });

            //all nodes have been created. now copy connectors
            $.each(toCopy.nodes, function(index, node)
            {
                if (!node) //due to deleting from arrays in js leaving values undefined
                    return true;

                var connections = node.connections;

                $.each(connections, function(index, connection)
                {
                    var target = idMappings[connection.targetId]; //map original target to copied target
                    var source = idMappings[connection.sourceId]; //map original source to copied source
                    newTree.plumbInstance.connect(
                    {
                        "source": source,
                        "target": target
                    });
                });
            });
        });

        return newTree;
    }

}());
