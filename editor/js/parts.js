/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

var Parts;

(function ()
{
    "use strict";

    //Raw HTML that needs to be exported.
    Parts =
    {
        getDraftScreenHTML: getDraftScreenHTML,
        getAddParameterEffectButtonHTML: getAddParameterEffectButtonHTML,
        getDeleteParentButtonHTML: getDeleteParentButtonHTML,
        getParameterDefinitionHTML: getParameterDefinitionHTML
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

    function getParameterDefinitionHTML()
    {
        var typeOptions = "";
        for (var typeName in Types.primitives)
        {
            typeOptions += '<option value="' + typeName + '">' + i18next.t('types:primitives.' + typeName + '.translation') + '</option>';
        }
        return '' +
            '<tr class="newParameter">' +
                '<td class="handle">↕</td>' +
                '<td>' +
                    '<input type="text" class="name" style="width:197px;" />' +
                '</td>' +
                '<td>' +
                    '<select class="parameter-type-select" >' +
                        typeOptions +
                    '</select>' +
                '</td>' +
                '<td>' +
                    '<input type="checkbox" class="parameter-evaluated"></input>' +
                '</td>' +
                '<td>' +
                    '<span class="parameter-min-container"></span>' +
                '</td>' +
                '<td>' +
                    '<span class="parameter-max-container"></span>' +
                '</td>' +
                '<td>' +
                    '<span class="parameter-initial-value-container"></span>' +
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
})();
