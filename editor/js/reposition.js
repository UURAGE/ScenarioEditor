/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

(function()
{
    $(document).ready(function()
    {
        // Event handlers.
        $("#repositionGraph").on('click', function()
        {
            var tree = Zoom.getZoomed();
            if (!tree) return;

            // Return if there is no start node.
            var startNodeIDs = Save.getStartNodeIDs(tree);
            if(startNodeIDs[0] === -1) { return; }

            Main.unsavedChanges = true;

            // First we distribute the nodes vertically based on the longest path to the Node.
            var verticalOrder =
                distributeNodesVertically(
                    tree);
            // Next we try to find a way to place the nodes horizontally to minimize edge crossings.
            var optimizedOrder =
                optimizeHorizontalDistribution(
                    verticalOrder);
            // Reposition the jsPlumb nodes based on the optimizedOrder, we suspend drawing while moving the nodes.
            Load.suspendedly(
                repositionNodes, tree.plumbInstance)(
                optimizedOrder);
            // Redraw zoomed tree to reflect all the changes.
            Main.repaintZoomedNodes();
        });
    });

    function distributeNodesVertically(tree)
    {
        // Find a topological ordering of the nodes.
        var topOrd = findTopologicalOrdering(tree);
        // Give each node a rank (equal to the length of the longest path to the node from the source).
        giveNodesRanks(topOrd, tree.plumbInstance);
        // Sort the topological ordering based on the ranks of the nodes.
        var topOrdSortedByRank = topOrd.sort(compareRanks);
        // Create the virtual node network, refer to the documentation for more details.
        return addVirtualNodes(topOrdSortedByRank, tree.plumbInstance);
    }

    function optimizeHorizontalDistribution(order)
    {
        var best = shallowArrayOfArraysCopy(order);
        // Perform wmedian a set amount of times (as many as dot does), to optimize the node placements within ranks.
        for (var i = 0; i < 24; i++)
        {
            wmedian(order, i);
            transpose(order);
            if (crossings(order) < crossings(best))
            {
                best = shallowArrayOfArraysCopy(order);
            }
        }
        return best;
    }

    // transpose switches the placement of two nodes, checks if the situation has improved, and reverts it otherwise.
    function transpose(order)
    {
        for (var i = 0; i < order.length; i++)
        {
            var oldCrossings = crossingsWithNextRow(order, i - 1) +
                crossingsWithNextRow(order, i);
            for (var j = 0; j < order[i].length - 1; j++)
            {
                swap(order[i], j, j + 1);
                var newCrossings = crossingsWithNextRow(order, i - 1) +
                    crossingsWithNextRow(order, i);
                if (newCrossings < oldCrossings)
                {
                    oldCrossings = newCrossings;
                }
                else
                {
                    swap(order[i], j, j + 1);
                }
            }
        }
    }

    function swap(array, pos1, pos2)
    {
        var swapVar = array[pos1];
        array[pos1] = array[pos2];
        array[pos2] = swapVar;
    }

    function shallowArrayOfArraysCopy(toBeCopied)
    {
        var output = [];
        for (var i = 0; i < toBeCopied.length; i++)
        {
            output.push([].concat(toBeCopied[i]));
        }
        return output;
    }

    function crossings(virtualNodeNetwork)
    {
        var runningTotal = 0;
        for (var i = 0; i < virtualNodeNetwork.length - 1; i++)
        {
            runningTotal += crossingsWithNextRow(virtualNodeNetwork, i);
        }
        return runningTotal;
    }

    // Calculates the amount of crossings of edges between a given row and the next.
    function crossingsWithNextRow(virtualNodeNetwork, rowNumber)
    {
        if (rowNumber < 0 || virtualNodeNetwork.length - 2 < rowNumber)
        {
            return 0;
        }
        for (var i = 0; i < virtualNodeNetwork[rowNumber + 1].length; i++)
        {
            virtualNodeNetwork[rowNumber + 1][i].positionInRank = i;
        }

        var listOfChildPositions = [];
        for (var j = 0; j < virtualNodeNetwork[rowNumber].length; j++)
        {
            var childrenPositions = virtualNodeNetwork[rowNumber][j].topologicalChildren
                .map(function(child)
                {
                    return child.positionInRank;
                });
            var childrenPositionsSorted = childrenPositions.sort(
                function(a, b)
                {
                    return a - b;
                });
            listOfChildPositions = listOfChildPositions.concat(
                childrenPositionsSorted);
        }
        return countUnorderedPairs(listOfChildPositions, 0,
            listOfChildPositions.length);
    }

    // Uses divide and conquer in order to calculate the unordered pairs in O(n log n) time. Very similar to MergeSort.
    function countUnorderedPairs(inputList, start, end)
    {
        if (end - start < 2)
        {
            return 0;
        }
        // Divide into two halves.
        var mid = Math.floor((start + end) / 2);
        var leftCrossings = countUnorderedPairs(inputList, start, mid);
        var rightCrossings = countUnorderedPairs(inputList, mid, end);

        var centerCrossings = 0;
        var sortedArray = [];
        var leftPointer = start;
        var rightPointer = mid;
        // The left and right list are both sorted from the previous step.
        while (leftPointer < mid && rightPointer < end)
        {
            // If the left side is smaller, then this is an ordered pair, thus this does not give an intersection.
            if (inputList[leftPointer] <= inputList[rightPointer])
            {
                sortedArray.push(inputList[leftPointer]);
                leftPointer++;
            }
            // If the left side is larger, then we have a number of intersections equal to the amount of elements still left in the left array.
            else
            {
                centerCrossings += mid - leftPointer;
                sortedArray.push(inputList[rightPointer]);
                rightPointer++;
            }
        }

        // If one array is empty, add the rest of the other array.
        if (leftPointer < mid)
        {
            sortedArray = sortedArray.concat(inputList.slice(
                leftPointer, mid));
        }
        else
        {
            if (rightPointer < end)
            {
                sortedArray = sortedArray.concat(inputList.slice(
                    rightPointer, end));
            }
        }
        for (var i = start; i < end; i++)
        {
            inputList[i] = sortedArray[i - start];
        }
        return leftCrossings + centerCrossings + rightCrossings;
    }

    // This function uses an heuristic to sort the nodes within the ranks to avoid crossing edges in the graph.
    // It sorts every row by the index of the median parent or child of every node in their row.
    function wmedian(virtualNodeNetwork, iteratie)
    {
        // Every iteration we switch from visiting the ranks in ascending and descending order.
        if (iteratie % 2 === 0)
        {
            // Here we visit the ranks is ascending order, starting at rank 1, because the nodes in rank 0 don't have parents.
            for (var i = 1; i < virtualNodeNetwork.length; i++)
            {
                for (var j = 0; j < virtualNodeNetwork[i].length; j++)
                {
                    // For each node, calculate the median value of the index of it's parents.
                    virtualNodeNetwork[i][j].topologicalmedianValue =
                        median_value(virtualNodeNetwork,
                            virtualNodeNetwork[i][j], true);
                }
                // Sort the row based on the values just calculated.
                virtualNodeNetwork[i].sort(function(a, b)
                {
                    return a.topologicalmedianValue - b.topologicalmedianValue;
                });
            }
        }
        else
        {
            // Here we visit the ranks is descending order, starting at the second to last rank, because the nodes in the last rank don't have children.
            for (var k = virtualNodeNetwork.length - 2; k >= 0; k--)
            {
                for (var l = 0; l < virtualNodeNetwork[k].length; l++)
                {
                    // For each node, calculate the median value of the index of its children.
                    virtualNodeNetwork[k][l].topologicalmedianValue =
                        median_value(virtualNodeNetwork,
                            virtualNodeNetwork[k][l], false);
                }
                // Sort the row based on the values just calculated.
                virtualNodeNetwork[k].sort(function(a, b)
                {
                    return a.topologicalmedianValue - b.topologicalmedianValue;
                });
            }
        }
    }

    // This function takes all the neighbours (defined as either parents or children, based on the 'parents' bool),
    // and returns the position of the median neighbour in the row above/below.
    function median_value(virtualNodeNetwork, node, parents)
    {
        var P;
        // Either look at the level above this one (parents), or look at the level below this one (!parents, or children).
        if (parents)
        {
            // At rank 0, no node has a parent, so it return infinity to signal 'just put it on the right side of the nodeslist'.
            // Luckily, there is always only one node with rank 0.
            if (node.topologicalRank <= 0)
            {
                return Infinity;
            }
            var rowAbove = virtualNodeNetwork[node.topologicalRank - 1];
            // Here we create an array which contains the positions of the parents of this node in the row above.
            P = rowAbove.map(function(aboveElem, index)
            {
                // If this element of rowAbove is a parent, return its index. Else return the sentinel value '-1'.
                if (node.topologicalParent.some(function(
                        parentElem)
                    {
                        return parentElem == aboveElem;
                    }))
                {
                    return index;
                }
                else
                {
                    return -1;
                }
                // Remove the sentinel values from the list.
            }).filter(function(elem)
            {
                return elem != -1;
            });
        }
        else
        {
            // The nodes in the bottom rank do not have children. So we return infinity to signal 'just put them to the right'.
            if (virtualNodeNetwork.length - 1 <= node.topologicalRank)
            {
                return Infinity;
            }
            var rowBelow = virtualNodeNetwork[node.topologicalRank + 1];
            // Here we create an array which contains the positions of the children of this node in the row below.
            P = rowBelow.map(function(belowElem, index)
            {
                // If this node is a child of the current node, we return its index. Else we return a sentinel value of -1.
                if (node.topologicalChildren.some(function(
                        childElem)
                    {
                        return childElem == belowElem;
                    }))
                {
                    return index;
                }
                else
                {
                    return -1;
                }
                // Remove all sentinel values from the list.
            }).filter(function(elem)
            {
                return elem != -1;
            });
        }
        // If there aren't any children, just put the node on the right side of the list.
        if (P.length === 0)
        {
            return Infinity;
        }

        // If there are an even amount of parents/children, return the position of the middle one.
        var m = Math.floor(P.length / 2);
        if (P.length % 2 == 1)
        {
            return P[m];
        }
        // If there are exactly 2 parents/children, return the avarage position of the 2.
        if (P.length == 2)
        {
            return Math.floor((P[0] + P[1]) / 2);
        }

        // If there are a larger, even amount of parents/children, pick a weighted avarage of the 2 middle nodes,
        // favouring the side where the neighbours are closer together.
        var left = P[m - 1] - P[0];
        var right = P[P.length - 1] - P[m];
        return (P[m - 1] * right + P[m] * left) / (left * right);
    }

    // First, this function places the nodes in an array of arrays, sperating the nodes by rank.
    // Then whenever a node is connected to another node with more than 1 rank difference, this adds virtual nodes between those nodes on every rank between them.
    function addVirtualNodes(topOrdSortedByRank, plumbInstance)
    {
        // We are going add an array in each node to save which children (including virtual nodes) it has and which parents.
        // First we initialise (and/or empty) those arrays.
        for (var i = 0; i < topOrdSortedByRank.length; i++)
        {
            Main.nodes[topOrdSortedByRank[i]].topologicalParent = [];
            Main.nodes[topOrdSortedByRank[i]].topologicalChildren = [];
        }

        // In the following for-loop, we add all nodes to an array of arrays, based on their rank.
        // Also we fill their topologicalParent and topologicalChildren attributes with their parents and children.
        // For now, this only includes the 'real' nodes, we add the virtual nodes later.
        var virtualNodeNetwork = [];
        var currentRank = -1;

        var connectionToNode = function(connection)
        {
            return Main.nodes[connection.targetId];
        };
        var currentNode;

        for (var j = 0; j < topOrdSortedByRank.length; j++)
        {
            currentNode = Main.nodes[topOrdSortedByRank[j]];
            // The nodes are already ordered by rank, so we only need to check if we are at a new rank.
            if (currentNode.topologicalRank != currentRank)
            {
                // When we are at a new rank, we update the currentRank and add a new array.
                currentRank = currentNode.topologicalRank;
                virtualNodeNetwork.push([]);
            }
            // We add the node to the array matching it's rank.
            virtualNodeNetwork[currentNode.topologicalRank].push(
                currentNode);
            // We set the array of it's children. We want the nodes themselves, not the IDs in this array, so we map over this array to get them.
            currentNode.topologicalChildren = plumbInstance.getConnections(
            {
                source: topOrdSortedByRank[j]
            }).map(connectionToNode);
            // To every child, we add this node as a parent.
            for (var k = 0; k < currentNode.topologicalChildren.length; k++)
            {
                currentNode.topologicalChildren[k].topologicalParent.push(currentNode);
            }
        }

        // In this for-loop, we add all the virtual nodes.
        for (var l = 0; l < virtualNodeNetwork.length; l++)
        {
            for (var m = 0; m < virtualNodeNetwork[l].length; m++)
            {
                // We loop over every node, starting at the nodes with the lowest rank.
                currentNode = virtualNodeNetwork[l][m];
                var childrenOfCurrentNode = currentNode.topologicalChildren;
                for (var n = 0; n < childrenOfCurrentNode.length; n++)
                {
                    // For every child of the currentNode, we check whether its rank differs more than 1 with the rank of the currentNode.
                    if (childrenOfCurrentNode[n].topologicalRank >
                        currentNode.topologicalRank + 1)
                    {
                        // If it does, we add a virtual node between them on the rank below this one.
                        // Note that we will visit this virtualNode when we loop over the next rank.
                        var virtualNode = 
                        {
                            topologicalChildren: 
                            [
                                childrenOfCurrentNode[n]
                            ],
                            topologicalParent: [currentNode],
                            topologicalRank: currentNode.topologicalRank + 1
                        };
                        virtualNodeNetwork[l + 1].push(virtualNode);
                        var locationOfCurrentNodeInChildsParentList =
                            childrenOfCurrentNode[n].topologicalParent.lastIndexOf(
                                currentNode);
                        childrenOfCurrentNode[n].topologicalParent[
                            locationOfCurrentNodeInChildsParentList
                        ] = virtualNode;
                        childrenOfCurrentNode[n] = virtualNode;
                    }
                }
            }
        }
        return virtualNodeNetwork;
    }

    // This function calculates the new position for each node based on its place in the virtualNodeNetwork and the moves the jsPlumb node.
    function repositionNodes(virtualNodeNetwork)
    {
        // The minimal margins between the nodes are hardcoded.
        var topMargin = 5; // The margin between the first row of nodes and the top of the screen.
        var leftMargin = 20; // The margin between the left most node and the left edge of the screen.
        var verticalMargin = 40; // The minimum margin between the rows of nodes.
        var horizontalMargin = 40; // The margin between 2 nodes in the same row.
        var maxYInThisRank = 0;
        var currentYOffset = topMargin;
        var currentXOffset = leftMargin;
        var currentNode;
        var currentNodeWidth;
        var maximumMinimalWidth = 0;
        var rowWidth = [];
        // We calculate the minimal width for every rank, and use the largest value as the width of our graph.
        for (var i = 0; i < virtualNodeNetwork.length; i++)
        {
            var width = 0;
            for (var j = 0; j < virtualNodeNetwork[i].length; j++)
            {
                currentNode = virtualNodeNetwork[i][j];
                currentNodeWidth = 0;
                if ('id' in currentNode)
                {
                    currentNodeWidth = $('#' + currentNode.id).outerWidth();
                }
                width += currentNodeWidth;
            }
            rowWidth.push(width);
            width += (virtualNodeNetwork[i].length - 1) *
                horizontalMargin;
            if (maximumMinimalWidth < width)
            {
                maximumMinimalWidth = width;
            }
        }

        // For each rank ...
        for (var k = 0; k < virtualNodeNetwork.length; k++)
        {
            // We check if the minimal width of this row is equal to the width of the graph.
            // If it isn't, we calculate the margins between the nodes of this rank.
            var widthLeft = maximumMinimalWidth - rowWidth[k] - (
                    virtualNodeNetwork[k].length - 1) *
                horizontalMargin;
            var marginForThisRow;
            if (widthLeft !== 0)
            {
                widthLeft += (virtualNodeNetwork[k].length - 1) *
                    horizontalMargin;
                marginForThisRow = widthLeft / virtualNodeNetwork[k].length;
                // We also add some space at the left and at the right of the row.
                currentXOffset += marginForThisRow / 2;
            }
            else
            {
                marginForThisRow = horizontalMargin;
            }
            // ... and each node in that rank ...
            for (var l = 0; l < virtualNodeNetwork[k].length; l++)
            {
                currentNode = virtualNodeNetwork[k][l];
                // ... if the node is a virtual node, just leave some space and then go to the next node.
                if (!('id' in currentNode))
                {
                    currentXOffset += marginForThisRow;
                    continue;
                }
                // If it isn't a virtual node, set the position of the node to the current offset.
                $('#' + currentNode.id).css(
                {
                    top: Math.floor(currentYOffset) + "px",
                    left: Math.floor(currentXOffset) + "px"
                });
                // Find the width and height of the node.
                currentNodeWidth = $('#' + currentNode.id).outerWidth();
                var currentNodeHeight = $('#' + currentNode.id).outerHeight();
                // Keep track of the maximum height of a node in this rank.
                if (maxYInThisRank < currentNodeHeight)
                {
                    maxYInThisRank = currentNodeHeight;
                }
                // Add the width of the current node and the margin necessary between nodes to the currentXOffset,
                // this is the X-position for the next node in this row.
                currentXOffset += currentNodeWidth + marginForThisRow;
            }
            // Initialise values for the next row. The next row starts back at the left margin.
            currentXOffset = leftMargin;
            // The next row starts lower, we add the maximum height of any element in this row, to make sure it doesn't overlap with the next row.
            currentYOffset += maxYInThisRank + verticalMargin;
            // The maximum height in the next rank starts back at 0.
            maxYInThisRank = 0;
        }
    }

    // A simple helper function to compare the ranks of 2 nodes. Used as input for the 'sort' function of array.
    function compareRanks(nodeIDA, nodeIDB)
    {
        return Main.nodes[nodeIDA].topologicalRank - Main.nodes[nodeIDB].topologicalRank;
    }

    // This function gives every node a rank (the longest path from the source node).
    function giveNodesRanks(topologicalOrdening, plumbInstance)
    {
        // Initialise every rank to minus infinity.
        $.each(topologicalOrdening, function(index, nodeID)
        {
            Main.nodes[nodeID].topologicalRank = 0;
        });
        // The source node has a distance of 0 to the source node.
        Main.nodes[topologicalOrdening[0]].topologicalRank = 0;
        // For every node, in topological order ...
        for (var i = 0; i < topologicalOrdening.length; i++)
        {
            //... take a look at every child of that node ...
            var connections = plumbInstance.getConnections(
            {
                source: topologicalOrdening[i]
            });
            for (var j = 0; j < connections.length; j++)
            {
                //... the new rank of the childnode is the maximum of its current rank and this parents rank + 1.
                // This means that the rank of every node is one bigger than the largest rank of any of it's parents.
                // This in turn is the length of the longest path to this node from the source.
                if (Main.nodes[connections[j].targetId].topologicalRank < (Main.nodes[topologicalOrdening[i]].topologicalRank + 1))
                {
                    Main.nodes[connections[j].targetId].topologicalRank = Main.nodes[topologicalOrdening[i]].topologicalRank + 1;
                }
            }
        }
    }

    // Find a topological ordering of 'nodes'. See: http: //en.wikipedia.org/wiki/Topological_ordering
    function findTopologicalOrdering(tree)
    {
        // Initially, no node has been visited.
        var topologicalOrderening = [];
        $.each(tree.nodes, function(index, nodeID)
        {
            //java script arrrays tend to have undefined elements because javascript.
            if(nodeID) //blame the internet, undefined is falsey
            {
                Main.nodes[nodeID].topologicalOrderingVisited = false;
            }
        });
        
        $.each(Save.getStartNodeIDs(tree), function(index, startNodeID)
        {
            // Recursively find a reversed topological ordering.
            findTopologicalOrderingRec(startNodeID, topologicalOrderening, tree.plumbInstance);
        });
        // Finding a reversed topological ordering (with children before parents) is easier to code,
        // so we find the reversed ordering and then reverse again to get the result we want.
        return topologicalOrderening.reverse();
    }

    // The recursive function to find the topological ordering.
    function findTopologicalOrderingRec(currentNodeID, topologicalOrderening, plumbInstance)
    {
        // If we haven't visited this node yet ...
        if (!Main.nodes[currentNodeID].topologicalOrderingVisited)
        {
            //... we have visited this node now.
            // While visiting this node we first make sure all children are added to topologicalOrderening, then we add the node itself.
            Main.nodes[currentNodeID].topologicalOrderingVisited = true;
            var connections = plumbInstance.getConnections(
            {
                source: currentNodeID
            });
            for (var i = 0; i < connections.length; i++)
            {
                findTopologicalOrderingRec(connections[i].targetId,
                    topologicalOrderening);
            }
            // Since topologicalOrderening is passed by reference, we don't need to return anything.
            topologicalOrderening.push(currentNodeID);
        }
    }
})();
