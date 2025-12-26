---
title: "Hiragana Basic Syllables"
description: "Learn k, s, t, n, h, m, y, r, w row hiragana"
nodes:
  - id: "syllables"
    type: "text"
    position: { x: 250, y: 50 }
    data: { label: "音節\nSyllables", color: "green-500" }
  - id: "consonant"
    type: "text"
    position: { x: 50, y: 150 }
    data: { label: "子音\nConsonant", color: "blue-500" }
  - id: "k-row"
    type: "text"
    position: { x: 150, y: 150 }
    data: { label: "か行\nKa-row", color: "amber-500" }
  - id: "s-row"
    type: "text"
    position: { x: 250, y: 150 }
    data: { label: "さ行\nSa-row", color: "amber-500" }
  - id: "t-row"
    type: "text"
    position: { x: 350, y: 150 }
    data: { label: "た行\nTa-row", color: "amber-500" }
  - id: "special-sounds"
    type: "text"
    position: { x: 50, y: 280 }
    data: { label: "特殊音\nSpecial sounds", color: "purple-500" }
  - id: "n-row"
    type: "text"
    position: { x: 150, y: 280 }
    data: { label: "な行\nNa-row", color: "amber-500" }
  - id: "h-row"
    type: "text"
    position: { x: 250, y: 280 }
    data: { label: "は行\nHa-row", color: "amber-500" }
  - id: "m-row"
    type: "text"
    position: { x: 350, y: 280 }
    data: { label: "ま行\nMa-row", color: "amber-500" }
  - id: "y-row"
    type: "text"
    position: { x: 50, y: 400 }
    data: { label: "や行\nYa-row", color: "amber-500" }
  - id: "r-row"
    type: "text"
    position: { x: 150, y: 400 }
    data: { label: "ら行\nRa-row", color: "amber-500" }
  - id: "w-row"
    type: "text"
    position: { x: 250, y: 400 }
    data: { label: "わ行\nWa-row", color: "amber-500" }
edges:
  - id: "e1"
    source: "syllables"
    target: "consonant"
  - id: "e2"
    source: "consonant"
    target: "k-row"
  - id: "e3"
    source: "consonant"
    target: "s-row"
  - id: "e4"
    source: "consonant"
    target: "t-row"
  - id: "e5"
    source: "consonant"
    target: "special-sounds"
  - id: "e6"
    source: "special-sounds"
    target: "n-row"
  - id: "e7"
    source: "special-sounds"
    target: "h-row"
  - id: "e8"
    source: "special-sounds"
    target: "m-row"
  - id: "e9"
    source: "special-sounds"
    target: "y-row"
  - id: "e10"
    source: "special-sounds"
    target: "r-row"
  - id: "e11"
    source: "special-sounds"
    target: "w-row"
---

母音を覚えたら、子音と組み合わせた音節を学びましょう。か行はか、き、く、け、こです。「か」は「k」の音に「a」の音を組み合わせた音です。「き」は「ki」、「く」は「ku」、「け」は「ke」、「こ」は「ko」と発音します。このように、一つの子音と一つの母音を組み合わせて音節を作ります。日本語の大部分は、この方法で音節が作られています。

さ行はさ、し、す、せ、そです。ただし、「し」と「つ」は特殊な発音になります。「し」は「shi」、「つ」は「tsu」と発音します。これは慣れるまで少し難しいかもしれません。しっかり練習しましょう。正しい発音を覚えると、自然に読めるようになります。

た行はた、ち、つ、て、とです。「ち」は「chi」と発音します。「つ」は「tsu」と発音します。これらも特殊な音です。特に「ち」と「つ」は、英語の「ch」と「ts」の音に近いです。口の形を意識して発音しましょう。

な行、は行、ま行は比較的覚えやすいです。「な行」はな、に、ぬ、ね、のです。「は行」はは、ひ、ふ、へ、ほです。「ま行」はま、み、む、め、もです。「ふ」は「fu」と発音します。唇を少し開けて発音します。この発音も少し特殊です。

や行、ら行、わ行も覚えましょう。「や行」はや、ゆ、よです。「ら行」はら、り、る、れ、ろです。「わ行」はわ、をです。「を」は助詞としてのみ使われ、発音は「お」と同じです。五十音表という表で整理して覚えると便利です。毎日少しずつ練習して、全部覚えましょう。
