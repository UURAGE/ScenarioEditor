/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

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
        // Delete the properties from node that are used for arranging all nodes within a tree
        // This is done here, because doing it after an arrange operation will make it even slower
        delete Main.nodes[nodeID].topologicalChildren;
        delete Main.nodes[nodeID].topologicalOrderingVisited;
        delete Main.nodes[nodeID].topologicalParent;

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
        if (copiedElement !== null && copiedElement !== undefined)
        {
            if (copiedTrees && !Zoom.isZoomed())
            {
                pasteTree(copiedElement, 0, 0);
            }
            else if (Zoom.isZoomed() && !copiedTrees)
            {
                var newNode = pasteNode(copiedElement);
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
                    return pasteTree(tree, tree.leftPos - minX, tree.topPos - minY).id;
                });

                Main.selectElements(pastedTreeIds);
            }
            else if (Zoom.isZoomed() && !copiedTrees)
            {
                //Needed to save jsPlumb connections
                var idMappings = {};
                $.each(copiedElements, function(index, node)
                {
                    newNode = pasteNode(node);
                    idMappings[node.id] = newNode.id;
                });

                var plumbInstance = Zoom.getZoomed().plumbInstance;
                //Copy jsPlumb connections
                $.each(copiedElements, function(index, node)
                {
                    if (!node) //due to deleting from arrays in js leaving values undefined
                        return true;

                    var connections = node.connections;

                    $.each(connections, function(index,
                        connection)
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
                // select all nodes just copied
                Main.selectElements($.map(idMappings, function (newId) { return newId; }));
            }
        }
    }

    function pasteNode(copiedNode)
    {
        var node = Utils.clone(copiedNode); //no dom action just yet. this just copies the object in the nodes object
        var newNode = Main.addNewNode(node.type); //to do dom manipulations and create the id. no data now present in nodes[newNode.id] is kept

        Main.selectElement(null);

        node.id = newNode.id;
        node.parent = newNode.parent;
        delete node.position;
        delete node.connections;

        Main.nodes[newNode.id] = node;

        // set nodeposition relatively to the positions off the original node(s)
        var left = copiedNode.position.left + 50;
        var top = copiedNode.position.top + 50;

        var nodeElem = $('#' + newNode.id);
        //Set position
        Utils.cssPosition(nodeElem,
        {
            "top": top,
            "left": left
        });
        //Save node text
        nodeElem.find("textarea.nodestatement").val(copiedNode.text);

        Main.changeNodeText(newNode.id);

        return node;
    }

    function pasteTree(toCopy, offSetX, offSetY)
    {
        var idMappings = {}; //record wich original node id was copied to which id
        //idmappings[originalID] = copyID
        //all other information like dom elements and position should not be copied

        var newTree = Main.createEmptyTree(null, true, offSetX, offSetY);

        newTree.subject = LanguageManager.fLang("edt_clipboard_copy_of", [toCopy.subject]);
        newTree.optional = toCopy.optional;

        var treeDiv = $("#" + newTree.id);
        treeDiv.find(".subjectName").text(newTree.subject);
        treeDiv.find(".subjectNameInput").val(newTree.subject);

        Main.selectElement(newTree.id); //tree needs to be selected when copied nodes are created

        $.each(toCopy.nodes, function(index, node)
        {
            if (!node) //due to deleting from arrays in js leaving values undefined
                return true; //$.each version of continue

            var newNode = pasteNode(node);

            Main.selectElement(newTree.id); //after creation a new node is immediately selected. so we need to reselect the tree

            idMappings[node.id] = newNode.id; //needed to also copy over jsplumb connectors.

            var newNodeDiv = $("#" + newNode.id);

            Utils.cssPosition(newNodeDiv, node.position);
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

        return newTree;
    }

}());
