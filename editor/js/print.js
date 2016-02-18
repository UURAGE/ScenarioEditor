/*
//This program has been developed by students from the bachelor Computer Science at Utrecht University 
//within the Software and Game project courses 2013-2015
//©Copyright Utrecht University (Department of Information and Computing Sciences) 
*/

$(document).ready(function()
{
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
    
    $("#print").on('click', function()
    {
        // We need to be zoomed, otherwise the arrows will not be drawn
        if (!Zoom.isZoomed())
        {
            alert(LanguageManager.sLang("edt_print_warning"));
            return;
        }

        var treeDivList = document.getElementsByClassName("treeDiv");
        var htmlList = [];
        for (var i = 0; i < treeDivList.length; i++)
        {
            var treeDivContentList = treeDivList[i].getElementsByTagName("*");
            var name = document.getElementsByClassName('subjectName')[i].innerHTML;
            // Put the name, except the "[+]" or "[-]" before it, at the top of the page
            htmlList.push('<h1>' + name + '</h1>');
            // Begin a container div that contains the treeDiv and forces a page break upon printing
            htmlList.push(
                '<div class="container" style="page-break-after:always;position:relative;height:1px;">'
            );
            for (var j = 0; j < treeDivContentList.length; j++)
            {
                if (treeDivContentList[j].className !== '' &&
                    treeDivContentList[j].className !== 'ep' &&
                    treeDivContentList[j].className !== 'statementText' &&
                    treeDivContentList[j].className !== 'nodestatement' &&
                    treeDivContentList[j].className !== 'statementInput' &&
                    treeDivContentList[j].className !== 'imgDiv')
                    htmlList.push(treeDivContentList[j].outerHTML);
            }
            // End the container
            htmlList.push('</div>');
        }
        
        // Open a window for printing
        var printWindow = window.open('', '',
            'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0'
        );
        
        // Add style sheet references
        printWindow.document.write(
            '<link rel="stylesheet" type="text/css" href="/editor/css/stylesheet.css">' +
            '<link rel="stylesheet" type="text/css" href="/editor/css/jsPlumbStyle.css?">' +
            '<link rel="stylesheet" type="text/css" href="/editor/css/selectableStyle.css">' +
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
    });
});
