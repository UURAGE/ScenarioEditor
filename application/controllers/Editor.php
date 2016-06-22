<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');
/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

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