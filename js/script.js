let currentLang = localStorage.getItem("lang") || "en";

function getPageName() {
  const path = window.location.pathname;
  const file = path.substring(path.lastIndexOf("/") + 1);
  return file === "" ? "index" : file.replace(".html", "");
}

function handlePostsRedirection(lang) {
  if (window.location.pathname.startsWith("/posts/")) {
    const match = window.location.pathname.match(/^\/posts\/(en|vi)\//);
    if (match && match[1] !== lang) {
      window.location.href = window.location.pathname.replace(
        /^\/posts\/(en|vi)/,
        "/posts/" + lang,
      );
      return true;
    } else {
      fetch(`/components/header-${lang}.html`)
        .then((res) => res.text())
        .then((html) => {
          document.querySelector("header").innerHTML = html;
          document
            .getElementById("translate-btn")
            ?.addEventListener("click", toggleLanguage);
        });
      fetch(`/components/footer-${lang}.html`)
        .then((res) => res.text())
        .then((html) => {
          document.querySelector("footer").innerHTML = html;
        });
      return true;
    }
  }
  return false;
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem("lang", lang);

  if (handlePostsRedirection(lang)) {
    return;
  }

  const page = getPageName();

  fetch(`/components/header-${lang}.html`)
    .then((res) => res.text())
    .then((html) => {
      document.querySelector("header").innerHTML = html;
      document
        .getElementById("translate-btn")
        ?.addEventListener("click", toggleLanguage);
    });

  fetch(`/components/footer-${lang}.html`)
    .then((res) => res.text())
    .then((html) => {
      document.querySelector("footer").innerHTML = html;
    });

  fetch(`/translation/${lang}/${page}-main.html`)
    .then((res) => res.text())
    .then((html) => {
      document.querySelector("main").innerHTML = html;
      if (page === "blog" && typeof loadPosts === "function") {
        loadPosts(lang);
      }
    });
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
