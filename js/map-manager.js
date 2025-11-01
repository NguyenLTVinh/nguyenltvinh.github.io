class MapManager {
  constructor(config) {
    this.apiUrl =
      config.apiUrl || "https://nguyenltvinh-github-io-proxy.vercel.app";
    this.mapId = config.mapId || "map";
    this.listSelector = config.listSelector || "#places-list li";
    this.addressAttribute = config.addressAttribute || "data-address";
    this.zoom = config.zoom || 12;
    this.center = config.center || { lat: 44.975, lng: -93.23 };
    this.contentParser = config.contentParser || this.defaultContentParser;
    this.infoWindowStyle =
      config.infoWindowStyle || this.defaultInfoWindowStyle;

    this.markers = [];
    this.map = null;
    this.isScriptLoaded = false;
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

  loadMapScript() {
    if (this.isScriptLoaded) return;

    const script = document.createElement("script");
    script.src = `${this.apiUrl}/api/maps/js?callback=initMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    this.isScriptLoaded = true;
  }

  initMap() {
    const mapElement = document.getElementById(this.mapId);
    if (!mapElement) {
      console.error(`Map element with id "${this.mapId}" not found`);
      return;
    }

    this.map = new google.maps.Map(mapElement, {
      zoom: this.zoom,
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

      console.log(`Geocoding address: ${address}`);

      try {
        const response = await fetch(
          `${this.apiUrl}/api/geocode?address=${encodeURIComponent(address)}`,
        );
        const { lat, lng } = await response.json();
        console.log(`Coordinates for ${address}:`, lat, lng);

        const { title } = this.contentParser(li);

        const marker = new google.maps.Marker({
          position: { lat, lng },
          map: this.map,
          title: title,
        });

        this.markers.push(marker);

        const infoWindow = new google.maps.InfoWindow();
        const markerAddress = address;
        const parser = this.contentParser;
        const styleFunc = this.infoWindowStyle;
        const listSelector = this.listSelector.split(" ")[0];
        const addressAttr = this.addressAttribute;

        marker.addListener("click", () => {
          const currentLi = document.querySelector(
            `${listSelector} [${addressAttr}="${markerAddress}"]`,
          );

          if (currentLi) {
            const { title, description } = parser(currentLi);
            infoWindow.setContent(styleFunc(title, description));
            infoWindow.open(this.map, marker);
          }
        });
      } catch (error) {
        console.error(`Error fetching coordinates for ${address}:`, error);
      }
    }
  }

  refresh() {
    if (this.map) {
      this.initializeMarkers();
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
