/* © Utrecht University and DialogueTrainer */

/* exported ColorPicker */
var ColorPicker;

(function()
{
    "use strict";

    // eslint-disable-next-line no-global-assign
    ColorPicker =
    {
        defaultColor: "#606060",
        key: {},
        keyFromXML: keyFromXML,
        keyToXML: keyToXML,
        colorFromXML: colorFromXML,
        colorToXML: colorToXML,
        showFor: showFor,
        areColorsEnabled: areColorsEnabled,
        applyColors: applyColors,
        removeColors: removeColors
    };

    var colorAnnotationId = "colour.c1";

    var colors =
    [
        {
            value: "darkslategray",
            enabled: true
        },
        {
            value: "lightslategray",
            enabled: true
        },
        {
            value: "silver",
            enabled: true
        },
        {
            value: "firebrick",
            enabled: true
        },
        {
            value: "chocolate",
            enabled: true
        },
        {
            value: "goldenrod",
            enabled: true
        },
        {
            value: "limegreen",
            enabled: true
        },
        {
            value: "seagreen",
            enabled: true
        },
        {
            value: ColorPicker.defaultColor,
            enabled: true
        },
        {
            value: "royalblue",
            enabled: true
        },
        {
            value: "darkslateblue",
            enabled: true
        },
        {
            value: "indigo",
            enabled: true
        },
        {
            value: "coral",
            enabled: true
        },
        {
            value: "orange",
            enabled: true
        },
        {
            value: "gold",
            enabled: true
        },
        {
            value: "greenyellow",
            enabled: true
        },
        {
            value: "turquoise",
            enabled: true
        },
        {
            value: "dodgerblue",
            enabled: true
        },
        {
            value: "slateblue",
            enabled: true
        },
        {
            value: "palevioletred",
            enabled: true
        }
    ];

    $(document).ready(function()
    {
        resetKey();

        $("#toggleColors").on('click', toggleColors);
        $("#toggleColors").addClass("enabled");
    });

    function resetKey()
    {
        ColorPicker.key = {
            byColor: colors.reduce(function(byColor, color)
            {
                byColor[color.value] = color;
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

    function keyFromXML(containerXML)
    {
        resetKey();

        ColorPicker.key.sequence.forEach(function(color)
        {
            if (color.value !== ColorPicker.defaultColor)
            {
                color.enabled = false;
            }
        });

        var annotationXML = containerXML.children("annotation[id=" + $.escapeSelector(colorAnnotationId) + "]").eq(0);
        var colorEnumeration = Types.primitives.enumeration.loadType(annotationXML.children('type').eq(0).children('enumeration').eq(0));
        ColorPicker.key.sequence = [];
        colorEnumeration.options.sequence.forEach(function(option)
        {
            var color = ColorPicker.key.byColor[option.value];
            if (option.value in ColorPicker.key.byColor)
            {
                color.enabled = true;
                color.entry = option.text;
                ColorPicker.key.sequence.push(color);
            }
        });
        for (var value in ColorPicker.key.byColor)
        {
            if (ColorPicker.key.sequence.indexOf(ColorPicker.key.byColor[value]) === -1)
            {
                ColorPicker.key.sequence.push(ColorPicker.key.byColor[value]);
            }
        }
    }

    function keyToXML(containerXML)
    {
        var annotationXML = Utils.appendChild(containerXML, "annotation");
        annotationXML.setAttribute('id', colorAnnotationId);
        annotationXML.setAttribute('name', "");
        var enabledColors = ColorPicker.key.sequence.filter(function(color)
        {
            return color.enabled || color === ColorPicker.defaultColor;
        });
        var options =
        {
            byValue: enabledColors.reduce(function(byValue, color)
            {
                byValue[color.value] = { value: color.value, text: ColorPicker.key.byColor[color.value].entry };
                return byValue;
            }, {}),
            sequence: enabledColors.map(function(color) { return { value: color.value, text: color.entry }; })
        };
        var colorEnumeration = $.extend({}, Types.primitives.enumeration, { options: options });
        colorEnumeration.insertType(Utils.appendChild(annotationXML, "type"), true);
    }

    function colorFromXML(containerXML)
    {
        var annotationValueXML = containerXML.children("annotationValue[idref=" + $.escapeSelector(colorAnnotationId) + "]").eq(0);
        if (annotationValueXML.length > 0)
        {
            return annotationValueXML.text();
        }
    }

    function colorToXML(containerXML, colorValue)
    {
        var annotationValueXML = Utils.appendChild(containerXML, "annotationValue");
        annotationValueXML.setAttribute('idref', colorAnnotationId);
        Types.primitives.enumeration.toXML(annotationValueXML, colorValue);
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
            enabler.prop("checked", color.enabled || color.value === ColorPicker.defaultColor);
            enabler.prop("disabled", color.value === ColorPicker.defaultColor);
            entryDataRow.append($('<td>', { class: "enable" }).append(enabler));

            entryDataRow.append($('<td>',
            {
                class: "color",
                "data-color": color.value,
                title: i18next.t('colorPicker:colors.' + color.value),
                css:
                {
                    borderColor: color.value,
                    backgroundColor: color.value
                }
            }));
            var entryContainer = $('<td>', { class: "entry" }).appendTo(entryDataRow);
            Config.container.settings.colorKeyEntry.type.appendControlTo(entryContainer);
            Config.container.settings.colorKeyEntry.type.setInDOM(entryContainer, color.entry);
        });
        Utils.makeSortable(keyBody);

        keyContainer.dialog(
        {
            title: i18next.t('colorPicker:key_title'),
            height: 800,
            width: Config.container.settings.colorKeyEntry.type.rows ? 360 : 320,
            modal: true,
            buttons:
            [{
                class: "confirmColors",
                text: i18next.t('common:confirm'),
                click: function()
                {
                    var justDisabledColors = {};
                    var newColorKeySequence = keyBody.children().map(function()
                    {
                        var value = $(this).find('.color').data("color");
                        var enabled = value === ColorPicker.defaultColor || $(this).find('.enable').children('input').prop("checked");
                        if (!enabled && enabled !== ColorPicker.key.byColor[value].enabled)
                        {
                            justDisabledColors[value] = 0;
                        }
                        return {
                            value: value,
                            enabled: enabled,
                            entry: Config.container.settings.colorKeyEntry.type.getFromDOM($(this).find('.entry'))
                        };
                    }).get();

                    var changedConnections = [].concat.apply([], Object.keys(Main.trees).map(function(treeID)
                    {
                        return Main.trees[treeID].plumbInstance.getAllConnections();
                    }))
                        .filter(function(connection)
                        {
                            return connection.getParameter('color') in justDisabledColors;
                        });

                    var consideredSaveColorKey = function()
                    {
                        SaveIndicator.setSavedChanges(false);

                        ColorPicker.key.sequence = newColorKeySequence;
                        ColorPicker.key.byColor = newColorKeySequence.reduce(function(byColor, color)
                        {
                            byColor[color.value] = color;
                            return byColor;
                        }, {});

                        changedConnections.forEach(function(connection)
                        {
                            connection.setParameter('color', null);
                            removeColor(connection);
                        });

                        keyContainer.dialog('close');
                    };

                    changedConnections.forEach(function(connection)
                    {
                        justDisabledColors[connection.getParameter('color')]++;
                    });

                    if (changedConnections.length > 0)
                    {
                        var warningContainer = $('<div>');
                        warningContainer.append($('<div>', { text: i18next.t('colorPicker:disable_colors_warning') }));
                        warningContainer.append($('<br>'));
                        for (var colorValue in justDisabledColors)
                        {
                            warningContainer.append($('<div>', { text: i18next.t('colorPicker:colors.' + colorValue) + ": " + justDisabledColors[colorValue] + "x" }));
                        }
                        Utils.confirmDialog(warningContainer, 'warning').done(function(confirmed)
                        {
                            if (confirmed)
                            {
                                consideredSaveColorKey();
                            }
                        });
                    }
                    else
                    {
                        consideredSaveColorKey();
                    }
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
        if ($("#colorPicker").length > 0 || !ColorPicker.areColorsEnabled()) return;

        var sourcePosition = connection.connector.canvas.getBoundingClientRect();
        var x = Math.abs(Main.mousePosition.x - sourcePosition.left);
        var y = Math.abs(Main.mousePosition.y - sourcePosition.top);
        var location = 1 - connection.connector.findSegmentForPoint(x, y).l;

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
                        segment.setAttribute("fill", color.value);
                        segment.setAttribute("data-color", color.value);
                        var title = Utils.appendChild(segment, "title");
                        $(title).text(i18next.t('colorPicker:colors.' + color.value) + (color.entry ? ": " + color.entry : ""));
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
                    $(colorRings).on('mouseover', function(e)
                    {
                        e.stopPropagation();
                    });
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

                    var onClickOutside, closeColorPicker;

                    onClickOutside = function(e)
                    {
                        if (!picker.is(e.target) && picker.has(e.target).length === 0)
                        {
                            closeColorPicker(e);
                        }
                    };
                    $(document).on('click', onClickOutside);

                    closeColorPicker = function(e)
                    {
                        connection.removeOverlay("color-picker");
                        $(document).off('click', onClickOutside);
                        e.stopPropagation();
                    };

                    picker.find('.segment').each(function()
                    {
                        $(this).on('mouseover', function(e)
                        {
                            e.stopPropagation();
                        });
                        $(this).on('click', function(e)
                        {
                            SaveIndicator.setSavedChanges(false);

                            var colorValue = $(this).data("color");
                            connection.setParameter("color", colorValue);
                            if (ColorPicker.areColorsEnabled())
                            {
                                applyColor(connection, Zoom.getZoomed());
                            }

                            closeColorPicker(e);
                        });
                    });

                    var xlinkns = "http://www.w3.org/1999/xlink";
                    var innerCircle = Utils.appendChild(innerColorRing, 'g');
                    var editIcon = Utils.appendChild(innerCircle, "use");
                    var editIconSize = 20;
                    var editIconOffset = pickerRadius - editIconSize / 2;
                    editIcon.setAttributeNS(xlinkns, "href", "#icon-edit");
                    editIcon.setAttribute("x", editIconOffset);
                    editIcon.setAttribute("y", editIconOffset);
                    editIcon.setAttribute("width", editIconSize);
                    editIcon.setAttribute("height", editIconSize);
                    editIcon.setAttribute("opacity", 0.6);
                    var editButton = Utils.appendChild(innerCircle, "circle");
                    var offset = pickerRadius;
                    var radius = pickerRadius === innerPickerRadius ? pickerRadius / 3 : 2 * innerPickerRadius - pickerRadius;
                    editButton.setAttribute("class", "edit");
                    editButton.setAttribute("cx", offset);
                    editButton.setAttribute("cy", offset);
                    editButton.setAttribute("r", radius - ringPadding / 2);
                    editButton.setAttribute("opacity", 0);
                    $(editButton).on('mouseover', function()
                    {
                        editIcon.setAttribute("opacity", 1);
                    });
                    $(editButton).on('mouseout', function()
                    {
                        editIcon.setAttribute("opacity", 0.6);
                    });
                    $(editButton).on('click', function(e)
                    {
                        keyDialog();
                        closeColorPicker(e);
                    });

                    var closeIcon = Utils.appendChild(innerCircle, "use");
                    var closeIconSize = 20;
                    var closeIconOffsetX = 1.75 * pickerRadius - ringPadding;
                    var closeIconOffsetY = ringPadding;
                    closeIcon.setAttributeNS(xlinkns, "href", "#icon-close");
                    closeIcon.setAttribute("x", closeIconOffsetX);
                    closeIcon.setAttribute("y", closeIconOffsetY);
                    closeIcon.setAttribute("width", closeIconSize);
                    closeIcon.setAttribute("height", closeIconSize);
                    closeIcon.setAttribute("opacity", 0.6);
                    var closeButton = Utils.appendChild(innerCircle, "circle");
                    var closeIconRadius = closeIconSize / 2;
                    closeButton.setAttribute("class", "close");
                    closeButton.setAttribute("cx", closeIconOffsetX + closeIconRadius);
                    closeButton.setAttribute("cy", closeIconOffsetY + closeIconRadius);
                    closeButton.setAttribute("r", closeIconRadius);
                    closeButton.setAttribute("opacity", 0);
                    $(closeButton).on('mouseover', function()
                    {
                        closeIcon.setAttribute("opacity", 1);
                    });
                    $(closeButton).on('mouseout', function()
                    {
                        closeIcon.setAttribute("opacity", 0.6);
                    });
                    $(closeButton).on('click', function(e)
                    {
                        closeColorPicker(e);
                    });

                    return picker;
                },
                location: location,
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

    function applyColor(connection, dialogue)
    {
        var colorValue = connection.getParameter("color");
        if (colorValue)
        {
            if (dialogue && connection.id in dialogue.selectedConnections)
            {
                connection.setPaintStyle($.extend({}, PlumbGenerator.defaultSelectedPaintStyle, { stroke: colorValue, outlineStroke: colorValue }));
            }
            else
            {
                connection.setPaintStyle($.extend({}, PlumbGenerator.defaultPaintStyle, { stroke: colorValue, outlineStroke: "transparent" }));
            }
            connection.setHoverPaintStyle($.extend({}, PlumbGenerator.defaultHoverPaintStyle, { stroke: colorValue, outlineStroke: colorValue }));
        }
    }

    function applyColors()
    {
        var dialogue = Zoom.getZoomed();
        dialogue.plumbInstance.getAllConnections().forEach(function(connection)
        {
            applyColor(connection, dialogue);
        });
    }

    function removeColor(connection, dialogue)
    {
        if (dialogue && connection.id in dialogue.selectedConnections)
        {
            connection.setPaintStyle(PlumbGenerator.defaultSelectedPaintStyle);
        }
        else
        {
            connection.setPaintStyle(PlumbGenerator.defaultPaintStyle);
        }
        connection.setHoverPaintStyle(PlumbGenerator.defaultHoverPaintStyle);
    }

    function removeColors()
    {
        var dialogue = Zoom.getZoomed();
        dialogue.plumbInstance.getAllConnections().forEach(function(connection)
        {
            removeColor(connection, dialogue);
        });
    }
})();
