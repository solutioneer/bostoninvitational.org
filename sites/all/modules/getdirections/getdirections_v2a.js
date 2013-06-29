
/**
 * @file
 * Javascript functions for getdirections module
 *
 * @author Bob Hutchinson http://drupal.org/user/52366
 * code derived from gmap_direx module
 * this is for googlemaps API version 2
 * with adaptations from econym.org.uk
*/
(function ($) {
  Drupal.getdirections = {};

  // errorcodes
  var reasons = [];
  reasons[G_GEO_SUCCESS]             = "Success";
  reasons[G_GEO_MISSING_ADDRESS]     = "Missing Address: The address was either missing or had no value.";
  reasons[G_GEO_UNKNOWN_ADDRESS]     = "Unknown Address:  No corresponding geographic location could be found for the specified address.";
  reasons[G_GEO_UNAVAILABLE_ADDRESS] = "Unavailable Address:  The geocode for the given address cannot be returned due to legal or contractual reasons.";
  reasons[G_GEO_BAD_KEY]             = "Bad Key: The API key is either invalid or does not match the domain for which it was given";
  reasons[G_GEO_TOO_MANY_QUERIES]    = "Too Many Queries: The daily geocoding quota for this site has been exceeded.";
  reasons[G_GEO_SERVER_ERROR]        = "Server error: The geocoding request could not be successfully processed.";
  reasons[G_GEO_BAD_REQUEST]         = "A directions request could not be successfully parsed.";
  reasons[G_GEO_MISSING_QUERY]       = "No query was specified in the input.";
  reasons[G_GEO_UNKNOWN_DIRECTIONS]  = "The GDirections object could not compute directions between the points.";

  //var map;
  var gdir;
  var geo;
  var bounds;
  var map;
  var trafficInfo;
  var traffictoggleState = 1;

  var path = [];
  var active = [];
  var gmarkers = [];
  var addresses = [];

  var state = 0;
  var llpatt = /[0-9.\-],[0-9.\-]/;
  var fromdone = false;
  var todone = false;
  var mylocale = 'en';
  var waypoints = 0;
  var startpoint = 0;
  var endpoint = 1;
  var viaIconColor = '';
  var scheme = 'http';
  var viaIconUrl = scheme + "://labs.google.com/ridefinder/images/mm_20_";

  // functions
  Drupal.getdirections.mygetDirections = function() {
    var from;
    var to;
    var s;
    var i;
    if (addresses[startpoint]) {
      from = addresses[startpoint] + "@" + path[startpoint].toUrlValue(6);
    }
    else {
      from = path[startpoint].toUrlValue(6);
    }
    if (addresses[endpoint]) {
      to = addresses[endpoint] + "@" + path[endpoint].toUrlValue(6);
    }
    else {
      to = path[endpoint].toUrlValue(6);
    }
    for (i = waypoints; i > 0; i--) {
      if (active[i]) {
        to = path[i].toUrlValue(6) +" to: " + to;
        gmarkers[i].hide();
      }
    }
    s = "from: " + from + " to: " + to;
    gdir.load(s, {getPolyline:true, locale:mylocale });

    gmarkers[startpoint].hide();
    gmarkers[endpoint].hide();

  }

  // without location module
  function setDirectionsfromto(fromAddress, toAddress) {
    Drupal.getdirections.mygetDirections();
  }

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

    function handleState() {
      var e;
      var point;
      if (! todone) {
        e = $("input[name=to]").val();
        if (e && e.match(llpatt)) {
          arr = e.split(",");
          point = new GLatLng(arr[0], arr[1]);
          createMarker(point, endpoint, icon3);
          path[endpoint] = point;
          map.panTo(path[endpoint]);
          todone = true;
        }
      }

      if (! fromdone) {
        e = $("input[name=from]").val();
        if (e && e.match(llpatt)) {
          arr = e.split(",");
          point = new GLatLng(arr[0], arr[1]);
          createMarker(point, startpoint, icon1);
          path[startpoint] = point;
          map.panTo(path[startpoint]);
          fromdone = true;
        }
      }

      if (state == 0) {
        if (fromdone) {
          state = 1;
        }
        else {
          $("#getdirections_start").show();
          $("#getdirections_end").hide();
          $("#getdirections_btn").hide();
          $("#getdirections_help").hide();
        }
      }
      if (state == 1) {
        if (todone) {
          state = 2;
        }
        else {
          $("#getdirections_start").hide();
          $("#getdirections_end").show();
          $("#getdirections_btn").hide();
          $("#getdirections_help").hide();
        }
      }
      if (state == 2) {
        if (todone) {
          dovias();
          setendbounds();
        }
        $("#getdirections_start").hide();
        $("#getdirections_end").hide();
        $("#getdirections_btn").show();
        $("#getdirections_nextbtn").hide();
        if (waypoints) {
          $("#getdirections_help").show();
        }
      }
    } // end handleState

    function createMarker(point, i, ic) {
      var t;
      if (i == startpoint) { t = 'From'; }
      else if (i == endpoint) { t = 'To'; }
      else { t = 'via ' + i; }
      var marker = new GMarker(point, {draggable:true, icon:ic, title:t});
      gmarkers[i] = marker;
      GEvent.addListener(marker, "dragend", function() {
        path[i] = marker.getPoint();
        map.panTo(path[i]);
        if (! active[i]) {
          swapMarkers(i);
          active[i] = true;
        }
        addresses[i] = "";
      });
      map.addOverlay(marker);
    }

    function swapMarkers(i) {
      map.removeOverlay(gmarkers[i]);
      createMarker(path[i], i, icon2);
    }

    function doStart(point) {
      createMarker(point, startpoint, icon1);
      path[startpoint] = point;
      state = 1;
      handleState();
    }

    function doEnd(point) {
      createMarker(point, endpoint, icon3);
      path[endpoint] = point;
      state = 2;
      handleState();
      dovias();
      setendbounds();
      if (waypoints) {
        $("#getdirections_help").show();
      }
    }

    function dovias() {
      for (var i = 1; i < endpoint; i++) {
        var lat = (path[startpoint].lat()*(endpoint-i) + path[endpoint].lat()*i)/endpoint;
        var lng = (path[startpoint].lng()*(endpoint-i) + path[endpoint].lng()*i)/endpoint;
        var p = new GLatLng(lat,lng);
        createMarker(p, i, icon4);
        path[i] = p;
      }
    }

    function setendbounds() {
      bounds.extend(path[startpoint]);
      bounds.extend(path[endpoint]);
      map.setZoom(map.getBoundsZoomLevel(bounds));
      map.setCenter(bounds.getCenter());
    }

    // ====== Geocoding ======
    function showAddress() {
      var s;
      if (state == 0) {
        s = $("input[name=from]").val();
        if ($("#edit-country-from").val()) {
          s += ', ' + $("#edit-country-from").val();
        }
        addresses[startpoint] = s;
      }
      if (state == 1) {
        s = $("input[name=to]").val();
        if ($("#edit-country-to").val()) {
          s += ', ' + $("#edit-country-to").val();
        }
        addresses[endpoint] = s;
      }
      geo.getLatLng(s, function (point) {
        if (point) {
          if (state == 1) { doEnd(point); }
          if (state == 0) { doStart(point); }
        }
        else {
          var result = geo.getCache().get(s);
          if (result) {
            reason = "Code "+ result.Status.code;
            if (reasons[result.Status.code]) { reason = reasons[result.Status.code]; }
          }
          else {
            reason = "";
          }
          alert(Drupal.t('Could not find') + ' "' + s + '" ' + reason);
        }
      });
    }

    // start
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
    mylocale = (Drupal.settings.getdirections.mylocale ? Drupal.settings.getdirections.mylocale : 'en');
    // pipe delim
    var latlons = (Drupal.settings.getdirections.latlons ? Drupal.settings.getdirections.latlons : '');
    // color of 'via' icon, can be black brown green purple yellow blue gray orange red white
    viaIconColor = (Drupal.settings.getdirections.waypoint_color ? Drupal.settings.getdirections.waypoint_color : 'white');
    if (Drupal.settings.getdirections.use_https) {
      scheme = 'https';
      viaIconUrl = scheme + "://labs.google.com/ridefinder/images/mm_20_";
    }

    waypoints = (Drupal.settings.getdirections.waypoints ? Drupal.settings.getdirections.waypoints : 0);
    if (waypoints) {
      endpoint = waypoints + 1;
      active[startpoint] = true;
      for (var i = 1; i <= waypoints; i++) { active[i] = false; }
      active[endpoint] = true;
    }
    else {
      active[startpoint] = true;
      active[endpoint] = true;
    }

    var mapOptions = {};
    if (googlebar) {
      mapOptions = {
        googleBarOptions : {
          style : "new"
        }
      }
    }

    // make map
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

    // some icons
    var baseIcon = new GIcon(G_DEFAULT_ICON);
    baseIcon.iconSize=new GSize(24,38);
    var icon1 = G_START_ICON;
    var icon2 = G_PAUSE_ICON;
    var icon3 = G_END_ICON;
    var icon4 = new GIcon(baseIcon, viaIconUrl + viaIconColor + ".png");
        icon4.shadow = viaIconUrl + "shadow.png";
        icon4.iconSize = new GSize(12, 20);
        icon4.shadowSize = new GSize(22, 20);
        icon4.iconAnchor = new GPoint(6, 20);
        icon4.infoWindowAnchor = new GPoint(5, 1);

    // Bounding
    bounds = new GLatLngBounds();

    // Create a Client Geocoder
    geo = new GClientGeocoder(new GGeocodeCache());

    handleState();

    GEvent.addListener(map, "click", function(overlay,point) {
      if (point) {
        if (state == 1) {
          doEnd(point);
        }
        if (state == 0) {
          doStart(point);
          if (! todone) {
            map.panTo(point);
          }
        }
      }
    });

    gdir = new GDirections(map, document.getElementById("getdirections_directions"));

    GEvent.addListener(gdir, "error", function() {
      var code = gdir.getStatus().code;
      var reason="Code " + code;
      if (reasons[code]) {
        reason = "Code " + code + " : " + reasons[code];
      }
      alert(Drupal.t('Failed to obtain directions') + ", " + reason);
    });

    GEvent.addListener(gdir, "load", onGDirectionsLoad);

    if (fromlatlon && tolatlon) {
      if (fromlatlon.match(llpatt) && tolatlon.match(llpatt)) {
          // we have a latlon, so get the points and run through mygetDirections().
          arr = fromlatlon.split(",");
          point = new GLatLng(arr[0], arr[1]);
          path[startpoint] = point;
          fromdone = true;

          arr = tolatlon.split(",");
          point = new GLatLng(arr[0], arr[1]);
          path[endpoint] = point;
          todone = true;
          state = 2;
          // no vias in this instance, no button to click
          Drupal.mygetDirections();
        }
    }


    if (latlons) {
      setDirectionsvia(latlons, mylocale);
    }

    // minding textfields
    $("input[name=from]").change( function() {
      showAddress();
    });
    $("input[name=to]").change( function() {
      showAddress();
    });

  } // end initialise

  Drupal.getdirections.nextbtn = function() {
    return;
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

  Drupal.behaviors.getdirections = {
    attach: function() {
      initialize();

      $(window).unload(function(){
        GUnload();
      });
    }
  };

})(jQuery);
