<?php

/*
Plugin Name: WAFF Post As Wizard 
Author: Justin Petermann, Wilhem Arnoldy
Version: 2.0
Tags: post, wizard, metaboxes
Requires at least: 4 
Tested up to: 6.4.1
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html
Description: View post metaboxes as Wizard steps, handle required fields regarding roles, now compatible with gutenberg
*/

if ( !defined( 'ABSPATH' ) ) {
    exit;
}

if(!defined("IS_ADMIN"))
	define("IS_ADMIN",  is_admin());

if (IS_ADMIN) {
	function run_post_as_wizard() {
		$current_path = dirname(__FILE__);
		require_once($current_path.'/post_as_wizard.inc.php');

		$paw = new post_as_wizard();
		add_action('admin_menu', array($paw, 'post_as_wizard_plugins_loaded'));
	}

	run_post_as_wizard();
}