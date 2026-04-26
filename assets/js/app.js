/* ============================================
   OPS DINING — Lógica Principal de la Aplicación
   Header scroll, animaciones reveal, modales, cookies.
   ============================================ */

(function () {
    'use strict';

    /* ---- HEADER SCROLL HIDE/SHOW ---- */
    var lastScrollY = window.scrollY;
    var header = document.getElementById('main-header');

    window.addEventListener('scroll', function () {
        if (window.scrollY > lastScrollY && window.scrollY > 100) {
            header.classList.add('header-hidden');
        } else {
            header.classList.remove('header-hidden');
        }
        lastScrollY = window.scrollY;
    });

    /* ---- REVEAL ANIMATIONS ON SCROLL ---- */
    function reveal() {
        var reveals = document.querySelectorAll('.reveal');
        for (var i = 0; i < reveals.length; i++) {
            var windowHeight = window.innerHeight;
            var elementTop = reveals[i].getBoundingClientRect().top;
            if (elementTop < windowHeight - 100) {
                reveals[i].classList.add('active');
            }
        }
    }

    window.addEventListener('scroll', reveal);
    window.addEventListener('load', reveal);

    /* ---- MODAL HANDLERS ---- */
    window.openModal = function (id) {
        var modal = document.getElementById('modal-' + id);
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    };

    window.closeModal = function (id) {
        var modal = document.getElementById('modal-' + id);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    };

    // Cerrar modal al hacer clic fuera del contenido
    window.addEventListener('click', function (e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    // Cerrar modal con tecla Escape
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            var modals = document.querySelectorAll('.modal');
            for (var i = 0; i < modals.length; i++) {
                if (modals[i].style.display === 'block') {
                    modals[i].style.display = 'none';
                    document.body.style.overflow = 'auto';
                }
            }
        }
    });

    /* ---- COOKIE CONSENT BANNER ---- */
    var COOKIE_KEY = 'ops_cookies_accepted';

    function initCookieBanner() {
        var banner = document.getElementById('cookie-banner');
        if (!banner) return;

        // Si ya aceptó, ocultar
        if (localStorage.getItem(COOKIE_KEY) === 'true') {
            banner.classList.add('hidden');
            return;
        }

        // Mostrar banner
        banner.classList.remove('hidden');

        var acceptBtn = document.getElementById('cookie-accept');
        if (acceptBtn) {
            acceptBtn.addEventListener('click', function () {
                localStorage.setItem(COOKIE_KEY, 'true');
                banner.classList.add('hidden');
            });
        }
    }

    // Init cookie banner on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCookieBanner);
    } else {
        initCookieBanner();
    }

    /* ---- SMOOTH SCROLL POLYFILL ---- */
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            var targetId = this.getAttribute('href');
            if (targetId === '#') return;
            var target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
})();
