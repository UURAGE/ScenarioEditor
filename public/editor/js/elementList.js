/* © Utrecht University and DialogueTrainer */

/* exported ElementList */
var ElementList;

(function()
{
    "use strict";

    // eslint-disable-next-line no-global-assign
    ElementList =
    {
        handleNodeTextChange: handleNodeTextChange,
        handleNodeDeletion: handleNodeDeletion
    };

    $(function()
    {
        // Event handlers.
        $("#toggleElementList").on('click', listElements);
    });

    function listElements()
    {
        var table = $('<table>');
        Object.keys(Main.trees)
            .map(function(treeID) { return Main.trees[treeID]; })
            .sort(function(a, b)
            {
                return (a.topPos - b.topPos) || (a.leftPos - b.leftPos);
            })
            .forEach(function(tree)
            {
                tree.nodes
                    .slice()
                    .sort(function(a, b)
                    {
                        return compareNodePositions(Utils.cssPosition($('#' + a)), Utils.cssPosition($('#' + b)));
                    })
                    .forEach(function(nodeID)
                    {
                        table.append(createRow(tree, Main.nodes[nodeID]));
                    });
            });
        $('#tabDock').children().not('.ui-widget-header').hide();
        $('#elementList').empty().append(table).show();
        $('#tabDock').find('.title').text(i18next.t('elementList:element_list_title')).end().show();
        $("#main").focus();
    }

    function compareNodePositions(a, b)
    {
        return (a.top - b.top) || (a.left - b.left);
    }

    function createRow(tree, node)
    {
        var row = $('<tr>', { id: 'element-list-' + node.id });
        row.append(
            $('<td>').append($('<button>',
                {
                    html: $(Utils.sIcon('icon-jump')),
                    class: "jumpControl",
                    click: function()
                    {
                        Zoom.zoomIn(tree);
                        Main.selectNode(node.id);
                        $('#' + node.id)[0].scrollIntoView(false);
                    }
                })),
            $('<td>').append($('<span>',
                {
                    class: 'label ' + node.type,
                    text: i18next.t('common:' + node.type)[0],
                    title: i18next.t('common:' + node.type)
                })),
            $('<td>',
                {
                    text: node.text,
                    class: 'text fill'
                })
        );
        return row;
    }

    function isActive()
    {
        return $('#elementList').is(':visible');
    }

    function handleNodeTextChange(node)
    {
        if (!isActive()) return;
        var row = $('#element-list-' + node.id);
        if (row.length)
        {
            row.find('.text').text(node.text);
        }
        else
        {
            var tree = Main.trees[node.parent];
            row = createRow(tree, node);

            var pos = Utils.cssPosition($('#' + node.id));
            var previousRow = null;
            var previousPos = null;
            tree.nodes.forEach(function(otherNodeID)
            {
                var otherRow = $('#element-list-' + otherNodeID);
                if (!otherRow.length) return;
                var otherPos = Utils.cssPosition($('#' + otherNodeID));
                if ((!previousPos || compareNodePositions(previousPos, otherPos) < 0) &&
                    compareNodePositions(otherPos, pos) < 0)
                {
                    previousRow = otherRow;
                    previousPos = otherPos;
                }
            });
            if (previousRow !== null)
            {
                row.insertAfter(previousRow);
            }
            else
            {
                $('#elementList').children('table').prepend(row);
            }
        }
    }

    function handleNodeDeletion(node)
    {
        if (!isActive()) return;
        $('#element-list-' + node.id).remove();
    }
})();
