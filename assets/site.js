// Nakio · le studio : l'en-tête qui s'éclaircit en quittant l'ouverture, le menu,
// les apparitions, la barre de contact sur téléphone, l'aperçu des projets, la
// visionneuse des réalisations et le formulaire (WhatsApp ou e-mail).
// Chargé dans <head> sans « defer » : la classe « js » est posée avant l'affichage.
document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
    const root = document.documentElement;
    const top = document.querySelector('[data-top]');
    const hero = document.querySelector('.hero');
    const menu = document.querySelector('[data-menu]');
    const drawer = document.querySelector('[data-drawer]');
    const dock = document.querySelector('[data-dock]');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const svg = (name) => `<svg class="i"><use href="#i-${name}"/></svg>`;

    document.querySelectorAll('[data-year]').forEach((node) => { node.textContent = String(new Date().getFullYear()); });

    // Transparent tout en haut, verre sombre sur l'ouverture noire, verre clair ensuite.
    // La barre de contact du téléphone apparaît une fois l'ouverture passée.
    // Elle s'efface aussi sur le formulaire de contact, qui offre déjà les mêmes boutons.
    const contact = document.getElementById('contact');
    let onContact = false;
    const onScroll = () => {
        const limit = hero ? hero.offsetHeight - (top?.offsetHeight ?? 0) : -1;
        top?.classList.toggle('is-scrolled', window.scrollY > 8);
        top?.classList.toggle('is-light', window.scrollY > limit);
        dock?.classList.toggle('is-on', window.scrollY > limit * 0.7 && !onContact && !top?.classList.contains('is-open'));
    };
    if (dock && contact && 'IntersectionObserver' in window) {
        new IntersectionObserver(([entry]) => { onContact = entry.isIntersecting; onScroll(); }, { threshold: 0.15 }).observe(contact);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    // Le menu du téléphone.
    const setOpen = (open) => {
        if (!menu || !drawer || !top) return;
        menu.setAttribute('aria-expanded', String(open));
        drawer.hidden = !open;
        top.classList.toggle('is-open', open);
        onScroll();
    };
    menu?.addEventListener('click', () => setOpen(menu.getAttribute('aria-expanded') !== 'true'));
    drawer?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setOpen(false); });

    // Les apparitions : une fois, en léger décalé entre voisins.
    const items = Array.from(document.querySelectorAll('.reveal'));
    if (reduced || !('IntersectionObserver' in window)) {
        items.forEach((item) => item.classList.add('is-in'));
    } else {
        items.forEach((item) => {
            const siblings = Array.from(item.parentElement?.children ?? []).filter((child) => child.classList.contains('reveal'));
            item.style.transitionDelay = `${Math.min(siblings.indexOf(item), 5) * 70}ms`;
        });
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-in');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
        items.forEach((item) => observer.observe(item));
    }

    // L'aperçu qui suit la souris dans la liste des projets.
    const list = document.querySelector('[data-index]');
    const preview = document.querySelector('[data-preview]');
    if (list && preview && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        const image = preview.querySelector('img');
        let x = 0; let y = 0; let tx = 0; let ty = 0; let frame = 0; let on = false;
        const follow = () => {
            x += (tx - x) * (reduced ? 1 : 0.16);
            y += (ty - y) * (reduced ? 1 : 0.16);
            preview.style.transform = `translate3d(${x + 28}px, ${y - preview.offsetHeight / 2}px, 0)`;
            frame = on || Math.abs(tx - x) > 0.5 ? requestAnimationFrame(follow) : 0;
        };
        list.addEventListener('mousemove', (event) => {
            tx = event.clientX; ty = event.clientY;
            if (!on) { x = tx; y = ty; }
            on = true;
            if (!frame) frame = requestAnimationFrame(follow);
        });
        list.querySelectorAll('[data-thumb]').forEach((row) => {
            row.addEventListener('mouseenter', () => {
                image.src = row.dataset.thumb;
                preview.classList.add('is-on');
            });
        });
        list.addEventListener('mouseleave', () => { on = false; preview.classList.remove('is-on'); });
    }

    // La visionneuse : le projet, la page entière à faire défiler et les écrans sur téléphone.
    const viewer = document.querySelector('[data-viewer]');
    const source = document.getElementById('cases');
    if (viewer && source) {
        const cases = JSON.parse(source.textContent);
        const order = Object.keys(cases);
        const pick = (name) => viewer.querySelector(`[data-v-${name}]`);
        const scroll = pick('scroll');
        const full = pick('full');
        const hint = viewer.querySelector('.viewer__hint');
        let index = 0;
        let opener = null;

        const fill = (i) => {
            index = (i + order.length) % order.length;
            const item = cases[order[index]];
            pick('index').textContent = String(index + 1).padStart(2, '0');
            pick('total').textContent = String(order.length).padStart(2, '0');
            pick('kind').textContent = `${item.sector} · ${item.type} · ${item.year}`;
            pick('name').textContent = item.name;
            pick('summary').textContent = item.summary;
            pick('points').innerHTML = item.points.map(() => `<li>${svg('check')}<span></span></li>`).join('');
            pick('points').querySelectorAll('span').forEach((node, k) => { node.textContent = item.points[k]; });
            pick('tags').innerHTML = item.tags.map(() => '<li></li>').join('');
            pick('tags').querySelectorAll('li').forEach((node, k) => { node.textContent = item.tags[k]; });
            pick('url').textContent = item.url;
            pick('link').hidden = !item.link;
            if (item.link) pick('link').href = item.link;
            pick('stage').style.setProperty('--tint', item.tint);
            full.removeAttribute('src');
            full.height = item.fullHeight;
            full.alt = `Page complète : ${item.name}`;
            full.src = item.full;
            scroll.scrollTop = 0;
            hint.classList.remove('is-gone');
            pick('phones').innerHTML = item.phones.map(() => '<figure><img alt="" width="540" height="1169"></figure>').join('');
            pick('phones').querySelectorAll('img').forEach((img, k) => {
                img.src = item.phones[k];
                img.alt = `${item.name} sur téléphone`;
            });
            pick('phones').scrollTop = 0;
            pick('phones').scrollLeft = 0;
            viewer.querySelector('.viewer__body').scrollTop = 0;
        };

        const open = (name, from) => {
            opener = from;
            fill(Math.max(0, order.indexOf(name)));
            if (!viewer.open) viewer.showModal();
            root.classList.add('is-locked');
            pick('close').focus();
        };

        document.addEventListener('click', (event) => {
            const trigger = event.target.closest('[data-case]');
            if (!trigger) return;
            event.preventDefault();
            open(trigger.dataset.case, trigger);
        });
        pick('prev').addEventListener('click', () => fill(index - 1));
        pick('next').addEventListener('click', () => fill(index + 1));
        pick('close').addEventListener('click', () => viewer.close());
        pick('contact').addEventListener('click', () => viewer.close());
        viewer.addEventListener('close', () => {
            root.classList.remove('is-locked');
            opener?.focus({ preventScroll: true });
        });
        viewer.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowRight') fill(index + 1);
            if (event.key === 'ArrowLeft') fill(index - 1);
        });
        scroll.addEventListener('scroll', () => { if (scroll.scrollTop > 40) hint.classList.add('is-gone'); }, { passive: true });
    }

    // Le formulaire prépare le message dans WhatsApp ou dans la messagerie : rien n'est envoyé au site.
    const form = document.querySelector('[data-form]');
    if (form) {
        const error = form.querySelector('[data-form-error]');
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const data = new FormData(form);
            const value = (name) => String(data.get(name) || '').trim();
            const missing = ['nom', 'contact', 'message'].filter((name) => {
                const bad = !value(name);
                form.elements[name].setAttribute('aria-invalid', String(bad));
                return bad;
            });
            if (missing.length) {
                error.hidden = false;
                error.textContent = 'Merci d’indiquer votre nom, un moyen de vous joindre et quelques mots sur votre projet.';
                form.elements[missing[0]].focus();
                return;
            }
            error.hidden = true;
            const kinds = data.getAll('projet');
            const lines = [
                'Bonjour Rizlene, j’aimerais un diagnostic gratuit pour mon projet.',
                '',
                value('message'),
                '',
                kinds.length ? `Mon projet : ${kinds.join(', ')}` : '',
                value('entreprise') ? `Entreprise : ${value('entreprise')}` : '',
                `${value('nom')} · ${value('contact')}`,
            ].filter((line, i, all) => line !== '' || (i > 0 && all[i - 1] !== ''));
            const body = lines.join('\n');
            if (event.submitter?.value === 'email') {
                const subject = `Diagnostic${kinds.length ? ` : ${kinds[0].toLowerCase()}` : ''}, ${value('nom')}`;
                window.location.href = `mailto:contact@nakio.fr?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            } else {
                window.open(`https://wa.me/33650080442?text=${encodeURIComponent(body)}`, '_blank', 'noopener');
            }
        });
        form.addEventListener('input', (event) => {
            if (event.target.getAttribute('aria-invalid') === 'true') event.target.setAttribute('aria-invalid', 'false');
        });
    }
});
