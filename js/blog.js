function loadPosts(lang) {
  fetch("/posts/posts.json")
    .then((response) => response.json())
    .then((data) => {
      let posts = data.posts || [];
      let container = document.getElementById("blog-list");
      if (!container) {
        console.error("Blog-list container not found when loading posts.");
        return;
      }
      container.innerHTML = "";

      const postPromises = posts.map((post) =>
        fetch(`/posts/${lang}/${post.filename}`)
          .then((resp) => resp.text())
          .then((html) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");

            const titleElement = doc.querySelector(".post-header h2");
            const titleText = titleElement
              ? titleElement.textContent.trim()
              : post.title[lang];

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
            const excerpt = excerptElement
              ? excerptElement.textContent.trim()
              : "";

            return {
              ...post,
              titleText,
              excerpt,
            };
          })
          .catch((error) => {
            console.error("Error fetching post:", post.filename, error);
            return null;
          }),
      );

      Promise.all(postPromises).then((fullPosts) => {
        const validPosts = fullPosts.filter(Boolean);
        validPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

        validPosts.forEach((post) => {
          const postDiv = document.createElement("div");
          postDiv.className = "post";

          const dateDiv = document.createElement("div");
          dateDiv.textContent = post.date;

          const titleHeading = document.createElement("h3");
          const titleLink = document.createElement("a");
          titleLink.href = `/posts/post.html?post=${post.filename}`;
          titleLink.textContent = post.titleText;

          const excerptDiv = document.createElement("div");
          excerptDiv.textContent = post.excerpt;

          titleHeading.appendChild(titleLink);
          postDiv.appendChild(dateDiv);
          postDiv.appendChild(titleHeading);
          postDiv.appendChild(excerptDiv);

          container.appendChild(postDiv);
        });
      });
    })
    .catch((error) => {
      console.error("Error fetching posts manifest:", error);
    });
}