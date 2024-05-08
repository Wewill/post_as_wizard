var tb_unload_count = 1;
var save_whatever = 0;
let is_block_editor = jQuery('body').hasClass('block-editor-page'); // https://developer.wordpress.org/reference/classes/wp_screen/is_block_editor/
let editorLoaded = false;
let blockLoaded = false;

console.info(is_block_editor, wp.data);

// Main function 
jQuery(document).ready(function($) {
	// $('#wpcontent div#paw_loader').css('display', 'none');

	var paw_elements = [];

	// Block editor init functions 
    if ( is_block_editor && wp.data !== undefined ) {
        // REACT functions 
        // Subscribing to a Save Operation from gutenberg 
        // https://wordpress.stackexchange.com/questions/362975/admin-notification-after-save-post-when-ajax-saving-in-gutenberg
        // https://github.com/WordPress/gutenberg/issues/17632
        // https://github.com/WordPress/gutenberg/issues/17632#issuecomment-583772895
        const {
            isSavingPost,
            savePost
        } = wp.data.select('core/editor'); //https://developer.wordpress.org/block-editor/reference-guides/data/data-core-editor/
        var checked = true; // Start in a checked state.
        wp.data.subscribe(() => {
            if (isSavingPost()) {
                checked = false;
            } else {
                if (!checked) {
                    // Adding a log to understand when this runs.
                    let currentDate = new Date();
                    let time = currentDate.getHours() + ":" + currentDate.getMinutes() + ":" + currentDate.getSeconds();
                    console.log(`${time} PAW:: Post is done saving via isSavingPost`);
                    checked = true;
                    //                console.log('PAW : subscribe : ', paw_current_tab);
                    if (paw_current_tab == '') {
                        paw_current_tab = 0;
                        $('#paw_status_current').val(paw_current_tab);
                    }
                    paw_current_tab = parseInt(paw_current_tab) + 1;
                    editor_change_paw(paw_current_tab);
                }
            }
        });
        // Subscribing to editor loading from gutenberg 
        const {
            select,
            subscribe
        } = wp.data;
        const closeListener = subscribe(() => {
            const isReady = select('core/editor').__unstableIsEditorReady();
            if (!isReady) {
                // Editor not ready.
                return;
            }
            // Close the listener as soon as we know we are ready to avoid an infinite loop.
            closeListener();
            editorLoaded = true;
            // Your code is placed after this comment, once the editor is ready.
            console.log("PAW:: Block editor:: Editor loaded");
        });
    }

	// HTML/PHP default functions 
	function launch_paw() {
		console.log("paw_required_active::", paw_required_active)
		// Hide loader 
		$('#wpcontent div#paw_loader').css('display', 'none');
		// Classic editor 
		if (!is_block_editor) $('#postdivrich').css('display', 'none');
		// Blocks editor 
		// if (is_block_editor) $('.edit-post-visual-editor').css('display', 'none');
		if (is_block_editor) {
			$('.block-editor-block-list__layout').css('display', 'none'); // Hide content but not title
			$('.editor-post-title').css('max-width', '100%'); // Set title full
		}
		//
		$('.paw_action_display_wizard').css('display', 'none');
		$('.paw_action_required_fields_disabled').css('display', 'none');
		if (! paw_required_active) {
			$('.paw_required_fields_disabled').prop('checked', true);
			$('.paw_required_fields_disabled').change(required_fields_disabled_changed);
		}
		$('.paw_action_display_normal').css('display', 'block');
		$('#paw_save_post').css('display', 'block');
		$('#paw_actions p.submit').css('display', 'block');
		//		$('#post-body').removeClass('columns-2');
		//		$('#post-body').addClass('columns-1');
		paw_elements = [];
		$('#postbox-container-2 .postbox').each(function(idx, element) {
			element = $(element);
			var id = element.attr('id');
			if (id.substr(0, 10) == 'wpcf-group' && element.hasClass('hide-if-js')) {
				element.removeClass('hide-if-js');
			}
			if (element.hasClass('hide-if-js') || element.hasClass('paw_hidden_box')) return;
			//			element.data('title', $(element.find('h2 > span')[0]).text());
			element.data('title', $(element.find('h2.hndle')[0]).text());
			paw_elements.push(element);
		});
	}

	function active_paw(position) {
		//justin        console.log('PAW : active_paw', position);
		reset_save_whatever();
		$('.paw_action_required_fields_disabled').css('display', 'block');
		if (typeof(position) == 'undefined') position = 0;
		var position_tmp = $('#paw_status_max').val();
		if (position_tmp != '') position = position_tmp;
		var container = $('<div id="paw_titles"><ul></ul></div>');
		// Classic editor 
		if (!is_block_editor) container.insertBefore('div#poststuff');
		// Blocks editor 
		if (is_block_editor) container.insertBefore('.edit-post-visual-editor');
		var container_ul = container.find('ul');
		var has_active = false;
		var status_total = paw_elements.length;
		if (position > status_total) position = status_total;
		var status_max = $('#paw_status_max').val();
		var status_max_inited = true;
		if (status_max == '') {
			status_max = 0;
			status_max_inited = false;
		}
		if (status_total == position) position--;
		$.each(paw_elements, function(idx, element) {
			//            console.log("active_paw:", element);
			if (element.attr('id') == "paw_status" && is_block_editor) return; // Do not hide paw 
			var title = element.data('title');
			var title_li = $('<li id="paw_title_for_' + element.attr('id') + '">' + title + '</li>');
			if (idx <= status_max) {
				title_li.addClass('paw_passed');
				title_li.click(function() {
					change_paw(idx);
				});
			}
			container_ul.append(title_li);
			if (idx != position) {
				element.addClass('paw_hidden');
				element.addClass('hide-if-js');
				// Toolset forms - disabled
				element.find('.js-wpt-validate').each(function(idx, element2) {
					element2 = $(element2);
					element2.removeClass('js-wpt-validate');
					element2.addClass('js-wpt-validate-disabled');
				});
				//Meta io forms - disabled 
				element.find('.rwmb-field.required').each(function(idx, element2) {
					element2 = $(element2);
					element2.removeClass('required');
					element2.addClass('required-disabled');
					element2.find('input').removeAttr('required');
					element2.find('input').attr('required-disable', true);
				});

			} else {
				title_li.addClass('paw_active');
				element.removeClass('hide-if-js');
				element.removeClass('closed');
				has_active = true;

				// Toolset forms
				if (paw_required_active) element.find('.js-wpt-validate-disabled').each(function(idx, element2) {
					element2 = $(element2);
					element2.removeClass('js-wpt-validate-disabled');
					element2.addClass('js-wpt-validate');
				});
				else element.find('.js-wpt-validate').each(function(idx, element2) {
					element2 = $(element2);
					element2.removeClass('js-wpt-validate');
					element2.addClass('js-wpt-validate-disabled');
				});
				// Meta io forms 
				if (paw_required_active) element.find('.rwmb-field.required-disabled').each(function(idx, element2) {
					element2 = $(element2);
					element2.removeClass('required-disabled');
					element2.addClass('required');
					element2.find('input').removeAttr('required-disable');
					element2.find('input').attr('required', true);
				});
				else element.find('.rwmb-field.required').each(function(idx, element2) {
					element2 = $(element2);
					element2.removeClass('required');
					element2.addClass('required-disabled');
					element2.find('input').removeAttr('required');
					element2.find('input').attr('required-disable', true);
				});	

			}
			if (!has_active) {
				title_li.addClass('paw_active');
				if (!status_max_inited && status_max < status_total) status_max += 1;
			}
		});
		//justin         console.log('PAW : position : ', position, ' // status_max : ', status_max, ' // status_total : ', status_total);
		$('#paw_status_current').val(position);
		$('#paw_status_max').val(status_max);
		$('#paw_status_total').val(status_total);
	}

	function change_paw(position) {
		$.each(paw_elements, function(idx, element) {
			var title_li = $('#paw_title_for_' + element.attr('id'));
			if (idx != position) {
				title_li.removeClass('paw_active');
				element.addClass('paw_hidden');
				element.addClass('hide-if-js');
				//Toolset forms - disabled 
				element.find('.js-wpt-validate').each(function(idx, element2) {
					element2 = $(element2);
					element2.removeClass('js-wpt-validate');
					element2.addClass('js-wpt-validate-disabled');
				});
				//Meta io forms - disabled 
				element.find('.rwmb-field.required').each(function(idx, element2) {
					element2 = $(element2);
					element2.removeClass('required');
					element2.addClass('required-disabled');
					element2.find('input').removeAttr('required');
					element2.find('input').attr('required-disable', true);
				});
				
			} else {
				element.removeClass('hide-if-js');
				element.removeClass('closed');
				element.removeClass('paw_hidden');
				has_active = true;
				if (paw_required_active) {
					//Toolset forms - active 
					element.find('.js-wpt-validate-disabled').each(function(idx, element2) {
						element2 = $(element2);
						element2.removeClass('js-wpt-validate-disabled');
						element2.addClass('js-wpt-validate');
					});
					//Meta io forms - active 
					element.find('.rwmb-field.required-disabled').each(function(idx, element2) {
						element2 = $(element2);
						element2.removeClass('required-disabled');
						element2.addClass('required');
						element2.find('input').removeAttr('required-disable');
						element2.find('input').attr('required', true);
					});
				}
			}
			if (idx <= position) {
				title_li.addClass('paw_active');
			}
		});
		$('#paw_status_current').val(position);
	}

	function editor_change_paw(position) {
		console.log('PAW : change_paw', position);
		var paw_status_total = $('#paw_status_total').val();
		if (paw_status_total == '') {
			paw_status_total = 9999;
		}
		if (isNaN(position)) console.error('Position == NaN');
		var status_max = $('#paw_status_max').val();
		if (status_max == '') {
			status_max = 0;
			$('#paw_status_max').val(status_max);
		}
		if (position && position > status_max) {
			status_max = position;
		}
		if (status_max >= paw_status_total) {
			status_max = paw_status_total - 1;
			$('#paw_status_max').val(status_max);
		}
		console.log('PAW : ', position, status_max, parseInt(paw_status_total))
		if (position >= paw_status_total) {
			position = paw_status_total - 1;
			console.log("PAW:: Je quitte ");
			if (is_block_editor) {
				reset_blockeditor_paw();
				disable_paw();
				visible_box_paw(paw_hide_box_ids);
			} else {
				disable_paw();
				visible_box_paw(paw_hide_box_ids);
			}
		} else {
			console.log("PAW:: Je reste ");
			console.log('PAW : ', position, status_max, parseInt(paw_status_total))
			$.each(paw_elements, function(idx, element) {
				var title_li = $('#paw_title_for_' + element.attr('id'));
				if (idx != position) {
					title_li.removeClass('paw_active');
					element.addClass('paw_hidden');
					element.addClass('hide-if-js');
					//Toolset forms - disabled 
					element.find('.js-wpt-validate').each(function(idx, element2) {
						element2 = $(element2);
						element2.removeClass('js-wpt-validate');
						element2.addClass('js-wpt-validate-disabled');
					});
					//Meta io forms - disabled 
					element.find('.rwmb-field.required').each(function(idx, element2) {
						element2 = $(element2);
						element2.removeClass('required');
						element2.addClass('required-disabled');
						element2.find('input').removeAttr('required');
						element2.find('input').attr('required-disable', true);
					});
					
				} else {
					element.removeClass('hide-if-js');
					element.removeClass('closed');
                    element.removeClass('paw_hidden');
                    has_active = true;
                    if (paw_required_active) {
						//Toolset forms - active 
						element.find('.js-wpt-validate-disabled').each(function(idx, element2) {
							element2 = $(element2);
							element2.removeClass('js-wpt-validate-disabled');
							element2.addClass('js-wpt-validate');
						});
						//Meta io forms - active 
						element.find('.rwmb-field.required-disabled').each(function(idx, element2) {
							element2 = $(element2);
							element2.removeClass('required-disabled');
							element2.addClass('required');
							element2.find('input').removeAttr('required-disable');
							element2.find('input').attr('required', true);
						});
					}
                }
				if (idx <= status_max) {
					title_li.addClass('paw_passed');
					title_li.click(function() {
						change_paw(idx);
					});
				}
				if (idx <= position) {
					title_li.addClass('paw_active');
				}
			});
			$('#paw_status_current').val(position);
			$('#paw_status_max').val(status_max);
			// Then, set continue or publish button and text 
			let label_continue = ((post_as_wizard_vars["continue_button"]) ? post_as_wizard_vars["continue_button"] : 'Continue');
			let label_publish = ((post_as_wizard_vars["publish_button"]) ? post_as_wizard_vars["publish_button"] : 'Finish');
			set_blockeditor_paw_buttons(status_max, parseInt(paw_status_total), status_max >= parseInt(paw_status_total - 1) ? label_publish : label_continue);
		}
	}

	function hide_box_paw($ids) {
		$.each($ids, function(idx, id) {
			var element = $("#" + id);
			if (element) element.addClass('paw_hidden_box');
		});
	}

	function visible_box_paw($ids) {
		$.each($ids, function(idx, id) {
			var element = $("#" + id);
			if (element) element.removeClass('paw_hidden_box');
		});
	}

	function disable_paw() {
		// Hide loader 
		$('#wpcontent div#paw_loader').css('display', 'none');
		//		$('#post-body').removeClass('columns-1');
		//		$('#post-body').addClass('columns-2');
		// Classic editor 
		if (!is_block_editor) $('#postdivrich').css('display', 'block');
		// Blocks editor 
		// if (is_block_editor) $('.edit-post-visual-editor').css('display', 'block');
		if (is_block_editor) {
			$('.block-editor-block-list__layout').css('display', 'block'); // Hide content but not title
			$('.editor-post-title').css('max-width', 'var(--go--max-width)'); // Set title full
		}
		//
		$('.paw_action_display_wizard').css('display', 'block');
		//$('.paw_action_required_fields_disabled').css('display', 'none');
		$('.paw_action_display_normal').css('display', 'none');
		$('#paw_save_post').css('display', 'none');
		$('#paw_titles').remove();
		$('#paw_actions p.submit').css('display', 'none');
		$('#postbox-container-2 .postbox').each(function(idx, element) {
			element = $(element);
			var id = element.attr('id');
			if (id.substr(0, 10) == 'wpcf-group' && element.hasClass('hide-if-js')) {
				element.removeClass('hide-if-js');
			}
			if (paw_required_active) {
				//Toolset forms - active 
				element.find('.js-wpt-validate-disabled').each(function(idx, element2) {
					element2 = $(element2);
					element2.removeClass('js-wpt-validate-disabled');
					element2.addClass('js-wpt-validate');
				});
				//Meta io forms - active 
				element.find('.rwmb-field.required-disabled').each(function(idx, element2) {
					element2 = $(element2);
					element2.removeClass('required-disabled');
					element2.addClass('required');
					element2.find('input').removeAttr('required-disable');
					element2.find('input').attr('required', true);
				});
			} else {
				// Toolset forms - disabled
				element.find('.js-wpt-validate').each(function(idx, element2) {
					element2 = $(element2);
					element2.removeClass('js-wpt-validate');
					element2.addClass('js-wpt-validate-disabled');
				});
				//Meta io forms - disabled 
				element.find('.rwmb-field.required').each(function(idx, element2) {
					element2 = $(element2);
					element2.removeClass('required');
					element2.addClass('required-disabled');
					element2.find('input').removeAttr('required');
					element2.find('input').attr('required-disable', true);
				});
			}
		});

		// Handle no wizard required fields 
		// If required fields admin
		if (! paw_required_active) {
			$('.paw_required_fields_disabled').prop('checked', true);
			$('.paw_required_fields_disabled').change(required_fields_disabled_changed);
		}

		$.each(paw_elements, function(idx, element) {
			element.removeClass('paw_hidden');
			element.removeClass('closed');
			element.removeClass('hide-if-js');
		});
		paw_elements = [];
	}

	function init_blockeditor_paw() {
		//editor-post-publish-button__button
		console.log("post_as_wizard_vars::", post_as_wizard_vars);
		// Hide paw status meta box for editor 
		$('.metabox-location-side #paw_status').hide();
		// Hide editor toolbar 
		$('.interface-interface-skeleton__sidebar').hide();
		// Hide all uneeded buttons temporary on header
		$('.edit-post-header__toolbar .edit-post-header-toolbar .components-button').hide();
		$('.edit-post-header__settings .components-button:not(.editor-post-save-draft):not(.editor-post-publish-button__button)').hide(); // Default Show draft / Save draft is not named at first load, then : 
		$('.edit-post-header__settings .components-button').first().addClass('editor-post-save-draft').show(); // Default Show draft
		$('.editor-post-publish-button__button').hide(); // Default Hide publish
		// Draft button 
		//$('.editor-post-save-draft').hide();
		// Publish button 
		//$('.editor-post-publish-button__button').hide();
		// Add Wizard title 
		if ($('.edit-post-header__toolbar .edit-post-header-toolbar #_paw_editor_title').length == 0) $('.edit-post-header__toolbar .edit-post-header-toolbar').append('<h3 id="_paw_editor_title" style="margin-right:30px;"><span class="dashicons-before dashicons-superhero-alt" style="color:silver;"></span> ' + ((post_as_wizard_vars["title"]) ? post_as_wizard_vars["title"] : 'Wizard') + '</h3>');
		// Add paw actions
		if ($('.edit-post-header__toolbar .edit-post-header-toolbar .paw_editor').length == 0) {
			$('.edit-post-header__toolbar .edit-post-header-toolbar').append('<a id="" class="paw_action_display_wizard paw_editor preview button --components-button is-secondary --d-none">' + ((post_as_wizard_vars["paw_action_display_wizard"]) ? post_as_wizard_vars["paw_action_display_wizard"] : 'Wizard view') + '</a>');
			$('.edit-post-header__toolbar .edit-post-header-toolbar').append('<a id="" class="paw_action_display_normal paw_editor preview button --components-button is-secondary --d-none">' + ((post_as_wizard_vars["paw_action_display_normal"]) ? post_as_wizard_vars["paw_action_display_normal"] : 'Normal view') + '</a>');
		}
		// Add Wizard button helper 
		if ($('.edit-post-header__settings #_paw_editor_helper').length == 0) $('.edit-post-header__settings').prepend('<h5 id="_paw_editor_helper" style="color:#3c434a;margin-right:5px;"></h5>');
		else $('.edit-post-header__settings #_paw_editor_helper').show();
		// Then, set continue or publish button and text 
		set_blockeditor_paw_buttons(post_as_wizard_vars["max"], post_as_wizard_vars["total"], post_as_wizard_vars["submit_button"]);
	}

	function init_paw_action_required() {
		// Add required for admin cb 
		if ($('.edit-post-header__settings .paw_action_required_fields_disabled').length == 0) $('.edit-post-header__settings').prepend('<div class="paw_action_required_fields_disabled"><label for="paw_required_fields_disabled"><input type="checkbox" class="paw_required_fields_disabled">Champs requis désactivés</label>');
		else $('.edit-post-header__settings .paw_action_required_fields_disabled').show();
	}

	function reset_blockeditor_paw() {
		//editor-post-publish-button__button
		// Hide toolbar 
		$('.interface-interface-skeleton__sidebar').show();
		// Hide all uneeded buttons temporary 
		$('.edit-post-header__toolbar .components-button').show();
		$('.edit-post-header__settings .components-button').show();
		// // Add Wizard title 
		// $('.edit-post-header__toolbar .edit-post-header-toolbar _paw_editor_title').remove();
		// // Add paw actions
		// $('.edit-post-header__settings .paw_action_display_wizard').remove();
		// $('.edit-post-header__settings .paw_action_display_normal').remove();
		// Hide Wizard helper 
		$('.edit-post-header__settings #_paw_editor_helper').hide();
		// Show 
		$('.editor-post-save-draft').show();
		$('.editor-post-publish-button__button').show();
		$('.editor-post-save-draft').removeClass("is-primary");
		$('.editor-post-save-draft').addClass("is-tertiary");
		// Labels 
		$('.editor-post-save-draft').html($('.editor-post-save-draft').attr('data-html'));
		$('.editor-post-publish-button__button').html($('.editor-post-publish-button__button').attr('data-html'));
	}

	function reset_paw_action_required() {
		// Hide required for admin cb 
		$('.edit-post-header__settings .paw_action_required_fields_disabled').hide();
	}

	function set_blockeditor_paw_buttons(max = 0, total = 0, label) {
		label = ((label) ? label : 'publish');
		if (typeof post_as_wizard_vars != "undefined")
			if (max != null && total != null && max >= total - 1) {
				// $('.editor-post-publish-button__button').attr('data-html', $('.editor-post-publish-button__button').html() );
				// $('.editor-post-publish-button__button').html(label); // This is not working 
				$('.edit-post-header__settings #_paw_editor_helper').html(label + ' :');
				$('.editor-post-save-draft').hide();
				$('.editor-post-publish-button__button').show()
			} else {
				// $('.editor-post-save-draft').attr('data-html', $('.editor-post-save-draft').html() );
				// $('.editor-post-save-draft').html(label);  // This is not working
				$('.edit-post-header__settings #_paw_editor_helper').html(label + ' :');
				$('.editor-post-save-draft').addClass("is-primary");
				$('.editor-post-save-draft').removeClass("is-tertiary");
				$('.editor-post-save-draft').show();
				$('.editor-post-publish-button__button').hide()
			}
	}

	// Execute paw if not block editor, once the dom is ready.
    console.log('PAW:: Execute ? ',  is_block_editor)
	if (!is_block_editor) {
		//alert( 'Dom is ready' );
		if (paw_start_active) {
			hide_box_paw(paw_hide_box_ids);
			launch_paw();
			active_paw(paw_current_tab);
		} else {
			disable_paw();
		}
		run_actions(); // Added W
	} else {
		let blockLoadedInterval = setInterval(function() {
			console.log("PAW:: Trying to load paw...", editorLoaded, $('.edit-post-visual-editor').length > 0, $('.editor-post-featured-image__toggle').length > 0, "@TODO How to know if posttype avec featured image needed ?");
			if (editorLoaded === true && $('.edit-post-visual-editor').length > 0 /*&& $('.editor-post-featured-image__toggle').length > 0*/) {
				blockLoaded = true;
			}
			if (blockLoaded) {
				console.info("PAW:: Blocks editor loaded, then load paw");
				clearInterval(blockLoadedInterval);
				// Load paw
				if (paw_start_active) {
					init_blockeditor_paw();
					init_paw_action_required();
					hide_box_paw(paw_hide_box_ids);
					launch_paw();
					active_paw(paw_current_tab);
				} else {
					init_blockeditor_paw();
					reset_blockeditor_paw();
					init_paw_action_required();
					disable_paw();
				}
				run_actions(); // Added W
			}
		}, 700);
	}

    // Execute for accred > Accreditation / Added W
	setTimeout(function() {
		if ($('body').hasClass('create_accreditation')) {
			if (paw_start_active == 0) {
				hide_box_paw(paw_hide_box_ids);
				launch_paw();
				active_paw(paw_current_tab);
			}
		}
	}, 200);

	// Actions
	function run_actions() {
		$('.paw_action_display_wizard').click(function() {
			if (is_block_editor) {
				init_blockeditor_paw();
				hide_box_paw(paw_hide_box_ids);
				launch_paw();
				active_paw(paw_current_tab);
			} else {
				hide_box_paw(paw_hide_box_ids);
				launch_paw();
				active_paw(paw_current_tab);
			}
		});
		$('.paw_action_display_normal').click(function() {
			if (is_block_editor) {
				reset_blockeditor_paw();
				disable_paw();
				visible_box_paw(paw_hide_box_ids);
			} else {
				disable_paw();
				visible_box_paw(paw_hide_box_ids);
			}
		});
	}

	function active_save_whatever() {
		$.each(paw_elements, function(idx, element) {
			//Toolset forms - disabled 
			element.find('.js-wpt-validate').each(function(idx, element2) {
				element2 = $(element2);
				element2.removeClass('js-wpt-validate');
				element2.addClass('js-wpt-validate-disabled');
			});
			//Meta io forms - disabled 
			element.find('.rwmb-field.required').each(function(idx, element2) {
				element2 = $(element2);
				element2.removeClass('required');
				element2.addClass('required-disabled');
				element2.find('input').removeAttr('required');
				element2.find('input').attr('required-disable', true);
			});
		});
		var element = $('#paw_save_post');
		var victims = element.attr('rel');
		var done = false;
		$.each(victims.split('|'), function(index, victim) {
			if (!done) {
				var myVictim = $('#' + victim);
				if (myVictim.length) {
					myVictim.trigger('click');
					done = true;
				}
			}
		});
	}

	function reset_save_whatever() {
		save_whatever = 0;
	}
	$('#paw_save_post').click(function() {
		change_paw($('#paw_status_current').val());
		save_whatever += 1;
		if (save_whatever > 3) {
			active_save_whatever();
		} else {
			var element = $(this);
			var victims = element.attr('rel');
			var done = false;
			$.each(victims.split('|'), function(index, victim) {
				if (!done) {
					var myVictim = $('#' + victim);
					if (myVictim.length) {
						myVictim.trigger('click');
						done = true;
					}
				}
			});
		}
	});

    function required_fields_disabled_changed() {
		console.log("required_fields_disabled_changed:: ",paw_required_active, paw_elements);
		if (is_block_editor) var prfd = $('.edit-post-header__settings .paw_required_fields_disabled');
		else var prfd = $('.paw_required_fields_disabled');
		if (prfd.is(':checked')) {
			paw_required_active = false;
		} else {
			paw_required_active = true;
		}
		//$.each(paw_elements, function(idx, element) {
		$('#postbox-container-2 .postbox').each(function(idx, element) {
			element = $(element);
			console.log("required_fields_disabled_changed:: element",element);

			// Toolset forms
			if (paw_required_active) element.find('.js-wpt-validate-disabled').each(function(idx, element2) {
				element2 = $(element2);
				element2.removeClass('js-wpt-validate-disabled');
				element2.addClass('js-wpt-validate');
			});
			else element.find('.js-wpt-validate').each(function(idx, element2) {
				element2 = $(element2);
				element2.removeClass('js-wpt-validate');
				element2.addClass('js-wpt-validate-disabled');
			});
			// Meta io forms 
			if (paw_required_active) element.find('.rwmb-field.required-disabled').each(function(idx, element2) {
				element2 = $(element2);
				element2.removeClass('required-disabled');
				element2.addClass('required');
				element2.find('input').removeAttr('required-disable');
				element2.find('input').attr('required', true);
			});
			else element.find('.rwmb-field.required').each(function(idx, element2) {
				element2 = $(element2);
				console.log("required_fields_disabled_changed:: element2",element2);

				element2.removeClass('required');
				element2.addClass('required-disabled');
				element2.find('input').removeAttr('required');
				element2.find('input').attr('required-disable', true);
			});	
		});
	}

	function find_in_thickbox(sid) {
		var iframe = $('iframe#TB_iframeContent');
		var content = iframe.contents();
		var post_type = content.find('input#post_type').val();
		var post_status = content.find('input#original_post_status').val();
		if (post_status == 'publish') {
			var selects = $('select.select_posttype.select_posttype_' + post_type);
			$.each(selects, function(index, victim) {
				victim = $(victim)
				var pattern = $(victim).attr('rel');
				var dest = pattern;
				var meta_regex = /\[([-_a-zA-Z0-9]+)\]/g
				var var_regex = /\(([-_a-zA-Z0-9]+)\)/g
				while (metas = meta_regex.exec(pattern)) {
					var meta = metas[1];
					var current_element = content.find('input[data-wpt-id=' + meta + ']');
					var value = '** not found **';
					if (current_element) {
						value = $(current_element.get(0)).val();
					}
					dest = dest.replace('[' + meta + ']', value);
				}
				while (vars = var_regex.exec(pattern)) {
					var vari = vars[1];
					var current_element = content.find('input#post_' + vari);
					var value = '** not found **';
					if (current_element) {
						value = $(current_element.get(0)).val();
					}
					dest = dest.replace('(' + vari + ')', value);
				}
				var id = content.find('input#post_ID').val();
				if (victim.attr('id') == sid) {
					victim.append($("<option></option>").attr("value", id).attr("class", 'wpt-form-option form-option option').attr("data-wpt-type", "option").attr("selected", "selected").text(dest));
					victim.focus();
				} else {
					victim.append($("<option></option>").attr("value", id).attr("class", 'wpt-form-option form-option option').attr("data-wpt-type", "option").text(dest));
				}
			});
		}
	}
	var sid;
	$('.wpt-select_posttype .thickbox').each(function(idx, element) {
		$(this).click(function() {
			var element = $(this);
			sid = element.parent().find('select.wpt-form-select').attr('id');
			// alert('test load on click'+sid);
		});
	});
	$(window).bind('tb_unload', function() {
		if (tb_unload_count > 1) {
			tb_unload_count = 1;
		} else {
			// do something here
			//		active_save_whatever();
			find_in_thickbox(sid);
			//		console.log(sid);
			tb_unload_count = tb_unload_count + 1;
		}
	});
	/*$('#publish').bind('click', function () {
		alert('publish');
	});*/
});