var map = L.map('map');
var popup = L.popup();

//Extend the Default marker class
var RedIcon = L.Icon.Default.extend({
    options: {
        iconUrl: 'icons/marker-icon-red.png'
    }
});
var redIcon = new RedIcon();

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
    '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
    'Imagery © <a href="http://mapbox.com">Mapbox</a>',
    id: 'kadamski.fdf4f254',
    accessToken: 'pk.eyJ1Ijoia2FkYW1za2kiLCJhIjoiZDVhNjc1NTMyMzJlOGE1ZWI1MTgxNmE1NzgxNTJjMDgifQ.UpK8P0rxyMBnRXySUVLDDA'
}).addTo(map);

var currentMarker = null;

function onLocationFound(e) {
    if (currentMarker) {
        map.removeLayer(currentMarker);
    } else {
        map.setView(e.latlng);
        map.setZoom(17);
        var map_el = $('#map_content');
        var footer = $('#footer');
        map_el.height(map_el.height() - footer.height() - 3);
        map.invalidateSize();
    }
    currentMarker = L.marker(e.latlng, {icon: redIcon}).addTo(map);
}

function onLocationError(e) {
    alert(e.message);
}

function generateCookie(latlng, distance) {
    var cn = ""+latlng.lat+latlng.lng;
    window.localStorage.setItem(cn, latlng.lat+";"+latlng.lng+";"+distance);
    return cn;
}

function parseCookie(cookie) {
    if (cookie == null) {
        return null;
    }
    return cookie.split(";");
}

function addMarker(latlng, distance) {
    if (distance == 0) {
        return;
    }

    var o = L.marker(latlng).addTo(map).on('click', onMarkerClick);
    var c = L.circle(latlng, distance).addTo(map);
    o.circle = c;
    o.cookie = generateCookie(latlng, distance);
}

function removeMarker(obj) {
    map.removeLayer(obj.circle);
    map.removeLayer(obj);
    window.localStorage.removeItem(obj.cookie);
}

function updateMarker(obj, distance) {
    var c = parseCookie(window.localStorage.getItem(obj.cookie));
    if (c) {
        window.localStorage.removeItem(obj.cookie);
        obj.cookie = generateCookie(L.latLng(c[0], c[1]), distance);
    }
    obj.circle.setRadius(distance);
}

function onMarkerClick(e) {
    if (e.target.circle == undefined) {
        return;
    }

    $("#point_popup_lat").val(e.latlng.lat);
    $("#point_popup_lng").val(e.latlng.lng);
    $("#point_popup_distance").val(e.target.circle._mRadius);
    $("#point_popup").get(0)._target = e.target;

    $("#point_popup").popup("open", "");
}

function onMapClick(e) {
    $("#point_popup_lat").val(e.latlng.lat);
    $("#point_popup_lng").val(e.latlng.lng);
    $("#point_popup_distance").val("");
    $("#point_popup").get(0)._target = null;
    $("#point_popup").popup("open", "");
}

function popup_click() {
    var distance = $("#point_popup_distance").val();
    var lat = $("#point_popup_lat").val();
    var lng = $("#point_popup_lng").val();
    var target = $("#point_popup").get(0)._target;

    if (target == null && distance != 0) {
        addMarker(L.latLng(lat, lng), distance);
    } else if (target) {
        if (distance == 0) {
            removeMarker(target);
        } else {
            updateMarker(target, distance);
        }
    }
    $("#point_popup").popup("close", "");
}

function set_buttons() {
    $("#point_popup").get(0)._target = null;

    $("#point_popup_cancel").click(function() {
        $("#point_popup").popup("close", "");
    });

    $("#point_popup_ok").click(popup_click);
    $("#point_popup_form").submit(function(e) {
        e.preventDefault();
        popup_click();
        return false;
    });
}

function initialize() {
    for (i = 0; i < window.localStorage.length; i++) {
        cn = window.localStorage.key(i);
        console.log(cn);
        c = parseCookie(window.localStorage.getItem(cn));
        console.log(c);
        if (isNaN(c[0]) || isNaN(c[1]) || isNaN(c[2], 10)) {
            console.log("remove");
            window.localStorage.removeItem(cn);
        } else {
            addMarker(L.latLng(c[0], c[1]), c[2]);
        }
    }

    set_buttons();
}

map.on('click', onMapClick);
map.on('locationfound', onLocationFound);
map.on('locationerror', onLocationError);

map.locate({maxZoom: 13, watch: true, enableHighAccuracy: true});

initialize();
