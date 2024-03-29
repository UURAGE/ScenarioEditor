// © DialogueTrainer

(function()
{
    "use strict";

    const propEditors =
        {
            fallback: '<input tabindex="1" type="text">',
            type: '<select tabindex="1" class="type">' +
                '<option value="player">' + i18next.t('draft:letter.player') + '</option>' +
                '<option value="computer">' + i18next.t('draft:letter.computer') + '</option>' +
                '<option value="situation">' + i18next.t('draft:letter.situation') + '</option>' +
                '</select>'
        };

    let itemProperties = [],
        editing = null,
        editingCol = -1,
        maxCols = 0;

    $(function()
    {
        $("#draftScreen").append($('<div>', { id: "itemControls" }).append($('<button>', { class: "clear", text: i18next.t('draft:delete_all') })));
        $("#draftScreen").append($('<div>', { class: "tableScrollContainer" }).append(
            $('<table>', { id: "draftTable", data: { properties: "type,statement" } })
                .append($('<colgroup>')
                    .append($('<col>', { span: 1, style: "width: 15%;" }))
                    .append($('<col>', { span: 1, style: "width: 7.5%;" }))
                    .append($('<col>', { span: 1, style: "width: 35%;" }))
                    .append($('<col>', { span: 1, style: "width: 15%;" }))
                    .append($('<col>', { span: 1, style: "width: 10%;" }))
                    .append($('<col>', { span: 1, style: "width: 12.5%" }))
                )
                .append($('<tr>')
                    .append($('<th>', { class: "dragHandle noSelect", id: "draftDragAll", title: i18next.t('draft:drag_all'), text: "[[::]]" }))
                    .append($('<th>',
                        {
                            class: "col0",
                            title: i18next.t('common:player') + ' / ' + i18next.t('common:computer') + ' / ' + i18next.t('common:situation'),
                            text: i18next.t('draft:letter.player') + '/' + i18next.t('draft:letter.computer') + '/' + i18next.t('draft:letter.situation')
                        }))
                    .append($('<th>', { class: "col1", text: i18next.t('common:statement') })))
        ));
        $("#draftScreen").append($('<button>', { id: "addDraftItem", class: "add", text: i18next.t('draft:add_item') }));

        propEditors.statement = '<textarea ' + 'maxlength=' + Config.container.settings.statement.type.maxLength + ' tabindex="1"></textarea>';
        itemProperties = $('#draftTable').data("properties").split(',');
        maxCols = itemProperties.length - 1;

        styleTableSpacing();

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
                const tr = $(this).closest('tr'),
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
            const tr = $(this).closest('tr'),
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
                const playerOnlySel = '.col' + playerOnlyCols.join(", .col");
                const playerOnlyTds = tr.find(playerOnlySel);
                if (value === "computer")
                {
                    playerOnlyTds.addClass("disabled");
                    playerOnlyTds.append(
                        '<span class="disabled-text">' + i18next.t('draft:not_available') + '</span>'
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

        // For all nodes together
        // Drag & drop into main container
        $('#draftDragAll').on("mousedown", function(e)
        {
            // Make sure key shortcut events can be fired tp cancel the dragbox
            $("#main").focus();

            e.preventDefault(); // Prevent selecting text

            if (!Zoom.isZoomed())
            {
                DragBox.showError(e, i18next.t('draft:no_subject_open'));
                return;
            }

            if (allIsEmpty())
            {
                DragBox.showError(e, i18next.t('draft:no_filled_items'));
                return;
            }

            if (editing) editing.find(':input:focus').trigger("blur");

            const text = i18next.t('draft:all_items');
            DragBox.startDragging(e, text, function()
            {
                const dialoguePosition = Main.mousePositionToDialoguePosition(Main.mousePosition);
                if (dialoguePosition) allItemsToNodes(dialoguePosition);
                return true;
            });
        });

        // For the single nodes:
        // Drag & drop into main container
        $('#draftTable').on("mousedown", 'td.dragHandle', function(e)
        {
            // Make sure key shortcut events can be fired tp cancel the dragbox
            $("#main").focus();

            e.preventDefault(); // Prevent selecting text

            if (!Zoom.isZoomed())
            {
                DragBox.showError(e, i18next.t('draft:no_subject_open'));
                return;
            }

            const tr = $(this).closest('tr');
            if (isItemEmpty(tr))
            {
                DragBox.showError(e, i18next.t('draft:empty_item'));
                return;
            }

            tr.find(':input:focus').trigger("blur");

            const stmt = tr.data('item').properties.statement.trimToLength(25);
            const index = $('#draftTable tr.draftItem').index(tr);
            let text = i18next.t('draft:item_number', { number: index + 1 });
            if (stmt) text += ' ' + stmt;

            if (DragBox.isDroppable())
            {
                tr.find('td').addClass("disabled");
            }
            else
            {
                tr.find('td').removeClass("disabled");
            }
            DragBox.startDragging(e, text, function()
            {
                const dialoguePosition = Main.mousePositionToDialoguePosition(Main.mousePosition);
                if (dialoguePosition) itemToNode(tr, dialoguePosition);
                return true;
            });
        });

        // Keydown events
        $('#draftTable').keydown(function(e)
        {
            const tr = editing,
                col = editingCol;

            if (editing)
            {
                // ENTER
                if (e.which === 13)
                {
                    e.preventDefault();

                    tr.find('.col' + col + ' :input').trigger("blur");

                    // + CTRL
                    if (e.ctrlKey || e.metaKey)
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
                        let next = tr.next();

                        if (next.length === 0)
                        {
                            createDraftItem();
                            next = tr.next();
                        }

                        next.find('.col1').trigger("click");
                    }
                }
                // CTRL + DELETE
                else if ((e.ctrlKey || e.metaKey) && e.which === 46)
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
                    let obj;
                    if (e.shiftKey)
                    {
                        // Previous
                        obj = prevCol({ tr: tr, col: col });
                    }
                    else
                    {
                        // Next
                        obj = nextCol({ tr: tr, col: col });
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
            TabDock.close();
            TabDock.zoomOutHandler = TabDock.close;
            $('#draftScreen').show();
            $('#tabDock')
                .find('.title').text(i18next.t('draft:draft_title')).end()
                .find('.controls').empty().end()
                .show();
            $("#main").focus();
        });
    });

    // Utils

    // SHIFT + TAB function while editing draft
    function prevCol(obj)
    {
        obj.col -= 1;
        if (obj.col < 1)
        {
            const prev = obj.tr.prev();
            if (prev.length === 0)
            {
                obj.col = 1;
                return obj;
            }
            obj.tr = prev;
            obj.col = maxCols;
        }
        const field = obj.tr.find('.col' + obj.col);
        // Recursion to skip cols that are disabled or contain a select element
        if (field.hasClass("disabled") || field.find("select").length > 0) obj = prevCol(obj);

        return obj;
    }

    // TAB function while editing draft
    function nextCol(obj)
    {
        obj.col += 1;
        if (obj.col > maxCols)
        {
            const next = obj.tr.next();
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
        const field = obj.tr.find('.col' + obj.col);
        // Recursion to skip cols that are disabled or contain a select element
        if (field.hasClass("disabled") || field.find("select").length > 0) obj = nextCol(obj);

        return obj;
    }

    // String max length trimmer
    String.prototype.trimToLength = function(m)
    {
        if (this.length > m)
        {
            return this.trim().substring(0, m)
                .split(" ").slice(0, -1).join(" ") + "...";
        }
        return this;
    };

    // Dynamically style the table depending on the amount of properties
    function styleTableSpacing()
    {
        const wt = $('#content').width(),
            w0 = 45 / wt * 100,
            wh = 35 / wt * 100,
            wp = w0 + wh,
            w = (100 - wp) / (itemProperties.length - 1);

        let style = "#draftTable td,#draftTable th{width:" + w + "%}";
        style += " #draftTable td.col0,#draftTable th.col0{width:" + w0 + "%;} ";
        style += " #draftTable td.dragHandle,#draftTable th.dragHandle{width:" + wh + "%;}";

        $('#draftStyle').append(style);
    }

    // Creating an empty draft item and adding it to the table
    // Returns the item as an object
    function createDraftItem(ignore)
    {
        const item = {
            properties: {},
            toHtml: function()
            {
                let html = '<tr class="draftItem">';
                html += '<td class="dragHandle noSelect">::::::</td>';

                for (let i = 0; i < itemProperties.length; i += 1)
                {
                    const p = itemProperties[i];
                    const e = propEditors[p] === undefined ?
                        propEditors.fallback : propEditors[p];

                    if (e.includes('<select'))
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

        const tr = $(item.toHtml());
        tr.data('item', item);
        $('#draftTable').append(tr);

        if (!ignore)
        {
            tr.find('.col1').trigger("click");
        }

        return tr;
    }

    // Clear the table and remove all items
    function clearTable()
    {
        Utils.confirmDialog(i18next.t('draft:delete_all_confirm'), 'warning').then(function(confirmed)
        {
            if (confirmed)
            {
                $('#draftTable tr.draftItem').remove();
                createDraftItem();
            }
        });
    }

    function saveOnBlur(input)
    {
        const tr = $(input).closest('tr'),
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

        if ($('#draftTable tr.draftItem').length === 0)
        {
            createDraftItem(true);
        }
    }

    function itemToNode(tr, position)
    {
        if (isItemEmpty(tr)) return;

        if (!position)
        {
            position =
            {
                left: Zoom.getZoomed().div.scrollLeft(),
                top: Zoom.getZoomed().div.scrollTop()
            };
        }

        const props = tr.data('item').properties,
            node = Main.addNewNode(props.type, props.statement, position);

        if (node === null)
        {
            // A tree container must be open.
            console.error("Item to node failed.");
            return;
        }

        removeItem(tr);
    }

    function allItemsToNodes(position)
    {
        $('#draftTable .draftItem').each(function()
        {
            if (!isItemEmpty($(this)))
            {
                if (position)
                {
                    const deltaX = -75 + 150 * Math.random(), deltaY = -75 + 150 * Math.random();
                    itemToNode($(this),
                    {
                        left: Math.max(position.left + deltaX, 0), top: Math.max(position.top + deltaY, 0)
                    });
                }
                else
                {
                    itemToNode($(this));
                }
            }
        });
    }

    function allIsEmpty()
    {
        let allEmpty = true;
        $('#draftTable .draftItem').each(function()
        {
            allEmpty = allEmpty && isItemEmpty($(this));
        });
        return allEmpty;
    }

    function isItemEmpty(tr)
    {
        const props = tr.data('item').properties;
        for (const p in props)
        {
            if (Object.prototype.hasOwnProperty.call(props, p) && p !== "type" && props[p] !== "")
            {
                return false;
            }
        }
        return true;
    }
})();
