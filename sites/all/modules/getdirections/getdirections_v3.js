
/**
 * @file
 * Javascript functions for getdirections module
 *
 * @author Bob Hutchinson http://drupal.org/user/52366
 * code derived from gmap_direx module
 * this is for googlemaps API version 3
*/
(function ($) {
  Drupal.getdirections = {};

  var dirservice;
  var dirrenderer;
  var unitsys;
  var llpatt = /[0-9.\-],[0-9.\-]/;
  var map;
  var scheme = 'http';
  var startIconUrl = scheme + "://www.google.com/mapfiles/dd-start.png";
  var endIconUrl = scheme + "://www.google.com/mapfiles/dd-end.png";
  var shadowIconUrl = scheme + "://www.google.com/mapfiles/shadow50.png"
  var tomarker;
  var frommarker;
  var trafficInfo;
  var bicycleInfo;
  var traffictoggleState = 1;
  var bicycletoggleState = 1;

  var panoramioLayer;
  var panoramiotoggleState = 1;

  // error codes
  function getdirectionserrcode(errcode) {
    var errstr;
    if (errcode == google.maps.DirectionsStatus.INVALID_REQUEST) {
      errstr = Drupal.t("The DirectionsRequest provided was invalid.");
    }
    else if (errcode == google.maps.DirectionsStatus.MAX_WAYPOINTS_EXCEEDED) {
      errstr = Drupal.t("Too many DirectionsWaypoints were provided in the DirectionsRequest. The total allowed waypoints is 8, plus the origin, and destination.");
    }
    else if (errcode == google.maps.DirectionsStatus.NOT_FOUND) {
      errstr = Drupal.t("At least one of the origin, destination, or waypoints could not be geocoded.");
    }
    else if (errcode == google.maps.DirectionsStatus.OVER_QUERY_LIMIT) {
      errstr = Drupal.t("The webpage has gone over the requests limit in too short a period of time.");
    }
    else if (errcode == google.maps.DirectionsStatus.REQUEST_DENIED) {
      errstr = Drupal.t("The webpage is not allowed to use the directions service.");
    }
    else if (errcode == google.maps.DirectionsStatus.UNKNOWN_ERROR) {
      errstr = Drupal.t("A directions request could not be processed due to a server error. The request may succeed if you try again.");
    }
    else if (errcode == google.maps.DirectionsStatus.ZERO_RESULTS) {
      errstr = Drupal.t("No route could be found between the origin and destination.");
    }
    return errstr;
  }

  function renderdirections(request) {
    dirservice.route(request, function(response, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        dirrenderer.setDirections(response);
      } else {
        var err = getdirectionserrcode(status);
        alert(Drupal.t('Error') + ': ' + err);
      }
    });
  }

  function getRequest(fromAddress, toAddress, waypts) {
    var request = {
      origin: fromAddress,
      destination: toAddress
    };
    var tmode = $("#edit-travelmode").val();
    var trmode;
    if (tmode == 'walking') { trmode = google.maps.DirectionsTravelMode.WALKING; }
    else if (tmode == 'bicycling') { trmode = google.maps.DirectionsTravelMode.BICYCLING; }
    else { trmode = google.maps.DirectionsTravelMode.DRIVING; }
    request.travelMode = trmode;

    if (unitsys == 'imperial') { request.unitSystem = google.maps.DirectionsUnitSystem.IMPERIAL; }
    else { request.unitSystem = google.maps.DirectionsUnitSystem.METRIC; }

    var avoidh = false;
    if ($("#edit-travelextras-avoidhighways").attr('checked')) { avoidh = true; }
    request.avoidHighways = avoidh;

    var avoidt = false;
    if ($("#edit-travelextras-avoidtolls").attr('checked')) { avoidt = true; }
    request.avoidTolls = avoidt;

    var routealt = false;
    if ($("#edit-travelextras-altroute").attr('checked')) { routealt = true; }
    request.provideRouteAlternatives = routealt;

    if (waypts) {
      request.waypoints = waypts;
      request.optimizeWaypoints = true;
    }

    return request;
  }

  // from the form
  Drupal.getdirections.mygetDirections = function() {

    // collect form info from the DOM
    var from = $("input[name=from]").val();
    if ($("#edit-country-from").val()) {
      from += ', ' + $("#edit-country-from").val();
    }
    else if (from.match(llpatt)) {
      // we have lat,lon
      var farr = from.split(",");
      from = new google.maps.LatLng(farr[0], farr[1]);
    }

    var to = $("input[name=to]").val();
    if ($("#edit-country-to").val()) {
      to += ', ' + $("#edit-country-to").val();
    }
    else if (to.match(llpatt)) {
      // we have lat,lon
      var tarr = to.split(",");
      to = new google.maps.LatLng(tarr[0], tarr[1]);
    }
    // switch off markers
    if (tomarker && tomarker.getVisible() == true) {
      tomarker.setMap(null);
    }
    if (frommarker && frommarker.getVisible() == true) {
      frommarker.setMap(null);
    }

    var request = getRequest(from, to, '');
    renderdirections(request);

    // disable to and from boxes
    $("#edit-from").attr('disabled', true);
    $("#edit-to").attr('disabled', true);
  }

  function makell(ll) {
    if (ll.match(llpatt)) {
      var arr = ll.split(",");
      var d = new google.maps.LatLng(parseFloat(arr[0]), parseFloat(arr[1]));
      return d;
    }
    return false;
  }

  // with waypoints
  function setDirectionsvia(lls) {
    var arr = lls.split('|');
    var len = arr.length;
    var wp = 0;
    var waypts = [];
    var from;
    var to;
    var via;
    for (var i = 0; i < len; i++) {
      if (i == 0) {
        from = makell(arr[i]);
      }
      else if (i == len-1) {
        to = makell(arr[i]);
      }
      else {
        wp++;
        if (wp < 24) {
          via = makell(arr[i]);
          waypts.push({
            location: via,
            stopover: true
          });
        }
      }
    }
    var request = getRequest(from, to, waypts);
    renderdirections(request);
  }

  function setDirectionsfromto(fromlatlon, tolatlon) {
    var from = makell(fromlatlon);
    var to = makell(tolatlon);
    var request = getRequest(from, to, '');
    renderdirections(request);
  }

  // Total distance and duration
  function computeTotals(result) {
    var meters = 0;
    var seconds = 0;
    var myroute = result.routes[0];
    for (i = 0; i < myroute.legs.length; i++) {
      meters += myroute.legs[i].distance.value;
      seconds += myroute.legs[i].duration.value;
    }

    if (Drupal.settings.getdirections.show_distance) {
      distance = meters * 0.001;
      if (unitsys == 'imperial') {
        distance = distance * 0.6214;
        distance = distance.toFixed(2) + ' mi';
      }
      else {
        distance = distance.toFixed(2) + ' km';
      }
      $("#getdirections_show_distance").html(Drupal.settings.getdirections.show_distance + ': ' + distance);
    }

    if (Drupal.settings.getdirections.show_duration) {
      mins = seconds * 0.016666667;
      minutes = mins.toFixed(0);
      // hours
      hours = 0;
      while (minutes >= 60 ) {
        minutes = minutes - 60;
        hours++;
      }
      // days
      days = 0;
      while (hours >= 24) {
        hours = hours - 24
        days++;
      }
      duration = '';
      if (days > 0) {
        duration += Drupal.formatPlural(days, '1 day', '@count days') + ' ';
      }
      if (hours > 0) {
        //duration += hours + ' ' + (hours > 1 ? 'hours' : 'hour') + ' ';
        duration += Drupal.formatPlural(hours, '1 hour', '@count hours') + ' ';
     }
      if (minutes > 0) {
        //duration += minutes + ' ' + (minutes > 1 ? 'minutes' : 'minute');
        duration += Drupal.formatPlural(minutes, '1 minute', '@count minutes');
     }
      if (seconds < 60) {
        duration = Drupal.t('About 1 minute');
      }
      $("#getdirections_show_duration").html(Drupal.settings.getdirections.show_duration + ': ' + duration );
    }
  }

  function initialize() {
    var lat = parseFloat(Drupal.settings.getdirections.lat);
    var lng = parseFloat(Drupal.settings.getdirections.lng);
    var selzoom = parseInt(Drupal.settings.getdirections.zoom);
    var controltype = Drupal.settings.getdirections.controltype;
    var pancontrol = Drupal.settings.getdirections.pancontrol;
    var scale = Drupal.settings.getdirections.scale;
    var overview = Drupal.settings.getdirections.overview;
    var overview_opened = Drupal.settings.getdirections.overview_opened;
    var streetview_show = Drupal.settings.getdirections.streetview_show;
    var scrollw = Drupal.settings.getdirections.scrollwheel;
    var drag = Drupal.settings.getdirections.draggable;
    unitsys = Drupal.settings.getdirections.unitsystem;
    var maptype = (Drupal.settings.getdirections.maptype ? Drupal.settings.getdirections.maptype : '');
    var baselayers = (Drupal.settings.getdirections.baselayers ? Drupal.settings.getdirections.baselayers : '');

    var fromlatlon = (Drupal.settings.getdirections.fromlatlon ? Drupal.settings.getdirections.fromlatlon : '');
    var tolatlon = (Drupal.settings.getdirections.tolatlon ? Drupal.settings.getdirections.tolatlon : '');

    // pipe delim
    var latlons = (Drupal.settings.getdirections.latlons ? Drupal.settings.getdirections.latlons : '');
    if (Drupal.settings.getdirections.use_https) {
      scheme = 'https';
      startIconUrl = scheme + "://www.google.com/mapfiles/dd-start.png";
      endIconUrl = scheme + "://www.google.com/mapfiles/dd-end.png";
      shadowIconUrl = scheme + "://www.google.com/mapfiles/shadow50.png"
    }

    // menu type
    var mtc = Drupal.settings.getdirections.mtc;
    if (mtc == 'standard') { mtc = google.maps.MapTypeControlStyle.HORIZONTAL_BAR; }
    else if (mtc == 'menu' ) { mtc = google.maps.MapTypeControlStyle.DROPDOWN_MENU; }
    else { mtc = false; }

  // nav control type
  if (controltype == 'default') { controltype = google.maps.ZoomControlStyle.DEFAULT; }
  else if (controltype == 'small') { controltype = google.maps.ZoomControlStyle.SMALL; }
  else if (controltype == 'large') { controltype = google.maps.ZoomControlStyle.LARGE; }
  else { controltype = false; }

    // map type
    maptypes = [];
    if (maptype) {
      if (maptype == 'Map' && baselayers.Map) { maptype = google.maps.MapTypeId.ROADMAP; }
      if (maptype == 'Satellite' && baselayers.Satellite) { maptype = google.maps.MapTypeId.SATELLITE; }
      if (maptype == 'Hybrid' && baselayers.Hybrid) { maptype = google.maps.MapTypeId.HYBRID; }
      if (maptype == 'Physical' && baselayers.Physical) { maptype = google.maps.MapTypeId.TERRAIN; }
      if (baselayers.Map) { maptypes.push(google.maps.MapTypeId.ROADMAP); }
      if (baselayers.Satellite) { maptypes.push(google.maps.MapTypeId.SATELLITE); }
      if (baselayers.Hybrid) { maptypes.push(google.maps.MapTypeId.HYBRID); }
      if (baselayers.Physical) { maptypes.push(google.maps.MapTypeId.TERRAIN); }
    }
    else {
      maptype = google.maps.MapTypeId.ROADMAP;
      maptypes.push(google.maps.MapTypeId.ROADMAP);
      maptypes.push(google.maps.MapTypeId.SATELLITE);
      maptypes.push(google.maps.MapTypeId.HYBRID);
      maptypes.push(google.maps.MapTypeId.TERRAIN);
    }

    var mapOpts = {
      zoom: selzoom,
      center: new google.maps.LatLng(lat, lng),
      mapTypeControl: (mtc ? true : false),
      mapTypeControlOptions: {style: mtc,  mapTypeIds: maptypes},
      zoomControl: (controltype ? true : false),
      zoomControlOptions: {style: controltype},
      panControl: (pancontrol ? true : false),
      mapTypeId: maptype,
      scrollwheel: (scrollw ? true : false),
      draggable: (drag ? true : false),
      overviewMapControl: (overview ? true : false),
      overviewMapControlOptions: {opened: (overview_opened ? true : false)},
      streetViewControl: (streetview_show ? true : false),
      scaleControl: (scale ? true : false),
      scaleControlOptions: {style: google.maps.ScaleControlStyle.DEFAULT}
    };
    map = new google.maps.Map(document.getElementById("getdirections_map_canvas"), mapOpts);

    if (Drupal.settings.getdirections.trafficinfo) {
      trafficInfo = new google.maps.TrafficLayer();
      trafficInfo.setMap(map);
    }
    if (Drupal.settings.getdirections.bicycleinfo) {
      bicycleInfo = new google.maps.BicyclingLayer();
      bicycleInfo.setMap(map);
    }
    if (Drupal.settings.getdirections.panoramio_show) {
      panoramioLayer = new google.maps.panoramio.PanoramioLayer();
      panoramioLayer.setMap(map);
    }

    // define some icons
    var icon1 = new google.maps.MarkerImage(
      startIconUrl,
      new google.maps.Size(22, 34),
      // origin
      new google.maps.Point(0,0),
      // anchor
      new google.maps.Point(6, 20)
    );
    var icon3 = new google.maps.MarkerImage(
      endIconUrl,
      new google.maps.Size(22, 34),
      // origin
      new google.maps.Point(0,0),
      // anchor
      new google.maps.Point(6, 20)
    );
    var shadow1 = new google.maps.MarkerImage(
      shadowIconUrl,
      new google.maps.Size(37, 34),
      // origin
      new google.maps.Point(0,0),
      // anchor
      new google.maps.Point(6, 20)
    );
    var shape1 = {coord: [1,1,22,34], type: 'rect'};

    // any initial markers?
    var from =  $("input[name=from]").val();
    var to =  $("input[name=to]").val();

    if (from && from.match(llpatt)) {
      // we have lat,lon
      from = makell(from);
      frommarker = new google.maps.Marker({
        position: from,
        map: map,
        title: "From",
        icon: icon1,
        shadow: shadow1,
        shape: shape1
      });
      map.setCenter(from);
    }
    if (to && to.match(llpatt)) {
      // we have lat,lon
      to = makell(to);
      tomarker = new google.maps.Marker({
        position: to,
        map: map,
        title: "To",
        icon: icon3,
        shadow: shadow1,
        shape: shape1
      });
      map.setCenter(to);
    }

    dirrenderer = new google.maps.DirectionsRenderer();
    dirrenderer.setMap(map);
    dirrenderer.setPanel(document.getElementById("getdirections_directions"));

    if (Drupal.settings.getdirections.show_distance || Drupal.settings.getdirections.show_duration) {
      google.maps.event.addListener(dirrenderer, 'directions_changed', function() {
        computeTotals(dirrenderer.directions);
      });
    }

    dirservice = new google.maps.DirectionsService();

    if (fromlatlon && tolatlon) {
      setDirectionsfromto(fromlatlon, tolatlon);
    }

    if (latlons) {
      setDirectionsvia(latlons);
    }
  } // end initialise

  Drupal.getdirections.toggleTraffic = function() {
    if (traffictoggleState == 1) {
      trafficInfo.setMap();
      traffictoggleState = 0;
    }
    else {
      trafficInfo.setMap(map);
      traffictoggleState = 1;
    }
  }

  Drupal.getdirections.toggleBicycle = function() {
    if (bicycletoggleState == 1) {
      bicycleInfo.setMap();
      bicycletoggleState = 0;
    }
    else {
      bicycleInfo.setMap(map);
      bicycletoggleState = 1;
    }
  }
  Drupal.getdirections.togglePanoramio = function() {
    if (panoramiotoggleState == 1) {
      panoramioLayer.setMap();
      panoramiotoggleState = 0;
    }
    else {
      panoramioLayer.setMap(map);
      panoramiotoggleState = 1;
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

  // gogogo
  Drupal.behaviors.getdirections = {
    attach: function() {
      initialize();
    }
  };

})(jQuery);
