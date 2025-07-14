function loadPosts(lang) {
  fetch("/posts/posts.json")
    .then((response) => response.json())
    .then((data) => {
      let posts = data[lang] || [];
      posts.sort((a, b) => new Date(b.date) - new Date(a.date));
      let container = document.getElementById("blog-list");
      if (!container) {
        console.error("Blog-list container not found when loading posts.");
        return;
      }
      container.innerHTML = "";
      posts.forEach((post) => {
        fetch(`/posts/${lang}/${post.filename}`)
          .then((resp) => resp.text())
          .then((html) => {
            let parser = new DOMParser();
            let doc = parser.parseFromString(html, "text/html");

            let titleElement = doc.querySelector(".post-header h2");
            let titleText = titleElement
              ? titleElement.textContent.trim()
              : post.title;

            let postHeader = doc.querySelector(".post-header");
            let excerptElement = null;
            if (postHeader) {
              let next = postHeader.nextElementSibling;
              while (next) {
                if (next.tagName.toLowerCase() === "p") {
                  excerptElement = next;
                  break;
                }
                next = next.nextElementSibling;
              }
            }
            let excerpt = excerptElement
              ? excerptElement.textContent.trim()
              : "";

            // Build DOM elements for post preview
            let postDiv = document.createElement("div");

            let dateDiv = document.createElement("div");
            dateDiv.textContent = post.date;

            let titleHeading = document.createElement("h3");
            let titleLink = document.createElement("a");
            titleLink.className = "code-keyword";
            titleLink.href = `/posts/${lang}/${post.filename}`;
            titleLink.textContent = titleText;

            let excerptDiv = document.createElement("div");
            excerptDiv.textContent = excerpt;

            titleHeading.appendChild(titleLink);
            postDiv.appendChild(dateDiv);
            postDiv.appendChild(titleHeading);
            postDiv.appendChild(excerptDiv);

            container.appendChild(postDiv);
          })
          .catch((error) => {
            console.error("Error fetching post:", post.filename, error);
          });
      });
    })
    .catch((error) => {
      console.error("Error fetching posts manifest:", error);
    });
}
