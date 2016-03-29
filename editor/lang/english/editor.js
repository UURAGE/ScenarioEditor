(function()
{
    "use strict";

    LanguageManager.edt_common_confirm = "Confirm";
    LanguageManager.edt_common_cancel = "Cancel";
    LanguageManager.edt_common_close = "Close";
    LanguageManager.edt_common_subject = "Subject";
    LanguageManager.edt_common_player = "Player";
    LanguageManager.edt_common_computer = "Computer";
    LanguageManager.edt_common_situation = "Situation";
    LanguageManager.edt_common_delete = "Delete";
    LanguageManager.edt_common_add = "Add";
    LanguageManager.edt_common_save = "Save";
    LanguageManager.edt_common_none = "(none)";

    LanguageManager.edt_draft_letter_player = "P";
    LanguageManager.edt_draft_letter_computer = "C";
    LanguageManager.edt_draft_drag_all = "Drag from here to place all items on the screen as separate nodes";
    LanguageManager.edt_draft_add_item = "Add item";
    LanguageManager.edt_draft_not_available = "[Not available]";
    LanguageManager.edt_draft_all_items = "[All items]";
    LanguageManager.edt_draft_item_number = "[Item #%i]";
    LanguageManager.edt_draft_no_filled_items = "No filled items present!";
    LanguageManager.edt_draft_no_subject_open = "No subject open!";
    LanguageManager.edt_draft_empty_item = "Item is empty!";
    LanguageManager.edt_draft_delete_all = "Delete all";
    LanguageManager.edt_draft_delete_all_confirm = "Delete all items from the note pad?";

    LanguageManager.edt_feedback_title = "Feedback Form";
    LanguageManager.edt_feedback_if = "If";
    LanguageManager.edt_feedback_min = "min";
    LanguageManager.edt_feedback_max = "max";
    LanguageManager.edt_feedback_between = "between";
    LanguageManager.edt_feedback_description = "Description";
    LanguageManager.edt_feedback_default_description = "Default description";
    LanguageManager.edt_feedback_to_parameters = 'Open Parameters...';

    LanguageManager.edt_html_error_no_test = "Error: there are no parameters to test on.";
    LanguageManager.edt_html_error_no_effect = "Error: there are no parameters to affect";
    LanguageManager.edt_html_up_to = "up to";
    LanguageManager.edt_html_time = "Time";

    LanguageManager.edt_plumb_error_tree_connection = "Error: connections must be contained in a single tree.";
    LanguageManager.edt_plumb_error_cycle = "Error: cannot create connections that complete a cycle.";
    LanguageManager.edt_plumb_error_node_type = "Error: cannot create connection between two nodes of the same type.";
    LanguageManager.edt_plumb_error_conversation_child = "Error: a conversation may not have computer-type child nodes.";
    LanguageManager.edt_plumb_error_conversation_siblings = "Error: conversations may not have siblings.";
    LanguageManager.edt_plumb_error_child_type = "Error: a node may have only children of the same type.";

    LanguageManager.edt_load_import_title = "Import script";
    LanguageManager.edt_load_import = "Import";
    LanguageManager.edt_load_error = "Encountered an error while loading the file";
    LanguageManager.edt_load_invalid_xml = "Invalid XML";

    LanguageManager.edt_main_no_subject_open = "No subject open!";
    LanguageManager.edt_main_input_link = "Please enter the url.";
    LanguageManager.edt_main_link_name = "Link name";
    LanguageManager.edt_main_pending_changes = "This script may contain unsaved changes. Are you sure you want to leave the page?";
    LanguageManager.edt_main_default_subject = "Subject name";
    LanguageManager.edt_main_conversation = "Conversation";
    LanguageManager.edt_main_copy_of = "copy of";
    LanguageManager.edt_main_see_conversation = "See conversation screen";

    LanguageManager.edt_media_title = "Add Media";
    LanguageManager.edt_media_export_error = "Warning: the script contains errors. Are you sure you want to export?";
    LanguageManager.edt_media_download_complete = "Download completed";
    LanguageManager.edt_media_download_available = "Download available";
    LanguageManager.edt_media_none = "None";
    LanguageManager.edt_media_upload = "Upload";
    LanguageManager.edt_media_uploading = "Processing, please allow some time for the upload";
    LanguageManager.edt_media_transport_error = "transport error";
    LanguageManager.edt_media_failed = "Failed";

    LanguageManager.edt_metadata_title = "Edit properties";
    LanguageManager.edt_metadata_parameters_title = "Edit parameters";
    LanguageManager.edt_metadata_parameters_to_feedback = "Open Feedback...";
    LanguageManager.edt_metadata_add_intention_placeholder = "type intention and enter";

    LanguageManager.edt_parts_statement = "Statement";
    LanguageManager.edt_parts_intention = "Intention";
    LanguageManager.edt_parts_feedback = "Feedback";
    LanguageManager.edt_parts_type = "Type";
    LanguageManager.edt_parts_delta = "delta";
    LanguageManager.edt_parts_set = "set";
    LanguageManager.edt_parts_empty_group = "Empty group";
    LanguageManager.edt_parts_one_condition_group = "Group with one precondition";
    LanguageManager.edt_parts_all_true = "all true";
    LanguageManager.edt_parts_one_true = "at least one true";
    LanguageManager.edt_parts_add_condition = "Add precondition";
    LanguageManager.edt_parts_add_group = "Add group";
    LanguageManager.edt_parts_delete_group = "Delete group";
    LanguageManager.edt_parts_add_file = "Add File";
    LanguageManager.edt_parts_file_warning = "Please note: Only mp4, mp3, ogg and png files will be accepted.";
    LanguageManager.edt_parts_name = "Name";
    LanguageManager.edt_parts_value = "Value";
    LanguageManager.edt_parts_weight = "Weight";
    LanguageManager.edt_parts_min = "Min";
    LanguageManager.edt_parts_max = "Max";
    LanguageManager.edt_parts_description = "Description";
    LanguageManager.edt_parts_add_time_title = "Add parameter time +1 to every node";
    LanguageManager.edt_parts_general = "General";
    LanguageManager.edt_parts_script_name = "Script name";
    LanguageManager.edt_parts_difficulty = "Difficulty";
    LanguageManager.edt_parts_very_easy = "Very easy";
    LanguageManager.edt_parts_easy = "Easy";
    LanguageManager.edt_parts_medium = "Medium";
    LanguageManager.edt_parts_hard = "Hard";
    LanguageManager.edt_parts_very_hard = "Very hard";
    LanguageManager.edt_parts_sitting = "Sitting";
    LanguageManager.edt_parts_none = "None";
    LanguageManager.edt_parts_list_background = "List background";
    LanguageManager.edt_parts_character_picture = "Character picture";
    LanguageManager.edt_parts_show_score = "Show score";
    LanguageManager.edt_parts_show_feedback = "Show feedback";
    LanguageManager.edt_parts_immediate_feedback = "Immediate feedback";
    LanguageManager.edt_parts_change_type = "Default change type";
    LanguageManager.edt_parts_file_to_import = "File to import";
    LanguageManager.edt_parts_advanced = "Advanced";
    LanguageManager.edt_parts_appearance = "Appearance";

    LanguageManager.edt_print_warning = "Preparation for printing can take a long time for large scenarios, are you sure you want to continue?";

    LanguageManager.edt_return_title = "Leave editor";

    LanguageManager.edt_save_contains_errors = "Warning: the script contains errors. Are you sure you want to save?";
    LanguageManager.edt_save_error = "Something went wrong while saving";
    LanguageManager.edt_save_error_server = "Something went wrong while saving: server error";
    LanguageManager.edt_save_script_saved = "Script saved";

    LanguageManager.edt_clipboard_copy_of = "copy of %s";

    LanguageManager.edt_validator_no_problems = "No problems found!";
    LanguageManager.edt_validator_no_name = "The script does not have a name.";
    LanguageManager.edt_validator_empty_subject = "Subject \"%s\" is empty.";
    LanguageManager.edt_validator_empty_conversation = "Subject \"%s\" contains a conversation without nodes.";
    LanguageManager.edt_validator_conversation_start_error = "Subject \"%s\" can only start with a conversation of it is the only possible start";
    LanguageManager.edt_validator_subject_start_type_error = "Subject \"%s\" starts with a computer node. A subject must be started by the player.";
    LanguageManager.edt_validator_subject_start_type_error2 = "Subject \"%s\" starts with a situation node. A subject must be started by the player.";
    LanguageManager.edt_validator_end_outgoing_connections = "Subject \"%s\" contains a node that is marked as an end with outgoing connections.";
    LanguageManager.edt_validator_unmarked_end = "Subject \"%s\" contains an end node that has not been marked as such.";
    LanguageManager.edt_validator_unnamed_subject = "There is an unnamed subject.";
    LanguageManager.edt_validator_first_layer_count = "The first layer must contain exactly one subject.";
    LanguageManager.edt_validator_no_ending = "The last layer must have at least one marked ending.";
    LanguageManager.edt_validator_no_valid_ending = "There is no valid marked ending.";
    LanguageManager.edt_validator_empty_scenario = "Scenario contains no subjects.";
    LanguageManager.edt_validator_info = "info";
    LanguageManager.edt_validator_warning = "warning";
    LanguageManager.edt_validator_error = "error";
})();