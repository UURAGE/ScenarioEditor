// © DialogueTrainer

/* exported Load1 */
let Load1;

(function()
{
    "use strict";

    // eslint-disable-next-line no-global-assign
    Load1 =
    {
        generateGraph: generateGraph
    };

    function generateGraph(xml)
    {
        const tree = Main.createEmptyTree(null, 0, 0);
        const connections = {};
        // Conversations stores all the accumulated conversations so we can expand them and give the nodes fresh ids at the end
        const conversations = {};

        tree.plumbInstance.batch(function()
        {
            $(xml).children().add($(xml).find('script').children()).each(function()
            { // The parameter xml has one child: the script
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
                for (let i = 0; i < targets.length; i++)
                {
                    tree.plumbInstance.connect(
                    {
                        source: sourceId,
                        target: targets[i]
                    });
                }
            });
        }, true);

        Load3.expandConversations(conversations);
    }
})();
