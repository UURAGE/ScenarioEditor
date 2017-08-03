<?php  if ( ! defined('BASEPATH')) exit('No direct script access allowed');
/* © Utrecht University and DialogueTrainer */

class SettingFixer
{
    function fix()
    {
        $this->fixUwAmpSessionSavePath();
        $this->setDefaultTimeZone();
    }

    /*
     * Fixes an incorrect session setting present by default in UwAmp
     */
    function fixUwAmpSessionSavePath()
    {
        $save_path = ini_get('session.save_path');
        $bad_prefix = 'N;';
        $bad_prefix_length = strlen($bad_prefix);
        if (substr($save_path, 0, $bad_prefix_length) == $bad_prefix)
        {
            ini_set('session.save_path', substr($save_path, $bad_prefix_length));
        }
    }

    /*
     * Sets the default time zone when used with PHP 5 to avoid the
     * "time zone setting missing" warning.
     * (PHP on Debian/Ubuntu guesses from the system settings.)
     */
    function setDefaultTimeZone()
    {
        if (version_compare(PHP_VERSION, '7.0.0', '<') &&
            @date_default_timezone_get() == 'UTC')
        {
            date_default_timezone_set('UTC');
        }
    }
}
