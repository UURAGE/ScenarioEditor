<?php
// © DialogueTrainer

if (!function_exists('editor_url'))
{
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

if (!function_exists('flag_url'))
{
    /**
    * Get the url to the flag of a corresponding language
    * @param string $language
    * @return string
    */
    function flag_url($language)
    {
        $flags = config(Config\Language::class)->languageFlags;

        return editor_url('png/flags/'.$flags[$language].".png");
    }
}
