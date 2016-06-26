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
                '<button class="clear">' + LanguageManager.sLang("edt_draft_delete_all") + '</button>' +
            '</div>' +
            '<table style="width:100%">' +
                '<tr>' +
                    '<table id="draftTableHeaders" style="width:100%">' +
                        '<colgroup>' +
                            '<col span="1" style="width: 15%;">' +
                            '<col span="1" style="width: 5%;">' +
                            '<col span="1" style="width: 35%;">' +
                            '<col span="1" style="width: 15%;">' +
                            '<col span="1" style="width: 10%;">' +
                            '<col span="1" style="width: 15%;">' +
                         '</colgroup>' +
                         '<tr>' +
                            '<th class="dragHandle" id="draftDragAll" title="' + LanguageManager.sLang("edt_draft_drag_all") + '">[[::]]</th>' +
                            '<th class="col0" title="' + LanguageManager.sLang("edt_common_player") + ' / ' + LanguageManager.sLang("edt_common_computer") + '">' +
                                LanguageManager.sLang("edt_draft_letter_player") + '/' + LanguageManager.sLang("edt_draft_letter_computer") +
                            '</th>' +
                            '<th class="col1">' + LanguageManager.sLang("edt_parts_statement") + '</th>' +
                        '</tr>' +
                    '</table>' +
                '</tr>' +
                '<tr>' +
                    '<div id="tableSizeFixer">' +
                        '<table id="draftTable" data-properties="type,statement" style="width:100%">' +
                            '<colgroup>' +
                               '<col span="1" style="width: 15%;">' +
                               '<col span="1" style="width: 5%;">' +
                               '<col span="1" style="width: 35%;">' +
                               '<col span="1" style="width: 15%;">' +
                               '<col span="1" style="width: 10%;">' +
                               '<col span="1" style="width: 15%;">' +
                            '</colgroup>' +
                        '</table>' +
                    '</div>' +
                '</tr>' +
            '</table>' +
            '<button id="addDraftItem" class="add">' + LanguageManager.sLang("edt_draft_add_item") + '</button>';
    }

    function getParameterEffectHTML()
    {
        return '' +
            '<div>' +
                '<select class="parameter-idref-select"></select>' +
                '<div class="parameter-effect-container" style="display:inline"/>' +
                '<button type="button" class="deleteParent" title="'+LanguageManager.sLang("edt_common_delete")+'"><img src="' + editor_url + 'png/others/minus.png" alt="-"></button>' +
            '</div>';
    }

    function getDeleteParentButtonHTML()
    {
        return '' + '<button type="button" class="deleteParent" title="'+LanguageManager.sLang("edt_common_delete")+'"><img src="' + editor_url + 'png/others/minus.png" alt="-"></button>';
    }

    function getAddParameterEffectButtonHTML()
    {
        return '' +
            '<button title="' + LanguageManager.sLang('edt_common_add') + '">' +
                '<img src="' + editor_url + 'png/others/plus.png" alt="+">' + ' ' + LanguageManager.sLang('edt_parts_add_effect') +
            '</button>';
    }

    function getGroupPreconditionHTML()
    {
        return '' +
            '<div class="precondition groupprecondition empty">' +
                '<div class="emptyLabel">'+LanguageManager.sLang("edt_parts_empty_group")+'</div>' +
                '<div class="singleLabel hidden">'+LanguageManager.sLang("edt_parts_one_condition_group")+':</div>' +
                '<div class="groupPreconditionRadioDiv">' +
                    '<label><input type="radio" name="initialRadioName" value="and" checked="checked" />'+LanguageManager.sLang("edt_parts_all_true")+'</label>' +
                    '<label><input type="radio" name="initialRadioName" value="or" />'+LanguageManager.sLang("edt_parts_one_true")+'</label>' +
                '</div>' +
                '<div class="groupPreconditionDiv"></div>' +
                '<button class="addPrecondition"><img src="' + editor_url + 'png/others/plus.png" alt="+"> '+LanguageManager.sLang("edt_parts_add_condition")+'</button>' +
                '<button class="addGroupPrecondition"><img src="' + editor_url + 'png/others/plus.png" alt="+"> '+LanguageManager.sLang("edt_parts_add_group")+'</button>' +
                '' +
                '<button type="button" class="deleteParent" title="'+LanguageManager.sLang("edt_common_delete")+'"><img src="' + editor_url + 'png/others/minus.png" alt="-"> '+LanguageManager.sLang("edt_parts_delete_group")+'</button>' +
            '</div>';
    }

    function getParameterScreenHTML()
    {
        return '' +
            '<div id="allParamsDiv">' +
                '<table>' +
                    '<thead id="paramsTableHead" class="hidden">' +
                        '<tr>' +
                            '<th>'+LanguageManager.sLang("edt_parts_name")+'</th>' +
                            '<th>'+LanguageManager.sLang("edt_parts_type")+'</th>' +
                            '<th>'+LanguageManager.sLang("edt_parts_initial_value")+'</th>' +
                            '<th>'+LanguageManager.sLang("edt_parts_description")+'</th>' +
                        '</tr>' +
                    '</thead>' +
                    '<tbody id="params">' +
                    '</tbody>' +
                '</table>' +
                '<button type="button" id="addParameter"><img src="' + editor_url + 'png/others/plus.png" title="'+LanguageManager.sLang("edt_common_add")+'"></button>' +
                '<button type="button" id="addTimeParameter"><img src="' + editor_url + 'png/others/stopwatch.png" title="'+LanguageManager.sLang("edt_parts_add_time_title")+'"></button>' +
            '</div>';
    }

    function getEnumerationScreenHTML()
    {
        return '' +
            '<div>' +
                '<label>' +LanguageManager.sLang("edt_parts_values")+'</label>' +
                '<ul id="enumeration-value-list">' +
                    '<li>' +
                        '<input autofocus type="text" id="enumeration-value-input"/>' +
                        '<button type="button" id="add-enumeration-value-button"><img src="' + editor_url + 'png/others/plus.png" title="'+LanguageManager.sLang("edt_common_add")+'"></button>' +
                    '</li>' +
                '</ul>' +
            '</div>';
    }

    function getMetaScreenHTML()
    {
        return '' +
            '<div>' +
                '<table>' +
                    '<thead id="general"><th colspan="2"><h3>'+LanguageManager.sLang("edt_parts_general")+'</h3></th></thead>' +
                    '<tbody>' +
                        '<tr>' +
                            '<th><label for="scenarioName">'+LanguageManager.sLang("edt_parts_scenario_name")+':</label></th>' +
                            '<td><input type="text" id="scenarioName" /></td>' +
                        '</tr>' +
                        '<tr>' +
                            '<th><label for="scenarioDifficulty">'+LanguageManager.sLang("edt_parts_difficulty")+':</label></th>' +
                            '<td><select id="scenarioDifficulty">' +
                                '<option value="very_easy">'+LanguageManager.sLang("edt_parts_very_easy")+'</option>' +
                                '<option value="easy">'+LanguageManager.sLang("edt_parts_easy")+'</option>' +
                                '<option value="medium" selected="selected">'+LanguageManager.sLang("edt_parts_medium")+'</option>' +
                                '<option value="difficult">'+LanguageManager.sLang("edt_parts_hard")+'</option>' +
                                '<option value="very_difficult">'+LanguageManager.sLang("edt_parts_very_hard")+'</option>' +
                            '</select></td>' +
                        '</tr>' +
                        '<tr id="scenarioDescription-container">' +
                            '<th><label for="scenarioDescription">'+LanguageManager.sLang("edt_parts_description")+':</label></th>' +
                            '<td><textarea id="scenarioDescription"' +
                                'style="height: 200px; width: 100%; -moz-box-sizing: border-box; box-sizing: border-box">' +
                            '</textarea></td>' +
                        '</tr>' +
                    '</tbody>' +
                    '<thead id="meta-property-values-header" ></thead>' +
                    '<tbody id="meta-property-values" style="display:none"/>' +
                    '<thead><th colspan="2"><h3>' +LanguageManager.sLang("edt_common_characters")+ '</h3></th></thead>' +
                    '<tbody id="meta-character-property-values" style="display:none">' +
                        '<tr><td colspan="2" id="character-tabs"/></tr>' +
                    '</tbody>' +
                    '<thead><th colspan="2"><h3>'+LanguageManager.sLang("edt_parts_advanced")+'</h3></th></thead>' +
                    '<tbody id="advanced">' +
                        '<tr>' +
                            '<th><label for="operatorSelection">'+LanguageManager.sLang("edt_parts_change_type")+':</label></th>' +
                            '<td><select class="operator" name="defaultOperator" id="defaultOperatorSelect">' +
                                '<option value="delta" selected="selected">'+LanguageManager.sLang("edt_parts_delta")+'</option>' +
                                '<option value="set">'+LanguageManager.sLang("edt_parts_set")+'</option>' +
                            '</select></td>' +
                        '</tr>' +
                    '</tr>' +
                '</table>' +
            '</div>';
    }

    function getImportScreenHTML()
    {
        return '' +
                '<div id="impExp">' +
                    '<form id="importForm" action="" method="post" enctype="multipart/form-data">' +
                        '<label for="file">'+LanguageManager.sLang("edt_parts_file_to_import")+':</label>' +
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
            typeOptions += '<option value="' + typeName + '">' + LanguageManager.sLang("edt_config_types_" + typeName) + '</option>';
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
                    '<button type="button" class="deleteParent" title="'+LanguageManager.sLang("edt_common_delete")+'"><img src="' + editor_url + 'png/others/minus.png" alt="-"></button>' +
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
                '<button type="button" class="deleteParent" title="'+LanguageManager.sLang("edt_common_delete")+'"><img src="' + editor_url + 'png/others/minus.png" alt="-"></button>' +
            '</div>';
    }
})();
