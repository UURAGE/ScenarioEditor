<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');
/* © Utrecht University and DialogueTrainer */

/**
 * Controller for about page and functions.
 */
class Language extends CI_Controller
{
    function __construct()
    {
        parent::__construct();
    }

    public function changeLanguage($language)
    {
        $this->session->set_userdata("language", $language);

        redirect($_SERVER['HTTP_REFERER']);
    }
}
