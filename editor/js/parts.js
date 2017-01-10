/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

var Parts;

(function ()
{
    "use strict";

    //Raw HTML that needs to be exported.
    Parts =
    {
        getDraftScreenHTML: getDraftScreenHTML,
        getParameterEffectHTML: getParameterEffectHTML,
        getAddParameterEffectButtonHTML: getAddParameterEffectButtonHTML,
        getDeleteParentButtonHTML: getDeleteParentButtonHTML,
        getEnumerationScreenHTML: getEnumerationScreenHTML,
        getGroupPreconditionHTML: getGroupPreconditionHTML,
        getMetaScreenHTML: getMetaScreenHTML,
        getParameterScreenHTML: getParameterScreenHTML,
        getParameterDefinitionHTML: getParameterDefinitionHTML,
        getPreconditionHTML: getPreconditionHTML,
        getImportScreenHTML: getImportScreenHTML
    };

    function getDraftScreenHTML()
    {
        return '' +
            '<div id="itemControls">' +
                '<button class="clear">' + i18next.t('draft:delete_all') + '</button>' +
            '</div>' +
            '<table style="width:100%">' +
                '<tr>' +
                    '<table id="draftTableHeaders" style="width:100%">' +
                        '<colgroup>' +
                            '<col span="1" style="width: 15%;">' +
                            '<col span="1" style="width: 7.5%;">' +
                            '<col span="1" style="width: 35%;">' +
                            '<col span="1" style="width: 15%;">' +
                            '<col span="1" style="width: 10%;">' +
                            '<col span="1" style="width: 12.5%;">' +
                         '</colgroup>' +
                         '<tr>' +
                            '<th class="dragHandle" id="draftDragAll" title="' + i18next.t('draft:drag_all') + '">[[::]]</th>' +
                            '<th class="col0" title="' + i18next.t('common:player') + ' / ' +
                                i18next.t('common:computer') + ' / ' +
                                i18next.t('common:situation') + '">' +
                                    i18next.t('draft:letter.player') + '/' +
                                    i18next.t('draft:letter.computer') + '/' +
                                    i18next.t('draft:letter.situation') +
                            '</th>' +
                            '<th class="col1">' + i18next.t('parts:statement') + '</th>' +
                        '</tr>' +
                    '</table>' +
                '</tr>' +
                '<tr>' +
                    '<div id="tableSizeFixer">' +
                        '<table id="draftTable" data-properties="type,statement" style="width:100%">' +
                            '<colgroup>' +
                               '<col span="1" style="width: 15%;">' +
                               '<col span="1" style="width: 7.5%;">' +
                               '<col span="1" style="width: 35%;">' +
                               '<col span="1" style="width: 15%;">' +
                               '<col span="1" style="width: 10%;">' +
                               '<col span="1" style="width: 12.5%;">' +
                            '</colgroup>' +
                        '</table>' +
                    '</div>' +
                '</tr>' +
            '</table>' +
            '<button id="addDraftItem" class="add">' + i18next.t('draft:add_item') + '</button>';
    }

    function getParameterEffectHTML()
    {
        return '' +
            '<div>' +
                '<select class="parameter-idref-select"></select>' +
                '<div class="parameter-effect-container" style="display:inline"/>' +
                '<button type="button" class="deleteParent" title="'+i18next.t('common:delete')+'"><img src="' + editor_url + 'png/others/minus.png" alt="-"></button>' +
            '</div>';
    }

    function getDeleteParentButtonHTML()
    {
        return '' + '<button type="button" class="deleteParent" title="'+i18next.t('common:delete')+'"><img src="' + editor_url + 'png/others/minus.png" alt="-"></button>';
    }

    function getAddParameterEffectButtonHTML()
    {
        return '' +
            '<button title="' + i18next.t('common:add') + '">' +
                '<img src="' + editor_url + 'png/others/plus.png" alt="+">' + ' ' + i18next.t('parts:add_effect') +
            '</button>';
    }

    function getGroupPreconditionHTML()
    {
        return '' +
            '<div class="precondition groupprecondition empty">' +
                '<div class="emptyLabel">'+i18next.t('parts:empty_group')+'</div>' +
                '<div class="singleLabel hidden">'+i18next.t('parts:one_condition_group')+':</div>' +
                '<div class="groupPreconditionRadioDiv">' +
                    '<label><input type="radio" name="initialRadioName" value="and" checked="checked" />'+i18next.t('parts:all_true')+'</label>' +
                    '<label><input type="radio" name="initialRadioName" value="or" />'+i18next.t('parts:one_true')+'</label>' +
                '</div>' +
                '<div class="groupPreconditionDiv"></div>' +
                '<button class="addPrecondition"><img src="' + editor_url + 'png/others/plus.png" alt="+"> '+i18next.t('parts:add_condition')+'</button>' +
                '<button class="addGroupPrecondition"><img src="' + editor_url + 'png/others/plus.png" alt="+"> '+i18next.t('parts:add_group')+'</button>' +
                '' +
                '<button type="button" class="deleteParent" title="'+i18next.t('common:delete')+'"><img src="' + editor_url + 'png/others/minus.png" alt="-"> '+i18next.t('parts:delete_group')+'</button>' +
            '</div>';
    }

    function getParameterScreenHTML()
    {
        return '' +
            '<div id="allParamsDiv">' +
                '<table>' +
                    '<thead id="paramsTableHead" class="hidden">' +
                        '<tr>' +
                            '<th>'+i18next.t('parts:name')+'</th>' +
                            '<th>'+i18next.t('parts:type')+'</th>' +
                            '<th>'+i18next.t('parts:initial_value')+'</th>' +
                            '<th>'+i18next.t('parts:description')+'</th>' +
                        '</tr>' +
                    '</thead>' +
                    '<tbody id="params">' +
                    '</tbody>' +
                '</table>' +
                '<button type="button" id="addParameter"><img src="' + editor_url + 'png/others/plus.png" title="'+i18next.t('common:add')+'"></button>' +
                '<button type="button" id="addTimeParameter"><img src="' + editor_url + 'png/others/stopwatch.png" title="'+i18next.t('parts:add_time_title')+'"></button>' +
            '</div>';
    }

    function getEnumerationScreenHTML()
    {
        return '' +
            '<div>' +
                '<label>' +i18next.t('parts:values')+'</label>' +
                '<ul id="enumeration-value-list">' +
                    '<li>' +
                        '<input autofocus type="text" id="enumeration-value-input"/>' +
                        '<button type="button" id="add-enumeration-value-button"><img src="' + editor_url + 'png/others/plus.png" title="'+i18next.t('common:add')+'"></button>' +
                    '</li>' +
                '</ul>' +
            '</div>';
    }

    function getMetaScreenHTML()
    {
        var scenarioLanguageRow;
        if (Config.configObject.settings.languages.sequence.length > 0)
        {
            var scenarioLanguageSelect = $('<select>', { id: "scenarioLanguage" });
            Config.configObject.settings.languages.sequence.forEach(function(language)
            {
                scenarioLanguageSelect.append($('<option>', { value: language.code, text: language.name }));
            });
            scenarioLanguageRow = $('<tr>');
            scenarioLanguageRow.append($('<th>').append($('<label>', { for: "scenarioLanguage", text: i18next.t('parts:language') + ':' })));
            scenarioLanguageRow.append($('<td>').append(scenarioLanguageSelect));
        }
        return '' +
            '<div>' +
                '<table>' +
                    '<thead id="general"><th colspan="2"><h3>'+i18next.t('parts:general')+'</h3></th></thead>' +
                    '<tbody>' +
                        '<tr>' +
                            '<th><label for="scenarioName">'+i18next.t('parts:scenario_name')+':</label></th>' +
                            '<td><input type="text" id="scenarioName" /></td>' +
                        '</tr>' +
                        (scenarioLanguageRow ? scenarioLanguageRow.prop('outerHTML') : "") +
                        '<tr>' +
                            '<th><label for="scenarioDifficulty">'+i18next.t('parts:difficulty.translation')+':</label></th>' +
                            '<td><select id="scenarioDifficulty">' +
                                '<option value="very_easy">'+i18next.t('parts:difficulty.very_easy')+'</option>' +
                                '<option value="easy">'+i18next.t('parts:difficulty.easy')+'</option>' +
                                '<option value="medium" selected="selected">'+i18next.t('parts:difficulty.medium')+'</option>' +
                                '<option value="difficult">'+i18next.t('parts:difficulty.hard')+'</option>' +
                                '<option value="very_difficult">'+i18next.t('parts:difficulty.very_hard')+'</option>' +
                            '</select></td>' +
                        '</tr>' +
                        '<tr id="scenarioDescription-container">' +
                            '<th><label for="scenarioDescription">'+i18next.t('parts:description')+':</label></th>' +
                            '<td><textarea id="scenarioDescription" ' +
                                ' style="height: 200px; width: 100%; -moz-box-sizing: border-box; box-sizing: border-box">' +
                            '</textarea></td>' +
                        '</tr>' +
                    '</tbody>' +
                    '<thead id="authors-header"><th><h3>'+i18next.t('parts:authors')+'</h3></th></thead>' +
                    '<tbody id="authors">' +
                        '<tr>' +
                            '<th><h4>'+i18next.t('parts:name')+'</h4></th>' +
                            '<th><h4>'+i18next.t('parts:email')+'</h4></th>' +
                            '<th><h4>'+i18next.t('parts:startDate')+'</h4></th>' +
                            '<th><h4>'+i18next.t('parts:endDate')+'</h4></th>' +
                        '</tr>' +
                    '</tbody>' +
                    '<thead id="meta-property-values-header" ></thead>' +
                    '<tbody id="meta-property-values" style="display:none"/>' +
                    '<thead><th colspan="2"><h3>' +i18next.t('common:characters')+ '</h3></th></thead>' +
                    '<tbody id="meta-character-property-values" style="display:none">' +
                        '<tr><td colspan="2" id="character-tabs"/></tr>' +
                    '</tbody>' +
                '</table>' +
            '</div>';
    }

    function getImportScreenHTML()
    {
        return '' +
                '<div id="impExp">' +
                    '<form id="importForm" action="" method="post" enctype="multipart/form-data">' +
                        '<label for="file">'+i18next.t('parts:file_to_import')+':</label>' +
                        '<input type="file" accept=".txt,.xml" name="import[]" id="import" multiple="false"/>' +
                    '</form>' +
                '</div>' +
            '</div>';
    }

    function getParameterDefinitionHTML()
    {
        var typeOptions = "";
        for (var typeName in Config.types)
        {
            typeOptions += '<option value="' + typeName + '">' + i18next.t('config:types.' + typeName + '.translation') + '</option>';
        }
        return '' +
            '<tr class="newParameter">' +
                '<td>' +
                    '<input type="text" class="name" style="width:197px;" />' +
                '</td>' +
                '<td style="display:inline-block; white-space:nowrap" >' +
                    '<select class="parameter-type-select" >' +
                        typeOptions +
                    '</select>' +
                '</td>' +
                '<td>' +
                    '<div style="display:inline" class="parameter-initial-value-container"/>' +
                '</td>' +
                '<td>' +
                    '<textarea class="description" style="height:1em;">' +
                    '</textarea>' +
                '</td>' +
                '<td>' +
                    '<button type="button" class="deleteParent" title="'+i18next.t('common:delete')+'"><img src="' + editor_url + 'png/others/minus.png" alt="-"></button>' +
                '</td>' +
            '</tr>';
    }

    function getPreconditionHTML()
    {
        return '' +
            '<div class="precondition">' +
                '<select class="parameter-idref-select">' +
                '</select>' +
                '<div class="precondition-test-container" style="display:inline"/>' +
                '<button type="button" class="deleteParent" title="'+i18next.t('common:delete')+'"><img src="' + editor_url + 'png/others/minus.png" alt="-"></button>' +
            '</div>';
    }
})();
