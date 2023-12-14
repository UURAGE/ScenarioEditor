<?php
// © DialogueTrainer

if (!function_exists('editor_path'))
{
    /**
     * Get the path to the editor folder, and possible subfolders.
     * @param string $string
     * @return string
     */
	function editor_path($string)
    {
        return FCPATH . "editor/" . $string;
    }
}
