(function () {
  'use strict';

  var pad = window.PQ.pad;
  var span = window.PQ.span;

  var songs = window.LYRICS || [];
  var mount = document.getElementById('lyrics');
  if (!mount || songs.length === 0) return;

  var tabs = document.getElementById('song-toggle');
  var title = document.getElementById('song-title');
  var count = document.getElementById('count');

  var wanted = new URLSearchParams(window.location.search).get('song');
  var active = 0;
  songs.forEach(function (song, index) {
    if (song.key === wanted) active = index;
  });

  function draw() {
    var song = songs[active];
    var frag = document.createDocumentFragment();

    song.stanzas.forEach(function (stanza) {
      var block = document.createElement('div');
      block.className = 'stanza';
      stanza.forEach(function (line) {
        var row = document.createElement('p');
        row.textContent = line;
        block.appendChild(row);
      });
      frag.appendChild(block);
    });

    mount.replaceChildren(frag);
    title.textContent = song.label;

    var lines = song.stanzas.reduce(function (total, stanza) {
      return total + stanza.length;
    }, 0);
    count.textContent = song.ja + ' · ' + pad(lines, 4) + ' lines';
  }

  function renderTabs() {
    var frag = document.createDocumentFragment();

    songs.forEach(function (song, index) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'list-tab';
      if (index === active) button.setAttribute('aria-current', 'true');
      button.appendChild(span('tab-lat', song.label));
      button.appendChild(span('tab-ja', song.ja));
      button.addEventListener('click', function () {
        setActive(index);
      });
      frag.appendChild(button);
    });

    tabs.replaceChildren(frag);
  }

  function setActive(index) {
    active = index;
    try {
      var url = new URL(window.location.href);
      url.searchParams.set('song', songs[index].key);
      window.history.replaceState(null, '', url);
    } catch (err) {
    }
    renderTabs();
    draw();
  }

  renderTabs();
  draw();
})();
