/*
//This program has been developed by students from the bachelor Computer Science at Utrecht University 
//within the Software and Game project courses 2013-2015
//©Copyright Utrecht University (Department of Information and Computing Sciences) 
*/

var Media;

(function()
{
    var mediaLists = 
    {
        videos: [],
        images: [],
        audios: []
    };
    
    Media = 
    {
        mediaLists: mediaLists,
        downloadFile: downloadFile,
        mediaDialog: mediaDialog,
        fillMediaSelectors: fillMediaSelectors
    };

    var loadedMediaHTML = false;

    $(document).ready(function()
    {
        // Event handlers.
        $("#mediaScreenButton").on('click', mediaDialog);
        $("#exportScript").on('click', downloadFile);
        $("#importScript").on('click', importDialog);
        $("#mediaScreen").html(Parts.getMediaScreenHTML());
        $("#importScreen").html(Parts.getImportScreenHTML());

        //getMediaList();
    });

    /*
     ** Public Functions
     */

    //offers the xml of the current script for download
    //adapted from work by Eric Bidelman (ericbidelman@chromium.org)
    function downloadFile()
    {
        //warn user before exporting an invalid script
        var errors = Validator.validate();
        var hasErrors = false;
        $.each(errors, function(index, value)
        {
            hasErrors = hasErrors || (value.level === 'error');
        });

        if (hasErrors)
        {
            if (!window.confirm(LanguageManager.sLang("edt_media_export_error")))
            {
                return false;
            }
        }

        Main.applyChanges();

        window.URL = window.webkitURL || window.URL;

        // var cleanUp = function(a)
        // {
        //     a.textContent = LanguageManager.sLang("edt_media_download_complete");
        //     a.dataset.disabled = true;
        // 
        //     // Need a small delay for the revokeObjectURL to work properly.
        //     setTimeout(function()
        //     {
        //         window.URL.revokeObjectURL(a.href);
        //     }, 1500);
        // };


        var MIME_TYPE = 'text/xml';
        var prevLink = $('#impExp a');

        if (prevLink)
        {
            window.URL.revokeObjectURL(prevLink.href);
            prevLink.remove();
        }

        var xml = Save.generateXML();
        var bb = new Blob([xml],
        {
            type: MIME_TYPE
        });

        var a = document.createElement('a');
        a.download = Metadata.metaObject.name + ".xml";
        a.href = window.URL.createObjectURL(bb);
        a.textContent = LanguageManager.sLang("edt_media_download_available");

        a.dataset.downloadurl = [MIME_TYPE, a.download, a.href].join(':');
        a.draggable = true; // Don't really need, but good practice.
        a.classList.add('dragout');

        $('#impExp').append(a);

        document.body.appendChild(a);

        a.click();

        document.body.removeChild(a);

        // a.onclick = function()
        // {
        //     if ('disabled' in this.dataset)
        //     {
        //         return false;
        //     }

        //     cleanUp(this);
        // };
    }

    function importDialog()
    {
        $("#importScreen").dialog(
        {
            title : LanguageManager.sLang("edt_media_import_title"),
            height: ParameterValues.heightMedia,
            width: ParameterValues.widthMedia,
            modal: true,
            buttons: [
            {
                text: LanguageManager.sLang("edt_media_import"),
                click: function()
                {
                    Load.importScript();
                    $("#importScreen").dialog('close');
                }
            },
            {
                text: LanguageManager.sLang("edt_common_close"),
                click: function()
                {
                    $("#importScreen").dialog(
                        'close');
                }
            }]
        });
    }


    // Show the media dialog.
    function mediaDialog()
    {
        $("#uploadStatus").empty();

        $("#mediaScreen").dialog(
        {
            title: LanguageManager.sLang("edt_media_title"),
            height: ParameterValues.heightMedia,
            width: ParameterValues.widthMedia,
            modal: true,
            // Feature currently not available
            /*buttons: [
            {
                text: LanguageManager.sLang("edt_media_upload"),
                click: function()
                {
                    startUpload();
                }
            },
            {
                text: LanguageManager.sLang("edt_common_close"),
                click: function()
                {
                    $("#mediaScreen").dialog('close');
                }
            }],
            close: function()
            {
                $("#main").focus();
            }*/
        });
    }

    // Fills the options for the Media Selectors in the sidebar
    function fillMediaSelectors()
    {
        $("#imageOptions").empty();
        $("#imageOptions").append(
            '<option value="(null)">'+LanguageManager.sLang("edt_media_none")+'</option>');

        $("#videoOptions").empty();
        $("#videoOptions").append(
            '<option value="(null)">'+LanguageManager.sLang("edt_media_none")+'</option>');

        $("#audioOptions").empty();
        $("#audioOptions").append(
            '<option value="(null)">'+LanguageManager.sLang("edt_media_none")+'</option>');

        Media.mediaLists.videos.forEach(function(video)
        {
            $("#videoOptions").append('<option value="' + video +
                '">' + video + "</option>");
        });
        Media.mediaLists.images.forEach(function(image)
        {
            $("#imageOptions").append('<option value="' + image +
                '">' + image + "</option>");
        });
        Media.mediaLists.audios.forEach(function(audio)
        {
            $("#audioOptions").append('<option value="' + audio +
                '">' + audio + "</option>");
        });
    }

    /*
     ** Private Functions
     */

    function startUpload()
    {
        var data = new FormData($("#uploadForm").get(0));
        var input = document.getElementsByName('file');
        for (var i = 0; i < input.length; i++)
        {
            data.append("file", input.files[i]);
        }
        data.append("scriptid", scriptid);

        $.ajax(
        {
            type: "POST",
            url: "some_url",
            contentType: false,
            processData: false,
            data: data,
            dataType: "json",
            // Message to show during upload and processing
            beforeSend: function()
            {
                $("#uploadStatus").html(
                    LanguageManager.sLang("edt_media_uploading")
                );
            },
            success: function(data)
            {
                // If the upload resulted in added media, update the mediaList.
                $("#uploadStatus").empty();
                if (data.error !== undefined)
                {
                    $("#uploadStatus").append(data.error);
                }
                else
                {
                    for (var i = 0; i < data.responses.length; i++)
                        $("#uploadStatus").append(data.responses[
                            i] + "<br>");
                    getMediaList();
                }

                $("#uploadForm").trigger('reset');
            },
            error: function(request, status, errorThrown)
            {
                $("#uploadStatus").empty();
                if (status == 'error') status =
                    LanguageManager.sLang("edt_media_transport_error");
                $("#uploadStatus").text(LanguageManager.sLang("edt_media_failed") + ': ' +
                    status +
                    ((errorThrown !== undefined &&
                            errorThrown !== '') ? ' (' +
                        errorThrown + ')' : '')
                );
                $("#uploadForm").trigger('reset');
            }
        });
    }

    // Gets a list of all available media
    function getMediaList()
    {
        $.ajax(
        {
            type: "POST",
            url: "some_url",
            data:
            {
                scriptid: scriptid
            },
            dataType: "json",
            success: function(data)
            {
                if (data.error !== undefined)
                    alert(LanguageManager.sLang("edt_media_failed") + ': ' + data.error);
                else
                    Media.mediaLists = data.media;
            },
            error: function(request, status, errorThrown)
            {
                if (status == 'error') status =
                    'transporterror';
                alert(LanguageManager.sLang("edt_media_failed") + ': ' +
                    status +
                    ((errorThrown !== undefined &&
                            errorThrown !== '') ? ' (' +
                        errorThrown + ')' : '')
                );
            }
        });
    }
})();
