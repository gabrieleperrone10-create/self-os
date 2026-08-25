# PIANO — Modulo STAT (statistica applicata all'identità)

> Stato: **F0 + F1 + F2 + F7 implementate** (F7 il 2026-08-26). Motore, schema, CRUD, board,
> dettaglio interattivo, quick entry — tutto scritto e verificato (39 test,
> `npm run test:stats`; `tsc --noEmit` e `eslint` puliti su tutto il modulo).
> Non ancora verificato in browser (nessun accesso a UI in questa sessione) e
> `017_stats.sql` non ancora applicata al DB live. F3+ restano proposta.
>
> **Decisioni prese (2026-08-25):** route e modulo = **`/stat`** · scala delle condizioni
> = **solo Non-Existence → Power** (le condizioni basse sono escluse, vedi §1.2) ·
> dati = **solo stat manuali** definite dall'utente (i collector automatici sono
> rinviati alla F6, vedi §3.2).
> Fonte metodologica: *Hubbard Management Technology* (management by statistics +
> condition formulas). Vedi §1 per cosa si tiene e §2 per cosa si butta.

---

## 0. L'idea in una riga

Prendere il ciclo operativo della statistica di Scientology — **misuri una produzione →
guardi il trend → il trend ti assegna una "condizione" → la condizione ti dà una
formula precisa da eseguire questa settimana** — e applicarlo non solo al lavoro ma a
corpo, dieta, relazioni, soldi, mente. Con una differenza sostanziale: la parte
"statistica" viene fatta davvero, non a occhio.

---

## 1. COS'È LA STAT TECH — studio della fonte

### 1.1 I principi (quelli che funzionano e trasferiscono)

1. **Definizione di statistica**: *"un numero o una quantità confrontata con un numero
   o una quantità precedente della stessa cosa"*. Misura **quantità prodotta**, non
   intenzione, non sforzo, non come ti senti.
2. **Ogni "hat" (ruolo) ha la sua stat.** Chi porta più cappelli ha più stat, separate.
   Non esiste una metrica unica della vita.
3. **La stat si grafica su un periodo regolare** (in org: settimana chiusa giovedì 14:00).
4. **Due letture distinte, non una** (punto centrale, era appiattito nella v1 di questo
   piano):
   - **Condizione** = si legge dal *"one-week slant of the line"*, la pendenza fra **due
     punti** (questo periodo vs il precedente). È ciò che in org lo staff usava ogni
     settimana per scriversi la formula. **Bastano 2 dati.**
   - **Tendenza** = la direzione su **più periodi**, dove *"si mediano i punti alti e i
     punti bassi"* e la linea passa grosso modo in mezzo al grafico. Richiede storico.
   - Prova che le due cose non coincidono nella fonte stessa: *"Power is not judged by a
     single line on a graph and must be judged by more than one week's statistic"* — il
     Power è definito come **una Normal mantenuta in fascia altissima**, cioè esiste solo
     al livello della tendenza.
5. **La pendenza della linea determina la condizione**:
   | Linea | Condizione |
   |---|---|
   | quasi verticale giù | Non-Existence |
   | giù | Danger |
   | piatta o leggermente giù | Emergency |
   | leggermente su | Normal |
   | ripidamente su | Affluence |
   | Normal mantenuta in fascia altissima (>1 periodo) | Power |
6. **Ogni condizione ha una formula**: passi in **sequenza esatta**. Invertire l'ordine
   è considerato fatale. Le formule (versione originale, management):
   - **Non-Existence**: trova una linea di comunicazione → fatti conoscere → scopri cosa
     serve o è voluto → produci e presenta.
   - **Danger**: bypassa (gestisci tu direttamente) → gestisci la situazione → assegna la
     condizione all'area → riorganizza perché non si ripeta → raccomanda policy ferma.
   - **Emergency**: promuovi → cambia la base operativa → economizza → preparati a
     consegnare → irrigidisci la disciplina.
   - **Normal**: **non cambiare niente** → quando la stat migliora, scopri *cosa* l'ha
     migliorata e fallo, senza abbandonare quello che facevi → quando peggiora
     leggermente, scopri subito perché e rimedia.
   - **Affluence**: economizza → paga ogni conto → investi il resto in capacità di
     erogazione → scopri cosa ha causato l'affluence e rafforzalo.
   - **Power**: non disconnetterti da ciò che ti ha portato lì → scrivi il tuo "hat"
     (il manuale di come si fa) → rendilo ripetibile.
   - **Power Change**: quando cambi posto/contesto, fai prima le cose che funzionavano,
     non cambiare nulla finché non hai capito.
7. **Regola cardinale**: non applicare mai la formula di una condizione in cui non sei.
   Trattare una Normal come un'Emergency (iper-correzione) o un'Affluence come una
   Normal (non consolidare) è l'errore classico e peggiora la stat.
8. **Non giudicare da un punto solo** — sulle decisioni strutturali conta la tendenza,
   non la singola settimana.
9. **Si gestisce per statistica, non per impressione/umore/racconto.**

### 1.2 Cosa NON funziona (e va corretto, non copiato)

| Difetto originale | Perché è rotto | Correzione nel modulo |
|---|---|---|
| **L'angolo si legge a occhio** | Non ci sono soglie numeriche: cambi la scala verticale del grafico e la stessa serie passa da Normal ad Affluence. Non riproducibile. | Pendenza **relativa** (Theil–Sen / mediana) → invariante di scala, deterministica |
| **Nessuna nozione di rumore** | Il fluttuare casuale settimanale viene letto come condizione. È il paradosso: un sistema chiamato "statistica" senza test statistici. | **Mann–Kendall** (test di trend non parametrico) + MAD dei residui → ogni condizione ha un livello di confidenza |
| **Impianto punitivo** (premi/punizioni sulla stat, "downstat") | Genera paura, non consapevolezza. In un OS identitario è attivamente dannoso. | La condizione è **diagnostica**, mai un giudizio. Nessuna gamification, nessuno shaming, nessuno streak da difendere |
| **Stat push / stat false** | Quando ottimizzi il numero corrompi il numero (Goodhart). In org si gonfiavano i numeri. | Stat **derivate** dai dati che il sistema già possiede + stat accoppiate qualità/quantità + campo "condizioni" del check-in |
| **Solo quantità, mai qualità** | Dottrina esplicita. Per il corpo/relazioni è insensato (10 allenamenti scadenti > 3 buoni?) | Ogni stat può avere una **stat gemella di qualità**; il report le legge insieme |
| **Condizioni "basse" (Liability, Doubt, Enemy, Treason, Confusion)** | Sono macchina di lealtà al gruppo (tradimento, ammenda, ri-ammissione). Nulla a che fare con la produzione personale. | **Escluse.** Unica eventuale eccezione: *Confusione* come stato "non so nemmeno cosa misurare" |
| **Piatto = Emergency, sempre** | Una stat stabile a livello alto e sufficiente non è un'emergenza. | Piatto → Emergency **solo** se sotto il target dichiarato o nella metà bassa del proprio storico; altrimenti Normal |
| **Settimana che chiude giovedì 14:00** | Artefatto organizzativo (serviva a spremere la settimana). | Periodo che chiude **domenica sera**, allineato al weekly report già esistente |

### 1.3 Ricerca su GitHub — esito

- **Non esiste nulla di open source** che implementi la stat tech / condition formulas.
  Ricerche su GitHub API: `scientology statistics` → 0 repo, `condition formula
  scientology` → 0, `hubbard admin tech` → 0, `affluence emergency danger condition` → 0.
- L'unica implementazione reale è **chiusa e commerciale**: *Mastertech "Management by
  Statistics 3"* (app Windows: inserimento giornaliero → totali settimanali, grafici a
  scala automatica, 4–365 periodi con default 13, write-up della condizione). Più i
  corsi WISE / Hubbard College. Nessun algoritmo pubblicato: la condizione la sceglie
  **l'utente** guardando la linea. Confermato: la logica va progettata da zero.
- OSS adiacente da cui prendere **metodo** (non codice, sono Python):
  `mmhs013/pyMannKendall` (289★, famiglia di test Mann-Kendall — riferimento per il
  test di trend), `mathew-kurian/BayesianChangePointJS` (changepoint in TS),
  `markwk/qs_ledger` (1073★, aggregazione quantified-self), `woop/awesome-quantified-self`.
- **Conclusione**: motore scritto in casa in TypeScript (~250 righe, zero dipendenze
  nuove). Recharts c'è già, nessuna libreria statistica da aggiungere.

---

## 2. IL MOTORE — due livelli, non uno

`lib/stats/engine.ts` — funzioni pure, testabili, nessun accesso a DB.

**Input comune**: serie `{period, value}[]`, `direction: 'up' | 'down'` (peso e spese
sono invertite: si negano i valori), `mode: 'grow' | 'maintain'`, `target?: number`.

### 2.1 CONDIZIONE — 2 punti, disponibile dal secondo periodo

`assignCondition(prev, cur, opts)`. È la lettura fedele allo *slant* di una settimana,
resa deterministica e invariante di scala: al posto dell'angolo su un grafico
arbitrariamente scalato, la **variazione relativa rispetto al periodo precedente**.

`d = (cur − prev) / prev`

| Condizione | Regola |
|---|---|
| **Non-Existence** | `cur = 0` (nessuna produzione), oppure `d ≤ −50%` (crollo quasi verticale) |
| **Danger** | `−50% < d ≤ −15%` |
| **Emergency** | `−15% < d ≤ +5%` — in calo lieve o **piatta** (vedi nota `mode`) |
| **Normal** | `+5% < d ≤ +25%` |
| **Affluence** | `d > +25%` |
| **Power** | **mai assegnabile qui** — richiede la tendenza (§2.2) |

**Numeri piccoli.** La percentuale impazzisce sui conteggi bassi (2 allenamenti → 3 è
+50%). Regola: se `prev < 5` unità si passa a **delta assoluto** — `≤ −1.5` Danger ·
`≤ −0.5` Emergency · `|Δ| < 0.5` Emergency/Normal secondo `mode` · `< +1.5` Normal ·
`≥ +1.5` Affluence. Sotto una certa granularità la percentuale non è informazione, è
rumore aritmetico. Le soglie sono continue, non intere, così reggono anche le stat
frazionarie (ore di sonno, ore di deep work).

*Uscita dal nulla*: `prev = 0` cade sempre nella banda assoluta (0 < 5), quindi 0 → 1 è
Normal e 0 → 2 o più è Affluence. Più difendibile del "qualsiasi produzione = Affluence"
scritto nella v1 del piano: un allenamento non è un'abbondanza.

**Nota `mode` — unica deviazione deliberata dalla dottrina.** Nell'originale *piatta =
Emergency*, sempre: un'org deve sempre espandersi. Per una vita non è vero.
- `mode: 'grow'` (entrate, unità prodotte, deep work) → dottrina fedele: piatta = Emergency.
- `mode: 'maintain'` (allenamenti 3/sett, ore di sonno, pasti in target) → piatta **a
  livello del target o sopra** = Normal; piatta sotto il target = Emergency.

### 2.2 TENDENZA — N punti, è dove sta la statistica vera

`analyzeTrend(series, opts)`, finestra di **13 periodi** (minimo 4 per un risultato,
significatività onesta da ~6):
1. **Theil–Sen** (mediana delle pendenze a coppie) → `m`, robusta agli outlier — è la
   versione rigorosa di *"media i punti alti e i punti bassi"*;
2. `c` = mediana della finestra → `r = m / c`, variazione relativa per periodo
   (invariante di scala);
3. **Mann–Kendall** (`tau`, `p`, approssimazione normale con correzione di continuità e
   gestione dei ties) → significativo se `p < 0.10`;
4. `noise = MAD(residui) / c`.

| Tendenza | Regola |
|---|---|
| *Non ancora leggibile* | < 4 periodi |
| **Non-Existence** | mediana degli ultimi 3 periodi = 0 |
| **Danger** | (`p<0.10` e `r ≤ −15%`) **oppure** 3 periodi consecutivi in calo |
| **Emergency** | (`p<0.10` e `r ≤ −3%`) **oppure** piatta sotto target / nella metà bassa dello storico |
| **Normal** | `−3% < r < +10%`, o salita non significativa |
| **Affluence** | `p<0.10` e `r ≥ +10%` |
| **Power** | ≥12 periodi, ultimi 3 tutti ≥ 90° percentile della **prima metà** dello storico, nessun downtrend significativo — *una Normal tenuta in fascia altissima* |

Il confronto del Power è con la **prima metà** dello storico, non con tutto: altrimenti
una stat sempre piatta allo stesso livello risulterebbe in Power (non c'è nessuna fascia
nuova), e un altopiano tenuto da mesi lo perderebbe man mano che l'altopiano stesso alza
il percentile. Testato in entrambe le direzioni.

**Isteresi** sulla tendenza: cambia solo se confermata per 2 periodi, tranne Danger e
Non-Existence (immediate — coerente con la dottrina: il Danger si assegna sul posto).
La condizione (§2.1) **non** ha isteresi: è per definizione la lettura del periodo.

**Confidenza** (sempre esposta in UI): `alta` ≥10 punti e (`p<0.05` **oppure** rumore
<15%) · `media` ≥6 punti e (`p<0.10` **oppure** rumore <30%) · `bassa` altrimenti.
Il rumore entra nella formula perché una serie lunga e pulita è affidabile anche quando
dice "nessun trend": la fiducia non è solo nel trend, è nella lettura.

### 2.3 COME SI COMBINANO — il pezzo di prodotto

Le due letture si mostrano **sempre insieme**, e la relazione fra loro è essa stessa
l'informazione:

| Caso | Lettura | Cosa fa il sistema |
|---|---|---|
| Condizione **=** tendenza | conferma | applica la formula, alta fiducia |
| Condizione **peggiore** della tendenza (es. Danger dentro una Affluence) | **fluttuazione, non emergenza** | **non** applica la formula di Danger — è esattamente l'errore cardinale (§1.1 punto 7). Lo dice, e basta |
| Condizione **migliore** della tendenza (es. Affluence dentro una Danger) | **rimbalzo, non recupero** | non festeggia: chiede se è ripetibile o è un picco |
| Tendenza non ancora leggibile (<4 punti) | solo condizione | la mostra marcata *"senza tendenza — non ci basare decisioni strutturali"* |

Questo risolve alla radice il whiplash settimanale del sistema originale: lì la formula
si applicava sullo slant di due punti, cioè spesso sul rumore.

### 2.4 Confine del motore

Il motore lavora su **`number[]` denso e ordinato**, non su date: chi legge dal DB decide
come riempire i periodi mancanti (0 o esclusione), perché è una scelta di prodotto, non
un'inferenza statistica. Nessuna logica di calendario dentro `lib/stats/`.

Per l'isteresi servono due colonne in `stat_readings`: la tendenza **grezza** e quella
**assegnata** del periodo precedente (`applyTrendHysteresis(raw, prevRaw, prevAssigned)`).

### 2.4-bis Test — 28 casi, verdi

`lib/stats/engine.test.ts`, serie sintetiche + casi golden:
- moltiplicare tutta la serie ×1000 **non deve cambiare** né condizione né tendenza
  (il test anti-Hubbard: nell'originale basta riscalare il grafico per cambiare esito);
- serie piatta rumorosa → **mai** tendenza Danger;
- crollo netto → Danger immediato, senza isteresi;
- 2 soli punti → condizione presente, tendenza `null`;
- conteggi piccoli (2→3) → banda assoluta, non percentuale.

## 3. DATI

### 3.1 Migration `017_stats.sql`

- **`stat_definitions`** — `id, user_id, key, label, area` (corpo/lavoro/relazioni/
  mente/soldi), `unit`, `direction ('up'|'down')`, `period ('week'|'day')`,
  `source ('manual'|'derived')` — **in F1 sempre `'manual'`**; la colonna resta per
  i collector della F6 —,
  `target numeric null`, `quality_of uuid null` (stat gemella di qualità), `active bool`.
- **`stat_entries`** — `stat_id, user_id, period_start date, value numeric, note` —
  unique `(stat_id, period_start)`.
- **`stat_readings`** — la lettura di un periodo, **entrambi i livelli**: `condition`
  (da 2 punti) + `delta_pct`, e `trend` (nullable, da N punti) + `relative_slope`, `tau`,
  `p_value`, `confidence`, `window_size`, più `divergence` (`confirm` | `fluctuation` |
  `rebound` | `no_trend`) e `assigned_at`.
- **`stat_programs`** — la formula della settimana: `stat_id, period_start, condition,
  steps jsonb` (passi istanziati dall'AI), `user_writeup text`, `outcome` (compiuta /
  parziale / saltata), `reviewed_at`.
- RLS su tutte (`users_own_data` + policy coach dove serve), indici su `(user_id, period_start)`.

### 3.2 Stat manuali — catalogo di partenza

L'utente definisce le proprie stat. In onboarding del modulo si propone un catalogo per
area, con unità e direzione già impostate, per evitare la pagina bianca:

| Area | Stat proposte | Direzione |
|---|---|---|
| Corpo | allenamenti, pasti in target, ore di sonno, peso | up · up · up · **down** |
| Dieta | giorni senza sgarro, grammi di proteine, alcolici | up · up · **down** |
| Lavoro | ore di deep work, unità prodotte (spedito/scritto/venduto), € | up |
| Relazioni | conversazioni significative, tempo di qualità, contatti iniziati | up |
| Mente | sessioni di pratica, letture, rotture di pattern viste | up |
| Soldi | entrate, risparmio, spese discrezionali | up · up · **down** |

Regole di prodotto:
- **Max ~5 stat attive** per volta (limite in UI). Più stat = nessuna stat.
- Ogni stat ha una **definizione operativa scritta dall'utente** ("cosa conta come
  un allenamento") — è la difesa contro il gonfiaggio del numero.
- Inserimento **a 1 tap** da mobile, con recap domenicale che chiede solo i valori
  mancanti della settimana.

**Cold start — molto meno grave di quanto scritto nella v1 del piano.** Con la
distinzione §2.1/§2.2, **la condizione esiste dal secondo periodo**: due dati e il
modulo parla. Manca solo la *tendenza*, che arriva a 4 punti e diventa affidabile verso
i 6–10. Nel frattempo l'UI mostra la condizione con l'etichetta *"senza tendenza"* invece
di fingere una lettura che non ha. Mitigazioni comunque previste in F2:
1. **Inserimento retroattivo** dei periodi passati (griglia "ultime 8 settimane", stima
   a memoria — marcata come `estimated: true` e usata solo per il trend, mai per i record);
2. **periodo `day`** selezionabile per le stat ad alta frequenza (allenamenti, pasti):
   con dati giornalieri si arriva a 13 punti in due settimane;
3. UI esplicita sul perché non c'è ancora una condizione, invece di mostrarne una falsa.

**F6 (rinviata) — collector automatici.** L'infrastruttura resta predisposta: registry
`lib/stats/collectors/` con funzioni `(userId, from, to) => {period, value}[]` che
alimentano stat `source='derived'` non scrivibili a mano, da `checkins` (numero check-in,
stato medio), `experiment_entries` (rotture di pattern), `signals`, `biometric_samples`
(sonno, HRV, passi), `calendar_events` (carico meeting), `decisions`. Quando le
attiveremo, il modulo nasce con mesi di storico già dentro e le stat derivate sono
anche l'antidoto strutturale a Goodhart (§9).

## 4. AI — dalla condizione al programma della settimana

In org lo staff si scrive la formula a mano. Qui la scrive il sistema, istanziata sui
**dati reali** e sul **profilo identitario** già presente.

- Route `app/api/ai/stat-program/route.ts` — riceve dal motore condizione, tendenza,
  divergenza e formula **già decise** e restituisce solo i passi istanziati (§5.3).
  Schema obbligatorio del repo:
  `maxDuration = 60` riga 1 → auth → `checkAiQuota` → prompt da
  `lib/anthropic/prompts/stat-program.ts` → `AI_MODEL` + `thinking: NO_THINKING` →
  `cachedKbSystem(kb, istruzione, contestoUtente)` (profilo identitario nel **terzo**
  argomento) → `parseAIJson` + schema Zod in `lib/anthropic/schemas.ts` →
  `recordAiUsage`.
- Migration `018_kb_stat_conditions.sql`: nuova categoria KB `stat_conditions` con le
  formule riscritte in chiave personale (sequenza esatta preservata). Esempio Emergency:
  *aumenta il volume dell'azione base → cambia il modo in cui la fai → taglia il
  superfluo che ti distrae → ripristina la disciplina minima non negoziabile.*
- Vincolo di prompt: **non inventare passi**, istanziare quelli della condizione
  assegnata; citare i numeri veri; niente motivazionale.
- `evals/cases.ts`: casi per Danger/Normal/Affluence — il judge verifica sequenza
  corretta, specificità sui dati, assenza di genericità.

---

## 5. UI — la scheda di lettura

### 5.1 Cosa vedi quando selezioni una stat (o un punto sul grafico)

Tre blocchi, **sempre in questo ordine, sempre tutti e tre**. È il contratto di output
del modulo: nessuna schermata mostra un numero senza dire cosa significa e cosa farne.

```
┌─ ALLENAMENTI ───────────────── sett. 18–24 ago ─┐
│                                                  │
│  CONDIZIONE      DANGER                          │
│                  5 → 3  (−40%)                   │
│                  Calo netto rispetto alla        │
│                  settimana scorsa.               │
│                                                  │
│  TENDENZA        AFFLUENCE  ·  +12%/sett         │
│  ultime 9 sett.  confidenza media (p=0.04)       │
│                                                  │
│  COSA FARE ORA   ⚠ Non applicare la formula      │
│                  di Danger.                      │
│                  La tendenza è in salita: questa │
│                  è una settimana sotto, non un   │
│                  crollo. Nessuna azione          │
│                  strutturale. Annota solo cosa   │
│                  è successo questa settimana.    │
└──────────────────────────────────────────────────┘
```

1. **CONDIZIONE** — condizione del periodo, i due valori che l'hanno prodotta, la
   variazione (% o assoluta secondo §2.1), una riga di lettura in chiaro.
2. **TENDENZA** — condizione di tendenza, pendenza relativa per periodo, numero di
   periodi e **confidenza esplicita** (`p`). Se mancano i punti: *"non ancora leggibile
   (2 punti su 4)"*, mai una tendenza finta.
3. **COSA FARE ORA** — i passi della formula, **numerati, in sequenza esatta**,
   istanziati sui numeri veri di quella stat. In cima una riga secca che dice **quale**
   formula si sta applicando e **perché**.

### 5.2 Come si compone il blocco "COSA FARE ORA"

Deriva meccanicamente dalla divergenza §2.3 — non è una scelta dell'AI:

| Caso | Contenuto del blocco |
|---|---|
| **Conferma** (condizione = tendenza) | Formula della condizione, passi completi, istanziati |
| **Fluttuazione** (condizione peggiore della tendenza) | **Nessuna formula.** "Non applicare la formula di X" + perché + unica azione: annota cosa è successo. È la regola cardinale (§1.1 punto 7) resa operativa |
| **Rimbalzo** (condizione migliore della tendenza) | Nessun festeggiamento: una domanda sola — è ripetibile o è un picco? Se ripetibile, cosa l'ha prodotto |
| **Senza tendenza** (<4 punti) | Formula della condizione, marcata **provvisoria — basata su 2 punti** |
| **Power** (solo da tendenza) | Formula del Power: non disconnetterti da ciò che ti ha portato qui, scrivi il manuale di come si fa |

### 5.3 Separazione netta AI / motore — vincolo di architettura

Il contratto è un oggetto `StatReadout`:
`{ condition, delta, trend, slope, pValue, confidence, divergence, formula: { name, steps[], why } }`

- **Quale formula si applica lo decide il motore**, deterministicamente. Mai il modello.
- **L'AI riempie solo il testo dei passi**, istanziandoli sui dati reali dell'utente.
- Se l'AI non risponde (quota, errore), la scheda mostra comunque condizione, tendenza e
  i **passi generici della formula** dalla KB: il modulo non si rompe mai (regola 4 del repo).

### 5.4 Resto dell'UI

- **`/stat` — Condition Board**: tutte le stat per area, ognuna con chip di condizione +
  chip di tendenza (i due livelli sempre distinti a colpo d'occhio), sparkline,
  confidenza. La lettura d'insieme è il pezzo che nessun habit tracker fa.
- **`/stat/[key]` — dettaglio**: `page.tsx` server + `chart.tsx` client (convenzione
  Recharts del repo), grafico con retta di tendenza + storico condizioni + la scheda
  §5.1 + il write-up personale. **Selezionando un punto del grafico** la scheda si
  ricalcola su quel periodo (condizione e tendenza *a quella data*, non quella odierna).
- **Quick entry mobile-first**: +1 / valore, override mobile come classi in
  `app/globals.css` sotto `@media (max-width: 768px)` (convenzione §5.5 architecture-map).
- Tipografia Georgia, dark only, bordi 1px, animazioni 0.4–0.8s — come tutto il resto.

## 6. CICLO SETTIMANALE

Si aggancia al cron esistente `cron/evening` (domenica 19 UTC, dove già gira il weekly
report): collector → `stat_entries` → motore → `stat_readings` → programma AI per le
stat che cambiano condizione → dentro il weekly report. Nessun cron nuovo (Hobby: max 2).

---

## 7. IL PEZZO IDENTITARIO (perché è SELF OS e non un tool di management)

Lettura **incrociata** delle condizioni tra aree: *"Affluence sul lavoro, Danger su corpo
e relazioni da tre settimane"* → non è una classifica, è un **pattern di compensazione**.
Il board delle condizioni viene iniettato come contesto per-utente in `weekly-report`,
`identity-profile` e `mirror`. La domanda del prodotto non è "come alzo la stat" ma
**"chi sei, mentre produci questo?"**.

---

## 7-bis. FAMIGLIE DI STAT — VFP e livelli di produzione (F7)

Aggiunta dopo la domanda: *"il risultato che voglio è una forma fisica precisa; come
faccio a vedere cosa sta portando o non portando il risultato?"*.

### Cosa dice la fonte

Il concetto che serve esiste ed è centrale: **VFP — Valuable Final Product**. Ogni posto
ha un prodotto finale definito con precisione, e la statistica misura la produzione di
*quel* prodotto, non l'attività generica. Verificato: Hubbard distingueva nel prodotto
**quantità, qualità e viability** — quindi la qualità era prevista fin dall'origine, ma
in pratica è stata schiacciata dalla quantità perché è l'unica cosa facile da graficare.
La distinzione portante è **motion vs production**: pieno di attività, prodotto assente.

L'org board diagnostica un prodotto che non arriva **scendendo la gerarchia** fino alla
divisione che non produce. Da qui la struttura:

```
VFP        massa grassa %, carico sul sollevamento target
 ├ quantity   l'hai fatto?          allenamenti fatti
 ├ quality    come l'hai fatto?     carico progressivo, tecnica
 └ support    condizione abilitante nutrizione, sonno
```

### Tabella diagnostica (`lib/stats/family.ts`)

| VFP | quantity | quality | support | Diagnosi |
|---|---|---|---|---|
| giù | giù | — | — | `consistent_down` — la catena si spiega da sé |
| giù | ok | giù | — | `method_failure` — **la costanza è scagionata dai dati**, cambia il programma |
| giù | ok | ok | giù | `support_failure` — cede il contorno |
| giù | ok | ok | ok | `unmanned_post` — **la causa non è nei tuoi dati** |
| ok | ok | ok | ok | `confirmed` |
| ok | qualsiasi giù | | | `unexplained_gain` — fortuna, o misuri la cosa sbagliata |

**L'ordine dei controlli non è arbitrario**: la quantità viene prima, perché su lavoro
non fatto non si può valutare il metodo — una divisione che non produce affatto non ha un
problema di metodo. `unmanned_post` è il caso più prezioso: invece di inventare una causa
(o di incolpare la disciplina, che i dati smentiscono), dichiara il buco ed elenca i
livelli non coperti.

**In ordine ≠ condizione buona**: `isInOrder` riusa la divergenza §2.3 — una fluttuazione
dentro una tendenza buona non è un fallimento, un rimbalzo dentro una tendenza in calo non
è produzione ristabilita.

### Allineamento dei periodi

Un VFP mensile con figli settimanali richiede di aggregare i figli al mese, e **come**
dipende dalla stat: gli allenamenti si sommano, il peso no, l'aderenza si media. Da qui
`aggregation` (`sum` | `mean` | `last`) sulla definizione: senza, un peso settimanale
aggregato a mese darebbe 4× il valore vero. Un periodo del figlio finisce nel periodo del
VFP che contiene la sua **data di inizio** (regola dichiarata per le settimane a cavallo).

### Associazione — il pezzo che Hubbard non aveva

Con storico sufficiente: in quanti periodi il VFP è migliorato mentre il figlio produceva,
contro quelli in cui non produceva. **Conteggi grezzi, mai un p-value** — su una manciata
di periodi auto-riportati sarebbe falsa precisione. Riportata solo con ≥6 periodi, ≥2 per
braccio e contrasto ≥40 punti, ed etichettata *associazione, non causa*.

### Nota di registro — deriva da evitare

Il "why finding" della Data Series, nella pratica documentata, è degenerato in caccia al
colpevole ("chi tiene giù le stat"). Applicato a se stessi diventa auto-colpevolizzazione,
che non è una diagnosi. Per questo la copy nomina sempre un **livello strutturale**, mai
una colpa — e nel caso `method_failure` dice esplicitamente che i dati scagionano la
costanza.

---

## 8. FASI

| Fase | Contenuto | Esito verificabile |
|---|---|---|
| **F0** ✅ | `lib/stats/math.ts` + `engine.ts` + `engine.test.ts` — condizione (2 punti), tendenza (Theil–Sen, Mann–Kendall, MAD), isteresi, divergenza | **fatto**: 39 test verdi, `tsc` e `eslint` puliti, zero dipendenze nuove |
| **F1** ✅ | `017_stats.sql` (`stat_definitions`, `stat_entries`, RLS) + `types/index.ts` + `app/api/stats/**` (CRUD, max 5 attive, slug automatico) + `lib/stats/data.ts` (lettura senza cache) | **fatto** — migrazione applicata al DB live |
| **F2** ✅ | `/stat` (board per area, sparkline SVG, quick entry) + `/stat/new` (catalogo + form) + `/stat/[key]` (grafico Recharts cliccabile + `ReadoutCard` con i tre blocchi §5.1 + inserimento retroattivo) | **fatto e verificato nel browser** |
| **F3** | KB 018 + prompt + route AI + evals | Programma settimanale generato — copy deterministica di `lib/stats/copy.ts` già fa da fallback (§5.3) |
| **F4** | Aggancio a `cron/evening` + weekly report | Ciclo automatico |
| **F5** | Board incrociato nei prompt identitari | Lettura di compensazione |
| **F6** | Collector automatici + backfill storico (rinviata) | Stat derivate senza data entry |
| **F7** ✅ | Famiglie: VFP + figli (`quantity`/`quality`/`support`), allineamento al periodo del VFP, diagnosi, associazione osservata. `018_stat_families.sql`, `lib/stats/family.ts`, `family-copy.ts`, pannello nel dettaglio | **fatto e verificato nel browser**: 68 test verdi, 017 e 018 applicate al DB live |
| **F7-bis** ✅ | Famiglia annidata sulla board (le stat figlie non aprono una propria sezione area) + UI di modifica/pausa/eliminazione (mancava del tutto in F2 — solo le route API esistevano) | **fatto**: `SettingsPanel` con eliminazione a doppio passaggio, verificato nel browser |

F0–F2 sono il valore minimo utile. F3–F5 sono ciò che lo rende SELF OS.

---

## 9. RISCHI

- **Goodhart**: appena una stat conta, la si gonfia — e con le sole stat manuali questo
  rischio è al massimo. Mitigazione: definizione operativa scritta dall'utente, stat
  gemella di qualità, nessun premio legato al numero; strutturalmente si chiude solo con
  le stat derivate (F6).
- **Fatica di inserimento**: è *il* rischio numero uno della scelta "solo manuali".
  Mitigazione: 1 tap, max ~5 stat attive, recap domenicale che chiede solo i buchi,
  e nessuna penalità per un periodo saltato (il motore gestisce i vuoti).
- **Cold start**: rientrato — condizione dal 2° periodo, tendenza dal 4°/6° (§2, §3.2).
- **Whiplash da 2 punti**: leggere la formula sullo slant settimanale significa spesso
  agire sul rumore — è il difetto operativo del sistema originale. Mitigazione: la
  regola di divergenza §2.3, che sopprime la formula quando condizione e tendenza si
  contraddicono.
- **Rumore letto come segnale**: mitigato da MK + isteresi + confidenza esposta.
- **Deriva punitiva**: regola di prodotto scritta nel prompt — la condizione descrive,
  non giudica; nessuno streak, nessun badge, nessun "downstat".
