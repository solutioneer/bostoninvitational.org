<?php

/**
 * @file
 * getdirections module theming
 */


/**
 * Implements hook_theme().
 *
 * This lets us tell Drupal about our theme functions and their variables.
 */
function getdirections_theme() {
  return array(
    'getdirections_show' => array(
      'variables' => array(
        'form' => NULL,
        'width' => '',
        'height' => '',
        'nid' => 0,
        'type' => '',
      ),
    ),
    'getdirections_show_locations' => array(
      'variables' => array(
        'width' => '',
        'height' => '',
        'fromlocs' => '',
        'tolocs' => '',
      ),
    ),
    'getdirections_show_locations_via' => array(
      'variables' => array(
        'width' => '',
        'height' => '',
        'locs' => NULL,
      ),
    ),
    'getdirections_direction_form' => array(
      'render element' => 'form',
    ),
    'getdirections_box' => array(
      'variables' => array('content' => NULL),
      'template' => 'getdirections_box',
    ),
    'getdirections_loadaddress' => array(
      'variables' => array(
        'location' => array(),
        'addcountry' => FALSE,
      ),
    ),
  );
}

/**
 * Theme to use for when one or no locations are supplied.
 *
 */
function theme_getdirections_show($variables) {
  $form = $variables['form'];
  $width = $variables['width'];
  $height = $variables['height'];
  $nid = $variables['nid'];
  $type =  $variables['type'];
  $output = '';
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
  $returnlink = FALSE;
  if (isset($getdirections_returnlink['page_enable']) && $getdirections_returnlink['page_enable'] && $nid > 0 && $type == 'node') {
    $node = node_load($nid);
    if ($node) {
      $linktext = $getdirections_returnlink['page_link'];
      if ( preg_match("/%t/", $linktext)) {
        $linktext = preg_replace("/%t/", $node->title, $linktext);
      }
      $l = l($linktext, 'node/' . $node->nid);
      $returnlink = '<div class="getdirections_returnlink">' . $l . '</div>';
    }
  }
  elseif (isset($getdirections_returnlink['user_enable']) && $getdirections_returnlink['user_enable'] && $nid > 0 && $type == 'user') {
    // $nid is actually uid
    $account = user_load($nid);
    if ($account) {
      $linktext = $getdirections_returnlink['user_link'];
      if ( preg_match("/%n/", $linktext)) {
        $linktext = preg_replace("/%n/", $account->name, $linktext);
      }
      $l = l($linktext, 'user/' . $account->uid);
      $returnlink = '<div class="getdirections_returnlink">' . $l . '</div>';
    }
  }
  elseif (isset($getdirections_returnlink['page_enable']) && $getdirections_returnlink['page_enable'] && $nid > 0 && $type == 'location') {
    // $nid is actually lid
    $id = getdirections_get_nid_from_lid($nid);
    if ($id) {
      $node = node_load($id);
      $linktext = $getdirections_returnlink['page_link'];
      if ( preg_match("/%t/", $linktext)) {
        $linktext = preg_replace("/%t/", $node->title, $linktext);
      }
      $l = l($linktext, 'node/' . $node->nid);
      $returnlink = '<div class="getdirections_returnlink">' . $l . '</div>';
    }
  }
  elseif (isset($getdirections_returnlink['term_enable']) && $getdirections_returnlink['term_enable'] && $nid > 0 && $type == 'term') {
    // $nid is actually tid
    $term = taxonomy_term_load($nid);
    if ($term) {
      $linktext = $getdirections_returnlink['term_link'];
      if ( preg_match("/%n/", $linktext)) {
        $linktext = preg_replace("/%n/", $term->name, $linktext);
      }
      $l = l($linktext, 'taxonomy/term/' . $term->tid);
      $returnlink = '<div class="getdirections_returnlink">' . $l . '</div>';
    }
  }
  elseif (isset($getdirections_returnlink['comment_enable']) && $getdirections_returnlink['comment_enable'] && $nid > 0 && $type == 'comment') {
    // $nid is actually cid
    $comment = comment_load($nid);
    if ($comment) {
      $linktext = $getdirections_returnlink['comment_link'];
      if ( preg_match("/%n/", $linktext)) {
        $linktext = preg_replace("/%n/", $comment->subject, $linktext);
      }
      $l = l($linktext, 'comment/' . $comment->cid);
      $returnlink = '<div class="getdirections_returnlink">' . $l . '</div>';
    }
  }

  if ($returnlink) {
    $output .= $returnlink;
  }

  $output .= $form;

  $getdirections_defaults = getdirections_defaults();
  $getdirections_misc = getdirections_misc_defaults();

  if ($getdirections_misc['show_distance']) {
    $output .= '<div id="getdirections_show_distance"></div>';
  }
  if ($getdirections_misc['show_duration']) {
    $output .= '<div id="getdirections_show_duration"></div>';
  }
  $help = '';
  if (getdirections_is_advanced()) {
    if ($getdirections_defaults['waypoints'] > 0 && ! $getdirections_defaults['advanced_alternate'] ) {
      $help = t('Drag <img src="http://labs.google.com/ridefinder/images/mm_20_!c.png"> to activate a waypoint', array('!c' => $getdirections_defaults['waypoint_color']));
    }
    elseif ($getdirections_defaults['advanced_alternate']) {
      $help = t('You can drag the route to change it');
    }
  }
  $output .= '<div id="getdirections_help">' . $help . '</div>';
  $header = array();
  $rows[] = array(
    array(
      'data' => '<div id="getdirections_map_canvas" style="width: ' . $width . '; height: ' . $height . '" ></div>',
      'valign' => 'top',
      'align' => 'center',
      'class' => 'getdirections-map',
    ),
    array(
      'data' => ($getdirections_defaults['advanced_alternate'] ? '<button id="getdirections-undo" onclick="Drupal.getdirectionsundo()">' . t('Undo') . '</button>' : '') . '<div id="getdirections_directions"></div>',
      'valign' => 'top' ,
      'align' => 'left',
      'class' => 'getdirections-list',
    ),
  );
  $output .= '<div class="getdirections">' . theme('table', array('header' => $header, 'rows' => $rows)) . '</div>';
  return $output;
}

/**
 * Theme to use for when both locations are supplied.
 *
 */
function theme_getdirections_show_locations($variables) {
  $width = $variables['width'];
  $height = $variables['height'];
  $fromlocs = $variables['fromlocs'];
  $tolocs = $variables['tolocs'];
  $output = "";
  $output .= "<div class='getdirections_display'><label>" . t('From') . ":</label> " . $fromlocs . "</div>";
  $output .= "<div class='getdirections_display'><label>" . t('To') . ":</label> " . $tolocs . "</div>";

  $getdirections_misc = getdirections_misc_defaults();
  if ($getdirections_misc['show_distance']) {
    $output .= '<div id="getdirections_show_distance"></div>';
  }
  if ($getdirections_misc['show_duration']) {
    $output .= '<div id="getdirections_show_duration"></div>';
  }
  $header = array();

  $rows[] = array(
    array(
      'data' => '<div id="getdirections_map_canvas" style="width: ' . $width . '; height: ' . $height . '" ></div>',
      'valign' => 'top',
      'align' => 'center',
      'class' => 'getdirections-map',
    ),
    array(
      'data' => '<div id="getdirections_directions"></div>',
      'valign' => 'top' ,
      'align' => 'left',
      'class' => 'getdirections-list',
    ),
  );
  $output .= '<div class="getdirections">' . theme('table', array('header' => $header, 'rows' => $rows)) . '</div>';
  return $output;
}

/**
 * Theme to use for when both locations are supplied with waypoints.
 *
 */
function theme_getdirections_show_locations_via($variables) {
  $width = $variables['width'];
  $height = $variables['height'];
  $locs = $variables['locs'];
  $output = "";
  foreach ($locs AS $key => $loc) {
    if ($key == 0) {
      $label = t('From');
    }
    elseif ($key == count($locs)-1) {
      $label = t('To');
    }
    else {
      $label = t('Via');
    }
    $output .= "<div class='getdirections_display'><label>" . $label . ":</label> " . $loc . "</div>";
  }

  $getdirections_misc = getdirections_misc_defaults();
  if ($getdirections_misc['show_distance']) {
    $output .= '<div id="getdirections_show_distance"></div>';
  }
  if ($getdirections_misc['show_duration']) {
    $output .= '<div id="getdirections_show_duration"></div>';
  }
  $header = array();

  $rows[] = array(
    array(
      'data' => '<div id="getdirections_map_canvas" style="width: ' . $width . '; height: ' . $height . '" ></div>',
      'valign' => 'top',
      'align' => 'center',
      'class' => 'getdirections-map',
    ),
    array(
      'data' => '<div id="getdirections_directions"></div>',
      'valign' => 'top' ,
      'align' => 'left',
      'class' => 'getdirections-list',
    ),
  );
  $output .= '<div class="getdirections">' . theme('table', array('header' => $header, 'rows' => $rows)) . '</div>';
  return $output;
}


function theme_getdirections_direction_form($variables) {
  $form = $variables['form'];
  // if you want to do fancy things with the form, do it here ;-)
  $getdirections_defaults = getdirections_defaults();
  if (isset($form['mto'])) {
    $form['mto']['#prefix'] = '<div class="container-inline getdirections_display">';
    $form['mto']['#suffix'] = '</div>';
  }
  if (isset($form['mfrom'])) {
    $form['mfrom']['#prefix'] = '<div class="container-inline getdirections_display">';
    $form['mfrom']['#suffix'] = '</div>';
  }
  if (isset($form['travelmode'])) {
    $form['travelmode']['#prefix'] = '<div class="container-inline getdirections_display">';
    $form['travelmode']['#suffix'] = '</div>';
  }
  if (isset($form['travelextras'])) {
    $form['travelextras']['#prefix'] = '<div class="container-inline getdirections_display">';
    $form['travelextras']['#suffix'] = '</div>';
  }
  if (getdirections_is_advanced()) {
    $desc = t('Fill in the form below.<br />You can also click on the map and move the marker.');
    if (isset($form['country_from'])) {
      $desc = t('Select a country first, then type in a town.<br />You can also click on the map and move the marker.');
      $form['country_from']['#prefix'] = '<div id="getdirections_start"><div class="container-inline getdirections_display">';
      $form['country_from']['#suffix'] = '</div>';
    }
    if (isset($form['from']) && $form['from']['#type'] == 'textfield' && (module_exists('location') || module_exists('getlocations_fields')) && ! $getdirections_defaults['advanced_autocomplete']) {
      $form['from']['#suffix'] = '</div>';
    }
    if (isset($form['country_to'])) {
      $form['country_to']['#prefix'] = '<div id="getdirections_end"><div class="container-inline getdirections_display">';
      $form['country_to']['#suffix'] = '</div>';
    }
    if (isset($form['to']) && $form['to']['#type'] == 'textfield' && (module_exists('location') || module_exists('getlocations_fields')) && ! $getdirections_defaults['advanced_autocomplete']) {
      $form['to']['#suffix'] = '</div>';
    }
  }
  else {
    if (isset($form['country_from'])) {
      $form['country_from']['#prefix'] = '<div class="container-inline getdirections_display">';
      $form['country_from']['#suffix'] = '</div>';
    }
    if (isset($form['country_to'])) {
      $form['country_to']['#prefix'] = '<div class="container-inline getdirections_display">';
      $form['country_to']['#suffix'] = '</div>';
    }
    $desc = t('Fill in the form below.');
  }

  if (isset($form['trafficinfo'])) {
    $form['trafficinfo']['#prefix'] = '<div id="getdirections_trafficinfo">';
    $form['trafficinfo']['#suffix'] = '</div>';
  }
  if (isset($form['bicycleinfo'])) {
    $form['bicycleinfo']['#prefix'] = '<div id="getdirections_bicycleinfo">';
    $form['bicycleinfo']['#suffix'] = '</div>';
  }
  if (isset($form['panoramio'])) {
    $form['panoramio']['#prefix'] = '<div id="getdirections_panoramio">';
    $form['panoramio']['#suffix'] = '</div>';
  }
  if (isset($form['switchfromto'])) {
    $form['switchfromto']['#prefix'] = '<div id="getdirections_switchfromto">';
    $form['switchfromto']['#suffix'] = '</div>';
  }
  if (isset($form['next'])) {
    $form['next']['#prefix'] = '<div id="getdirections_nextbtn">';
    $form['next']['#suffix'] = '</div>';
  }

  if (isset($form['submit'])) {
    $form['submit']['#prefix'] = '<div id="getdirections_btn">';
    $form['submit']['#suffix'] = '</div>';
  }
  $output = '<p class="description">' . $desc . '</p>';
  $output .= drupal_render_children($form);
  return $output;
}

function template_preprocess_getdirections_box(&$variables) {

  if (module_exists('admin_menu')) {
    admin_menu_suppress();
  }
  drupal_add_js(GETDIRECTIONS_PATH . '/getdirections_box.js');

  // Construct page title
  if (drupal_get_title()) {
    $head_title = array(strip_tags(drupal_get_title()), variable_get('site_name', 'Drupal'));
  }
  else {
    $head_title = array(variable_get('site_name', 'Drupal'));
    if (variable_get('site_slogan', '')) {
      $head_title[] = variable_get('site_slogan', '');
    }
  }
  $variables['head_title']        = implode(' | ', $head_title);
  $variables['base_path']         = base_path();
  $variables['head']              = drupal_get_html_head();
  $variables['language']          = $GLOBALS['language'];
  $variables['language']->dir     = $GLOBALS['language']->direction ? 'rtl' : 'ltr';
  $variables['css']               = drupal_add_css();
  $variables['styles']            = drupal_get_css();
  $variables['scripts']           = drupal_get_js();
  $variables['title']             = drupal_get_title();
  // Closure should be filled last.
  $variables['closure']           = theme('closure');
  // Compile a list of classes that are going to be applied to the body element.
  // This allows advanced theming based on context (home page, node of certain type, etc.).
  $body_classes = array();
  // Add a class that tells us whether we're on the front page or not.
  $body_classes[] = $variables['is_front'] ? 'front' : 'not-front';
  // Add a class that tells us whether the page is viewed by an authenticated user or not.
  $body_classes[] = $variables['logged_in'] ? 'logged-in' : 'not-logged-in';
  $body_classes[] = 'no-sidebars';
  // Implode with spaces.
  $variables['body_classes'] = implode(' ', $body_classes);

}

function theme_getdirections_loadaddress($variables) {
  $location = $variables['location'];
  $addcountry = $variables['addcountry'];

  $loc = array();
  if (isset($location['name']) && $location['name']) {
    $loc[] = $location['name'];
  }
  if (isset($location['street']) && $location['street']) {
    $loc[] = $location['street'];
  }
  if (isset($location['additional']) && $location['additional']) {
    $loc[] = $location['additional'];
  }
  if (isset($location['city']) && $location['city']) {
    $loc[] = $location['city'];
  }
  if (isset($location['province_name']) && $location['province_name']) {
    $loc[] = $location['province_name'];
  }
  if (isset($location['postal_code']) && $location['postal_code']) {
    $loc[] = $location['postal_code'];
  }
  if ($addcountry) {
    if (isset($location['country']) && $location['country']) {
      $loc[] = drupal_strtoupper($location['country']);
    }
  }

  $output = implode(', ', $loc);
  return $output;

}

