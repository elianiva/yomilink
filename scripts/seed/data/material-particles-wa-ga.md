---
title: "Particles Wa and Ga"
description: "Learn difference between Japanese particles wa and ga"
nodes:
    - id: "particles"
      type: "text"
      position: { x: 300, y: 40 }
      data: { label: "助詞", color: "green" }
    - id: "wa"
      type: "text"
      position: { x: 140, y: 180 }
      data: { label: "は", color: "blue" }
    - id: "ga"
      type: "text"
      position: { x: 460, y: 180 }
      data: { label: "が", color: "blue" }
    - id: "topic"
      type: "text"
      position: { x: 60, y: 340 }
      data: { label: "話題", color: "amber" }
    - id: "known"
      type: "text"
      position: { x: 200, y: 340 }
      data: { label: "既知情報", color: "purple" }
    - id: "contrast"
      type: "text"
      position: { x: 340, y: 340 }
      data: { label: "対比", color: "red" }
    - id: "subject"
      type: "text"
      position: { x: 460, y: 340 }
      data: { label: "主語", color: "amber" }
    - id: "new"
      type: "text"
      position: { x: 600, y: 340 }
      data: { label: "新情報", color: "purple" }
    - id: "emphasis"
      type: "text"
      position: { x: 740, y: 340 }
      data: { label: "強調", color: "red" }
    - id: "question"
      type: "text"
      position: { x: 660, y: 500 }
      data: { label: "疑問詞", color: "blue" }
    - id: "conn-main"
      type: "connector"
      position: { x: 300, y: 110 }
      data: { label: "には" }
    - id: "conn-wa-topic"
      type: "connector"
      position: { x: 100, y: 260 }
      data: { label: "は" }
    - id: "conn-topic-known"
      type: "connector"
      position: { x: 200, y: 420 }
      data: { label: "を示す" }
    - id: "conn-wa-contrast"
      type: "connector"
      position: { x: 320, y: 260 }
      data: { label: "は" }
    - id: "conn-ga-subject"
      type: "connector"
      position: { x: 460, y: 260 }
      data: { label: "は" }
    - id: "conn-subject-new"
      type: "connector"
      position: { x: 600, y: 420 }
      data: { label: "を示す" }
    - id: "conn-ga-emphasis"
      type: "connector"
      position: { x: 740, y: 260 }
      data: { label: "は" }
    - id: "conn-question"
      type: "connector"
      position: { x: 560, y: 500 }
      data: { label: "の後ろには" }
edges:
    - id: "e1"
      source: "particles"
      target: "conn-main"
    - id: "e2"
      source: "conn-main"
      target: "wa"
    - id: "e3"
      source: "conn-main"
      target: "ga"
    - id: "e4"
      source: "wa"
      target: "conn-wa-topic"
    - id: "e5"
      source: "conn-wa-topic"
      target: "topic"
    - id: "e6"
      source: "topic"
      target: "conn-topic-known"
    - id: "e7"
      source: "conn-topic-known"
      target: "known"
    - id: "e8"
      source: "wa"
      target: "conn-wa-contrast"
    - id: "e9"
      source: "conn-wa-contrast"
      target: "contrast"
    - id: "e10"
      source: "ga"
      target: "conn-ga-subject"
    - id: "e11"
      source: "conn-ga-subject"
      target: "subject"
    - id: "e12"
      source: "subject"
      target: "conn-subject-new"
    - id: "e13"
      source: "conn-subject-new"
      target: "new"
    - id: "e14"
      source: "ga"
      target: "conn-ga-emphasis"
    - id: "e15"
      source: "conn-ga-emphasis"
      target: "emphasis"
    - id: "e16"
      source: "question"
      target: "conn-question"
    - id: "e17"
      source: "conn-question"
      target: "ga"
---

日本語の助詞「は」と「が」は、どちらも主語を示しますが、使い方が違います。この違いを理解することは、自然な日本語を話すためにとても大切です。まずは「は」から覚えましょう。「は」はトピックを示す助詞です。「私は学生です」「日本は広いです」のように使います。「は」は話題について言うときに使われます。

「は」は既知の情報を示します。聞き手がすでに知っている情報に使われます。「私は田中です」と言うとき、「私」は既に知っている情報として扱われます。対比を示すときにも使われます。「私は行きますが、田中さんは行きません」のように、対比的に使われます。このように、「は」は話題を設定する役割があります。

「が」は主格を示す助詞です。「誰が」「何が」のように、行為者を強調します。「雨が降っています」「田中さんが来ました」のように使われます。このとき、焦点が主語にあります。「雨が」と言うことで、「雨」に焦点があることがわかります。「は」と違うニュアンスです。

「が」は新しい情報を示します。初めて出てくる情報に使われます。「誰が来ましたか？」という質問に対して、「田中さんが来ました」と答えます。このとき、「田中さん」は新しい情報です。初対面や質問に対する答えでよく使われます。

疑問詞の後ろには「が」を使います。「誰が来ますか？」「何が好きですか？」「どこがいいですか？」のように使います。疑問詞の後ろに「は」は使いません。これはルールです。覚えて使いましょう。質問をするときは、疑問詞＋「が」＋動詞の形になります。

「は」と「が」の使い分けは、自然な日本語を話すために大切です。場面によって適切な助詞を選びましょう。多く練習すると、自然と使い分けられるようになります。日常会話で多く使われますから、しっかり覚えましょう。
