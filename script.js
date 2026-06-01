const geojsonPath = 'data.geojson';

const map = L.map('map', {
    dragging: false,       // Disables panning/dragging
    touchZoom: false,      // Disables pinch-to-zoom (mobile)
    scrollWheelZoom: false,// Disables scroll-to-zoom
    doubleClickZoom: false,// Disables double-click-to-zoom
    boxZoom: false,        // Disables shift-drag box zoom
    keyboard: false,        // Disables keyboard panning
    zoomControl: false,     // Disables the zoom control UI
    attributionControl: false // Disables the attribution control
}).setView([44.92, -93.182], 12);

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
                // Create elements for the arrival card
                const arrivalCard = document.createElement('div');
                const arrivalText = document.createElement('p');
                const arrivalDescription = document.createElement('p');
                const arrivalTime = document.createElement('p');

                // Set the text content for each element
                const routeText = document.createTextNode(result.departures[i].route_short_name);
                const descriptionText = document.createTextNode(result.departures[i].description);
                const timeText = document.createTextNode(result.departures[i].departure_text);

                // Append the text nodes to the respective elements
                arrivalText.appendChild(routeText);
                arrivalDescription.appendChild(descriptionText);
                arrivalTime.appendChild(timeText);

                // Append the elements to the arrival card and add a class for styling
                arrivalCard.classList.add('arrival-card');
                arrivalCard.appendChild(arrivalText);
                arrivalCard.appendChild(arrivalDescription);
                arrivalCard.appendChild(arrivalTime);

                document.querySelector('.arrivals').appendChild(arrivalCard);
        };
    } catch (error) {
        console.error(error.message);
    }
}

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

refresh();

function refresh() {
    console.log("Refreshing...");
    const arrivals = document.getElementById("arrivals");
    arrivals.replaceChildren();
    getArrivals(991, 1, "38HI");
    getArrivals(991, 0, "38HI");
    try {
        vehicleLayer.clearLayers();
    } catch (error) {
        console.error(error.message);
    }
    getVehicleData(901);
    getVehicleData(991);
    getVehicleData(902);
}

const refreshInterval = setInterval(refresh, 15000);