const API_URL = "https://nguyenltvinh-github-io-proxy.vercel.app";
// for local development
// const API_URL = 'http://localhost:3000';

let markers = [];

function loadMapScript() {
  const script = document.createElement("script");
  script.src = `${API_URL}/api/maps/js?callback=initMap`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

window.initMap = function () {
  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 12,
    center: { lat: 44.975, lng: -93.23 },
  });
  // @ts-ignore
  window.myMap = map;
  if (document.querySelector("#places-list")) {
    initializeMarkers(map);
  }
};

function clearMarkers() {
  markers.forEach((marker) => marker.setMap(null));
  markers = [];
}

function initializeMarkers(map) {
  clearMarkers();

  document.querySelectorAll("#places-list li").forEach(async (li) => {
    const address = li.getAttribute("data-address");
    console.log(address);

    try {
      const response = await fetch(
        `${API_URL}/api/geocode?address=${encodeURIComponent(address)}`,
      );
      const { lat, lng } = await response.json();
      console.log(`Coordinates for ${address}:`, lat, lng);

      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: map,
        title: li.querySelector("a").textContent,
      });

      markers.push(marker);

      const infoWindow = new google.maps.InfoWindow();

      const markerAddress = address;

      marker.addListener("click", () => {
        const currentLi = document.querySelector(
          `#places-list li[data-address="${markerAddress}"]`,
        );

        if (currentLi) {
          const title = currentLi.querySelector("a").textContent;
          const description = currentLi.textContent.split("—")[1]?.trim() || "";

          infoWindow.setContent(`
            <div style="max-width: 250px; padding: 8px; color: #333; font-family: Arial, sans-serif;">
              <h4 style="margin: -10px 0 8px 0; color: #000; font-size: 16px; font-weight: bold;">${title}</h4>
              <p style="margin: 0; color: #333; font-size: 14px; line-height: 1.4;">${description}</p>
            </div>
          `);

          infoWindow.open(map, marker);
        }
      });
    } catch (error) {
      console.error(`Error fetching coordinates for ${address}:`, error);
    }
  });
}

window.addEventListener("mainContentUpdated", () => {
  // @ts-ignore
  if (window.myMap) {
    // @ts-ignore
    initializeMarkers(window.myMap);
  }
});

window.addEventListener("DOMContentLoaded", () => {
  loadMapScript();
});
