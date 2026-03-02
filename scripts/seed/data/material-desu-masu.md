---
title: "Desu/Masu Forms"
description: "Learn basic Japanese sentence pattern with desu and masu"
nodes:
  - id: "politeness"
    type: "text"
    position: { x: 250, y: 50 }
    data: { label: "丁寧語\nPoliteness", color: "green-500" }
  - id: "desu"
    type: "text"
    position: { x: 100, y: 150 }
    data: { label: "です\nDesu", color: "blue-500" }
  - id: "masu"
    type: "text"
    position: { x: 400, y: 150 }
    data: { label: "ます\nMasu", color: "blue-500" }
  - id: "copula"
    type: "text"
    position: { x: 50, y: 280 }
    data: { label: "コピュラ\nCopula", color: "amber-500" }
  - id: "verb"
    type: "text"
    position: { x: 200, y: 280 }
    data: { label: "動詞\nVerb", color: "amber-500" }
  - id: "noun"
    type: "text"
    position: { x: 350, y: 280 }
    data: { label: "名詞\nNoun", color: "amber-500" }
  - id: "topic"
    type: "text"
    position: { x: 500, y: 280 }
    data: { label: "トピック\nTopic", color: "purple-500" }
  - id: "question"
    type: "text"
    position: { x: 50, y: 400 }
    data: { label: "疑問\nQuestion", color: "red-500" }
  - id: "negative"
    type: "text"
    position: { x: 200, y: 400 }
    data: { label: "否定\nNegative", color: "red-500" }
  - id: "sentence"
    type: "text"
    position: { x: 350, y: 400 }
    data: { label: "文章\nSentence", color: "purple-500" }
edges:
  - id: "e1"
    source: "politeness"
    target: "desu"
  - id: "e2"
    source: "politeness"
    target: "masu"
  - id: "e3"
    source: "desu"
    target: "copula"
  - id: "e4"
    source: "desu"
    target: "noun"
  - id: "e5"
    source: "masu"
    target: "verb"
  - id: "e6"
    source: "noun"
    target: "topic"
  - id: "e7"
    source: "topic"
    target: "sentence"
  - id: "e8"
    source: "verb"
    target: "sentence"
  - id: "e9"
    source: "desu"
    target: "question"
  - id: "e10"
    source: "masu"
    target: "question"
  - id: "e11"
    source: "desu"
    target: "negative"
  - id: "e12"
    source: "masu"
    target: "negative"
---

日本語で丁寧に話すためには、「です」と「ます」を覚えましょう。これは丁寧語と呼ばれる最も基本的な敬語です。日常会話でよく使われます。まずはこの二つをしっかり覚えましょう。丁寧に話すと、相手に良い印象を与えられます。

「です」は名詞や形容詞に付いて、文を丁寧にします。「私は学生です」「これは本です」のように使います。「XはYです」という文型は最も基本的なものです。「は」はトピックを示し、「Y」はトピックについての説明です。この文型は日本語で頻繁に使われます。

「ます」は動詞に付いて、丁寧な文を作ります。動詞の辞書形の「る」を「ます」に変えて使います。「食べる」は「食べます」、「飲む」は「飲みます」、「行く」は「行きます」のように変えます。「来る」は「来ます」、「する」は「します」となります。これらは不規則な変化です。覚えて使いましょう。

「です」と「ます」の否定形も覚えましょう。「です」の否定形は「ではありません」です。「私は学生ではありません」「これは本ではありません」のように使います。口語では「じゃありません」も使われます。「ます」の否定形は「ません」です。「食べます」は「食べません」、「飲みます」は「飲みません」のように変えます。

疑問文も作れます。「です」と「ます」の文の最後に「か」を付けると疑問文になります。「あなたは学生ですか？」「これは本ですか？」「何を食べますか？」のように使います。質問をするときや確認するときによく使われます。日常会話で頻繁に使われますから、自然に使えるように練習しましょう。
