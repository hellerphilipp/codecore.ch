// @ts-check
/// <reference types="jquery"/>
/// <reference types="animejs"/>
/// <reference path="../js/globals.d.ts"/>
/// <reference path="../js/app-head-bs.js"/>

// Scrollbar width
{
    const updateScrollWidth = () => {
        document.documentElement.style.setProperty('--body-scroll-width', `${window.innerWidth - document.documentElement.clientWidth}px`);
    };
    window.addEventListener('resize', updateScrollWidth);
    updateScrollWidth();
}

// Dark mode toggle
{
    const handleDarkModeChange = () => {
        setDarkMode(!isDarkMode());
        const isDark = isDarkMode();
        localStorage.setItem('darkMode', isDark ? '1' : '0');
    };

    const setInitialDarkMode = darkToggle => {
        darkToggle.checked = isDarkMode();
    };

    const darkModeElements = document.querySelectorAll('[data-darkmode-toggle] input, [data-darkmode-switch] input');
    darkModeElements.forEach(darkToggle => {
        darkToggle.addEventListener('change', handleDarkModeChange);
        // @ts-ignore
        setInitialDarkMode(darkToggle);
    });
}

// Horizontal Scroll
document.querySelectorAll('.uc-horizontal-scroll').forEach(element => {
    element.addEventListener('wheel', e => {
        e.preventDefault();
        // @ts-ignore
        element.scrollBy({ left: e.deltaY, behavior: 'smooth' });
    });
});

// To Top
document.addEventListener('DOMContentLoaded', () => {
    const $elem = document.querySelector('[data-uc-backtotop]');
    if (!$elem) return;

    $elem.addEventListener('click', e => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    let scrollPos = 0;
    window.addEventListener('scroll', () => {
        const top = document.body.getBoundingClientRect().top;
        // @ts-ignore
        $elem.parentNode.classList.toggle('uc-active', top <= scrollPos);
        scrollPos = top;
    });
});
        
// Pretty Print
// @ts-ignore
window.prettyPrint && prettyPrint();