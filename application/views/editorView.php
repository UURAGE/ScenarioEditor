<!DOCTYPE HTML>
<!-- © Utrecht University (Department of Information and Computing Sciences) -->

<html>
<head>
  <title>UURAGE - Scenario Editor</title>
  <meta charset="utf-8">
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="-1">
  <link rel="icon" type="image/x-icon" href="<?php echo editor_url("favicon.ico");?>">

  <?php
  $language = $this->session->userdata('language');

  $styles = array(
      "css/stylesheet.css",
      "css/jsPlumbStyle.css",
      "css/vendor/jquery-ui/jquery-ui.min.css",
  );
  foreach ($styles as $style)
  {   //filemtime appends last edited time, to fix using cached files
      echo '<link rel="stylesheet" type="text/css" href="' .editor_url($style) . '?t='.  filemtime(editor_path($style)) . '" />';
  }
  ?>

  <script>
  <?php
  echo 'var editor_url = "' . editor_url() . '";
        var root_url = "' . root_url() . '";
        var base_url = "' . base_url() . '";
        var environment = "' . ENVIRONMENT . '";
        var languageCode = "' . $this->config->item('languageCodes')[$language] . '";'
  ;
  ?>
  </script>

  <?php

  //load language related scripts first since all others depend on them
  $languageScripts = array(
      "js/lib/i18nextXHRBackend.min.js",
      "js/lib/i18nextSprintfPostProcessor.min.js",
      "js/lib/i18next.min.js",
      "js/i18n.js"
    );

  foreach($languageScripts as $script)
  {
      echo '<script type="text/javascript" src="' .editor_url($script). '?t='.  filemtime(editor_path($script)) .'"></script>';
  }

  //non language related scripts
  $scripts = array(
      "js/lib/jquery-3.3.1.min.js",
      "js/lib/jquery-ui.min.js",
      "js/lib/jquery-ui-selectable-patched.js",
      "js/lib/jsplumb.min.js",
      "js/lib/FileSaver.min.js",
      "js/utils.js",
      "js/types.js",
      "js/config.js",
      "js/constants.js",
      "js/dragBox.js",
      "js/miniMap.js",
      "js/main.js",
      "js/parts.js",
      "js/plumbGenerator.js",
      "js/load.js",
      "js/load/load1.js",
      "js/load/load3.js",
      "js/save.js",
      "js/saveIndicator.js",
      "js/parameters.js",
      "js/evaluations.js",
      "js/metadata.js",
      "js/condition.js",
      "js/expression.js",
      "js/validator.js",
      "js/keyControl.js",
      "js/reposition.js",
      "js/print.js",
      "js/draft.js",
      "js/zoom.js",
      "js/clipboard.js",
      "js/colorPicker.js"
  );
  foreach($scripts as $script)
  {
      echo '<script type="text/javascript" src="' .editor_url($script). '?t='.  filemtime(editor_path($script)) .'"></script>';
  }

  ?>
  <script id="config" type="application/xml"><?php echo file_get_contents(editor_path('config.xml')); ?></script>
</head>

<body>
  <?php echo file_get_contents(editor_url("svg/icons.svg")); ?>
  <div id="wrap">
    <div id="wrapRow">
      <div id="wrapLeft">
        <div id="content">
          <div>
            <div id="toolbar" class="noSelect">
              <!-- commented this button, because the manuals are no longer up to date. TODO: add new manuals
              <button id="manual" class="globalButton"><div><img src="<?php echo editor_url("png/main_buttons/manual.png");?>" alt=""><?php sLang("edt_manual"); ?></div></button>
              -->
              <div id="menus">
                <div id="logo"><img src="<?php echo editor_url("svg/logo.svg") ?>" alt="Editor Logo"/></div>
                <div class="buttonGroup dropdown" id="file">
                  <!-- File -->
                    <button id="fileButton" class="globalButton dropdownButton"><div><?php sLang("edt_file"); ?></div></button>
                    <div id="fileDropdown" class="dropdownItems">
                      <button id="importScenario" class="globalButton" title="<?php sLang('edt_import_scenario_title'); ?>">
                          <?php echo sIcon("icon-sm-import"); sLang("edt_import_scenario"); ?>...
                      </button>
                      <button id="exportScenario" class="globalButton" title="<?php sLang('edt_export_scenario_title'); ?>">
                          <?php echo sIcon("icon-sm-export"); sLang("edt_export_scenario"); ?>...
                      </button>
                      <div class="separator"></div>
                      <button id="print" class="globalButton"><?php echo sIcon("icon-sm-print"); sLang("edt_print"); ?>...</button>
                    </div>
                </div>
                <div class="buttonGroup dropdown" id="scenario">
                <!-- Scenario -->
                  <button id="scenarioButton" class="globalButton dropdownButton"><div><?php sLang("edt_scenario"); ?></div></button>
                  <div id="scenarioDropdown" class="dropdownItems">
                    <button id="editMetadata" class="globalButton" title="<?php sLang('edt_properties_title'); ?>"><?php echo sIcon("icon-sm-properties"); sLang("edt_properties"); ?>...</button>
                    <button id="editParameters" class="globalButton" title="<?php sLang('edt_parameters_title'); ?>"><?php echo sIcon("icon-sm-parameters"); sLang("edt_parameters"); ?>...</button>
                    <button id="editEvaluations" class="globalButton" title="<?php sLang('edt_evaluations_title'); ?>"><?php echo sIcon("icon-sm-evaluations"); sLang("edt_evaluations"); ?>...</button>
                  </div>
                </div>
                <div id="scenarioNameTab">
                  <?php sLang("edt_scenario"); ?>:
                  <span class="scenarioName"></span>
                </div>
                <div id="languages">
                  <?php
                  $languages = scandir(getcwd() . '/application/language');
                  $isFirst = true;
                  foreach ($languages as $name)
                  {
                      if (!ctype_alnum($name)) continue;

                      if (!$isFirst) echo ' | ';

                      echo '<a href="' . site_url() . '/language/changeLanguage/' . $name . '">';
                      echo '<img src="' . flag_url($name) . '">';
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
                    <button id="newTree" class="globalButton"><div><?php echo sIcon("icon-subject"); sLang("edt_subject"); ?></button>
                    <button id="newPlayerNode" class="subjectButton"><div><?php echo sIcon("icon-player"); sLang("edt_player"); ?></div></button>
                    <button id="newComputerNode" class="subjectButton"><div><?php echo sIcon("icon-computer"); sLang("edt_computer"); ?></div></button>
                    <button id="newSituationNode" class="subjectButton"><div><?php echo sIcon("icon-situation"); sLang("edt_situation"); ?></div></button>
                    <button id="newChildNode" class="nodeButton"><div><?php echo sIcon("icon-child"); sLang("edt_child"); ?></div></button>
                    <button id="toggleDraftScreen" class="subjectButton"><div><?php echo sIcon("icon-notepad"); sLang("edt_note_pad"); ?></div></button>
                    <button id="delete" class="globalButton"><div><?php echo sIcon("icon-delete"); sLang("btn_delete"); ?></div></button>
                  </div>
                </div>
                <div class="buttonGroup" id="clipboard">
                  <!-- Clipboard -->
                  <div class="big-buttons">
                    <button id="copy" class="globalButton"><div><?php echo sIcon("icon-copy"); sLang("edt_copy"); ?></div></button>
                    <button id="cut" class="globalButton"><div><?php echo sIcon("icon-cut"); sLang("edt_cut"); ?></div></button>
                    <button id="paste" class="globalButton"><div><?php echo sIcon("icon-paste"); sLang("edt_paste"); ?></div></button>
                  </div>
                </div>
                <div class="buttonGroup" id="view">
                  <!-- View -->
                  <div class="big-buttons">
                    <button id="repositionGraph" class="subjectButton" title="<?php sLang('edt_arrange_title'); ?>">
                      <div><?php echo sIcon("icon-arrange"); sLang("edt_arrange"); ?></div>
                    </button>
                    <button id="allParents" class="nodeButton">
                      <div><?php echo sIcon("icon-parents"); sLang("edt_parents"); ?></div>
                    </button>
                    <button id="toggleColors" class="subjectButton">
                      <div><?php echo sIcon("icon-palette"); sLang("edt_toggle_colors"); ?></div>
                    </button>
                  </div>
                </div>
                <div class="buttonGroup" id="validate">
                  <!-- Validate -->
                  <div class="big-buttons">
                    <button id="validation" class="globalButton">
                      <div><?php echo sIcon("icon-validate"); sLang("edt_validate"); ?></div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <div id="mainCell">
              <div id="main" tabindex="0">
                <div id="gridIndicator" class="gridded"></div>
              </div>
            </div>
          </div>
          <div>
            <div id="tabDock" style="display: none" class="ui-tabs ui-widget ui-widget-content ui-corner-all">
              <div class="ui-tabs-nav ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all" style="height:22px;">
                <div id="closeTabDock">X</div>
              </div>
              <div id="draftScreen" class="ui-tabs-panel ui-widget-content ui-corner-bottom ui-resizable"></div>
              <div id="validationReport" class="ui-tabs-panel ui-widget-content ui-corner-bottom ui-resizable">
              </div>
            </div>
          </div>
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
              <input type="checkbox" id="simpleMinimap" style="display: inline; margin-left: 10px" title="<?php sLang("edt_minimap_title"); ?>"/>
              <label for="simpleMinimap" title="<?php sLang('edt_minimap_title');?>"><?php sLang("edt_simple"); ?></label>
              <div id="minimap">
                  <div id="scaledDiv">
                    <h2 style="text-align:center; position:relative; top:100px;"><?php echo sIcon('icon-plus'); sLang("edt_minimap"); ?></h2>
                  </div>
                  <div id="minimapSelector"></div>
              </div>
            </div>
            <div id="properties" class="hidden">
              <div id="treeSubject">
                <h1><?php sLang("edt_subject_name"); ?></h1>
              </div>
              <div id="headerPlayer" class="header clickable collapseAll">
                <h1><span class="masterclicktag"><?php echo sIcon("icon-closed"); ?></span><?php echo sIcon("icon-nodeplayer"); sLang('edt_player');?></h1>
              </div>
              <div id="headerComputer" class="header clickable collapseAll">
                <h1><span class="masterclicktag"><?php echo sIcon("icon-closed"); ?></span><?php echo sIcon("icon-nodecomputer"); sLang('edt_computer');?></h1>
              </div>
              <div id="headerSituation" class="header clickable collapseAll">
                <h1><span class="masterclicktag"><?php echo sIcon("icon-closed"); ?></span><?php echo sIcon("icon-nodesituation"); sLang('edt_situation');?></h1>
              </div>
              <div id="characterSection" class="sidebarSection">
                <div class="sub-header clickable">
                  <h2><span class="clicktag"><?php echo sIcon("icon-closed"); ?></span><?php echo sIcon("icon-character"); sLang('edt_character');?></h2>
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
                  <h2 title="<?php sLang('edt_property_values_title');?>"><span class="clicktag"><?php echo sIcon("icon-closed"); ?></span><?php echo sIcon("icon-properties"); sLang('edt_property_values');?></h2>
                </div>
                <div class="collapsable">
                  <div id="node-property-values" class="section"></div>
                  <div id="node-character-property-values" class="section"></div>
                </div>
              </div>
              <div id="preconditionsSection" class="sidebarSection withMarginTop">
                <div class="sub-header clickable">
                  <h2 title="<?php sLang('edt_preconditions_title');?>"><span class="clicktag"><?php echo sIcon("icon-closed"); ?></span><?php echo sIcon("icon-preconditions"); sLang('edt_preconditions');?></h2>
                </div>
                <div id="preconditionsDiv" class="collapsable"></div>
              </div>
              <div id="effectsSection" class="sidebarSection">
                <div class="sub-header clickable">
                  <h2 title="<?php sLang('edt_parameter_effects_title');?>"><span class="clicktag"><?php echo sIcon("icon-closed"); ?></span><?php echo sIcon("icon-parameters"); sLang('edt_parameter_effects');?></h2>
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
              <div id="commentSection" class="sidebarSection">
                <div class="sub-header clickable">
                  <h2><span class="clicktag"><?php echo sIcon("icon-closed"); ?></span><?php echo sIcon("icon-note"); sLang('edt_authors_note');?></h2>
                </div>
                <div class="collapsable">
                  <textarea id="comment"></textarea>
                </div>
              </div>
              <div class="sidebarSection" id="optionalSubject">
                <div class="sub-header clickable">
                  <h2 title="<?php sLang('edt_optional_title');?>"><span class="clicktag"><?php echo sIcon("icon-closed"); ?></span> <?php sLang('edt_optional_header');?></h2>
                </div>
                <div class="collapsable">
                  <input type="checkbox" id="optionalCheckbox"/><label for="optionalCheckbox"><?php sLang('edt_optional_description');?></label>
                </div>
              </div>
              <div class="sidebarSection" id="allowInterleaveNode">
                <div class="sub-header clickable">
                  <h2 title="<?php sLang('edt_jump_title');?>"><span class="clicktag"><?php echo sIcon("icon-closed"); ?></span><?php echo sIcon("icon-jumpsubject"); sLang('edt_jump_header');?></h2>
                </div>
                <div class="collapsable">
                  <input type="checkbox" id="allowInterleaveNodeCheckbox"/><label for="allowInterleaveNodeCheckbox"><?php sLang('edt_jump_description');?></label>
                </div>
              </div>
              <div class="sidebarSection" id="allowDialogueEndNode">
                <div class="sub-header clickable">
                  <h2 title="<?php sLang('edt_inits_title');?>"><span class="clicktag"><?php echo sIcon("icon-closed"); ?></span><?php echo sIcon("icon-earlyend"); sLang('edt_inits_header');?></h2>
                </div>
                <div class="collapsable">
                  <input type="checkbox" id="allowDialogueEndNodeCheckbox"/><label for="allowDialogueEndNodeCheckbox"><?php sLang('edt_inits_description');?></label>
                </div>
              </div>
              <div class="sidebarSection" id="endNode">
                <div class="sub-header clickable">
                  <h2 title="<?php sLang('edt_end_title');?>"><span class="clicktag"><?php echo sIcon("icon-closed"); ?></span><?php echo sIcon("icon-endofscenario"); sLang('edt_end_header');?></h2>
                </div>
                <div class="collapsable">
                  <input type="checkbox" id="endNodeCheckbox"/><label for="endNodeCheckbox"><?php sLang('edt_end_description');?></label>
                </div>
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
