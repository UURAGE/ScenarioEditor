/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

var Load1;

(function()
{
    "use strict";

    Load1 =
    {
        generateGraph: generateGraph
    };
    
    function generateGraph(xml)
    {
        var tree = Main.createEmptyTree(null, false, 0, 0);
        var connections = {};

        $('script', xml).children().each(function()
        { //xml has one child: the script
            switch (this.nodeName)
            {
                case "computerStatement":
                    Load3.loadStatement(this, Main.computerType,
                        connections, tree.id);
                    break;
                case "playerStatement":
                    Load3.loadStatement(this, Main.playerType,
                        connections, tree.id);
                    break;
                case "conversation":
                    Load3.loadStatement(this, Main.conversationType,
                        connections, tree.id);
                    break;
            }
        });

        // Makes the connections between the nodes.
        $.each(connections, function(sourceId, targets)
        {
            for (var i = 0; i < targets.length; i++)
                tree.plumbInstance.connect(
                {
                    source: sourceId,
                    target: targets[i]
                });
        });
    }
})();