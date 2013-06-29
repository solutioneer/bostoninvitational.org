
/**
 * @file
 * Javascript functions for getdirections module
 *
 * @author Bob Hutchinson http://drupal.org/user/52366
 * code derived from gmap_direx module
 * this is for googlemaps API version 3
 * with adaptations from econym.org.uk
*/
(function ($) {
  Drupal.getdirections = {};

  var geocoder;
  var bounds;
  var map;
  var trafficInfo;
  var bicycleInfo;
  var traffictoggleState = 1;
  var bicycletoggleState = 1;

  var panoramioLayer;
  var panoramiotoggleState = 1;

  var path = [];
  var active = [];
  var gmarkers = [];
  var addresses = [];
  var donemarkers = [];

  var state = 0;
  var llpatt = /[0-9.\-],[0-9.\-]/;
  var fromdone = false;
  var todone = false;
  var waypoints = 0;
  var startpoint = 0;
  var endpoint = 1;

  var dirservice;
  var dirrenderer;
  var unitsys;
  var scheme = 'http';
  var startIconUrl = scheme + "://www.google.com/mapfiles/dd-start.png";
  var endIconUrl = scheme + "://www.google.com/mapfiles/dd-end.png";
  var shadowIconUrl = scheme + "://www.google.com/mapfiles/shadow50.png"
  var pauseIconUrl = scheme + "://www.google.com/mapfiles/dd-pause.png";
  var viaIconUrl = scheme + "://labs.google.com/ridefinder/images/mm_20_";
  var viaIconColor = '';

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

  function getgeoerrcode(errcode) {
    var errstr;
    if (errcode == google.maps.GeocoderStatus.ERROR) {
      errstr = Drupal.t("There was a problem contacting the Google servers.");
    }
    else if (errcode == google.maps.GeocoderStatus.INVALID_REQUEST) {
      errstr = Drupal.t("This GeocoderRequest was invalid.");
    }
    else if (errcode == google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
      errstr = Drupal.t("The webpage has gone over the requests limit in too short a period of time.");
    }
    else if (errcode == google.maps.GeocoderStatus.REQUEST_DENIED) {
      errstr = Drupal.t("The webpage is not allowed to use the geocoder.");
    }
    else if (errcode == google.maps.GeocoderStatus.UNKNOWN_ERROR) {
      errstr = Drupal.t("A geocoding request could not be processed due to a server error. The request may succeed if you try again.");
    }
    else if (errcode == google.maps.GeocoderStatus.ZERO_RESULTS) {
      errstr = Drupal.t("No result was found for this GeocoderRequest.");
    }
    return errstr;
  }

// from the form
  Drupal.getdirections.mygetDirections = function() {

    var from;
    var to;
    var i;
    var waypts = [];
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
        waypts.push({
          location: path[i].toUrlValue(6),
          stopover: true
        });
        gmarkers[i].setMap(null);
      }
    }
    // remove the moveable markers
    if (gmarkers[startpoint].getVisible()) {
      gmarkers[startpoint].setMap(null);
    }
    if (gmarkers[endpoint].getVisible()) {
      gmarkers[endpoint].setMap(null);
    }

    var request = getRequest(from, to, waypts);
    renderdirections(request);

    // disable to and from boxes
    $("#edit-from").attr('disabled', true);
    $("#edit-to").attr('disabled', true);
  }

  // convert lat,lon into LatLng object
  function makell(ll) {
    if (ll.match(llpatt)) {
      var arr = ll.split(",");
      var d = new google.maps.LatLng(parseFloat(arr[0]), parseFloat(arr[1]));
      return d;
    }
    return false;
  }

  function renderdirections(request) {
    dirservice.route(request, function(response, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        dirrenderer.setDirections(response);
      } else {
        alert(Drupal.t('Error') + ': ' + getdirectionserrcode(status));
      }
    });
  }

  function getRequest(fromAddress, toAddress, waypts) {
    var trmode;
    var request = {
      origin: fromAddress,
      destination: toAddress
    };

    var tmode = $("#edit-travelmode").val();
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
  } // end getRequest

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

    function handleState() {
      var e;
      var point;
      if (! todone) {
        e = $("input[name=to]").val();
        if (e && e.match(llpatt)) {
          arr = e.split(",");
          point = new google.maps.LatLng(arr[0], arr[1]);
          createMarker(point, endpoint, 'end');
          path[endpoint] = point;
          if (donemarkers[startpoint] == false) {
            map.panTo(path[endpoint]);
          }
          todone = true;
        }
      }

      if (! fromdone) {
        e = $("input[name=from]").val();
        if (e && e.match(llpatt)) {
          arr = e.split(",");
          point = new google.maps.LatLng(arr[0], arr[1]);
          createMarker(point, startpoint, 'start');
          path[startpoint] = point;
          if (donemarkers[endpoint] == false) {
            map.panTo(path[startpoint]);
          }
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

    // t is type eg start, end, via or pause
    function createMarker(point, i, t) {
      // stop these from being recreated
      if ( (t == 'start' && donemarkers[startpoint] == true) || (t == 'end' && donemarkers[endpoint] == true)) {
        return;
      }

      var marker;
      if (t == 'via') {
        // via marker has special needs
        marker = new google.maps.Marker({
          position: point,
          map: map,
          title: 'Via ' +i,
          icon: icon4,
          shadow: shadow4,
          shape: shape4,
          draggable: true
        });
      }
      else {
        marker = new google.maps.Marker({
          position: point,
          map: map,
          title: (t == 'start' ? 'From' : (t == 'end' ? 'To'  : 'via ' + i)),
          icon:  (t == 'start' ? icon1  : (t == 'end' ? icon3 : icon2)),
          shadow: shadow1,
          shape: shape1,
          draggable: true
        });
      }

      gmarkers[i] = marker;
      google.maps.event.addListener(marker, "dragend", function() {
        path[i] = marker.getPosition();
        map.panTo(path[i]);
        if (! active[i]) {
          swapMarkers(i);
          active[i] = true;
        }
        addresses[i] = "";
      });

      marker.setMap(map);

      // mark as done
      if (t == 'start') {
        donemarkers[startpoint] = true;
      }
      else if (t == 'end') {
        donemarkers[endpoint] = true;
      }
    } // end createMarker

    function swapMarkers(i) {
      gmarkers[i].setMap(null);
      createMarker(path[i], i, 'pause');
    }

    function doStart(point) {
      createMarker(point, startpoint, 'start');
      path[startpoint] = point;
      state = 1;
      handleState();
    }

    function doEnd(point) {
      createMarker(point, endpoint, 'end');
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
        var p = new google.maps.LatLng(lat,lng);
        createMarker(p, i, 'via');
        path[i] = p;
      }
    }

    function setendbounds() {
      bounds.extend(path[startpoint]);
      bounds.extend(path[endpoint]);
      map.fitBounds(bounds);
    }

    // Geocoding
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
      var r = {address: s};
      geocoder.geocode(r, function (results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          // do stuff
          // get the point
          point = results[0].geometry.location;
          if (point) {
            if (state == 1) {
              doEnd(point);
            }
            if (state == 0) {
              doStart(point);
              //if (donemarkers[endpoint] == false) {
              if (! todone) {
                map.panTo(point);
              }
            }
          }
        } else {
            alert(Drupal.t('Geocode for @address was not successful for the following reason: @reason', {'@address':address, '@reason':getgeoerrcode(status)}));
        }
      });
    }


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
    viaIconColor = (Drupal.settings.getdirections.waypoint_color ? Drupal.settings.getdirections.waypoint_color : 'white');
    if (Drupal.settings.getdirections.use_https) {
      scheme = 'https';
      startIconUrl = scheme + "://www.google.com/mapfiles/dd-start.png";
      endIconUrl = scheme + "://www.google.com/mapfiles/dd-end.png";
      shadowIconUrl = scheme + "://www.google.com/mapfiles/shadow50.png"
      pauseIconUrl = scheme + "://www.google.com/mapfiles/dd-pause.png";
      viaIconUrl = scheme + "://labs.google.com/ridefinder/images/mm_20_";
    }

    waypoints = (Drupal.settings.getdirections.waypoints ? Drupal.settings.getdirections.waypoints : 0);
    if (waypoints) {
      endpoint = waypoints + 1;
      active[startpoint] = true;
      donemarkers[startpoint] = false;
      for (var i = 1; i <= waypoints; i++) {
        active[i] = false;
        donemarkers[i] = false;
      }
      active[endpoint] = true;
      donemarkers[endpoint] = false;
    }
    else {
      active[startpoint] = true;
      active[endpoint] = true;
      donemarkers[startpoint] = false;
      donemarkers[endpoint] = false;
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

    google.maps.event.addListener(map, 'click', function(event) {
      if (event.latLng) {
        point = new google.maps.LatLng(event.latLng.lat(), event.latLng.lng());
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

    // define some icons
    var icon1 = new google.maps.MarkerImage(
      startIconUrl,
      new google.maps.Size(22, 34),
      // origin
      new google.maps.Point(0,0),
      // anchor
      new google.maps.Point(6, 20)
    );
    var icon2 = new google.maps.MarkerImage(
      pauseIconUrl,
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
    var icon4 = new google.maps.MarkerImage(
      viaIconUrl + viaIconColor + '.png',
      new google.maps.Size(12, 20),
      // origin
      new google.maps.Point(0,0),
      // anchor
      new google.maps.Point(6, 20)
    );
    var shadow4 = new google.maps.MarkerImage(
      viaIconUrl + "shadow.png",
      new google.maps.Size(22, 20),
      // origin
      new google.maps.Point(0,0),
      // anchor
      new google.maps.Point(6, 20)
    );
    var shape4 = {coord: [1,1,12,20], type: 'rect'};

    dirrenderer = new google.maps.DirectionsRenderer();
    dirrenderer.setMap(map);
    dirrenderer.setPanel(document.getElementById("getdirections_directions"));

    if (Drupal.settings.getdirections.show_distance || Drupal.settings.getdirections.show_duration) {
      google.maps.event.addListener(dirrenderer, 'directions_changed', function() {
        computeTotals(dirrenderer.directions);
      });
    }

    dirservice = new google.maps.DirectionsService();

    // Create a Client Geocoder
    geocoder = new google.maps.Geocoder();

    // Bounding
    bounds = new google.maps.LatLngBounds();

    handleState();

    // any initial markers?
    var vf =  $("input[name=from]").val();
    if (vf && vf.match(llpatt)) {
      // we have lat,lon
      vf = makell(vf);
      createMarker(vf, startpoint, 'start');
      if ( donemarkers[endpoint] == false) {
        map.setCenter(vf);
      }
    }
    var vt =  $("input[name=to]").val();
    if (vt && vt.match(llpatt)) {
      // we have lat,lon
      vt = makell(vt);
      createMarker(vt, endpoint, 'end');
      if ( donemarkers[startpoint] == false) {
        map.setCenter(vt);
      }
    }

    if (fromlatlon && tolatlon) {
      setDirectionsfromto(fromlatlon, tolatlon);
    }

    if (latlons) {
      setDirectionsvia(latlons);
    }

    // minding textfields
    if (Drupal.settings.getdirections.advanced_autocomplete) {
      if ($("#edit-from").is("input.form-text")) {
        var input_from = document.getElementById('edit-from');
        var ac_from = new google.maps.places.Autocomplete(input_from);
        google.maps.event.addListener(ac_from, 'place_changed', function() {
          var place_from = ac_from.getPlace();
          $("#edit-from").val(place_from.formatted_address);
          showAddress();
        });
      }
      if ($("#edit-to").is("input.form-text")) {
        var input_to = document.getElementById('edit-to');
        var ac_to = new google.maps.places.Autocomplete(input_to);
        google.maps.event.addListener(ac_to, 'place_changed', function() {
          var place_to = ac_to.getPlace();
          $("#edit-to").val(place_to.formatted_address);
          showAddress();
        });
      }
    }
    else {
      $("#edit-from").change( function() {
        showAddress();
      });
      $("#edit-to").change( function() {
        showAddress();
      });
    }

  } // end initialise

  Drupal.getdirections.nextbtn = function() {
    return;
  }

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

  // gogogo
  Drupal.behaviors.getdirections = {
    attach: function() {
      initialize();
    }
  };

})(jQuery);
