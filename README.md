# [platqr.github.io](https://platqr.github.io/)

(・_・)ノ

A small static reference site holding Japanese kanji and word-frequency lists,
kept online so they're one click away.

| Page                | Contents                          |
| ------------------- | --------------------------------- |
| `index.html`        | 7,744 kanji, ordered by frequency |
| `wordList1.html`    | 15,000 words                      |
| `wordList2.html`    | 10,000 words                      |

Each list has a filter box — type any substring to narrow it down.

## Layout

```
index.html  wordList1.html  wordList2.html   list pages
style.css                                    all styling
app.js                                       all rendering and filtering
data/kanji.js  data/words1.js  data/words2.js   the lists themselves
```

No build step and no dependencies. The only external requests are the two
Google Fonts hosts, for Archivo and Space Mono; Japanese glyphs come from the
system font, so no CJK webfont is ever downloaded. Open `index.html` in a
browser and it works, whether served over HTTP or straight off disk — without
the network it simply falls back to Helvetica/Arial.

## Design

Warm paper, near-black ink, one hot accent, hairline rules and zero-padded
section codes — after Ridge Racer Type 4 and The Designers Republic. Each list
page carries its own accent, following the R4 team liveries. A light and a dark
variant both ship; the site follows the system setting, and the header toggle
overrides it.

## Adding a word

The data files are plain lists, one entry per line, ordered by frequency. Add a
line in the right place:

```js
window.WORDS1 = [
  "の",
  "に",
  "バックグラウンド",
];
```

The rank shown next to each entry is just its position in the file, so inserting
in the middle renumbers everything after it automatically.

## Sources

The frequency lists were compiled from public Japanese corpus frequency data.
