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
  <div id="wrap">
    <div id="wrapRow">
      <div id="wrapLeft">
        <div id="content">
          <div>
            <div id="toolbar">
              <div id="scenarioNameTab">
                <?php sLang("edt_scenario"); ?>:
                <span class="scenarioName"></span>
              </div>
              <!-- commented this button, because the manuals are no longer up to date. TODO: add new manuals
              <button id="manual" class="globalButton"><div><img src="<?php echo editor_url("png/main_buttons/manual.png");?>" alt=""><?php sLang("edt_manual"); ?></div></button>
              -->
              <div id="menus">
                <div id="logo"><img src="<?php echo editor_url("svg/logo.svg") ?>" alt="Editor Logo"/></div>
                <div class="buttonGroup dropdown" style="left: 32px;" id="file">
                  <!-- File -->
                  <div class="small-buttons">
                    <button id="fileButton" class="globalButton dropdownButton"><div><?php sLang("edt_file"); ?>...</div></button>
                    <div id="fileDropdown" class="dropdownItems">
                      <button id="importScenario" class="globalButton" title="<?php sLang('edt_import_scenario_title'); ?>">
                        <div>
                          <img src="<?php echo editor_url("png/main_buttons/import.png");?>" alt=""><?php sLang("edt_import_scenario"); ?>...
                        </div>
                      </button>
                      <button id="exportScenario" class="globalButton" title="<?php sLang('edt_export_scenario_title'); ?>">
                        <div>
                          <img src="<?php echo editor_url("png/main_buttons/export.png");?>" alt=""><?php sLang("edt_export_scenario"); ?>...
                        </div>
                      </button>
                      <div class="separator"></div>
                      <button id="print" class="globalButton"><div><img src="<?php echo editor_url("png/main_buttons/print.png");?>" alt=""><?php sLang("edt_print"); ?>...</div></button>
                    </div>
                  </div>
                </div>
                <div class="buttonGroup dropdown" style="left:144px;" id="scenario">
                <!-- Scenario -->
                  <div class="small-buttons">
                    <button id="scenarioButton" class="globalButton dropdownButton"><div><?php sLang("edt_scenario"); ?>...</div></button>
                    <div id="scenarioDropdown" class="dropdownItems">
                      <button id="editMetadata" class="globalButton" title="<?php sLang('edt_properties_title'); ?>"><div><img src="<?php echo editor_url("png/main_buttons/properties.png");?>" alt=""><?php sLang("edt_properties"); ?>...</div></button>
                      <button id="editParameters" class="globalButton" title="<?php sLang('edt_parameters_title'); ?>"><div><img src="<?php echo editor_url("png/main_buttons/properties.png");?>" alt=""><?php sLang("edt_parameters"); ?>...</div></button>
                      <button id="editEvaluations" class="globalButton" title="<?php sLang('edt_evaluations_title'); ?>"><div><img src="<?php echo editor_url("png/main_buttons/properties.png");?>" alt=""><?php sLang("edt_evaluations"); ?>...</div></button>
                    </div>
                  </div>
                </div>
              </div>
              <div id="ribbon">
                <div class="buttonGroup" id="edit">
                  <!-- Edit -->
                  <div class="big-buttons">
                    <button id="newTree" class="globalButton"><div><img src="<?php echo editor_url("png/main_buttons/subject.png");?>" alt=""><?php sLang("edt_subject"); ?></div></button>
                    <button id="newPlayerNode" class="subjectButton"><div><img src="<?php echo editor_url("png/main_buttons/player.png");?>" alt=""><?php sLang("edt_player"); ?></div></button>
                    <button id="newComputerNode" class="subjectButton"><div><img src="<?php echo editor_url("png/main_buttons/computer.png");?>" alt=""><?php sLang("edt_computer"); ?></div></button>
                    <button id="newSituationNode" class="subjectButton"><div><img src="<?php echo editor_url("png/main_buttons/situation.png");?>" alt=""><?php sLang("edt_situation"); ?></div></button>
                    <button id="newChildNode" class="nodeButton"><div><img src="<?php echo editor_url("png/main_buttons/child.png");?>" alt=""><?php sLang("edt_child"); ?></div></button>
                    <button id="toggleDraftScreen" class="subjectButton"><div><img src="<?php echo editor_url("png/main_buttons/draft.png");?>" alt=""><?php sLang("edt_note_pad"); ?></div></button>
                  </div>
                </div>
                <div class="buttonGroup" id="clipboard">
                  <!-- Clipboard -->
                  <div class="big-buttons">
                    <button id="copyNode" class="globalButton"><div><img src="<?php echo editor_url("png/main_buttons/copy.png");?>" alt=""><?php sLang("edt_copy"); ?></div></button>
                    <button id="cutNode" class="globalButton"><div><img src="<?php echo editor_url("png/main_buttons/cut.png");?>" alt=""><?php sLang("edt_cut"); ?></div></button>
                    <button id="pasteNode" class="globalButton"><div><img src="<?php echo editor_url("png/main_buttons/paste_placeholder.png");?>" alt=""><?php sLang("edt_paste"); ?></div></button>
                    <button id="deleteNode" class="globalButton"><div><img src="<?php echo editor_url("png/main_buttons/trashbin.png");?>" alt=""><?php sLang("btn_delete"); ?></div></button>
                  </div>
                </div>
                <div class="buttonGroup" id="view">
                  <!-- View -->
                  <div class="big-buttons">
                    <button id="repositionGraph" class="subjectButton" title="<?php sLang('edt_arrange_title'); ?>">
                      <div><img src="<?php echo editor_url("png/main_buttons/arrange.png");?>" alt=""><?php sLang("edt_arrange"); ?></div>
                    </button>
                    <button id="allParents" class="nodeButton">
                      <div><img src="<?php echo editor_url("png/main_buttons/parents.png");?>" alt=""><?php sLang("edt_parents"); ?></div>
                    </button>
                    <button id="toggleColors" class="subjectButton">
                      <div><img src="<?php echo editor_url("png/main_buttons/toggle_colors.png");?>" alt=""><?php sLang("edt_toggle_colors"); ?></div>
                    </button>
                  </div>
                </div>
                <div class="buttonGroup" id="validate">
                  <!-- Validate -->
                  <div class="big-buttons">
                    <button id="validation" class="globalButton">
                      <div><img src="<?php echo editor_url("png/main_buttons/validate.png");?>" alt=""><?php sLang("edt_validate"); ?></div>
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
        <div class="grip"></div>
        <div>
          <div>
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
            <div id="miniwrap" style="display: none">
              <input type="checkbox" id="enableMinimap" style="display: inline; margin-left: 30px" checked title="<?php sLang('edt_toggle_minimap'); ?>"/>
              <label for="enableMinimap" title="<?php sLang('edt_toggle_minimap'); ?>"><?php sLang("edt_minimap"); ?></label>
              <input type="checkbox" id="simpleMinimap" style="display: inline; margin-left: 10px" title="<?php sLang("edt_minimap_title"); ?>"/>
              <label for="simpleMinimap" title="<?php sLang('edt_minimap_title');?>"><?php sLang("edt_simple"); ?></label>
              <div id="minimap">
                  <div id="scaledDiv">
                    <h2 style="text-align:center; position:relative; top:100px;">[+]<?php sLang("edt_minimap"); ?></h2>
                  </div>
                  <div id="minimapSelector"></div>
              </div>
            </div>
            <div id="properties" class="hidden">
              <div id="treeSubject">
                <h1><?php sLang("edt_subject_name"); ?></h1>
              </div>
              <div id="headerPlayer" class="header clickable collapseAll">
                <h1><span class="masterclicktag">[+]</span> <img src="<?php echo editor_url("png/sidebar_headers/player.png");?>" alt=""><?php sLang('edt_player');?></h1>
              </div>
              <div id="headerComputer" class="header clickable collapseAll">
                <h1><span class="masterclicktag">[+]</span> <img src="<?php echo editor_url("png/sidebar_headers/computer.png");?>" alt=""><?php sLang('edt_computer');?></h1>
              </div>
              <div id="headerSituation" class="header clickable collapseAll">
                <h1><span class="masterclicktag">[+]</span> <img src="<?php echo editor_url("png/sidebar_headers/situation.png");?>" alt=""><?php sLang('edt_situation');?></h1>
              </div>
              <div id="characterSection" class="sidebarSection">
                <div class="sub-header clickable">
                  <h2><span class="clicktag">[+]</span> <img src="<?php echo editor_url("png/sidebar_headers/character.png");?>" alt=""><?php sLang('edt_character');?></h2>
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
                  <h2 title="<?php sLang('edt_property_values_title');?>"><span class="clicktag">[+]</span> <img src="<?php echo editor_url("png/sidebar_headers/properties.png");?>" alt=""><?php sLang('edt_property_values');?></h2>
                </div>
                <div class="collapsable">
                  <div id="node-property-values" class="section"></div>
                  <div id="node-character-property-values" class="section"></div>
                </div>
              </div>
              <div id="preconditionsSection" class="sidebarSection withMarginTop">
                <div class="sub-header clickable">
                  <h2 title="<?php sLang('edt_preconditions_title');?>"><span class="clicktag">[+]</span> <img src="<?php echo editor_url("png/sidebar_headers/preconditions.png");?>" alt=""><?php sLang('edt_preconditions');?></h2>
                </div>
                <div id="preconditionsDiv" class="collapsable"></div>
              </div>
              <div id="effectsSection" class="sidebarSection">
                <div class="sub-header clickable">
                  <h2 title="<?php sLang('edt_parameter_effects_title');?>"><span class="clicktag">[+]</span> <img src="<?php echo editor_url("png/sidebar_headers/effects.png");?>" alt=""><?php sLang('edt_parameter_effects');?></h2>
                </div>
                <div class="collapsable">
                  <div>
                    <div id="userDefinedParameterEffects" class="section"></div>
                    <button id="addUserDefinedParameterEffect" title="<?php sLang('edt_add');?>"><img src="<?php echo editor_url("png/others/plus.png");?>" alt=""> <?php sLang('edt_add_effect');?></button>
                  </div>
                  <div id="fixed-parameter-effects" class="section"></div>
                  <div id="fixed-character-parameter-effects" class="section"></div>
                </div>
              </div>
              <div id="commentSection" class="sidebarSection">
                <div class="sub-header clickable">
                  <h2><span class="clicktag">[+]</span> <img src="<?php echo editor_url("png/sidebar_headers/comments.png");?>" alt=""><?php sLang('edt_authors_note');?></h2>
                </div>
                <div class="collapsable">
                  <textarea id="comment"></textarea>
                </div>
              </div>
              <div class="sidebarSection" id="optionalSubject">
                <div class="sub-header clickable">
                  <h2 title="<?php sLang('edt_optional_title');?>"><span class="clicktag">[+]</span> <?php sLang('edt_optional_header');?></h2>
                </div>
                <div class="collapsable">
                  <input type="checkbox" id="optionalCheckbox"/><label for="optionalCheckbox"><?php sLang('edt_optional_description');?></label>
                </div>
              </div>
              <div class="sidebarSection" id="allowInterleaveNode">
                <div class="sub-header clickable">
                  <h2 title="<?php sLang('edt_jump_title');?>"><span class="clicktag">[+]</span> <img src="<?php echo editor_url("png/sidebar_headers/jump.png");?>" alt=""><?php sLang('edt_jump_header');?></h2>
                </div>
                <div class="collapsable">
                  <input type="checkbox" id="allowInterleaveNodeCheckbox"/><label for="allowInterleaveNodeCheckbox"><?php sLang('edt_jump_description');?></label>
                </div>
              </div>
              <div class="sidebarSection" id="allowDialogueEndNode">
                <div class="sub-header clickable">
                  <h2 title="<?php sLang('edt_inits_title');?>"><span class="clicktag">[+]</span> <img src="<?php echo editor_url("png/sidebar_headers/premature_end.png");?>" alt=""><?php sLang('edt_inits_header');?></h2>
                </div>
                <div class="collapsable">
                  <input type="checkbox" id="allowDialogueEndNodeCheckbox"/><label for="allowDialogueEndNodeCheckbox"><?php sLang('edt_inits_description');?></label>
                </div>
              </div>
              <div class="sidebarSection" id="endNode">
                <div class="sub-header clickable">
                  <h2 title="<?php sLang('edt_end_title');?>"><span class="clicktag">[+]</span> <img src="<?php echo editor_url("png/sidebar_headers/end.png");?>" alt=""><?php sLang('edt_end_header');?></h2>
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
