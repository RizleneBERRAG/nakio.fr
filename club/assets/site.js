// Nakio · site vitrine : l'en-tête qui s'éclaircit en quittant l'ouverture, le
// menu sur téléphone, et les blocs qui apparaissent au défilement.
// Chargé dans <head> sans « defer » : la classe « js » est posée avant l'affichage.
document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
    const top = document.querySelector('[data-top]');
    const hero = document.querySelector('.hero');
    const menu = document.querySelector('[data-menu]');
    const drawer = document.querySelector('[data-drawer]');
    const year = document.querySelector('[data-year]');

    if (year) {
        year.textContent = String(new Date().getFullYear());
    }

    // Transparent tout en haut, verre sombre tant qu'on défile sur l'ouverture
    // noire, verre clair ensuite (et toujours clair sans ouverture).
    const updateHeader = () => {
        if (!top) {
            return;
        }

        const limit = hero ? hero.offsetHeight - top.offsetHeight : -1;
        top.classList.toggle('is-scrolled', window.scrollY > 8);
        top.classList.toggle('is-light', window.scrollY > limit);
    };

    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
    window.addEventListener('resize', updateHeader);

    // Le menu du téléphone.
    const setOpen = (open) => {
        if (!menu || !drawer || !top) {
            return;
        }

        menu.setAttribute('aria-expanded', String(open));
        drawer.hidden = !open;
        top.classList.toggle('is-open', open);
    };

    menu?.addEventListener('click', () => setOpen(menu.getAttribute('aria-expanded') !== 'true'));
    drawer?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            setOpen(false);
        }
    });

    // Les apparitions : une fois, en léger décalé entre voisins.
    const items = Array.from(document.querySelectorAll('.reveal'));
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced || !('IntersectionObserver' in window)) {
        items.forEach((item) => item.classList.add('is-in'));

        return;
    }

    items.forEach((item) => {
        const siblings = Array.from(item.parentElement?.children ?? []).filter((child) => child.classList.contains('reveal'));
        item.style.transitionDelay = `${Math.min(siblings.indexOf(item), 5) * 70}ms`;
    });

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-in');
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );

    items.forEach((item) => observer.observe(item));
});
