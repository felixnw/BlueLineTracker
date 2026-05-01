const geojsonPath = 'data.geojson';

const map = L.map('map').setView([44.95, -93.25], 10);

const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);


//Get Upcoming Arrivals
async function getArrivals(route,direction,place) {
    const url = `https://svc.metrotransit.org/nextrip/${route}/${direction}/${place}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
        }

        const result = await response.json();
        console.log(result.departures);
        for (let i = 0; i < 3 && i < result.departures.length; i++) {
            console.log(result)
            console.log(result.departures[i].route_short_name, result.departures[i].description, result.departures[i].departure_text);
                const arrivalLine = document.createElement('p');
                const arrivalData = document.createTextNode(`${result.departures[i].route_short_name} - ${result.departures[i].description} - ${result.departures[i].departure_text}`);
                arrivalLine.appendChild(arrivalData);
                document.querySelector('.arrivals').appendChild(arrivalLine);
        };
    } catch (error) {
        console.error(error.message);
    }
}

getArrivals(901, 1, "38HI");
getArrivals(901, 0, "38HI");

//Initialize Layer Groups
var routeLayer = L.layerGroup().addTo(map);
var stopLayer = L.layerGroup().addTo(map);
var vehicleLayer = L.layerGroup().addTo(map);

//Plot Routes and Stops on the Map
fetch(geojsonPath)
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data, {
            filter: function(feature) {
                if (feature.geometry.type === "MultiLineString") {
                    // return feature
                    return feature.properties.route_id === "901" || feature.properties.route_id === "902";
                }

                if (feature.geometry.type === "Point") {
                    return feature.properties.routes && feature.properties.routes.some(r =>
                        // r.route_id 
                        r.route_id === "901" || r.route_id === "902"
                    );
                }
            },
            pointToLayer: function (feature, latlng) {
                var newStop = L.circleMarker(latlng, {
                    radius: 3,
                    fillColor: "white",
                    color: "#000",
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8
                });
                return stopLayer.addLayer(newStop);
            },
            style: function(feature) {
                if (feature.geometry.type === "MultiLineString") {
                    return {
                        color: feature.properties.route_color,
                        weight: 5
                    };
                }
            },
            onEachFeature: function(feature, layer) {
                if (feature.geometry.type === "MultiLineString") {
                    layer.addTo(routeLayer);
                }
            }
        });
    })
    .catch(error => console.error('Error loading the GeoJSON:', error));

//Plot Live Vehicles on the Map
async function getVehicleData(routeId) {
    const url = `https://svc.metrotransit.org/nextrip/vehicles/${routeId}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
        }

        const result = await response.json();
        // console.log(result);
        // result.forEach((element) => console.log(element));
        result.forEach(e => {
            var newVehicle = L.circleMarker([e.latitude, e.longitude], {
                radius: 5,
                fillColor: "white",
                color: "red",
                weight: 2,
                opacity: 1,
                fillOpacity: 1
            });
            vehicleLayer.addLayer(newVehicle);
        });
    } catch (error) {
        console.error(error.message);
    }
}

getVehicleData(901);
getVehicleData(902);

function refresh() {
    console.log("Refreshing...");
    const arrivals = document.getElementById("arrivals");
    arrivals.replaceChildren();
    getArrivals(901, 1, "38HI");
    getArrivals(901, 0, "38HI");
    vehicleLayer.clearLayers();
    getVehicleData(901);
    getVehicleData(902);
}

const refreshInterval = setInterval(refresh, 15000);