/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

var FeedbackForm;

(function()
{
    FeedbackForm =
    {
        // Object keyed on parameter ID.
        // Each value has a list of conditions and a default text.
        // Each condition has a test, 0-2 numbers and a text.
        conditions: {},
        feedbackFormDialog: feedbackFormDialog
    };

    $(document).ready(function()
    {
        // Register event handler.
        $("#feedbackform").on('click', feedbackFormDialog);
    });

    // Saves the current form to the global value.
    function saveFeedbackForm()
    {
        // Object with an array of conditions per parameter.
        // Each condition is an object with an ID, a test (<, >, etc.), an array of values and the feedbackString (description).
        // The final, default condition only has a feedbackString.
        var allConditions = {};
        // Loop over all the divs in #paramTabs (the parameters).
        // Then, loop over all conditions of each parameter, with the last one being the alternative description.
        $("#paramTabs").children("div").each(function(){

            var conditions = [];
            var parentID = $(this).attr('id');

            $(this).children("div").each(function(){
                var thisID = $(this).attr('id');

                var textBoxValue = $(this).find('textArea').val();

                if (thisID != "defaultDescription" + parentID)
                {
                    var selectValue = $(this).find("select").val();
                    var inputBoxes = $(this).find("input");


                    var condition = {
                        ID: null,
                        test: null,
                        values: [],
                        feedbackString: null
                    };

                    condition.ID = $(this).attr('id');
                    condition.test = selectValue;

                    var box1 = inputBoxes[0];
                    var box2 = inputBoxes[1];

                    var useBox1 = true, useBox2 = true;

                    switch (selectValue)
                    {
                        case "min":
                        useBox1 = false;
                        useBox2 = false;
                        break;
                        case "max":
                        useBox1 = false;
                        useBox2 = false;
                        break;
                        case "lessThan":
                        useBox2 = false;
                        break;
                        case "greaterThan":
                        useBox2 = false;
                        break;
                        case "equalTo":
                        useBox2 = false;
                        break;
                        case "between":
                        break;
                    }

                    // Only use visible boxes.
                    if (useBox1)
                    {
                        condition.values.push($(box1).val());
                    }
                    if (useBox2)
                    {
                        // Ensure that box2's value is larger than box1's value.
                        if ($(box1).val() >= $(box2).val())
                        {
                            condition.values.push(parseInt($(box1).val()) + 1);
                        }
                        else
                        {
                            condition.values.push($(box2).val());
                        }
                    }

                    condition.feedbackString = textBoxValue;
                    conditions.push(condition);
                }
                else
                {
                    var defaultCondition = {
                        ID: null,
                        feedbackString: null
                    };

                    defaultCondition.ID = thisID;
                    defaultCondition.feedbackString = textBoxValue;
                    conditions.push(defaultCondition);
                }
            });

            allConditions[parentID] = conditions;
        });

        FeedbackForm.conditions = allConditions;
    }

    function createDivForParameter(parameterID, counter, box1, box2, textArea, test)
    {
        var parameterName = Metadata.metaObject.parameters[parameterID].name;
        var box1Value, box2Value, box1Visibility, box2Visibility, textAreaData;
        var s1, s2, s3, s4, s5, s6;
        var noBox1 = false;
        var noBox2 = false;
        s1 = "";
        s2 = "";
        s3 = "";
        s4 = "";
        s5 = "";
        s6 = "";

        if (test !== undefined)
        {
            switch (test)
            {
                case "min":
                s1 = "selected='selected' ";
                noBox1 = true;
                noBox2 = true;
                break;
                case "max":
                s2 = "selected='selected' ";
                noBox1 = true;
                noBox2 = true;
                break;
                case "lessThan":
                s3 = "selected='selected' ";
                noBox2 = true;
                break;
                case "greaterThan":
                s4 = "selected='selected' ";
                noBox2 = true;
                break;
                case "equalTo":
                s5 = "selected='selected' ";
                noBox2 = true;
                break;
                case "between":
                s6 = "selected='selected' ";
                break;
            }
        }
        else
        {
            noBox1 = true;
            noBox2 = true;
        }

        if (noBox1)
        {
            box1Value = 0;
            box1Visibility = 'display:none';
        }
        else
        {
            if (box1 !== undefined)
            {
                box1Value = box1;
            }
            else
            {
                box1Value = 0;
            }
            box1Visibility = 'display:inline';
        }

        if (noBox2)
        {
            box2Value = 0;
            box2Visibility = 'display:none';
        }
        else
        {
            if (box2 !== undefined)
            {
                box2Value = box2;
            }
            else
            {
                box2Value = 0;
            }
            box2Visibility = 'display:inline';
        }

        if (textArea === undefined)
            textAreaData = "";
        else textAreaData = textArea;

        var string = "";
        string += "<div id='" + parameterID + "_" + counter + "'>";
        string += LanguageManager.sLang("edt_feedback_if") + " " + Main.escapeTags(parameterName) + " ";
        string += "<select id='" + parameterID + "_" + counter + "Select'>";
        string += "<option " + s1 + "value='min'>"+LanguageManager.sLang("edt_feedback_min")+"</option>";
        string += "<option " + s2 + "value='max'>"+LanguageManager.sLang("edt_feedback_max")+"</option>";
        string += "<option " + s3 + "value='lessThan'>&lt;</option>";
        string += "<option " + s4 + "value='greaterThan'>&gt;</option>";
        string += "<option " + s5 + "value='equalTo'>=</option>";
        string += "<option " + s6 + "value='between'>"+LanguageManager.sLang("edt_feedback_between")+"</option>";
        string += "</select>";
        string += "<input id='box1" + parameterID + "_" + counter + "' type='number' value='" + box1Value + "' style='" + box1Visibility + "'>";
        string += "<input id='box2" + parameterID + "_" + counter + "' type='number' value='" + box2Value + "' style='" + box2Visibility + "'>";
        string += "</br>";
        string += LanguageManager.sLang("edt_feedback_description") + ":";
        string += "<textarea id='text" + parameterID + "_" + counter + "' style='height:120px;width:100%;-moz-box-sizing:border-box;box-sizing:border-box'>" + textAreaData + "</textarea>";
        string += "<button type='button' class='deleteParent' title='"+LanguageManager.sLang("edt_common_delete")+"'><img src='" + editor_url + "png/others/minus.png' alt='-'></button>";
        string += "<hr color='#A8A8A8'>"; // Pretty gray!
        string += "</div>";

        return string;
    }

    function feedbackFormDialog()
    {
        // Logic: compare all parameters / conditions in the global object with metadata.
        // All parameters in global, but not in meta -> remove.
        // All parameters in global, also in meta -> copy from global.
        // All parameters not in global, but in meta -> create.

        // Get the base html from parts, and add it to the div for the feedback dialog.
        var feedbackScreenHTML = Parts.getFeedbackScreenHTML();
        $("#feedbackScreen").html(feedbackScreenHTML);

        // Get the div paramTabs.
        var tabs = $("#paramTabs");
        // Create a new htmlString, and add a select to it.
        var htmlString = "";
        htmlString += "<select id='paramSelect'>";

        // Add an option per parameter to this select.
        for (var pId in Metadata.metaObject.parameters)
        {
            if (Metadata.metaObject.parameters[pId].weightForFinalScore !== 0)
            {
                var pName = Metadata.metaObject.parameters[pId].name;
                // Replace all whitespaces so id's contain no spaces.
                htmlString += '<option value="' + pId + '">' + Main.escapeTags(pName) + '</option>';
            }
        }
        // Close the select.
        htmlString += "</select>";

        // Add hidden divs per parameter.
        for (var paramID in Metadata.metaObject.parameters)
        {
            // Here we check which parameters are and are not in metadata and the global object.

            if (Metadata.metaObject.parameters[paramID].weightForFinalScore !== 0)
            {
                if (FeedbackForm.conditions[paramID] === undefined)
                {
                    // Parameter is in metadata, not in the global object.
                    // Create new divs.
                    htmlString += "<div id='" + paramID + "' style='display:none'>";
                    htmlString += "<button type='button' class='addParameter' title='"+LanguageManager.sLang("edt_common_add")+"'><img src='" + editor_url + "png/others/plus.png' alt='+'></button>";
                    // Then, add a default description textarea at the end of the div.
                    htmlString += "<div id='defaultDescription" + paramID + "'>";
                    htmlString += "</br></br>";
                    htmlString += LanguageManager.sLang("edt_feedback_default_description");
                    htmlString += "<textarea id='defaultText" + paramID + "' style='height:120px;width:100%;-moz-box-sizing:border-box;box-sizing:border-box'></textarea>";
                    htmlString += "</div>";
                    htmlString += "</div>";
                }
                else
                {
                    // Parameter is both in metadata and in the global object.
                    // Create new divs and fill with values from the global object.
                    htmlString += "<div id='" + paramID + "' style='display:none'>";

                    var defaultFeedbackString = "";
                    for (var loopCounter = 0; loopCounter < FeedbackForm.conditions[paramID].length; loopCounter++)
                    {
                        // Special case, the last condition in the loop is always the default condition.
                        if (loopCounter === FeedbackForm.conditions[paramID].length - 1)
                        {
                            var defaultCondition = FeedbackForm.conditions[paramID][loopCounter];
                            defaultFeedbackString = defaultCondition.feedbackString;
                        }
                        else
                        {
                            var condition = FeedbackForm.conditions[paramID][loopCounter];
                            var feedbackString = condition.feedbackString;

                            var box1, box2;

                            if (condition.values.length <= 0)
                            {
                                box1 = undefined;
                                box2 = undefined;
                            }
                            else
                            {
                                box1 = condition.values[0];
                                if (condition.values[1] === undefined)
                                {
                                    box2 = undefined;
                                }
                                else box2 = condition.values[1];
                            }
                            htmlString += createDivForParameter(paramID, loopCounter + 1, box1, box2, feedbackString, condition.test);
                        }
                    }

                    // Then, add a default description textarea at the end of the div.
                    htmlString += "<button type='button' class='addParameter' title='"+LanguageManager.sLang("edt_common_add")+"'><img src='" + editor_url + "png/others/plus.png' alt='+'></button>";
                    htmlString += "<div id='defaultDescription" + paramID + "'>";
                    htmlString += "</br></br>";
                    htmlString += LanguageManager.sLang("edt_feedback_default_description")+":";
                    htmlString += "<textarea id='defaultText" + paramID + "' style='height:120px;width:100%;-moz-box-sizing:border-box;box-sizing:border-box'>" + defaultFeedbackString + "</textarea>";
                    htmlString += "</div>";
                    htmlString += "</div>";
                }
            }
        }

        // And finally append this html to the div paramTabs.
        tabs.append(htmlString);

        // If someone has removed all conditions for a parameter, it should get a new add button.
        // Check all parameters: if a parameter doesn't have an add button, create one.
        $("#paramTabs").children("div").each(function() {
            var button = $(this).find(".addParameter");

            if (button.length === 0)
            {
                var lastDiv = $(this).children("div").last();
                $("<button type='button' class='addParameter' title='"+LanguageManager.sLang("edt_common_add")+"'><img src='" + editor_url + "png/others/plus.png' alt='+'></button>").insertBefore($(lastDiv));
            }
        });

        // Function that removes the parent of the clicked button.
        $("#paramTabs").on('click', '.deleteParent', function()
        {
            $(this).parent().remove();
        });

        // Function that adds a new div with logic for a parameter.
        // The id of the newly generated div is incremental.
        $("#paramTabs").on('click', '.addParameter', function()
        {
            var parentID = $(this).parent().attr("id");
            var lastNumber = $("#" + parentID + " > .addParameter").prev();
            if (lastNumber.length > 0)
            {
                lastNumber = lastNumber[0];
                var parentNodeID = lastNumber.parentNode.id;
                lastNumber = lastNumber.id;
                lastNumber = lastNumber.substring(parentNodeID.length + 1, lastNumber.length);
                lastNumber = parseInt(lastNumber);
            }
            else lastNumber = 0;

            lastNumber += 1;

            var newHTML = createDivForParameter(parentID, lastNumber);
            $(newHTML).insertBefore($("#" + parentID + " > .addParameter"));

            // Ugly, needs fix, but adds a eventhandler for the selector in this div (turns the number boxes visible/invisible).
            $("#" + parentID + "_" + lastNumber + "Select").change(function() {
                var selectValue = $(this).val();
                var originalParamID = $(this).attr("id");
                originalParamID = originalParamID.substring(0, originalParamID.length - 6);

                switch (selectValue)
                {
                    case "min":
                    $("#box1" + originalParamID).hide();
                    $("#box2" + originalParamID).hide();
                    break;
                    case "max":
                    $("#box1" + originalParamID).hide();
                    $("#box2" + originalParamID).hide();
                    break;
                    case "lessThan":
                    $("#box1" + originalParamID).show();
                    $("#box2" + originalParamID).hide();
                    break;
                    case "greaterThan":
                    $("#box1" + originalParamID).show();
                    $("#box2" + originalParamID).hide();
                    break;
                    case "equalTo":
                    $("#box1" + originalParamID).show();
                    $("#box2" + originalParamID).hide();
                    break;
                    case "between":
                    $("#box1" + originalParamID).show();
                    $("#box2" + originalParamID).show();
                    break;
                }
            });
        });

        // Show the div for the selected parameter.
        var selectedElement = $("#paramSelect").val();
        $("#paramTabs").find("#" + selectedElement).show();

        // Bind onChange events to each selector in the parameterDiv (the <, >, = etc. selector).
        // This eventhandler shows or hides textboxes behind it.

        $("#paramTabs").children('div').each(function(){
            $(this).find('select').each(function(){

                $(this).on('change', function(event){
                    var selectValue = $(this).val();
                    var originalParamID = event.target.id;
                    originalParamID = originalParamID.substring(0, originalParamID.length - 6);

                    switch (selectValue)
                    {
                        case "min":
                        $("#box1" + originalParamID).hide();
                        $("#box2" + originalParamID).hide();
                        break;
                        case "max":
                        $("#box1" + originalParamID).hide();
                        $("#box2" + originalParamID).hide();
                        break;
                        case "lessThan":
                        $("#box1" + originalParamID).show();
                        $("#box2" + originalParamID).hide();
                        break;
                        case "greaterThan":
                        $("#box1" + originalParamID).show();
                        $("#box2" + originalParamID).hide();
                        break;
                        case "equalTo":
                        $("#box1" + originalParamID).show();
                        $("#box2" + originalParamID).hide();
                        break;
                        case "between":
                        $("#box1" + originalParamID).show();
                        $("#box2" + originalParamID).show();
                        break;
                    }
                });
            });
        });

        // Bind a function to the value change of the select.
        // This function hides all the other divs, and shows the div which belongs to the parameter.
        $("#paramSelect").on('change', function() {
            var divName = $(this).val();
            $("#paramTabs").children("div").each( function () {
                $(this).hide();
            });

            $("#paramTabs").find("#" + divName).show();
            // $("#" + divName).show();
            // $("#" + divName).children("div").each( function() {
            //     $(this).show();
            // });
        });

        $("#feedbackScreen").dialog(
        {
            title: LanguageManager.sLang("edt_feedback_title"),
            height: ParameterValues.heightFeedbackFormScreen,
            width: ParameterValues.widthFeedbackFormScreen,
            modal: true,
            buttons: [
            {
                text: LanguageManager.sLang("edt_feedback_to_parameters"),
                click: function()
                {
                    saveFeedbackForm();
                    $("#feedbackScreen").dialog('close');
                    Metadata.parameterDialog();
                }
            },
            {
                text: LanguageManager.sLang("edt_common_confirm"),
                click: function()
                {
                    saveFeedbackForm();
                    $("#feedbackScreen").dialog('close');
                }
            },
            {
                text: LanguageManager.sLang("edt_common_cancel"),
                click: function()
                {
                    $("#feedbackScreen").dialog('close');
                }
            }]
        });
    }
})();
