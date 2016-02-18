<?php  if ( ! defined('BASEPATH')) exit('No direct script access allowed');
/*
//This program has been developed by students from the bachelor Computer Science at Utrecht University 
//within the Software and Game project courses 2013-2015
//©Copyright Utrecht University (Department of Information and Computing Sciences) 
*/

/**
*this class is used to emulate auto loading of language files, normal autoloading can not be based on session data 
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

        if($language === FALSE)//strict equality to prevent nasty behaviour
        {            
            $language = config_item('language');
            $this->CI->session->set_userdata('language', $language);
        }

        $this->CI->lang->load('editor', $language);
        $this->CI->lang->load('button', $language);
    }
}
