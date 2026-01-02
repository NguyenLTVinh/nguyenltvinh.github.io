function loadProjects(lang) {
  fetch("/data/projects.json")
    .then((response) => response.json())
    .then((data) => {
      const projects = data.projects || [];
      const container = document.getElementById("project-list");
      if (!container) {
        console.error(
          "Project-list container not found when loading projects.",
        );
        return;
      }
      container.innerHTML = "";

      const labels = {
        en: {
          description: "Description",
          technologies: "Technologies Used",
        },
        vi: {
          description: "Mô tả",
          technologies: "Công nghệ sử dụng",
        },
      };

      projects.forEach((project) => {
        const projectDiv = document.createElement("div");
        projectDiv.className = "project";

        // Title
        const title = document.createElement("h3");
        title.textContent = project.title[lang];
        projectDiv.appendChild(title);

        // Description
        const descP = document.createElement("p");
        const descStrong = document.createElement("strong");
        descStrong.textContent = labels[lang].description + ": ";
        descP.appendChild(descStrong);
        const descSpan = document.createElement("span");
        descSpan.innerHTML = project.description[lang];
        descP.appendChild(descSpan);
        projectDiv.appendChild(descP);

        // Technologies
        if (project.technologies && project.technologies.length > 0) {
          const techP = document.createElement("p");
          const techStrong = document.createElement("strong");
          techStrong.textContent = labels[lang].technologies + ": ";
          techP.appendChild(techStrong);

          project.technologies.forEach((tech) => {
            const img = document.createElement("img");
            img.src = tech.src;
            img.title = tech.name;
            img.alt = tech.name;
            img.className = "icon";
            techP.appendChild(img);
            techP.appendChild(document.createTextNode(" "));
          });
          projectDiv.appendChild(techP);
        }

        // Links
        if (project.links && project.links.length > 0) {
          const linkP = document.createElement("p");
          project.links.forEach((link, index) => {
            const a = document.createElement("a");
            a.href = link.url;
            a.target = "_blank";
            a.textContent = link.text[lang];
            linkP.appendChild(a);
            if (index < project.links.length - 1) {
              linkP.appendChild(document.createTextNode(" "));
            }
          });
          projectDiv.appendChild(linkP);
        }

        container.appendChild(projectDiv);
      });
    })
    .catch((error) => {
      console.error("Error fetching projects:", error);
    });
}
