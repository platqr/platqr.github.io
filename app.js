/* Rendering, filtering and theming for every list page. The data lives in
   data/*.js, which set one global each; the page picks one via data-source on
   its mount. */

(function () {
  'use strict';

  var PAGES = [
    { file: 'index.html', label: 'kanji', ja: '漢字' },
    { file: 'wordList1.html', label: 'w1', ja: '単語一' },
    { file: 'wordList2.html', label: 'w2', ja: '単語二' },
  ];

  var SOURCES = {
    kanji: function () { return window.KANJI; },
    words1: function () { return window.WORDS1; },
    words2: function () { return window.WORDS2; },
  };

  var CHUNK = 100;
  var DEBOUNCE_MS = 120;

  function pad(value, width) {
    return String(value).padStart(width, '0');
  }

  function span(className, text) {
    var el = document.createElement('span');
    el.className = className;
    el.textContent = text;
    return el;
  }

  /* Theme ----------------------------------------------------------------- */

  // The <head> boot script has already stamped data-theme before first paint;
  // this only handles switching it afterwards.
  function renderThemeToggle() {
    var button = document.createElement('button');
    button.className = 'theme';
    button.type = 'button';

    function sync() {
      var dark = document.documentElement.dataset.theme === 'dark';
      button.textContent = dark ? 'display: ink' : 'display: paper';
      button.setAttribute('aria-pressed', String(dark));
    }

    button.addEventListener('click', function () {
      var next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem('theme', next);
      } catch (err) {
        /* private browsing — the choice just won't persist */
      }
      sync();
    });

    sync();
    return button;
  }

  /* Header ---------------------------------------------------------------- */

  function currentPage() {
    var file = window.location.pathname.split('/').pop();
    return file === '' ? 'index.html' : file;
  }

  // Built here rather than copied into each page, because hand-copied navs are
  // exactly what drifted out of sync before.
  function renderNav(mount) {
    var here = currentPage();
    var frag = document.createDocumentFragment();

    var brand = document.createElement('div');
    brand.className = 'brand';

    var title = document.createElement('h1');
    title.textContent = 'platqr';
    brand.appendChild(title);

    brand.appendChild(span('brand-ja', '漢字'));
    brand.appendChild(span('brand-ver', 'ver 2.1'));
    frag.appendChild(brand);

    var links = document.createElement('ul');
    links.className = 'nav-links';

    PAGES.forEach(function (page) {
      var item = document.createElement('li');
      var link = document.createElement('a');
      link.href = './' + page.file;
      if (page.file === here) link.setAttribute('aria-current', 'page');
      link.appendChild(span('nav-lat', page.label));
      link.appendChild(span('nav-ja', page.ja));
      item.appendChild(link);
      links.appendChild(item);
    });

    frag.appendChild(links);
    frag.appendChild(renderThemeToggle());
    mount.replaceChildren(frag);
  }

  /* Lists ----------------------------------------------------------------- */

  // `matches` is a list of indices into `items`, so the rank shown is always the
  // entry's position in the full list, not its position among the matches.
  function renderNumbered(frag, items, matches) {
    var width = String(items.length).length;

    matches.forEach(function (index) {
      var row = document.createElement('p');
      row.className = 'row';
      row.appendChild(span('rank', pad(index + 1, width)));
      row.appendChild(span('word', items[index]));
      frag.appendChild(row);
    });
  }

  function renderGrid(frag, items, matches) {
    var grid = null;

    matches.forEach(function (index, position) {
      if (position % CHUNK === 0) {
        var head = document.createElement('p');
        head.className = 'grid-head';
        head.appendChild(span('sec', 'section ' + pad(position / CHUNK + 1, 3)));
        head.appendChild(
          span(
            'range',
            pad(position + 1, 4) + ' — ' + pad(Math.min(position + CHUNK, matches.length), 4)
          )
        );
        frag.appendChild(head);

        grid = document.createElement('div');
        grid.className = 'grid';
        frag.appendChild(grid);
      }

      var cell = document.createElement('p');
      cell.textContent = items[index];
      grid.appendChild(cell);
    });
  }

  function initList(mount, items, mode) {
    var search = document.getElementById('search');
    var count = document.getElementById('count');
    var width = String(items.length).length;

    function draw(query) {
      var matches = [];
      for (var i = 0; i < items.length; i += 1) {
        if (!query || items[i].toLowerCase().indexOf(query) !== -1) {
          matches.push(i);
        }
      }

      // Build offscreen and attach once, rather than appending 15,000 times.
      var frag = document.createDocumentFragment();
      if (mode === 'grid' && !query) {
        renderGrid(frag, items, matches);
      } else {
        renderNumbered(frag, items, matches);
      }
      mount.replaceChildren(frag);

      count.textContent = pad(matches.length, width) + '/' + items.length;
    }

    draw('');

    var timer;
    search.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        draw(search.value.trim().toLowerCase());
      }, DEBOUNCE_MS);
    });
  }

  /* Wiring ---------------------------------------------------------------- */

  var nav = document.getElementById('nav');
  if (nav) renderNav(nav);

  var mount = document.getElementById('list');
  if (!mount) return;

  var source = SOURCES[mount.dataset.source];
  if (!source) throw new Error('unknown data source: ' + mount.dataset.source);

  var items = source();
  if (!items) throw new Error('data file for ' + mount.dataset.source + ' did not load');

  mount.className = mount.dataset.mode === 'grid' ? '' : 'numbered';
  initList(mount, items, mount.dataset.mode);
})();
