---
title: "Self Introduction"
description: "Learn to introduce yourself in Japanese"
nodes:
  - id: "identity"
    type: "text"
    position: { x: 250, y: 50 }
    data: { label: "自己紹介\nSelf-intro", color: "green-500" }
  - id: "watashi"
    type: "text"
    position: { x: 50, y: 150 }
    data: { label: "私\nWatashi", color: "blue-500" }
  - id: "name"
    type: "text"
    position: { x: 150, y: 150 }
    data: { label: "名前\nName", color: "amber-500" }
  - id: "nationality"
    type: "text"
    position: { x: 250, y: 150 }
    data: { label: "国籍\nNationality", color: "amber-500" }
  - id: "job"
    type: "text"
    position: { x: 350, y: 150 }
    data: { label: "職業\nJob", color: "amber-500" }
  - id: "topic"
    type: "text"
    position: { x: 50, y: 280 }
    data: { label: "トピック\nTopic", color: "blue-500" }
  - id: "particle-wa"
    type: "text"
    position: { x: 150, y: 280 }
    data: { label: "は\nWa", color: "purple-500" }
  - id: "copula"
    type: "text"
    position: { x: 250, y: 280 }
    data: { label: "です\nDesu", color: "purple-500" }
  - id: "hajimemashite"
    type: "text"
    position: { x: 50, y: 400 }
    data: { label: "初めまして\nFirst meeting", color: "red-500" }
  - id: "yoroshiku"
    type: "text"
    position: { x: 250, y: 400 }
    data: { label: "よろしく\nRequest", color: "red-500" }
  - id: "politeness"
    type: "text"
    position: { x: 400, y: 280 }
    data: { label: "丁寧\nPoliteness", color: "red-500" }
edges:
  - id: "e1"
    source: "identity"
    target: "watashi"
  - id: "e2"
    source: "watashi"
    target: "name"
  - id: "e3"
    source: "watashi"
    target: "nationality"
  - id: "e4"
    source: "watashi"
    target: "job"
  - id: "e5"
    source: "watashi"
    target: "topic"
  - id: "e6"
    source: "topic"
    target: "particle-wa"
  - id: "e7"
    source: "particle-wa"
    target: "copula"
  - id: "e8"
    source: "copula"
    target: "politeness"
  - id: "e9"
    source: "identity"
    target: "hajimemashite"
  - id: "e10"
    source: "identity"
    target: "yoroshiku"
  - id: "e11"
    source: "name"
    target: "copula"
  - id: "e12"
    source: "nationality"
    target: "copula"
  - id: "e13"
    source: "job"
    target: "copula"
---

初めて会う人に自分を紹介するときは、「初めまして」と言います。これは「初めてお会いします」という意味の挨拶です。英語の「Nice to meet you」と同じような言葉です。自己紹介を始めるとき、まずこの言葉を言いましょう。相手に良い印象を与えられます。日本語のコミュニケーションでは、初対面の挨拶がとても大切です。

自分のことを言うときは、「私」を使います。これは「私」という意味で、男性も女性も使えます。男性の場合は「僕」や「俺」も使えますが、初対面では「私」が無難です。名前を言うときは、「私[名前]です」と言います。これは「私は[名前]です」という意味です。自分の名前をはっきり言いましょう。

国籍や職業も言えます。国籍は「日本人」「アメリカ人」などと言えます。職業は「学生」「会社員」「先生」などと言えます。「私は学生です」「私は会社員です」のように言います。初対面では、簡潔に自分を紹介するのがいいでしょう。相手も紹介しやすいです。

「です」は文を丁寧にする言葉です。名詞や形容詞に付けて使います。「は」はトピックを示す助詞です。「私」の後ろに付けて、「私」について話すという意味です。「私は学生です」は「私は学生だ」という丁寧な言い方です。この文型は日本語で最もよく使われます。

「よろしくお願いします」はとても重要です。自己紹介の最後に言います。「どうぞよろしくお願いします」という意味です。人間関係を始めるときによく使われます。相手に敬意を表す言葉です。覚えて使うと、良い関係が築けます。自然に言えるように練習しましょう。
