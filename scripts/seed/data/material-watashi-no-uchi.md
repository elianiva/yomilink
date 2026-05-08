---
title: "わたしのうち"
description: "N5 reading about a quiet neighborhood with parks, libraries, and nearby shops"
nodes:
    - id: "uchi"
      type: "text"
      position: { x: 620, y: 40 }
      data: { label: "わたしのうち", color: "green" }

    - id: "conn-tonari"
      type: "connector"
      position: { x: 420, y: 130 }
      data: { label: "の隣に" }

    - id: "conn-chikaku"
      type: "connector"
      position: { x: 820, y: 130 }
      data: { label: "の近くに" }

    - id: "kouen"
      type: "text"
      position: { x: 420, y: 250 }
      data: { label: "公園" }

    - id: "yuubinkyoku"
      type: "text"
      position: { x: 720, y: 250 }
      data: { label: "郵便局" }

    - id: "ginkou"
      type: "text"
      position: { x: 920, y: 250 }
      data: { label: "銀行" }

    - id: "conn-mae"
      type: "connector"
      position: { x: 420, y: 340 }
      data: { label: "の前に" }

    - id: "conn-aida"
      type: "connector"
      position: { x: 820, y: 340 }
      data: { label: "の間に" }

    - id: "toshokan"
      type: "text"
      position: { x: 320, y: 460 }
      data: { label: "図書館" }

    - id: "kissaten"
      type: "text"
      position: { x: 520, y: 460 }
      data: { label: "喫茶店" }

    - id: "suupaa"
      type: "text"
      position: { x: 820, y: 460 }
      data: { label: "スーパー" }

    - id: "conn-naka"
      type: "connector"
      position: { x: 820, y: 550 }
      data: { label: "の中に" }

    - id: "hanaya"
      type: "text"
      position: { x: 720, y: 650 }
      data: { label: "花屋" }

    - id: "panya"
      type: "text"
      position: { x: 920, y: 650 }
      data: { label: "パン屋" }

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
      source: "uchi"
      target: "conn-chikaku"
    - id: "e7"
      source: "conn-chikaku"
      target: "yuubinkyoku"
    - id: "e8"
      source: "conn-chikaku"
      target: "ginkou"
    - id: "e9"
      source: "yuubinkyoku"
      target: "conn-aida"
    - id: "e10"
      source: "ginkou"
      target: "conn-aida"
    - id: "e11"
      source: "conn-aida"
      target: "suupaa"
    - id: "e12"
      source: "suupaa"
      target: "conn-naka"
    - id: "e13"
      source: "conn-naka"
      target: "hanaya"
    - id: "e14"
      source: "conn-naka"
      target: "panya"
---

わたしの新(あたら)しいうちは静(しず)かな所(ところ)にあります。うちの隣(となり)にきれいな公園(こうえん)があります。公園(こうえん)の前(まえ)に図書館(としょかん)と喫茶店(きっさてん)があります。わたしは図書館(としょかん)で本(ほん)を借(か)ります。そして、公園(こうえん)で読(よ)みます。時々(ときどき)喫茶店(きっさてん)で読(よ)みます。喫茶店(きっさてん)のコーヒーはおいしいです。うちの近(ちか)くに郵便局(ゆうびんきょく)と銀行(ぎんこう)があります。郵便局(ゆうびんきょく)と銀行(ぎんこう)の間(あいだ)にスーパーがあります。スーパーの中(なか)に花屋(はなや)やおいしいパン屋(ぱんや)があります。とても便利(べんり)です。
