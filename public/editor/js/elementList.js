/* © Utrecht University and DialogueTrainer */

/* exported ElementList */
var ElementList;

(function()
{
    "use strict";

    var selectedParameterId;
    var selectedEffectCategory;
    var selectedTypes;

    // eslint-disable-next-line no-global-assign
    ElementList =
    {
        reset: reset,
        handleNodeTextChange: handleNodeTextChange,
        handleNodeDeletion: handleNodeDeletion,
        handleParametersChange: handleParametersChange
    };

    $(function()
    {
        // Event handlers.
        $("#toggleElementList").on('click', function()
        {
            reset();
            listElements();
        });
        reset();
    });

    function reset()
    {
        selectedParameterId = null;
        selectedEffectCategory = 'all';
        selectedTypes = null;
        $('#elementList').empty();
    }

    function listElements()
    {
        var table = $('<table>');
        Object.keys(Main.trees)
            .map(function(treeID) { return Main.trees[treeID]; })
            .sort(function(a, b)
            {
                return (a.topPos - b.topPos) || (a.leftPos - b.leftPos);
            })
            .forEach(function(tree)
            {
                tree.nodes
                    .slice()
                    .sort(function(a, b)
                    {
                        return compareNodePositions(Utils.cssPosition($('#' + a)), Utils.cssPosition($('#' + b)));
                    })
                    .forEach(function(nodeID)
                    {
                        table.append(createRow(tree, Main.nodes[nodeID]));
                    });
            });

        var parameterSelect = $('<select>',
        {
            id: 'element-list-parameter-select',
            title: i18next.t('elementList:parameter')
        });
        appendParameterOptionsTo(parameterSelect);
        parameterSelect.val(selectedParameterId === null ? '' : selectedParameterId);

        var effectCategorySelect = $('<select>',
        {
            id: 'element-list-effect-category-select',
            title: i18next.t('elementList:show_nodes'),
            disabled: selectedParameterId === null
        }).append(
            $('<option>', { value: 'all', text: i18next.t('elementList:effect_category.all') }),
            $('<option>', { value: 'with', text: i18next.t('elementList:effect_category.with') }),
            $('<option>', { value: 'without', text: i18next.t('elementList:effect_category.without') })
        );
        effectCategorySelect.val(selectedEffectCategory);

        parameterSelect.add(effectCategorySelect).on('change', function()
        {
            var parameterId = parameterSelect.val();
            if (parameterId === '') parameterId = null;
            selectParameter(parameterId, effectCategorySelect.val());
        });

        var typeButtons = $('<span>', { class: 'typeButtons buttonGroup' });
        if (selectedTypes === null) typeButtons.addClass('initial');
        var allTypes = [Main.playerType, Main.computerType, Main.situationType];
        allTypes.forEach(function(buttonType)
        {
            var button = $('<button>',
            {
                class: buttonType,
                text: i18next.t('common:' + buttonType)[0],
                title: i18next.t('common:' + buttonType),
                click: function()
                {
                    if (selectedTypes === null)
                    {
                        selectedTypes = {};
                        allTypes.forEach(function(type)
                        {
                            selectedTypes[type] = false;
                        });
                        selectedTypes[buttonType] = true;
                        typeButtons.removeClass('initial');
                        $(this).addClass('selectedType');
                    }
                    else if (Object.keys(selectedTypes)
                        .every(function(type) { return selectedTypes[type] === (type === buttonType); }))
                    {
                        selectedTypes = null;
                        typeButtons.addClass('initial');
                        $(this).removeClass('selectedType');
                    }
                    else
                    {
                        selectedTypes[buttonType] = !selectedTypes[buttonType];
                        $(this).toggleClass('selectedType', selectedTypes[buttonType]);
                    }
                    $('#elementList').children('table').find('tr').each(function()
                    {
                        var node = Main.nodes[$(this).data('nodeID')];
                        $(this).toggleClass('typeHidden', !(selectedTypes === null || selectedTypes[node.type]));
                    });
                }
            });
            if (selectedTypes !== null && selectedTypes[buttonType]) button.addClass('selectedType');
            typeButtons.append(button);
        });

        $('#tabDock').children().not('.ui-widget-header').hide();
        $('#elementList').empty().append(table).show();
        $('#tabDock')
            .find('.title').text(i18next.t('elementList:element_list_title')).end()
            .find('.controls').empty().append(parameterSelect, effectCategorySelect, typeButtons).end()
            .show();
        $("#main").focus();
    }

    function compareNodePositions(a, b)
    {
        return (a.top - b.top) || (a.left - b.left);
    }

    function createRow(tree, node)
    {
        var row = $('<tr>', { id: 'element-list-' + node.id, data: { nodeID: node.id } });
        row.append(
            $('<td>').append($('<button>',
                {
                    html: $(Utils.sIcon('icon-jump')),
                    class: "jumpControl",
                    click: function()
                    {
                        Zoom.zoomIn(tree);
                        Main.selectNode(node.id);
                        $('#' + node.id)[0].scrollIntoView(false);
                    }
                })),
            $('<td>').append($('<span>',
                {
                    class: 'label ' + node.type,
                    text: i18next.t('common:' + node.type)[0],
                    title: i18next.t('common:' + node.type)
                })),
            $('<td>',
                {
                    text: node.text,
                    class: 'text fill'
                })
        );
        if (selectedParameterId !== null)
        {
            var parameterEffectsCell = $('<td>', { class: 'parameterEffects' });
            appendSelectedParameterEffectsTo(parameterEffectsCell, node);
            row.append(parameterEffectsCell);
            if (selectedEffectCategory !== 'all')
            {
                row.toggleClass('effectCategoryHidden', !(parameterEffectsCell.children().length ?
                    selectedEffectCategory === 'with' : selectedEffectCategory === 'without'));
            }
        }
        row.toggleClass('typeHidden', !(selectedTypes === null || selectedTypes[node.type]));
        return row;
    }

    function appendSelectedParameterEffectsTo(parameterEffectsCell, node)
    {
        node.parameterEffects.userDefined.forEach(function(parameterEffect)
        {
            if (parameterEffect.idRef !== selectedParameterId) return;
            parameterEffectsCell.append($('<div>',
            {
                text: Types.assignmentOperators[parameterEffect.operator].uiName + ' ' + parameterEffect.value,
                class: "highlight"
            }));
        });
    }

    function appendParameterOptionsTo(parameterSelect)
    {
        parameterSelect.append($('<option>', { value: '', text: i18next.t('common:none') }));
        Parameters.container.sequence.forEach(function(parameter)
        {
            parameterSelect.append($('<option>', { value: parameter.id, text: parameter.name }));
        });
    }

    function selectParameter(parameterId, effectCategory)
    {
        var needsListing = false;
        if (parameterId !== selectedParameterId)
        {
            selectedParameterId = parameterId;
            $('#element-list-parameter-select').val(selectedParameterId === null ? '' : selectedParameterId);
            if (selectedParameterId === null)
            {
                $('#elementList').children('table').find('td.parameterEffects').remove();
                effectCategory = 'all';
            }
            else
            {
                needsListing = true;
            }
        }
        $('#element-list-effect-category-select').prop('disabled', selectedParameterId === null);
        if (effectCategory !== selectedEffectCategory)
        {
            selectedEffectCategory = effectCategory;
            $('#element-list-effect-category-select').val(effectCategory);
            if (!needsListing)
            {
                $('#elementList').children('table').find('tr').each(function()
                {
                    $(this).toggleClass('effectCategoryHidden', !(selectedEffectCategory === 'all' ||
                        ($(this).find('td.parameterEffects').children().length ?
                            selectedEffectCategory === 'with' : selectedEffectCategory === 'without')));
                });
            }
        }
        if (needsListing) listElements();
    }

    function isActive()
    {
        return $('#elementList').is(':visible');
    }

    function handleNodeTextChange(node)
    {
        if (!isActive()) return;
        var row = $('#element-list-' + node.id);
        if (row.length)
        {
            row.find('.text').text(node.text);
            if (selectedParameterId !== null)
            {
                var parameterEffectsCell = row.find('.parameterEffects').empty();
                appendSelectedParameterEffectsTo(parameterEffectsCell, node);
                row.toggleClass('effectCategoryHidden', !(selectedEffectCategory === 'all' ||
                    (parameterEffectsCell.children().length ?
                        selectedEffectCategory === 'with' : selectedEffectCategory === 'without')));
            }
        }
        else
        {
            var tree = Main.trees[node.parent];
            row = createRow(tree, node);

            var pos = Utils.cssPosition($('#' + node.id));
            var previousRow = null;
            var previousPos = null;
            tree.nodes.forEach(function(otherNodeID)
            {
                var otherRow = $('#element-list-' + otherNodeID);
                if (!otherRow.length) return;
                var otherPos = Utils.cssPosition($('#' + otherNodeID));
                if ((!previousPos || compareNodePositions(previousPos, otherPos) < 0) &&
                    compareNodePositions(otherPos, pos) < 0)
                {
                    previousRow = otherRow;
                    previousPos = otherPos;
                }
            });
            if (previousRow !== null)
            {
                row.insertAfter(previousRow);
            }
            else
            {
                $('#elementList').children('table').prepend(row);
            }
        }
    }

    function handleNodeDeletion(node)
    {
        if (!isActive()) return;
        $('#element-list-' + node.id).remove();
    }

    function handleParametersChange()
    {
        if (!isActive()) return;
        var parameterSelect = $('#element-list-parameter-select');
        parameterSelect.empty();
        appendParameterOptionsTo(parameterSelect);
        parameterSelect.val(selectedParameterId === null ? '' : selectedParameterId);
        if (selectedParameterId !== null && parameterSelect.val() !== selectedParameterId) selectParameter(null);
    }
})();
