let currentPostFilename = null;

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const filename = params.get("post");
  const lang = localStorage.getItem("lang") || "en";

  if (!filename) {
    document.querySelector("main").innerHTML = "<p>Missing post filename.</p>";
    return;
  }

  currentPostFilename = filename;

  const event = new CustomEvent("languageChange", { detail: { lang } });
  document.dispatchEvent(event);

  loadPostContent(filename, lang);
  setPageTitle(filename, lang);
});

function loadPostContent(filename, lang) {
  fetch(`/posts/${lang}/${filename}`)
    .then((res) => {
      if (!res.ok) throw new Error("Post not found");
      return res.text();
    })
    .then((html) => {
      document.querySelector("main").innerHTML = html;
      Prism.highlightAll();
    })
    .catch((err) => {
      console.error(err);
      document.querySelector("main").innerHTML = "<p>Post not found.</p>";
    });
}

function setPageTitle(filename, lang) {
  fetch("/data/posts.json")
    .then((res) => res.json())
    .then((data) => {
      const posts = data[lang] || [];
      const post = posts.find((p) => p.filename === filename);
      if (post && post.title) {
        document.title = post.title;
      }
    })
    .catch((err) => console.error("Failed to load title:", err));
}
