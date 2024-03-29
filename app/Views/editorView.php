<!DOCTYPE HTML>
<!-- © DialogueTrainer -->

<html>
<head>
  <title>UURAGE - Scenario Editor</title>
  <meta charset="utf-8">
  <link rel="icon" type="image/x-icon" href="<?php echo editor_url("favicon.ico");?>">

  <?php
  $bustBrowserCache = config(\Config\App::class)->bustBrowserCache;

  $styles = array(
      "css/stylesheet.css",
      "css/jsPlumbStyle.css",
      "css/vendor/jquery-ui/jquery-ui.min.css",
  );
  foreach ($styles as $style)
  {
      // Cachebuster: append modification time to fix using cached files
      $url = editor_url($style);
      if ($bustBrowserCache) $url .= '?c=' . filemtime(editor_path($style));
      echo '<link rel="stylesheet" type="text/css" href="' . $url . '" />';
  }
  ?>

  <?php
  $jsVars = array(
      'site_url' => site_url('/'),
      'editor_url' => editor_url(),
      'languageCode' => \Config\Services::language()->getLocale()
  );
  ?>
  <script id="globals" type="application/json"><?php echo json_encode($jsVars, JSON_HEX_TAG | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE); ?></script>

  <?php

  $scripts = array(
      "js/lib/i18next.min.js",
      "js/lib/jquery.min.js",
      "js/lib/jquery-ui.min.js",
      "js/lib/jquery-ui-selectable-patched.js",
      "js/lib/jsplumb.min.js",
      "js/lib/jsplumb-patched.js",
      "js/lib/FileSaver.min.js",
      "js/globals.js",
      "js/i18n.js",
      "js/utils.js",
      "js/types.js",
      "js/config.js",
      "js/dragBox.js",
      "js/miniMap.js",
      "js/main.js",
      "js/parts.js",
      "js/colorPicker.js",
      "js/plumbGenerator.js",
      "js/metadata.js",
      "js/load.js",
      "js/load/load1.js",
      "js/load/load3.js",
      "js/save.js",
      "js/saveIndicator.js",
      "js/parameters.js",
      "js/evaluations.js",
      "js/condition.js",
      "js/expression.js",
      "js/tabDock.js",
      "js/validator.js",
      "js/keyControl.js",
      "js/reposition.js",
      "js/print.js",
      "js/draft.js",
      "js/elementList.js",
      "js/zoom.js",
      "js/clipboard.js",
      "js/playthroughItemAnalysis.js",
      "js/snapToGrid.js",
      "js/resize.js"
  );
  foreach ($scripts as $script)
  {
      // Cachebuster: append modification time to fix using cached files
      $url = editor_url($script);
      if ($bustBrowserCache) $url .= '?c=' . filemtime(editor_path($script));
      echo '<script type="text/javascript" src="' . $url . '"></script>';
  }

  ?>
  <script id="config" type="application/xml"><?php echo file_get_contents(editor_path('config.xml')); ?></script>
</head>

<body>
  <?php echo file_get_contents(editor_path("svg/icons.svg")); ?>
  <div id="wrap">
    <div id="content">
      <div id="toolbar" class="noSelect">
        <div id="menus">
          <div id="logo"><img src="<?php echo editor_url("svg/logo.svg") ?>" alt="Editor Logo"/></div>
          <div class="buttonGroup dropdown" id="file">
            <!-- File -->
              <button id="fileButton" class="globalButton dropdownButton"><?php sLang("edt_file"); ?></button>
              <div id="fileDropdown" class="dropdownItems">
                <button id="importScenario" class="globalButton" title="<?php sLang('edt_import_scenario_title'); ?>">
                    <?php echo sIcon("icon-sm-import"); sLang("edt_import_scenario"); ?>...<kbd>I</kbd>
                </button>
                <button id="exportScenario" class="globalButton" title="<?php sLang('edt_export_scenario_title'); ?>">
                    <?php echo sIcon("icon-sm-export"); sLang("edt_export_scenario"); ?>...<kbd>O</kbd>
                </button>
                <hr/>
                <button id="print" class="globalButton"><?php echo sIcon("icon-sm-print"); sLang("edt_print"); ?>...<kbd>P</kbd><kbd>Ctrl</kbd></button>
              </div>
          </div>
          <div class="buttonGroup dropdown" id="scenario">
          <!-- Scenario -->
            <button id="scenarioButton" class="globalButton dropdownButton"><?php sLang("edt_scenario"); ?></button>
            <div id="scenarioDropdown" class="dropdownItems">
              <button id="editMetadata" class="globalButton" title="<?php sLang('edt_properties_title'); ?>"><?php echo sIcon("icon-sm-properties"); sLang("edt_properties"); ?>...<kbd>B</kbd></button>
              <button id="editParameters" class="globalButton" title="<?php sLang('edt_parameters_title'); ?>"><?php echo sIcon("icon-sm-parameters"); sLang("edt_parameters"); ?>...<kbd>P</kbd></button>
              <button id="editEvaluations" class="globalButton" title="<?php sLang('edt_evaluations_title'); ?>"><?php echo sIcon("icon-sm-evaluations"); sLang("edt_evaluations"); ?>...<kbd>X</kbd></button>
            </div>
          </div>
          <div id="scenarioNameTab">
            <span class="scenarioName"></span>
          </div>
          <div id="languages">
            <?php
            $languages = scandir(APPPATH . 'Language');
            $isFirst = true;
            foreach ($languages as $code)
            {
                if (!ctype_alnum($code)) continue;

                if (!$isFirst) echo ' | ';

                echo '<a href="' . site_url('language/changeLanguage/' . $code) . '">';
                echo '<img src="' . flag_url($code) . '" alt="' . $code . '">';
                echo '</a>';

                $isFirst = false;
            }
            ?>
          </div>
        </div>
        <div id="ribbon">
          <div class="buttonGroup" id="edit">
            <!-- Edit -->
            <div class="big-buttons">
              <button id="newTree" class="globalButton" title="T"><?php echo sIcon("icon-add-subject"); sLang("edt_subject"); ?></button>
              <button id="newPlayerNode" class="subjectButton" title="Q"><?php echo sIcon("icon-add-player"); sLang("edt_player"); ?></button>
              <button id="newComputerNode" class="subjectButton" title="W"><?php echo sIcon("icon-add-computer"); sLang("edt_computer"); ?></button>
              <button id="newSituationNode" class="subjectButton" title="E"><?php echo sIcon("icon-add-situation"); sLang("edt_situation"); ?></button>
              <button id="newChildNode" class="nodeButton" title="R"><?php echo sIcon("icon-child"); sLang("edt_child"); ?></button>
              <button id="newSiblingNode" class="nodeWithParentButton" title="G"><?php echo sIcon("icon-add-sibling"); sLang("edt_sibling"); ?></button>
              <button id="toggleDraftScreen" class="subjectButton"><?php echo sIcon("icon-notepad"); sLang("edt_note_pad"); ?></button>
              <button id="toggleElementList" class="globalButton"><?php echo sIcon("icon-element-list"); sLang("edt_list"); ?></button>
              <button id="repositionGraph" class="subjectButton" title="<?php sLang("edt_arrange_title"); ?>"><?php echo sIcon("icon-arrange"); sLang("edt_arrange"); ?></button>
              <button id="snapGraph" class="globalButton"><?php echo sIcon("icon-snap-to-grid"); sLang("edt_snap_to_grid"); ?></button>
              <button id="delete" class="globalButton" title="Del"><?php echo sIcon("icon-delete"); sLang("btn_delete"); ?></button>
            </div>
          </div>
          <div class="buttonGroup" id="clipboard">
            <!-- Clipboard -->
            <div class="big-buttons">
              <button id="copy" class="globalButton"><?php echo sIcon("icon-copy"); sLang("edt_copy"); ?></button>
              <button id="cut" class="globalButton"><?php echo sIcon("icon-cut"); sLang("edt_cut"); ?></button>
              <button id="paste" class="globalButton"><?php echo sIcon("icon-paste"); sLang("edt_paste"); ?></button>
            </div>
          </div>
          <div class="buttonGroup" id="view">
            <!-- View -->
            <div class="big-buttons">
              <button id="highlightAncestors" class="subjectButton" title="A"><?php echo sIcon("icon-ancestors"); sLang("edt_ancestors"); ?></button>
              <button id="highlightDescendants" class="subjectButton" title="D"><?php echo sIcon("icon-descendants"); sLang("edt_descendants"); ?></button>
              <button id="toggleColors" class="subjectButton"><?php echo sIcon("icon-palette"); sLang("edt_toggle_colors"); ?></button>
            </div>
          </div>
          <div class="buttonGroup">
            <div class="big-buttons">
              <button id="togglePlaythroughsScreen" class="globalButton"><?php echo sIcon("icon-item-analysis"); sLang("edt_playthrough_item_analysis"); ?></button>
            </div>
          </div>
          <div class="buttonGroup" id="validate">
            <!-- Validate -->
            <div class="big-buttons">
              <button id="validation" class="globalButton" title="V"><?php echo sIcon("icon-validate"); sLang("edt_validate"); ?></button>
            </div>
          </div>
        </div>
      </div>
      <div id="main" tabindex="0">
        <div id="gridIndicator" class="gridded"></div>
      </div>
      <div id="tabDock" style="display: none" class="ui-tabs ui-widget ui-widget-content ui-corner-all">
        <div class="grip noSelect"></div>
        <div class="ui-tabs-nav ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all">
          <span class="title"></span>
          <div class="controls"></div>
          <div id="closeTabDock"><span class="ui-button-icon ui-icon ui-icon-closethick"></span></div>
        </div>
        <div id="draftScreen" class="ui-tabs-panel ui-widget-content ui-corner-bottom ui-resizable"></div>
        <div id="validationReport" class="ui-tabs-panel ui-widget-content ui-corner-bottom ui-resizable"></div>
        <div id="elementList" class="hasStyledTable ui-tabs-panel ui-widget-content ui-corner-bottom ui-resizable"></div>
      </div>
    </div>
    <!-- Sidebar -->
    <div id="sidebar">
      <div class="grip noSelect"></div>
      <div>
        <div>
          <div id="miniwrap" style="display: none">
            <input type="checkbox" id="enableMinimap" style="display: inline; margin-left: 30px" checked title="<?php sLang('edt_toggle_minimap'); ?>"/>
            <label for="enableMinimap" title="<?php sLang('edt_toggle_minimap'); ?>"><?php sLang("edt_minimap"); ?></label>
            <input type="checkbox" id="simpleMinimap" style="display: inline; margin-left: 10px" title="<?php sLang("edt_simple_minimap"); ?>"/>
            <label for="simpleMinimap" title="<?php sLang('edt_simple_minimap');?>"><?php sLang("edt_simple"); ?></label>
            <div id="minimap">
                <div id="scaledDiv"></div>
                <div id="minimapSelector"></div>
            </div>
          </div>
          <div id="properties" class="hidden">
            <div id="headerSubject" class="header clickable collapseAll">
              <h1><?php echo sIcon("icon-subject"); sLang('edt_subject');?></h1><span class="masterclicktag"><?php echo sIcon("icon-closed"); ?></span>
            </div>
            <div id="headerPlayer" class="header clickable collapseAll">
              <h1><?php echo sIcon("icon-nodeplayer"); sLang('edt_player');?></h1><span class="masterclicktag"><?php echo sIcon("icon-closed"); ?></span>
            </div>
            <div id="headerComputer" class="header clickable collapseAll">
              <h1><?php echo sIcon("icon-nodecomputer"); sLang('edt_computer');?></h1><span class="masterclicktag"><?php echo sIcon("icon-closed"); ?></span>
            </div>
            <div id="headerSituation" class="header clickable collapseAll">
              <h1><?php echo sIcon("icon-nodesituation"); sLang('edt_situation');?></h1><span class="masterclicktag"><?php echo sIcon("icon-closed"); ?></span>
            </div>
            <div id="characterSection" class="sidebarSection">
              <div class="sub-header clickable">
                <h2><?php echo sIcon("icon-character"); sLang('edt_character');?></h2><span class="clicktag"><?php echo sIcon("icon-closed"); ?></span>
              </div>
              <div class="collapsable">
                <select name="characterSelection" id="characterSelection" class="subjectButton"></select>
                <div>
                  <h3><?php sLang('edt_parameter_effects');?></h3>
                  <div id="node-computer-own-parameter-effects"></div>
                </div>
                <div>
                  <h3><?php sLang('edt_property_values');?></h3>
                  <div id="node-computer-own-property-values"></div>
                </div>
              </div>
            </div>
            <div id="propertyValuesSection" class="sidebarSection">
              <div class="sub-header clickable">
                <h2 title="<?php sLang('edt_property_values_title');?>"><?php echo sIcon("icon-properties"); sLang('edt_property_values');?></h2><span class="clicktag"><?php echo sIcon("icon-closed"); ?></span>
              </div>
              <div class="collapsable">
                <div id="node-property-values" class="section"></div>
                <div id="node-character-property-values" class="section"></div>
              </div>
            </div>
            <div id="preconditionsSection" class="sidebarSection">
              <div class="sub-header clickable">
                <h2 title="<?php sLang('edt_preconditions_title');?>"><?php echo sIcon("icon-preconditions"); sLang('edt_preconditions');?></h2><span class="clicktag"><?php echo sIcon("icon-closed"); ?></span>
              </div>
              <div id="preconditionsDiv" class="collapsable"></div>
            </div>
            <div id="effectsSection" class="sidebarSection">
              <div class="sub-header clickable">
                <h2 title="<?php sLang('edt_parameter_effects_title');?>"><?php echo sIcon("icon-parameters"); sLang('edt_parameter_effects');?></h2><span class="clicktag"><?php echo sIcon("icon-closed"); ?></span>
              </div>
              <div class="collapsable">
                <div>
                  <div id="userDefinedParameterEffects" class="section"></div>
                  <button id="addUserDefinedParameterEffect" class="iconButton add" title="<?php sLang('edt_add');?>"><?php echo sIcon('icon-plus'); sLang('edt_add_effect');?></button>
                </div>
                <div id="fixed-parameter-effects" class="section"></div>
                <div id="fixed-character-parameter-effects" class="section"></div>
              </div>
            </div>
            <div class="sidebarSection" id="optionalSubject">
              <div class="sub-header">
                <h2 title="<?php sLang('edt_optional_title');?>"><?php echo sIcon("icon-optional-subject");?><input type="checkbox" id="optionalCheckbox"/><label for="optionalCheckbox"><?php sLang('edt_optional_header');?></label></h2>
              </div>
            </div>
            <div id="commentSection" class="sidebarSection">
              <div class="sub-header clickable">
                <h2><?php echo sIcon("icon-note"); sLang('edt_authors_note');?></h2><span class="clicktag"><?php echo sIcon("icon-closed"); ?></span>
              </div>
              <div class="collapsable">
                <textarea id="comment"></textarea>
              </div>
            </div>
            <div class="sidebarSection" id="allowInterleaveNode">
              <div class="sub-header">
                <h2 title="<?php sLang('edt_allow_interleave_title');?>"><?php echo sIcon("icon-jumpsubject");?><input type="checkbox" id="allowInterleaveNodeCheckbox"/><label for="allowInterleaveNodeCheckbox"><?php sLang('edt_allow_interleave_header');?></label></h2>
              </div>
            </div>
            <div class="sidebarSection" id="allowDialogueEndNode">
              <div class="sub-header">
                <h2 title="<?php sLang('edt_allow_dialogue_end_title');?>"><?php echo sIcon("icon-earlyend");?><input type="checkbox" id="allowDialogueEndNodeCheckbox"/><label for="allowDialogueEndNodeCheckbox"><?php  sLang('edt_allow_dialogue_end_header');?></label></h2>
              </div>
            </div>
            <div class="sidebarSection" id="endNode">
              <div class="sub-header">
                <h2 title="<?php sLang('edt_end_title');?>"><?php echo sIcon("icon-endofscenario");?><input type="checkbox" id="endNodeCheckbox"/><label for="endNodeCheckbox"><?php sLang('edt_end_header');?></label></h2>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div id="dragBox" style="display: none"></div>
  <div class="lengthTest"></div>
</body>
</html>
