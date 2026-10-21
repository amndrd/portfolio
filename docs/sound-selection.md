# Sélection de sons (Artlist)

Sons pour remplacer l'ancien jeu de sons synthétisés. Chaque section correspond à un nom de cue dans `site/js/sound.js`, déclenché au même instant que dans la vidéo de référence.

## ⚠️ À vérifier avant d'acheter : la licence

D'après le centre d'aide d'Artlist :
- les fichiers ne peuvent pas être utilisés **seuls (audio uniquement) ni en dehors d'une vidéo** ;
- les applications et les jeux ne sont couverts que pour un **usage en fond**.

Des sons d'interface joués au clic et au survol sur un site sont probablement hors de la licence standard. Il faut demander une confirmation écrite à Artlist, ou passer par leur offre Enterprise. Dans tous les cas, **les fichiers ne doivent jamais aller dans le dépôt GitHub public**. C'est pour ça que le dossier de dépôt `sounds-src/` est exclu de git.

Sources : [licence Artlist](https://artlist.io/help-center/privacy-terms/artlist-license/), [utiliser les SFX Artlist](https://help.artlist.io/hc/en-us/articles/29595598088733-Using-Artlist-s-sound-effects), [licence Pro (PDF)](https://help-center.artlist.io/media/w5mglb2w/current-pro-license-permitting-assets-in-ai-clean-01042026.pdf), [offre in-app](https://artlist.io/lp/in-app/).

## Comment j'ai choisi

- **Analyse de la référence** : spectrogramme, détection des attaques par bande, recalage sur les images de la vidéo. Chaque cue décrit ce qu'il faut entendre.
- **Recherche Artlist** : leurs pages sont protégées contre les robots. Je n'ai donc ni lu les pages ni écouté les extraits. Le choix repose sur les titres, les tags, les durées et les descriptions indexés par les moteurs de recherche.
- **Ce qu'il faut faire** : écouter avant de télécharger. Quand plusieurs pistes sont proposées pour une cue, prends-en 2 ou 3 : une fois les fichiers dans `sounds-src/`, je les mesure contre la référence, je garde les plus proches, puis je coupe, mixe et règle les niveaux.
- **Légende** : ★ = premier choix. « dans le pack » = la piste existe sous ce titre exact, mais n'a pas de page à elle ; on la trouve sur la page du pack.

**Dépôt des fichiers** : `~/Desktop/Portfolio/sounds-src/`, tels quels, avec leurs noms d'origine (je reconnais les titres).

---

## Ambiances (boucles)

### `room` : fond permanent
Référence : un grondement électrique sombre et assez présent, centré vers 200 Hz (raies à 108, 167, 188 et 267 Hz), avec un léger souffle. Il ne s'arrête qu'à la coupure du lancement et ne doit jamais attirer l'attention.
1. ★ [Lo Fi Sci Fi – CRT Screen Electromagnetic Noise, Analog Clicks](https://artlist.io/sfx/track/lo-fi-sci-fi---crt-screen-electromagnetic-noise-analog-clicks/62939). Barney Oram, 1:03. Un vrai bruit d'écran cathodique.
2. ★ ANLG – Vintage TV, Static Hum Loop, dans le pack [ANLG](https://artlist.io/sfx/pack/anlg/8241). Soundkrampf, 0:33. Déjà en boucle.
3. [Data Room Ambience – Server Hum Loop](https://artlist.io/sfx/track/data-room-ambience---server-hum-loop/138532). SoundCrib, 0:49. Plus sourd, côté salle des machines.
4. [Analog TV – Electro Static Noise, Hum, Hiss, Constant](https://artlist.io/sfx/track/analog-tv---electro-static-noise-hum-hiss-constant/41303). The Sound Catcher.
5. [Dystopia – Server Room, Electric Hum](https://artlist.io/sfx/track/dystopia---server-room-electric-hum/59633).
6. [Defect – Device Hum, Electromagnetic, Ionizing Radiation, Crackling Signal](https://artlist.io/sfx/track/defect---device-hum-electromagnetic-ionizing-radiation-crackling-signal/56436). CB Sounddesign. Version plus crépitante.

### `boot` : pendant l'allumage de la grille (environ 1,2 s)
Référence : une boucle de « traitement » tonale. Une note pulse vers 580 Hz environ 12 fois par seconde, sous des notes tenues à 1,31 et 2,6 kHz, avec des crépitements secs.
1. ★ Lo Fi Sci Fi – Retro Computer Processing, dans le pack [Lo Fi Sci Fi](https://artlist.io/sfx/pack/lo-fi-sci-fi/4898). 0:11.
2. ★ [Lo Fi Sci Fi – Distorted Rhythmic Beeps, Analog Interference](https://artlist.io/sfx/track/62946/lo-fi-sci-fi---distorted-rhythmic-beeps-analog-interference-). La pulsation rythmique est ce qui compte.
3. [Retro Future – 60s Computer Data Process, Loop](https://artlist.io/sfx/track/102564/retro-future---60s-computer-data-process-loop). Bjorn Lynne. Une vraie boucle.
4. [Bleep Bloop – Supercomputer Data Processing Beeps](https://artlist.io/sfx/track/102250/bleep-bloop---supercomputer-data-processing-beeps). Artlist Studios, 0:07.
5. Lo Fi Sci Fi – Retro Machine Distorted Beeping, Analog Processing, dans le pack [Lo Fi Sci Fi](https://artlist.io/sfx/pack/lo-fi-sci-fi/4898). 0:16.

### `drone` : sous le journal du terminal (environ 2,5 s)
Référence : deux notes graves tenues à la quinte (environ 300 et 457 Hz) avec une texture granuleuse entre 300 et 800 Hz, des sifflements aigus fixes (2,6, 4,5 et 5,8 kHz) et un petit glissando montant de 1 à 2,2 kHz au départ. À la fin, coupure sèche.
1. ★ [Sci Fi Drone – Deep Under Pad, Low, Continuous](https://artlist.io/sfx/track/sci-fi-drone---deep-under-pad-low-continuous/77887). Cristian Lucchetta, environ 2:00.
2. [Sci Fi Invaders – Dark Drone, Low Rumbling Tone](https://artlist.io/sfx/track/sci-fi-invaders---dark-drone-low-rumbling-tone/49690).
3. ★ En couche par-dessus : [Sci Fi Interface – Data Transfer, on Screen Beeping](https://artlist.io/sfx/track/sci-fi-interface---data-transfer-on-screen-beeping/77914). Pour le bavardage de données.
4. Retro Future Vol 2 – Old Computer, Data Readout, dans le pack [Retro Future Vol 2](https://artlist.io/sfx/pack/retro-future-vol-2/8327). Environ 0:05.
5. [Hacking – Sci Fi Atmosphere, Into the Void](https://artlist.io/sfx/track/hacking---sci-fi-atmosphere-into-the-void/61492).

---

## Grille

### `cell` : chaque case qui apparaît (15 fois, une toutes les 67 ms)
Référence : un crépitement sec et bref (moins de 150 ms), souvent accompagné d'un petit coup grave. Comme ils s'enchaînent vite, il faut des attaques nettes, sans queue.
1. ★ Electric Glitches – Short Electrical Static, dans le pack [Electric Glitches](https://artlist.io/sfx/pack/electric-glitches/7075). Silence+Other Sounds, 0:02.
2. Electric Glitches – Crackling Static Glitch, dans le même pack.
3. [Electric Glitches – Short Distortion Glitch](https://artlist.io/sfx/track/86544/electric-glitches---short-distortion-glitch).
4. [Defect – Digital Glitch, Short Buzz, Upwards, Calibrate](https://artlist.io/sfx/track/defect---digital-glitch-short-buzz-upwards-calibrate/56432).

### Couche grave (à mélanger dans `cell`, `lock`, `panel`)
Référence : le son le plus caractéristique de la vidéo. Un coup sourd qui descend de 300 à 50 Hz en 150 ms environ, joué quand un élément apparaît. Je le mixerai sous les autres sons.
1. ★ Hits & Pieces – Sub Drop, dans le pack [Hits & Pieces](https://artlist.io/sfx/pack/hits--pieces/10812). Artlist Original, 0:02.
2. [Deep Impact – Sub Drop Impact](https://artlist.io/sfx/track/deep-impact---sub-drop-impact/128107). Artlist Original, 0:04. On garde l'attaque.
3. [Cinematic Hits Vol 1 – Sub Sonar Bass Drop](https://artlist.io/sfx/track/cinematic-hits-vol-1---sub-sonar-bass-drop/90209).
4. Hit and Punch – Low Thud / Heavy Thump, dans le pack [Hit and Punch](https://artlist.io/sfx/pack/hit-and-punch/4561). Shapeforms, 0:02.

### `hover` : survol des cases, boutons et textes
Deux styles possibles. Dans la vidéo, c'est un tout petit tic aigu. Toi, tu avais aimé le bavardage numérique d'igloo.inc (environ 0,4 s). Prends un candidat de chaque, je comparerai.
- Style bavardage, façon igloo :
  1. ★ Bleep Bloop – Robotic Chitchat, Scrambled Beeps, dans le pack [Bleep Bloop](https://artlist.io/sfx/pack/bleep-bloop/8276). 0:17 ; j'en extrais 0,3 à 0,4 s.
  2. Bleep Bloop – Scrambled Beeping Transmission, dans le même pack. 0:08.
  3. Sci Fi UI – Data Processing, Grainy, Confused, Glitch, dans le pack [Sci Fi UI](https://artlist.io/sfx/pack/sci-fi-ui/7415). SoundBits, 0:02.
- Style tic, comme la référence :
  4. ★ [8 Bit UI – Minimal Beep, Scroll](https://artlist.io/sfx/track/8-bit-ui---minimal-beep-scroll/62041). Adam Pietruszko.
  5. [Sci Fi UI – Short Robotic Squeak, Blip](https://artlist.io/sfx/track/sci-fi-ui---short-robotic-squeak-blip/91583).
  6. [Computer Beeps – Glitchy Bleep](https://artlist.io/sfx/track/computer-beeps---glitchy-bleep/59935). Stuart Duffield.

---

## Sélection d'une case

### `select` : le viseur entre à l'écran
Référence : un bip doux et grave, vers 540 Hz.
1. ★ Retro Scitech – Button, Beep, dans le pack [Retro Scitech](https://artlist.io/sfx/pack/retro-scitech/10246). Van Derand, 0:02.
2. [Retro Games – Menu Click, Beep](https://artlist.io/sfx/track/retro-games---menu-click-beep/25609).
3. [Computer Beeps – Correct Bleep](https://artlist.io/sfx/track/computer-beeps---correct-bleep/59926).

### `travel` : le viseur traverse l'écran (environ 0,5 s)
Référence : une note pure et fine tenue vers 2,75 kHz, avec de petits tics de radar.
1. ★ [Sci Fi Devices – Radar, Beeping, Scanning, Tracking](https://artlist.io/sfx/track/sci-fi-devices---radar-beeping-scanning-tracking/50029). Sound Spark.
2. [Lo Fi Sci Fi – Handheld Scanner, Analog Beeps, Static](https://artlist.io/song/62911/lo-fi-sci-fi---handheld-scanner,-analog-beeps,-static).
3. Sci Fi Weapons – Targeting Beeps, dans le pack [Sci Fi Explosions](https://artlist.io/sfx/pack/sci-fi-explosions/4562). Shapeforms, 0:02.
4. La piste de balayage « swirl » (environ 0:06) du pack [Sci Craft UI](https://artlist.io/sfx/pack/sci-craft-ui/7972).

### `type` : texte qui s'écrit (étiquette du viseur, titre, description)
Référence : des tics aigus (4 à 6 kHz), un par caractère, toutes les 50 ms environ. Il me faut des tics courts et isolables : j'en découperai plusieurs pour varier.
1. ★ [Solid UI – Sci Fi Interface, Typing Fast](https://artlist.io/sfx/track/solid-ui---sci-fi-interface-typing-fast/81201).
2. Typing – Typing Four Digit Sequences, Confirmation, Tonal Beeps, dans le pack [Typing](https://artlist.io/sfx/pack/typing/5302). Adam Pietruszko, 0:11.
3. [Hacking – Password Cracked, Digital Clicks](https://artlist.io/sfx/track/61505/hacking---password-cracked,-digital-clicks). Phil Michalski.
4. [Computer Beeps – Morse Code](https://artlist.io/sfx/track/computer-beeps---morse-code-/59931).

### `lock` : clic sur la case
Référence : le son le plus fort de la séquence. Une attaque large bande avec une note à 4,3 kHz, un gros grave pendant 0,4 s et une sorte d'accord à 600–850 Hz.
1. ★ [Sci Fi Interface – UI, Menu Select Button](https://artlist.io/sfx/track/sci-fi-interface---ui-menu-select-button/77926). Cristian Lucchetta.
2. ★ [Futuristic Glitches – Target Locked, Terminate](https://artlist.io/sfx/track/futuristic-glitches---target-locked-terminate/97031). Just Sound Effects.
3. Button, Futuristic (variantes « Gadget, Mechanical »), dans le pack [UI Mechanisms](https://artlist.io/sfx/pack/ui-mechanisms/6990). DeanKR. Plus mécanique, plus lourd.
4. [Mainframe – Hit, Electrical Buzz](https://artlist.io/sfx/track/mainframe---hit-electrical-buzz/54794).
- Plus la couche grave ci-dessus.

### `vanish` : les autres cases disparaissent (environ 0,25 s)
Référence : une rafale d'éclats numériques, une par case.
1. ★ [Glitch Transitions – Texture Stutter, Distorted](https://artlist.io/sfx/track/glitch-transitions---texture-stutter-distorted-/85609). DeanKR.
2. Futuristic Glitches – Stuttering Impact, System Crash, dans le pack [Futuristic Glitches](https://artlist.io/sfx/pack/futuristic-glitches/7871).
3. [Data Disruption – Glitch, Processing, Interference, Corrupted, Rhythmical](https://artlist.io/sfx/track/47819/data-disruption---glitch,-processing,-interference,-corrupted,-rhythmical). Glitchedtones.

### `move` : la case monte en haut à gauche (environ 0,7 s)
Référence : un souffle aigu (2,8 à 3,6 kHz) sur un grondement grave (175 à 250 Hz).
1. ★ [Glitch Transitions – Digital Whoosh, Buzzing](https://artlist.io/sfx/track/glitch-transitions---digital-whoosh-buzzing/85624). DeanKR, 0:02.
2. Glitch Transitions – Data Transmission Whoosh, dans le pack [Glitch Transitions](https://artlist.io/sfx/pack/glitch-transitions/6986). 0:03.
3. Sci Fi Transitions – Short Digital Whoosh, dans le pack [Sci Fi Transitions](https://artlist.io/sfx/pack/sci-fi-transitions/6267). Cristian Lucchetta, 0:02.
4. [Sci Tech Transitions – Digital Interface Glitch](https://artlist.io/sfx/track/sci-tech-transitions---digital-interface-glitch-/91936).

---

## Panneau du projet

### `tick` : les règles du panneau se tracent (environ 0,5 s)
Référence : des tics réguliers, un toutes les 2 images, qui montent légèrement en hauteur.
1. ★ Hacking – Computer Calculating, Clicking Interface, dans le pack [Hacking](https://artlist.io/sfx/pack/hacking/4741). 0:04.
2. [Funny Game UI – Ticking Counter](https://artlist.io/sfx/track/funny-game-ui---ticking-counter/99916). Ni Sound.
3. 8 Bit UI – Interface Tap, dans le pack [8 Bit UI](https://artlist.io/sfx/pack/8-bit-ui/4797). 0:02.

### `panel` : un élément du panneau s'allume
Sert aussi pour la page de détail et l'apparition du bouton son.
Référence : un petit bip vers 1,9 kHz sur un corps vers 540 Hz, plus la couche grave pour les gros éléments. Les 4 « bip » granuleux de la liste (400–900 Hz) viennent aussi d'ici.
1. ★ Sci Fi Interface – UI, Opening on Screen Window, dans le pack [Sci Fi Interface](https://artlist.io/sfx/pack/sci-fi-interface/6265). 0:02.
2. [Cyberpunk – UI, Hologram Open](https://artlist.io/sfx/track/63233/cyberpunk---ui-hologram-open). Unrealsfx.
3. Sci Craft UI – Confirm Blip, Futuristic Clink, Bright, dans le pack [Sci Craft UI](https://artlist.io/sfx/pack/sci-craft-ui/7972).
4. Lo Fi Sci Fi – Short Analog Rising Bleep, dans le pack [Lo Fi Sci Fi](https://artlist.io/sfx/pack/lo-fi-sci-fi/4898). 0:02.
5. [Computer Beeps – Startup Accent](https://artlist.io/sfx/track/computer-beeps---startup-accent/59915).

### `scan` : la vue ASCII apparaît ligne par ligne (environ 0,2 s)
Référence : un balayage qui monte de 1,5 à 3,6 kHz.
1. ★ Cyberpunk – UI, HUD Loading Data, dans le pack [Cyberpunk](https://artlist.io/sfx/pack/cyberpunk/4916).
2. [Analog TV – Electro Static Hiss, Channel Scanning, Crackle](https://artlist.io/sfx/track/analog-tv---electro-static-hiss-channel-scanning-crackle/41290).
3. La piste « data processing scanning » du pack [Futuristic UI](https://artlist.io/sfx/pack/futuristic-ui-/5160).

---

## Lancement

### `launch` : LAUNCH pressé
Référence : des impulsions graves rapides au rythme du clignotement du bouton (toutes les 100 ms), puis la confirmation.
1. ★ [Sci Fi Interface – Console Login, Access Granted](https://artlist.io/sfx/track/sci-fi-interface---console-login-access-granted-/77912). Cristian Lucchetta.
2. [Lo Fi Sci Fi – Beeping Slow and Fast, Camera Timer](https://artlist.io/sfx/track/lo-fi-sci-fi---beeping-slow-and-fast-camera-timer/62930). Pour la pulsation.
3. [Hacking – System Override, Computer Notification](https://artlist.io/sfx/track/hacking---system-override-computer-notification/61497).

### `cut` : coupure nette du panneau
Référence : tout s'arrête d'un coup, le souffle tombe.
1. ★ Power Clicks – Switch On, Computer Terminal, dans le pack [Power Clicks](https://artlist.io/sfx/pack/power-clicks/5301). Adam Pietruszko, 0:02.
2. Analog TV – Burst Transmission, Swirling Signal, Unstable, dans le pack [Analog TV](https://artlist.io/sfx/pack/analog-tv/3082). 0:07 ; on garde l'attaque.
3. [Electric Shock – Degauss TV Interference, Static Buzz](https://artlist.io/sfx/track/electric-shock---degauss-tv-interference-static-buzz/106259).

### `off` : fin du journal, l'écran s'éteint
Référence : coupure au noir, il ne reste que le ronflement.
1. ★ ANLG – Retro TV, Hum, Shutdown, dans le pack [ANLG](https://artlist.io/sfx/pack/anlg/8241). 0:07.
2. [Plugged in – Tv Shut Off, Outro](https://artlist.io/sfx/track/plugged-in---tv-shut-off-outro-/67703). Adam Pietruszko.
3. Media Basics – Tv Power Button, Switching Off, dans le pack [Media Basics](https://artlist.io/sfx/pack/2478/media-basics). Fly Sound, 0:03.

### `back` : BACK et HOME
Référence : un petit bip qui descend.
1. ★ [Computer Beeps – Negative Bleep](https://artlist.io/sfx/track/computer-beeps---negative-bleep/59930).
2. [8 Bit UI – Reversed Beep](https://artlist.io/sfx/track/62048/8-bit-ui---reversed-beep-).
3. [Retro Beeps – 8bit Negative Alert](https://artlist.io/sfx/track/retro-beeps---8bit-negative-alert/116514). Stefano Trezzi.

### `toggle` : bouton son (on l'entend quand le son revient)
1. ★ [ANLG – Vintage TV, Turning On, Pressing Button](https://artlist.io/sfx/track/anlg---vintage-tv-turning-on-pressing-button/101782).
2. Power Clicks – Switch On, Computer Terminal, dans le pack [Power Clicks](https://artlist.io/sfx/pack/power-clicks/5301).
3. [Switches – Plastic Toggle Button, Power Off](https://artlist.io/sfx/track/switches---plastic-toggle-button-power-off/53769).

---

## Transitions (en réserve : écran « click to start », future page de détail)

- [Lo Fi Sci Fi – Machine Powerup and Powerdown Variations, Deep](https://artlist.io/sfx/pack/lo-fi-sci-fi/4898). 2:10 de variations de mise sous tension et d'arrêt. Idéal pour un écran d'allumage qui débloquerait aussi le son dès le premier démarrage.
- [Power Clicks – Build up Whoosh, Eerie Impact](https://artlist.io/sfx/track/power-clicks---build-up-whoosh-eerie-impact-/67724).
- [Sci Fi Devices – Electric Surge, Powering Up and Down](https://artlist.io/sfx/track/sci-fi-devices---electric-surge-powering-up-and-down/49993). 0:06.
- Packs de transitions complets : [Glitch Transitions](https://artlist.io/sfx/pack/glitch-transitions/6986) (DeanKR), [Whooshes & Transitions](https://artlist.io/sfx/pack/3550/whooshes--transitions-) (Glitchedtones), [Sci Tech Transitions Vol 1](https://artlist.io/sfx/pack/sci-tech-transitions-vol-1/7432) (Unrealsfx).

## Packs les plus proches de l'esthétique de la référence

À explorer en entier si tu préfères écouter par pack :
1. [Lo Fi Sci Fi](https://artlist.io/sfx/pack/lo-fi-sci-fi/4898) (Barney Oram) : le plus proche. Rétro, analogique, cathodique, avec des bips de traitement.
2. [ANLG](https://artlist.io/sfx/pack/anlg/8241) (Soundkrampf) : télé vintage, ronflements, extinction.
3. [Electric Glitches](https://artlist.io/sfx/pack/electric-glitches/7075) (Silence+Other Sounds) : crépitements courts.
4. [Computer Beeps](https://artlist.io/sfx/artist/stuart-duffield/1379) (Stuart Duffield) : bips d'ordinateur simples.
5. [Sci Fi Interface](https://artlist.io/sfx/pack/sci-fi-interface/6265) (Cristian Lucchetta) : sélection, fenêtres, connexion.
6. [Bleep Bloop](https://artlist.io/sfx/pack/bleep-bloop/8276) (Artlist Studios) : bavardage de supercalculateur.
7. [Hacking](https://artlist.io/sfx/pack/hacking/4741) (Phil Michalski) : calculs, transferts.
8. [Glitch Transitions](https://artlist.io/sfx/pack/glitch-transitions/6986) (DeanKR) : passages et éclats.
9. [Retro Future Vol 1](https://artlist.io/sfx/pack/8326/retro-future-vol-1) et [Vol 2](https://artlist.io/sfx/pack/retro-future-vol-2/8327) (Bjorn Lynne) : ordinateurs des années 60.
