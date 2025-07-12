async function includeHTML(selector, file) {
    try {
        const response = await fetch(file);
        if (!response.ok) throw new Error(`Could not fetch ${file}`);
        const html = await response.text();
        document.querySelector(selector).innerHTML = html;
    } catch (err) {
        console.error(err);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    includeHTML("header", "/components/header.html");
    includeHTML("footer", "/components/footer.html");
});
