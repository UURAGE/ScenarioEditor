/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

var Parts;

(function () 
{
    //Raw HTML that needs to be exported.
    Parts =
    {
        getFeedbackScreenHTML: getFeedbackScreenHTML,
        getConversationTextHTML: getConversationTextHTML,
        getDraftScreenHTML: getDraftScreenHTML,
        getParameterEffectHTML: getParameterEffectHTML,
        getGroupPreconditionHTML: getGroupPreconditionHTML,
        getIntentionHTML: getIntentionHTML,
        getMediaScreenHTML: getMediaScreenHTML,
        getMetaScreenHTML: getMetaScreenHTML,
        getParameterScreenHTML: getParameterScreenHTML,
        getParameterDefinitionHTML: getParameterDefinitionHTML,
        getPreconditionHTML: getPreconditionHTML,
        getScoreHTML: getScoreHTML,
        getImportScreenHTML: getImportScreenHTML
    };

    function getFeedbackScreenHTML() 
    {
        return '' +
            '<div id="paramTabs">' +
            '</div>';
    }

    function getConversationTextHTML() 
    {
        return '' +
            '<div class="conversation">' +
                '<img class="computerText hidden" src="' + editor_url + 'png/conversation/conversation_computer.png" alt="'+LanguageManager.sLang("edt_common_computer")+'">' +
                '<img class="playerText hidden" src="' + editor_url + 'png/conversation/conversation_player.png" alt="'+LanguageManager.sLang("edt_common_player")+'">' +
                '<img class="situationText hidden" src="' + editor_url + 'png/conversation/conversation_situation.png" alt="'+LanguageManager.sLang("edt_common_situation")+'">' +
                '<textarea class="text"></textarea>' +
                '<button type="button" class="deleteParent" title="'+LanguageManager.sLang("edt_common_delete")+'"><img src="' + editor_url + 'png/others/minus.png" alt="-"></button>' +
            '</div>';
    }

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
                            '<th class="col2">' + LanguageManager.sLang("edt_parts_intention") + '</th>' +
                            '<th class="col4">' + LanguageManager.sLang("edt_parts_feedback") + '</th>' +
                        '</tr>' +
                    '</table>' +
                '</tr>' +
                '<tr>' +
                    '<div id="tableSizeFixer">' +
                        '<table id="draftTable" data-properties="type,statement,intention,effect,feedback" style="width:100%">' +
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
            '<div class="ParametrEffect">' +
                '<select class="parameterid"></select>' +
                getChangeTypeHTML() +
                '<input type="number" class="value" pattern="[+\\-]?\\d*" style="width:40px;" />' +
                '<button type="button" class="deleteParent" title="'+LanguageManager.sLang("edt_common_delete")+'"><img src="' + editor_url + 'png/others/minus.png" alt="-"></button>' +
            '</div>';
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

    function getIntentionHTML() 
    {
        return '' +
            '<div class="intention">' +
                '<input type="text" class="name"></input>' +
                '<button type="button" class="deleteParent" title="'+LanguageManager.sLang("edt_common_delete")+'"><img src="' + editor_url + 'png/others/minus.png" alt="-"></button>' +
            '</div>';
    }

    function getMediaScreenHTML() 
    {
        return '' +
            '<div>' +
                /*'<form id="uploadForm" action="" method="post" enctype="multipart/form-data">' +
                    '<label for="file">'+LanguageManager.sLang("edt_parts_add_file")+':</label>' +
                    '<input type="file" accept="image/png,video/mp4,audio/mp3,application/ogg,audio/ogg" name="file[]" id="file" multiple="multiple"/>' +
                '</form>' +*/
            '</div>' +
            '<p>' +
                "Feature currently not available" +//LanguageManager.sLang("edt_parts_file_warning") +
            '</p>' +
        '<div id="uploadStatus"></div>';
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
                                '<label for="scriptName">'+LanguageManager.sLang("edt_parts_script_name")+':</label>' +
                                '<input type="text" id="scriptName" />' +
                            '</div>' +
                            '<div>' +
                                '<label for="scriptDifficulty">'+LanguageManager.sLang("edt_parts_difficulty")+':</label>' +
                                '<select id="scriptDifficulty">' +
                                    '<option value="very_easy">'+LanguageManager.sLang("edt_parts_very_easy")+'</option>' +
                                    '<option value="easy">'+LanguageManager.sLang("edt_parts_easy")+'</option>' +
                                    '<option value="medium" selected="selected">'+LanguageManager.sLang("edt_parts_medium")+'</option>' +
                                    '<option value="difficult">'+LanguageManager.sLang("edt_parts_hard")+'</option>' +
                                    '<option value="very_difficult">'+LanguageManager.sLang("edt_parts_very_hard")+'</option>' +
                                '</select>' +
                            '</div>' +
                            '<div id="scriptDescription-container">' +
                                '<div>' +
                                    '<label for="scriptDescription">'+LanguageManager.sLang("edt_parts_description")+':</label></ br>' +
                                '</div>' +
                                '<textarea id="scriptDescription"' +
                                    'style="height: 200px; width: 100%; -moz-box-sizing: border-box; box-sizing: border-box">' +
                                '</textarea>' +
                            '</div>' +
                        '</div>' +
                        '<div id="appearance"class="sub-formTable">' +
                            '<h3>'+LanguageManager.sLang("edt_parts_appearance")+'</h3>' +
                            '<div>' +
                                '<label for="character">Character:</label>' +
                                '<input type="text" id="character" />' +
                            '</div>' +
                        '</div>' +
                        '<div id="meta-properties" class="sub-formTable" style="display:none">' +
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
                '<select class="parameterid">' +
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
