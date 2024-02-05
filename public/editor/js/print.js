// © DialogueTrainer

/* exported Print */
let Print;

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
        const printWindow = window.open(
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
            const newStyleSheet = printWindow.document.createElement('link');
            newStyleSheet.rel = 'stylesheet';
            newStyleSheet.type = 'text/css';
            newStyleSheet.href = this.href;
            printWindow.document.head.appendChild(newStyleSheet);
        });

        // Add a progress bar
        const progressBar = printWindow.document.createElement('progress');
        printWindow.document.body.appendChild(progressBar);

        // Add a result container
        const resultContainer = printWindow.document.createElement('div');
        resultContainer.style.visibility = 'hidden';
        printWindow.document.body.appendChild(resultContainer);

        // Create a step for each tree
        const steps = $('#main > .treeContainer').map(function()
        {
            return () =>
            {
                // Zoom in and out to create correct HTML for nodes and connections
                if (!Main.trees[this.id].zoomedInBefore)
                {
                    Zoom.zoomIn(Main.trees[this.id]);
                    Zoom.zoomOut();
                }
                const treeDiv = $(this).find('.treeDiv');
                const name = $(this).find('.subjectName').text();

                // Put the name at the top of the page
                const heading = printWindow.document.createElement('h1');
                heading.textContent = name;
                resultContainer.appendChild(heading);
                // Create a container div for the tree's elements
                const treeContainer = printWindow.document.createElement('div');
                treeContainer.classList.add('container');
                // Loop over the contents of the tree div and copy the relevant elements
                $(treeDiv).children().each(function()
                {
                    // If it's a statement we need to loop over its contents and add only the relevant elements
                    if (this.classList.contains('player') ||
                        this.classList.contains('computer') ||
                        this.classList.contains('situation'))
                    {
                        const copiedElement = printWindow.document.importNode(this, false);
                        $(this).children().each(function()
                        {
                            if (this.className !== 'ep' &&
                                this.className !== 'nodestatement' &&
                                this.className !== 'statementInput')
                            {
                                copiedElement.appendChild(printWindow.document.importNode(this, true));
                            }
                        });
                        treeContainer.appendChild(copiedElement);
                    }
                    else if (this.className.baseVal === 'jtk-connector')
                    {
                        treeContainer.appendChild(printWindow.document.importNode(this, true));
                    }
                });
                resultContainer.appendChild(treeContainer);

                // Set the height to include all bounding rectangles
                const containerHeight = treeContainer.getBoundingClientRect().top;
                let maxHeight = 0;
                Array.prototype.forEach.call(treeContainer.getElementsByTagName('div'), function(div)
                {
                    const newHeight = div.getBoundingClientRect().bottom - containerHeight;
                    if (newHeight > maxHeight)
                    {
                        maxHeight = newHeight;
                    }
                });
                treeContainer.style.height = maxHeight + 'px';
            };
        }).get();

        // Add a step for showing the result and opening the print dialog
        steps.push(function()
        {
            printWindow.document.body.removeChild(progressBar);
            resultContainer.style.visibility = '';
            printWindow.focus();
            printWindow.setTimeout(function() { printWindow.print(); }, 100);
        });

        const doStep = function(stepIndex)
        {
            steps[stepIndex]();
            progressBar.value = (stepIndex + 1) / (steps.length - 1);
            if (stepIndex < steps.length - 1) setTimeout(doStep, 0, stepIndex + 1);
        };

        const start = function()
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
