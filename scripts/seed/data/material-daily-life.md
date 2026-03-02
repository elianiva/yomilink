---
title: "Japanese Daily Life"
description: "Learn about daily routines and lifestyle in Japan"
nodes:
  - id: "daily-life"
    type: "text"
    position: { x: 300, y: 50 }
    data: { label: "日常生活\nDaily Life", color: "green-500" }
  - id: "morning"
    type: "text"
    position: { x: 100, y: 150 }
    data: { label: "朝\nMorning", color: "blue-500" }
  - id: "afternoon"
    type: "text"
    position: { x: 300, y: 150 }
    data: { label: "昼\nAfternoon", color: "blue-500" }
  - id: "evening"
    type: "text"
    position: { x: 500, y: 150 }
    data: { label: "夜\nEvening", color: "blue-500" }
  - id: "wake-up"
    type: "text"
    position: { x: 50, y: 280 }
    data: { label: "起きる\nWake up", color: "amber-500" }
  - id: "breakfast"
    type: "text"
    position: { x: 150, y: 280 }
    data: { label: "朝ご飯\nBreakfast", color: "amber-500" }
  - id: "work"
    type: "text"
    position: { x: 250, y: 280 }
    data: { label: "仕事\nWork", color: "amber-500" }
  - id: "lunch"
    type: "text"
    position: { x: 350, y: 280 }
    data: { label: "昼ご飯\nLunch", color: "amber-500" }
  - id: "dinner"
    type: "text"
    position: { x: 450, y: 280 }
    data: { label: "晩ご飯\nDinner", color: "amber-500" }
  - id: "sleep"
    type: "text"
    position: { x: 550, y: 280 }
    data: { label: "寝る\nSleep", color: "amber-500" }
  - id: "commute"
    type: "text"
    position: { x: 200, y: 400 }
    data: { label: "通勤\nCommute", color: "purple-500" }
  - id: "free-time"
    type: "text"
    position: { x: 400, y: 400 }
    data: { label: "自由時間\nFree time", color: "purple-500" }
edges:
  - id: "e1"
    source: "daily-life"
    target: "morning"
  - id: "e2"
    source: "daily-life"
    target: "afternoon"
  - id: "e3"
    source: "daily-life"
    target: "evening"
  - id: "e4"
    source: "morning"
    target: "wake-up"
  - id: "e5"
    source: "morning"
    target: "breakfast"
  - id: "e6"
    source: "afternoon"
    target: "work"
  - id: "e7"
    source: "afternoon"
    target: "lunch"
  - id: "e8"
    source: "evening"
    target: "dinner"
  - id: "e9"
    source: "evening"
    target: "sleep"
  - id: "e10"
    source: "wake-up"
    target: "commute"
  - id: "e11"
    source: "breakfast"
    target: "commute"
  - id: "e12"
    source: "commute"
    target: "work"
  - id: "e13"
    source: "work"
    target: "free-time"
  - id: "e14"
    source: "dinner"
    target: "free-time"
  - id: "e15"
    source: "free-time"
    target: "sleep"
---

日本人の一日は、朝早く始まります。多くの人は朝六時か七時に起きます。まず顔を洗って、歯を磨きます。それから朝ご飯を食べます。日本の朝ご飯は、ご飯と味噌汁と焼き魚が多いです。でも最近は、パンとコーヒーを食べる人も増えています。朝は忙しいので、簡単な朝ご飯を食べる人もいます。

朝ご飯の後、会社や学校に行きます。日本では電車で通勤する人がとても多いです。朝の電車はとても混んでいます。通勤時間は大体三十分から一時間くらいです。東京のような大きい都市では、一時間以上かかる人もいます。電車の中で本を読んだり、スマートフォンを見たりする人が多いです。

昼の十二時ごろ、昼ご飯を食べます。会社員は会社の食堂で食べたり、近くのレストランに行ったりします。弁当を持ってくる人もいます。日本の弁当はとてもきれいで、おいしいです。昼休みは大体一時間くらいです。昼ご飯の後、少し休んでから、また仕事を始めます。

仕事は普通、夕方の五時か六時に終わります。でも日本では、残業する人が多いです。残業とは、仕事の時間より長く働くことです。七時か八時まで働く人もいます。仕事の後、同僚と飲みに行くこともあります。これは「飲み会」と言います。飲み会で、仕事の話や趣味の話をします。

家に帰ったら、晩ご飯を食べます。晩ご飯は一日で一番大きい食事です。家族と一緒に食べることが多いです。晩ご飯の後は、自由時間です。テレビを見たり、本を読んだり、お風呂に入ったりします。日本人はお風呂が大好きです。毎日お風呂に入る人が多いです。夜の十一時か十二時ごろ寝ます。
