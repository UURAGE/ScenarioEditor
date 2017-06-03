/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

var Parts;

(function ()
{
    "use strict";

    //Raw HTML that needs to be exported.
    Parts =
    {
        getAddParameterEffectButtonHTML: getAddParameterEffectButtonHTML,
        getDeleteParentButtonHTML: getDeleteParentButtonHTML,
        getParameterDefinitionHTML: getParameterDefinitionHTML
    };

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
