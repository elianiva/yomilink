---
title: "Basic Greetings"
description: "Essential Japanese greetings for everyday use"
nodes:
  - id: "greeting"
    type: "text"
    position: { x: 200, y: 50 }
    data: { label: "挨拶\nAisatsu", color: "green-500" }
  - id: "time"
    type: "text"
    position: { x: 50, y: 150 }
    data: { label: "時間\nTime", color: "blue-500" }
  - id: "morning"
    type: "text"
    position: { x: 50, y: 250 }
    data: { label: "朝\nMorning", color: "amber-500" }
  - id: "afternoon"
    type: "text"
    position: { x: 200, y: 250 }
    data: { label: "昼\nAfternoon", color: "amber-500" }
  - id: "evening"
    type: "text"
    position: { x: 350, y: 250 }
    data: { label: "夜\nEvening", color: "amber-500" }
  - id: "relationship"
    type: "text"
    position: { x: 500, y: 150 }
    data: { label: "関係\nRelationship", color: "blue-500" }
  - id: "farewell"
    type: "text"
    position: { x: 500, y: 350 }
    data: { label: "別れ\nFarewell", color: "purple-500" }
  - id: "politeness"
    type: "text"
    position: { x: 50, y: 350 }
    data: { label: "丁寧さ\nPoliteness", color: "purple-500" }
  - id: "gratitude"
    type: "text"
    position: { x: 200, y: 450 }
    data: { label: "感謝\nGratitude", color: "red-500" }
  - id: "apology"
    type: "text"
    position: { x: 350, y: 450 }
    data: { label: "謝罪\nApology", color: "red-500" }
edges:
  - id: "e1"
    source: "greeting"
    target: "time"
  - id: "e2"
    source: "greeting"
    target: "relationship"
  - id: "e3"
    source: "time"
    target: "morning"
  - id: "e4"
    source: "time"
    target: "afternoon"
  - id: "e5"
    source: "time"
    target: "evening"
  - id: "e6"
    source: "relationship"
    target: "farewell"
  - id: "e7"
    source: "relationship"
    target: "politeness"
  - id: "e8"
    source: "politeness"
    target: "gratitude"
  - id: "e9"
    source: "politeness"
    target: "apology"
  - id: "e10"
    source: "morning"
    target: "politeness"
  - id: "e11"
    source: "afternoon"
    target: "politeness"
  - id: "e12"
    source: "evening"
    target: "politeness"
---

日本では、挨拶は毎日の生活でとても大切です。朝起きたとき、「おはようございます」と言います。これは朝の挨拶で、家族や友達、職場の人などに使います。午前十時くらいまで使うのが普通です。家族のような親しい間柄では、「おはよう」と短く言ってもいいです。挨拶は人間関係を始める基本ですから、しっかり覚えましょう。

午前十時から午後六時くらいまでは、「こんにちは」と言います。これは昼間の挨拶で、誰にでも使える便利な言葉です。友達に会ったとき、会社に入ったとき、近所の人に会ったときなど、いろいろな場面で使えます。親しい間柄でも、少し丁寧な関係でも使えるので、とても重宝します。覚えやすくて、使いやすい挨拶です。

夕方から夜にかけては、「こんばんは」と言います。家に帰ってきたとき、夜に会ったときなどに使います。夜の挨拶は、少し落ち着いた感じがあります。家族や友達には、夜も挨拶を忘れずに言いましょう。夜は一日の終わりなので、挨拶を言うことで一日を締めくくる意味もあります。挨拶をするだけで、人間関係がよくなります。

別れるときは、「さようなら」や「またね」と言います。「さようなら」は、しばらく会わない人に使います。明日また会うような場合は、「また明日ね」と言います。友達との別れでは、「じゃあね」もよく使います。場面や関係に合った言葉を選びましょう。適切な別れの言葉を使うと、良い印象を与えられます。次会うときも気持ちよく話せます。

感謝や謝罪の言葉も大切です。「ありがとうございます」は感謝を表します。誰かが何かしてくれたとき、プレゼントをもらったときなどに使います。「すみません」は、謝罪や依頼のときに使います。道を尋ねるとき、何かを頼むときにも使えます。日常的に使う言葉なので、自然に言えるように練習しましょう。正しい言葉を適切に使うと、スムーズなコミュニケーションができます。
