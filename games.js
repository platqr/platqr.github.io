(function () {
  'use strict';

  var pad = window.PQ.pad;
  var span = window.PQ.span;

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

  initGames(window.GAMES || []);
})();
