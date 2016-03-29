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
        [].forEach.call(document.getElementsByClassName('container'), function (container)
        {
            // Set the height to include all bounding rectangles
            var maxHeight = 0;
            [].forEach.call(container.getElementsByTagName('div'), function (div)
            {
                var newHeight = div.getBoundingClientRect().bottom - container.getBoundingClientRect().top;
                if (newHeight > maxHeight)
                {
                    maxHeight = newHeight;
                }
            });
            container.style.height = maxHeight;
        });
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
            if (treeDivContentList[i].className !== '' &&
                treeDivContentList[i].className !== 'ep' &&
                treeDivContentList[i].className !== 'statementText' &&
                treeDivContentList[i].className !== 'nodestatement' &&
                treeDivContentList[i].className !== 'statementInput' &&
                treeDivContentList[i].className !== 'imgDiv')
                htmlList.push(treeDivContentList[i].outerHTML);
        }            
        // End the container
        htmlList.push('</div>');
    });
    
    // Open a window for printing
    var printWindow = window.open('', '',
        'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0'
    );
    
    // Add style sheet references
    printWindow.document.write(
        '<link rel="stylesheet" type="text/css" href="/backend/editor/css/stylesheet.css">' +
        '<link rel="stylesheet" type="text/css" href="/backend/editor/css/jsPlumbStyle.css?">' +
        '<link rel="stylesheet" type="text/css" href="/backend/editor/css/selectableStyle.css">' +
        '<style type="text/css">.w{position:absolute;}circle{display:none}</style>'
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
