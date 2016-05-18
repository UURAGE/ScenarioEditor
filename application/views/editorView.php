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
      //"js/lib/multidraggable.js",
      //"js/lib/xselectable.js",
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
      "js/media.js",
      "js/metadata.js",
      "js/feedbackForm.js",
      "js/htmlGenerator.js",
      "js/objectGenerator.js",
      "js/validator.js",
      "js/keyControl.js",
      "js/reposition.js",
      "js/print.js",
      "js/draft.js",
      "js/zoom.js",
      "js/calculateScore.js",
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
              <div id="scriptNameTab">
                <?php sLang("edt_scenario"); ?>:
                <span class="scriptName"></span>
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
                      <button id="importScript" class="globalButton" title="<?php sLang('edt_import_script_title'); ?>"><div><?php sLang("edt_import_script"); ?>...</div></button>
                      <button id="exportScript" class="globalButton" title="<?php sLang('edt_export_script_title'); ?>"><div><?php sLang("edt_export_script"); ?>...</div></button>
                      <div class="separator"></div>
                      <button id="print" class="globalButton"><div><img src="<?php echo editor_url("png/main_buttons/print.png");?>" alt=""><?php sLang("edt_print"); ?>...</div></button>
                    </div>
                  </div>
                </div>
                <div class="buttonGroup dropdown" style="left:132px;" id="script">
                  <div class="small-buttons">
                    <button id="scriptButton" class="globalButton dropdownButton"><div><?php sLang("edt_script"); ?>...</div></button>
                    <div id="scriptDropdown" class="dropdownItems">
                      <button id="mediaScreenButton" class="globalButton" title="<?php sLang('edt_media_title'); ?>"><div><img src="<?php echo editor_url("png/main_buttons/media.png");?>" alt=""><?php sLang("edt_media"); ?>...</div></button>
                      <button id="editMetadata" class="globalButton" title="<?php sLang('edt_properties_title'); ?>"><div><img src="<?php echo editor_url("png/main_buttons/properties.png");?>" alt=""><?php sLang("edt_properties"); ?>...</div></button>
                      <button id="editParameters" class="globalButton" title="<?php sLang('edt_parameters_title'); ?>"><div><img src="<?php echo editor_url("png/main_buttons/properties.png");?>" alt=""><?php sLang("edt_parameters"); ?>...</div></button>
                      <button id="feedbackform" class="globalButton" title="<?php sLang('edt_post_game_feedback_title'); ?>"><div><img src="<?php echo editor_url("png/main_buttons/properties.png");?>" alt=""><?php sLang("edt_post_game_feedback"); ?>...</div></button>
                    </div>
                  </div>
                </div>
              </div>
              <div id="ribbon">
                <div class="buttonGroup" id="clipboard">
                  <!-- Clipboard -->
                  <div class="big-buttons">
                    <button id="pasteNode" class="globalButton"><div><img src="<?php echo editor_url("png/main_buttons/draft.png");?>" alt=""><?php sLang("edt_paste"); ?></div></button>
                  </div>
                  <div class="small-buttons">
                    <button id="copyNode" class="globalButton"><div><img src="<?php echo editor_url("png/main_buttons/save.png");?>" alt=""><?php sLang("edt_copy"); ?></div></button>
                    <button id="cutNode" class="globalButton"><div><img src="<?php echo editor_url("png/main_buttons/cut.png");?>" alt=""><?php sLang("edt_cut"); ?></div></button>
                    <button id="deleteNode" class="globalButton"><div><img src="<?php echo editor_url("png/main_buttons/trashbin.png");?>" alt=""><?php sLang("btn_delete"); ?></div></button>
                  </div>
                </div>
                <div class="buttonGroup" id="edit">
                  <!-- Edit -->
                  <div class="big-buttons">
                    <button id="newPlayerNode" class="subjectButton"><div><img src="<?php echo editor_url("png/main_buttons/player.png");?>" alt=""><?php sLang("edt_player"); ?></div></button>
                    <button id="newComputerNode" class="subjectButton"><div><img src="<?php echo editor_url("png/main_buttons/computer.png");?>" alt=""><?php sLang("edt_computer"); ?></div></button>
                    <button id="newChildNode" class="nodeButton"><div><img src="<?php echo editor_url("png/main_buttons/child.png");?>" alt=""><?php sLang("edt_child"); ?></div></button>
                  </div>
                  <div class="small-buttons">
                    <button id="newTree" class="globalButton"><div><img src="<?php echo editor_url("png/main_buttons/subject.png");?>" alt=""><?php sLang("edt_subject"); ?></div></button>
                    <button id="toggleDraftScreen" class="subjectButton"><div><img src="<?php echo editor_url("png/main_buttons/draft.png");?>" alt=""><?php sLang("edt_note_pad"); ?></div></button>
                  </div>
                </div>
                <div class="buttonGroup" id="view">
                  <!-- View -->
                  <div class="big-buttons">
                    <button id="repositionGraph" class="subjectButton" title="<?php sLang('edt_arrange_title'); ?>">
                      <div><img src="<?php echo editor_url("png/main_buttons/arrange.png");?>" alt=""><?php sLang("edt_arrange"); ?></div>
                    </button>
                  </div>
                  <div class="small-buttons">
                    <button id="labelText" class="subjectButton statements">
                      <div><img src="<?php echo editor_url("png/main_buttons/intentions.png");?>" alt=""><?php sLang("edt_intentions"); ?></div>
                      <div><img src="<?php echo editor_url("png/main_buttons/sentences.png");?>" alt=""><?php sLang("edt_statements"); ?></div>
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
                <div id="headerConversation" class="header clickable collapseAll">
                  <h1><span class="masterclicktag">[+]</span> <img src="<?php echo editor_url("png/sidebar_headers/conversation.png");?>" alt=""><?php sLang('edt_conversation');?></h1>
                </div>
                <div id="characterSection" class="sidebarSection">
                  <div class="sub-header clickable">
                    <h2><span class="clicktag">[+]</span> <img src="<?php echo editor_url("png/sidebar_headers/intentions.png");?>" alt=""><?php sLang('edt_character');?></h2>
                  </div>
                  <div class="collapsable">
                    <select name="characterSelection" id="characterSelection" class="subjectButton"></select>
                    <div id="node-character-own-properties"></div>
                  </div>
                </div>
                <div id="allConversationsHTML">
                  <span id="conversationButtonSpan">
                    <button class="addConversation" data-type="playerText" title="<?php sLang('edt_player');?>"><img src="<?php echo editor_url("png/conversation/conversation_add_player.png");?>" alt=""></button>
                    <button class="addConversation" data-type="computerText" title="<?php sLang('edt_computer');?>"><img src="<?php echo editor_url("png/conversation/conversation_add_computer.png");?>" alt=""></button>
                    <button class="addConversation" data-type="situationText" title="<?php sLang('edt_situation');?>"><img src="<?php echo editor_url("png/conversation/conversation_add_situation.png");?>" alt=""></button>
                  </span>
                  <div id="conversationDiv"></div>
                </div>
                <div id="allPreconditionsHTML" class="sidebarSection withMarginTop">
                  <div class="sub-header clickable">
                    <h2 title="<?php sLang('edt_preconditions_title');?>"><span class="clicktag">[+]</span> <img src="<?php echo editor_url("png/sidebar_headers/preconditions.png");?>" alt=""><?php sLang('edt_preconditions');?></h2>
                  </div>
                  <div id="preconditionsDiv" class="collapsable"></div>
                </div>
                <div id="allEffectHTML" class="sidebarSection">
                  <div class="sub-header clickable">
                    <h2 title="<?php sLang('edt_effects_title');?>"><span class="clicktag">[+]</span> <img src="<?php echo editor_url("png/sidebar_headers/effects.png");?>" alt=""><?php sLang('edt_effects');?></h2>
                  </div>
                  <div class="collapsable">
                    <div id="parameterWrapper">
                      <?php sLang('edt_parameters');?>
                      <div id="effectParameterDiv"></div>
                      <button id="addParameterEffect" title="<?php sLang('edt_add');?>"><img src="<?php echo editor_url("png/others/plus.png");?>" alt=""></button>
                    </div>
                  </div>
                </div>
                <div id="allIntentionsHTML" class="sidebarSection">
                  <div class="sub-header clickable">
                    <h2><span class="clicktag">[+]</span> <img src="<?php echo editor_url("png/sidebar_headers/intentions.png");?>" alt=""><?php sLang('edt_intentions');?></h2>
                  </div>
                  <div class="collapsable">
                    <div id="intentions"></div>
                    <button id="addIntention" title="<?php sLang('edt_add');?>"><img src="<?php echo editor_url("png/others/plus.png");?>" alt="+"></button>
                  </div>
                </div>
                <div id="propertiesSection" class="sidebarSection">
                  <div class="sub-header clickable">
                    <h2><span class="clicktag">[+]</span> <img src="<?php echo editor_url("png/sidebar_headers/intentions.png");?>" alt=""><?php sLang('edt_properties');?></h2>
                  </div>
                  <div class="collapsable">
                    <div id="node-properties"></div>
                  </div>
                </div>
                <div id="mediaSelector" class="sidebarSection">
                  <div class="sub-header clickable">
                    <h2 title="<?php sLang('edt_custom_media');?>"><span class="clicktag">[+]</span> <img src="<?php echo editor_url("png/sidebar_headers/media.png");?>" alt=""><?php sLang('edt_media');?></h2>
                  </div>
                  <div class="collapsable">
                    <label for="imageOptions" class="mediaLabel"><?php sLang('edt_image');?>:</label>
                    <select name="Image" id="imageOptions" class="mediaSelect"></select><br/>
                    <label for="videoOptions" class="mediaLabel"><?php sLang('edt_video');?>:</label>
                    <select name="Video" id="videoOptions" class="mediaSelect"></select><br/>
                    <label for="audioOptions" class="mediaLabel"><?php sLang('edt_audio');?>:</label>
                    <select name="Audio" id="audioOptions" class="mediaSelect"></select>
                  </div>
                </div>
                <div id="commentHTML" class="sidebarSection">
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

                <div class="sidebarSection" id="calculateScore">
                  <div class="sub-header clickable">
                    <h2 title="<?php sLang('edt_score_title');?>"><span class="clicktag">[+]</span> <img src="<?php echo editor_url("png/sidebar_headers/calculator.png");?>" alt=""><?php sLang('edt_score_header');?></h2>
                  </div>
                  <div class="collapsable">
                    <input type="button" id="scoreParents" value="<?php sLang('edt_score_header');?>"/>
                    <div id="scores"></div>
                  </div>
                </div>
              </div>
              <div id="bestPath" class="hidden">
                <table id="bestPathTable"></table>
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
  <div id="mediaScreen" style="display: none"></div>
  <div id="feedbackScreen" style="display: none"></div>
  <div id="returnScreen" style="display: none"><p><?php sLang('edt_return_dialog');?></p></div>
  <div id="toGameScreen" style="display: none"><p><?php sLang('edt_game_dialog');?></p></div>
  <div id="toGameError" style="display: none"><p><?php sLang('edt_validate_dialog');?></p></div>
  <div id="dragBox" style="display: none"></div>
  <div class="lengthTest"></div>
</body>
</html>
