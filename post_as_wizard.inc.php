<?php

class post_as_wizard {
	static $_o = null;
	// static $version_plugin = 0.1;
	// static $version_db = 0.1;
	static $plugin_name = 'Post As Wizard';
	static $plugin_slug = 'post_as_wizard';

	static $paw_vars = array(); // Add wil

	private $menu_slug = 'paw';
	public 	$gettext_learn = True;
	private $config = array();

	private $default__posttypes = array();
	private $__posttypes = array();

	public function __construct() {
		$this->config_load();
	}

	public function post_as_wizard_plugins_loaded() {
		$this->run();
	}

	public function run() {
//		$user = wp_get_current_user();
//		print_r($user->roles);
		$this->set_languages();
		$this->init_post();
	}

	private function set_languages() {
	 	$plugin_dir = plugin_dir_path( __FILE__ );
		$plugin_path = '/' . dirname(plugin_basename( __FILE__ ));
		$plugin_textdomain = 'paw';
		load_plugin_textdomain( $plugin_textdomain, false, $plugin_path.'/languages/' );
	}
	
    public function display_errors() {
            error_reporting(E_ALL & ~E_NOTICE);
            ini_set("display_errors", 1);
    }

	public function __($text) {
		$text =  __($text, 'paw');
		if ($this->gettext_learn and $text == $text) {
			$this->gettext_append($text);
		}
		return $text;
	}

	private function gettext_append($text) {
		$data = 'msgid "%s"';
		$data = sprintf($data, str_replace('"', '\"', $text));
		$file = dirname( __FILE__ ).'/languages/source.po';
		$content = file_get_contents($file);
		if (preg_match("/".$data."/", $content))
			return False;
		$data .= "\n".'msgstr ""'."\n\n";
		file_put_contents($file, $data, FILE_APPEND);
		return True;
	}

	/*
		CONFIG
	*/
	public function config_load() {
		$current_blog_id = get_current_blog_id();	
                $this->config = json_decode(get_option("paw_config"), True);
		if (!$this->config)
			$this->config = array();
	}

	public function config_set($key, $value) {
		$this->config_load();
		if (!array_key_exists($key, $this->config) or (array_key_exists($key, $this->config) and $this->config[$key] != $value)) {
			$this->config[$key] = $value;
			$current_blog_id = get_current_blog_id();	
		        update_option("paw_config", json_encode($this->config));	
		} 
	}

	public function config_get($key) {
		if (array_key_exists($key, $this->config))
			return $this->config[$key];
		return NULL;
	}

	/* 
		START
	*/
	public function set_posttypes($posttypes) {
		$this->__posttypes = $posttypes;
	}

	public function init_post() {
		// Get settings
		$this->__posttypes = array_unique(array_merge($this->default__posttypes, $this->get_posts_from_setting_page()), SORT_REGULAR);
		// wp_die(count($this->__posttypes));

		if ( count($this->__posttypes) > 0 ) :
			// Action after init 
			add_action('admin_notices', 		array($this, 'paw_edit_form_top'));
			add_action('add_meta_boxes', 		array($this, 'load'));
			add_action('save_post', 			array($this, 'save_post'));
			//Then make sure our vars will be added in the footer
			add_action('admin_notices', 			array($this, 'add_options_to_script')); // ADD Wil // Not working see in first call 
		else:
			print('
				<div class="notice notice-warning is-dismissible">
					<p><b>WAFF Post As Wizard :</b> Please choose post-types to activate wizard in Settings > Post as Wizard </p>
				</div>'
			);
		endif;
	}

	public function paw_display_status() {
		print '<script type="text/javascript">
/*<![CDATA[*/
var paw_required_active = '.(( current_user_can('administrator') ||current_user_can('fifam_admin') || current_user_can('fifam_editor' ) )?0:1).';
var paw_start_active = '.$this->is_active.';
var paw_current_tab = "'.$this->position_current.'";
var paw_hide_box_ids = ["access_group","revisionsdiv","submitdiv","tagsdiv-edition","pageparentdiv","sectiondiv","types-information-table","slugdiv","authordiv","commentsdiv","wpcf-post-relationship","cmplz_hide_banner_meta_box"]; /* paw_status removed, commentsdiv, cmplz_hide_banner_meta_box > added */
//]]>
</script>';
		print '<div id="paw_actions">';
		print '<div id="paw_action">';
		//print '<a id="paw_action_display_wizard" class="preview button">Wizard View</a>';
		print '<a id="" class="paw_action_display_wizard preview button">'.__('Wizard View', 'paw').'</a>';				
		print '</div>';
		print '<div id="paw_action">';
		//print '<a id="paw_action_display_normal" class="preview button">Normal View</a>';
		print '<a id="" class="paw_action_display_normal preview button">'.__('Normal View', 'paw').'</a>';
		print '</div>';
		print '<div id="paw_action">';
		if ($this->position_max && $this->position_total && $this->position_max >= $this->position_total - 1) {
			$submit_button = __('Finish submission','paw');
			$rel = 'publish';
		} else {
			$submit_button = __('Save and continue','paw');
			$rel = 'save-post|publish';
		}
		print '<input class="button button-primary" id="paw_save_post" value="'.$submit_button.'" type="button" rel="'.$rel.'">';
		print '</div>';
		print '<div class="clear"></div>';
		if ( current_user_can('administrator') || current_user_can('fifam_admin') || current_user_can('fifam_editor' ) ) {
			print '<div class="paw_action_required_fields_disabled">';
			print '<div class="toggle-pill-color">';
			print '<input type="checkbox" id="paw_required_fields_disabled" class="paw_required_fields_disabled"><div></div><label for="paw_required_fields_disabled">'.__('Required fields are disabled', 'paw').'</label>';
			print '</div>';
			print '</div>';
		}
		print '</div>';
		print '<input type="hidden" class="small_input" id="paw_status_current" name="paw_status[current]" value="'.$this->position_current.'">';
		print '<input type="hidden" class="small_input" id="paw_status_max" name="paw_status[max]" value="'.$this->position_max.'">';
		print '<input type="hidden" class="small_input" id="paw_status_total" name="paw_status[total]" value="'.$this->position_total.'">';
		// ADD WIL 
		if(isset($_REQUEST['post_type']) && $_REQUEST['post_type'] != '' )
			print '<input type="hidden" class="" id="post_type" name="post_type" value="'.sanitize_key($_REQUEST['post_type']).'">';
	}
	
	// Save post 
	public function save_post($post_id) {
		$screen = get_current_screen();
		if (in_array($screen->post_type, $this->__posttypes)) {
			if ( wp_is_post_revision( $post_id ) )
				return;
			if (array_key_exists('paw_status', $_REQUEST) and count($_REQUEST['paw_status'])) {
				if ($_REQUEST['paw_status']['current'] == '')
					$_REQUEST['paw_status']['current'] = 0;
				if ($_REQUEST['paw_status']['max'] == '')
					$_REQUEST['paw_status']['max'] = 0;
				$json = json_encode($_REQUEST['paw_status']);
				update_post_meta( $post_id, 'paw_status', $json );
			}
		}
	}

	// Loader 
	public function paw_edit_form_top() { // Depreciated WIL > Conflict with gravity form 2.5 / Removed $post_type to var function definition
		global $pagenow;
		$screen = get_current_screen();
		if (in_array($screen->post_type, $this->__posttypes) && ( $pagenow == 'post.php' || $pagenow == 'post-new.php' ) )
			echo '<div id="paw_loader" style="width: 104%; height: 100%; display:block; position: fixed !important; background-color: #f1f1f1 !important; opacity: 0.8; z-index: 9999; top: 0; left: -20px; "><h1 style="text-align: center; margin-top: 22%; color:#030303;"><span class="dashicons-before dashicons-clock"></span> Loading...</h1></div>';
	}

	// Load 
	public function load() {
		$screen = get_current_screen();
		if (in_array($screen->post_type, $this->__posttypes)) {
			global $post;
			$post_id = $post->ID;
			$this->position_current = 0;
			$this->position_max = 0;
			$this->position_total = '';
			$this->is_active = 1;
			if ($post_id) {
				$meta = get_post_meta( $post_id, 'paw_status', True );
				$data = json_decode($meta, True);
				$this->position_current = $data['current'];
				$this->position_max = $data['max'];
				$this->position_total = $data['total'];
				if ($this->position_current > $this->position_total) $this->position_current = $this->position_total;
				if ($this->position_max > $this->position_total) $this->position_max = $this->position_total;
				if ($this->position_max < $this->position_total) {
					if ($this->position_current == $this->position_max) {
						$this->position_max ++;
					}
					if ($this->position_current < $this->position_max)
						$this->position_current ++;
					if ($this->position_max == $this->position_total && $this->position_total == $this->position_current)
						$this->is_active = 0;
				}
			}
			if ($post->post_status == 'publish') $this->is_active = 0;
			add_meta_box('paw_status', __('Wizard Display','paw'), array($this, 'paw_display_status'), $screen->post_type, 'side', 'high');
			$current_uri = plugins_url( $this::$plugin_slug); 
			wp_enqueue_script('post_as_wizard_js', $current_uri.'/js/post_as_wizard.js', array('jquery'), false, True); //, $this->version_plugin);
			// Pass vars to JS 
			self::$paw_vars['title'] 		= __('Wizard Display','paw');
			self::$paw_vars['current'] 		= $this->position_current;
			self::$paw_vars['max'] 			= $this->position_max;
			self::$paw_vars['total'] 		= $this->position_total;
			self::$paw_vars['is_active'] 	= $this->is_active;
			if ($this->position_max && $this->position_total && $this->position_max >= $this->position_total - 1) {
				self::$paw_vars['submit_button'] = __('Finish submission','paw');
				self::$paw_vars['rel'] = 'publish';
			} else {
				self::$paw_vars['submit_button'] = __('Save and continue','paw');
				self::$paw_vars['rel'] = 'save-post|publish';
			}
			self::$paw_vars['continue_button'] = __('Save and continue','paw');
			self::$paw_vars['publish_button'] = __('Finish submission','paw');
			self::$paw_vars['paw_action_display_wizard'] 	= __('Wizard View', 'paw');
			self::$paw_vars['paw_action_display_normal'] 	= __('Normal View', 'paw');
			wp_enqueue_style('post_as_wizard_css', $current_uri.'/css/post_as_wizard.css');
		}
	}

	// Footer localize script 
	public function add_options_to_script(){
		$screen = get_current_screen();
		if (in_array($screen->post_type, $this->__posttypes))
			//If there is data to add, add it
			if(!empty(self::$paw_vars))
					wp_localize_script( 'post_as_wizard_js', 'post_as_wizard_vars', self::$paw_vars);   
	}

	/*
	* Settings
	*/ 
	public function add_setting_page( $settings_pages ) {
		$settings_pages[] = [
			'menu_title' => __( 'Post as wizard', 'wa-rsfp' ),
			'id'         => 'post-as-wizard',
			'parent'     => 'options-general.php',
			'class'      => 'custom_css',
			'style'      => 'no-boxes',
			// 'message'    => __( 'Custom message', 'wa-rsfp' ), // Saved custom message
			'customizer' => true,
			'icon_url'   => 'dashicons-admin-generic',
		];
	
		return $settings_pages;
	}

	public function add_custom_fields_to_setting_page( $meta_boxes ) {
		$prefix = 'wapaw_';
	
		$meta_boxes[] = [
			'id'             => 'post-as-wizard-fields',
			'settings_pages' => ['post-as-wizard'],
			'fields'         => [
				[
					'name'            => __( 'Allowed post type.s', 'wa-paw' ),
					'id'              => $prefix . 'allowed_post',
					'type'            => 'checkbox_list',
					'inline'          => true,
					'select_all_none' => true,
					'options'         => $this->posts_options_callback(),
				],
			],
		];
	
		return $meta_boxes;
	}
	
	public function posts_options_callback() {
		return get_post_types();
	}

	public function get_posts_from_setting_page() {
		return rwmb_meta( 'wapaw_allowed_post', [ 'object_type' => 'setting' ], 'post-as-wizard' );
	}

	
}