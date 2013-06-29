
/**
 * @file
 * Javascript functions for getdirections module
 *
 * @author Bob Hutchinson http://drupal.org/user/52366
 * code derived from gmap_direx module
 * this is for googlemaps API version 2
*/
(function ($) {
  Drupal.getdirections = {};

  // errorcodes
  var reasons = [];
  reasons[G_GEO_SUCCESS]             = Drupal.t("Success");
  reasons[G_GEO_MISSING_ADDRESS]     = Drupal.t("Missing Address: The address was either missing or had no value.");
  reasons[G_GEO_UNKNOWN_ADDRESS]     = Drupal.t("Unknown Address:  No corresponding geographic location could be found for the specified address.");
  reasons[G_GEO_UNAVAILABLE_ADDRESS] = Drupal.t("Unavailable Address:  The geocode for the given address cannot be returned due to legal or contractual reasons.");
  reasons[G_GEO_BAD_KEY]             = Drupal.t("Bad Key: The API key is either invalid or does not match the domain for which it was given");
  reasons[G_GEO_TOO_MANY_QUERIES]    = Drupal.t("Too Many Queries: The daily geocoding quota for this site has been exceeded.");
  reasons[G_GEO_SERVER_ERROR]        = Drupal.t("Server error: The geocoding request could not be successfully processed.");
  reasons[G_GEO_BAD_REQUEST]         = Drupal.t("A directions request could not be successfully parsed.");
  reasons[G_GEO_MISSING_QUERY]       = Drupal.t("No query was specified in the input.");
  reasons[G_GEO_UNKNOWN_DIRECTIONS]  = Drupal.t("The GDirections object could not compute directions between the points.");

  var gdir;
  var mylocale;
  var trafficInfo;
  var traffictoggleState = 1;

  function setDirectionsvia(lls, locale) {
    var arr = lls.split('|');
    gdir.loadFromWaypoints(arr, { "locale": locale });
  }

  function onGDirectionsLoad(){
    // Use this function to access information about the latest load() results.
    // e.g.
    //document.getElementById("getdirections_info").innerHTML = gdir.getStatus().code;
    // and yada yada yada...
    if (Drupal.settings.getdirections.show_distance) {
      $("#getdirections_show_distance").html(Drupal.settings.getdirections.show_distance + ': ' + gdir.getDistance().html);
    }
    if (Drupal.settings.getdirections.show_duration) {
      $("#getdirections_show_duration").html(Drupal.settings.getdirections.show_duration + ': ' + gdir.getDuration().html);
    }
  }

  function initialize() {

    if (! GBrowserIsCompatible()) {
      return;
    }
    var lat = Drupal.settings.getdirections.lat;
    var lng = Drupal.settings.getdirections.lng;
    var zoom = Drupal.settings.getdirections.zoom;
    var controltype = Drupal.settings.getdirections.controltype;
    var mtc = Drupal.settings.getdirections.mtc;
    var scale = Drupal.settings.getdirections.scale;
    var overview = Drupal.settings.getdirections.overview;
    var googlebar = Drupal.settings.getdirections.googlebar;
    var maptype = (Drupal.settings.getdirections.maptype ? Drupal.settings.getdirections.maptype : '');
    var baselayers = (Drupal.settings.getdirections.baselayers ? Drupal.settings.getdirections.baselayers : '');

    var fromlatlon = (Drupal.settings.getdirections.fromlatlon ? Drupal.settings.getdirections.fromlatlon : '');
    var tolatlon = (Drupal.settings.getdirections.tolatlon ? Drupal.settings.getdirections.tolatlon : '');
    var mylocale = (Drupal.settings.getdirections.mylocale ? Drupal.settings.getdirections.mylocale : 'en');
    // pipe delim
    var latlons = (Drupal.settings.getdirections.latlons ? Drupal.settings.getdirections.latlons : '');

    var mapOptions = {};
    if (googlebar) {
      mapOptions = {
        googleBarOptions : {
          style : "new"
        }
      }
    }

    map = new GMap2(document.getElementById("getdirections_map_canvas"), mapOptions);

    // menu type
    if (mtc == 'standard') { map.addControl(new GMapTypeControl()); }
    else if (mtc == 'hier') { map.addControl(new GHierarchicalMapTypeControl()); }
    else if (mtc == 'menu') { map.addControl(new GMenuMapTypeControl()); }
    // nav control type
    if (controltype == 'micro') { map.addControl(new GSmallZoomControl()); }
    else if (controltype == 'micro3D') { map.addControl(new GSmallZoomControl3D()); }
    else if (controltype == 'small') { map.addControl(new GSmallMapControl()); }
    else if (controltype == 'large') { map.addControl(new GLargeMapControl()); }
    else if (controltype == 'large3D') { map.addControl(new GLargeMapControl3D()); }
    if (baselayers.Physical) { map.addMapType(G_PHYSICAL_MAP); }
    // map type
    if (maptype) {
      if (maptype == 'Map' && baselayers.Map) { map.setMapType(G_NORMAL_MAP); }
      if (maptype == 'Satellite' && baselayers.Satellite) { map.setMapType(G_SATELLITE_MAP); }
      if (maptype == 'Hybrid' && baselayers.Hybrid) { map.setMapType(G_HYBRID_MAP); }
      if (maptype == 'Physical' && baselayers.Physical) { map.setMapType(G_PHYSICAL_MAP); }
    }
    //GScaleControl()
    if (scale) { map.addControl(new GScaleControl()); }
    //GOverviewMapControl()
    if (overview) { map.addControl(new GOverviewMapControl()); }

    latlng = new GLatLng(lat, lng);
    map.setCenter(latlng, parseInt(zoom));

    if (googlebar) {
      map.enableGoogleBar();
    }

    if (Drupal.settings.getdirections.trafficinfo) {
      var trafficOptions = {incidents:true};
      trafficInfo = new GTrafficOverlay(trafficOptions);
      map.addOverlay(trafficInfo);
    }

    gdir = new GDirections(map, document.getElementById("getdirections_directions"));

    GEvent.addListener(gdir, "error", function() {
      var code = gdir.getStatus().code;
      var reason = "Code " + code;
      if (reasons[code]) {
        reason = "Code " + code + " : " + reasons[code];
      }
      alert(Drupal.t("Failed to obtain directions, @reason", {'@reason':reason}));
    });

    GEvent.addListener(gdir, "load", onGDirectionsLoad);

    if (fromlatlon && tolatlon) {
      gdir.load("from: " + fromlatlon + " to: " + tolatlon, { "locale": mylocale });
    }

    if (latlons) {
      setDirectionsvia(latlons, mylocale);
    }

  }

  Drupal.getdirections.mygetDirections = function() {
    // collect form info from the DOM
    var from = $("input[name=from]").val();
    if ($("#edit-country-from").val()) {
      from += ', ' + $("#edit-country-from").val();
    }
    var to = $("input[name=to]").val();
    if ($("#edit-country-to").val()) {
      to += ', ' + $("#edit-country-to").val();
    }
    var s = "from: " + from + " to: " + to;
    gdir.load(s, {locale: mylocale});
  }

  Drupal.getdirections.toggleTraffic = function() {
    if (traffictoggleState == 1) {
      map.removeOverlay(trafficInfo);
      traffictoggleState = 0;
    }
    else {
      map.addOverlay(trafficInfo);
      traffictoggleState = 1;
    }
  }

  Drupal.getdirections.toggleFromto = function() {
    var from = $("#edit-from").val();
    var countryfrom = false;
    if ($("#edit-country-from").val()) {
      countryfrom = $("#edit-country-from").val();
    }
    var to = $("#edit-to").val();
    var countryto = false;
    if ($("#edit-country-to").val()) {
      countryto = $("#edit-country-to").val();
    }
    $("#edit-from").val(to);
    $("#edit-to").val(from);
    if (countryfrom) {
      $("#edit-country-to").val(countryfrom);
    }
    if (countryto) {
      $("#edit-country-from").val(countryto);
    }
  }

  Drupal.behaviors.getdirections = {
    attach: function() {
      initialize();

      $(window).unload(function(){
        GUnload();
      });
    }
  };

})(jQuery);
