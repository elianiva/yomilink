---
title: "Tanaka's Daily Life"
description: "Very easy N5 reading about a student's daily routine"
nodes:
    - id: "tanaka"
      type: "text"
      position: { x: 500, y: 40 }
      data: { label: "田中さん", color: "green" }
    - id: "student"
      type: "text"
      position: { x: 220, y: 200 }
      data: { label: "がくせい", color: "blue" }
    - id: "everyday"
      type: "text"
      position: { x: 500, y: 200 }
      data: { label: "まいにち", color: "blue" }
    - id: "school"
      type: "text"
      position: { x: 780, y: 200 }
      data: { label: "がっこう", color: "blue" }
    - id: "morning"
      type: "text"
      position: { x: 360, y: 360 }
      data: { label: "あさ6じ", color: "blue" }
    - id: "study"
      type: "text"
      position: { x: 640, y: 360 }
      data: { label: "4じかんべんきょう", color: "amber" }
    - id: "sleep"
      type: "text"
      position: { x: 920, y: 360 }
      data: { label: "ねる", color: "amber" }
    - id: "conn-is"
      type: "connector"
      position: { x: 360, y: 110 }
      data: { label: "です" }
    - id: "conn-everyday"
      type: "connector"
      position: { x: 500, y: 110 }
      data: { label: "は" }
    - id: "conn-wake"
      type: "connector"
      position: { x: 430, y: 280 }
      data: { label: "におきる" }
    - id: "conn-go-school"
      type: "connector"
      position: { x: 640, y: 110 }
      data: { label: "はへいく" }
    - id: "conn-study-at"
      type: "connector"
      position: { x: 720, y: 280 }
      data: { label: "でべんきょう" }
    - id: "conn-after-study"
      type: "connector"
      position: { x: 780, y: 360 }
      data: { label: "のあと" }
    - id: "conn-does-study"
      type: "connector"
      position: { x: 560, y: 280 }
      data: { label: "は" }
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
      source: "tanaka"
      target: "conn-go-school"
    - id: "e8"
      source: "conn-go-school"
      target: "school"
    - id: "e9"
      source: "school"
      target: "conn-study-at"
    - id: "e10"
      source: "conn-study-at"
      target: "study"
    - id: "e11"
      source: "study"
      target: "conn-after-study"
    - id: "e12"
      source: "conn-after-study"
      target: "sleep"
    - id: "e13"
      source: "tanaka"
      target: "conn-does-study"
    - id: "e14"
      source: "conn-does-study"
      target: "study"
    - id: "e15"
      source: "everyday"
      target: "sleep"
---

田中さんはがくせいです。まいにち、あさ6じにおきます。

あさごはんをたべて、でんしゃでがっこうへいきます。がっこうで4じかんべんきょうします。ひるごはんはがっこうのしょくどうでたべます。よる11じごろねます。

むずかしいことばはすくないです。ゆっくりよめば、すぐにわかります。
