/* © Utrecht University and DialogueTrainer */

/* exported SnapToGrid */
let SnapToGrid;

(function()
{
    "use strict";

    // eslint-disable-next-line no-global-assign
    SnapToGrid =
    {
        roundPosition: roundPosition
    };

    $(function()
    {
        if (!Config.container.settings.grid)
        {
            $("#snapGraph").hide();
        }

        $("#snapGraph").on('click', function()
        {
            SaveIndicator.setSavedChanges(false);

            const tree = Zoom.getZoomed();
            if (!tree)
            {
                // Reposition all nodes.

                for (const [nodeID] of Object.entries(Main.nodes))
                {
                    snapNode(nodeID);
                }
                return;
            }

            tree.nodes.forEach(function(nodeID)
            {
                snapNode(nodeID);
                Main.trees[Main.nodes[nodeID].parent].zoomedInBefore = false;
            });

            tree.plumbInstance.batch(function()
            {
                tree.nodes.forEach(function(nodeID)
                {
                    tree.plumbInstance.revalidate(nodeID);
                });
            });
        });
    });

    function roundPosition(position)
    {
        const gridSize = Config.container.settings.grid;
        if (!gridSize) return position;

        return {
            left: Math.round(position.left / gridSize.x) * gridSize.x,
            top: Math.round(position.top / gridSize.y) * gridSize.y
        };
    }

    function snapNode(nodeID)
    {
        const oldPos = Utils.cssPosition($('#' + nodeID));
        Utils.cssPosition($('#' + nodeID), roundPosition(oldPos));
    }
})();
