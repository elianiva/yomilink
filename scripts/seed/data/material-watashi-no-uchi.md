---
title: "わたしのうち"
description: "N5 reading describing a quiet neighborhood and daily activities"
nodes:
    - id: "uchi"
      type: "text"
      position: { x: 620, y: 40 }
      data: { label: "わたしのうち", color: "green" }

    - id: "conn-tonari"
      type: "connector"
      position: { x: 420, y: 130 }
      data: { label: "の隣（となり）に" }

    - id: "kouen"
      type: "text"
      position: { x: 320, y: 250 }
      data: { label: "公園（こうえん）" }

    - id: "conn-mae"
      type: "connector"
      position: { x: 320, y: 340 }
      data: { label: "の前（まえ）に" }

    - id: "toshokan"
      type: "text"
      position: { x: 200, y: 460 }
      data: { label: "図書館（としょかん）" }

    - id: "kissaten"
      type: "text"
      position: { x: 440, y: 460 }
      data: { label: "喫茶店（きっさてん）" }

    - id: "conn-de-kariru"
      type: "connector"
      position: { x: 80, y: 560 }
      data: { label: "で" }

    - id: "hon-kariru"
      type: "text"
      position: { x: 80, y: 660 }
      data: { label: "本（ほん）を借（か）りる" }

    - id: "conn-de-yomu"
      type: "connector"
      position: { x: 320, y: 560 }
      data: { label: "で" }

    - id: "hon-yomu"
      type: "text"
      position: { x: 320, y: 660 }
      data: { label: "本（ほん）を読（よ）む" }

    - id: "conn-de-nomu"
      type: "connector"
      position: { x: 560, y: 560 }
      data: { label: "で" }

    - id: "coffee-nomu"
      type: "text"
      position: { x: 560, y: 660 }
      data: { label: "コーヒーを飲（の）む" }

    - id: "conn-wa"
      type: "connector"
      position: { x: 820, y: 130 }
      data: { label: "は" }

    - id: "benri"
      type: "text"
      position: { x: 820, y: 250 }
      data: { label: "便利（べんり）" }

edges:
    - id: "e1"
      source: "uchi"
      target: "conn-tonari"
    - id: "e2"
      source: "conn-tonari"
      target: "kouen"
    - id: "e3"
      source: "kouen"
      target: "conn-mae"
    - id: "e4"
      source: "conn-mae"
      target: "toshokan"
    - id: "e5"
      source: "conn-mae"
      target: "kissaten"
    - id: "e6"
      source: "toshokan"
      target: "conn-de-kariru"
    - id: "e7"
      source: "conn-de-kariru"
      target: "hon-kariru"
    - id: "e8"
      source: "kouen"
      target: "conn-de-yomu"
    - id: "e9"
      source: "conn-de-yomu"
      target: "hon-yomu"
    - id: "e10"
      source: "kissaten"
      target: "conn-de-nomu"
    - id: "e11"
      source: "conn-de-nomu"
      target: "coffee-nomu"
    - id: "e12"
      source: "uchi"
      target: "conn-wa"
    - id: "e13"
      source: "conn-wa"
      target: "benri"
---

わたしの新（あたら）しいうちは静（しず）かな所（ところ）にあります。うちの隣（となり）にきれいな公園（こうえん）があります。公園（こうえん）の前（まえ）に図書館（としょかん）と喫茶店（きっさてん）があります。わたしは図書館（としょかん）で本（ほん）を借（か）ります。そして、公園（こうえん）で読（よ）みます。時々（ときどき）喫茶店（きっさてん）で読（よ）みます。喫茶店（きっさてん）のコーヒーはおいしいです。とても便利（べんり）です。
