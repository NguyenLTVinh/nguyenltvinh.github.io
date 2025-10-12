let currentLang = localStorage.getItem("lang") || "en";

function getPageName() {
  const path = window.location.pathname;
  const file = path.substring(path.lastIndexOf("/") + 1);
  return file === "" ? "index" : file.replace(".html", "");
}

function getPageDir() {
  const path = window.location.pathname;
  return path.substring(0, path.lastIndexOf("/"));
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem("lang", lang);

  const page = getPageName();
  fetch(`/components/header-${lang}.html`)
    .then((res) => res.text())
    .then((html) => {
      document.querySelector("header").innerHTML = html;
      document
        .getElementById("translate-btn")
        ?.addEventListener("click", toggleLanguage);

      const burger = document.getElementById("burger");
      const navMenu = document.getElementById("nav-menu");
      if (burger && navMenu) {
        burger.addEventListener("click", () => {
          navMenu.classList.toggle("open");
        });
      }
    });

  fetch(`/components/footer-${lang}.html`)
    .then((res) => res.text())
    .then((html) => {
      document.querySelector("footer").innerHTML = html;
    });

  if (window.location.pathname.startsWith("/posts/")) {
    if (currentPostFilename) {
      loadPostContent(currentPostFilename, lang);
      setPageTitle(currentPostFilename, lang);
    } else {
      document.querySelector("main").innerHTML =
        "<p>Missing post filename.</p>";
    }
  } else {
    const currentDir = getPageDir();
    fetch(`${currentDir}/${lang}/${page}-main.html`)
      .then((res) => res.text())
      .then((html) => {
        document.querySelector("main").innerHTML = html;
        document.dispatchEvent(new Event("mainContentUpdated"));

        if (window.Prism) {
          Prism.highlightAll();
        }
        if (window.MathJax && MathJax.typesetPromise) {
          MathJax.typesetPromise();
        }
        if (page === "blog" && typeof loadPosts === "function") {
          loadPosts(lang);
        }
      });
  }
}

function toggleLanguage() {
  const newLang = currentLang === "en" ? "vi" : "en";
  const event = new CustomEvent("languageChange", {
    detail: { lang: newLang },
  });
  document.dispatchEvent(event);
  setLang(newLang);
}

window.addEventListener("DOMContentLoaded", () => {
  setLang(currentLang);
});
