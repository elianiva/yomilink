---
title: "Basic Greetings"
description: "Essential Japanese greetings for everyday use"
nodes:
    - id: "greeting"
      type: "text"
      position: { x: 260, y: 40 }
      data: { label: "挨拶", color: "green" }
    - id: "time"
      type: "text"
      position: { x: 80, y: 180 }
      data: { label: "時間", color: "blue" }
    - id: "relationship"
      type: "text"
      position: { x: 440, y: 180 }
      data: { label: "人間関係", color: "blue" }
    - id: "morning"
      type: "text"
      position: { x: 40, y: 340 }
      data: { label: "朝", color: "amber" }
    - id: "afternoon"
      type: "text"
      position: { x: 180, y: 340 }
      data: { label: "昼", color: "amber" }
    - id: "evening"
      type: "text"
      position: { x: 320, y: 340 }
      data: { label: "夜", color: "amber" }
    - id: "farewell"
      type: "text"
      position: { x: 460, y: 340 }
      data: { label: "別れの挨拶", color: "purple" }
    - id: "politeness"
      type: "text"
      position: { x: 620, y: 340 }
      data: { label: "丁寧さ", color: "purple" }
    - id: "gratitude"
      type: "text"
      position: { x: 540, y: 490 }
      data: { label: "感謝", color: "red" }
    - id: "apology"
      type: "text"
      position: { x: 700, y: 490 }
      data: { label: "謝罪", color: "red" }
    - id: "conn-types"
      type: "connector"
      position: { x: 260, y: 110 }
      data: { label: "には" }
    - id: "conn-time"
      type: "connector"
      position: { x: 140, y: 260 }
      data: { label: "の挨拶は" }
    - id: "conn-rel"
      type: "connector"
      position: { x: 520, y: 260 }
      data: { label: "で変わる" }
    - id: "conn-polite"
      type: "connector"
      position: { x: 620, y: 420 }
      data: { label: "に含まれる" }
    - id: "conn-used"
      type: "connector"
      position: { x: 370, y: 420 }
      data: { label: "でも大切" }
edges:
    - id: "e1"
      source: "greeting"
      target: "conn-types"
    - id: "e2"
      source: "conn-types"
      target: "time"
    - id: "e3"
      source: "conn-types"
      target: "relationship"
    - id: "e4"
      source: "time"
      target: "conn-time"
    - id: "e5"
      source: "conn-time"
      target: "morning"
    - id: "e6"
      source: "conn-time"
      target: "afternoon"
    - id: "e7"
      source: "conn-time"
      target: "evening"
    - id: "e8"
      source: "relationship"
      target: "conn-rel"
    - id: "e9"
      source: "conn-rel"
      target: "farewell"
    - id: "e10"
      source: "conn-rel"
      target: "politeness"
    - id: "e11"
      source: "politeness"
      target: "conn-polite"
    - id: "e12"
      source: "conn-polite"
      target: "gratitude"
    - id: "e13"
      source: "conn-polite"
      target: "apology"
    - id: "e14"
      source: "morning"
      target: "conn-used"
    - id: "e15"
      source: "afternoon"
      target: "conn-used"
    - id: "e16"
      source: "evening"
      target: "conn-used"
    - id: "e17"
      source: "conn-used"
      target: "politeness"
---

日本では、挨拶は毎日の生活でとても大切です。朝起きたとき、「おはようございます」と言います。これは朝の挨拶で、家族や友達、職場の人などに使います。午前十時くらいまで使うのが普通です。家族のような親しい間柄では、「おはよう」と短く言ってもいいです。挨拶は人間関係を始める基本ですから、しっかり覚えましょう。

午前十時から午後六時くらいまでは、「こんにちは」と言います。これは昼間の挨拶で、誰にでも使える便利な言葉です。友達に会ったとき、会社に入ったとき、近所の人に会ったときなど、いろいろな場面で使えます。親しい間柄でも、少し丁寧な関係でも使えるので、とても重宝します。覚えやすくて、使いやすい挨拶です。

夕方から夜にかけては、「こんばんは」と言います。家に帰ってきたとき、夜に会ったときなどに使います。夜の挨拶は、少し落ち着いた感じがあります。家族や友達には、夜も挨拶を忘れずに言いましょう。夜は一日の終わりなので、挨拶を言うことで一日を締めくくる意味もあります。挨拶をするだけで、人間関係がよくなります。

別れるときは、「さようなら」や「またね」と言います。「さようなら」は、しばらく会わない人に使います。明日また会うような場合は、「また明日ね」と言います。友達との別れでは、「じゃあね」もよく使います。場面や関係に合った言葉を選びましょう。適切な別れの言葉を使うと、良い印象を与えられます。次会うときも気持ちよく話せます。

感謝や謝罪の言葉も大切です。「ありがとうございます」は感謝を表します。誰かが何かしてくれたとき、プレゼントをもらったときなどに使います。「すみません」は、謝罪や依頼のときに使います。道を尋ねるとき、何かを頼むときにも使えます。日常的に使う言葉なので、自然に言えるように練習しましょう。正しい言葉を適切に使うと、スムーズなコミュニケーションができます。
