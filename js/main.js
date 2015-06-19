var COLORS = ['blue', 'red', 'yellow', 'black', 'green', 'orange', 'violet', 'brown', 'grey', 'navy', 'darkred', 'pink'];
var color_stats = {};
var LABELS = {};

var map = L.map('map');
var popup = L.popup();
var legend = null;

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

function generateCookie(latlng, distance, label) {
    var cn = ""+latlng.lat+latlng.lng;
    window.localStorage.setItem(cn, latlng.lat+";"+latlng.lng+";"+distance+";"+label);
    return cn;
}

function parseCookie(cookie) {
    if (cookie == null) {
        return null;
    }
    return cookie.split(";");
}

function put_color(label) {
    if (LABELS[label] == undefined) {
        return;
    }

    color_stats[LABELS[label].color] = LABELS[label].cnt-1;

    if (LABELS[label].cnt-- <= 1) {
        delete(LABELS[label]);
    }

}

function next_avail_color() {
    for (var i = 0; i < COLORS.length; i++) {
        var c = COLORS[i];
        if (color_stats[c] == undefined || color_stats[c] == 0) {
            return i;
        }
    }

    return null;
}

function get_color(label) {
    if (LABELS[label] == undefined) {
        var index = next_avail_color();
        if (index != null) {
            console.log("Added label " + label + ", color: " + COLORS[index]);
            LABELS[label] = {'color': COLORS[index], 'cnt': 0};
            color_stats[COLORS[index]] = 0;
        } else {
            console.log("NOT ENOUGH COLORS");
            return null;
        }
    }

    LABELS[label].cnt++;
    color_stats[LABELS[label].color] = LABELS[label].cnt;

    return LABELS[label].color;
}

function addMarker(latlng, distance, label) {
    console.log("Add marker " + label);
    if (distance == 0) {
        return;
    }

    var options = {color: get_color(label)};

    var o = L.marker(latlng).addTo(map).on('click', onMarkerClick);
    var c = L.circle(latlng, distance, options).addTo(map);
    c._label = label;
    o.circle = c;
    o.cookie = generateCookie(latlng, distance, label);
    update_legend();
}

function removeMarker(obj) {
    map.removeLayer(obj.circle);
    map.removeLayer(obj);
    put_color(obj.circle._label);
    window.localStorage.removeItem(obj.cookie);
    update_legend();
}

function updateMarker(obj, distance, label) {
    var c = parseCookie(window.localStorage.getItem(obj.cookie));
    if (c) {
        window.localStorage.removeItem(obj.cookie);
        obj.cookie = generateCookie(L.latLng(c[0], c[1]), distance, label);
    }
    obj.circle.setRadius(distance);
    obj.circle.setStyle({color: get_color(label)});
    obj.circle._label = label;
    update_legend();
}

function onMarkerClick(e) {
    if (e.target.circle == undefined) {
        return;
    }

    $("#point_popup_header").html("Edit point");
    $("#point_popup_lat").val(e.latlng.lat);
    $("#point_popup_lng").val(e.latlng.lng);
    $("#point_popup_distance").val(e.target.circle._mRadius);
    $("#point_popup_label").val(e.target.circle._label);
    $("#point_popup").get(0)._target = e.target;

    $("#point_popup").popup("open", "");
}

function onMapClick(e) {
    $("#point_popup_header").html("Add point");
    $("#point_popup_lat").val(e.latlng.lat);
    $("#point_popup_lng").val(e.latlng.lng);
    $("#point_popup_distance").val("");
    $("#point_popup_label").val("");
    $("#point_popup").get(0)._target = null;
    $("#point_popup").popup("open", "");
}

function popup_click() {
    var distance = $("#point_popup_distance").val();
    var lat = $("#point_popup_lat").val();
    var lng = $("#point_popup_lng").val();
    var label = $("#point_popup_label").val();
    var target = $("#point_popup").get(0)._target;

    if (target == null && distance != 0) {
        addMarker(L.latLng(lat, lng), distance, label);
    } else if (target) {
        if (distance == 0) {
            removeMarker(target);
        } else {
            updateMarker(target, distance, label);
        }
    }
    $("#point_popup").popup("close", "");
}

function set_buttons() {
    $("#point_popup").get(0)._target = null;

    $("#point_popup_cancel").click(function() {
        $("#point_popup").popup("close", "");
    });

    $("#point_popup_form").submit(function(e) {
        e.preventDefault();
        popup_click();
        return false;
    });
}

function update_legend() {
    if (legend == null) {
        legend = L.control({position: 'bottomright'});
        legend.onAdd = function (map) {

            var div = L.DomUtil.create('div', 'info legend');

            // loop through our density intervals and generate a label with a colored square for each interval
            for (label in LABELS) {
            // for (var i = 0; i < LABELS.length; i++) {
                div.innerHTML +=
                    '<i style="background:' + LABELS[label].color + '"></i> ' + label + " (" + LABELS[label].cnt + ")<br>";
            }

            return div;
        };

        legend.addTo(map);
    } else {
        legend.removeFrom(map);
        legend.addTo(map);
    }
}

function initialize() {
    for (var i = 0; i < window.localStorage.length; i++) {
        cn = window.localStorage.key(i);
        c = parseCookie(window.localStorage.getItem(cn));
        console.log(c);
        if (isNaN(c[0]) || isNaN(c[1]) || isNaN(c[2], 10)) {
            console.log("remove");
            window.localStorage.removeItem(cn);
        } else {
            addMarker(L.latLng(c[0], c[1]), c[2], c[3]);
        }
    }

    set_buttons();
    update_legend();
}

map.on('click', onMapClick);
map.on('locationfound', onLocationFound);
map.on('locationerror', onLocationError);

map.locate({maxZoom: 13, watch: true, enableHighAccuracy: true});

initialize();
