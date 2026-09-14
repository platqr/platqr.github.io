/* Rendering and filtering for every list page. The data lives in data/*.js,
   which set one global each; the page picks one via data-source on its mount. */

(function () {
  'use strict';

  var PAGES = [
    { file: 'index.html', label: 'kanji' },
    { file: 'wordList1.html', label: 'w1' },
    { file: 'wordList2.html', label: 'w2' },
  ];

  var SOURCES = {
    kanji: function () { return window.KANJI; },
    words1: function () { return window.WORDS1; },
    words2: function () { return window.WORDS2; },
  };

  var CHUNK = 100;
  var DEBOUNCE_MS = 120;

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

    var title = document.createElement('h1');
    title.textContent = 'hello kanjis';
    frag.appendChild(title);

    PAGES.forEach(function (page) {
      var link = document.createElement('a');
      link.href = './' + page.file;
      link.textContent = page.label;
      if (page.file === here) link.setAttribute('aria-current', 'page');
      frag.appendChild(link);
    });

    mount.replaceChildren(frag);
  }

  /* Lists ----------------------------------------------------------------- */

  // `matches` is a list of indices into `items`, so the rank shown is always the
  // entry's position in the full list, not its position among the matches.
  function renderNumbered(frag, items, matches) {
    matches.forEach(function (index) {
      var row = document.createElement('p');
      row.className = 'row';
      row.textContent = index + 1 + '. ' + items[index];
      frag.appendChild(row);
    });
  }

  function renderGrid(frag, items, matches) {
    var grid = null;

    matches.forEach(function (index, position) {
      if (position % CHUNK === 0) {
        frag.appendChild(document.createElement('hr'));

        var head = document.createElement('p');
        head.className = 'grid-head';
        head.textContent =
          position + 1 + ' - ' + Math.min(position + CHUNK, matches.length);
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

      count.textContent = matches.length + ' / ' + items.length;
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
