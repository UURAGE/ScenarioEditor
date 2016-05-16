/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

$(document).ready(function()
{
    $("#print").on('click', function()
    {
        printScript();
    });
});

function printScript()
{
    if (!confirm(LanguageManager.sLang("edt_print_warning"))) return;

    // This function is used to set the heights inside the window to be printed
    // and is called inside that window HTML on load
    var setHeights = function setHeights()
    {
        var containers = document.getElementsByClassName('container');
        for (var i = 0; i < containers.length; i++)
        {
            // Set the height to include all bounding rectangles
            var containerHeight = container.getBoundingClientRect().top;
            var maxHeight = 0;
            var divs = containers[i].getElementsByTagName('div');
            for (var j = 0; j < divs.length; j++)
            {
                var newHeight = divs[j].getBoundingClientRect().bottom - containers[i].getBoundingClientRect().top;
                if (newHeight > maxHeight)
                {
                    maxHeight = newHeight;
                }
            }
            containers[i].style.height = maxHeight;
        }
    };

    var htmlList = [];
    $('.treeContainer').each(function()
    {
        // Zoom in and out to create correct HTML for nodes and connections,
        // because jsPlumb does this dynamically when a tree is zoomed
        Zoom.zoomIn(Main.trees[this.id]);
        var treeDiv = $(this).children('.treeDiv')[0];
        var treeDivContentList = $(treeDiv).children();
        var name = $(this).find('.subjectName')[0].innerHTML;
        Zoom.zoomOut();

        // Put the name, except the "[+]" or "[-]" before it, at the top of the page
        htmlList.push('<h1>' + name + '</h1>');
        // Begin a container div that contains the treeDiv and forces a page break upon printing
        htmlList.push(
            '<div class="container" style="page-break-after:always;position:relative;height:1px;">'
        );
        for (var i = 0; i < treeDivContentList.length; i++)
        {
            var html = treeDivContentList[i].outerHTML;
            if (html && treeDivContentList[i].className !== '' &&
                treeDivContentList[i].className !== 'ep' &&
                treeDivContentList[i].className !== 'statementText' &&
                treeDivContentList[i].className !== 'nodestatement' &&
                treeDivContentList[i].className !== 'statementInput' &&
                treeDivContentList[i].className !== 'imgDiv')
                htmlList.push(html);
            // The outerHTML for SVG is not supported in IE and ME, because there the HTML element is an SVGSVGElement
            // http://stackoverflow.com/questions/12865025/convert-svgsvgelement-to-string
            else if (!html && treeDivContentList[i].className.baseVal === 'jsplumb-connector')
            {
                var svgHTML = (new XMLSerializer()).serializeToString(treeDivContentList[i]);
                htmlList.push(svgHTML);
            }
        }
        // End the container
        htmlList.push('</div>');
    });

    // Open a window for printing
    var printWindow = window.open
    (
     '',
     '',
     'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0'
    );

    // Add style sheet references
    for (var i = 0; i < document.styleSheets.length; i++)
    {
        printWindow.document.write
        (
            '<link rel="stylesheet" type="text/css" href="' + document.styleSheets[i].href + '">'
        );
    }
    printWindow.document.write
    (
        '<style type="text/css"> .w{ position:absolute; } circle{ display:none } </style>'
    );

    // Add the setHeights function javascript
    printWindow.document.write('<script type="text/javascript">' + setHeights + '</script>');

    // Begin a body that calls setHeights and print on load
    printWindow.document.write('<body onload="setHeights(); print();">');

    // Write all elements
    printWindow.document.write(htmlList.join(""));

    // Finish the body
    printWindow.document.write('</body>');

    printWindow.document.close();

    printWindow.focus();
}
