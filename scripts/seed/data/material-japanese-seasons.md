---
title: "Japanese Seasons"
description: "Learn about the four seasons and seasonal activities in Japan"
nodes:
  - id: "seasons"
    type: "text"
    position: { x: 300, y: 50 }
    data: { label: "四季\nFour Seasons", color: "green-500" }
  - id: "spring"
    type: "text"
    position: { x: 100, y: 150 }
    data: { label: "春\nSpring", color: "pink-500" }
  - id: "summer"
    type: "text"
    position: { x: 250, y: 150 }
    data: { label: "夏\nSummer", color: "red-500" }
  - id: "autumn"
    type: "text"
    position: { x: 400, y: 150 }
    data: { label: "秋\nAutumn", color: "amber-500" }
  - id: "winter"
    type: "text"
    position: { x: 550, y: 150 }
    data: { label: "冬\nWinter", color: "blue-500" }
  - id: "cherry-blossom"
    type: "text"
    position: { x: 50, y: 280 }
    data: { label: "桜\nCherry blossom", color: "pink-500" }
  - id: "hanami"
    type: "text"
    position: { x: 150, y: 280 }
    data: { label: "花見\nFlower viewing", color: "pink-500" }
  - id: "festival"
    type: "text"
    position: { x: 250, y: 280 }
    data: { label: "祭り\nFestival", color: "red-500" }
  - id: "fireworks"
    type: "text"
    position: { x: 350, y: 280 }
    data: { label: "花火\nFireworks", color: "red-500" }
  - id: "leaves"
    type: "text"
    position: { x: 450, y: 280 }
    data: { label: "紅葉\nAutumn leaves", color: "amber-500" }
  - id: "new-year"
    type: "text"
    position: { x: 550, y: 280 }
    data: { label: "お正月\nNew Year", color: "blue-500" }
  - id: "weather"
    type: "text"
    position: { x: 200, y: 400 }
    data: { label: "天気\nWeather", color: "purple-500" }
  - id: "food"
    type: "text"
    position: { x: 400, y: 400 }
    data: { label: "食べ物\nFood", color: "purple-500" }
edges:
  - id: "e1"
    source: "seasons"
    target: "spring"
  - id: "e2"
    source: "seasons"
    target: "summer"
  - id: "e3"
    source: "seasons"
    target: "autumn"
  - id: "e4"
    source: "seasons"
    target: "winter"
  - id: "e5"
    source: "spring"
    target: "cherry-blossom"
  - id: "e6"
    source: "spring"
    target: "hanami"
  - id: "e7"
    source: "cherry-blossom"
    target: "hanami"
  - id: "e8"
    source: "summer"
    target: "festival"
  - id: "e9"
    source: "summer"
    target: "fireworks"
  - id: "e10"
    source: "festival"
    target: "fireworks"
  - id: "e11"
    source: "autumn"
    target: "leaves"
  - id: "e12"
    source: "winter"
    target: "new-year"
  - id: "e13"
    source: "spring"
    target: "weather"
  - id: "e14"
    source: "summer"
    target: "weather"
  - id: "e15"
    source: "autumn"
    target: "weather"
  - id: "e16"
    source: "winter"
    target: "weather"
  - id: "e17"
    source: "autumn"
    target: "food"
  - id: "e18"
    source: "winter"
    target: "food"
---

日本には四つの季節があります。春、夏、秋、冬です。日本人は季節をとても大切にしています。季節によって、食べ物や行事が変わります。それぞれの季節には、特別な楽しみがあります。

春は三月から五月までです。春は暖かくなって、花が咲き始めます。春で一番有名なのは桜です。桜は日本の花です。三月の終わりから四月の初めごろ、桜が咲きます。日本人は桜を見るのが大好きです。これを「花見」と言います。公園や川の近くで、友達や家族と一緒に花見をします。お弁当を食べたり、お酒を飲んだりします。

夏は六月から八月までです。夏はとても暑いです。特に七月と八月は暑くて、毎日三十度以上になります。六月は雨が多いです。これを「梅雨」と言います。夏には祭りがたくさんあります。浴衣を着て、祭りに行く人が多いです。夏の夜には花火大会があります。花火はとてもきれいです。大勢の人が花火を見に行きます。

秋は九月から十一月までです。秋は涼しくて、過ごしやすいです。秋の空は高くて、青いです。秋には紅葉を見に行きます。紅葉とは、木の葉が赤や黄色に変わることです。山や公園に紅葉を見に行く人が多いです。京都の紅葉はとても有名です。秋はおいしい食べ物がたくさんあります。栗、柿、さんまなどが旬です。

冬は十二月から二月までです。冬は寒くて、雪が降る地域もあります。北海道や東北地方では、雪がたくさん降ります。冬の一番大きい行事はお正月です。お正月は一月一日から三日までです。家族と一緒に過ごして、おせち料理を食べます。神社にお参りに行く人も多いです。これを「初詣」と言います。冬には温かい食べ物を食べます。鍋料理やうどんが人気です。
