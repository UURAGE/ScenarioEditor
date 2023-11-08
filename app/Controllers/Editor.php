<?php
/* © Utrecht University and DialogueTrainer */

namespace App\Controllers;

class Editor extends \CodeIgniter\Controller
{
    public function __construct()
    {
        $session = session();
        $languageCode = $session->get('languageCode');
        if (is_null($languageCode))
        {
            $request = \Config\Services::request();
            $languageCode = $request->negotiate('language', config(\Config\Language::class)->languageCodes);
            $request->setLocale($languageCode);
            $session->set('languageCode', $languageCode);
        }
        \Config\Services::language()->setLocale($languageCode);
    }

    public function index()
    {
        echo view('/editorView');
    }

    public function GetLocales()
    {
        $languages = (array)$this->request->getVar("lng");
        $namespaces = (array)$this->request->getVar("ns");
        $locales = [];
        foreach ($languages as $language)
        {
            foreach ($namespaces as $namespace)
            {
                $localeResourcePath = editor_path("locales/" . basename($language) . "/" . basename($namespace) . ".json");
                if (file_exists($localeResourcePath))
                {
                    $locales[$language][$namespace] = json_decode(file_get_contents($localeResourcePath), TRUE);
                }
            }
        }

        $response = \Config\Services::response();
        $response->setCache(array('max-age' => ENVIRONMENT === 'production' ? 7200 : 0));
        $response->setContentType('application/json');
        echo json_encode($locales, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_LINE_TERMINATORS);
    }
}
