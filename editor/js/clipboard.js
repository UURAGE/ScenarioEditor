/* © Utrecht University and DialogueTrainer */

(function()
{
    "use strict";

    $(document).ready(function()
    {
        var isIEClipboard = window.clipboardData && window.clipboardData.getData;

        var handleClipboardEvent = function(e, clipboard, action)
        {
            var isEditingInCanvas = function()
            {
                var inModal = $(document.body).children(".ui-widget-overlay.ui-front").length > 0;
                return !inModal && ($("#main").closest(document.activeElement).length > 0 || document.activeElement === null);
            };

            var handlers =
            {
                copy: copy,
                cut: cut,
                paste: paste
            };

            var clipboardFormat = isIEClipboard ? clipboardFormat = 'Text' : 'text/plain';

            if (isEditingInCanvas() && handlers[action](clipboard, clipboardFormat))
            {
                e.preventDefault();
            }
        };

        var actionsByKey = { C: 'copy', X: 'cut', V: 'paste' };

        $(document).on('keydown', function(e)
        {
            if (isIEClipboard)
            {
                var key = String.fromCharCode(e.keyCode);
                if ((e.ctrlKey || e.metaKey) && key in actionsByKey)
                {
                    handleClipboardEvent(e, window.clipboardData, actionsByKey[key]);
                }
            }
        });

        Object.keys(actionsByKey).map(function(key)
        {
            var action = actionsByKey[key];
            $(document).on(action, function(e)
            {
                handleClipboardEvent(e, e.originalEvent.clipboardData, action);
            });

            // Show hint for the clipboard buttons
            $('#' + action).tooltip({ items: '#' + action, content: i18next.t('clipboard:hint', { key: key, action: action }) });
            $('#' + action).on('click', function()
            {
                $("#main").focus();
            });
        });
    });

    function copy(clipboard, format)
    {
        var dataAsText = JSON.stringify($.extend(copyElement(), { target: 'scenario', configIdRef: Config.container.id }));
        clipboard.setData(format, dataAsText);
        return true;
    }

    function cut(clipboard, format)
    {
        copy(clipboard, format);

        Main.deleteAllSelected();

        return true;
    }

    function paste(clipboard, format)
    {
        var zoomedTree = Zoom.getZoomed();
        var offset = zoomedTree ? zoomedTree.div.offset() : $("#main").offset();
        var width = $("#main").width();
        var height = $("#main").height();
        var isWithinEditingCanvas =
            Main.mousePosition.x >= offset.left &&
            Main.mousePosition.y >= offset.top &&
            Main.mousePosition.x < offset.left + width &&
            Main.mousePosition.y < offset.top + height;

        if (isWithinEditingCanvas)
        {
            try
            {
                var data = JSON.parse(clipboard.getData(format));
                if (data && data.target === 'scenario' && data.configIdRef && data.type && data.content)
                {
                    if (data.configIdRef !== Config.container.id)
                    {
                        alert("The config id of the pasted content does not match the config id referred to in the scenario");
                    }
                    return pasteElement(data.type, data.content);
                }
            }
            catch(_)
            {
                return false;
            }
        }

        return false;
    }

    function copyElement()
    {
        if (Main.selectedElement !== null)
        {
            if (!Zoom.isZoomed())
            {
                return { type: 'dialogue', content: copyTree(Main.selectedElement) };
            }
            else
            {
                return { type: 'node', content: copyNode(Main.selectedElement) };
            }
        }
        else if (Main.selectedElements !== null)
        {
            if (!Zoom.isZoomed())
            {
                return {
                    type: 'dialogue',
                    content: Main.selectedElements.map(function(treeID)
                    {
                        return copyTree(treeID);
                    })
                };
            }
            else
            {
                return {
                    type: 'node',
                    content: Main.selectedElements.map(function(nodeID)
                    {
                        return copyNode(nodeID);
                    })
                };
            }
        }
    }

    function copyTree(treeId)
    {
        var tree = Main.trees[treeId];
        //Save tree data
        var toCopy = Utils.clone(
        {
            subject: tree.subject,
            level: tree.level,
            optional: tree.optional,
            leftPos: tree.leftPos,
            leftScroll: tree.leftScroll,
            topPos: tree.topPos,
            topScroll: tree.topScroll
        });
        var nodes = [];
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
        toCopy.connections = plumbInstance.getConnections({ target: nodeID }).map(function(connection)
        {
            return {
                sourceId: connection.sourceId,
                targetId: connection.targetId,
                color: connection.getParameter('color')
            };
        });

        toCopy.position = Utils.cssPosition($('#' + nodeID));

        return toCopy;
    }

    function pasteElement(type, content)
    {
        var indicatorPos = Main.getGridIndicatorPosition();
        if (!Array.isArray(content))
        {
            if (type === 'dialogue' && !Zoom.isZoomed())
            {
                var newTree = pasteTree(content, indicatorPos.left, indicatorPos.top);
                Main.selectElement(newTree.id);
                return true;
            }
            else if (type === 'node' && Zoom.isZoomed())
            {
                var newNode = pasteNode(content, { left: 0, top: 0 });
                Main.selectElement(newNode.id);
                return true;
            }
        }
        else
        {
            if (type === 'dialogue' && !Zoom.isZoomed())
            {
                // In grid positions
                var minX = Number.MAX_VALUE;
                var minY = Number.MAX_VALUE;

                $.each(content, function(index, tree)
                {
                    if (tree.leftPos < minX) minX = tree.leftPos;
                    if (tree.topPos < minY) minY = tree.topPos;
                });

                // Paste trees relative to top left of smallest bounding box
                var pastedTreeIds = $.map(content, function(tree, index)
                {
                    var leftPos = tree.leftPos - minX + indicatorPos.left;
                    var topPos = tree.topPos - minY + indicatorPos.top;
                    return pasteTree(tree, leftPos, topPos).id;
                });

                Main.selectElements(pastedTreeIds);

                return true;
            }
            else if (type === 'node' && Zoom.isZoomed())
            {
                //Needed to save jsPlumb connections
                var idMappings = {};
                var plumbInstance = Zoom.getZoomed().plumbInstance;
                plumbInstance.batch(function()
                {
                    $.each(content, function(index, node)
                    {
                        var offset = { left: node.position.left - content[0].position.left, top: node.position.top - content[0].position.top };
                        newNode = pasteNode(node, offset);
                        idMappings[node.id] = newNode.id;
                    });

                    // Paste jsPlumb connections
                    $.each(content, function(index, node)
                    {
                        if (!node) //due to deleting from arrays in js leaving values undefined
                            return true;

                        var connections = node.connections;

                        $.each(connections, function(index, connection)
                        {
                            var target = idMappings[connection.targetId]; //map original target to copied target
                            if (!target)
                                return true;
                            var source = idMappings[connection.sourceId]; //map original source to copied source
                            if (!source)
                                return true;
                            var newConnection = plumbInstance.connect(
                            {
                                "source": source,
                                "target": target
                            });

                            if (connection.color)
                            {
                                newConnection.setParameter('color', connection.color);
                            }
                        });
                    });

                    if (ColorPicker.areColorsEnabled())
                    {
                        ColorPicker.applyColors();
                    }
                });

                // select all nodes just copied
                Main.selectElements($.map(idMappings, function (newId) { return newId; }));

                return true;
            }
        }
        return false;
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
            Utils.cssPosition(nodeElem, { left: Math.max(position.left + offset.left, 0), top: Math.max(position.top + offset.top, 0) });
        }

        Main.changeNodeText(node.id);

        return node;
    }

    function pasteTree(toCopy, leftPos, topPos)
    {
        var idMappings = {};

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
                    var newConnection = newTree.plumbInstance.connect(
                    {
                        "source": source,
                        "target": target
                    });

                    if (connection.color)
                    {
                        newConnection.setParameter('color', connection.color);
                    }
                });
            });
        });

        return newTree;
    }

}());
