/* © Utrecht University and DialogueTrainer */

/* exported Print */
var Print;

(function()
{
    "use strict";

    // eslint-disable-next-line no-global-assign
    Print =
    {
        printScenario: printScenario
    };

    $(function()
    {
        $("#print").on('click', function()
        {
            printScenario();
        });
    });

    function printScenario()
    {
        // Open a window for printing
        var printWindow = window.open(
            '',
            '',
            'left=0,top=0,width=800,height=900,toolbar=0,status=0'
        );
        printWindow.document.write('<!DOCTYPE html><html><head></head><body></body></html>');
        printWindow.document.close();

        printWindow.document.title = document.title;
        printWindow.document.body.classList.add('print');

        // Add style sheet references
        $('head > link').each(function()
        {
            if (this.rel !== 'stylesheet') return;
            var newStyleSheet = printWindow.document.createElement('link');
            newStyleSheet.rel = 'stylesheet';
            newStyleSheet.type = 'text/css';
            newStyleSheet.href = this.href;
            printWindow.document.head.appendChild(newStyleSheet);
        });

        // Add a progress bar
        var progressBar = printWindow.document.createElement('progress');
        printWindow.document.body.appendChild(progressBar);

        // Add a result container
        var resultContainer = printWindow.document.createElement('div');
        resultContainer.style.visibility = 'hidden';
        printWindow.document.body.appendChild(resultContainer);

        // Create a step for each tree
        var steps = $('#main > .treeContainer').map(function()
        {
            return function()
            {
                // Zoom in and out to create correct HTML for nodes and connections
                if (!Main.trees[this.id].zoomedInBefore)
                {
                    Zoom.zoomIn(Main.trees[this.id]);
                    Zoom.zoomOut();
                }
                var treeDiv = $(this).find('.treeDiv');
                var name = $(this).find('.subjectName').text();

                // Put the name at the top of the page
                var heading = printWindow.document.createElement('h1');
                heading.textContent = name;
                resultContainer.appendChild(heading);
                // Create a container div for the tree's elements
                var treeContainer = printWindow.document.createElement('div');
                treeContainer.classList.add('container');
                // Loop over the contents of the tree div and copy the relevant HTML
                $(treeDiv).children().each(function()
                {
                    var outerHTML = this.outerHTML;
                    if (outerHTML && this.className)
                    {
                        // If it's a statement we need to loop over its contents and add only the relevant HTML
                        if (this.classList.contains('player') ||
                            this.classList.contains('computer') ||
                            this.classList.contains('situation'))
                        {
                            // Manually add the inner HTML
                            var htmlList = [];
                            outerHTML = outerHTML.slice(0, outerHTML.indexOf(this.innerHTML));
                            htmlList.push(outerHTML);
                            $(this).children().each(function()
                            {
                                if (this.className !== 'ep' &&
                                    this.className !== 'nodestatement' &&
                                    this.className !== 'statementInput')
                                {
                                    htmlList.push(this.outerHTML);
                                }
                            });
                            htmlList.push('</div>');
                            treeContainer.insertAdjacentHTML('beforeend', htmlList.join(''));
                        }
                        else if (this.className.baseVal === 'jtk-connector')
                        {
                            treeContainer.insertAdjacentHTML('beforeend', outerHTML);
                        }
                    }
                    // The outerHTML for SVG is not supported in IE and ME, because the HTMLElement is an SVGSVGElement
                    // http://stackoverflow.com/questions/12865025/convert-svgsvgelement-to-string
                    else if (!outerHTML && this.className.baseVal === 'jtk-connector')
                    {
                        var svgHTML = new XMLSerializer().serializeToString(this);
                        treeContainer.insertAdjacentHTML('beforeend', svgHTML);
                    }
                });
                resultContainer.appendChild(treeContainer);

                // Set the height to include all bounding rectangles
                var containerHeight = treeContainer.getBoundingClientRect().top;
                var maxHeight = 0;
                Array.prototype.forEach.call(treeContainer.getElementsByTagName('div'), function(div)
                {
                    var newHeight = div.getBoundingClientRect().bottom - containerHeight;
                    if (newHeight > maxHeight)
                    {
                        maxHeight = newHeight;
                    }
                });
                treeContainer.style.height = maxHeight + 'px';
            }.bind(this);
        }).get();

        // Add a step for showing the result and opening the print dialog
        steps.push(function()
        {
            printWindow.document.body.removeChild(progressBar);
            resultContainer.style.visibility = '';
            printWindow.focus();
            printWindow.setTimeout(function() { printWindow.print(); }, 100);
        });

        var doStep = function(stepIndex)
        {
            steps[stepIndex]();
            progressBar.value = (stepIndex + 1) / (steps.length - 1);
            if (stepIndex < steps.length - 1) setTimeout(doStep, 0, stepIndex + 1);
        };

        var start = function()
        {
            if (printWindow.started) return;
            printWindow.started = true;
            doStep(0);
        };

        // Run start after the document and all resources have finished loading,
        // regardless of whether the load event has already been fired
        printWindow.onload = start;
        if (printWindow.document.readyState === 'complete') start();
    }
})();
