---
title: "Tanaka's Daily Life"
description: "A student's daily routine in Japan"
nodes:
  - id: "tanaka"
    type: "text"
    position: { x: 340, y: 40 }
    data: { label: "田中さん", color: "green" }
  - id: "weekday"
    type: "text"
    position: { x: 200, y: 170 }
    data: { label: "平日", color: "blue" }
  - id: "weekend"
    type: "text"
    position: { x: 480, y: 170 }
    data: { label: "週末", color: "blue" }
  - id: "wake-up"
    type: "text"
    position: { x: 80, y: 330 }
    data: { label: "起きる", color: "amber" }
  - id: "school"
    type: "text"
    position: { x: 200, y: 330 }
    data: { label: "学校", color: "amber" }
  - id: "study"
    type: "text"
    position: { x: 320, y: 330 }
    data: { label: "勉強", color: "amber" }
  - id: "lunch"
    type: "text"
    position: { x: 80, y: 470 }
    data: { label: "昼ご飯", color: "amber" }
  - id: "afternoon"
    type: "text"
    position: { x: 200, y: 470 }
    data: { label: "午後", color: "amber" }
  - id: "dinner"
    type: "text"
    position: { x: 320, y: 470 }
    data: { label: "晩ご飯", color: "amber" }
  - id: "sleep"
    type: "text"
    position: { x: 440, y: 330 }
    data: { label: "寝る", color: "amber" }
  - id: "saturday"
    type: "text"
    position: { x: 440, y: 330 }
    data: { label: "土曜日", color: "purple" }
  - id: "sunday"
    type: "text"
    position: { x: 560, y: 330 }
    data: { label: "日曜日", color: "purple" }
  - id: "work"
    type: "text"
    position: { x: 440, y: 470 }
    data: { label: "アルバイト", color: "amber" }
  - id: "fun"
    type: "text"
    position: { x: 560, y: 470 }
    data: { label: "たのしい", color: "amber" }
  - id: "conn-weekday"
    type: "connector"
    position: { x: 200, y: 250 }
    data: { label: "の生活" }
  - id: "conn-weekend"
    type: "connector"
    position: { x: 480, y: 250 }
    data: { label: "は" }
edges:
  - id: "e1"
    source: "tanaka"
    target: "conn-weekday"
  - id: "e2"
    source: "conn-weekday"
    target: "weekday"
  - id: "e3"
    source: "tanaka"
    target: "conn-weekend"
  - id: "e4"
    source: "conn-weekend"
    target: "weekend"
  - id: "e5"
    source: "weekday"
    target: "wake-up"
  - id: "e6"
    source: "weekday"
    target: "school"
  - id: "e7"
    source: "weekday"
    target: "study"
  - id: "e8"
    source: "weekday"
    target: "sleep"
  - id: "e9"
    source: "weekday"
    target: "lunch"
  - id: "e10"
    source: "weekday"
    target: "afternoon"
  - id: "e11"
    source: "weekday"
    target: "dinner"
  - id: "e12"
    source: "weekend"
    target: "saturday"
  - id: "e13"
    source: "weekend"
    target: "sunday"
  - id: "e14"
    source: "saturday"
    target: "work"
  - id: "e15"
    source: "sunday"
    target: "fun"
---

田中さんは日本の学生です。毎日とても忙しいです。

毎朝６時に起きます。朝ご飯を食べます。朝ご飯を食べたあと、電車で学校に行きます。電車のりょうは２０分ぐらいです。

学校では４時間勉強します。授業は９時から始まります。授業は１２時に終わります。昼休みは１時間です。学校の喫茶店で昼ご飯を食べます。喫茶店のご飯は安くておいしいです。

午後は友達と話したり、図書館で本を読んだりします。午後４時に学校が終わります。

家に帰ったら、宿題をします。晩ご飯はいつも家で家族と一緒に食べます。夜１１時ごろ寝ます。ふだんはとても忙しいです。

週末はちょっと違います。土曜日の朝は９時ごろまで寝ます。昼ごろ起きて、朝ご飯を食べます。そのあとアルバイトをします。夜は勉強します。

日曜日は暇です。友達と遊んだり、映画を見たりします。週末はとても楽しいです。
