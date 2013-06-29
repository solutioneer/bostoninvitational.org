<?php

// optionally using version 3 googlemaps API

/**
 * @file
 * getdirections module administration functions.
 */

/**
 * Function to display the getdirections admin settings form
 * @return
 *   Returns the form.
 */
function getdirections_settings_form() {
  $getdirections_defaults = getdirections_defaults();
  drupal_add_js(GETDIRECTIONS_PATH . '/getdirections_admin.js');

  $form = array();
  if (module_exists('getlocations_fields')) {
    $form['getdirections_use_v3'] = array(
      '#type' => 'hidden',
      '#value' => variable_get('getdirections_use_v3', 1),
    );
  }
  else {
    $form['getdirections_use_v3'] = array(
      '#type' => 'checkbox',
      '#title' => t('Use Googlemaps version 3'),
      '#description' => t('Use version 3 of the Googlemaps API instead of version 2.'),
      '#default_value' => variable_get('getdirections_use_v3', 0),
      '#return_value' => 1,
    );

  }

  if (! variable_get('getdirections_use_v3', 0)) {
    if (module_exists('gmap')) {
      $gmap_key = gmap_get_key();
    }
    else {
      $gmap_key = '';
    }
    if ($gmap_key) {
      $form['getdirections_api_key_show'] = array(
        '#type' => 'textfield',
        '#title' => t('Your Google Maps API key'),
        '#disabled' => TRUE,
        '#default_value' => (variable_get('getdirections_api_key', '') ? variable_get('getdirections_api_key', '') : $gmap_key),
        '#description' => t('Required for version 2 of the Googlemaps API.'),
        '#size' => 92,
      );
      $form['getdirections_api_key'] = array(
        '#type' => 'value',
        '#value' => (variable_get('getdirections_api_key', '') ? variable_get('getdirections_api_key', '') : $gmap_key),
      );
    }
    else {
      $form['getdirections_api_key'] = array(
        '#type' => 'textfield',
        '#title' => t('Your Google Maps API key'),
        '#default_value' => (variable_get('getdirections_api_key', '') ? variable_get('getdirections_api_key', '') : $gmap_key),
        '#description' => t('Required for version 2 of the Googlemaps API.'),
        '#size' => 92,
      );
    }
  }
  else {
    // google api3 key
    $apikey = variable_get('getdirections_api3_key', '');
    $form['api3'] = array(
      '#type' => 'fieldset',
      '#title' => t('Google API key'),
      '#description' => t('This key is currently not required by Google.'),
      '#collapsible' => TRUE,
      #'#collapsed' => ($apikey ? TRUE : FALSE),
      '#collapsed' => TRUE,
    );
    $form['api3']['getdirections_api3_key'] = array(
      '#type' => 'textfield',
      '#title' => t('Your Google maps API Version 3 key'),
      '#default_value' => $apikey,
      '#description' => t('For more information about this key see this !u', array('!u' => l('page on google', 'http://code.google.com/apis/maps/documentation/javascript/tutorial.html#api_key', array('attributes' => array('target'=>'_blank'))))),
      '#size' => 95,
      '#required' => FALSE,
    );

  }

  $form['getdirections_default'] = array(
    '#type' => 'fieldset',
    '#title' => t('Get directions map settings'),
    // This will store all the defaults in one variable.
    '#tree' => TRUE,
  );
  if (! variable_get('getdirections_use_v3', 0)) {
    $form['getdirections_default']['api_version'] = array(
      '#type' => 'textfield',
      '#title' => t('Your Google Maps API version'),
      '#size' => 15,
      '#description' => t("The Google Maps API version to use. Cen be a specific version number or '2' for Current, '2.x' for Latest or '2.s' for Stable."),
      '#default_value' => ($getdirections_defaults['api_version'] ? $getdirections_defaults['api_version'] : (defined('GMAP_API_VERSION') ? GMAP_API_VERSION : 2)),
      '#required' => TRUE,
    );
  }

  $form['getdirections_default']['width'] = array(
    '#type' => 'textfield',
    '#title' => t('Default width'),
    '#default_value' => $getdirections_defaults['width'],
    '#size' => 25,
    '#maxlength' => 25,
    '#description' => t('The default width of a Google map, as a CSS length or percentage. Examples: <em>50px</em>, <em>5em</em>, <em>2.5in</em>, <em>95%</em>'),
    '#required' => TRUE,
  );
  $form['getdirections_default']['height'] = array(
    '#type' => 'textfield',
    '#title' => t('Default height'),
    '#default_value' => $getdirections_defaults['height'],
    '#size' => 25,
    '#maxlength' => 25,
    '#description' => t('The default height of a Google map, as a CSS length or percentage. Examples: <em>50px</em>, <em>5em</em>, <em>2.5in</em>, <em>95%</em>'),
    '#required' => TRUE,
  );
  $form['getdirections_default']['latlong'] = array(
    '#type' => 'textfield',
    '#title' => t('Map center'),
    '#default_value' => $getdirections_defaults['latlong'],
    '#size' => 50,
    '#maxlength' => 255,
    '#description' => t('The default center coordinates of Google map, expressed as a decimal latitude and longitude, separated by a comma.'),
    '#required' => TRUE,
  );
  $form['getdirections_default']['zoom'] = array(
    '#type' => 'select',
    '#title' => t('Zoom'),
    '#default_value' => $getdirections_defaults['zoom'],
    '#options' => drupal_map_assoc(range(0, 17)),
    '#description' => t('The default zoom level of a Google map.'),
  );
  if (! variable_get('getdirections_use_v3', 0)) {
    $version = $getdirections_defaults['api_version'];
    if ($version == '2' || $version == '2.x' || $version == '2.s') {
      $opts = array(
        'none' => t('None'),
        'micro' => t('Micro'),
        'micro3D' => t('Micro 3D'),
        'small' => t('Small'),
        'large' => t('Large'),
        'large3D' => t('Large 3D'),
      );
    }
    else {
      $opts = array(
        'none' => t('None'),
        'micro' => t('Micro'),
        'small' => t('Small'),
        'large' => t('Large'),
      );
    }
    $opts2 = array(
      'none' => t('None'),
      'standard' => t('Standard'),
      'hier' => t('Hierarchical'),
      'menu' => t('Dropdown'),
    );
  }
  else {
    // v3
    $opts = array(
      'none' => t('None'),
      'default' => t('Default'),
      'small' => t('Small'),
      'large' => t('Large'),
    );
    $opts2 = array(
      'none' => t('None'),
      'standard' => t('Horizontal bar'),
      'menu' => t('Dropdown'),
    );
  }
  $form['getdirections_default']['controltype'] = array(
    '#type' => 'select',
    '#title' => (variable_get('getdirections_use_v3', 0) ? t('Zoom Control type') : t('Control type')),
    '#options' => $opts,
    '#default_value' => $getdirections_defaults['controltype'],
  );

  if (variable_get('getdirections_use_v3', 0)) {
    $form['getdirections_default']['pancontrol'] = array(
      '#type' => 'checkbox',
      '#title' => t('Show Pan control'),
      '#default_value' => $getdirections_defaults['pancontrol'],
      '#return_value' => 1,
    );
  }

  $form['getdirections_default']['mtc'] = array(
    '#type' => 'select',
    '#title' => t('Map Control Type'),
    '#options' => $opts2,
    '#default_value' => $getdirections_defaults['mtc'],
  );
  if (! variable_get('getdirections_use_v3', 0)) {
    if (module_exists('gmap')) {
      // layers
      $baselayers = array();
      foreach (module_implements('gmap') as $module) {
        call_user_func_array($module . '_gmap', array('baselayers', &$baselayers));
      }
      $options = array();
      foreach ($baselayers as $name => $layers) {
        $options[$name] = array();
        foreach ($layers as $key => $layer) {
          // @@@TODO: Only show the enabled ones? an attempt
          if ( $getdirections_defaults['baselayers'][$key] ) {
            $options[$name][$key] = $layer['title'];
          }
        }
      }
      $form['getdirections_default']['maptype'] = array(
        '#type' => 'select',
        '#title' => t('Default map type'),
        '#default_value' => $getdirections_defaults['maptype'],
        '#options' => $options,
      );
      foreach ($baselayers as $name => $layers) {
        foreach ($layers as $key => $layer) {
          $form['getdirections_default']['baselayers'][$key] = array(
            '#type' => 'checkbox',
            '#title' => $layer['title'],
            '#description' => $layer['help'],
            '#default_value' => $getdirections_defaults['baselayers'][$key],
            '#return_value' => 1,
          );
        }
      }
    }
  }
  else {
    $options = array();
    $layers = array(
      'Map' => t('Standard street map'),
      'Satellite' => t('Standard satellite map'),
      'Hybrid' => t('Hybrid satellite map'),
      'Physical' => t('Terrain map'),
    );
    foreach ($layers AS $key => $layer) {
      if ($getdirections_defaults['baselayers'][$key]) {
        $options[$key] = $layer;
      }
    }
    $form['getdirections_default']['maptype'] = array(
      '#type' => 'select',
      '#title' => t('Default map type'),
      '#default_value' => $getdirections_defaults['maptype'],
      '#options' => $options,
    );
    $form['getdirections_default']['baselayers']['Map'] = array(
      '#type' => 'checkbox',
      '#title' => t('Standard street map'),
      '#description' => t('The standard default street map.'),
      '#default_value' => $getdirections_defaults['baselayers']['Map'],
      '#return_value' => 1,
      '#prefix' => '<fieldset><legend>' . t('Enable map types') . '</legend>',
    );
    $form['getdirections_default']['baselayers']['Satellite'] = array(
      '#type' => 'checkbox',
      '#title' => t('Standard satellite map'),
      '#description' => t('Satellite view without street overlay.'),
      '#default_value' => $getdirections_defaults['baselayers']['Satellite'],
      '#return_value' => 1,
    );
    $form['getdirections_default']['baselayers']['Hybrid'] = array(
      '#type' => 'checkbox',
      '#title' => t('Hybrid satellite map'),
      '#description' => t('Satellite view with street overlay.'),
      '#default_value' => $getdirections_defaults['baselayers']['Hybrid'],
      '#return_value' => 1,
    );
    $form['getdirections_default']['baselayers']['Physical'] = array(
      '#type' => 'checkbox',
      '#title' => t('Terrain map'),
      '#description' => t('Map with physical data (terrain, vegetation.)'),
      '#default_value' => $getdirections_defaults['baselayers']['Physical'],
      '#return_value' => 1,
      '#suffix' => '</fieldset>',
    );
    $form['getdirections_default']['unitsystem'] = array(
      '#type' => 'select',
      '#title' => t('Default distance units'),
      '#description' => t("Units to display distances in."),
      '#default_value' => $getdirections_defaults['unitsystem'],
      '#options' => array(
        'metric' => t('Metric'),
        'imperial' => t('Imperial'),
      ),
    );
  }

  $form['getdirections_default']['behavior']['scale'] = array(
    '#type' => 'checkbox',
    '#title' => t('Scale'),
    '#description' => t('Show scale'),
    '#default_value' =>  $getdirections_defaults['behavior']['scale'],
    '#return_value' => 1,
  );
  $form['getdirections_default']['behavior']['overview'] = array(
    '#type' => 'checkbox',
    '#title' => t('Overview map'),
    '#description' => t('Show overview map'),
    '#default_value' =>  $getdirections_defaults['behavior']['overview'],
    '#return_value' => 1,
  );

  if (! variable_get('getdirections_use_v3', 0)) {
    $form['getdirections_default']['behavior']['googlebar'] = array(
      '#type' => 'checkbox',
      '#title' => t('Show Googlebar'),
      '#description' => t('Enable Googlebar search on map.'),
      '#default_value' =>  $getdirections_defaults['behavior']['googlebar'],
      '#return_value' => 1,
    );
  }
  else {
    $form['getdirections_default']['behavior']['googlebar'] = array(
      '#type' => 'value',
      '#value' => 0,
    );
    $form['getdirections_default']['behavior']['overview_opened'] = array(
      '#type' => 'checkbox',
      '#title' => t('Overview map state'),
      '#description' => t('Show overview map as open by default'),
      '#default_value' =>  $getdirections_defaults['behavior']['overview_opened'],
      '#return_value' => 1,
    );
    $form['getdirections_default']['behavior']['scrollwheel'] = array(
      '#type' => 'checkbox',
      '#title' => t('Scrollwheel'),
      '#description' => t('Enable scrollwheel zooming'),
      '#default_value' =>  $getdirections_defaults['behavior']['scrollwheel'],
      '#return_value' => 1,
    );
    $form['getdirections_default']['behavior']['draggable'] = array(
      '#type' => 'checkbox',
      '#title' => t('Draggable'),
      '#description' => t('Enable dragging on the map'),
      '#default_value' =>  $getdirections_defaults['behavior']['draggable'],
      '#return_value' => 1,
    );
    $form['getdirections_default']['streetview_show'] = array(
      '#type' => 'checkbox',
      '#title' => t('Show streetview button'),
      '#default_value' =>  $getdirections_defaults['streetview_show'],
      '#return_value' => 1,
    );
    $form['getdirections_default']['travelmode_show'] = array(
      '#type' => 'checkbox',
      '#title' => t('Show travel mode'),
      '#description' => t('Enable travel mode selector.'),
      '#default_value' =>  $getdirections_defaults['travelmode_show'],
      '#return_value' => 1,
    );
    $form['getdirections_default']['travelextras_show'] = array(
      '#type' => 'checkbox',
      '#title' => t('Show travel extras'),
      '#description' => t('Enable travel extras checkboxes.'),
      '#default_value' =>  $getdirections_defaults['travelextras_show'],
      '#return_value' => 1,
    );
  }
  $form['getdirections_default']['from_width'] = array(
    '#type' => 'textfield',
    '#title' => t('Width of From box'),
    '#default_value' => ($getdirections_defaults['from_width'] ? $getdirections_defaults['from_width'] : 20),
    '#size' => 5,
    '#description' => t("The width of the Get directions 'From' box."),
    '#required' => TRUE,
    // need this to get validation to work
    '#parents' => array('getdirections_default', 'from_width'),
  );
  $form['getdirections_default']['to_width'] = array(
    '#type' => 'textfield',
    '#title' => t('Width of To box'),
    '#default_value' => ($getdirections_defaults['to_width'] ? $getdirections_defaults['to_width'] : 20),
    '#size' => 5,
    '#description' => t("The width of the Get directions 'To' box."),
    '#required' => TRUE,
    // need this to get validation to work
    '#parents' => array('getdirections_default', 'to_width'),
  );

  $form['getdirections_default']['use_advanced'] = array(
    '#type' => 'checkbox',
    '#title' => t('Use advanced features'),
    '#description' => t('Advanced features include a clickable map and waypoints.'),
    '#default_value' => ($getdirections_defaults['use_advanced'] ? $getdirections_defaults['use_advanced'] : 0),
    '#return_value' => 1,
  );
  $waypoints_opts = range(0, GETDIRECTIONS_WAYPOINTS_MAX);
  $waypoints_opts[0] = t('None');
  $form['getdirections_default']['waypoints'] = array(
    '#type' => 'select',
    '#title' => t('Number of waypoints'),
    '#description' => t('The number of waypoints to display on the map.'),
    '#default_value' => (isset($getdirections_defaults['waypoints']) ? $getdirections_defaults['waypoints'] : 3),
    '#options' => $waypoints_opts,
    '#prefix' => '<div id="wrap-waypoints">',
  );

  $form['getdirections_default']['waypoint_color'] = array(
    '#type' => 'select',
    '#title' => t('Color of waypoint markers'),
    '#description' => t('The color of waypoint markers used on the map.'),
    '#default_value' => ($getdirections_defaults['waypoint_color'] ? $getdirections_defaults['waypoint_color'] : 'white'),
    '#options' => array(
      'black' => t('Black'),
      'blue' => t('Blue'),
      'brown' => t('Brown'),
      'gray' => t('Gray'),
      'green' => t('Green'),
      'orange' => t('Orange'),
      'purple' => t('Purple'),
      'red' => t('Red'),
      'white' => t('White'),
      'yellow' => t('Yellow'),
    ),
    '#suffix' => (! variable_get('getdirections_use_v3', 0) ? '</div>' : ''),
  );

  if (variable_get('getdirections_use_v3', 0)) {
    $form['getdirections_default']['advanced_alternate'] = array(
      '#type' => 'checkbox',
      '#title' => t('Use draggable route'),
      '#description' => t('An alternative to waypoints.'),
      '#default_value' => ($getdirections_defaults['advanced_alternate'] ? $getdirections_defaults['advanced_alternate'] : 0),
      '#return_value' => 1,
    );
    $form['getdirections_default']['advanced_autocomplete'] = array(
      '#type' => 'checkbox',
      '#title' => t('Use Google Autocomplete'),
      '#description' => t('An alternative method for collecting starting point and destination.'),
      '#default_value' => ($getdirections_defaults['advanced_autocomplete'] ? $getdirections_defaults['advanced_autocomplete'] : 0),
      '#return_value' => 1,
      '#suffix' => '</div>',
    );
  }

  $form['getdirections_default']['use_https'] = array(
    '#type' => 'value',
    '#value' =>  $getdirections_defaults['use_https'],
  );

  // return link
  $form['getdirections_returnlink'] = array(
    '#type' => 'fieldset',
    '#title' => t('Links back to page'),
    '#description' => t('Enable and format \'Return to page\' links.'),
    // This will store all the defaults in one variable.
    '#tree' => TRUE,
  );
  $getdirections_returnlink_default = array(
    'page_enable' => 0,
    'page_link' => t('Return to page'),
    'user_enable' => 0,
    'user_link' => t('Return to page'),
    'term_enable' => 0,
    'term_link' => t('Return to page'),
    'comment_enable' => 0,
    'comment_link' => t('Return to page'),
  );
  $getdirections_returnlink = variable_get('getdirections_returnlink', $getdirections_returnlink_default);
  $form['getdirections_returnlink']['page_enable'] = array(
    '#type' => 'checkbox',
    '#title' => t('Enable Page Return Link'),
    '#default_value' => (isset($getdirections_returnlink['page_enable']) ? $getdirections_returnlink['page_enable'] : $getdirections_returnlink_default['page_enable']),
    '#return_value' => 1,
  );
  $form['getdirections_returnlink']['page_link'] = array(
    '#type' => 'textfield',
    '#title' => t('Text of page return link'),
    '#description' => t('Use %t to insert the page title'),
    '#default_value' => $getdirections_returnlink['page_link'],
    '#default_value' => (isset($getdirections_returnlink['page_link']) ? $getdirections_returnlink['page_link'] : $getdirections_returnlink_default['page_link']),
    '#size' => 30,
    // need this to get validation to work
    '#parents' => array('getdirections_returnlink', 'page_link'),
    '#prefix' => '<div id="wrap-page-link">',
    '#suffix' => '</div>',
  );

  $form['getdirections_returnlink']['user_enable'] = array(
    '#type' => 'checkbox',
    '#title' => t('Enable User Return Link'),
    '#default_value' => (isset($getdirections_returnlink['user_enable']) ? $getdirections_returnlink['user_enable'] : $getdirections_returnlink_default['user_enable']),
    '#return_value' => 1,
  );
  $form['getdirections_returnlink']['user_link'] = array(
    '#type' => 'textfield',
    '#title' => t('Text of user return link'),
    '#description' => t('Use %n to insert the user name'),
    '#default_value' => (isset($getdirections_returnlink['user_link']) ? $getdirections_returnlink['user_link'] : $getdirections_returnlink_default['user_link']),
    '#size' => 30,
    // need this to get validation to work
    '#parents' => array('getdirections_returnlink', 'user_link'),
    '#prefix' => '<div id="wrap-user-link">',
    '#suffix' => '</div>',
  );

  if (module_exists('getlocations_fields')) {
    if (getlocations_get_vocabularies()) {
      $form['getdirections_returnlink']['term_enable'] = array(
        '#type' => 'checkbox',
        '#title' => t('Enable Term Return Link'),
        '#default_value' => (isset($getdirections_returnlink['term_enable']) ? $getdirections_returnlink['term_enable'] : $getdirections_returnlink_default['term_enable']),
        '#return_value' => 1,
      );
      $form['getdirections_returnlink']['term_link'] = array(
        '#type' => 'textfield',
        '#title' => t('Text of Term return link'),
        '#description' => t('Use %n to insert the term name'),
        '#default_value' => (isset($getdirections_returnlink['term_link']) ? $getdirections_returnlink['term_link'] : $getdirections_returnlink_default['term_link']),
        '#size' => 30,
        // need this to get validation to work
        '#parents' => array('getdirections_returnlink', 'term_link'),
        '#prefix' => '<div id="wrap-term-link">',
        '#suffix' => '</div>',
      );
    }
    if (getlocations_check_entity_type('comment')) {
      $form['getdirections_returnlink']['comment_enable'] = array(
        '#type' => 'checkbox',
        '#title' => t('Enable Comment Return Link'),
        '#default_value' =>  $getdirections_returnlink['comment_enable'],
        '#default_value' => (isset($getdirections_returnlink['comment_enable']) ? $getdirections_returnlink['comment_enable'] : $getdirections_returnlink_default['comment_enable']),
        '#return_value' => 1,
      );
      $form['getdirections_returnlink']['comment_link'] = array(
        '#type' => 'textfield',
        '#title' => t('Text of Comment return link'),
        '#description' => t('Use %n to insert the term name'),
        '#default_value' => (isset($getdirections_returnlink['comment_link']) ? $getdirections_returnlink['comment_link'] : $getdirections_returnlink_default['comment_link']),
        '#size' => 30,
        // need this to get validation to work
        '#parents' => array('getdirections_returnlink', 'comment_link'),
        '#prefix' => '<div id="wrap-comment-link">',
        '#suffix' => '</div>',
      );
    }
  }

  if (module_exists('colorbox')) {
    $form['getdirections_colorbox'] = array(
      '#type' => 'fieldset',
      '#title' => t('Colorbox settings'),
      // This will store all the defaults in one variable.
      '#tree' => TRUE,
    );
    $getdirections_colorbox = variable_get('getdirections_colorbox', array(
      'enable' => 0,
      'width' => 600,
      'height' => 600,
    ));
    $form['getdirections_colorbox']['enable'] = array(
      '#type' => 'checkbox',
      '#title' => t('Enable Colorbox'),
      '#default_value' =>  $getdirections_colorbox['enable'],
      '#return_value' => 1,
      '#description' => t('Show Getdirections in a Colorbox.'),
    );
    $form['getdirections_colorbox']['width'] = array(
      '#type' => 'textfield',
      '#title' => t('Colorbox width'),
      '#default_value' => $getdirections_colorbox['width'],
      '#size' => 5,
      '#required' => TRUE,
      // need this to get validation to work
      '#parents' => array('getdirections_colorbox', 'width'),
      '#prefix' => '<div id="wrap-getdirections-colorbox">',
    );
    $form['getdirections_colorbox']['height'] = array(
      '#type' => 'textfield',
      '#title' => t('Colorbox height'),
      '#default_value' => $getdirections_colorbox['height'],
      '#size' => 5,
      '#required' => TRUE,
      // need this to get validation to work
      '#parents' => array('getdirections_colorbox', 'height'),
      '#suffix' => '</div>',
    );
  }

  // various
  $form['getdirections_misc'] = array(
    '#type' => 'fieldset',
    '#title' => t('Other settings'),
    // This will store all the defaults in one variable.
    '#tree' => TRUE,
  );
  $getdirections_misc = getdirections_misc_defaults();
  if (module_exists('location') || module_exists('getlocations_fields')) {
    $form['getdirections_misc']['keep_title'] = array(
      '#type' => 'checkbox',
      '#title' => t('Show original title'),
      '#description' => t("Show the node title or user name when using 'to' or 'from'."),
      '#default_value' =>  $getdirections_misc['keep_title'],
      '#return_value' => 1,
    );
  }
  else {
    $form['getdirections_misc']['keep_title'] = array(
      '#type' => 'value',
      '#value' => 0,
    );
  }
  $form['getdirections_misc']['show_distance'] = array(
    '#type' => 'checkbox',
    '#title' => t('Show total distance'),
    '#default_value' =>  $getdirections_misc['show_distance'],
    '#return_value' => 1,
  );
  $form['getdirections_misc']['show_duration'] = array(
    '#type' => 'checkbox',
    '#title' => t('Show total duration'),
    '#default_value' =>  $getdirections_misc['show_duration'],
    '#return_value' => 1,
  );
  $form['getdirections_misc']['trafficinfo'] = array(
    '#type' => 'checkbox',
    '#title' => t('Enable Traffic information'),
    '#default_value' =>  $getdirections_misc['trafficinfo'],
    '#description' => t('Google trafficinfo layer, limited availability.'),
    '#return_value' => 1,
  );
  if (variable_get('getdirections_use_v3', 0)) {
    $form['getdirections_misc']['bicycleinfo'] = array(
      '#type' => 'checkbox',
      '#title' => t('Enable Bicycling information'),
      '#default_value' =>  $getdirections_misc['bicycleinfo'],
      '#description' => t('Google bicycling layer, limited availability.'),
      '#return_value' => 1,
    );
    $form['getdirections_misc']['panoramio_show'] = array(
      '#type' => 'checkbox',
      '#title' => t('Enable Panoramio'),
      '#default_value' =>  $getdirections_misc['panoramio_show'],
      '#description' => t('Google panoramio picture links.'),
      '#return_value' => 1,
    );
  }
  else {
    $form['getdirections_misc']['bicycleinfo'] = array(
      '#type' => 'value',
      '#value' => 0,
    );
    $form['getdirections_misc']['panoramio_show'] = array(
      '#type' => 'value',
      '#value' => 0,
    );
  }
  if (! $getdirections_defaults['use_advanced']) {
    $form['getdirections_misc']['switchfromto'] = array(
      '#type' => 'checkbox',
      '#title' => t('Enable From/To Switch'),
      '#default_value' =>  $getdirections_misc['switchfromto'],
      '#return_value' => 1,
    );
  }
  else {
    $form['getdirections_misc']['switchfromto'] = array('#type' => 'value', '#value' => $getdirections_misc['switchfromto']);
  }

  $form['#validate'][] = 'getdirections_settings_validate';

  return system_settings_form($form);

}

function getdirections_settings_validate($form, &$form_state) {
  if ( ! is_numeric($form_state['values']['getdirections_default']['to_width']) || $form_state['values']['getdirections_default']['to_width'] < 1) {
    form_set_error('getdirections_default][to_width', t('Width of To box must be a positive number'));
  }
  if ( ! is_numeric($form_state['values']['getdirections_default']['from_width']) || $form_state['values']['getdirections_default']['from_width'] < 1) {
    form_set_error('getdirections_default][from_width', t('Width of From box must be a positive number'));
  }
  if (isset($form_state['values']['getdirections_returnlink']['page_link'])) {
    if ( empty($form_state['values']['getdirections_returnlink']['page_link'])) {
      form_set_error('getdirections_returnlink][page_link', t('Text of return link cannot be empty'));
    }
  }
  if (isset($form_state['values']['getdirections_returnlink']['user_link'])) {
    if ( empty($form_state['values']['getdirections_returnlink']['user_link'])) {
      form_set_error('getdirections_returnlink][user_link', t('Text of return link cannot be empty'));
    }
  }
  if (isset($form_state['values']['getdirections_returnlink']['term_link'])) {
    if ( empty($form_state['values']['getdirections_returnlink']['term_link'])) {
      form_set_error('getdirections_returnlink][term_link', t('Text of return link cannot be empty'));
    }
  }
  if (isset($form_state['values']['getdirections_returnlink']['comment_link'])) {
    if ( empty($form_state['values']['getdirections_returnlink']['comment_link'])) {
      form_set_error('getdirections_returnlink][comment_link', t('Text of return link cannot be empty'));
    }
  }

  if (! variable_get('getdirections_use_v3', 0) && ! $form_state['values']['getdirections_use_v3'] && empty($form_state['values']['getdirections_api_key'])) {
    form_set_error('getdirections_api_key', t('API key is required for version 2 of the Googlemaps API'));
  }

  if ($form_state['values']['getdirections_use_v3']) {
    $list = array('Map', 'Satellite', 'Hybrid', 'Physical');
    $found = 0;
    foreach ($list AS $maptype) {
      if (isset($form_state['values']['getdirections_default']['maptype'])
        && $form_state['values']['getdirections_default']['maptype'] == $maptype
        && isset($form_state['values']['getdirections_default']['baselayers'][$maptype])
        && $form_state['values']['getdirections_default']['baselayers'][$maptype]
        ) {
        $found = 1;
        break;
      }
    }
    if (! $found) {
      // force a setting
      $form_state['values']['getdirections_default']['maptype'] = 'Map';
      $form_state['values']['getdirections_default']['baselayers']['Map'] = 1;
    }
  }
}
