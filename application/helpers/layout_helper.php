<?php
if ( ! defined('BASEPATH'))
    exit('No direct script access allowed');

if (!function_exists('sIcon'))
{
  /**
    * Outputs SVG Icon HTML element
    * @param string $icon
    * @param string $class
    * @return string
    */
    function sIcon($icon, $class = null)
    {
        return '<svg xmlns="http://www.w3.org/2000/svg" class="' . $class . '"><use xlink:href="#' . $icon . '"></use></svg>';
    }
}
