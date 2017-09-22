/* © Utrecht University and DialogueTrainer */

var ColorPicker;

(function ()
{
    "use strict";

    ColorPicker =
    {
        key: {},
        showFor: showFor,
        areColorsEnabled: areColorsEnabled,
        applyColors: applyColors,
        removeColors: removeColors
    };

    var colors =
    [
        {
            name: "darkslategray",
            enabled: true
        },
        {
            name: "lightslategray",
            enabled: true
        },
        {
            name: "silver",
            enabled: true
        },
        {
            name: "whitesmoke",
            enabled: true
        },
        {
            name: "firebrick",
            enabled: true,
            entry: "Bad"
        },
        {
            name: "chocolate",
            enabled: true
        },
        {
            name: "goldenrod",
            enabled: true
        },
        {
            name: "limegreen",
            enabled: true,
            entry: "Good"
        },
        {
            name: "seagreen",
            enabled: true
        },
        {
            name: "royalblue",
            enabled: true
        },
        {
            name: "darkslateblue",
            enabled: true
        },
        {
            name: "indigo",
            enabled: true
        },
        {
            name: "coral",
            enabled: true
        },
        {
            name: "orange",
            enabled: true
        },
        {
            name: "gold",
            enabled: true
        },
        {
            name: "greenyellow",
            enabled: true
        },
        {
            name: "turquoise",
            enabled: true
        },
        {
            name: "dodgerblue",
            enabled: true,
            entry: "Alternative"
        },
        {
            name: "slateblue",
            enabled: true
        },
        {
            name: "palevioletred",
            enabled: true
        }
    ];

    $(document).ready(function()
    {
        resetKey();

        $("#toggleColors").on('click', toggleColors);
    });

    function resetKey()
    {
        ColorPicker.key = {
            byColor: colors.reduce(function(byColor, color)
            {
                byColor[color.name] = color;
                return byColor;
            }, {}),
            sequence: colors
        };
        ColorPicker.key.sequence.forEach(function(color)
        {
            if (!color.entry)
            {
                color.entry = Config.container.settings.colorKeyEntry.type.defaultValue;
            }
        });
    }

    function keyDialog()
    {
        var keyContainer = $('<div>');

        var keyTable = $('<table>').appendTo(keyContainer);
        var keyHeaderRow = $('<tr>').appendTo($('<thead>')).appendTo(keyTable);
        keyHeaderRow.append($('<th>')); // For the sortable handle
        keyHeaderRow.append($('<th>')); // For the enabled checkbox
        keyHeaderRow.append($('<th>', { text: i18next.t('colorPicker:color') }));
        keyHeaderRow.append($('<th>', { text: i18next.t('colorPicker:entry') }));
        var keyBody = $('<tbody>').appendTo(keyTable);
        ColorPicker.key.sequence.forEach(function(color)
        {
            var entryDataRow = $('<tr>').appendTo(keyBody);
            entryDataRow.append($('<td>', { class: "handle", text: "↕" }));

            var enabler = $('<input>', { type: 'checkbox' });
            enabler.prop("checked", color.enabled);
            enabler.on('change', function()
            {
                var confirmButton = keyContainer.parent().find(".confirmColors");
                if (!enabler.prop("checked"))
                {
                    var someColorEnabled = keyBody.children().map(function()
                    {
                        return $(this).find('.enable').children('input').prop("checked");
                    }).get().some(function(enabled) { return enabled; });

                    if (!someColorEnabled)
                    {
                        // Disable the confirmation button to restrict disabling all colors
                        confirmButton.prop("disabled", true);
                        confirmButton.addClass("ui-state-disabled");
                    }
                    else
                    {
                        confirmButton.prop("disabled", false);
                        confirmButton.removeClass("ui-state-disabled");
                    }
                }
                else
                {
                    confirmButton.prop("disabled", false);
                    confirmButton.removeClass("ui-state-disabled");
                }
            });
            entryDataRow.append($('<td>', { class: "enable" }).append(enabler));

            entryDataRow.append($('<td>',
            {
                class: "color",
                "data-color": color.name,
                title: i18next.t('colorPicker:colors.' + color.name),
                css:
                {
                    borderColor: color.name,
                    backgroundColor: color.name
                }
            }));
            var entryContainer = $('<td>', { class: "entry" }).appendTo(entryDataRow);
            Config.container.settings.colorKeyEntry.type.appendControlTo(entryContainer);
            Config.container.settings.colorKeyEntry.type.setInDOM(entryContainer, color.entry);
        });
        Utils.makeSortable(keyBody);

        keyContainer.dialog(
        {
            title : i18next.t('colorPicker:key_title'),
            height: 'auto',
            width: 'auto',
            modal: true,
            buttons:
            [{
                class: "confirmColors",
                text: i18next.t('common:confirm'),
                click: function()
                {
                    ColorPicker.key.sequence = keyBody.children().map(function()
                    {
                        var colorContainer = $(this).find('.color');
                        var enableContainer = $(this).find('.enable');
                        var entryContainer = $(this).find('.entry');
                        return {
                            name: colorContainer.data("color"),
                            enabled: enableContainer.children('input').prop("checked"),
                            entry: Config.container.settings.colorKeyEntry.type.getFromDOM(entryContainer)
                        };
                    }).get();

                    ColorPicker.key.byColor = ColorPicker.key.sequence.reduce(function(byColor, color)
                    {
                        byColor[color.name] = color;
                        return byColor;
                    }, {});

                    $(this).dialog('close');
                }
            },
            {
                text: i18next.t('common:close'),
                click: function()
                {
                    $(this).dialog('close');
                }
            }],
            close: function()
            {
                $("#main").focus();
                $(this).remove();
            }
        });
    }

    function showFor(connection)
    {
        if ($("#colorPicker").length > 0) return;

        connection.addOverlay(
        [
            "Custom",
            {
                create: function()
                {
                    var ringPadding = 5;
                    var pickerRadius = 100;
                    var innerPickerRadius = pickerRadius / 2 + 2 * ringPadding;
                    var innerColorMaximum = 8;
                    var outerColorMaximum = 12;

                    var appendColorSegmentTo = function(ring, color, index, radius, count, drawOffset)
                    {
                        var segment;
                        if (count > 1)
                        {
                            var segmentAngle = 360 / count;
                            var startAngle = index * segmentAngle;
                            var endAngle = startAngle + segmentAngle;

                            var x1 = Math.round(drawOffset + (radius - ringPadding) * Math.cos(Math.PI * startAngle / 180));
                            var y1 = Math.round(drawOffset + (radius - ringPadding) * Math.sin(Math.PI * startAngle / 180));
                            var x2 = Math.round(drawOffset + (radius - ringPadding) * Math.cos(Math.PI * endAngle / 180));
                            var y2 = Math.round(drawOffset + (radius - ringPadding) * Math.sin(Math.PI * endAngle / 180));

                            var d =
                                " M" + drawOffset + "," + drawOffset +
                                " L" + x1 + "," + y1 +
                                " A" + (radius - ringPadding) + "," + (radius - ringPadding) + " 0 " + (endAngle - startAngle > 180 ? 1 : 0) + ",1 " + x2 + "," + y2 +
                                " z";
                            segment = Utils.appendChild(ring, "path");
                            segment.setAttribute("d", d);
                        }
                        else
                        {
                            segment = Utils.appendChild(ring, "circle");
                            segment.setAttribute("cx", drawOffset);
                            segment.setAttribute("cy", drawOffset);
                            segment.setAttribute("r", radius - ringPadding);
                        }
                        segment.setAttribute("class", "segment");
                        segment.setAttribute("fill", color.name);
                        segment.setAttribute("data-color", color.name);
                        var title = Utils.appendChild(segment, "title");
                        $(title).text(i18next.t('colorPicker:colors.' + color.name) + ": " + color.entry);
                    };

                    var appendBorderTo = function(ring, offset, radius)
                    {
                        var border = Utils.appendChild(ring, "circle");
                        border.setAttribute("class", "dop");
                        border.setAttribute("cx", offset);
                        border.setAttribute("cy", offset);
                        border.setAttribute("r", radius - ringPadding / 2);
                        border.setAttribute("stroke", "#fafafa");
                        border.setAttribute("stroke-width", ringPadding);
                        border.setAttribute("fill", "#fafafa");
                    };

                    var picker = $('<div>', { id: "colorPicker" });
                    var colorRings = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                    picker.append(colorRings);
                    var outerColorRing = Utils.appendChild(colorRings, "g");
                    var innerColorRing;
                    var enabledColors = ColorPicker.key.sequence.filter(function(color)
                    {
                        return color.enabled;
                    });
                    if (enabledColors.length > innerColorMaximum)
                    {
                        // Outer border
                        appendBorderTo(outerColorRing, pickerRadius, pickerRadius);

                        // Divide equally over inner and outer rings
                        var outerColorEndIndex = Math.floor(enabledColors.length * innerColorMaximum / outerColorMaximum);
                        var outerColors = enabledColors.slice(0, outerColorEndIndex);
                        outerColors.forEach(function(color, index)
                        {
                            appendColorSegmentTo(outerColorRing, color, index, pickerRadius, outerColors.length, pickerRadius);
                        });

                        innerColorRing = Utils.appendChild(outerColorRing, "g");

                        // Outer inner border
                        appendBorderTo(innerColorRing, pickerRadius, innerPickerRadius);

                        var innerColors = enabledColors.slice(outerColorEndIndex, enabledColors.length);
                        innerColors.forEach(function(color, index)
                        {
                            appendColorSegmentTo(innerColorRing, color, index, innerPickerRadius, innerColors.length, pickerRadius);
                        });
                    }
                    else
                    {
                        pickerRadius = innerPickerRadius;

                        // Outer border
                        appendBorderTo(outerColorRing, pickerRadius, pickerRadius);

                        // The colors fit in the inner ring
                        innerColorRing = Utils.appendChild(outerColorRing, "g");
                        enabledColors.forEach(function(color, index)
                        {
                            appendColorSegmentTo(innerColorRing, color, index, pickerRadius, enabledColors.length, pickerRadius);
                        });
                    }

                    // Resize the picker depending on the radius
                    picker.css("width", pickerRadius * 2);
                    picker.css("height", pickerRadius * 2);
                    colorRings.setAttribute("viewBox", "0 0 " + pickerRadius * 2 + " " + pickerRadius * 2);

                    // Inner border for the edit button
                    appendBorderTo(innerColorRing, pickerRadius, pickerRadius === innerPickerRadius ? pickerRadius / 3 : 2 * innerPickerRadius - pickerRadius);

                    picker.find('.segment').each(function()
                    {
                        $(this).on('mouseover', function(e)
                        {
                            e.stopPropagation();
                        });
                        $(this).on('click', function(e)
                        {
                            var colorName = $(this).data("color");
                            connection.setParameter("color", colorName);
                            if (ColorPicker.areColorsEnabled())
                            {
                                if (connection.id in Zoom.getZoomed().selectedConnections)
                                {
                                    connection.setPaintStyle($.extend({}, PlumbGenerator.defaultPaintStyle, { strokeStyle: colorName, outlineColor: colorName }));
                                }
                                else
                                {
                                    connection.setPaintStyle($.extend({}, PlumbGenerator.defaultPaintStyle, { strokeStyle: colorName, outlineColor: "transparent" }));
                                }
                                connection.setHoverPaintStyle($.extend({}, PlumbGenerator.defaultHoverPaintStyle, { strokeStyle: colorName, outlineColor: colorName }));
                            }
                            connection.removeOverlay("color-picker");
                            e.stopPropagation();
                        });
                    });

                    var editButton = Utils.appendChild(innerColorRing, "image");
                    var editButtonSize = 20;
                    var editButtonOffset = pickerRadius - editButtonSize / 2;
                    editButton.setAttribute("class", "edit");
                    editButton.setAttribute("href", editor_url + "svg/icon_edit.svg");
                    editButton.setAttribute("x", editButtonOffset);
                    editButton.setAttribute("y", editButtonOffset);
                    editButton.setAttribute("width", editButtonSize);
                    editButton.setAttribute("height", editButtonSize);
                    $(editButton).on('mouseover', function(e)
                    {
                        e.stopPropagation();
                    });
                    $(editButton).on('click', function(e)
                    {
                        keyDialog();
                        connection.removeOverlay("color-picker");
                        e.stopPropagation();
                    });

                    var closeButton = Utils.appendChild(colorRings, "image");
                    var closeButtonSize = 20;
                    closeButton.setAttribute("class", "close");
                    closeButton.setAttribute("href", editor_url + "svg/icon_close.svg");
                    closeButton.setAttribute("x", 1.75 * pickerRadius - ringPadding);
                    closeButton.setAttribute("y", ringPadding);
                    closeButton.setAttribute("width", closeButtonSize);
                    closeButton.setAttribute("height", closeButtonSize);
                    $(closeButton).on('mouseover', function(e)
                    {
                        e.stopPropagation();
                    });
                    $(closeButton).on('click', function(e)
                    {
                        connection.removeOverlay("color-picker");
                        e.stopPropagation();
                    });

                    return picker;
                },
                location: 0.5,
                id: "color-picker"
            }
        ]);
    }

    function areColorsEnabled()
    {
        return $("#toggleColors").hasClass("enabled");
    }

    function toggleColors()
    {
        var toggleColorsButton = $("#toggleColors");
        if (toggleColorsButton.hasClass("enabled"))
        {
            toggleColorsButton.removeClass("enabled");
            removeColors();
        }
        else
        {
            toggleColorsButton.addClass("enabled");
            applyColors();
        }

        $("#main").focus();
    }

    function applyColors()
    {
        var dialogue = Zoom.getZoomed();
        dialogue.plumbInstance.getAllConnections().forEach(function(connection)
        {
            var colorName = connection.getParameter("color");
            if (colorName)
            {
                if (connection.id in dialogue.selectedConnections)
                {
                    connection.setPaintStyle($.extend({}, PlumbGenerator.defaultPaintStyle, { strokeStyle: colorName, outlineColor: colorName }));
                }
                else
                {
                    connection.setPaintStyle($.extend({}, PlumbGenerator.defaultPaintStyle, { strokeStyle: colorName, outlineColor: "transparent" }));
                }
                connection.setHoverPaintStyle($.extend({}, PlumbGenerator.defaultHoverPaintStyle, { strokeStyle: colorName, outlineColor: colorName }));
            }
        });
    }

    function removeColors()
    {
        var dialogue = Zoom.getZoomed();
        dialogue.plumbInstance.getAllConnections().forEach(function(connection)
        {
            if (connection.id in dialogue.selectedConnections)
            {
                connection.setPaintStyle($.extend({}, PlumbGenerator.defaultPaintStyle, { strokeStyle: "goldenrod" }));
            }
            else
            {
                connection.setPaintStyle(PlumbGenerator.defaultPaintStyle);
            }
            connection.setHoverPaintStyle(PlumbGenerator.defaultHoverPaintStyle);
        });
    }

})();
