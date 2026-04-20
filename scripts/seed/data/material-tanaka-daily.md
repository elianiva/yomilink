---
title: "Tanaka's Daily Life"
description: "Very easy N5 reading about a student's daily routine"
nodes:
    - id: "tanaka"
      type: "text"
      position: { x: 600, y: 40 }
      data: { label: "田中さん", color: "green" }
    - id: "conn-is"
      type: "connector"
      position: { x: 600, y: 140 }
      data: { label: "は" }
    - id: "student"
      type: "text"
      position: { x: 420, y: 260 }
      data: { label: "がくせい", color: "blue" }
    - id: "conn-everyday"
      type: "connector"
      position: { x: 760, y: 140 }
      data: { label: "は" }
    - id: "everyday"
      type: "text"
      position: { x: 760, y: 260 }
      data: { label: "まいにち", color: "blue" }
    - id: "conn-wake"
      type: "connector"
      position: { x: 760, y: 360 }
      data: { label: "に" }
    - id: "morning"
      type: "text"
      position: { x: 760, y: 460 }
      data: { label: "あさ6じにおきる", color: "blue" }
    - id: "conn-go-school"
      type: "connector"
      position: { x: 760, y: 560 }
      data: { label: "のあと" }
    - id: "school"
      type: "text"
      position: { x: 760, y: 660 }
      data: { label: "がっこう", color: "blue" }
    - id: "conn-study-at"
      type: "connector"
      position: { x: 760, y: 760 }
      data: { label: "で" }
    - id: "conn-does-study"
      type: "connector"
      position: { x: 760, y: 860 }
      data: { label: "を" }
    - id: "study"
      type: "text"
      position: { x: 760, y: 960 }
      data: { label: "4じかんべんきょうする", color: "amber" }
    - id: "conn-after-study"
      type: "connector"
      position: { x: 760, y: 1060 }
      data: { label: "のあと" }
    - id: "sleep"
      type: "text"
      position: { x: 760, y: 1160 }
      data: { label: "よる11じごろねる", color: "amber" }
edges:
    - id: "e1"
      source: "tanaka"
      target: "conn-is"
    - id: "e2"
      source: "conn-is"
      target: "student"
    - id: "e3"
      source: "tanaka"
      target: "conn-everyday"
    - id: "e4"
      source: "conn-everyday"
      target: "everyday"
    - id: "e5"
      source: "everyday"
      target: "conn-wake"
    - id: "e6"
      source: "conn-wake"
      target: "morning"
    - id: "e7"
      source: "morning"
      target: "conn-go-school"
    - id: "e8"
      source: "conn-go-school"
      target: "school"
    - id: "e9"
      source: "school"
      target: "conn-study-at"
    - id: "e10"
      source: "conn-study-at"
      target: "conn-does-study"
    - id: "e11"
      source: "conn-does-study"
      target: "study"
    - id: "e12"
      source: "study"
      target: "conn-after-study"
    - id: "e13"
      source: "conn-after-study"
      target: "sleep"
---

田中さんはがくせいです。まいにち、あさ6じにおきます。

あさごはんをたべて、でんしゃでがっこうへいきます。がっこうで4じかんべんきょうします。ひるごはんはがっこうのしょくどうでたべます。よる11じごろねます。

むずかしいことばはすくないです。ゆっくりよめば、すぐにわかります。
