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

      initDarkModeToggle();
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
      .then((res) => {
        if (!res.ok) {
          const langName = lang === "vi" ? "Vietnamese" : "English";
          return `<h1>No ${langName} translation done for this page!</h1>`;
        }
        return res.text();
      })
      .then((html) => {
        document.querySelector("main").innerHTML = html;
        document.dispatchEvent(new Event("mainContentUpdated"));

        if (window.Prism) Prism.highlightAll();
        if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise();
        if (page === "blog" && typeof loadPosts === "function") loadPosts(lang);
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

function initDarkModeToggle() {
  const toggleBtn = document.getElementById("dark-mode-toggle");
  if (!toggleBtn) return;
  const icon = toggleBtn.querySelector("img");
  const body = document.body;

  const applySunStyle = () => {
    icon.style.filter =
      "invert(65%) sepia(64%) hue-rotate(200deg) saturate(15) contrast(90%)";
    icon.style.opacity = "0.9";
    icon.style.transition = "filter 0.3s ease";
  };

  const clearSunStyle = () => {
    icon.style.filter = "";
    icon.style.opacity = "";
    icon.style.transition = "";
  };

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    body.classList.add("dark-mode");
    icon.src = "/images/sun-svgrepo-com.svg";
    applySunStyle();
  } else {
    icon.src = "/images/moon-svgrepo-com.svg";
    clearSunStyle();
  }

  toggleBtn.addEventListener("click", () => {
    const isDark = body.classList.toggle("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");

    if (isDark) {
      icon.src = "/images/sun-svgrepo-com.svg";
      applySunStyle();
    } else {
      icon.src = "/images/moon-svgrepo-com.svg";
      clearSunStyle();
    }
  });
}

window.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const langParam = params.get("lang");
  if (langParam === "en" || langParam === "vi") {
    currentLang = langParam;
    localStorage.setItem("lang", currentLang);
  }
  setLang(currentLang);
  initDarkModeToggle();
});
