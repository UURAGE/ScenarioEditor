/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

var Parts;

(function ()
{
    //Raw HTML that needs to be exported.
    Parts =
    {
        getDraftScreenHTML: getDraftScreenHTML,
        getParameterEffectHTML: getParameterEffectHTML,
        getAddParameterEffectButtonHTML: getAddParameterEffectButtonHTML,
        getDeleteParentButtonHTML: getDeleteParentButtonHTML,
        getGroupPreconditionHTML: getGroupPreconditionHTML,
        getMetaScreenHTML: getMetaScreenHTML,
        getParameterScreenHTML: getParameterScreenHTML,
        getParameterDefinitionHTML: getParameterDefinitionHTML,
        getPreconditionHTML: getPreconditionHTML,
        getScoreHTML: getScoreHTML,
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

    function getChangeTypeHTML()
    {
        return '' +
            '<select class="changeType">' +
                        '<option value="delta" selected="selected">'+LanguageManager.sLang("edt_parts_delta")+'</option>' +
                        '<option value="set" >'+LanguageManager.sLang("edt_parts_set")+'</option>' +
            '</select>';
    }

    function getParameterEffectHTML()
    {
        return '' +
            '<div>' +
                '<select class="parameter-idref-select"></select>' +
                getChangeTypeHTML() +
                '<input type="number" class="value" pattern="[+\\-]?\\d*" style="width:40px;" />' +
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
                '<label>Parameters:</label>' +
                '<table>' +
                    '<thead id="paramsTableHead" class="hidden">' +
                        '<tr>' +
                            '<th>'+LanguageManager.sLang("edt_parts_name")+'</th>' +
                            '<th>'+LanguageManager.sLang("edt_parts_value")+'</th>' +
                            '<th>'+LanguageManager.sLang("edt_parts_weight")+'</th>' +
                            '<th>'+LanguageManager.sLang("edt_parts_min")+'</th>' +
                            '<th>'+LanguageManager.sLang("edt_parts_max")+'</th>' +
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

    function getMetaScreenHTML()
    {
        return '' +
            '<div>' +
                '<form id="metaForm" action="">' +
                    '<div class="formTable">' +
                        '<div id="general" class="sub-formTable">' +
                            '<h3>'+LanguageManager.sLang("edt_parts_general")+'</h3>' +
                            '<div>' +
                                '<label for="scenarioName">'+LanguageManager.sLang("edt_parts_scenario_name")+':</label>' +
                                '<input type="text" id="scenarioName" />' +
                            '</div>' +
                            '<div>' +
                                '<label for="scenarioDifficulty">'+LanguageManager.sLang("edt_parts_difficulty")+':</label>' +
                                '<select id="scenarioDifficulty">' +
                                    '<option value="very_easy">'+LanguageManager.sLang("edt_parts_very_easy")+'</option>' +
                                    '<option value="easy">'+LanguageManager.sLang("edt_parts_easy")+'</option>' +
                                    '<option value="medium" selected="selected">'+LanguageManager.sLang("edt_parts_medium")+'</option>' +
                                    '<option value="difficult">'+LanguageManager.sLang("edt_parts_hard")+'</option>' +
                                    '<option value="very_difficult">'+LanguageManager.sLang("edt_parts_very_hard")+'</option>' +
                                '</select>' +
                            '</div>' +
                            '<div id="scenarioDescription-container">' +
                                '<div>' +
                                    '<label for="scenarioDescription">'+LanguageManager.sLang("edt_parts_description")+':</label></ br>' +
                                '</div>' +
                                '<textarea id="scenarioDescription"' +
                                    'style="height: 200px; width: 100%; -moz-box-sizing: border-box; box-sizing: border-box">' +
                                '</textarea>' +
                            '</div>' +
                        '</div>' +
                        '<div id="meta-character-property-values" class="sub-formTable" style="display:none">' +
                            '<h3>' +LanguageManager.sLang("edt_parts_character_properties")+ '</h3>' +
                            '<div>'+'<div id="character-tabs"/>'+'</div>' +
                        '</div>' +
                        '<div id="meta-property-values" class="sub-formTable" style="display:none">' +
                            '<h3>'+LanguageManager.sLang("edt_parts_properties")+'</h3>' +
                        '</div>' +
                        '<div id="advanced"class="sub-formTable">' +
                            '<h3>'+LanguageManager.sLang("edt_parts_advanced")+'</h3>' +
                            '<div>' +
                                '<label for="changeTypeSelection">'+LanguageManager.sLang("edt_parts_change_type")+':</label>' +
                                '<select class="changeType" name="defaultChangeType" id="defaultChangeTypeSelect">' +
                                    '<option value="delta" selected="selected">'+LanguageManager.sLang("edt_parts_delta")+'</option>' +
                                    '<option value="set">'+LanguageManager.sLang("edt_parts_set")+'</option>' +
                                '</select>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<input class="hidden" type="submit" value="Opslaan" />' +
                '</form>' +
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
        return '' +
            '<tr class="newParameter">' +
                '<td>' +
                    '<input type="text" class="name" style="width:197px;" />' +
                '</td>' +
                '<td>' +
                    '<input type="number" class="initialValue" pattern="[+\\-]?\\d*" style="width:40px;" value="0" />' +
                '</td>' +
                '<td>' +
                    '<input type="number" class="weightForFinalScore" pattern="[+\\-]?\\d*" style="width:40px" value="0" />' +
                '</td>' +
                ' <td>' +
                '<input type="number" class="minimumScore" pattern="[+\-]?\\d*" style="width:40px" value="0" />' +
                '</td>' +
                '<td>' +
                    '<input type="number" class="maximumScore" min="0" pattern="[+\-]?\\d*" style="width:40px" value="10" />' +
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
                '<select class="test">' +
                    '<option value="greaterThan">&gt;</option>' +
                    '<option value="lessThan">&lt;</option>' +
                    '<option value="equalTo">=</option>' +
                    '<option value="notEqualTo">&ne;</option>' +
                    '<option value="lessThanEqualTo">&le;</option>' +
                    '<option value="greaterThanEqualTo">&ge;</option>' +
                '</select>' +
                '<input type="number" class="value" pattern="[+\\-]?\\d*" style="width:40px;"></input>' +
                '<button type="button" class="deleteParent" title="'+LanguageManager.sLang("edt_common_delete")+'"><img src="' + editor_url + 'png/others/minus.png" alt="-"></button>' +
            '</div>';
    }

    function getScoreHTML()
    {
        return '' +
            '<div class="scores">' +
                '<span class="name">' +
                '</span>' +
                '<div class="score">' +
                '</div>' +
                '' +
            '</div>';
    }
})();
