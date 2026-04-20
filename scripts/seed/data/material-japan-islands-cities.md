---
title: "Japan: Main Islands and Cities"
description: "Simple reading about Japan's three main islands and their major cities"
nodes:
    - id: "japan"
      type: "text"
      position: { x: 620, y: 40 }
      data: { label: "日本", color: "green" }

    - id: "conn-islands"
      type: "connector"
      position: { x: 620, y: 130 }
      data: { label: "の島は" }

    - id: "honshu"
      type: "text"
      position: { x: 320, y: 250 }
      data: { label: "本州", color: "blue" }
    - id: "hokkaido"
      type: "text"
      position: { x: 620, y: 250 }
      data: { label: "北海道", color: "blue" }
    - id: "kyushu"
      type: "text"
      position: { x: 920, y: 250 }
      data: { label: "九州", color: "blue" }

    - id: "conn-honshu-cities"
      type: "connector"
      position: { x: 320, y: 340 }
      data: { label: "の都市は" }
    - id: "tokyo"
      type: "text"
      position: { x: 180, y: 460 }
      data: { label: "東京", color: "amber" }
    - id: "osaka"
      type: "text"
      position: { x: 320, y: 460 }
      data: { label: "大阪", color: "amber" }
    - id: "nagoya"
      type: "text"
      position: { x: 460, y: 460 }
      data: { label: "名古屋", color: "amber" }

    - id: "conn-hokkaido-cities"
      type: "connector"
      position: { x: 620, y: 340 }
      data: { label: "の都市は" }
    - id: "sapporo"
      type: "text"
      position: { x: 540, y: 460 }
      data: { label: "札幌", color: "amber" }
    - id: "hakodate"
      type: "text"
      position: { x: 700, y: 460 }
      data: { label: "函館", color: "amber" }

    - id: "conn-kyushu-cities"
      type: "connector"
      position: { x: 920, y: 340 }
      data: { label: "の都市は" }
    - id: "fukuoka"
      type: "text"
      position: { x: 840, y: 460 }
      data: { label: "福岡", color: "amber" }
    - id: "kumamoto"
      type: "text"
      position: { x: 1000, y: 460 }
      data: { label: "熊本", color: "amber" }
edges:
    - id: "e1"
      source: "japan"
      target: "conn-islands"
    - id: "e2"
      source: "conn-islands"
      target: "honshu"
    - id: "e3"
      source: "conn-islands"
      target: "hokkaido"
    - id: "e4"
      source: "conn-islands"
      target: "kyushu"

    - id: "e5"
      source: "honshu"
      target: "conn-honshu-cities"
    - id: "e6"
      source: "conn-honshu-cities"
      target: "tokyo"
    - id: "e7"
      source: "conn-honshu-cities"
      target: "osaka"
    - id: "e8"
      source: "conn-honshu-cities"
      target: "nagoya"

    - id: "e9"
      source: "hokkaido"
      target: "conn-hokkaido-cities"
    - id: "e10"
      source: "conn-hokkaido-cities"
      target: "sapporo"
    - id: "e11"
      source: "conn-hokkaido-cities"
      target: "hakodate"

    - id: "e12"
      source: "kyushu"
      target: "conn-kyushu-cities"
    - id: "e13"
      source: "conn-kyushu-cities"
      target: "fukuoka"
    - id: "e14"
      source: "conn-kyushu-cities"
      target: "kumamoto"
---

日本には主な三つの島があります。本州、北海道、九州です。

本州には大きい都市がたくさんあります。代表的な都市は東京、大阪、名古屋です。

北海道の代表的な都市は札幌と函館です。

九州の代表的な都市は福岡と熊本です。

このように、日本を「島→都市」の木構造で見ると、地理がわかりやすくなります。
