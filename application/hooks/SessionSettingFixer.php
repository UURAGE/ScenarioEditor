<?php  if ( ! defined('BASEPATH')) exit('No direct script access allowed');
/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

/*
 * Fixes an incorrect session setting present by default in UwAmp 
 */
class SessionSettingFixer
{
    function fix()
    {
        $save_path = ini_get('session.save_path');
        $bad_prefix = 'N;';
        $bad_prefix_length = strlen($bad_prefix);
        if (substr($save_path, 0, $bad_prefix_length) == $bad_prefix)
        {
            ini_set('session.save_path', substr($save_path, $bad_prefix_length));
        }
    }
}
