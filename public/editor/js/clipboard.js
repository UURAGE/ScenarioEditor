/* © Utrecht University and DialogueTrainer */

(function()
{
    "use strict";

    $(document).ready(function()
    {
        var isIEClipboard = window.clipboardData && window.clipboardData.getData;

        var handleClipboardEvent = function(e, clipboard, action)
        {
            var handlers =
            {
                copy: copy,
                cut: cut,
                paste: paste
            };

            var clipboardFormat = isIEClipboard ? 'Text' : 'text/plain';

            if (Main.isEditingInCanvas() && handlers[action](clipboard, clipboardFormat))
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
            $('#' + action).tooltip(
            {
                items: '#' + action,
                content: i18next.t('clipboard:hint', { key: key, action: action }),
                create: function() { $(this).data("ui-tooltip").liveRegion.remove(); }
            });
            $('#' + action).on('click', function()
            {
                $("#main").focus();
            });
        });
    });

    function copy(clipboard, format)
    {
        var hasSelectedText = window.getSelection().type !== 'Range';
        if (hasSelectedText)
        {
            var dataAsText = JSON.stringify($.extend(copyElement(), { target: 'scenario', configIdRef: Config.container.id }));
            clipboard.setData(format, dataAsText);
        }
        return hasSelectedText;
    }

    function cut(clipboard, format)
    {
        var hasCopied = copy(clipboard, format);
        if (hasCopied)
        {
            Main.deleteAllSelected();
        }
        return hasCopied;
    }

    function paste(clipboard, format)
    {
        if (Main.isMousePositionWithinEditingCanvas())
        {
            var data;
            try
            {
                data = JSON.parse(clipboard.getData(format));
            }
            catch (_)
            {
                return false;
            }

            if (data && data.target === 'scenario' && data.configIdRef && data.type && data.definitions && data.content)
            {
                if (data.configIdRef !== Config.container.id)
                {
                    Utils.alertDialog("The config id of the pasted content does not match the config id referred to in the scenario", 'warning');
                }
                return considerPasting(data.type, data.definitions, data.content);
            }
        }

        return false;
    }

    function copyElement()
    {
        var definitions = { parameters: { userDefined: $.extend(true, {}, Parameters.container) } };
        if (Main.selectedElement !== null)
        {
            if (!Zoom.isZoomed())
            {
                return {
                    type: 'dialogue',
                    definitions: definitions,
                    content: copyTree(Main.selectedElement)
                };
            }
            else
            {
                return {
                    type: 'node',
                    definitions: definitions,
                    content: copyNode(Main.selectedElement)
                };
            }
        }
        else if (Main.selectedElements !== null)
        {
            if (!Zoom.isZoomed())
            {
                return {
                    type: 'dialogue',
                    definitions: definitions,
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
                    definitions: definitions,
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
        // Save tree data
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
        // Save all node data in tree
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
            }
            else if (type === 'node' && Zoom.isZoomed())
            {
                var newNode = pasteNode(content, { left: 0, top: 0 });
                Main.selectElement(newNode.id);
            }
        }
        else
        {
            if (type === 'dialogue' && !Zoom.isZoomed())
            {
                // In grid positions
                var minX = Number.MAX_VALUE;
                var minY = Number.MAX_VALUE;

                content.forEach(function(tree)
                {
                    if (tree.leftPos < minX) minX = tree.leftPos;
                    if (tree.topPos < minY) minY = tree.topPos;
                });

                // Paste trees relative to top left of smallest bounding box
                var pastedTreeIds = $.map(content, function(tree)
                {
                    var leftPos = tree.leftPos - minX + indicatorPos.left;
                    var topPos = tree.topPos - minY + indicatorPos.top;
                    return pasteTree(tree, leftPos, topPos).id;
                });

                Main.selectElements(pastedTreeIds);
            }
            else if (type === 'node' && Zoom.isZoomed())
            {
                // Needed to save jsPlumb connections
                var idMappings = {};
                var plumbInstance = Zoom.getZoomed().plumbInstance;
                plumbInstance.batch(function()
                {
                    var topLeftNode = content.reduce(function(topLeftNode, node)
                    {
                        if (topLeftNode.position.left + topLeftNode.position.top <= node.position.left + node.position.top)
                        {
                            return topLeftNode;
                        }
                        else
                        {
                            return node;
                        }
                    });
                    content.forEach(function(node)
                    {
                        var offset = { left: node.position.left - topLeftNode.position.left, top: node.position.top - topLeftNode.position.top };
                        var newNode = pasteNode(node, offset);
                        idMappings[node.id] = newNode.id;
                    });

                    // Paste jsPlumb connections
                    content.forEach(function(node)
                    {
                        // Due to deleting from arrays in js leaving values undefined
                        if (!node) return true;

                        var connections = node.connections;

                        $.each(connections, function(index, connection)
                        {
                            var target = idMappings[connection.targetId]; // Map original target to copied target
                            if (!target) return true;
                            var source = idMappings[connection.sourceId]; // Map original source to copied source
                            if (!source) return true;
                            var newConnection = plumbInstance.connect(
                            {
                                source: source,
                                target: target
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

                // Select all nodes just pasted
                Main.selectElements(Object.keys(idMappings).map(function(oldId) { return idMappings[oldId]; }));
            }
        }
    }

    function pasteNode(copiedNode, offset, tree, doNotPosition)
    {
        if (!tree) tree = Zoom.getZoomed();
        if (!tree) return;

        // No DOM action just yet; this just copies the object in the nodes object
        var node = Utils.clone(copiedNode);
        // To do DOM manipulations and create the id
        var nodeElem = Main.createAndReturnNode(node.type, null, tree.div, tree.id);

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

        newTree.subject = i18next.t('clipboard:copy_of', { postProcess: 'sprintf', sprintf: [toCopy.subject] });
        newTree.optional = toCopy.optional;
        var iconDiv = newTree.dragDiv.find('.icons');
        if (newTree.optional) iconDiv.html(Utils.sIcon('icon-tree-is-optional'));
        newTree.dragDiv.toggleClass('optional', newTree.optional);

        newTree.leftScroll = toCopy.leftScroll;
        newTree.topScroll = toCopy.topScroll;

        var treeDiv = $("#" + newTree.id);
        treeDiv.find(".subjectName").text(newTree.subject);
        treeDiv.find(".subjectNameInput").val(newTree.subject);

        newTree.plumbInstance.batch(function()
        {
            $.each(toCopy.nodes, function(index, node)
            {
                // Can occur due to deleting from arrays in js leaving values undefined
                if (!node) return true; // $.each version of continue

                var newNode = pasteNode(node, { left: 0, top: 0 }, newTree, true);

                // Needed to also copy over jsplumb connectors
                idMappings[node.id] = newNode.id;

                Utils.cssPosition($("#" + newNode.id), node.position);
            });

            // All nodes have been created. now copy connectors
            $.each(toCopy.nodes, function(index, node)
            {
                // Can occur due to deleting from arrays in js leaving values undefined
                if (!node) return true;

                var connections = node.connections;

                $.each(connections, function(index, connection)
                {
                    var target = idMappings[connection.targetId]; // Map original target to copied target
                    var source = idMappings[connection.sourceId]; // Map original source to copied source
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

    // Pastes the content if confirmed and returns true if the type, content and context are correct
    function considerPasting(type, definitions, content)
    {
        // Returns the parameter IDs that are missing
        var processNode = function(node)
        {
            // Before performing any operations we need to update the references in the byId object
            // to the sequenced objects in the node's datastructures
            var parameterId;
            var fixedParameterEffects = node.parameterEffects.fixed;
            for (parameterId in fixedParameterEffects.characterIndependent.byId)
            {
                fixedParameterEffects.characterIndependent.byId[parameterId] = [];
            }
            fixedParameterEffects.characterIndependent.sequence.forEach(function(effect)
            {
                fixedParameterEffects.characterIndependent.byId[effect.idRef].push(effect);
            });
            for (var characterId in fixedParameterEffects.perCharacter)
            {
                for (parameterId in fixedParameterEffects.perCharacter[characterId].byId)
                {
                    fixedParameterEffects.perCharacter[characterId].byId[parameterId] = [];
                }

                fixedParameterEffects.perCharacter[characterId].sequence.forEach(function(effect)
                {
                    fixedParameterEffects.perCharacter[characterId].byId[effect.idRef].push(effect);
                });
            }

            var getEqualParameter = function(parameter)
            {
                var equalParameters = Parameters.container.sequence.filter(function(existingParameter)
                {
                    return existingParameter.name === parameter.name && existingParameter.type.equals(parameter.type);
                });
                return equalParameters.length > 0 ? equalParameters[0] : null;
            };

            var missingParameterIds = {};
            node.parameterEffects.userDefined = node.parameterEffects.userDefined.filter(function(parameterEffect)
            {
                var equalParameter = getEqualParameter(definitions.parameters.userDefined.byId[parameterEffect.idRef]);
                if (equalParameter)
                {
                    parameterEffect.idRef = equalParameter.id;
                }
                else
                {
                    missingParameterIds[parameterEffect.idRef] = true;
                }
                return equalParameter;
            });

            if (node.preconditions)
            {
                var onConditionPreservation = function(condition, equalParameter)
                {
                    condition.idRef = equalParameter.id;
                };
                var onConditionRemoval = function(condition)
                {
                    missingParameterIds[condition.idRef] = true;
                };
                node.preconditions = Condition.filter(function(condition)
                {
                    return getEqualParameter(definitions.parameters.userDefined.byId[condition.idRef]);
                }, node.preconditions, onConditionPreservation, onConditionRemoval);
            }

            return missingParameterIds;
        };

        var canPaste = false;
        var missingParameterIds = {};
        if (!Array.isArray(content))
        {
            if (type === 'dialogue' && !Zoom.isZoomed())
            {
                missingParameterIds = content.nodes.reduce(function(parameterIds, node)
                {
                    return $.extend(parameterIds, processNode(node));
                }, {});
                canPaste = true;
            }
            else if (type === 'node' && Zoom.isZoomed())
            {
                missingParameterIds = processNode(content);
                canPaste = true;
            }
        }
        else
        {
            if (type === 'dialogue' && !Zoom.isZoomed())
            {
                missingParameterIds = content.reduce(function(parameterIds, dialogue)
                {
                    return $.extend(parameterIds, dialogue.nodes.reduce(function(parameterIds, node)
                    {
                        return $.extend(parameterIds, processNode(node));
                    }, {}));
                }, {});
                canPaste = true;
            }
            else if (type === 'node' && Zoom.isZoomed())
            {
                missingParameterIds = content.reduce(function(parameterIds, node)
                {
                    return $.extend(parameterIds, processNode(node));
                }, {});
                canPaste = true;
            }
        }

        if (canPaste)
        {
            if (Object.keys(missingParameterIds).length > 0)
            {
                var warning = $('<div>');
                warning.append($('<div>', { text: i18next.t('clipboard:referrer_warning') }));
                warning.append($('<ul>').append(Object.keys(missingParameterIds).map(function(parameterId)
                {
                    return $('<li>', { text: definitions.parameters.userDefined.byId[parameterId].name });
                })));
                Utils.confirmDialog(warning, 'warning')
                    .then(function(confirmed)
                    {
                        if (confirmed) pasteElement(type, content);
                    });
            }
            else
            {
                pasteElement(type, content);
            }
        }

        return canPaste;
    }
})();
