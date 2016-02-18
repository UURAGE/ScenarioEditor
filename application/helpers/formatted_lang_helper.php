<?php  if ( ! defined('BASEPATH')) exit('No direct script access allowed');
/**
 * sLang
 *
 * fetches the right string from an identifier
 *
 * @access  public
 * @param   string  the language line
 * @return  string
 */
if(!function_exists('sLang'))
{   
    //to save some typing when formatting isnt necessary
    function sLang($line, $echo=true)
    {
        $CI =& get_instance();
        $line = $CI->lang->line($line);

        if($echo)
            echo $line;

        return $line;
    }
}

/**
 * fLang
 *
 * fetches the right string from an identifier and inserts other strings when apllicable
 *
 * @access  public
 * @param   string  the language line
 * @return  string
 */
if ( ! function_exists('fLang'))
{
    function fLang($line, $inserts = array(), $echo=true)
    {
        $CI =& get_instance();
        $line = $CI->lang->line($line);

        if(count($inserts > 0))
            $line = vsprintf($line, $inserts);

        if($echo)
            echo $line;

        return $line;
    }
}

// ------------------------------------------------------------------------
/* End of file language_helper.php */
/* Location: ./system/helpers/language_helper.php */