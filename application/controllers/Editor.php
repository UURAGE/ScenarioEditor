<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');
/* © Utrecht University and DialogueTrainer */

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
