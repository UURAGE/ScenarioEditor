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
        Utils.confirmDialog(i18next.t('print:warning'), 'warning').done(function(confirmed)
        {
            if (confirmed)
            {
                var htmlList = [];
                $('#main > .treeContainer').each(function()
                {
                    // Zoom in and out to create correct HTML for nodes and connections,
                    // because jsPlumb does this dynamically when a tree is zoomed
                    if (!Main.trees[this.id].zoomedInBefore) Zoom.zoomIn(Main.trees[this.id]);
                    var treeDiv = $(this).find('.treeDiv')[0];
                    var treeDivContentList = $(treeDiv).children();
                    var name = $(this).find('.subjectName')[0].innerHTML;
                    if (!Main.trees[this.id].zoomedInBefore) Zoom.zoomOut();

                    // Put the name, except the "[+]" or "[-]" before it, at the top of the page
                    htmlList.push('<h1>' + name + '</h1>');
                    // Begin a container div that contains the treeDiv and forces a page break upon printing
                    htmlList.push('<div class="container" style="page-break-after:always;position:relative;height:1px;">');
                    // Loop over the contents of the tree div and put the relevant HTML in the htmlList
                    for (var i = 0; i < treeDivContentList.length; i++)
                    {
                        var outerHTML = treeDivContentList[i].outerHTML;
                        if (outerHTML && treeDivContentList[i].className)
                        {
                            // If it's a statement we need to loop over its contents and add only the relevant HTML
                            if (treeDivContentList[i].classList.contains('player') ||
                                treeDivContentList[i].classList.contains('computer') ||
                                treeDivContentList[i].classList.contains('situation'))
                            {
                                // Manually add the inner HTML
                                outerHTML = outerHTML.slice(0, outerHTML.indexOf(treeDivContentList[i].innerHTML));
                                htmlList.push(outerHTML);
                                var statementDivContentList = $(treeDivContentList[i]).children();
                                for (var j = 0; j < statementDivContentList.length; j++)
                                {
                                    if (statementDivContentList[j].className !== 'ep' &&
                                        statementDivContentList[j].className !== 'nodestatement' &&
                                        statementDivContentList[j].className !== 'statementInput')
                                    {
                                        htmlList.push(statementDivContentList[j].outerHTML);
                                    }
                                }
                                htmlList.push('</div>');
                            }
                            else
                            {
                                htmlList.push(outerHTML);
                            }
                        }
                        // The outerHTML for SVG is not supported in IE and ME, because the HTMLElement is an SVGSVGElement
                        // http://stackoverflow.com/questions/12865025/convert-svgsvgelement-to-string
                        else if (!outerHTML && treeDivContentList[i].className.baseVal === 'jtk-connector')
                        {
                            var svgHTML = new XMLSerializer().serializeToString(treeDivContentList[i]);
                            htmlList.push(svgHTML);
                        }
                    }
                    // End the container
                    htmlList.push('</div>');
                });

                // Open a window for printing
                var printWindow = window.open(
                    '',
                    '',
                    'left=0,top=0,width=800,height=900,toolbar=0,status=0'
                );

                // Add style sheet references
                for (var i = 0; i < document.styleSheets.length; i++)
                {
                    printWindow.document.write(
                        '<link rel="stylesheet" type="text/css" href="' + document.styleSheets[i].href + '">'
                    );
                }
                printWindow.document.write(
                    '<style type="text/css"> .w{ position:absolute; } circle{ display:none } </style>'
                );

                // Write the body
                printWindow.document.write('<body>');
                printWindow.document.write(htmlList.join(""));
                printWindow.document.write('</body>');

                printWindow.document.close();

                // This function is used to set the heights inside the window to be printed
                // and open the print dialog
                var initialise = function()
                {
                    if (printWindow.initialisationStarted) return;
                    printWindow.initialisationStarted = true;
                    Array.prototype.forEach.call(printWindow.document.getElementsByClassName('container'), function(container)
                    {
                        // Set the height to include all bounding rectangles
                        var containerHeight = container.getBoundingClientRect().top;
                        var maxHeight = 0;
                        Array.prototype.forEach.call(container.getElementsByTagName('div'), function(div)
                        {
                            var newHeight = div.getBoundingClientRect().bottom - containerHeight;
                            if (newHeight > maxHeight)
                            {
                                maxHeight = newHeight;
                            }
                        });
                        container.style.height = maxHeight;
                    });
                    printWindow.setTimeout(function() { printWindow.print(); }, 100);
                };

                // Run initialise after the document and all resources have finished loading,
                // regardless of whether the load event has already been fired
                printWindow.onload = initialise;
                if (printWindow.document.readyState === 'complete') initialise();

                printWindow.focus();
            }
        });
    }
})();
