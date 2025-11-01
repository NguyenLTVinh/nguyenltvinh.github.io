class MapManager {
  constructor(config) {
    this.apiUrl =
      config.apiUrl || "https://nguyenltvinh-github-io-proxy.vercel.app";
    this.mapId = config.mapId || "map";
    this.listSelector = config.listSelector || "#places-list li";
    this.addressAttribute = config.addressAttribute || "data-address";
    this.zoom = config.zoom || 12;
    this.mobileZoom = config.mobileZoom || 11;
    this.center = config.center || { lat: 44.975, lng: -93.23 };
    this.contentParser = config.contentParser || this.defaultContentParser;
    this.infoWindowStyle =
      config.infoWindowStyle || this.defaultInfoWindowStyle;

    this.markers = [];
    this.map = null;
    this.isScriptLoaded = false;
    this.geocodeCache = new Map();
    this.markerCache = new Map();
  }

  defaultContentParser(listItem) {
    const title = listItem.querySelector("a")?.textContent || "";
    const description = listItem.textContent.split("—")[1]?.trim() || "";
    return { title, description };
  }

  defaultInfoWindowStyle(title, description) {
    return `
      <div style="max-width: 250px; padding: 8px; color: #333; font-family: Arial, sans-serif;">
        <h4 style="margin: -10px 0 8px 0; color: #000; font-size: 16px; font-weight: bold;">${title}</h4>
        <p style="margin: 0; color: #333; font-size: 14px; line-height: 1.4;">${description}</p>
      </div>
    `;
  }

  async loadMapScript() {
    if (this.isScriptLoaded) return;

    try {
      const configResponse = await fetch(`${this.apiUrl}/api/config`);
      const { mapsApiKey } = await configResponse.json();
      this.mapsApiKey = mapsApiKey;

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.mapsApiKey}&callback=initMap`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      this.isScriptLoaded = true;
    } catch (error) {
      console.error("Failed to load map script:", error);
    }
  }

  initMap() {
    const mapElement = document.getElementById(this.mapId);
    if (!mapElement) {
      console.error(`Map element with id "${this.mapId}" not found`);
      return;
    }

    const isMobile = window.matchMedia(
      "only screen and (max-width: 768px)",
    ).matches;
    const zoomLevel = isMobile ? this.mobileZoom : this.zoom;

    this.map = new google.maps.Map(mapElement, {
      zoom: zoomLevel,
      center: this.center,
    });

    if (document.querySelector(this.listSelector)) {
      this.initializeMarkers();
    }
  }

  clearMarkers() {
    this.markers.forEach((marker) => marker.setMap(null));
    this.markers = [];
  }

  async initializeMarkers() {
    this.clearMarkers();
    const listItems = document.querySelectorAll(this.listSelector);
    for (const li of listItems) {
      const address = li.getAttribute(this.addressAttribute);
      if (!address) continue;

      let coords = this.geocodeCache.get(address);
      if (!coords) {
        try {
          const response = await fetch(
            `${this.apiUrl}/api/geocode?address=${encodeURIComponent(address)}`,
          );
          coords = await response.json();
          this.geocodeCache.set(address, coords);
        } catch (error) {
          console.error(`Error fetching coordinates for ${address}:`, error);
          continue;
        }
      }

      let marker = this.markerCache.get(address);
      if (!marker) {
        const { title } = this.contentParser(li);
        marker = new google.maps.Marker({
          position: { lat: coords.lat, lng: coords.lng },
          map: this.map,
          title: title,
        });
        this.markerCache.set(address, marker);
        this.markers.push(marker);

        const infoWindow = new google.maps.InfoWindow();
        marker.addListener("click", () => {
          const currentLi = document.querySelector(
            `${this.listSelector.split(" ")[0]} [${this.addressAttribute}="${address}"]`,
          );
          if (currentLi) {
            const { title, description } = this.contentParser(currentLi);
            infoWindow.setContent(this.infoWindowStyle(title, description));
            infoWindow.open(this.map, marker);
          }
        });
      }
    }
  }

  refresh() {
    if (this.map) {
      this.markers.forEach((marker) => {
        const address = marker.getTitle();
        const li = document.querySelector(
          `${this.listSelector.split(" ")[0]} [${this.addressAttribute}="${address}"]`,
        );
        if (li) {
          const { title, description } = this.contentParser(li);
          const infoWindow = new google.maps.InfoWindow({
            content: this.infoWindowStyle(title, description),
          });
          marker.addListener("click", () => {
            infoWindow.open(this.map, marker);
          });
        }
      });
    }
  }

  init() {
    window.initMap = () => this.initMap();
    this.loadMapScript();
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = MapManager;
}
