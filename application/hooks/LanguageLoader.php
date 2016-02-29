<?php  if ( ! defined('BASEPATH')) exit('No direct script access allowed');
/*
//This program has been developed by students from the bachelor Computer Science at Utrecht University 
//within the Software and Game project courses 2013-2015
//©Copyright Utrecht University (Department of Information and Computing Sciences) 
*/

/*
 * This class is used to emulate auto loading of language files, normal autoloading can not be based on session data 
 */
class LanguageLoader
{   
    function load()
    {
        $this->CI =&get_instance();

        if (!isset($this->CI->session))
        {
            $this->CI->load->library('session');
        }

        $language = $this->CI->session->userdata('language');
        $availableLanguages = config_item('browserCodes');

        // Strict equality to prevent nasty behaviour
        if ($language === FALSE)
        {            
            $browserLang = explode(",",$_SERVER['HTTP_ACCEPT_LANGUAGE']);

            $languages = array();

            for ($i = 0; $i < sizeof($browserLang); $i++)
            {
                $lang = explode(";", $browserLang[$i]);

                if (sizeof($lang) == 2)
                {
                    // This contains a priority value in the format "q=<priority>"
                    $lang[1] = substr($lang[1], 2);
                }
                else
                {
                    // The first language entry has no priority
                    $lang[1] = "1";
                }

                $languages[$i] = $lang;
            }

            $maxPriority = -1;
            // If no accepted language can be found, the default configured language will be used
            $acceptedLang = config_item('language');

            for ($i = 0; $i < sizeof($languages); $i++)
            {
                $currentLang = $languages[$i][0];
                $currentPriority = $languages[$i][1];
                $tempAccepted = "";
                $languageAvailable = array_key_exists($currentLang, $availableLanguages);

                if ($languageAvailable && $availableLanguages[$currentLang] !== NULL)
                {
                    $tempAccepted = $availableLanguages[$currentLang];
                }

                if ($currentPriority > $maxPriority && $tempAccepted !== "")
                {
                    $acceptedLang = $tempAccepted;
                    $maxPriority = $currentPriority;
                }
            }

            $language = $acceptedLang;
            $this->CI->session->set_userdata('language', $language);
        }

        $this->CI->lang->load('editor', $language);
        $this->CI->lang->load('button', $language);
    }
}
