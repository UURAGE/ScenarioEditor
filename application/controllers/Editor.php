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

    public function GetLocales()
    {
        $languages = (array)$this->input->get("lng");
        $namespaces = (array)$this->input->get("ns");
        $locales = [];
        foreach ($languages as $language)
        {
            foreach ($namespaces as $namespace)
            {
                $localeResourcePath = editor_path("locales/" . basename($language) . "/" . basename($namespace) . ".json");
                if (file_exists($localeResourcePath))
                {
                    $locales[$language][$namespace] = json_decode(file_get_contents($localeResourcePath), true);
                }
            }
        }

        $this->output->set_cache_header($_SERVER['REQUEST_TIME'], time() + (ENVIRONMENT === 'production' ? 7200 : 0));
        return $this->output->set_content_type('application/json')->set_status_header(200)->set_output(json_encode($locales));
    }
}
