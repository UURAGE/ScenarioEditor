/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

var Parts;

(function ()
{
    "use strict";

    //Raw HTML that needs to be exported.
    Parts =
    {
        getAddParameterEffectButtonHTML: getAddParameterEffectButtonHTML,
        getDeleteParentButtonHTML: getDeleteParentButtonHTML
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
})();
