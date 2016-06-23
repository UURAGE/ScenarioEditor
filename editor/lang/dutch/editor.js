/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */
(function()
{
    "use strict";

    LanguageManager.edt_common_confirm = "Bevestigen";
    LanguageManager.edt_common_cancel = "Annuleren";
    LanguageManager.edt_common_close = "Sluiten";
    LanguageManager.edt_common_subject = "Onderwerp";
    LanguageManager.edt_common_player = "Speler";
    LanguageManager.edt_common_computer = "Computer";
    LanguageManager.edt_common_situation = "Situatie";
    LanguageManager.edt_common_delete = "Verwijderen";
    LanguageManager.edt_common_add = "Toevoegen";
    LanguageManager.edt_common_save = "Opslaan";
    LanguageManager.edt_common_none = "(geen)";

    LanguageManager.edt_config_types_boolean = "Boolean";
    LanguageManager.edt_config_types_boolean_false = "Niet waar";
    LanguageManager.edt_config_types_boolean_true = "Waar";
    LanguageManager.edt_config_types_integer = "Integer";
    LanguageManager.edt_config_types_string = "String";
    LanguageManager.edt_config_types_enumeration = "Enumeratie";

    LanguageManager.edt_draft_letter_player = "S";
    LanguageManager.edt_draft_letter_computer = "C";
    LanguageManager.edt_draft_drag_all = "Sleep vanaf hier om alle items als losse nodes in het scherm te plaatsen";
    LanguageManager.edt_draft_add_item = "Nieuw item";
    LanguageManager.edt_draft_not_available = "[Niet beschikbaar]";
    LanguageManager.edt_draft_all_items = "[Alle items]";
    LanguageManager.edt_draft_item_number = "[Item #%i]";
    LanguageManager.edt_draft_no_filled_items = "Geen niet-lege items aanwezig!";
    LanguageManager.edt_draft_no_subject_open = "Geen onderwerp geopend!";
    LanguageManager.edt_draft_empty_item = "Item is leeg!";
    LanguageManager.edt_draft_delete_all = "Alles verwijderen";
    LanguageManager.edt_draft_delete_all_confirm = "Alle items verwijderen uit het kladblok?";

    LanguageManager.edt_html_error_no_test = "Error: er zijn geen parameters. Dus er is niks waar deze knoop op kan testen.";
    LanguageManager.edt_html_error_no_effect = "Error: er zijn geen parameters. Dus er is niks waar deze knoop effect op kan hebben.";
    LanguageManager.edt_html_up_to = "tot";
    LanguageManager.edt_html_time = "Tijd";
    LanguageManager.edt_html_enumeration_screen_title = "Enumeratie";

    LanguageManager.edt_plumb_error_tree_connection = "Error: kan geen connecties tussen bomen maken.";
    LanguageManager.edt_plumb_error_cycle = "Error: deze connectie kan niet worden gemaakt, want dat zou een cykel creëren.";
    LanguageManager.edt_plumb_error_node_type = "Error: er kunnen geen connecties worden gemaakt tussen twee knopen van hetzelfde type.";
    LanguageManager.edt_plumb_error_child_type = "Error: alle kinderen van één knoop moeten van hetzelfde type zijn.";

    LanguageManager.edt_load_import_title = "Importeer scenario";
    LanguageManager.edt_load_import = "Importeer";
    LanguageManager.edt_load_error = "Er ging iets mis bij het laden van het bestand";
    LanguageManager.edt_load_invalid_xml = "Ongeldige XML";

    LanguageManager.edt_main_no_subject_open = "Geen onderwerp geopend!";
    LanguageManager.edt_main_input_link = "Vul de url van de link in";
    LanguageManager.edt_main_link_name = "Naam link";
    LanguageManager.edt_main_pending_changes = "Dit scenario heeft mogelijk veranderingen die niet zijn opgeslagen. Weet u zeker dat u de pagina wilt verlaten?";
    LanguageManager.edt_main_default_subject = "Naam onderwerp";
    LanguageManager.edt_main_copy_of = "kopie van";

    LanguageManager.edt_metadata_title = "Eigenschappen";
    LanguageManager.edt_metadata_parameters_title = "Parameters";

    LanguageManager.edt_parts_statement = "Zin";
    LanguageManager.edt_parts_type = "Type";
    LanguageManager.edt_parts_delta = "delta";
    LanguageManager.edt_parts_set = "set";
    LanguageManager.edt_parts_empty_group = "Lege groep";
    LanguageManager.edt_parts_one_condition_group = "Groep met één preconditie";
    LanguageManager.edt_parts_all_true = "alles waar";
    LanguageManager.edt_parts_one_true = "minstens één waar";
    LanguageManager.edt_parts_add_condition = "Preconditie toevoegen";
    LanguageManager.edt_parts_add_group = "Groep toevoegen";
    LanguageManager.edt_parts_delete_group = "Groep verwijderen";
    LanguageManager.edt_parts_name = "Naam";
    LanguageManager.edt_parts_type = "Type";
    LanguageManager.edt_parts_initial_value = "Beginwaarde";
    LanguageManager.edt_parts_description = "Beschrijving";
    LanguageManager.edt_parts_add_time_title = "Parameter tijd +1 toevoegen aan elke knoop";
    LanguageManager.edt_parts_general = "Algemeen";
    LanguageManager.edt_parts_scenario_name = "Naam scenario";
    LanguageManager.edt_parts_difficulty = "Moeilijkheidsgraad";
    LanguageManager.edt_parts_very_easy = "Zeer makkelijk";
    LanguageManager.edt_parts_easy = "Makkelijk";
    LanguageManager.edt_parts_medium = "Gemiddeld";
    LanguageManager.edt_parts_hard = "Moeilijk";
    LanguageManager.edt_parts_very_hard = "Zeer moeilijk";
    LanguageManager.edt_parts_none = "Geen";
    LanguageManager.edt_parts_change_type = "Standaard verander type";
    LanguageManager.edt_parts_file_to_import = "Bestand om te importeren";
    LanguageManager.edt_parts_advanced = "Geavanceerd";
    LanguageManager.edt_parts_properties = "Eigenschappen";
    LanguageManager.edt_parts_character_properties = "Karakters";
    LanguageManager.edt_parts_add_effect = "Effect toevoegen";
    LanguageManager.edt_parts_values = "Waarden";

    LanguageManager.edt_print_warning = "Het voorbereiden van het printen kan lang duren voor grote scenario's, weet u zeker dat u wilt doorgaan?";

    LanguageManager.edt_return_title = "Editor verlaten";

    LanguageManager.edt_save_contains_errors = "Waarschuwing: er zijn fouten aanwezig in het scenario. Weet u zeker dat u op wilt slaan?";
    LanguageManager.edt_save_error = "Er ging iets mis bij het opslaan";
    LanguageManager.edt_save_error_server = "Er ging iets mis bij het opslaan: serverfout";
    LanguageManager.edt_save_scenario_saved = "Scenario opgeslagen";
    LanguageManager.edt_save_export_error = "Waarschuwing: er zijn fouten aanwezig in het scenario. Weet u zeker dat u wilt exporteren?";
    LanguageManager.edt_save_download_available = "Download beschikbaar";

    LanguageManager.edt_clipboard_copy_of = "kopie van %s";

    LanguageManager.edt_validator_no_problems = "Geen problemen gevonden!";
    LanguageManager.edt_validator_no_name = "Het scenario heeft geen naam.";
    LanguageManager.edt_validator_empty_subject = "Onderwerp \"%s\" is leeg.";
    LanguageManager.edt_validator_subject_start_type_error_computer = "Onderwerp \"%s\" begint met een computerknoop. De speler moet een onderwerp beginnen.";
    LanguageManager.edt_validator_subject_start_type_error_situation = "Onderwerp \"%s\" begint met een situatie. De speler moet een onderwerp beginnen.";
    LanguageManager.edt_validator_end_outgoing_connections = "Onderwerp \"%s\" bevat een gemarkeerd einde dat nog uitgaande pijlen heeft.";
    LanguageManager.edt_validator_unmarked_end = "Onderwerp \"%s\" bevat een einde dat niet is gemarkeerd als het einde van het gesprek.";
    LanguageManager.edt_validator_unnamed_subject = "Er is een onderwerp zonder naam.";
    LanguageManager.edt_validator_first_layer_count = "De eerste laag moet precies 1 onderwerp bevatten.";
    LanguageManager.edt_validator_no_ending = "De laatste laag van onderwerpen moet tenminste één gemarkeerd einde hebben.";
    LanguageManager.edt_validator_no_valid_ending = "Er is geen valide einde gemarkeerd.";
    LanguageManager.edt_validator_empty_scenario = "Scenario bevat geen onderwerpen.";
    LanguageManager.edt_validator_info = "info";
    LanguageManager.edt_validator_warning = "waarschuwing";
    LanguageManager.edt_validator_error = "fout";
})();