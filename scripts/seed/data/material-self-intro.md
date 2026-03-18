---
title: "Self Introduction"
description: "Learn to introduce yourself in Japanese"
nodes:
    - id: "identity"
      type: "text"
      position: { x: 280, y: 40 }
      data: { label: "自己紹介", color: "green" }
    - id: "watashi"
      type: "text"
      position: { x: 80, y: 180 }
      data: { label: "私", color: "blue" }
    - id: "name"
      type: "text"
      position: { x: 220, y: 340 }
      data: { label: "名前", color: "amber" }
    - id: "nationality"
      type: "text"
      position: { x: 360, y: 340 }
      data: { label: "国籍", color: "amber" }
    - id: "job"
      type: "text"
      position: { x: 500, y: 340 }
      data: { label: "職業", color: "amber" }
    - id: "hajimemashite"
      type: "text"
      position: { x: 120, y: 500 }
      data: { label: "初めまして", color: "red" }
    - id: "yoroshiku"
      type: "text"
      position: { x: 320, y: 500 }
      data: { label: "よろしくお願いします", color: "red" }
    - id: "desu"
      type: "text"
      position: { x: 620, y: 500 }
      data: { label: "です", color: "purple" }
    - id: "politeness"
      type: "text"
      position: { x: 780, y: 500 }
      data: { label: "丁寧表現", color: "purple" }
    - id: "conn-elements"
      type: "connector"
      position: { x: 220, y: 250 }
      data: { label: "では" }
    - id: "conn-start"
      type: "connector"
      position: { x: 200, y: 430 }
      data: { label: "は最初に言う" }
    - id: "conn-end"
      type: "connector"
      position: { x: 360, y: 430 }
      data: { label: "は最後に言う" }
    - id: "conn-pattern"
      type: "connector"
      position: { x: 620, y: 430 }
      data: { label: "を使って述べる" }
    - id: "conn-polite"
      type: "connector"
      position: { x: 700, y: 500 }
      data: { label: "は" }
edges:
    - id: "e1"
      source: "identity"
      target: "conn-elements"
    - id: "e2"
      source: "conn-elements"
      target: "watashi"
    - id: "e3"
      source: "conn-elements"
      target: "name"
    - id: "e4"
      source: "conn-elements"
      target: "nationality"
    - id: "e5"
      source: "conn-elements"
      target: "job"
    - id: "e6"
      source: "identity"
      target: "conn-start"
    - id: "e7"
      source: "conn-start"
      target: "hajimemashite"
    - id: "e8"
      source: "identity"
      target: "conn-end"
    - id: "e9"
      source: "conn-end"
      target: "yoroshiku"
    - id: "e10"
      source: "name"
      target: "conn-pattern"
    - id: "e11"
      source: "nationality"
      target: "conn-pattern"
    - id: "e12"
      source: "job"
      target: "conn-pattern"
    - id: "e13"
      source: "conn-pattern"
      target: "desu"
    - id: "e14"
      source: "desu"
      target: "conn-polite"
    - id: "e15"
      source: "conn-polite"
      target: "politeness"
---

初めて会う人に自分を紹介するときは、「初めまして」と言います。これは「初めてお会いします」という意味の挨拶です。英語の「Nice to meet you」と同じような言葉です。自己紹介を始めるとき、まずこの言葉を言いましょう。相手に良い印象を与えられます。日本語のコミュニケーションでは、初対面の挨拶がとても大切です。

自分のことを言うときは、「私」を使います。これは「私」という意味で、男性も女性も使えます。男性の場合は「僕」や「俺」も使えますが、初対面では「私」が無難です。名前を言うときは、「私[名前]です」と言います。これは「私は[名前]です」という意味です。自分の名前をはっきり言いましょう。

国籍や職業も言えます。国籍は「日本人」「アメリカ人」などと言えます。職業は「学生」「会社員」「先生」などと言えます。「私は学生です」「私は会社員です」のように言います。初対面では、簡潔に自分を紹介するのがいいでしょう。相手も紹介しやすいです。

「です」は文を丁寧にする言葉です。名詞や形容詞に付けて使います。「は」はトピックを示す助詞です。「私」の後ろに付けて、「私」について話すという意味です。「私は学生です」は「私は学生だ」という丁寧な言い方です。この文型は日本語で最もよく使われます。

「よろしくお願いします」はとても重要です。自己紹介の最後に言います。「どうぞよろしくお願いします」という意味です。人間関係を始めるときによく使われます。相手に敬意を表す言葉です。覚えて使うと、良い関係が築けます。自然に言えるように練習しましょう。
