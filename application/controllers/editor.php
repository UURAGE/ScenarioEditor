<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');
/*
//This program has been developed by students from the bachelor Computer Science at Utrecht University 
//within the Software and Game project courses 2013-2015
//©Copyright Utrecht University (Department of Information and Computing Sciences) 
*/

/**
 * Editor page and functions.
 */
class Editor extends CI_Controller
{
    function __construct() 
    {
        parent::__construct();
    }
    
    public function index()
    {
        $this->load->view('/editorView');
    }
}
?>