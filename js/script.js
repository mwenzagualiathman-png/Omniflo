/* =========================================
   OMNIFLO CENTRAL JAVASCRIPT
   The interaction engine
   ========================================= */


/* =========================================
   MOBILE NAVIGATION
   ========================================= */

const menuButton = document.getElementById("menuBtn");
const navigation = document.getElementById("navLinks");


if (menuButton && navigation) {

    menuButton.addEventListener("click", function () {

        navigation.classList.toggle("show");

    });

}


/* =========================================
   CLOSE MOBILE MENU AFTER NAVIGATION
   ========================================= */

const navigationLinks =
    document.querySelectorAll(".links a");


navigationLinks.forEach(function (link) {

    link.addEventListener("click", function () {

        if (navigation) {

            navigation.classList.remove("show");

        }

    });

});


/* =========================================
   AUTOMATIC COPYRIGHT YEAR
   ========================================= */

const year =
    document.getElementById("year");


if (year) {

    year.textContent =
        new Date().getFullYear();

}


/* =========================================
   FUTURE OMNIFLO FEATURES
   =========================================

   Future features can be added here:

   - Article search
   - Product filtering
   - Resource categories
   - Dark mode
   - Forms
   - Newsletter system
   - Dynamic content loading

   We will build these only when
   OmniFlo actually needs them.

========================================= */
