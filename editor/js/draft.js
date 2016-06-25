/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

(function()
{
    "use strict";

    var itemProperties = [],
        propEditors =
        {
            fallback: '<input tabindex="1" type="text">',
            type: '<select tabindex="1" class="type">' +
                '<option value="player">' + LanguageManager.sLang("edt_draft_letter_player") + '</option>' +
                '<option value="computer">' + LanguageManager.sLang("edt_draft_letter_computer") + '</option>' +
                '</select>',
            statement: '<textarea tabindex="1"></textarea>'
        },
        editing = null,
        editingCol = -1,
        maxCols = 0;

    $(document).ready(function()
    {
        $('#draftScreen').html(Parts.getDraftScreenHTML());

        itemProperties = $('#draftTable').data("properties").split(',');
        maxCols = itemProperties.length - 1;

        styleTableSpacing();

        // Resizability for the table columns
        $('#draftTable').colResizable(
        {
            liveDrag: true
        });

        // Resizability for the whole panel
        $('#draftScreen').resizable(
        {
            containment: "parent",
            handles: "n",
            maxHeight: $('#content').height() / 2,
            minHeight: 100
        });

        // Click-to-edit functionality
        $('#draftTable').on("click",
            '.draftItem td:has(span.value):not(:has(:input:focus))',
            function()
            {
                var tr = $(this).closest('tr'),
                    value = $(this).find('.value'),
                    edit = $(this).find('.edit'),
                    editField = edit.children();

                if (!$(this).hasClass("disabled"))
                {
                    if (value.html() !== "")
                    {
                        editField.val(value.html());
                    }
                    value.hide();
                    edit.show();
                    editField.trigger("focus");

                    editing = tr;
                    editingCol = parseInt($(this).attr("class")
                        .split(" ")[1].substr(3), 10);
                }
            });

        // Save property value on blur
        $('#draftTable').on("blur", ':input:not(select)',
            function()
            {
                saveOnBlur($(this));
            });

        // Save select values on change
        $('#draftTable').on("change", 'select', function()
        {
            var tr = $(this).closest('tr'),
                item = tr.data('item'),
                property = $(this).parents('td').attr("class").split(" ")[0],
                value = $(this).val(),
                playerOnlyCols =
                [
                    itemProperties.indexOf("effect")
                ];

            item.properties[property] = value;

            // Disable / enable player-only properties
            if ($(this).hasClass("type"))
            {
                var playerOnlySel = '.col' + playerOnlyCols.join(", .col");
                var playerOnlyTds = tr.find(playerOnlySel);
                if (value === "computer")
                {
                    playerOnlyTds.addClass("disabled");
                    playerOnlyTds.append(
                        '<span class="disabled-text">'+LanguageManager.sLang("edt_draft_not_available")+'</span>'
                    );
                }
                if (value === "player")
                {
                    playerOnlyTds.removeClass("disabled");
                    playerOnlyTds.find('.disabled-text').remove();
                }
            }

            editing = null;
            editingCol = -1;
        });

        // for all nodes together
        // Drag & drop into main container
        $('#draftDragAll').on("mousedown", function(e)
        {
            // Make sure key shortcut events can be fired tp cancel the dragbox
            $("#main").focus();

            e.preventDefault(); // Prevent selecting text

            if (!Zoom.isZoomed())
            {
                DragBox.showError(e, LanguageManager.sLang("edt_draft_no_subject_open"));
                return;
            }

            if (allIsEmpty())
            {
                DragBox.showError(e, LanguageManager.sLang("edt_draft_no_filled_items"));
                return;
            }

            if (editing) editing.find(':input:focus').trigger("blur");

            var text = LanguageManager.sLang("edt_draft_all_items");
            DragBox.startDragging(e, text, function(pos)
            {
                var nodes = allItemsToNodes(),
                    main = $('#main').offset(),
                    min = main.top + 51;
                nodes.forEach( function(node)
                {
                    var xdif = -75 + 150 * Math.random(), ydif = -75 + 150 * Math.random();
                    var nodePos = {
                        left : Math.max(0,pos.left + xdif),
                        top : Math.max(pos.top + ydif, min)
                    };
                    $('#' + node.id).offset(nodePos);
                });
                return true;
            });
        });

        // for the single nodes:
        // Drag & drop into main container
        $('#draftTable').on("mousedown", 'td.dragHandle', function(e)
        {
            // Make sure key shortcut events can be fired tp cancel the dragbox
            $("#main").focus();

            e.preventDefault(); // Prevent selecting text

            if (!Zoom.isZoomed())
            {
                DragBox.showError(e, LanguageManager.sLang("edt_draft_no_subject_open"));
                return;
            }

            var tr = $(this).closest('tr');
            if (isItemEmpty(tr))
            {
                DragBox.showError(e, LanguageManager.sLang("edt_draft_empty_item"));
                return;
            }

            tr.find(':input:focus').trigger("blur");

            var stmt = tr.data('item').properties.statement.trimToLength(25);
            var index = $('#draftTable tr.draftItem').index(tr);
            var text = LanguageManager.fLang("edt_draft_item_number", [parseInt(index, 10) + 1]) +
                (stmt === "" ? "" : " " + stmt);

            if (DragBox.isDroppable())
            {
                tr.find('td').addClass("disabled");
            }
            else
            {
                tr.find('td').removeClass("disabled");
            }
            DragBox.startDragging(e, text, function(pos)
            {
                var node = itemToNode(tr);
                $('#' + node.id).offset(pos);
                return true;
            });
        });

        // Keydown events
        $(document).keydown(function(e)
        {
            var tr = editing,
                col = editingCol;

            if (editing)
            {

                // ENTER
                if (e.which === 13)
                {

                    e.preventDefault();

                    tr.find('.col' + col + ' :input').trigger("blur");

                    // + CTRL
                    if (e.ctrlKey)
                    {
                        // + SHIFT
                        if (e.shiftKey)
                        {
                            // Make nodes of all items
                            allItemsToNodes();
                        }
                        else
                        {
                            // Makes node of current item
                            itemToNode(tr);
                        }
                    }
                    else if (!e.shiftKey)
                    {
                        // Next row
                        var next = tr.next();

                        if (next.length === 0)
                        {
                            createDraftItem();
                            next = tr.next();
                        }
                        col = 1;

                        next.find('.col' + col).trigger("click");
                    }
                }
                // CTRL + DELETE
                else if (e.ctrlKey && e.which === 46)
                {
                    // Removes current item

                    tr.prev().find('.col1').trigger("click");

                    removeItem(tr);
                }
                // TAB
                else if (e.which === 9)
                {
                    // Go to next/previous column
                    e.preventDefault();

                    tr.find('.col' + col + ' :input').trigger("blur");

                    // + SHIFT
                    var obj;
                    if (e.shiftKey)
                    {
                        // Previous
                        obj = prevCol({tr: tr, col: col});
                    }
                    else
                    {
                        // Next
                        obj = nextCol({tr: tr, col: col});
                    }
                    obj.tr.find('td.col' + obj.col).trigger("click");
                }
            }
        });

        // Item control functionality
        $('#addDraftItem').on("click", function(e)
        {
            e.preventDefault();
            createDraftItem();
        });
        $('#itemControls .clear').on("click", function(e)
        {
            e.preventDefault();
            clearTable();
        });

        // Button functionality
        $('#toggleDraftScreen').on("click", function()
        {
            $('#draftScreen').show();
            $('#validationReport').hide();
            $('#tabDock').show();
        });
    });

    // Utils

    // SHIFT + TAB function while editing draft
    function prevCol(obj)
    {
        obj.col -= 1;
        if (obj.col < 1)
        {
            var prev = obj.tr.prev();
            if (prev.length === 0)
            {
                obj.col = 1;
                return obj;
            }
            obj.tr = prev;
            obj.col = maxCols;
        }
        var field = obj.tr.find('.col' + obj.col);
        // recursion to skip cols that are disabled or contain a select element
        if (field.hasClass("disabled") || field.find("select").length > 0)
            obj = prevCol(obj);

        return obj;
    }

    // TAB function while editing draft
    function nextCol(obj)
    {
        obj.col += 1;
        if (obj.col > maxCols)
        {
            var next = obj.tr.next();
            if (next.length === 0)
            {
                obj.tr = createDraftItem();
            }
            else
            {
                obj.tr = next;
            }
            obj.col = 0;
        }
        var field = obj.tr.find('.col' + obj.col);
        // recursion to skip cols that are disabled or contain a select element
        if (field.hasClass("disabled") || field.find("select").length > 0)
            obj = nextCol(obj);

        return obj;
    }

    // String max length trimmer
    String.prototype.trimToLength = function(m)
    {
        if (this.length > m)
        {
            return jQuery.trim(this).substring(0, m)
                .split(" ").slice(0, -1).join(" ") + "...";
        }
        return this;
    };

    // Dynamically style the table depending on the amount of properties
    function styleTableSpacing()
    {
        var wt = $('#content').width(),
            w0 = 45 / wt * 100,
            wh = 35 / wt * 100,
            wp = w0 + wh,
            w = (100 - wp) / (itemProperties.length - 1),
            style = "#draftTable td,#draftTable th{width:" + w + "%}";
        style += " #draftTable td.col0,#draftTable th.col0{width:" + w0 +
            "%;} ";
        style +=
            " #draftTable td.dragHandle,#draftTable th.dragHandle{width:" +
            wh + "%;}";

        $('#draftStyle').append(style);
    }

    // Style the table rows with zebra striping
    // Avoiding CSS3 for the sake of compatibility
    function styleTableRows()
    {
        var i = 0;

        $('tr.draftItem').removeClass("odd").removeClass("even");
        $('tr.draftItem').each(function()
        {
            $(this).addClass(i % 2 === 1 ? "odd" : "even");
            i += 1;
        });
    }

    // Creating an empty draft item and adding it to the table
    // Returns the item as an object
    function createDraftItem(ignore)
    {
        var item = {
            properties: {},
            toHtml: function()
            {
                var i, p, e,
                    html = '<tr class="draftItem">';
                html += '<td class="dragHandle">::::::</td>';

                for (i = 0; i < itemProperties.length; i += 1)
                {
                    p = itemProperties[i];
                    e = propEditors[p] === undefined ?
                        propEditors.fallback : propEditors[p];

                    if (e.indexOf('<select') !== -1)
                    {
                        html += '<td class="' + p + ' col' + i + '">' + e + '</td>';
                    }
                    else
                    {
                        html += '<td class="' + p + ' col' + i + '"><span class="value">' + this.properties[
                                p] + '</span>';
                        html +=
                            '<span class="edit" style="display:none">' +
                            e + '</span></td>';
                    }
                }

                return html + "</tr>";
            }
        };

        itemProperties.forEach(function(p)
        {
            item.properties[p] = "";
        });

        item.properties.type = "player";

        var tr = $(item.toHtml());
        tr.data('item', item);
        $('#draftTable').append(tr);
        styleTableRows();

        if (!ignore)
        {
            tr.find('.col1').trigger("click");
        }

        return tr;
    }

    // Clear the table and remove all items
    function clearTable()
    {
        if (!confirm(LanguageManager.sLang("edt_draft_delete_all_confirm")))
        {
            return;
        }

        $('#draftTable tr.draftItem').remove();
        createDraftItem();
    }

    function saveOnBlur(input)
    {
        var tr = $(input).closest('tr'),
            item = tr.data('item'),
            property = input.parents('td').attr("class").split(" ")[0],
            value = input.val(),
            valueView = input.parent().siblings('.value');
        item.properties[property] = value;
        valueView.text(value);
        input.parent().hide();
        valueView.show();

        editing = null;
        editingCol = -1;
    }

    function removeItem(tr)
    {
        tr.remove();
        styleTableRows();

        if ($('#draftTable tr.draftItem').length === 0)
        {
            createDraftItem(true);
        }
    }

    function itemToNode(tr)
    {
        if (isItemEmpty(tr)) return;

        var props = tr.data('item').properties,
            node = Main.addNewNode(props.type);

        if (node === null)
        {
            // A tree container must be open.
            console.error("Item to node failed.");
            return;
        }
        // deselect the node before making changes in the object
        // (otherwise chages will be oversaved with empty values)
        Main.selectElement(null);
        node.text = props.statement;

        // make sure the starting input-text equals current saved node.text
        var nodeDiv = $("#"+node.id);
        var inputText = nodeDiv.find(".nodestatement");
        inputText.val(node.text);
        Main.changeNodeText(node.id);
        Main.selectElement(node.id);

        removeItem(tr);
        return node;
    }

    function allItemsToNodes()
    {
        var nodes = [];
        $('#draftTable .draftItem').each(function()
        {
            if (!isItemEmpty($(this)))
            {
                nodes.push(itemToNode($(this)));
            }
        });
        return nodes;
    }
    function allIsEmpty()
    {
        var allEmpty = true;
        $('#draftTable .draftItem').each(function()
        {
            allEmpty = allEmpty && isItemEmpty($(this));
        });
        return allEmpty;
    }

    function isItemEmpty(tr)
    {
        var props = tr.data('item').properties;
        for (var p in props)
        {
            if (props.hasOwnProperty(p) && p !== "type" && props[p] !== "")
            {
                return false;
            }
        }
        return true;
    }
}());
