export function initProject2() {
  const main = document.querySelector("main");
  if (!main) return;

  main.querySelectorAll("img").forEach((img) => {
    img.replaceWith(img.cloneNode(true));
  });

  main.querySelectorAll("img").forEach((img) => {
    img.addEventListener("click", () => {
      if (img.classList.contains("zoomed")) {
        img.classList.remove("zoomed");
        img.style.width = "";
        img.style.height = "";
      } else {
        img.classList.add("zoomed");

        const vw = window.innerWidth * 0.95;
        const vh = window.innerHeight * 0.95;
        const imgRatio = img.naturalWidth / img.naturalHeight;
        const screenRatio = vw / vh;

        if (imgRatio > screenRatio) {
          img.style.width = vw + "px";
          img.style.height = "auto";
        } else {
          img.style.width = "auto";
          img.style.height = vh + "px";
        }
      }
    });
  });
}
