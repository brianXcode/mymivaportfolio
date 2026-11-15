/*
  main.js — shared by every page.

  1. Marks the page as "JavaScript is running" so the CSS can hide the menu
     button when scripts are off (the links are then always visible).
  2. Opens and closes the mobile navigation menu.
  3. Puts the current year in the footer.
*/

document.documentElement.classList.remove("no-js");

const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.getElementById("site-nav");

/* Opens or closes the menu and keeps aria-expanded in step, so screen
   readers announce whether the menu is open. */
function setMenuOpen(isOpen) {
  navToggle.setAttribute("aria-expanded", String(isOpen));
  siteNav.classList.toggle("is-open", isOpen);
}

if (navToggle && siteNav) {
  navToggle.addEventListener("click", function () {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";
    setMenuOpen(!isOpen);
  });

  // The Escape key closes the menu and puts focus back on the button.
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && siteNav.classList.contains("is-open")) {
      setMenuOpen(false);
      navToggle.focus();
    }
  });

  // If the window is widened to desktop size, reset the menu state.
  window.matchMedia("(min-width: 900px)").addEventListener("change", function (event) {
    if (event.matches) {
      setMenuOpen(false);
    }
  });
}

const yearElement = document.getElementById("current-year");
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}
