function initBurgerMenu() {
  const burger = document.getElementById("burger");
  const navMenu = document.getElementById("nav-menu");

  if (burger && navMenu) {
    burger.addEventListener("click", () => {
      navMenu.classList.toggle("open");
    });
  }
}

window.addEventListener("DOMContentLoaded", () => {
  initBurgerMenu();
});
