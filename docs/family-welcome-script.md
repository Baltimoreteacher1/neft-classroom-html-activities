# Weekly welcome video: 30-second script

"A note from Mr. Neft" is the card at the top of the weekly family page
(`/curriculum/family-connections/`). It is optional. If a week has no entry, the
page shows nothing. This file is the script and the steps to publish one.

Read the English out loud to your phone camera. The Spanish is NOT spoken: it
goes in as the Spanish captions and as the Spanish text on the card. Families
watch with the sound off, in either language.

## The script (about 30 seconds, about 70 spoken words)

Speak slowly. One idea per sentence. Smile on the first line.

| Time  | You say (English)                                                                               | Spanish caption and card text                                                                                       |
| ----- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 0–5   | Hi, families. This is Mr. Neft.                                                                 | Hola, familias. Soy el Sr. Neft.                                                                                    |
| 5–15  | This week in math, we are learning **[topic in 4–6 simple words]**.                             | Esta semana en matemáticas estamos aprendiendo **[tema en 4–6 palabras sencillas]**.                                |
| 15–25 | At home, try one short route. Five minutes is enough. Ask your student to show you one example. | En casa, prueben una ruta corta. Cinco minutos son suficientes. Pídanle a su estudiante que les muestre un ejemplo. |
| 25–30 | It is all optional. Thank you. Message me on ClassDojo any time.                                | Todo es opcional. Gracias. Escríbanme por ClassDojo cuando quieran.                                                 |

Rules that keep it clear:

- Say the topic the way a parent would say it ("adding fractions", not "fraction
  addition algorithms"). Use the word the lesson page uses.
- Say "optional" once. Never say "late", "behind", "missing" or "grade".
- Do not read numbers from a worksheet. One example is plenty.
- Hold the phone sideways (landscape), at eye level, near a window. Count to two
  before you start talking and after you stop.

## What to say about each kind of week

Swap line 2 (5–15 seconds) and, if you want, the "try" line.

| Week                  | Line 2 (English)                                                                | Line 3 change                                                 |
| --------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| First week of a unit  | We start a new unit: **[topic]**. Everything is new, and that is fine.          | Try the Quick route first. Five to ten minutes.               |
| Middle of a unit      | We are building on **[topic]**. Last week's ideas help this week.               | Try the Family Math Studio. About twenty to thirty minutes.   |
| Review week           | This week we review **[unit topic]** before the unit check.                     | Pick one review page. Stop whenever you like.                 |
| Test week             | This week is our unit check on **[unit topic]**. Sleep and breakfast help most. | No extra work is needed. A five-minute Daily Boost is enough. |
| Short or holiday week | It is a short week. Homework is light.                                          | Quick route only, or nothing at all. Enjoy the time together. |

## Captions: two files, always both

A video is only published with captions in **both** languages. The checker
(`npm run validate:family-welcome`) refuses a video with one or none.

Make two plain-text WebVTT files. Change the times to match your recording.

`2026-10-26.en.vtt`

```
WEBVTT

00:00:00.000 --> 00:00:04.500
Hi, families. This is Mr. Neft.

00:00:05.000 --> 00:00:14.500
This week in math, we are learning adding fractions.

00:00:15.000 --> 00:00:24.500
At home, try one short route. Five minutes is enough. Ask your student to show you one example.

00:00:25.000 --> 00:00:30.000
It is all optional. Thank you. Message me on ClassDojo any time.
```

`2026-10-26.es.vtt`

```
WEBVTT

00:00:00.000 --> 00:00:04.500
Hola, familias. Soy el Sr. Neft.

00:00:05.000 --> 00:00:14.500
Esta semana en matemáticas estamos aprendiendo a sumar fracciones.

00:00:15.000 --> 00:00:24.500
En casa, prueben una ruta corta. Cinco minutos son suficientes. Pídanle a su estudiante que les muestre un ejemplo.

00:00:25.000 --> 00:00:30.000
Todo es opcional. Gracias. Escríbanme por ClassDojo cuando quieran.
```

Keep each caption to two short lines. Spanish is written, not machine-translated:
use the same words the Spanish homework pages use for the topic.

## Publish it

1. Name the files after the **Monday** of the week and put them in
   `curriculum/family-connections/welcome/`:
   `2026-10-26.mp4`, `2026-10-26.en.vtt`, `2026-10-26.es.vtt`
   (optional poster: `2026-10-26.jpg`).
   Export the video as H.264 MP4, 720p, under about 8 MB for 30 seconds.
2. Add the week to `data/family-welcome.json` and turn the feature on:

   ```json
   {
     "enabled": true,
     "weeks": {
       "2026-10-26": {
         "en": "Hi, families. This week we are adding fractions. Try one short route at home. It is all optional.",
         "es": "Hola, familias. Esta semana sumamos fracciones. Prueben una ruta corta en casa. Todo es opcional.",
         "video": {
           "src": "/curriculum/family-connections/welcome/2026-10-26.mp4",
           "captions": {
             "en": "/curriculum/family-connections/welcome/2026-10-26.en.vtt",
             "es": "/curriculum/family-connections/welcome/2026-10-26.es.vtt"
           },
           "poster": "/curriculum/family-connections/welcome/2026-10-26.jpg"
         }
       }
     }
   }
   ```

   A note without a video is just the two text fields. Keep each under 600
   characters.

3. Run `npm run validate:family-welcome`. It checks that the key is a real
   Monday, both languages are written, the Spanish is not a copy of the English,
   the video has English and Spanish captions, and every file exists.
4. Commit and ship the normal way. The card appears on the page for that week
   only, in the language the family chose.

To stop showing the cards without deleting them, set `"enabled": false`.
