---
title: "どこが いちばん いいですか"
description: "N5 reading comparing three supermarkets near the narrator's house"
nodes:
    - id: "watashi"
      type: "text"
      position: { x: 620, y: 40 }
      data: { label: "わたしのうち", color: "green" }

    - id: "conn-chikaku"
      type: "connector"
      position: { x: 620, y: 130 }
      data: { label: "の近くに" }

    - id: "suupaa-group"
      type: "text"
      position: { x: 620, y: 220 }
      data: { label: "スーパー 3つ", color: "blue" }

    - id: "conn-first"
      type: "connector"
      position: { x: 220, y: 310 }
      data: { label: "1つ目" }

    - id: "conn-second"
      type: "connector"
      position: { x: 620, y: 310 }
      data: { label: "2つ目" }

    - id: "conn-third"
      type: "connector"
      position: { x: 1020, y: 310 }
      data: { label: "3つ目" }

    - id: "mainichiya"
      type: "text"
      position: { x: 220, y: 400 }
      data: { label: "毎日屋（まいにちや）", color: "yellow" }

    - id: "abc"
      type: "text"
      position: { x: 620, y: 400 }
      data: { label: "ABCストア", color: "yellow" }

    - id: "japan"
      type: "text"
      position: { x: 1020, y: 400 }
      data: { label: "ジャパン", color: "yellow" }

    - id: "conn-mainichi-attr"
      type: "connector"
      position: { x: 220, y: 490 }
      data: { label: "の特徴" }

    - id: "conn-abc-attr"
      type: "connector"
      position: { x: 620, y: 490 }
      data: { label: "の特徴" }

    - id: "conn-japan-attr"
      type: "connector"
      position: { x: 1020, y: 490 }
      data: { label: "の特徴" }

    - id: "mainichi-chikai"
      type: "text"
      position: { x: 120, y: 580 }
      data: { label: "近い（5分）" }

    - id: "mainichi-sakana"
      type: "text"
      position: { x: 320, y: 580 }
      data: { label: "魚（さかな）が多い" }

    - id: "abc-yasui"
      type: "text"
      position: { x: 520, y: 580 }
      data: { label: "安い" }

    - id: "abc-niku"
      type: "text"
      position: { x: 720, y: 580 }
      data: { label: "肉（にく）が多い" }

    - id: "japan-tooi"
      type: "text"
      position: { x: 920, y: 580 }
      data: { label: "遠い" }

    - id: "japan-ookii"
      type: "text"
      position: { x: 1120, y: 580 }
      data: { label: "大きい" }

    - id: "conn-watashi-prefer"
      type: "connector"
      position: { x: 620, y: 670 }
      data: { label: "が いちばん 好き" }

    - id: "watashi-suki"
      type: "text"
      position: { x: 620, y: 760 }
      data: { label: "ABCストア（すき）", color: "green" }

edges:
    - id: "e1"
      source: "watashi"
      target: "conn-chikaku"
    - id: "e2"
      source: "conn-chikaku"
      target: "suupaa-group"
    - id: "e3"
      source: "suupaa-group"
      target: "conn-first"
    - id: "e4"
      source: "suupaa-group"
      target: "conn-second"
    - id: "e5"
      source: "suupaa-group"
      target: "conn-third"
    - id: "e6"
      source: "conn-first"
      target: "mainichiya"
    - id: "e7"
      source: "conn-second"
      target: "abc"
    - id: "e8"
      source: "conn-third"
      target: "japan"
    - id: "e9"
      source: "mainichiya"
      target: "conn-mainichi-attr"
    - id: "e10"
      source: "abc"
      target: "conn-abc-attr"
    - id: "e11"
      source: "japan"
      target: "conn-japan-attr"
    - id: "e12"
      source: "conn-mainichi-attr"
      target: "mainichi-chikai"
    - id: "e13"
      source: "conn-mainichi-attr"
      target: "mainichi-sakana"
    - id: "e14"
      source: "conn-abc-attr"
      target: "abc-yasui"
    - id: "e15"
      source: "conn-abc-attr"
      target: "abc-niku"
    - id: "e16"
      source: "conn-japan-attr"
      target: "japan-tooi"
    - id: "e17"
      source: "conn-japan-attr"
      target: "japan-ookii"
    - id: "e18"
      source: "abc"
      target: "conn-watashi-prefer"
    - id: "e19"
      source: "conn-watashi-prefer"
      target: "watashi-suki"
---

わたしの うちの 近（ちか）くに スーパーが 3つ あります。「毎日屋（まいにちや）」と「ABC ストア」と「ジャパン」です。

「毎日屋（まいにちや）」は いちばん 小（ちい）さい 店（みせ）ですが、近（ちか）いです。うちから 歩（ある）いて 5分（ふん）です。新（あたら）しい 魚（さかな）が 多（おお）いです。野菜（やさい）や 果物（くだもの）も 多（おお）いです。外国（がいこく）の 物（もの）は 全然（ぜんぜん） ありません。

「ABC ストア」は うちから 歩（ある）いて 15分（ふん） かかります。肉（にく）が 多（おお）いです。いちばん 安（やす）い 店（みせ）です。外国（がいこく）の 物（もの）も ありますが、「ジャパン」より 少（すく）ないです。おいしい パンが あります。

「ジャパン」は いちばん 遠（とお）いです。魚（さかな）は あまり 多（おお）くないですが、肉（にく）が たくさん あります。外国（がいこく）の 物（もの）が 多（おお）いです。とても 大（おお）きい 店（みせ）です。「ABC ストア」より 大（おお）きいです。3つ（みっつ）の 店（みせ）の 中（なか）で わたしは「ABC ストア」が いちばん 好（す）きです。
