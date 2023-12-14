<?php
// © DialogueTrainer

namespace App\Controllers;

class Language extends \CodeIgniter\Controller
{
    public function changeLanguage($languageCode)
    {
        if (in_array($languageCode, config(\Config\Language::class)->languageCodes))
        {
            session()->set('languageCode', $languageCode);
        }

        return \Config\Services::redirectresponse()->to($_SERVER['HTTP_REFERER']);
    }
}
