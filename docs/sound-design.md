# Sound design

Chaque étape de l'interface a son son. Ce sont des effets de bibliothèque coupés, transformés et mixés pour le site, calés sur les images des animations et réglés par mesure contre la vidéo de référence.

## Principes

- **La référence comme guide.** J'ai d'abord analysé la bande-son de la vidéo de référence : attaques par bande de fréquences, spectrogrammes, recalage sur les images. J'en ai tiré une grammaire :
  - un **coup grave qui descend** (environ 200 → 55 Hz en 70 ms) sous chaque gros élément qui apparaît ;
  - des crépitements secs ;
  - des bips analogiques vers 1,9 kHz ;
  - un fond sombre centré vers 200 Hz ;
  - un **net assombrissement** après le clic de lancement.
- **Le son suit l'image.** Les durées sont taillées sur les animations :
  - le démarrage dure 1,6 s, comme l'allumage de la grille ;
  - les 17 tics des règles durent 0,47 s, comme leur tracé (28 images) ;
  - la disparition des cases est une cascade de 14 clics, un par image, comme les cases ;
  - le trajet du viseur (0,52 s) et le déplacement de la case (0,68 s) sont compressés à la durée exacte.
- **Rien ne se répète à l'identique.** Plusieurs variantes par son (jamais deux fois la même d'affilée), une petite variation de hauteur aléatoire, et un nombre de voix limité : un nouveau survol coupe le précédent, la frappe ne dépasse jamais 2 voix.
- **Une seule source de vérité.** Tout le montage est décrit en code dans `tools/sound/recipes.mjs` (découpes, fondus, filtres, hauteur, glissandos, superpositions). Il se rejoue à l'identique avec `node tools/sound/build.mjs`. Les niveaux de mixage sont en tête de `site/js/sound.js`.

## Les sons

| Cue | Moment | Source(s) | Traitement |
|---|---|---|---|
| `room` | fond permanent | morceau d'ambiance (drone sombre) | boucle de 111,5 s sans couture (fondu enchaîné de 4 s), montées atténuées, aigus coupés au-dessus de 2 kHz. Étouffé quand un projet est ouvert, presque éteint au lancement |
| `boot` | allumage de la grille | System Start Up Terminal On, Flickering Signal | 1,8 s du démarrage, accéléré ×1,25 ; scintillement 900 / 445 Hz en dessous, comme la boucle palpitante de la référence |
| `cell` | chaque case (une toutes les 67 ms) | Scroll Clicks, Data Compute Techy Glide | 7 micro-clics de 30 à 60 ms |
| `thump` | sous les gros éléments | Notification Beep (note basse à 128 Hz) | glissando 200 → 55 Hz en 70 ms, la courbe des coups de la référence ; 3 variantes. Une case sur trois, l'onglet, BACK, les blocs, LAUNCH, la page de détail |
| `hover` | survol des cases, boutons et textes | Scroll Clicks | rafale de 5 clics brillants (0,28 s), dans l'esprit d'igloo.inc |
| `select` | arrivée du viseur | Incoming Droplet | le « bloop » grave à 586 Hz et son petit impact |
| `travel` | trajet du viseur (0,52 s) | Sci Craft Cybernetic Scan, Cybernetic Device Scan | bourdon de visée accéléré ×1,8, raies tonales aiguës par-dessus |
| `lock` | clic sur la case | Alien Technology, Cybernetic Scan, Menu Select Retro Bleep | impact sub-grave et accord tenu, accents de verrouillage, attaque rétro, coup grave, +4 dB sous 100 Hz |
| `vanish` | les autres cases disparaissent | Scroll Clicks, Cyber Tech Loading Bleeps | 14 clics, un par image, qui descendent en hauteur et en niveau, sur un fond de glitchs |
| `move` | la case monte en haut à gauche (0,68 s) | Energy Portal Tonal Whoosh, Incoming Droplet | souffle tonal accéléré ×2,2 sur un grondement grave (le sub de la goutte, ralenti) |
| `type` | chaque caractère tapé | Beeps Digital Single Beeps | 6 mini-bips ramenés entre 4 et 6 kHz ; la description est jouée plus bas |
| `tick` | tracé des règles | Cyber Tech Loading Bleeps | les 17 tics réguliers de la fin, qui durent exactement le temps du tracé |
| `panel` | un élément du panneau s'allume | Distorted Rhythmic Beeps, Alert High Beep | bips analogiques saturés ramenés à 1,94 kHz (le bip de la référence) |
| `row` | chaque ligne des listes | Flickering Signal | scintillement granuleux 445 / 900 Hz, un demi-ton plus haut à chaque ligne |
| `button` | LAUNCH, GITHUB, HOME qui apparaissent | Menu Select Retro Bleep | le bip rétro en deux temps |
| `scan` | la vue ASCII apparaît (0,2 s) | Data Compute Techy Glide, Loading Bleeps | arpège montant (2 → 3,4 kHz) compressé sur des arcs montants (un glissando inversé) |
| `launch` | LAUNCH pressé | Alien Technology, Notification Beep | impact sub-grave filtré, coup grave profond : sombre et lourd, comme la référence |
| `cut` | coupure du panneau | Loading Bleeps, Flickering Signal | une rafale et quelques scintillements, fin sèche, filtré à 1,6 kHz |
| `erase` | les textes s'effacent | Data Compute Techy Glide | le bavardage de données joué à l'envers, accéléré, étouffé |
| `drone` | sous le journal du lancement | System Start Up, Alien Technology, Techy Glide | bourdon grave, accord aigu et bavardage loin derrière ; boucle de 2,3 s |
| `off` | l'écran s'éteint | System Start Up | le démarrage en glissando descendant (1 → 0,3), éteint en 0,6 s |
| `back` | BACK, HOME | Incoming Droplet | le « bloop » de sélection, un cran plus bas : son miroir |
| `toggle` | le son revient | 8 Bit UI Minimal Beep | deux mini-bips qui montent |

Sources non retenues : Streaming Logos Deep Impact Sparkling (sa queue grave est trop longue pour l'interface), Gaming Keyboards Typing (une frappe mécanique, alors que la référence est numérique) et la seconde copie de System Start Up (renommée « CRT Screen Electromagnetic Noise »).

## Mixage

- **Lecteur.** Deux circuits : les bruitages, et l'ambiance avec son propre niveau et un passe-bas. Un limiteur en sortie (seuil −8 dB) garantit qu'aucune superposition ne sature. Le son se suspend quand l'onglet est caché.
- **Niveaux réglés par mesure.** `tools/sound/check.mjs` enregistre le parcours scénarisé (calé sur la vidéo), l'aligne sur la référence et compare le niveau de chaque moment, globalement et par bande. Au départ, le site s'écartait du profil de la vidéo jusqu'à 12 dB. À la fin, chaque moment est à ±3,5 dB de l'écart moyen.

| Moment | Écart avec la référence |
|---|---|
| Démarrage | −0,5 dB |
| Trajet du viseur | +1,5 dB |
| Clic | +1,1 dB |
| Disparition et déplacement | −2,7 dB |
| Construction du panneau | +1,7 dB |
| Panneau au repos | −2,8 dB |
| LAUNCH | +3,9 dB |
| Journal | +1,6 dB |
| Noir | +1,7 dB |

- **Écarts volontaires.** Deux moments restent plus brillants que la référence : l'attaque de LAUNCH, pour rester lisible sur de petits haut-parleurs, et la frappe de la description, qui n'existe pas dans la référence.
- **Contrôles.** Crête maximale −4,7 dBFS sur une session complète. Les boucles sont sans couture, vérifiées sur le décodage de Chrome. Sans les fichiers, le site reste silencieux et sans erreur (`tools/sound-test.mjs`).

## Formats

MP3 à 128 kbit/s mono pour les sons ponctuels et 112 kbit/s stéréo pour l'ambiance, soit 2,6 Mo au total. Les boucles ont 0,25 s de marge de chaque côté du point de bouclage, ce qui les garde sans couture même si un navigateur décale le décodage de quelques millisecondes.

## Licence

Les fichiers sources et les sons construits **ne sont pas dans le dépôt** : `sounds-src/` et `site/sounds/` sont exclus de git. Avant de mettre le site en ligne avec ses sons, il faut une licence qui couvre l'usage interactif sur un site web (voir la mise en garde de `docs/sound-selection.md`).

## Limites connues

- Les navigateurs bloquent le son avant le premier clic ou la première touche : le tout premier allumage de la grille reste muet. Un écran « click to start » réglerait ça (une piste d'allumage est proposée dans `docs/sound-selection.md`).
