---
title: "Desu/Masu Forms"
description: "Learn basic Japanese sentence pattern with desu and masu"
nodes:
    - id: "politeness"
      type: "text"
      position: { x: 290, y: 40 }
      data: { label: "丁寧語", color: "green" }
    - id: "desu"
      type: "text"
      position: { x: 140, y: 180 }
      data: { label: "です", color: "blue" }
    - id: "masu"
      type: "text"
      position: { x: 440, y: 180 }
      data: { label: "ます", color: "blue" }
    - id: "noun"
      type: "text"
      position: { x: 40, y: 340 }
      data: { label: "名詞", color: "amber" }
    - id: "adjective"
      type: "text"
      position: { x: 200, y: 340 }
      data: { label: "形容詞", color: "amber" }
    - id: "verb"
      type: "text"
      position: { x: 440, y: 340 }
      data: { label: "動詞", color: "amber" }
    - id: "question"
      type: "text"
      position: { x: 600, y: 340 }
      data: { label: "疑問文", color: "red" }
    - id: "negative"
      type: "text"
      position: { x: 740, y: 340 }
      data: { label: "否定形", color: "red" }
    - id: "conn-main"
      type: "connector"
      position: { x: 290, y: 110 }
      data: { label: "の中心は" }
    - id: "conn-desu-use"
      type: "connector"
      position: { x: 120, y: 260 }
      data: { label: "は主に" }
    - id: "conn-masu-use"
      type: "connector"
      position: { x: 440, y: 260 }
      data: { label: "は主に" }
    - id: "conn-desu-q"
      type: "connector"
      position: { x: 220, y: 420 }
      data: { label: "で作る" }
    - id: "conn-masu-q"
      type: "connector"
      position: { x: 520, y: 420 }
      data: { label: "で作る" }
    - id: "conn-desu-neg"
      type: "connector"
      position: { x: 300, y: 500 }
      data: { label: "の否定形は" }
    - id: "conn-masu-neg"
      type: "connector"
      position: { x: 560, y: 500 }
      data: { label: "の否定形は" }
    - id: "dewa-arimasen"
      type: "text"
      position: { x: 240, y: 580 }
      data: { label: "ではありません", color: "purple" }
    - id: "masen"
      type: "text"
      position: { x: 560, y: 580 }
      data: { label: "ません", color: "purple" }
edges:
    - id: "e1"
      source: "politeness"
      target: "conn-main"
    - id: "e2"
      source: "conn-main"
      target: "desu"
    - id: "e3"
      source: "conn-main"
      target: "masu"
    - id: "e4"
      source: "desu"
      target: "conn-desu-use"
    - id: "e5"
      source: "conn-desu-use"
      target: "noun"
    - id: "e6"
      source: "conn-desu-use"
      target: "adjective"
    - id: "e7"
      source: "masu"
      target: "conn-masu-use"
    - id: "e8"
      source: "conn-masu-use"
      target: "verb"
    - id: "e9"
      source: "desu"
      target: "conn-desu-q"
    - id: "e10"
      source: "conn-desu-q"
      target: "question"
    - id: "e11"
      source: "masu"
      target: "conn-masu-q"
    - id: "e12"
      source: "conn-masu-q"
      target: "question"
    - id: "e13"
      source: "desu"
      target: "conn-desu-neg"
    - id: "e14"
      source: "conn-desu-neg"
      target: "dewa-arimasen"
    - id: "e15"
      source: "masu"
      target: "conn-masu-neg"
    - id: "e16"
      source: "conn-masu-neg"
      target: "masen"
    - id: "e17"
      source: "dewa-arimasen"
      target: "conn-desu-q"
    - id: "e18"
      source: "masen"
      target: "conn-masu-q"
---

日本語で丁寧に話すためには、「です」と「ます」を覚えましょう。これは丁寧語と呼ばれる最も基本的な敬語です。日常会話でよく使われます。まずはこの二つをしっかり覚えましょう。丁寧に話すと、相手に良い印象を与えられます。

「です」は名詞や形容詞に付いて、文を丁寧にします。「私は学生です」「これは本です」のように使います。「XはYです」という文型は最も基本的なものです。「は」はトピックを示し、「Y」はトピックについての説明です。この文型は日本語で頻繁に使われます。

「ます」は動詞に付いて、丁寧な文を作ります。動詞の辞書形の「る」を「ます」に変えて使います。「食べる」は「食べます」、「飲む」は「飲みます」、「行く」は「行きます」のように変えます。「来る」は「来ます」、「する」は「します」となります。これらは不規則な変化です。覚えて使いましょう。

「です」と「ます」の否定形も覚えましょう。「です」の否定形は「ではありません」です。「私は学生ではありません」「これは本ではありません」のように使います。口語では「じゃありません」も使われます。「ます」の否定形は「ません」です。「食べます」は「食べません」、「飲みます」は「飲みません」のように変えます。

疑問文も作れます。「です」と「ます」の文の最後に「か」を付けると疑問文になります。「あなたは学生ですか？」「これは本ですか？」「何を食べますか？」のように使います。質問をするときや確認するときによく使われます。日常会話で頻繁に使われますから、自然に使えるように練習しましょう。
