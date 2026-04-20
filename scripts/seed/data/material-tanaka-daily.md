---
title: "Tanaka's Daily Life"
description: "Very easy N5 reading about a student's daily routine"
nodes:
    - id: "tanaka"
      type: "text"
      position: { x: 80, y: 60 }
      data: { label: "田中さん", color: "green" }
    - id: "student"
      type: "text"
      position: { x: 240, y: 60 }
      data: { label: "がくせい", color: "blue" }
    - id: "everyday"
      type: "text"
      position: { x: 400, y: 60 }
      data: { label: "まいにち", color: "blue" }
    - id: "morning"
      type: "text"
      position: { x: 560, y: 60 }
      data: { label: "あさ6じ", color: "blue" }
    - id: "school"
      type: "text"
      position: { x: 720, y: 60 }
      data: { label: "がっこう", color: "blue" }
    - id: "study"
      type: "text"
      position: { x: 880, y: 60 }
      data: { label: "4じかんべんきょう", color: "amber" }
    - id: "sleep"
      type: "text"
      position: { x: 1040, y: 60 }
      data: { label: "ねる", color: "amber" }
    - id: "conn-is"
      type: "connector"
      position: { x: 160, y: 180 }
      data: { label: "です" }
    - id: "conn-everyday"
      type: "connector"
      position: { x: 320, y: 180 }
      data: { label: "は" }
    - id: "conn-morning"
      type: "connector"
      position: { x: 480, y: 180 }
      data: { label: "に" }
    - id: "conn-go"
      type: "connector"
      position: { x: 640, y: 180 }
      data: { label: "へいく" }
    - id: "conn-study"
      type: "connector"
      position: { x: 800, y: 180 }
      data: { label: "で" }
    - id: "conn-after"
      type: "connector"
      position: { x: 960, y: 180 }
      data: { label: "のあと" }
edges:
    - id: "e1"
      source: "tanaka"
      target: "conn-is"
    - id: "e2"
      source: "conn-is"
      target: "student"
    - id: "e3"
      source: "student"
      target: "conn-everyday"
    - id: "e4"
      source: "conn-everyday"
      target: "everyday"
    - id: "e5"
      source: "everyday"
      target: "conn-morning"
    - id: "e6"
      source: "conn-morning"
      target: "morning"
    - id: "e7"
      source: "morning"
      target: "conn-go"
    - id: "e8"
      source: "conn-go"
      target: "school"
    - id: "e9"
      source: "school"
      target: "conn-study"
    - id: "e10"
      source: "conn-study"
      target: "study"
    - id: "e11"
      source: "study"
      target: "conn-after"
    - id: "e12"
      source: "conn-after"
      target: "sleep"
    - id: "e13"
      source: "tanaka"
      target: "student"
    - id: "e14"
      source: "student"
      target: "school"
    - id: "e15"
      source: "study"
      target: "sleep"
---

田中さんはがくせいです。まいにち、あさ6じにおきます。

あさごはんをたべて、でんしゃでがっこうへいきます。がっこうで4じかんべんきょうします。ひるごはんはがっこうのしょくどうでたべます。よる11じごろねます。

むずかしいことばはすくないです。ゆっくりよめば、すぐにわかります。
