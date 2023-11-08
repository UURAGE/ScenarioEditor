<?php

namespace Config;

use CodeIgniter\Config\BaseConfig;

class Language extends BaseConfig
{
    public array $languageCodes = [
        'en',
        'nl'
    ];

    public array $languageFlags = [
        'en' => 'gb',
        'nl' => 'nl'
    ];

    public array $namespaces = [
        "btn" => "button",
        "edt" => "Editor"
    ];
}
