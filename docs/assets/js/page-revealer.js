{
    const easing = 'cubic-bezier(0.8, 0, 0.2, 1)';
    const duration = 1.1; // seconds
    {
        const style = document.createElement('style');
        // css variables is not available at this point so you should use direct values
        style.append(`
            .page-revealer {
                pointer-events: none;
                visibility: hidden;
                height: 100%;
                width: 100%;
                position: fixed;
                right: 0;
                bottom: 0;
                left: 0;
                transform: scaleY(0);
                z-index: 12000;
                background-color: #fff;
            }
            .uk-dark .page-revealer {
                background-color: #2a2135;
            }
        `);
        document.head.append(style);
    }

    const revealer = document.createElement('div');
    revealer.classList.add('page-revealer');
    document.documentElement.append(revealer);

    localStorage.getItem('page-revealer') === 'show' && (async () => {
        localStorage.removeItem('page-revealer');
        revealer.style.transition = '';
        revealer.style.visibility = 'visible';
        revealer.style.transform = 'scaleY(1)';
        revealer.style.transformOrigin = 'center bottom';
        await new Promise(r => document.addEventListener('DOMContentLoaded', r));
        await new Promise(r => requestAnimationFrame(r));
        revealer.style.transition = 'transform ' + duration + 's ' + easing;
        revealer.style.transform = 'scaleY(0)';
        revealer.style.transformOrigin = 'center top';
        await new Promise(r => setTimeout(r, duration * 1100));
        revealer.style.visibility = '';
        revealer.style.transform = '';
        revealer.style.transformOrigin = '';
    })();
    /**
     *
     * @param {HTMLAnchorElement} anchor
     */
    const shouldShowRevealer = anchor => {
        const isSameOrigin = location.protocol === anchor.protocol && location.origin === anchor.origin;
        // revealer works only when navigating to the same domain
        if (!isSameOrigin) return false;
        const isSamePage = location.pathname === anchor.pathname && location.search === anchor.search;
        // revealer works when changing page
        if (!isSamePage) return true;
        const hasHash = anchor.hash || anchor.href !== anchor.origin + anchor.pathname + anchor.search + anchor.hash;
        // revealer don't work when anchor has hash
        if (hasHash) return false;
        return true;
    };
    document.addEventListener('click', async e => {
        /** @type {HTMLElement} */
        // @ts-ignore
        const el = e.target;
        const anchor = el.closest('a');
        if (anchor && anchor instanceof HTMLAnchorElement && !e.defaultPrevented && shouldShowRevealer(anchor)) {
            e.preventDefault();
            revealer.style.transition = 'transform ' + duration + 's ' + easing;
            revealer.style.visibility = 'visible';
            revealer.style.transform = 'scaleY(1)';
            revealer.style.transformOrigin = 'center bottom';
            await new Promise(r => setTimeout(r, duration * 1000));
            localStorage.setItem('page-revealer', 'show');
            location.href = anchor.href;
        }
    });
}