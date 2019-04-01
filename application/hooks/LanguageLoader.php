<?php  if ( ! defined('BASEPATH')) exit('No direct script access allowed');
/* © Utrecht University and DialogueTrainer */

/**
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

        if (!$language)
        {
            $language = $this->getHTTPLanguage() ?? config_item('language');
            $this->CI->session->set_userdata('language', $language);
        }

        $this->CI->lang->load('Editor', $language);
        $this->CI->lang->load('button', $language);
    }

    function getHTTPLanguage()
    {
        $httpAcceptLanguage = $_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? NULL;
        if ($httpAcceptLanguage === NULL) return NULL;

        $availableLanguages = config_item('languageNames');
        $browserLanguages = explode(",", $httpAcceptLanguage);

        $languages = array();

        foreach ($browserLanguages as $browserLanguage)
        {
            $lang = explode(";", $browserLanguage);

            if (sizeof($lang) == 2)
            {
                // This contains a priority value in the format "q=<priority>"
                $lang[1] = floatval(substr($lang[1], 2));
            }
            else
            {
                // The first language entry has no priority
                $lang[1] = 1;
            }

            $languages[] = $lang;
        }

        $acceptedLang = null;
        $maxPriority = -1;

        foreach ($languages as $language)
        {
            $currentLang = $language[0];
            $currentPriority = $language[1];

            if (array_key_exists($currentLang, $availableLanguages) && $currentPriority > $maxPriority)
            {
                $acceptedLang = $availableLanguages[$currentLang];
                $maxPriority = $currentPriority;
            }
        }

        return $acceptedLang;
    }
}
