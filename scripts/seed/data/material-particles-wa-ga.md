---
title: "Particles Wa and Ga"
description: "Learn difference between Japanese particles wa and ga"
nodes:
  - id: "particles"
    type: "text"
    position: { x: 250, y: 50 }
    data: { label: "助詞\nParticles", color: "green-500" }
  - id: "wa"
    type: "text"
    position: { x: 100, y: 150 }
    data: { label: "は\nWa", color: "blue-500" }
  - id: "ga"
    type: "text"
    position: { x: 400, y: 150 }
    data: { label: "が\nGa", color: "blue-500" }
  - id: "topic"
    type: "text"
    position: { x: 50, y: 280 }
    data: { label: "トピック\nTopic", color: "amber-500" }
  - id: "subject"
    type: "text"
    position: { x: 200, y: 280 }
    data: { label: "主格\nSubject", color: "amber-500" }
  - id: "known"
    type: "text"
    position: { x: 50, y: 400 }
    data: { label: "既知\nKnown", color: "purple-500" }
  - id: "new"
    type: "text"
    position: { x: 200, y: 400 }
    data: { label: "新情報\nNew", color: "purple-500" }
  - id: "contrast"
    type: "text"
    position: { x: 350, y: 280 }
    data: { label: "対比\nContrast", color: "red-500" }
  - id: "emphasis"
    type: "text"
    position: { x: 350, y: 400 }
    data: { label: "強調\nEmphasis", color: "red-500" }
  - id: "question"
    type: "text"
    position: { x: 500, y: 340 }
    data: { label: "疑問詞\nQuestion word", color: "blue-500" }
edges:
  - id: "e1"
    source: "particles"
    target: "wa"
  - id: "e2"
    source: "particles"
    target: "ga"
  - id: "e3"
    source: "wa"
    target: "topic"
  - id: "e4"
    source: "ga"
    target: "subject"
  - id: "e5"
    source: "topic"
    target: "known"
  - id: "e6"
    source: "subject"
    target: "new"
  - id: "e7"
    source: "wa"
    target: "contrast"
  - id: "e8"
    source: "ga"
    target: "emphasis"
  - id: "e9"
    source: "ga"
    target: "question"
  - id: "e10"
    source: "known"
    target: "contrast"
  - id: "e11"
    source: "new"
    target: "emphasis"
---

日本語の助詞「は」と「が」は、どちらも主語を示しますが、使い方が違います。この違いを理解することは、自然な日本語を話すためにとても大切です。まずは「は」から覚えましょう。「は」はトピックを示す助詞です。「私は学生です」「日本は広いです」のように使います。「は」は話題について言うときに使われます。

「は」は既知の情報を示します。聞き手がすでに知っている情報に使われます。「私は田中です」と言うとき、「私」は既に知っている情報として扱われます。対比を示すときにも使われます。「私は行きますが、田中さんは行きません」のように、対比的に使われます。このように、「は」は話題を設定する役割があります。

「が」は主格を示す助詞です。「誰が」「何が」のように、行為者を強調します。「雨が降っています」「田中さんが来ました」のように使われます。このとき、焦点が主語にあります。「雨が」と言うことで、「雨」に焦点があることがわかります。「は」と違うニュアンスです。

「が」は新しい情報を示します。初めて出てくる情報に使われます。「誰が来ましたか？」という質問に対して、「田中さんが来ました」と答えます。このとき、「田中さん」は新しい情報です。初対面や質問に対する答えでよく使われます。

疑問詞の後ろには「が」を使います。「誰が来ますか？」「何が好きですか？」「どこがいいですか？」のように使います。疑問詞の後ろに「は」は使いません。これはルールです。覚えて使いましょう。質問をするときは、疑問詞＋「が」＋動詞の形になります。

「は」と「が」の使い分けは、自然な日本語を話すために大切です。場面によって適切な助詞を選びましょう。多く練習すると、自然と使い分けられるようになります。日常会話で多く使われますから、しっかり覚えましょう。
