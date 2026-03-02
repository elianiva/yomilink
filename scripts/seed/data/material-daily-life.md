---
title: "Japanese Daily Life"
description: "Learn about daily routines and lifestyle in Japan"
nodes:
  - id: "daily-life"
    type: "text"
    position: { x: 340, y: 40 }
    data: { label: "日常生活", color: "green" }
  - id: "morning"
    type: "text"
    position: { x: 120, y: 170 }
    data: { label: "朝", color: "blue" }
  - id: "afternoon"
    type: "text"
    position: { x: 340, y: 170 }
    data: { label: "昼", color: "blue" }
  - id: "evening"
    type: "text"
    position: { x: 560, y: 170 }
    data: { label: "夜", color: "blue" }
  - id: "wake-up"
    type: "text"
    position: { x: 40, y: 330 }
    data: { label: "起きる", color: "amber" }
  - id: "breakfast"
    type: "text"
    position: { x: 180, y: 330 }
    data: { label: "朝ご飯", color: "amber" }
  - id: "work"
    type: "text"
    position: { x: 300, y: 330 }
    data: { label: "仕事", color: "amber" }
  - id: "lunch"
    type: "text"
    position: { x: 420, y: 330 }
    data: { label: "昼ご飯", color: "amber" }
  - id: "dinner"
    type: "text"
    position: { x: 540, y: 330 }
    data: { label: "晩ご飯", color: "amber" }
  - id: "sleep"
    type: "text"
    position: { x: 660, y: 330 }
    data: { label: "寝る", color: "amber" }
  - id: "commute"
    type: "text"
    position: { x: 210, y: 470 }
    data: { label: "通勤", color: "purple" }
  - id: "free-time"
    type: "text"
    position: { x: 500, y: 470 }
    data: { label: "自由時間", color: "purple" }
  - id: "conn-day-parts"
    type: "connector"
    position: { x: 340, y: 105 }
    data: { label: "には" }
  - id: "conn-morning"
    type: "connector"
    position: { x: 120, y: 250 }
    data: { label: "にすることは" }
  - id: "conn-afternoon"
    type: "connector"
    position: { x: 340, y: 250 }
    data: { label: "にすることは" }
  - id: "conn-evening"
    type: "connector"
    position: { x: 560, y: 250 }
    data: { label: "にすることは" }
edges:
  - id: "e1"
    source: "daily-life"
    target: "conn-day-parts"
  - id: "e2"
    source: "conn-day-parts"
    target: "morning"
  - id: "e3"
    source: "conn-day-parts"
    target: "afternoon"
  - id: "e4"
    source: "conn-day-parts"
    target: "evening"
  - id: "e5"
    source: "morning"
    target: "conn-morning"
  - id: "e6"
    source: "conn-morning"
    target: "wake-up"
  - id: "e7"
    source: "conn-morning"
    target: "breakfast"
  - id: "e8"
    source: "conn-morning"
    target: "commute"
  - id: "e9"
    source: "afternoon"
    target: "conn-afternoon"
  - id: "e10"
    source: "conn-afternoon"
    target: "work"
  - id: "e11"
    source: "conn-afternoon"
    target: "lunch"
  - id: "e12"
    source: "evening"
    target: "conn-evening"
  - id: "e13"
    source: "conn-evening"
    target: "dinner"
  - id: "e14"
    source: "conn-evening"
    target: "free-time"
  - id: "e15"
    source: "conn-evening"
    target: "sleep"
---

日本人の一日は、朝早く始まります。多くの人は朝六時か七時に起きます。まず顔を洗って、歯を磨きます。それから朝ご飯を食べます。日本の朝ご飯は、ご飯と味噌汁と焼き魚が多いです。でも最近は、パンとコーヒーを食べる人も増えています。朝は忙しいので、簡単な朝ご飯を食べる人もいます。

朝ご飯の後、会社や学校に行きます。日本では電車で通勤する人がとても多いです。朝の電車はとても混んでいます。通勤時間は大体三十分から一時間くらいです。東京のような大きい都市では、一時間以上かかる人もいます。電車の中で本を読んだり、スマートフォンを見たりする人が多いです。

昼の十二時ごろ、昼ご飯を食べます。会社員は会社の食堂で食べたり、近くのレストランに行ったりします。弁当を持ってくる人もいます。日本の弁当はとてもきれいで、おいしいです。昼休みは大体一時間くらいです。昼ご飯の後、少し休んでから、また仕事を始めます。

仕事は普通、夕方の五時か六時に終わります。でも日本では、残業する人が多いです。残業とは、仕事の時間より長く働くことです。七時か八時まで働く人もいます。仕事の後、同僚と飲みに行くこともあります。これは「飲み会」と言います。飲み会で、仕事の話や趣味の話をします。

家に帰ったら、晩ご飯を食べます。晩ご飯は一日で一番大きい食事です。家族と一緒に食べることが多いです。晩ご飯の後は、自由時間です。テレビを見たり、本を読んだり、お風呂に入ったりします。日本人はお風呂が大好きです。毎日お風呂に入る人が多いです。夜の十一時か十二時ごろ寝ます。
