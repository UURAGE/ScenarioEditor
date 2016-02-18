/*
//This program has been developed by students from the bachelor Computer Science at Utrecht University 
//within the Software and Game project courses 2013-2015
//©Copyright Utrecht University (Department of Information and Computing Sciences) 
*/

var Metadata;

(function()
{
    var parameterCounter = 0;

    Metadata = 
    {
        metaObject: {},
        getNewDefaultMetaObject: getNewDefaultMetaObject,
        parameterCounter: parameterCounter,
        parameterDialog: parameterDialog,
        atLeastOneParameter: atLeastOneParameter,
        metadataDialog: metadataDialog,
        timePId : null,
        addTimeParameter: addTimeParameter
    };

    $(document).ready(function()
    {
        // Event handlers.
        $("#editMetadata").on('click', metadataDialog);
        $("#editParameters").on('click', parameterDialog);

        var metaScreenHTML = Parts.getMetaScreenHTML();
        $("#metaScreen").html(metaScreenHTML);
        $("#metaForm").on('submit', function()
        {
            saveMetaObject();
            return false;
        });

        var parameterScreenHTML = Parts.getParameterScreenHTML();
        $("#parameterScreen").html(parameterScreenHTML);

        $("#params").on("focus", ".parameterDescription", function()
        {
            $(this).animate({ height: "10em" }, 500);
        });
        $("#params").on("focusout", ".parameterDescription", function()
        {
            $(this).animate({height:"1em"}, 500);
        });

        $("#params").on('click', '.deleteParent', function()
        {
            var tr = $(this).closest('tr');
            tr.addClass("toBeRemoved");
            // console.log("removed parameter with id:\t"+tr[0].id);
            if(tr[0].id === "t" && tr.not(".toBeRemoved"))
            {
                // for time parameter: make visible when Time-parameter has been removed
                $("#addTimeParameter").removeClass("hidden");
            }
            if ($("#params").children().not(".toBeRemoved").length === 0)
                $("#paramsTableHead").addClass("hidden");
        });
    });

    /*
     ** Public Functions
     */

    // Creates and returns a new default meta object containing sensible defaults.
    // If needed, change the defaults here.
    function getNewDefaultMetaObject()
    {
        parameterCounter = 0;

        var pObj = {};
        
        Metadata.metaObject = {
            name: "",
            difficulty: "medium",
            character: "", //character is defined in properties by free form input text 
            description: "",
            parameterObject: pObj,
            scriptVersion: 2 //version 2: with treeweaving. no version: legacy without tree weaving
        };
    }

    //Create the dialog to change the script description.
    function metadataDialog()
    {
        var tabs = $("#metaTabs");
        tabs.tabs();

        Main.selectNode(null);

        $("#metaScreen").dialog(
        {
            title: LanguageManager.sLang("edt_metadata_title"),
            height: ParameterValues.heightMetaScreen,
            width: ParameterValues.widthMetaScreen,
            modal: true,
            buttons: [
            {
                text: LanguageManager.sLang("edt_common_confirm"),
                click: function()
                {
                    saveMetaObject();
                }
            },
            {
                text: LanguageManager.sLang("edt_common_cancel"),
                click: function()
                {
                    $("#metaScreen").dialog('close');
                }
            }],
            close: function()
            {
                $("#main").focus();
            }
        });

        // Show the stored values for the metadata.
        $("#scriptName").val(Main.unEscapeTags(Metadata.metaObject.name));
        $("#scriptDifficulty").val(Metadata.metaObject.difficulty);
        $("#scriptDescription").val(Main.unEscapeTags(Metadata.metaObject.description));
        
        $("#character").val(Main.unEscapeTags(Metadata.metaObject.character));
    }

    function parameterDialog()
    {
        Main.selectNode(null);

        //console.log('timePId:\t'+Metadata.timePId);
        if (Metadata.timePId !== null )
        {
            $("#addTimeParameter").addClass("hidden");
        }

        $("#parameterScreen").dialog(
        {
            title: LanguageManager.sLang("edt_metadata_parameters_title"),
            height: ParameterValues.heightParameterScreen,
            width: ParameterValues.widthParameterScreen,
            modal: true,
            buttons: [
            {
                text: LanguageManager.sLang("edt_metadata_parameters_to_feedback"),
                click: function()
                {
                    saveParameters();
                    $(this).dialog('close');
                    FeedbackForm.feedbackFormDialog();
                }
            },
            {
                text: LanguageManager.sLang("edt_common_confirm"),
                click: function()
                {
                    saveParameters();
                    $(this).dialog('close');
                }
            },
            {
                text: LanguageManager.sLang("edt_common_cancel"),
                click: function()
                {
                    $(this).dialog('close');
                }
            }],
            close: function()
            {
                $(".toBeRemoved").removeClass("toBeRemoved");
                $(".newParameter").remove();
                //Ugly test to determine if there are parameters. If there are, the table headers need to be visible in the metascreen the next time.
                if (atLeastOneParameter())
                {
                    $("#paramsTableHead").removeClass("hidden");
                }
            }
        });        

        $("#params").empty();
        $("#paramsTableHead").addClass("hidden");

        for (var parameterName in Metadata.metaObject.parameterObject)
        {
            var parameter = Metadata.metaObject.parameterObject[parameterName];
            var addedDiv = $("#params").append(HtmlGenerator.parameterHTML).children().last();
            addedDiv.removeClass("newParameter").addClass("existingParameter");

            addedDiv.prop('id', parameterName);
            if(parameterName === "t")
                addedDiv.addClass("isT");
            addedDiv.find(".name").val(parameter.name);
            addedDiv.find(".initialValue").val(parameter.initialValue);
            addedDiv.find(".weightForFinalScore").val(parameter.weightForFinalScore);
            addedDiv.find(".minimumScore").val(parameter.minimumScore);
            addedDiv.find(".maximumScore").val(parameter.maximumScore);
            addedDiv.find(".parameterDescription").val(parameter.parameterDescription);        
        }
        if ($("#params").children().length > 0)
            $("#paramsTableHead").removeClass("hidden");
        $("#scriptDescription").val(Main.unEscapeTags(Metadata.metaObject.description));
    }

    function atLeastOneParameter(type)
    {
        var pObj = Metadata.metaObject.parameterObject;

        if (type === "parameter")
        {
            return (!$.isEmptyObject(pObj));
        }
        else
        {
            return (!$.isEmptyObject(eObj) || !$.isEmptyObject(pObj));
        }
    }

    function addTimeParameter(div)
    {
        var newParamObject = ObjectGenerator.parameterObject(div);
        
        if (newParamObject === null) return;
        
        var id = 't';
        $(div).prop('id', id);
        Metadata.metaObject.parameterObject[id] = newParamObject;

        Metadata.timePId = id;

        $(div).removeClass("newParameter").addClass("existingParameter").addClass('isT');

        var timeObject = 
        {
            parameterid : id,
            changeType: "delta",
            value: 1
        };

        for (var nodeId in Main.nodes)
        {
            var node = Main.nodes[nodeId];
            if (node.type === Main.playerType)
            {
                if (node.parameters !== undefined && node.parameters !== null)
                    node.parameters.push(timeObject);
                else
                    node.parameters = [timeObject];
            }
        }
    }

    /*
     ** Private Functions
     */

    function saveParameters()
    {
        Main.unsavedChanges = true;

        $(".toBeRemoved").each(function()
        {
            var id = $(this).prop('id');

            // Remove the preconditions and effects for every node with this parameter.
            for (var nodeID in Main.nodes)
            {
                var node = Main.nodes[nodeID];
                for (var i = 0; i < node.parameters.length; i++)
                    if (node.parameters[i].parameterid == id)
                        node.parameters.splice(i, 1);
                removeAllPreconditionsWithParam(id, node.preconditions);
            }
            
            delete FeedbackForm.conditions[id];

            if (id === Metadata.timePId && Metadata.timePId !== null)
                Metadata.timePId = null;

            // Remove the parameter from the html and the object.
            $(this).remove();

            delete Metadata.metaObject.parameterObject[id];
        });

        $(".existingParameter").each(function()
        {
            var id = $(this).prop('id');
            var newParamObject = ObjectGenerator.parameterObject($(this));

            Metadata.metaObject.parameterObject[id] = newParamObject;
        });

        // All new parameters.
        $(".newParameter").each(function()
        {
            var newParamObject = ObjectGenerator.parameterObject($(this));
            
            if (newParamObject === null) return;
            
            var id = 'p' + (Metadata.parameterCounter += 1).toString();
            
            $(this).prop('id', id);
            Metadata.metaObject.parameterObject[id] = newParamObject;
            
            $(this).removeClass("newParameter").addClass("existingParameter");
        });

        console.log(Metadata.metaObject.parameterObject);
    }
    
    // Save all changes to the metaObject.
    function saveMetaObject()
    {
        Main.unsavedChanges = true;

        // All parameters that should be removed.
        var previouslySelectedNode = Main.selectedElement;
        Main.selectNode(null);

        Metadata.metaObject.character = Main.escapeTags($("#character").val());

        // Save all values in the dialog to the metaObject.
        Metadata.metaObject.name = Main.escapeTags($("#scriptName").val());
        Metadata.metaObject.difficulty = $("#scriptDifficulty").val();

        Metadata.metaObject.description = Main.escapeTags($(
            "#scriptDescription").val());

        var truncatedName;
        if (Metadata.metaObject.name.length > 20)
        {
            truncatedName = Metadata.metaObject.name.substring(0, 17) + "...";
        }
        else
        {
            truncatedName = Metadata.metaObject.name;
        }
        $('#scriptNameTab .scriptName').text(truncatedName);

        $("#metaScreen").dialog('close');
        Main.selectNode(previouslySelectedNode);
    }

    function removeAllPreconditionsWithParam(paramIdToRemove, precondition)
    {
        for (var i = 0; i < precondition.preconditions.length; i++)
        {
            var currentPrecondition = precondition.preconditions[i];
            if ("type" in currentPrecondition)
            {
                removeAllPreconditionsWithParam(paramIdToRemove,
                    currentPrecondition);
                if (currentPrecondition.preconditions.length === 0)
                {
                    precondition.preconditions.splice(i, 1);
                    i--;
                }
            }
            else
            {
                if (currentPrecondition.parameterid == paramIdToRemove)
                {
                    precondition.preconditions.splice(i, 1);
                    i--;
                }
            }
        }
    }

})();
