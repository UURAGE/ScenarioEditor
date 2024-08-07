// © DialogueTrainer

/* exported ColorPicker */
let ColorPicker;

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
        applyColors: applyColors
    };

    const colorAnnotationId = "colour.c1";

    const colors =
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

    $(function()
    {
        resetKey();
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

        const annotationXML = containerXML.children("annotation[id=" + $.escapeSelector(colorAnnotationId) + "]").eq(0);
        const colorEnumeration = Types.primitives.enumeration.loadType(annotationXML.children('type').eq(0).children('enumeration').eq(0));
        ColorPicker.key.sequence = [];
        colorEnumeration.options.sequence.forEach(function(option)
        {
            const color = ColorPicker.key.byColor[option.value];
            if (option.value in ColorPicker.key.byColor)
            {
                color.enabled = true;
                color.entry = option.text;
                ColorPicker.key.sequence.push(color);
            }
        });
        for (const value in ColorPicker.key.byColor)
        {
            if (!ColorPicker.key.sequence.includes(ColorPicker.key.byColor[value]))
            {
                ColorPicker.key.sequence.push(ColorPicker.key.byColor[value]);
            }
        }
    }

    function keyToXML(containerXML)
    {
        const annotationXML = Utils.appendChild(containerXML, "annotation");
        annotationXML.setAttribute('id', colorAnnotationId);
        annotationXML.setAttribute('name', "");
        const enabledColors = ColorPicker.key.sequence.filter(function(color)
        {
            return color.enabled || color === ColorPicker.defaultColor;
        });
        const options =
        {
            byValue: enabledColors.reduce(function(byValue, color)
            {
                byValue[color.value] = { value: color.value, text: ColorPicker.key.byColor[color.value].entry };
                return byValue;
            }, {}),
            sequence: enabledColors.map(function(color) { return { value: color.value, text: color.entry }; })
        };
        const colorEnumeration = $.extend({}, Types.primitives.enumeration, { options: options });
        colorEnumeration.insertType(Utils.appendChild(annotationXML, "type"), true);
    }

    function colorFromXML(containerXML)
    {
        const annotationValueXML = containerXML.children("annotationValue[idref=" + $.escapeSelector(colorAnnotationId) + "]").eq(0);
        if (annotationValueXML.length > 0)
        {
            return annotationValueXML.text();
        }
    }

    function colorToXML(containerXML, colorValue)
    {
        const annotationValueXML = Utils.appendChild(containerXML, "annotationValue");
        annotationValueXML.setAttribute('idref', colorAnnotationId);
        Types.primitives.enumeration.toXML(annotationValueXML, colorValue);
    }

    function keyDialog()
    {
        const keyContainer = $('<div>');

        const keyTable = $('<table>').appendTo(keyContainer);
        const keyHeaderRow = $('<tr>').appendTo($('<thead>')).appendTo(keyTable);
        keyHeaderRow.append($('<th>')); // For the sortable handle
        keyHeaderRow.append($('<th>')); // For the enabled checkbox
        keyHeaderRow.append($('<th>', { text: i18next.t('colorPicker:color') }));
        keyHeaderRow.append($('<th>', { text: i18next.t('colorPicker:entry') }));
        const keyBody = $('<tbody>').appendTo(keyTable);
        ColorPicker.key.sequence.forEach(function(color)
        {
            const entryDataRow = $('<tr>').appendTo(keyBody);
            entryDataRow.append($('<td>', { class: "handle", text: "↕" }));

            const enabler = $('<input>', { type: 'checkbox' });
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
            const entryContainer = $('<td>', { class: "entry" }).appendTo(entryDataRow);
            Config.container.settings.colorKeyEntry.type.appendControlTo(entryContainer);
            Config.container.settings.colorKeyEntry.type.setInDOM(entryContainer, color.entry);
        });
        Utils.makeSortable(keyBody);

        keyContainer.dialog(
        {
            title: i18next.t('colorPicker:key_title'),
            width: Config.container.settings.colorKeyEntry.type.rows ? 360 : 320,
            modal: true,
            buttons: [
                {
                    text: i18next.t('common:confirm'),
                    class: 'confirmColors col-primary roundedPill medium',
                    click: function()
                    {
                        const justDisabledColors = {};
                        const newColorKeySequence = keyBody.children().map(function()
                        {
                            const value = $(this).find('.color').data("color");
                            const enabled = value === ColorPicker.defaultColor || $(this).find('.enable').children('input').prop("checked");
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

                        const changedConnections = Object.values(Main.trees)
                            .flatMap(function(tree)
                            {
                                return tree.plumbInstance.getAllConnections();
                            })
                            .filter(function(connection)
                            {
                                return connection.getParameter('color') in justDisabledColors;
                            });

                        const consideredSaveColorKey = function()
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
                            const warningContainer = $('<div>');
                            warningContainer.append($('<div>', { text: i18next.t('colorPicker:disable_colors_warning') }));
                            warningContainer.append($('<br>'));
                            for (const colorValue in justDisabledColors)
                            {
                                warningContainer.append($('<div>', { text: i18next.t('colorPicker:colors.' + colorValue) + ": " + justDisabledColors[colorValue] + "x" }));
                            }
                            Utils.confirmDialog(warningContainer, 'warning').then(function(confirmed)
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
                    },
                    class: 'col-dim roundedPill medium',
                }
            ],
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

        const sourcePosition = connection.connector.canvas.getBoundingClientRect();
        const x = Math.abs(Main.mousePosition.x - sourcePosition.left);
        const y = Math.abs(Main.mousePosition.y - sourcePosition.top);
        const location = connection.connector.findSegmentForPoint(x, y).l;

        connection.addOverlay(
        [
            "Custom",
            {
                create: function()
                {
                    const ringPadding = 5;
                    let pickerRadius = 100;
                    const innerPickerRadius = pickerRadius / 2 + 2 * ringPadding;
                    const innerColorMaximum = 8;
                    const outerColorMaximum = 12;

                    const appendColorSegmentTo = function(ring, color, index, radius, count, drawOffset)
                    {
                        let segment;
                        if (count > 1)
                        {
                            const segmentAngle = 360 / count;
                            const startAngle = index * segmentAngle;
                            const endAngle = startAngle + segmentAngle;

                            const x1 = Math.round(drawOffset + (radius - ringPadding) * Math.cos(Math.PI * startAngle / 180));
                            const y1 = Math.round(drawOffset + (radius - ringPadding) * Math.sin(Math.PI * startAngle / 180));
                            const x2 = Math.round(drawOffset + (radius - ringPadding) * Math.cos(Math.PI * endAngle / 180));
                            const y2 = Math.round(drawOffset + (radius - ringPadding) * Math.sin(Math.PI * endAngle / 180));

                            const d =
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
                        const title = Utils.appendChild(segment, "title");
                        $(title).text(i18next.t('colorPicker:colors.' + color.value) + (color.entry ? ": " + color.entry : ""));
                    };

                    const appendBorderTo = function(ring, offset, radius)
                    {
                        const border = Utils.appendChild(ring, "circle");
                        border.setAttribute("class", "dop");
                        border.setAttribute("cx", offset);
                        border.setAttribute("cy", offset);
                        border.setAttribute("r", radius - ringPadding / 2);
                        border.setAttribute("stroke", "#fafafa");
                        border.setAttribute("stroke-width", ringPadding);
                        border.setAttribute("fill", "#fafafa");
                    };

                    const picker = $('<div>', { id: "colorPicker" });
                    const colorRings = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                    $(colorRings).on('mouseover mousedown', function(e)
                    {
                        e.stopPropagation();
                    });
                    picker.append(colorRings);
                    const outerColorRing = Utils.appendChild(colorRings, "g");
                    let innerColorRing;
                    const enabledColors = ColorPicker.key.sequence.filter(function(color)
                    {
                        return color.enabled;
                    });
                    if (enabledColors.length > innerColorMaximum)
                    {
                        // Outer border
                        appendBorderTo(outerColorRing, pickerRadius, pickerRadius);

                        // Divide equally over inner and outer rings
                        const outerColorEndIndex = Math.floor(enabledColors.length * innerColorMaximum / outerColorMaximum);
                        const outerColors = enabledColors.slice(0, outerColorEndIndex);
                        outerColors.forEach(function(color, index)
                        {
                            appendColorSegmentTo(outerColorRing, color, index, pickerRadius, outerColors.length, pickerRadius);
                        });

                        innerColorRing = Utils.appendChild(outerColorRing, "g");

                        // Outer inner border
                        appendBorderTo(innerColorRing, pickerRadius, innerPickerRadius);

                        const innerColors = enabledColors.slice(outerColorEndIndex, enabledColors.length);
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

                    /* eslint-disable prefer-const */

                    let onClickOutside, closeColorPicker;

                    onClickOutside = function(e)
                    {
                        if (!picker.is(e.target) && picker.has(e.target).length === 0)
                        {
                            closeColorPicker(e);
                        }
                    };
                    document.addEventListener('click', onClickOutside, true);

                    closeColorPicker = function()
                    {
                        connection.removeOverlay("color-picker");
                        document.removeEventListener('click', onClickOutside, true);
                    };

                    /* eslint-enable prefer-const */

                    picker.find('.segment').each(function()
                    {
                        $(this).on('mouseover', function(e)
                        {
                            e.stopPropagation();
                        });
                        $(this).on('click', function(e)
                        {
                            SaveIndicator.setSavedChanges(false);

                            const colorValue = $(this).data("color");
                            const dialogue = Zoom.getZoomed();
                            const selectedConnections = dialogue.selectedConnections;
                            for (const connectionId in selectedConnections)
                            {
                                const cs = dialogue.plumbInstance.getConnections(
                                {
                                    source: selectedConnections[connectionId].source,
                                    target: selectedConnections[connectionId].target
                                });
                                // Connection could just have been removed so we need to check if it still exists
                                if (cs.length > 0)
                                {
                                    cs[0].setParameter("color", colorValue);
                                    applyColor(cs[0], dialogue);
                                }
                            }
                            if (!(connection.id in selectedConnections))
                            {
                                connection.setParameter("color", colorValue);
                                applyColor(connection, dialogue);
                            }

                            closeColorPicker(e);
                        });
                    });

                    const xlinkns = "http://www.w3.org/1999/xlink";
                    const innerCircle = Utils.appendChild(innerColorRing, 'g');
                    const editIcon = Utils.appendChild(innerCircle, "use");
                    const editIconSize = 20;
                    const editIconOffset = pickerRadius - editIconSize / 2;
                    editIcon.setAttributeNS(xlinkns, "href", "#mdi-pencil");
                    editIcon.setAttribute("x", editIconOffset);
                    editIcon.setAttribute("y", editIconOffset);
                    editIcon.setAttribute("width", editIconSize);
                    editIcon.setAttribute("height", editIconSize);
                    editIcon.setAttribute("opacity", 0.6);
                    const editButton = Utils.appendChild(innerCircle, "circle");
                    const offset = pickerRadius;
                    const radius = pickerRadius === innerPickerRadius ? pickerRadius / 3 : 2 * innerPickerRadius - pickerRadius;
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

                    const closeIcon = Utils.appendChild(innerCircle, "use");
                    const closeIconSize = 20;
                    const closeIconOffsetX = 1.75 * pickerRadius - ringPadding;
                    const closeIconOffsetY = ringPadding;
                    closeIcon.setAttributeNS(xlinkns, "href", "#mdi-close");
                    closeIcon.setAttribute("x", closeIconOffsetX);
                    closeIcon.setAttribute("y", closeIconOffsetY);
                    closeIcon.setAttribute("width", closeIconSize);
                    closeIcon.setAttribute("height", closeIconSize);
                    closeIcon.setAttribute("opacity", 0.6);
                    const closeButton = Utils.appendChild(innerCircle, "circle");
                    const closeIconRadius = closeIconSize / 2;
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

    function applyColor(connection, dialogue)
    {
        const colorValue = connection.getParameter("color");
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
        const dialogue = Zoom.getZoomed();
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
})();
