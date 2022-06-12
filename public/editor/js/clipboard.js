/* © Utrecht University and DialogueTrainer */

(function()
{
    "use strict";

    $(function()
    {
        const handleClipboardEvent = function(e, clipboard, action)
        {
            const handlers =
            {
                copy: copy,
                cut: cut,
                paste: paste
            };

            if (Main.isEditingInCanvas() && handlers[action](clipboard, 'text/plain'))
            {
                e.preventDefault();
            }
        };

        const actionsByKey = { C: 'copy', X: 'cut', V: 'paste' };

        Object.keys(actionsByKey).forEach(function(key)
        {
            const action = actionsByKey[key];
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
        const hasSelectedText = window.getSelection().type !== 'Range';
        if (!hasSelectedText) return false;

        const copiedElement = copyElement();
        if (copiedElement === null) return false;

        const dataAsText = JSON.stringify($.extend(copiedElement, { target: 'scenario', configIdRef: Config.container.id }));
        clipboard.setData(format, dataAsText);
        return true;
    }

    function cut(clipboard, format)
    {
        const hasCopied = copy(clipboard, format);
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
            let data;
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
        const definitions = { parameters: { userDefined: $.extend(true, {}, Parameters.container) } };
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
        else if (Main.selectedElements.length > 0)
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
        return null;
    }

    function copyTree(treeId)
    {
        const tree = Main.trees[treeId];
        const toCopy = Utils.clone(
        {
            subject: tree.subject,
            optional: tree.optional,
            leftPos: tree.leftPos,
            leftScroll: tree.leftScroll,
            topPos: tree.topPos,
            topScroll: tree.topScroll
        });
        toCopy.nodes = tree.nodes.map(copyNode);

        return toCopy;
    }

    function copyNode(nodeID)
    {
        const toCopy = Utils.clone(Main.nodes[nodeID]);

        const plumbInstance = Main.getPlumbInstanceByNodeID(nodeID);
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

    function pasteElement(type, content, anchorPosition)
    {
        const indicatorPos = Main.getGridIndicatorPosition();
        if (!Array.isArray(content))
        {
            if (type === 'dialogue' && !Zoom.isZoomed())
            {
                const newTree = pasteTree(content, indicatorPos.left, indicatorPos.top);
                Main.selectElement(newTree.id);
            }
            else if (type === 'node' && Zoom.isZoomed())
            {
                const newNode = pasteNode(content, { left: anchorPosition.left, top: anchorPosition.top });
                Main.selectElement(newNode.id);
            }
        }
        else
        {
            if (type === 'dialogue' && !Zoom.isZoomed())
            {
                // In grid positions
                let minX = Number.MAX_VALUE;
                let minY = Number.MAX_VALUE;

                content.forEach(function(tree)
                {
                    if (tree.leftPos < minX) minX = tree.leftPos;
                    if (tree.topPos < minY) minY = tree.topPos;
                });

                // Paste trees relative to top left of smallest bounding box
                const pastedTreeIds = $.map(content, function(tree)
                {
                    const leftPos = tree.leftPos - minX + indicatorPos.left;
                    const topPos = tree.topPos - minY + indicatorPos.top;
                    return pasteTree(tree, leftPos, topPos).id;
                });

                Main.selectElements(pastedTreeIds);
            }
            else if (type === 'node' && Zoom.isZoomed())
            {
                // Needed to save jsPlumb connections
                const idMappings = {};
                const plumbInstance = Zoom.getZoomed().plumbInstance;
                plumbInstance.batch(function()
                {
                    const topLeftNode = content.reduce(function(topLeftNode, node)
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
                        const newNode = pasteNode(node,
                        {
                            left: anchorPosition.left + node.position.left - topLeftNode.position.left,
                            top: anchorPosition.top + node.position.top - topLeftNode.position.top
                        });
                        idMappings[node.id] = newNode.id;
                    });

                    // Paste jsPlumb connections
                    content.forEach(function(node)
                    {
                        // Due to deleting from arrays in js leaving values undefined
                        if (!node) return true;

                        node.connections.forEach(function(connection)
                        {
                            const target = idMappings[connection.targetId]; // Map original target to copied target
                            if (!target) return true;
                            const source = idMappings[connection.sourceId]; // Map original source to copied source
                            if (!source) return true;
                            const newConnection = plumbInstance.connect(
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
                Main.selectElements(Object.values(idMappings));
            }
        }
    }

    function pasteNode(copiedNode, position, tree)
    {
        if (!tree) tree = Zoom.getZoomed();
        if (!tree) return;

        // No DOM action just yet; this just copies the object in the nodes object
        const node = Utils.clone(copiedNode);
        // To do DOM manipulations and create the id
        const nodeElem = Main.createAndReturnNode(node.type, null, tree.div, tree.id);

        node.id = nodeElem.attr('id');
        node.parent = tree.id;
        delete node.position;
        delete node.connections;

        Main.nodes[node.id] = node;

        if (position)
        {
            Utils.cssPosition(nodeElem, { left: Math.max(position.left, 0), top: Math.max(position.top, 0) });
        }

        Main.changeNodeText(node.id);

        return node;
    }

    function pasteTree(toCopy, leftPos, topPos)
    {
        const idMappings = {};

        const newTree = Main.createEmptyTree(null, leftPos, topPos);

        newTree.subject = i18next.t('clipboard:copy_of', { name: toCopy.subject });
        newTree.optional = toCopy.optional;
        const iconDiv = newTree.dragDiv.find('.icons');
        if (newTree.optional) iconDiv.html(Utils.sIcon('icon-tree-is-optional'));
        newTree.dragDiv.toggleClass('optional', newTree.optional);

        newTree.leftScroll = toCopy.leftScroll;
        newTree.topScroll = toCopy.topScroll;

        const treeDiv = $("#" + newTree.id);
        treeDiv.find(".subjectName").text(newTree.subject);
        treeDiv.find(".subjectNameInput").val(newTree.subject);

        newTree.plumbInstance.batch(function()
        {
            toCopy.nodes.forEach(function(node)
            {
                // Can occur due to deleting from arrays in js leaving values undefined
                if (!node) return;

                const newNode = pasteNode(node, undefined, newTree);

                // Needed to also copy over jsplumb connections
                idMappings[node.id] = newNode.id;

                Utils.cssPosition($("#" + newNode.id), node.position);
            });

            // All nodes have been created, now copy connections
            toCopy.nodes.forEach(function(node)
            {
                // Can occur due to deleting from arrays in js leaving values undefined
                if (!node) return true;

                node.connections.forEach(function(connection)
                {
                    const target = idMappings[connection.targetId]; // Map original target to copied target
                    const source = idMappings[connection.sourceId]; // Map original source to copied source
                    const newConnection = newTree.plumbInstance.connect(
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
        const processNode = function(node)
        {
            // Before performing any operations we need to update the references in the byId object
            // to the sequenced objects in the node's datastructures
            const fixedParameterEffects = node.parameterEffects.fixed;
            for (const parameterId in fixedParameterEffects.characterIndependent.byId)
            {
                fixedParameterEffects.characterIndependent.byId[parameterId] = [];
            }
            fixedParameterEffects.characterIndependent.sequence.forEach(function(effect)
            {
                fixedParameterEffects.characterIndependent.byId[effect.idRef].push(effect);
            });
            for (const characterId in fixedParameterEffects.perCharacter)
            {
                for (const parameterId in fixedParameterEffects.perCharacter[characterId].byId)
                {
                    fixedParameterEffects.perCharacter[characterId].byId[parameterId] = [];
                }

                fixedParameterEffects.perCharacter[characterId].sequence.forEach(function(effect)
                {
                    fixedParameterEffects.perCharacter[characterId].byId[effect.idRef].push(effect);
                });
            }

            const getEqualParameter = function(parameter)
            {
                const equalParameters = Parameters.container.sequence.filter(function(existingParameter)
                {
                    return existingParameter.name === parameter.name && existingParameter.type.equals(parameter.type);
                });
                return equalParameters.length > 0 ? equalParameters[0] : null;
            };

            const missingParameterIds = {};
            node.parameterEffects.userDefined = node.parameterEffects.userDefined.filter(function(parameterEffect)
            {
                const equalParameter = getEqualParameter(definitions.parameters.userDefined.byId[parameterEffect.idRef]);
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
                const onConditionPreservation = function(condition, equalParameter)
                {
                    condition.idRef = equalParameter.id;
                };
                const onConditionRemoval = function(condition)
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

        let canPaste = false;
        let missingParameterIds = {};
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
            const anchorPosition = Zoom.isZoomed() ? Main.mousePositionToDialoguePosition(Main.mousePosition) : undefined;
            if (Object.keys(missingParameterIds).length > 0)
            {
                const warning = $('<div>');
                warning.append($('<div>', { text: i18next.t('clipboard:referrer_warning') }));
                warning.append($('<ul>').append(Object.keys(missingParameterIds).map(function(parameterId)
                {
                    return $('<li>', { text: definitions.parameters.userDefined.byId[parameterId].name });
                })));
                Utils.confirmDialog(warning, 'warning')
                    .then(function(confirmed)
                    {
                        if (confirmed) pasteElement(type, content, anchorPosition);
                    });
            }
            else
            {
                pasteElement(type, content, anchorPosition);
            }
        }

        return canPaste;
    }
})();
