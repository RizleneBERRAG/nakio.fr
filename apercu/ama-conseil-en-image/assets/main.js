(function () {
  var d = document, root = d.documentElement;
  root.classList.remove('no-js');

  // Apparition douce des blocs
  var items = d.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 70 + 'ms'; io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  // En-tête et bouton fixe mobile
  var header = d.querySelector('.site-header'), cta = d.getElementById('mcta'), stop = d.querySelector('[data-cta-stop]');
  function onScroll() {
    header.classList.toggle('scrolled', scrollY > 10);
    if (cta) {
      var hidden = stop && stop.getBoundingClientRect().top < innerHeight;
      cta.classList.toggle('show', scrollY > 520 && !hidden);
    }
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Menu mobile
  var burger = d.getElementById('burger'), menu = d.getElementById('menu');
  function setMenu(open) {
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    d.body.classList.toggle('menu-open', open);
  }
  burger.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
  menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('open')) { setMenu(false); burger.focus(); } });
  addEventListener('resize', function () { if (innerWidth > 960 && menu.classList.contains('open')) setMenu(false); });

  // Formulaire de rendez-vous
  var form = d.getElementById('rdv');
  if (form) {
    var wanted = new URLSearchParams(location.search).get('prestation');
    if (wanted) {
      var r = form.querySelector('input[name="presta"][data-slug="' + wanted + '"]');
      if (r) r.checked = true;
    }
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (!form.reportValidity()) return;
      var f = form.elements;
      var body = 'Prestation : ' + f.presta.value + '\nNom : ' + f.nom.value + '\nE-mail : ' + f.email.value +
        '\nTéléphone : ' + (f.tel.value || '-') + '\nDisponibilités : ' + f.dispo.value + '\n\n' + f.msg.value;
      location.href = 'mailto:contact@ama-conseilenimage.fr?subject=' +
        encodeURIComponent('Demande de rendez-vous : ' + f.presta.value) + '&body=' + encodeURIComponent(body);
      var ok = d.getElementById('sent');
      if (ok) ok.classList.add('show');
    });
  }
})();
