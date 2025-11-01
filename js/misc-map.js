const miscMap = new MapManager({
  apiUrl: "https://nguyenltvinh-github-io-proxy.vercel.app",
  // For local dev: apiUrl: "http://localhost:3000",
  mapId: "map",
  listSelector: "#places-list li",
  addressAttribute: "data-address",
  zoom: 12,
  center: { lat: 44.975, lng: -93.23 },
});

window.addEventListener("DOMContentLoaded", () => {
  miscMap.init();
});

window.addEventListener("mainContentUpdated", () => {
  miscMap.refresh();
});
