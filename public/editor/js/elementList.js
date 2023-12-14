// © DialogueTrainer

/* exported ElementList */
let ElementList;

(function()
{
    "use strict";

    let selectedParameterId;
    let selectedEffectCategory;
    let selectedTypes;

    // eslint-disable-next-line no-global-assign
    ElementList =
    {
        reset: reset,
        handleNodeTextUpdate: handleNodeTextUpdate,
        handleNodeDecorationsUpdate: handleNodeDecorationsUpdate,
        handleNodeDeletion: handleNodeDeletion,
        handleParameterTypeChange: handleParameterTypeChange,
        handleParametersChange: handleParametersChange
    };

    $(function()
    {
        // Event handlers.
        $("#toggleElementList").on('click', function()
        {
            TabDock.close();
            reset();
            listElements();
            TabDock.closeHandler = reset;
        });
        reset();
    });

    function reset()
    {
        selectedParameterId = false;
        selectedEffectCategory = 'all';
        selectedTypes = null;
        $('#elementList').empty();
        dehighlightNodes($('.highlight'));
    }

    function listElements()
    {
        const table = $('<table>');
        Object.values(Main.trees)
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

        const parameterSelect = $('<select>',
        {
            id: 'element-list-parameter-select',
            title: i18next.t('elementList:parameter')
        });
        appendParameterOptionsTo(parameterSelect);
        setSelectedParameterIdIn(parameterSelect);

        const effectCategorySelect = $('<select>',
        {
            id: 'element-list-effect-category-select',
            title: i18next.t('elementList:show_nodes'),
            disabled: selectedParameterId === false
        }).append(
            $('<option>', { value: 'all', text: i18next.t('elementList:effect_category.all') }),
            $('<option>', { value: 'with', text: i18next.t('elementList:effect_category.with') }),
            $('<option>', { value: 'without', text: i18next.t('elementList:effect_category.without') })
        );
        effectCategorySelect.val(selectedEffectCategory);

        parameterSelect.add(effectCategorySelect).on('change', function()
        {
            let parameterId = parameterSelect.val();
            if (parameterId === 'false') parameterId = false;
            else if (parameterId === 'true') parameterId = true;
            else parameterId = parameterId.substring(1);
            selectParameter(parameterId, effectCategorySelect.val());
        });

        const typeButtons = $('<span>', { class: 'typeButtons buttonGroup' });
        if (selectedTypes === null) typeButtons.addClass('initial');
        const allTypes = [Main.playerType, Main.computerType, Main.situationType];
        allTypes.forEach(function(buttonType)
        {
            const button = $('<button>',
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
                        const node = Main.nodes[$(this).data('nodeID')];
                        const hiddenFor = $(this).data('hiddenFor');
                        hiddenFor.type = !(selectedTypes === null || selectedTypes[node.type]);
                        setRowDisplayAndNodeHighlighting(node, $(this), hiddenFor);
                    });
                }
            });
            if (selectedTypes !== null && selectedTypes[buttonType]) button.addClass('selectedType');
            typeButtons.append(button);
        });

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
        const hiddenFor = {};
        const row = $('<tr>', { id: 'element-list-' + node.id, data: { nodeID: node.id, hiddenFor: hiddenFor } });
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
        if (selectedParameterId !== false)
        {
            const parameterEffectsCell = $('<td>', { class: 'parameterEffects' });
            processSelectedParameterEffects(parameterEffectsCell, node, row);
            row.append(parameterEffectsCell);
            if (selectedEffectCategory !== 'all')
            {
                hiddenFor.effectCategory = !(row.data('summaryEffect') !== false ?
                    selectedEffectCategory === 'with' : selectedEffectCategory === 'without');
            }
        }
        hiddenFor.type = !(selectedTypes === null || selectedTypes[node.type]);
        setRowDisplayAndNodeHighlighting(node, row, hiddenFor);
        return row;
    }

    function processSelectedParameterEffects(parameterEffectsCell, node, row)
    {
        let selectedParameterEffects = node.parameterEffects.userDefined;
        if (selectedParameterId !== true)
        {
            selectedParameterEffects = selectedParameterEffects.filter(function(parameterEffect)
            {
                return parameterEffect.idRef === selectedParameterId;
            });
        }

        selectedParameterEffects.forEach(function(parameterEffect)
        {
            let text = Types.assignmentOperators[parameterEffect.operator].uiName + ' ' + parameterEffect.value;
            if (selectedParameterId === true)
            {
                text = Parameters.container.byId[parameterEffect.idRef].name + ' ' + text;
            }
            parameterEffectsCell.append($('<div>',
            {
                text: text,
                class: "highlight"
            }));
        });

        if (selectedParameterEffects.length > 0)
        {
            if (selectedParameterId === true)
            {
                row.data('summaryEffect', true);
            }
            else
            {
                const selectedParameterType = Parameters.container.byId[selectedParameterId].type;
                let summaryEffect = selectedParameterType.summariseEffects ?
                    selectedParameterType.summariseEffects(selectedParameterEffects) :
                    selectedParameterEffects[selectedParameterEffects.length - 1];
                if (selectedParameterType.simplifyEffect)
                {
                    summaryEffect = selectedParameterType.simplifyEffect(summaryEffect);
                }
                row.data('summaryEffect', summaryEffect);
            }
        }
        else
        {
            row.data('summaryEffect', false);
        }
    }

    function appendParameterOptionsTo(parameterSelect)
    {
        parameterSelect.append($('<option>', { value: 'false', text: i18next.t('common:none'), class: 'system' }));
        parameterSelect.append($('<option>', { value: 'true', text: i18next.t('common:all'), class: 'system' }));
        Parameters.container.sequence.forEach(function(parameter)
        {
            parameterSelect.append($('<option>', { value: 'v' + parameter.id, text: parameter.name }));
        });
    }

    function setSelectedParameterIdIn(parameterSelect)
    {
        parameterSelect.val(
            (selectedParameterId !== true && selectedParameterId !== false ? 'v' : '') +
                selectedParameterId
        );
    }

    function selectParameter(parameterId, effectCategory)
    {
        let needsListing = false;
        if (parameterId !== selectedParameterId)
        {
            selectedParameterId = parameterId;
            setSelectedParameterIdIn($('#element-list-parameter-select'));
            if (selectedParameterId === false)
            {
                $('#elementList').children('table').find('tr').each(function()
                {
                    $(this).find('td.parameterEffects').remove();
                    $(this).removeData('summaryEffect');
                });
                dehighlightNodes($('.highlight'));
                effectCategory = 'all';
            }
            else
            {
                needsListing = true;
            }
        }
        $('#element-list-effect-category-select').prop('disabled', selectedParameterId === false);
        if (effectCategory !== selectedEffectCategory)
        {
            selectedEffectCategory = effectCategory;
            $('#element-list-effect-category-select').val(effectCategory);
            if (!needsListing)
            {
                $('#elementList').children('table').find('tr').each(function()
                {
                    const hiddenFor = $(this).data('hiddenFor');
                    hiddenFor.effectCategory = !(selectedEffectCategory === 'all' ||
                        ($(this).data('summaryEffect') !== false ?
                            selectedEffectCategory === 'with' : selectedEffectCategory === 'without'));
                    setRowDisplayAndNodeHighlighting(Main.nodes[$(this).data('nodeID')], $(this), hiddenFor);
                });
            }
        }
        if (needsListing) listElements();
    }

    function setRowDisplayAndNodeHighlighting(node, row, hiddenFor)
    {
        const rowVisible = !(hiddenFor.effectCategory || hiddenFor.type);
        row.toggle(rowVisible);

        const nodeElement = $('#' + node.id);
        dehighlightNodes(nodeElement);
        const summaryEffect = row.data('summaryEffect');
        if (selectedParameterId !== false && rowVisible)
        {
            if (selectedEffectCategory !== 'without' && summaryEffect !== false)
            {
                nodeElement.addClass('highlight');
                if (selectedParameterId !== true)
                {
                    nodeElement.addClass('highlight-operator-' + summaryEffect.operator);
                    const categoriseValue = Parameters.container.byId[selectedParameterId].type.categoriseValue;
                    nodeElement.addClass('highlight-value-' + (categoriseValue ? categoriseValue(summaryEffect.value) : 'neutral'));
                }
                else
                {
                    nodeElement.addClass('highlight-value-neutral');
                }
            }
            else if (selectedEffectCategory === 'without' && summaryEffect === false)
            {
                nodeElement.addClass('highlight');
                nodeElement.addClass('highlight-no-effect');
            }
        }
    }

    function dehighlightNodes(nodeElements)
    {
        nodeElements
            .removeClass(['highlight', 'highlight-no-effect'])
            .removeClass(Object.keys(Types.valueCategories).map(function(name) { return 'highlight-value-' + name; }))
            .removeClass(Object.keys(Types.assignmentOperators).map(function(name) { return 'highlight-operator-' + name; }));
    }

    function isActive()
    {
        return $('#elementList').is(':visible');
    }

    function handleNodeTextUpdate(node)
    {
        if (!isActive()) return;
        const row = $('#element-list-' + node.id);
        if (row.length)
        {
            row.find('.text').text(node.text);
        }
        else
        {
            handleNodeCreation(node);
        }
    }

    function handleNodeDecorationsUpdate(node)
    {
        if (!isActive()) return;
        const row = $('#element-list-' + node.id);
        if (row.length)
        {
            if (selectedParameterId !== false)
            {
                const parameterEffectsCell = row.find('.parameterEffects').empty();
                processSelectedParameterEffects(parameterEffectsCell, node, row);
                const hiddenFor = row.data('hiddenFor');
                hiddenFor.effectCategory = !(selectedEffectCategory === 'all' ||
                    (row.data('summaryEffect') !== false ?
                        selectedEffectCategory === 'with' : selectedEffectCategory === 'without'));
                setRowDisplayAndNodeHighlighting(node, row, hiddenFor);
            }
        }
        else
        {
            handleNodeCreation(node);
        }
    }

    function handleNodeCreation(node)
    {
        const tree = Main.trees[node.parent];
        const row = createRow(tree, node);

        const pos = Utils.cssPosition($('#' + node.id));
        let previousRow = null;
        let previousPos = null;
        tree.nodes.forEach(function(otherNodeID)
        {
            const otherRow = $('#element-list-' + otherNodeID);
            if (!otherRow.length) return;
            const otherPos = Utils.cssPosition($('#' + otherNodeID));
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

    function handleNodeDeletion(node)
    {
        if (!isActive()) return;
        $('#element-list-' + node.id).remove();
    }

    function handleParameterTypeChange(oldParameter)
    {
        if (!isActive()) return;
        if (oldParameter.id === selectedParameterId) listElements();
    }

    function handleParametersChange()
    {
        if (!isActive()) return;
        const parameterSelect = $('#element-list-parameter-select');
        parameterSelect.empty();
        appendParameterOptionsTo(parameterSelect);
        setSelectedParameterIdIn(parameterSelect);
        if (selectedParameterId !== true && selectedParameterId !== false &&
            parameterSelect.val() !== 'v' + selectedParameterId)
        {
            selectParameter(false);
        }
    }
})();
