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
        // Conversations stores all the accumulated conversations so we can expand them and give the nodes fresh ids at the end
        var conversations = {};

        $(xml).find('script').children().each(function()
        { //xml has one child: the script
            switch (this.nodeName)
            {
                case "computerStatement":
                    Load3.loadStatement(this, Main.computerType, connections, tree.id);
                    break;
                case "playerStatement":
                    Load3.loadStatement(this, Main.playerType, connections, tree.id);
                    break;
                case "conversation":
                    Load3.loadConversation(this, conversations, tree.id);
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

        Load3.expandConversations(conversations);
    }
})();