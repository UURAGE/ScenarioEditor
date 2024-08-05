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
      "js/lib/jsplumb.min.js",
      "js/lib/jsplumb-patched.js",
      "js/lib/FileSaver.min.js",
      "js/lib/popper.min.js",
      "js/lib/tippy-bundle.umd.min.js",
      "js/lib/dialog-draggable.bundle.min.js",
      "js/lib/sortablejs.bundle.min.js",
      "js/lib/selectable.min.js",
      "js/globals.js",
      "js/dialog.js",
      "js/tabs.js",
      "js/accordion.js",
      "js/progressbar.js",
      "js/tooltip.js",
      "js/autocomplete.js",
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
  <?php echo file_get_contents(editor_path("svg/icons-mdi.svg")); ?>
  <?php echo file_get_contents(editor_path("svg/icons-mdi-custom.svg")); ?>
  <div id="wrap">
    <div id="content">
      <!-- Top toolbar / Navbar -->
      <div id="toolbar" class="noSelect dark">
          <div class="left">
            <!-- File -->
            <div class="dropdown" id="file">
              <button id="fileButton" class="globalButton dropdownButton"><?php sLang("edt_file"); ?></button>
              <div id="fileDropdown" class="dropdownItems">
                <button id="importScenario" class="globalButton editingOnly" title="<?php sLang('edt_import_scenario_title'); ?>">
                  <?php echo sIcon("mdi-upload"); sLang("edt_import_scenario"); ?>...<kbd>I</kbd>
                </button>
                <button id="exportScenario" class="globalButton editingOnly" title="<?php sLang('edt_export_scenario_title'); ?>">
                  <?php echo sIcon("mdi-download"); sLang("edt_export_scenario"); ?>...<kbd>O</kbd>
                </button>
                <hr />
                <button id="print" class="globalButton"><?php echo sIcon("mdi-printer"); sLang("edt_print"); ?>... <span><kbd>Ctrl</kbd><kbd>P</kbd></span></button>
              </div>
            </div>
            <!-- Scenario -->
            <div class="dropdown" id="scenario">
              <button id="scenarioButton" class="globalButton dropdownButton"><?php sLang("edt_scenario"); ?></button>
              <div id="scenarioDropdown" class="dropdownItems">
                <button id="editMetadata" class="globalButton" title="<?php sLang('edt_properties_title'); ?>"><?php echo sIcon("mdi-cog"); sLang("edt_properties"); ?>...<kbd>B</kbd></button>
                <button id="editParameters" class="globalButton" title="<?php sLang('edt_parameters_title'); ?>"><?php echo sIcon("mdi-filter-cog"); sLang("edt_parameters"); ?>...<kbd>P</kbd></button>
                <button id="editEvaluations" class="globalButton" title="<?php sLang('edt_evaluations_title'); ?>"><?php echo sIcon("mdi-seal"); sLang("edt_evaluations"); ?>...<kbd>X</kbd></button>
              </div>
            </div>
            <!-- Theme switch -->
            <div class="dropdown" id="themeSettings">
              <button id="themeSwitchButton" class="globalButton dropdownButton"><?php echo sIcon("mdi-moon-waning-crescent") ?></button>
              <div id="themeSwitchDropdown" class="dropdownItems">
                <button id="theme-toolbar" class="globalButton">Toolbar <span class="switch"><span class="slider"></span></span> </button>
                <button id="theme-canvas" class="globalButton">Canvas <span class="switch"><span class="slider"></span></span> </button>
                <button id="theme-sidebar" class="globalButton">Sidebar <span class="switch"><span class="slider"></span></span> </button>
                <button id="theme-tabDock" class="globalButton">TabDock <span class="switch"><span class="slider"></span></span> </button>
                </div>
            </div>

            <!-- Create Nodes -->
            <button id="newPlayerNode" class="subjectButton editingOnly" title="<?php sLang("edt_player") ?>"><?php echo sIcon("mdi-comment-account-outline") ?></button>
            <button id="newComputerNode" class="subjectButton editingOnly" title="<?php sLang("edt_computer") ?>"><?php echo sIcon("icon-add-computer") ?></button>
            <button id="newSituationNode" class="subjectButton editingOnly" title="<?php sLang("edt_situation") ?>"><?php echo sIcon("icon-add-situation") ?></button>
            <!-- Order Nodes -->
            <button id="repositionGraph" class="subjectButton editingOnly" title="<?php sLang("edt_arrange_title") ?>"><?php echo sIcon("mdi-sitemap-outline") ?></button>
            <button id="snapGraph" class="subjectButton" title="<?php sLang("edt_snap_to_grid") ?>"><?php echo sIcon("mdi-magnet") ?></button>
            <!-- View -->
            <button id="highlightAncestors" class="buttonSwitch subjectButton" title="<?php sLang("edt_ancestors") ?>">
              <?php echo sIcon("icon-ancestors") ?><span class="switch"><span class="slider"></span></span>
            </button>
            <button id="highlightDescendants" class="buttonSwitch subjectButton" title="<?php sLang("edt_descendants") ?>">
              <?php echo sIcon("icon-descendants") ?><span class="switch"><span class="slider"></span></span></button>
          </div>

          <div class="center">
            <!-- Child node creation -->
            <div class="dropdown splitButton nodeButton" id="addNode">
              <div class="buttons">
                <button></button>
                <button class="dropdownButton"><?php echo sIcon("mdi-menu-down"); ?></button>
              </div>
              <div class="dropdownItems">
                <div class="flexbox gap-1">
                  <button id="newChildNode" class="nodeButton editingOnly"><?php echo sIcon("icon-child"); sLang("edt_child"); ?><kbd>R</kbd></button>
                  <button id="newPlayerChildNode" class="secondary addChildButton player nodeWithoutChildrenButton"></button>
                  <button id="newComputerChildNode" class="secondary addChildButton computer nodeWithoutChildrenButton"></button>
                  <button id="newSituationChildNode" class="secondary addChildButton situation nodeWithoutChildrenButton"></button>
                </div>
                <button id="newSiblingNode" class="nodeWithParentButton editingOnly"><?php echo sIcon("icon-add-sibling"); sLang("edt_sibling"); ?><kbd>G</kbd></button>
              </div>
            </div>
            <!-- Clipboard -->
            <button id="copy" class="nodeButton clipboardToolButton editingOnly" title="<?php sLang("edt_copy") ?>"><?php echo sIcon("mdi-content-copy") ?></button>
            <button id="cut" class="nodeButton clipboardToolButton editingOnly" title="<?php sLang("edt_cut") ?>"><?php echo sIcon("mdi-content-cut") ?></button>
            <button id="paste" class="nodeButton clipboardToolButton editingOnly" title="<?php sLang("edt_paste") ?>"><?php echo sIcon("mdi-content-paste") ?></button>
            <button id="delete" class="nodeButton clipboardToolButton editingOnly" title="<?php sLang("btn_delete") ?>"><?php echo sIcon("mdi-trash-can-outline") ?></button>
          </div>

          <div class="right">
            <button id="togglePlaythroughsScreen" class="globalButton" title="<?php sLang("edt_playthrough_item_analysis") ?>"><?php echo sIcon("mdi-selection-search") ?></button>
            <!-- Validate -->
            <button id="validation" class="globalButton" title="<?php sLang("edt_validate") ?>"><?php echo sIcon("icon-validate") ?></button>
            <button id="saveButton" class="globalButton editingOnly" title="<?php sLang("edt_save") ?>"><?php echo sIcon("mdi-content-save") ?></button>
            <div id="languages">
              <?php
              $languages = scandir(APPPATH . 'Language');
              foreach ($languages as $code)
              {
                  if (!ctype_alnum($code)) continue;
                  echo '<a href="' . site_url('language/changeLanguage/' . $code) . '">';
                  echo '<img src="' . flag_url($code) . '" alt="' . $code . '">';
                  echo '</a>';
              }
              ?>
            </div>
          </div>
      </div>

      <div id="breadcrumbs">
        <div class="scenarioName">
          <span></span>
          <input type="text"/>
        </div>
        <div class="slashDivider">/</div>
        <div class="subjectName">
          <span></span>
          <input type="text"/>
        </div>
      </div>

      <div id="canvas" class="fullscreen wSpacing">
        <div id="main" tabindex="0">
          <div id="gridIndicator" class="gridded">
            <div class="gridIndicatorInner">
              <div class="addIcon">
                <?php echo sIcon("mdi-plus") ?>
              </div>
            </div>
          </div>
        </div>

        <button class="backButton dark" title="<?php sLang('edt_back'); ?>" style="display:none;">
          <?php echo sIcon("mdi-arrow-left") ?>
        </button>

        <div class="bottomButtons dark">
          <button id="enableMinimap" class="medium" title="<?php sLang('edt_toggle_minimap'); ?>">
            <?php echo sIcon("mdi-map-search-outline"); sLang("edt_minimap"); ?>
          </button>
        </div>

        <!-- Minimap -->
        <div id="miniwrap">
          <div id="minimap">
            <div id="scaledDiv"></div>
            <div id="minimapSelector"></div>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div id="sidebar" class="dark">
        <div class="grip noSelect"></div>

        <!-- Displays what node type is selected -->
        <div id="sidebarType" style="display:none;">
          <div title="<?php sLang("edt_subject") ?>" id="headerSubject" class="header">
            <?php echo sIcon("icon-subject") ?>
          </div>
          <div title="<?php sLang("edt_player") ?>" id="headerPlayer" class="header">
            <?php echo sIcon("mdi-comment-account-outline") ?>
          </div>
          <div title="<?php sLang("edt_computer") ?>" id="headerComputer" class="header">
            <?php echo sIcon("icon-add-computer") ?>
          </div>
          <div title="<?php sLang("edt_situation") ?>" id="headerSituation" class="header">
            <?php echo sIcon("icon-add-situation") ?>
          </div>
          <div class="header sidebarShrinkExpand">
            <?php echo sIcon("mdi-chevron-right", 'shrink') ?>
            <?php echo sIcon("mdi-chevron-left", 'expand') ?>
          </div>
        </div>

        <!-- Content -->
        <div class="sidebarContent hidden" id="properties">
          <div id="characterSection" class="sidebarSection">
            <div class="sub-header clickable">
              <h2><?php sLang('edt_character'); ?></h2><button class="clicktag text"><?php echo sIcon("mdi-chevron-right"); ?></button>
            </div>
            <div class="collapsable">
              <select name="characterSelection" id="characterSelection" class="subjectButton"></select>
              <div>
                  <h3><?php sLang('edt_parameter_effects');?></h3>
                <div id="node-computer-own-parameter-effects"></div>
              </div>
              <div>
                <h3><?php sLang('edt_property_values'); ?></h3>
                <div id="node-computer-own-property-values"></div>
              </div>
            </div>
          </div>
          <div id="propertyValuesSection" class="sidebarSection">
            <div class="sub-header clickable">
              <h2 title="<?php sLang('edt_property_values_title'); ?>"><?php sLang('edt_property_values'); ?></h2><button class="clicktag text"><?php echo sIcon("mdi-chevron-right"); ?></button>
            </div>
            <div class="collapsable">
              <div id="node-property-values" class="section"></div>
              <div id="node-character-property-values" class="section"></div>
            </div>
          </div>
          <div id="preconditionsSection" class="sidebarSection">
            <div class="sub-header clickable">
              <h2 title="<?php sLang('edt_preconditions_title'); ?>"><?php sLang('edt_preconditions'); ?></h2><button class="clicktag text"><?php echo sIcon("mdi-chevron-right"); ?></button>
            </div>
            <div id="preconditionsDiv" class="collapsable"></div>
          </div>
          <div id="effectsSection" class="sidebarSection">
            <div class="sub-header clickable">
              <h2 title="<?php sLang('edt_parameter_effects_title'); ?>"><?php sLang('edt_parameter_effects'); ?></h2>
              <button class="clicktag text"><?php echo sIcon("mdi-chevron-right"); ?></button>
            </div>
            <div class="collapsable">
              <div id="userDefinedParameterEffects" class="section"></div>
              <button id="addUserDefinedParameterEffect" class="col-default roundedPill medium" title="<?php sLang('edt_add'); ?>"><?php echo sIcon('mdi-plus'); sLang('edt_add_effect'); ?></button>

              <div id="fixed-parameter-effects"></div>
              <div id="fixed-character-parameter-effects"></div>
            </div>
          </div>
          <div class="sidebarSection" id="commentSection">
            <div class="sub-header clickable">
              <h2><?php sLang('edt_authors_note'); ?></h2><button class="clicktag text"><?php echo sIcon("mdi-chevron-right"); ?></button>
          </div>
            <div class="collapsable">
              <textarea id="comment"></textarea>
            </div>
          </div>
        </div>
        </div>

      <!-- Bottom Toolbar -->
      <div id="tabDock" class="closed dark">
        <div class="grip noSelect"></div>
        <div class="header">
          <div class="tabs">
            <button data-tab-id="elementList"><?php echo sIcon("mdi-format-list-bulleted-square"); sLang("edt_list") ?></button>
            <button data-tab-id="validation"><?php echo sIcon("icon-validate"); sLang("edt_validate"); ?></button>
          </div>
          <div class="controls"></div>
          <button id="closeTabDock" style="display:none;"><?php echo sIcon("mdi-close-thick"); ?></button>
        </div>
        <div class="content">
          <div id="elementList" style="display:none;" class="hasStyledTable"></div>
          <div id="validationReport" style="display:none;"></div>
        </div>
      </div>
    </div>
  </div>
  <div id="dragBox" style="display: none"></div>
  <div class="lengthTest"></div>
</body>
</html>
