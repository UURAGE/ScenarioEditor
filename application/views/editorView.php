<!DOCTYPE HTML>
<!-- ©Copyright Utrecht University (Department of Information and Computing Sciences) -->

<html>
<head>
  <title>Editor - UURAGE</title>
  <meta charset="utf-8">
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="-1">
  <link rel="icon" type="image/png" href="<?php echo editor_url("png/small_logo.png");?>">

  <?php
  $language = $this->session->userdata('language');

  $styles = array(
      "css/stylesheet.css",
      "css/jsPlumbStyle.css",
      "jQueryUI/css/jquery-ui-1.10.4.custom.css"
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
    var base_url = "' . base_url() . '";'
  ;
  ?>
  </script>

  <?php

  //load language related scripts first since all others depend on them
  $languageScripts = array(
      "js/lib/sprintf.js",
      "js/lib/languageManager.js",
    );

  foreach($languageScripts as $script)
  {
      echo '<script type="text/javascript" src="' .editor_url($script). '?t='.  filemtime(editor_path($script)) .'"></script>';
  }

  $fileName = $this->router->fetch_class().".js";
    echo '<script type="text/javascript" src="' . editor_js_lang_url($language).'/'.$fileName. '?t='. filemtime(editor_path('lang/'.$language.'/'.$fileName)). '"></script>';

  //non language related scripts
  $scripts = array(
      "js/lib/jquery-2.2.4.min.js",
      "js/lib/jquery-ui-1.11.4.min.js",
      "js/lib/jquery-ui-selectable-patched.js",
      "js/lib/jsPlumb-2.0.7.js",
      "js/lib/colResizable-1.3.min.js",
      "js/utils.js",
      "js/config.js",
      "js/parameterValues.js",
      "js/dragBox.js",
      "js/miniMap.js",
      "js/main.js",
      "js/parts.js",
      "js/plumbGenerator.js",
      "js/load.js",
      "js/load/load1.js",
      "js/load/load3.js",
      "js/save.js",
      "js/metadata.js",
      "js/htmlGenerator.js",
      "js/objectGenerator.js",
      "js/validator.js",
      "js/keyControl.js",
      "js/reposition.js",
      "js/print.js",
      "js/draft.js",
      "js/zoom.js",
      "js/clipboard.js"
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
                <div class="buttonGroup dropdown" id="file">
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
                <div class="buttonGroup dropdown" style="left:132px;" id="scenario">
                <!-- Scenario -->
                  <div class="small-buttons">
                    <button id="scenarioButton" class="globalButton dropdownButton"><div><?php sLang("edt_scenario"); ?>...</div></button>
                    <div id="scenarioDropdown" class="dropdownItems">
                      <button id="editMetadata" class="globalButton" title="<?php sLang('edt_properties_title'); ?>"><div><img src="<?php echo editor_url("png/main_buttons/properties.png");?>" alt=""><?php sLang("edt_properties"); ?>...</div></button>
                      <button id="editParameters" class="globalButton" title="<?php sLang('edt_parameters_title'); ?>"><div><img src="<?php echo editor_url("png/main_buttons/properties.png");?>" alt=""><?php sLang("edt_parameters"); ?>...</div></button>
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
                <div id="gridIndicator"></div>
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
                <table></table>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Sidebar -->
      <div id="sidebar">
        <div>
          <div>
            <div>
              <div id="languages">
                <?php
                $languages = scandir(getcwd()."/application/language");
                $lastElement = end($languages);
                foreach($languages as $index=>$name)
                {
                    if(ctype_alnum($name))
                    {
                        $flagUrl = flag_url($name);
                        echo("<a href='".site_url()."/language/changeLanguage/".$name."'><img src='".$flagUrl."'></a>");

                        if ($name != $lastElement)
                            echo(" | ");
                    }
                }
                ?>
              </div>
              <div id="miniwrap" style="display: none">
                <label for="enableMinimap" style="margin-left: 30px" title="<?php sLang('edt_toggle_minimap'); ?>"><?php sLang("edt_minimap"); ?>:</label>
                <input type="checkbox" id="enableMinimap" style="display:inline" checked title="<?php sLang('edt_toggle_minimap'); ?>"/>
                <label for="simpleMinimap" style="margin-left: 10px" title="<?php sLang('edt_minimap_title');?>"><?php sLang("edt_simple"); ?>:</label>
                <input type="checkbox" id="simpleMinimap" style="display:inline" title="<?php sLang("edt_minimap_title"); ?>"/>
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
                    <div id="node-character-own-properties"></div>
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
                    <h2 title="<?php sLang('edt_effects_title');?>"><span class="clicktag">[+]</span> <img src="<?php echo editor_url("png/sidebar_headers/effects.png");?>" alt=""><?php sLang('edt_effects');?></h2>
                  </div>
                  <div class="collapsable">
                    <div>
                      <h3>User-defined</h3>
                      <div id="userDefinedParameterEffects" class="section"></div>
                      <button id="addUserDefinedParameterEffect" title="<?php sLang('edt_add');?>"><img src="<?php echo editor_url("png/others/plus.png");?>" alt=""> <?php sLang('edt_add_effect');?></button>
                    </div>
                    <div id="fixed-parameter-effects" class="section"></div>
                  </div>
                </div>
                <div id="propertyValuesSection" class="sidebarSection">
                  <div class="sub-header clickable">
                    <h2><span class="clicktag">[+]</span> <img src="<?php echo editor_url("png/sidebar_headers/properties.png");?>" alt=""><?php sLang('edt_properties');?></h2>
                  </div>
                  <div class="collapsable">
                    <div id="node-property-values" class="section"></div>
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
                <div class="sidebarSection" id="jumpNode">
                  <div class="sub-header clickable">
                    <h2 title="<?php sLang('edt_jump_title');?>"><span class="clicktag">[+]</span> <img src="<?php echo editor_url("png/sidebar_headers/jump.png");?>" alt=""><?php sLang('edt_jump_header');?></h2>
                  </div>
                  <div class="collapsable">
                    <input type="checkbox" id="jumpNodeCheckbox"/><label for="jumpNodeCheckbox"><?php sLang('edt_jump_description');?></label>
                  </div>
                </div>
                <div class="sidebarSection" id="initsNode">
                  <div class="sub-header clickable">
                    <h2 title="<?php sLang('edt_inits_title');?>"><span class="clicktag">[+]</span> <img src="<?php echo editor_url("png/sidebar_headers/premature_end.png");?>" alt=""><?php sLang('edt_inits_header');?></h2>
                  </div>
                  <div class="collapsable">
                    <input type="checkbox" id="initsNodeCheckbox"/><label for="initsNodeCheckbox"><?php sLang('edt_inits_description');?></label>
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
  </div>
  <div id="metaScreen" style="display: none"></div>
  <div id="importScreen" style="display: none"></div>
  <div id="parameterScreen" style="display: none"></div>
  <div id="enumerationScreen" style="display: none"></div>
  <div id="dragBox" style="display: none"></div>
  <div class="lengthTest"></div>
</body>
</html>
