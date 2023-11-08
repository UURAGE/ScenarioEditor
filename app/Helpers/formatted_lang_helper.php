<?php

if (!function_exists('tLang'))
{
    function tLang($line)
    {
        $map = config(\Config\Language::class)->namespaces;
        $lineParts = explode('_', $line, 2);
        return $map[$lineParts[0]] . '.' . $line;
    }
}

if (!function_exists('sLang'))
{
    //to save some typing when formatting isnt necessary
    function sLang(string $line, bool $echo = true): string
    {
        $line = lang(tLang($line));

        if ($echo) echo $line;

        return $line;
    }
}

if (!function_exists('fLang'))
{
    function fLang(string $line, array $inserts = array(), bool $echo = true): string
    {
        $line = lang(tLang($line));

        if (count($inserts) > 0) $line = vsprintf($line, $inserts);

        if ($echo) echo $line;

        return $line;
    }
}
