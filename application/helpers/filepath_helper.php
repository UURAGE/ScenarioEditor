<?php
if (!defined('BASEPATH'))
    exit('No direct script access allowed');

if (!function_exists('editor_path'))
{

    /**
     * Get the path to the editor folder, and possible subfolders.
     * @param string $string
     * @return string
     */
	function editor_path($string)
    {
        return FCPATH . "editor/" . $string;
    }
}

if(!function_exists('flag_path'))
{
    /**
    * Get the path to the flag of a corrsesponding language
    * @param string $language
    * @return string
    */
    function flag_path($language)
    {
        $flags = config_item("languageFlags");

        return game_path('images/flags/'.$flags[$language].".png");
    }
}
