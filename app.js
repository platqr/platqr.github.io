(function () {
  'use strict';

  var PAGES = [
    { file: 'index.html', label: 'kanji', ja: '漢字' },
    { file: 'words.html', label: 'words', ja: '単語' },
    { file: 'games.html', label: 'games', ja: 'ゲーム' },
  ];

  var WORD_LISTS = [
    { key: '1', label: 'w1', ja: '単語一', get: function () { return window.WORDS1; } },
    { key: '2', label: 'w2', ja: '単語二', get: function () { return window.WORDS2; } },
  ];

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
      }
      sync();
    });

    sync();
    return button;
  }

  function currentPage() {
    var file = window.location.pathname.split('/').pop();
    return file === '' ? 'index.html' : file;
  }

  function renderNav(mount) {
    var here = currentPage();
    var frag = document.createDocumentFragment();

    var brand = document.createElement('div');
    brand.className = 'brand';

    var title = document.createElement('h1');
    title.textContent = 'platqr';
    brand.appendChild(title);

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

    var menu = document.createElement('div');
    menu.className = 'nav-menu';
    menu.id = 'nav-menu';
    menu.appendChild(links);
    menu.appendChild(renderThemeToggle());

    frag.appendChild(renderMenuToggle(mount));
    frag.appendChild(menu);
    mount.replaceChildren(frag);
  }

  function renderMenuToggle(nav) {
    var button = document.createElement('button');
    button.className = 'nav-toggle';
    button.type = 'button';
    button.textContent = 'menu';
    button.setAttribute('aria-controls', 'nav-menu');
    button.setAttribute('aria-expanded', 'false');

    function setOpen(open) {
      if (open) {
        nav.dataset.open = 'true';
      } else {
        delete nav.dataset.open;
      }
      button.setAttribute('aria-expanded', String(open));
    }

    button.addEventListener('click', function () {
      setOpen(nav.dataset.open !== 'true');
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.dataset.open === 'true') {
        setOpen(false);
        button.focus();
      }
    });

    return button;
  }

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

  function rankIndex(items) {
    var map = new Map();
    for (var i = 0; i < items.length; i += 1) {
      if (!map.has(items[i])) map.set(items[i], i + 1);
    }
    return map;
  }

  function initWords(mount) {
    var search = document.getElementById('search');
    var count = document.getElementById('count');
    var tabs = document.getElementById('list-toggle');

    var lists = WORD_LISTS.map(function (spec) {
      var items = spec.get();
      if (!items) throw new Error('data file for ' + spec.label + ' did not load');
      return {
        key: spec.key, label: spec.label, ja: spec.ja,
        items: items, ranks: rankIndex(items),
      };
    });

    var active = new URLSearchParams(window.location.search).get('list') === '2' ? 1 : 0;
    var query = '';

    function crossSearch(text) {
      var seen = new Set();
      var out = [];

      lists.forEach(function (list) {
        for (var i = 0; i < list.items.length; i += 1) {
          var word = list.items[i];
          if (seen.has(word)) continue;
          if (word.toLowerCase().indexOf(text) === -1) continue;
          seen.add(word);

          var r1 = lists[0].ranks.get(word) || 0;
          var r2 = lists[1].ranks.get(word) || 0;
          out.push({
            word: word, r1: r1, r2: r2,
            best: Math.min(r1 || Infinity, r2 || Infinity),
          });
        }
      });

      out.sort(function (a, b) { return a.best - b.best; });
      return out;
    }

    function renderCross(frag, matches) {
      var head = document.createElement('p');
      head.className = 'row cross cross-head';
      head.appendChild(span('cross-rank', 'w1'));
      head.appendChild(span('cross-rank', 'w2'));
      head.appendChild(span('cross-word', 'word'));
      frag.appendChild(head);

      matches.forEach(function (match) {
        var row = document.createElement('p');
        row.className = 'row cross';
        row.appendChild(span(match.r1 ? 'cross-rank' : 'cross-rank absent', match.r1 ? pad(match.r1, 5) : '—'));
        row.appendChild(span(match.r2 ? 'cross-rank' : 'cross-rank absent', match.r2 ? pad(match.r2, 5) : '—'));
        row.appendChild(span('cross-word', match.word));
        frag.appendChild(row);
      });
    }

    function draw() {
      var frag = document.createDocumentFragment();

      if (query) {
        var matches = crossSearch(query);
        renderCross(frag, matches);
        mount.className = 'cross-list';
        count.textContent = pad(matches.length, 5) + ' matches · both lists';
      } else {
        var items = lists[active].items;
        var all = [];
        for (var i = 0; i < items.length; i += 1) all.push(i);
        renderGrid(frag, items, all);
        mount.className = 'word-grid';
        count.textContent = pad(items.length, 5) + ' words';
      }

      mount.replaceChildren(frag);
    }

    function renderTabs() {
      var frag = document.createDocumentFragment();
      lists.forEach(function (list, index) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'list-tab';
        if (index === active) button.setAttribute('aria-current', 'true');
        button.appendChild(span('tab-lat', list.label));
        button.appendChild(span('tab-ja', list.ja));
        button.addEventListener('click', function () { setActive(index); });
        frag.appendChild(button);
      });
      tabs.replaceChildren(frag);
    }

    function setActive(index) {
      active = index;
      document.body.dataset.list = lists[index].key;
      try {
        var url = new URL(window.location.href);
        url.searchParams.set('list', lists[index].key);
        window.history.replaceState(null, '', url);
      } catch (err) {
      }
      renderTabs();
      draw();
    }

    function syncTabs() {
      tabs.hidden = Boolean(query);
    }

    document.body.dataset.list = lists[active].key;
    renderTabs();
    draw();
    syncTabs();

    var timer;
    search.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        query = search.value.trim().toLowerCase();
        draw();
        syncTabs();
      }, DEBOUNCE_MS);
    });
  }

  function renderProgress(value) {
    var filled = Math.max(0, Math.min(10, Math.round(Number(value) || 0)));

    var bar = document.createElement('div');
    bar.className = 'progress';
    bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-valuemin', '0');
    bar.setAttribute('aria-valuemax', '10');
    bar.setAttribute('aria-valuenow', String(filled));
    bar.setAttribute('aria-label', 'progress ' + filled + ' of 10');
    bar.title = filled + '/10';

    for (var i = 1; i <= 10; i += 1) {
      bar.appendChild(span(i <= filled ? 'seg on' : 'seg', ''));
    }
    return bar;
  }

  function renderGames(mount, entries) {
    var frag = document.createDocumentFragment();

    entries.forEach(function (entry) {
      var game = entry.game;
      var card = document.createElement('article');
      card.className = 'game';

      var head = document.createElement('div');
      head.className = 'game-head';
      head.appendChild(span('rank', pad(entry.index + 1, 4)));

      if (game.years && game.years.length) {
        head.appendChild(span('game-years', game.years.join(' · ')));
      }
      card.appendChild(head);

      card.appendChild(span('game-title', game.title));
      card.appendChild(renderProgress(game.progress));

      var foot = document.createElement('div');
      foot.className = 'game-foot';
      foot.appendChild(span('game-platform', game.platform || ''));
      if (game.hours) foot.appendChild(span('game-hours', '~' + game.hours + ' h'));
      card.appendChild(foot);

      frag.appendChild(card);
    });

    mount.replaceChildren(frag);
  }

  var SORT_KEY = 'games-sort';

  function byNumber(field, unknownLast) {
    return function (a, b, descending) {
      var av = Number(a.game[field]) || 0;
      var bv = Number(b.game[field]) || 0;
      if (unknownLast && !av !== !bv) return av ? -1 : 1;
      var result = av - bv;
      return (descending ? -result : result) || a.index - b.index;
    };
  }

  var SORTS = [
    {
      key: 'list', label: 'list',
      compare: function (a, b, descending) {
        var result = a.index - b.index;
        return descending ? -result : result;
      },
    },
    {
      key: 'platform', label: 'platform',
      compare: function (a, b, descending) {
        var result = (a.game.platform || '').localeCompare(b.game.platform || '');
        return (descending ? -result : result) || a.index - b.index;
      },
    },
    { key: 'time', label: 'time', compare: byNumber('hours', true) },
    { key: 'progress', label: 'progress', compare: byNumber('progress', false) },
  ];

  function readSort() {
    try {
      var saved = JSON.parse(localStorage.getItem(SORT_KEY));
      if (saved && SORTS.some(function (s) { return s.key === saved.key; })) return saved;
    } catch (err) {
    }
    return { key: 'list', descending: false };
  }

  var SECTIONS = ['playing', 'backlog', 'finished'];

  function initGames(games) {
    var bar = document.getElementById('sort');
    var sort = readSort();

    var groups = SECTIONS.map(function (status) {
      var mount = document.getElementById('games-' + status);
      var count = document.getElementById('count-' + status);
      var entries = games
        .filter(function (game) { return (game.status || 'playing') === status; })
        .map(function (game, index) { return { game: game, index: index }; });
      return { status: status, mount: mount, count: count, entries: entries };
    });

    function draw() {
      var spec = SORTS.filter(function (s) { return s.key === sort.key; })[0] || SORTS[0];

      groups.forEach(function (group) {
        if (!group.mount) return;
        var ordered = group.entries.slice().sort(function (a, b) {
          return spec.compare(a, b, sort.descending);
        });
        renderGames(group.mount, ordered);

        var section = group.mount.closest('section');
        if (section) section.hidden = group.entries.length === 0;
        if (group.count) group.count.textContent = pad(group.entries.length, 4) + ' titles';
      });
    }

    function renderBar() {
      if (!bar) return;
      var frag = document.createDocumentFragment();
      frag.appendChild(span('sort-label', 'sort'));

      SORTS.forEach(function (spec) {
        var active = spec.key === sort.key;
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'list-tab';
        if (active) button.setAttribute('aria-current', 'true');
        button.appendChild(span('tab-lat', spec.label));
        if (active) button.appendChild(span('tab-dir', sort.descending ? '▼' : '▲'));

        button.addEventListener('click', function () {
          sort = active
            ? { key: spec.key, descending: !sort.descending }
            : { key: spec.key, descending: false };
          try {
            localStorage.setItem(SORT_KEY, JSON.stringify(sort));
          } catch (err) {
          }
          renderBar();
          draw();
        });

        frag.appendChild(button);
      });

      bar.replaceChildren(frag);
    }

    renderBar();
    draw();
  }

  var nav = document.getElementById('nav');
  if (nav) renderNav(nav);

  if (document.getElementById('games-playing')) {
    var list = window.GAMES || [];
    initGames(list);
    return;
  }

  var mount = document.getElementById('list');
  if (!mount) return;

  if (mount.dataset.mode === 'words') {
    initWords(mount);
    return;
  }

  var items = window.KANJI;
  if (!items) throw new Error('data/kanji.js did not load');

  initList(mount, items, mount.dataset.mode);
})();
