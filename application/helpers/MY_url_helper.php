<?php if (!defined('BASEPATH')) exit('No direct script access allowed');
// an extension of the original url helper

if (!function_exists('root_url')) {

  /**
   * Root of website, needs to be changed if folder structure changes.
   * @param type $string
   * @return type
   */
	function root_url($string='')
    {
       return str_replace("", "", base_url()) . $string;
    }
}

if (!function_exists('editor_url')) {

  /**
   * Gives directory where editor resources are.
   * @param string $string
   * @return string
   */
	function editor_url($string='')
    {
       return base_url() . "editor/" . $string;
    }
}

if(!function_exists('flag_url')) {
    /**
    * Get the url to the flag of a corresponding language
    * @param string $language
    * @return string
    */
    function flag_url($language)
    {
        $flags = config_item("languageFlags");

        return editor_url('png/flags/'.$flags[$language].".png");
    }
}
