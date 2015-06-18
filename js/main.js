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

    var distance = prompt("Distance in meters", e.target.circle._mRadius);
    if (distance == null) {
        return;
    }
    if (distance == 0) {
        removeMarker(e.target);
    } else {
        updateMarker(e.target, distance);
    }
}

function onMapClick(e) {
    var distance = prompt("Distance in meters");
    if (distance == null) {
        return;
    }

    addMarker(e.latlng, distance);
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
}

map.on('click', onMapClick);
map.on('locationfound', onLocationFound);
map.on('locationerror', onLocationError);

map.locate({maxZoom: 13, watch: true, enableHighAccuracy: true});

initialize();
