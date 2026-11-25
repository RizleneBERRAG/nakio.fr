// Nakio · le studio : l'en-tête qui change de teinte selon le fond, le menu, les
// apparitions, le grand titre qui monte mot à mot, la scène des réalisations qui
// s'ouvre au défilement, la phrase qui s'allume, les cartes de projets qui s'empilent,
// les étapes illustrées de la méthode, la bulle « Voir », la barre de contact sur
// téléphone, le tri de tous les projets, la visionneuse et le formulaire, dont le
// message s'écrit en direct.
// Chargé dans <head> sans « defer » : la classe « js » est posée avant l'affichage.
document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
    const root = document.documentElement;
    const top = document.querySelector('[data-top]');
    const hero = document.querySelector('.hero, [data-hero]');
    const menu = document.querySelector('[data-menu]');
    const drawer = document.querySelector('[data-drawer]');
    const dock = document.querySelector('[data-dock]');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const svg = (name) => `<svg class="i"><use href="#i-${name}"/></svg>`;

    document.querySelectorAll('[data-year]').forEach((node) => { node.textContent = String(new Date().getFullYear()); });

    // Découpe un texte en mots (les balises comme <em> sont gardées). « masque » : chaque
    // mot dans une fenêtre, pour le faire monter. Les espaces insécables restent collés.
    const splitWords = (element, mask) => {
        let count = 0;
        const walk = (node) => {
            Array.from(node.childNodes).forEach((child) => {
                if (child.nodeType === Node.ELEMENT_NODE) { walk(child); return; }
                if (child.nodeType !== Node.TEXT_NODE) return;
                const fragment = document.createDocumentFragment();
                child.textContent.split(/([ \t\n\r]+)/).forEach((part) => {
                    if (!part) return;
                    if (/^[ \t\n\r]+$/.test(part)) { fragment.appendChild(document.createTextNode(' ')); return; }
                    const word = document.createElement('span');
                    word.className = 'w';
                    word.style.setProperty('--i', String(count++));
                    if (mask) {
                        const inner = document.createElement('span');
                        inner.textContent = part;
                        word.appendChild(inner);
                    } else {
                        word.textContent = part;
                    }
                    fragment.appendChild(word);
                });
                child.replaceWith(fragment);
            });
        };
        walk(element);
        return count;
    };

    // Le grand titre de l'ouverture.
    document.querySelectorAll('[data-split]').forEach((title) => {
        if (!reduced) splitWords(title, true);
        title.classList.add('is-split');
    });

    // La phrase du manifeste : les mots s'allument au fil du défilement.
    const sentence = document.querySelector('[data-words]');
    const sentenceWords = sentence && !reduced ? (splitWords(sentence, false), Array.from(sentence.querySelectorAll('.w'))) : [];
    let lit = -1;
    const lightWords = () => {
        if (!sentenceWords.length) return;
        const box = sentence.getBoundingClientRect();
        const vh = window.innerHeight;
        const progress = clamp((vh * 0.88 - box.top) / (box.height + vh * 0.38), 0, 1);
        const next = Math.round(progress * (sentenceWords.length + 2) * 10) / 10;
        if (next === lit) return;
        lit = next;
        sentenceWords.forEach((word, k) => { word.style.setProperty('--o', String(0.14 + clamp(lit - k, 0, 1) * 0.86)); });
    };

    // La scène des réalisations : un encart arrondi qui s'ouvre jusqu'aux bords.
    const stage = document.querySelector('[data-stage]');
    const openStage = () => {
        if (!stage || reduced) return;
        const box = stage.getBoundingClientRect();
        const vh = window.innerHeight;
        if (box.bottom < 0 || box.top > vh) return;
        const progress = clamp((vh - box.top) / (vh * 0.85), 0, 1);
        stage.style.setProperty('--inset', (1 - progress).toFixed(3));
        stage.style.setProperty('--wall-scale', (1.2 - progress * 0.12).toFixed(3));
    };

    // Les réalisations : chaque carte se pose sur la précédente, qui recule et s'assombrit,
    // et la page du site défile toute seule dans sa carte pendant ce temps.
    const deck = document.querySelector('[data-deck]');
    const cards = deck ? Array.from(deck.children) : [];
    const pages = cards.map((card) => card.querySelector('.deck__page'));
    let stickAt = [];
    let ranges = [];
    const measureDeck = () => {
        stickAt = cards.map((card) => parseFloat(getComputedStyle(card).top) || 0);
        ranges = pages.map((page) => (page ? Math.max(0, page.offsetHeight - page.parentElement.clientHeight + 22) : 0));
    };
    const stackCards = () => {
        if (!cards.length || reduced) return;
        const vh = window.innerHeight;
        const box = deck.getBoundingClientRect();
        if (box.bottom < -vh || box.top > vh) return;
        const tops = cards.map((card) => card.getBoundingClientRect().top);
        const arrival = (k) => clamp((vh - tops[k]) / Math.max(1, vh - stickAt[k]), 0, 1);
        cards.forEach((card, k) => {
            const enter = arrival(k);
            const cover = k < cards.length - 1 ? arrival(k + 1) : 0;
            card.style.setProperty('--s', (1 - cover * 0.06).toFixed(4));
            card.style.setProperty('--dim', (cover * 0.5).toFixed(3));
            if (pages[k]) pages[k].style.transform = `translate3d(0, ${(-(enter * 0.35 + cover * 0.65) * ranges[k]).toFixed(1)}px, 0)`;
        });
    };
    if (cards.length) {
        measureDeck();
        pages.forEach((page) => page?.addEventListener('load', () => { measureDeck(); stackCards(); }));
        window.addEventListener('load', () => { measureDeck(); stackCards(); });
        window.addEventListener('resize', measureDeck);
    }

    // La méthode : l'étape au milieu de l'écran s'allume, son illustration s'affiche à droite,
    // et le fil se remplit. Sur téléphone, chaque étape garde son illustration sous le texte.
    const journey = document.querySelector('[data-journey]');
    const steps = journey ? Array.from(journey.querySelectorAll('[data-step]')) : [];
    const screens = journey ? Array.from(journey.querySelectorAll('[data-screen]')) : [];
    const rail = journey?.querySelector('[data-journey-steps]');
    const board = journey?.querySelector('[data-journey-stage]');
    steps.forEach((step, k) => {
        if (!screens[k]) return;
        const mini = screens[k].cloneNode(true);
        mini.className = 'journey__mini is-on';
        mini.removeAttribute('data-screen');
        mini.setAttribute('aria-hidden', 'true');
        step.querySelector('.journey__body')?.appendChild(mini);
    });
    let currentStep = 0;
    const followJourney = () => {
        if (!steps.length) return;
        const middle = window.innerHeight * 0.5;
        const box = rail.getBoundingClientRect();
        if (box.bottom < -200 || box.top > window.innerHeight + 200) return;
        rail.style.setProperty('--p', clamp((middle - box.top) / box.height, 0, 1).toFixed(3));
        let best = 0;
        let distance = Infinity;
        steps.forEach((step, k) => {
            const r = step.getBoundingClientRect();
            const d = Math.abs(r.top + r.height / 2 - middle);
            if (d < distance) { distance = d; best = k; }
        });
        if (best === currentStep) return;
        currentStep = best;
        steps.forEach((step, k) => step.classList.toggle('is-on', k === best));
        screens.forEach((screen, k) => screen.classList.toggle('is-on', k === best));
        board.dataset.n = String(best + 1).padStart(2, '0');
    };

    // L'en-tête : transparent tout en haut, verre sombre sur les fonds sombres, verre clair ailleurs.
    // La barre de contact du téléphone apparaît une fois l'ouverture passée, et s'efface
    // sur le formulaire de contact, qui offre déjà les mêmes boutons.
    const darkZones = Array.from(document.querySelectorAll('.hero, [data-dark], .foot'));
    const overDark = () => {
        const line = (top?.offsetHeight ?? 0) / 2;
        return darkZones.some((zone) => {
            const box = zone.getBoundingClientRect();
            return box.top <= line && box.bottom > line;
        });
    };
    const contact = document.getElementById('contact');
    let onContact = false;
    const onScroll = () => {
        const limit = hero ? hero.offsetHeight * 0.7 : 240;
        top?.classList.toggle('is-scrolled', window.scrollY > 8);
        top?.classList.toggle('is-light', !overDark());
        dock?.classList.toggle('is-on', window.scrollY > limit && !onContact && !top?.classList.contains('is-open'));
        openStage();
        lightWords();
        stackCards();
        followJourney();
    };
    let ticking = false;
    const requestScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => { ticking = false; onScroll(); });
    };
    if (dock && contact && 'IntersectionObserver' in window) {
        new IntersectionObserver(([entry]) => { onContact = entry.isIntersecting; onScroll(); }, { threshold: 0.15 }).observe(contact);
    }
    onScroll();
    window.addEventListener('scroll', requestScroll, { passive: true });
    window.addEventListener('resize', requestScroll);

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
            item.style.transitionDelay = `${Math.min(siblings.indexOf(item), 5) * 90}ms`;
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

    // La bulle « Voir » qui suit la souris sur les grandes réalisations.
    const bubble = document.querySelector('[data-follow]');
    if (bubble && fine && !reduced) {
        let x = 0; let y = 0; let tx = 0; let ty = 0; let frame = 0;
        const glide = () => {
            x += (tx - x) * 0.2;
            y += (ty - y) * 0.2;
            bubble.style.transform = `translate3d(${x}px, ${y}px, 0)`;
            frame = Math.abs(tx - x) + Math.abs(ty - y) > 0.4 ? requestAnimationFrame(glide) : 0;
        };
        const aim = (event) => {
            tx = event.clientX; ty = event.clientY;
            if (!frame) frame = requestAnimationFrame(glide);
        };
        document.querySelectorAll('[data-cursor]').forEach((zone) => {
            zone.addEventListener('mouseenter', (event) => {
                if (!bubble.classList.contains('is-on')) { x = event.clientX; y = event.clientY; }
                // Noire sur les grandes cartes claires, ivoire sur les fonds sombres.
                bubble.classList.toggle('is-ink', zone.classList.contains('deck__card'));
                bubble.classList.add('is-on');
                aim(event);
            });
            zone.addEventListener('mousemove', aim);
            zone.addEventListener('mouseleave', () => bubble.classList.remove('is-on'));
        });
    }

    // Tous les projets : le tri par type, les aperçus restants arrivent en léger décalé.
    const atlas = document.querySelector('[data-atlas]');
    if (atlas) {
        const tiles = Array.from(atlas.querySelectorAll('[data-kinds]'));
        const filters = Array.from(atlas.querySelectorAll('[data-filter]'));
        const count = atlas.querySelector('[data-atlas-count]');
        const everything = count.textContent;
        filters.forEach((button) => {
            button.addEventListener('click', () => {
                const kind = button.dataset.filter;
                const before = atlas.getBoundingClientRect().top;
                filters.forEach((other) => {
                    other.classList.toggle('is-on', other === button);
                    other.setAttribute('aria-pressed', String(other === button));
                });
                let shown = 0;
                tiles.forEach((tile) => {
                    const keep = kind === 'all' || tile.dataset.kinds.split(' ').includes(kind);
                    tile.classList.remove('is-back');
                    tile.hidden = !keep;
                    if (!keep || reduced) return;
                    tile.style.setProperty('--k', String(shown++));
                    void tile.offsetWidth;
                    tile.classList.add('is-back');
                });
                count.textContent = kind === 'all' ? everything : `${tiles.filter((tile) => !tile.hidden).length} projets`;
                // La grille change de hauteur : on garde les boutons du tri sous le doigt.
                const shift = atlas.getBoundingClientRect().top - before;
                if (Math.abs(shift) > 1) window.scrollBy(0, shift);
            });
        });
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
            bubble?.classList.remove('is-on');
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
        const read = () => {
            const data = new FormData(form);
            return {
                value: (name) => String(data.get(name) || '').trim(),
                kinds: data.getAll('projet').map((kind) => String(kind).trim()).filter(Boolean),
            };
        };
        // Le message, tel qu'il partira. « blank » remplit les trous de l'aperçu.
        const compose = ({ value, kinds }, blank = '') => [
            'Bonjour Rizlene, j’aimerais un diagnostic gratuit pour mon projet.',
            '',
            value('message') || blank,
            '',
            kinds.length ? `Mon projet : ${kinds.join(', ')}` : '',
            value('entreprise') ? `Entreprise : ${value('entreprise')}` : '',
            value('nom') || value('contact') || blank ? `${value('nom') || blank} · ${value('contact') || blank}` : '',
        ].filter((line, i, all) => line !== '' || (i > 0 && all[i - 1] !== '')).join('\n').trim();

        // L'aperçu du message dans le téléphone, mis à jour à chaque lettre.
        const bubble = document.querySelector('[data-preview-msg]');
        const paint = () => { if (bubble) bubble.textContent = compose(read(), '…'); };
        // Les trous de la phrase prennent la largeur exacte de ce qu'on y écrit
        // (ou de l'indication en italique tant qu'ils sont vides).
        const slots = Array.from(form.querySelectorAll('.slot input, .slot select'));
        const ruler = document.createElement('canvas').getContext('2d');
        const fit = (field) => {
            const style = getComputedStyle(field);
            const picked = field.tagName === 'SELECT' ? field.options[field.selectedIndex] : null;
            const empty = !field.value;
            const text = picked ? picked.text : (field.value || field.placeholder);
            ruler.font = empty
                ? `italic 500 ${style.fontSize} 'Cormorant Garamond', Georgia, serif`
                : `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
            const room = picked ? 30 : 14;
            field.style.width = `${Math.ceil(ruler.measureText(text).width + room)}px`;
        };
        const fitAll = () => slots.forEach(fit);
        fitAll();
        document.fonts?.ready.then(fitAll);
        paint();

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const { value, kinds } = read();
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
            const body = compose({ value, kinds });
            if (event.submitter?.value === 'email') {
                const subject = `Diagnostic${kinds.length ? ` : ${kinds[0].toLowerCase()}` : ''}, ${value('nom')}`;
                window.location.href = `mailto:contact@nakio.fr?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            } else {
                window.open(`https://wa.me/33650080442?text=${encodeURIComponent(body)}`, '_blank', 'noopener');
            }
        });
        form.addEventListener('input', (event) => {
            if (event.target.getAttribute('aria-invalid') === 'true') event.target.setAttribute('aria-invalid', 'false');
            if (slots.includes(event.target)) fit(event.target);
            paint();
        });
        form.addEventListener('change', (event) => {
            if (slots.includes(event.target)) fit(event.target);
            paint();
        });
        window.addEventListener('resize', fitAll);
    }
});
