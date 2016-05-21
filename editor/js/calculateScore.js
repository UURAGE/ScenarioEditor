/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

// Functions for calculating the possible score in a node.

(function()
{
    $(document).ready(function()
    {
        $("#scoreParents").on('click', function()
        {
            var returnScores = getScoreParents(Main.selectedElement);
            HtmlGenerator.showScores(returnScores);
            memo = [];
        });
    });

    //memoization of calculated scores for speed improvement
    var memo = [];

    // Calculate the score of this node, by getting the scores of parents.
    function getScoreParents(nodeID)
    {
        if (nodeID === null) return; //node is not defined.

        var connections = Main.getPlumbInstanceByNodeID(nodeID).getConnections(
        {
            target: nodeID
        });

        var parentScores = [];

        if (connections.length === 0) //if this node has no parents, then the scores are the default value.
        {
            var defaultScore = {};

            for (var pId in Metadata.metaObject.parameters.byId)
            {
                var param = Metadata.metaObject.parameters.byId[pId];

                defaultScore[param.name] = {
                    min: param.initialValue,
                    max: param.initialValue
                };
            }

            parentScores.push(defaultScore);
        }

        var i;
        var returnScores = []; //The values to be returned.
        var nodeEffects = Main.nodes[nodeID].parameters; //The effects this node has on the parameters
        var effectParams = [];

        for (i in nodeEffects) //Get the effects this node has on the parameters.
        {
            var paremeter = Metadata.metaObject.parameters.byId[nodeEffects[i].idRef];
            effectParams[paremeter.name] =
            {
                changeType: nodeEffects[i].changeType,
                value: nodeEffects[i].value
            };
        }

        // Reused for-in-loop index variables
        var parName;

        for (i = 0; i < connections.length; i++)
        {
            if (memo[connections[i].sourceId] === undefined) //not calculated earlier.
            {
                var score = getScoreParents(connections[i].sourceId);
                parentScores.push(score); //Get the scores the parents have recursively.
                memo[connections[i].sourceId] = score;
            }
            else
            {
                parentScores.push(memo[connections[i].sourceId]);
            }
        }

        //Filter out the minimum and maximum out of the parents' scores.
        for (i = 0; i < parentScores.length; i++)
        {
            var parentScore = parentScores[i];
            for (parName in parentScore)
            {
                if (returnScores[parName] === undefined) //No value defined yet, get the one from the parent.
                {
                    returnScores[parName] = {
                        min: parentScore[parName].min,
                        max: parentScore[parName].max
                    };
                }
                else
                {
                    if (returnScores[parName].min > parentScore[parName]
                        .min || returnScores[parName].min === undefined
                    )
                    {
                        returnScores[parName].min = parentScore[parName]
                            .min;
                    }
                    if (returnScores[parName].max < parentScore[parName]
                        .max || returnScores[parName].max === undefined
                    )
                    {
                        returnScores[parName].max = parentScore[parName]
                            .max;
                    }
                }
            }
        }

        //Apply the effects the current node has to the score.
        for (parName in returnScores)
        {
            if (effectParams[parName] !== undefined)
            {
                if (effectParams[parName].changeType == "delta")
                {
                    returnScores[parName].min += effectParams[parName].value;
                    returnScores[parName].max += effectParams[parName].value;
                }
                else
                {
                    returnScores[parName].min = effectParams[parName].value;
                    returnScores[parName].max = effectParams[parName].value;
                }
            }
        }

        return returnScores;
    }
}());
