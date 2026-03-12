-- ================================================================
-- SELF OS — Demo Check-ins
-- Esegui DOPO demo-user.sql
-- Ciclo comportamentale ogni ~3 settimane:
--   Alta energia (7-9) → Overwork (5-7) → Burnout (2-4) → Recupero (5-7)
-- ================================================================

DO $$
DECLARE
  uid UUID := 'dec0de00-0000-4000-8000-000000000001';
BEGIN

INSERT INTO public.checkins (user_id, type, state_score, answers, ai_insight, date, created_at) VALUES

-- ══════════════════════════════════════════
-- CICLO 1: DIC 7–31
-- ══════════════════════════════════════════

-- DIC 7-14: Alta energia (7-9)
(uid,'morning',8,'{"q2":"Il fondatore che costruisce da visione, non da paura","q3":"La conversazione difficile con il co-founder sul ruolo dei lead"}','Operi da una versione che sa cosa vuole. La conversazione che eviti è esattamente il confine che devi attraversare.','2025-12-07','2025-12-07 08:14:00+00'),
(uid,'evening',8,'{"q2":"Visione — ho detto no a una partnership non allineata","q3":"Il mio bisogno di controllo: ho riscritto codice del CTO senza dirgli niente"}','Hai deciso da visione e nello stesso giorno hai controllato il lavoro di qualcun altro. Il confine tra standard alti e sfiducia è sottile — oggi li hai attraversati entrambi.','2025-12-07','2025-12-07 21:30:00+00'),

(uid,'morning',9,'{"q2":"Qualcuno che finalmente rilascia invece di trattenere","q3":"Delegare il customer support — ho paura che lo facciano male"}','Stai nominando la paura correttamente: non è che lo faranno male, è che non controlli l''esito. Delegare è un atto di fede nella tua capacità di correggere la rotta.','2025-12-09','2025-12-09 07:55:00+00'),
(uid,'evening',8,'{"q2":"Visione — ho ammesso un errore senza difendermi","q3":"Il perfezionismo: ho rifatto la landing page tre volte invece di pubblicarla"}','Prendersi responsabilità senza difendersi è leadership. Rifare la landing tre volte non è cura — è controllo che si maschera da qualità.','2025-12-09','2025-12-09 22:00:00+00'),

(uid,'morning',8,'{"q2":"Il leader che ascolta prima di rispondere","q3":"Guardare le metriche di retention — ho paura di quello che troverò"}','La paura dei dati dice qualcosa: credi che i numeri possano toglierti il diritto di continuare. I dati non valutano te — descrivono il prodotto.','2025-12-11','2025-12-11 08:05:00+00'),
(uid,'evening',7,'{"q2":"Paura — ho rimandato una decisione difficile aspettando il momento giusto","q3":"Il rimandare: il momento giusto non arriva mai, lo creo io"}','Hai visto il pattern mentre accadeva. Questo è già diverso. La domanda è: cosa aspetti esattamente che arrivi?','2025-12-11','2025-12-11 21:45:00+00'),

(uid,'morning',9,'{"q2":"Il Marco che lavora 6 ore intense invece di 12 disperse","q3":"Smettere di rispondere ai messaggi subito — ho un''identità costruita sull''essere sempre disponibile"}','Sei disponibile 24h non perché sei generoso — sei disponibile perché hai paura che se non ci sei, non servi. Questi sono due stati molto diversi.','2025-12-13','2025-12-13 07:48:00+00'),

-- DIC 15-21: Overwork (5-7)
(uid,'morning',7,'{"q2":"Qualcuno che non si lascia risucchiare dall''urgenza","q3":"Il backlog tecnico — ogni giorno arriva qualcosa di più urgente"}','L''urgenza continua non è un problema operativo — è un segnale sistemico. Cosa nella tua struttura produce emergenze ogni giorno?','2025-12-15','2025-12-15 08:30:00+00'),
(uid,'evening',6,'{"q2":"Paura — ho accettato una call alle 22 per non sembrare poco professionale","q3":"Il bisogno di approvazione: aspettavo che il cliente mi dicesse che stavo facendo bene"}','Hai lavorato fino alle 22 per non sembrare improfessionale — ma chi stavi convincendo? Il cliente o te stesso?','2025-12-15','2025-12-15 23:15:00+00'),

(uid,'morning',6,'{"q2":"Chiunque riesca a finire le cose invece di iniziarne sempre di nuove","q3":"I 4 progetti aperti — ogni volta che uno si avvicina alla fine, ne apro un altro"}','Quattro progetti aperti, nessuno chiuso. Aprire quando uno è vicino alla fine — è autosabotaggio pre-successo. È la firma del tuo ciclo.','2025-12-17','2025-12-17 08:00:00+00'),
(uid,'evening',5,'{"q2":"Paura — ho lavorato 13 ore perché avevo terrore di restare indietro","q3":"Il mio corpo che mi chiede di fermarmi e io che ignoro il segnale"}','Il corpo non mente. Hai lavorato 13 ore da paura, non da visione. La differenza si sente nel corpo prima che nella mente.','2025-12-17','2025-12-17 22:30:00+00'),

(uid,'morning',6,'{"q2":"Qualcuno che sa dire no senza dover giustificare ogni cosa","q3":"La riunione inutile alle 10 che non riesco a togliere dal calendario"}','Non riesci a togliere la riunione inutile: di cosa avresti bisogno per farlo? Permesso? Da chi?','2025-12-19','2025-12-19 08:20:00+00'),
(uid,'evening',5,'{"q2":"Paura — ho detto sì a una feature che non credo nel prodotto per non deludere il cliente","q3":"Il salvatore: ho risolto un bug del mio dev invece di farglielo risolvere lui"}','Hai detto sì a una feature che non credi, hai risolto il bug al posto del dev. Stai portando il peso di tutti. Quanto pesa?','2025-12-19','2025-12-19 21:55:00+00'),

-- DIC 24-28: Burnout/Natale (3-5)
(uid,'morning',4,'{"q2":"Qualcuno che riesce a staccare davvero almeno un giorno","q3":"Staccare. Non riesco a non pensare al lavoro neanche a Natale"}','Non riesci a staccare a Natale. Non è forza — è incapacità di esistere senza produrre. Cosa temi troveresti nel silenzio?','2025-12-24','2025-12-24 09:00:00+00'),
(uid,'evening',3,'{"q2":"Paura — ho controllato le email durante il pranzo di Natale","q3":"La mia incapacità di essere presente: ero fisicamente lì ma mentalmente già al 26"}','Fisicamente a Natale, mentalmente al 26 dicembre. Il lavoro non ti aspetta — sei tu che non riesci ad aspettarlo.','2025-12-24','2025-12-24 22:00:00+00'),

(uid,'morning',4,'{"q2":"Presente. Solo presente.","q3":"Smettere di monitorare le notifiche ogni 10 minuti"}','Presente — è la versione più semplice e più difficile per te. Il monitoraggio compulsivo è controllo che cerca sicurezza dove non può trovarla.','2025-12-27','2025-12-27 09:30:00+00'),

-- DIC 29-31: Recupero (5-6)
(uid,'morning',6,'{"q2":"Il Marco che pianifica il 2026 da chiarezza, non da ansia","q3":"La tendenza a pianificare il nuovo anno come fuga dall''anno vecchio"}','Pianificare il nuovo anno da fuga è lo stesso ciclo con una data diversa. Cosa del 2025 devi integrare prima di correre verso il 2026?','2025-12-29','2025-12-29 08:15:00+00'),
(uid,'evening',6,'{"q2":"Visione — ho scritto 3 cose che ho costruito bene quest''anno","q3":"Il mio critico interno: fatico a riconoscere i successi senza trovare subito il difetto"}','Tre cose costruite bene, e il critico interno già al lavoro. Il pattern non è che non vedi i successi — è che li vedi e poi li neutralizzi.','2025-12-29','2025-12-29 21:00:00+00'),

(uid,'morning',6,'{"q2":"Qualcuno che entra nel 2026 con intenzione invece che con lista di obiettivi","q3":"Il bisogno di fare un piano perfetto — se non è perfetto non lo seguo comunque"}','Un piano perfetto non eseguito è zero. Un piano imperfetto eseguito è tutto. Quando smetti di usare la perfezione come scusa?','2025-12-31','2025-12-31 08:00:00+00'),

-- ══════════════════════════════════════════
-- CICLO 2: GEN 2–31
-- ══════════════════════════════════════════

-- GEN 2-7: Recupero/Rilancio (6-7)
(uid,'morning',7,'{"q2":"Il fondatore che costruisce la v2 di sé mentre costruisce la v2 del prodotto","q3":"Riprendere le abitudini dopo le feste — mi sento già in ritardo su tutto"}','Senti il ritardo prima ancora di aver iniziato. Il ritardo rispetto a cosa? A una linea di partenza che hai disegnato tu.','2026-01-02','2026-01-02 08:10:00+00'),
(uid,'evening',7,'{"q2":"Visione — ho avuto una conversazione onesta con il co-founder","q3":"Il bisogno di controllo: durante la call volevo dare la risposta prima che finisse di parlare"}','Conversazione onesta col co-founder: coraggio. Rispondere prima che finisca: controllo travestito da efficienza.','2026-01-02','2026-01-02 21:30:00+00'),

(uid,'morning',7,'{"q2":"Qualcuno che lavora in profondità su una cosa invece di toccare tutto superficialmente","q3":"Il multitasking compulsivo — apro 20 tab e non chiudo niente"}','Venti tab aperte è il multitasking del pensiero: stai cercando di essere ovunque nello stesso momento. Dove non vuoi essere?','2026-01-05','2026-01-05 07:50:00+00'),

-- GEN 8-15: Alta energia ciclo 2 (7-9)
(uid,'morning',8,'{"q2":"Il leader che ispira perché è genuino, non perché performa","q3":"Il pitch agli investitori — mi preparo ma non voglio diventare una versione recitata di me"}','Hai già la risposta: non vuoi recitare. Il pitch migliore che hai mai fatto è stato quello in cui hai detto la verità su dove eravate.','2026-01-08','2026-01-08 08:00:00+00'),
(uid,'evening',8,'{"q2":"Visione — ho ammesso a un investitore che non so ancora la risposta","q3":"Il bisogno di sembrare competente: ho detto ''non so'' e ho resistito all''impulso di coprirlo subito"}','Dire ''non so'' a un investitore e resistere alla copertura immediata — leadership da un posto di sicurezza, non di paura.','2026-01-08','2026-01-08 21:45:00+00'),

(uid,'morning',9,'{"q2":"Il Marco che finisce quello che inizia","q3":"Chiudere la feature ferma da 3 settimane — so già che quando sarà finita aprirò qualcos''altro"}','Sai già il pattern mentre stai per eseguirlo. Questa consapevolezza in tempo reale è nuova per te. Usala.','2026-01-10','2026-01-10 07:45:00+00'),
(uid,'evening',9,'{"q2":"Visione — ho rilasciato la feature senza aspettare che fosse perfetta","q3":"La soddisfazione che dura poco: dopo il rilascio mi sono sentito bene per 10 minuti poi già al prossimo"}','Hai rilasciato senza aspettare la perfezione. La soddisfazione che dura 10 minuti dice che stai inseguendo qualcosa di esterno a te.','2026-01-10','2026-01-10 21:30:00+00'),

(uid,'morning',8,'{"q2":"Qualcuno che misura l''impatto invece del volume di output","q3":"Smettere di misurare la giornata dal numero di task completati"}','Misurare la giornata dai task è come misurare uno chef dai piatti lavati. Quale impatto reale stai costruendo?','2026-01-12','2026-01-12 08:15:00+00'),

-- GEN 16-22: Overwork (4-6)
(uid,'morning',6,'{"q2":"Qualcuno che non si lascia risucchiare da ogni emergenza","q3":"La cultura dell''urgenza che ho creato io nel team — loro mi rispecchiano"}','Il team ti rispecchia: se loro vivono nell''urgenza, è perché tu hai modellato quella frequenza. Il cambiamento inizia da te.','2026-01-16','2026-01-16 08:00:00+00'),
(uid,'evening',5,'{"q2":"Paura — ho risposto a un messaggio Slack alle 23 per dimostrare dedizione","q3":"Il bisogno di dimostrare: il team non mi aveva chiesto niente"}','Hai risposto alle 23 per dimostrare dedicazione a nessuno che te la chiedeva. Stai recitando per un pubblico immaginario.','2026-01-16','2026-01-16 23:30:00+00'),

(uid,'morning',5,'{"q2":"Chiunque riesca a dormire 8 ore senza sensi di colpa","q3":"Il riposo — ogni volta che mi fermo sento che sto perdendo terreno"}','Il riposo come perdita di terreno: questa è la credenza che alimenta il ciclo. Il terreno che pensi di perdere non esiste — esiste solo nella logica della competizione che hai dentro.','2026-01-19','2026-01-19 07:30:00+00'),
(uid,'evening',4,'{"q2":"Paura — ho preso una decisione importante esausto invece di aspettare lucidità","q3":"Il mio corpo: mal di testa da tre giorni, ignoro il segnale e continuo"}','Tre giorni di mal di testa, decisioni importanti da esaurimento. Il corpo sta parlando ad alto volume. Quando smetti di ignorarlo?','2026-01-19','2026-01-19 22:00:00+00'),

-- GEN 23-27: Burnout (2-4)
(uid,'morning',3,'{"q2":"Qualcuno che riesce ad alzarsi","q3":"Tutto. Il solo pensiero di aprire il laptop mi spaventa"}','Aprire il laptop fa paura: è il segnale che il sistema ha raggiunto il limite. Non stai fallendo — stai esaurendo una risorsa che non hai mai ricaricato.','2026-01-23','2026-01-23 09:15:00+00'),
(uid,'evening',3,'{"q2":"Paura — non ho preso nessuna decisione oggi. Paralisi totale.","q3":"Il mio schema: quando sono esausto mi paralizzo invece di rallentare intelligentemente"}','Paralisi invece di rallentamento intelligente: nel rallentamento scegli il ritmo, nella paralisi il ritmo ti sceglie. Domani: una sola cosa.','2026-01-23','2026-01-23 21:00:00+00'),

(uid,'morning',2,'{"q2":"Sopravvivere","q3":"Chiedere aiuto. Non riesco a farlo senza sentirmi un fallimento"}','Chiedere aiuto come fallimento: questa equazione è la radice del ciclo. Chi ti ha insegnato che il bisogno di supporto è debolezza?','2026-01-25','2026-01-25 10:00:00+00'),

-- GEN 29-31: Recupero (5-6)
(uid,'morning',5,'{"q2":"Il Marco che si rialza con più consapevolezza di prima","q3":"Non ripetere il ciclo — ma non so ancora come interromperlo"}','Non sai ancora come interromperlo, ma lo stai nominando. Nominare il pattern è il primo interruttore. Il secondo è agire diversamente prima del picco, non dopo il crollo.','2026-01-29','2026-01-29 08:30:00+00'),
(uid,'evening',6,'{"q2":"Visione — ho detto al co-founder che avevo bisogno di rallentare","q3":"La mia vergogna nel chiedere: l''ho fatto comunque"}','Hai chiesto nonostante la vergogna. Questo è il gap che cercavi: azione nonostante il disagio, non assenza del disagio.','2026-01-29','2026-01-29 21:15:00+00'),

(uid,'morning',6,'{"q2":"Qualcuno che entra in febbraio senza dover recuperare tutto subito","q3":"La fretta di tornare normale — voglio saltare il processo di recupero"}','Vuoi recuperare velocemente per saltare il recupero: è ancora il Performer Compulsivo, applicato al riposo. Il recupero non è un task da completare.','2026-01-31','2026-01-31 08:00:00+00'),

-- ══════════════════════════════════════════
-- CICLO 3: FEB 3–28
-- ══════════════════════════════════════════

-- FEB 3-7: Recupero/Rilancio (6-7)
(uid,'morning',7,'{"q2":"Qualcuno che costruisce con ritmo sostenibile invece che a scatti","q3":"La tendenza a compensare il burnout lavorando ancora di più"}','Compensare il burnout lavorando di più è la logica del debito portata al sistema nervoso. Non si ripaga lavorando — si ripaga riposando.','2026-02-03','2026-02-03 08:00:00+00'),
(uid,'evening',7,'{"q2":"Visione — ho fatto una passeggiata di 30 min senza telefono","q3":"La mia sorpresa: pensavo mi sarebbe crollato tutto. Non è successo niente."}','Trenta minuti senza telefono e il mondo è rimasto intero. Il dato più importante non è la passeggiata — è che la catastrofe immaginata non si è materializzata.','2026-02-03','2026-02-03 21:30:00+00'),

(uid,'morning',7,'{"q2":"Il Marco che sa dove vuole arrivare e non si spaventa della distanza","q3":"Il confronto con altri founder — mi destabilizza ogni volta"}','LinkedIn come destabilizzatore: stai usando lo specchio sbagliato. Il confronto è utile solo quando ti dice dove vuoi andare, non quanto sei indietro.','2026-02-06','2026-02-06 08:00:00+00'),

-- FEB 8-14: Alta energia ciclo 3 (7-9)
(uid,'morning',8,'{"q2":"Il fondatore che lavora dal suo centro invece che dalla sua paura","q3":"Il confronto con altri founder su LinkedIn — mi destabilizza ogni volta"}','Sei nel momento più lucido degli ultimi 30 giorni. Cosa vuoi costruire con questa chiarezza?','2026-02-08','2026-02-08 08:10:00+00'),
(uid,'evening',8,'{"q2":"Visione — ho ignorato tre notifiche di LinkedIn e lavorato in profondità per 4 ore","q3":"Il flow: quando entro in quel stato le idee migliori vengono naturalmente"}','Quattro ore di lavoro profondo e idee che arrivano naturalmente — questa è la tua zona di espansione. Non si forza: si crea la condizione e si aspetta.','2026-02-08','2026-02-08 21:45:00+00'),

(uid,'morning',9,'{"q2":"Il Marco che sa quando è in flow e lo protegge","q3":"Le interruzioni: il team mi scrive per cose che potrebbero aspettare"}','Le interruzioni continue del team: hai creato un sistema dove tutti si aspettano la tua risposta immediata. Hai modellato questa dipendenza. Puoi rimodellarla.','2026-02-10','2026-02-10 07:50:00+00'),
(uid,'evening',9,'{"q2":"Visione — ho messo 3 ore di deep work in calendario e non ho risposto a nessuno","q3":"La resistenza del team: qualcuno era scontento. Ho tenuto il confine lo stesso"}','Confine tenuto nonostante la resistenza — questo è nuovo per te. Il costo del disappunto altrui è il prezzo del tuo equilibrio a lungo termine.','2026-02-10','2026-02-10 21:30:00+00'),

(uid,'morning',8,'{"q2":"Qualcuno che celebra i progressi invece di minimizzarli","q3":"La mia incapacità di stare nel successo — arrivo a un traguardo e penso già al prossimo"}','Arrivi al traguardo e già guardi il prossimo: stai usando gli obiettivi come carote che si spostano. Quando ti fermi esattamente dove sei adesso?','2026-02-12','2026-02-12 08:00:00+00'),

-- FEB 15-21: Overwork → Burnout (3-6)
(uid,'morning',6,'{"q2":"Qualcuno che regge la pressione senza diventare il problema","q3":"La scadenza della campagna — sento la pressione e inizio a microgestire tutti"}','La pressione attiva il tuo pattern di controllo: microgestisci quando sei sotto stress. Il problema non è la scadenza — è che non ti fidi del team che hai costruito tu.','2026-02-15','2026-02-15 08:15:00+00'),
(uid,'evening',5,'{"q2":"Paura — ho riscritto il copy del mio copywriter perché non era quello che avrei scritto io","q3":"Il mio standard impossibile: richiedo perfezione agli altri che non richiedo a me stesso"}','Hai riscritto il lavoro del copywriter: non perché era sbagliato, ma perché non era tuo. C''è differenza tra standard alti e incapacità di delegare.','2026-02-15','2026-02-15 22:00:00+00'),

(uid,'morning',4,'{"q2":"Qualcuno che si ferma prima di arrivare al fondo","q3":"Riconoscere i segnali del burnout in anticipo invece che a posteriori"}','Stai riconoscendo i segnali mentre accadono — non dopo. Questo è il vero cambiamento rispetto ai cicli precedenti.','2026-02-18','2026-02-18 08:30:00+00'),
(uid,'evening',4,'{"q2":"Paura — ho lavorato fino alle 2 su qualcosa che poteva aspettare domani","q3":"Il terrore del giorno dopo: lavoro la notte per non svegliarmi con troppo da fare"}','Lavori la notte per svuotare il giorno dopo: stai rubando riposo al futuro per comprare ansia presente. Il conto arriva sempre.','2026-02-18','2026-02-18 23:55:00+00'),

(uid,'morning',3,'{"q2":"Qualcuno che non si odia per essere esausto","q3":"Il giudizio su me stesso: mi sto dicendo che sono debole"}','Ti stai dicendo che sei debole perché sei esausto. Saresti debole solo se non riconoscessi il pattern — invece lo stai nominando con precisione crescente.','2026-02-20','2026-02-20 09:00:00+00'),
(uid,'evening',3,'{"q2":"Paura — non ho preso decisioni. Ho rimandato tutto.","q3":"Il ciclo: mi rivedo esattamente dove ero a gennaio"}','Ti rivedi a gennaio: stessa struttura, ma con una differenza. A gennaio non sapevi dove eri. Adesso lo sai mentre ci sei dentro. È un passo reale, anche se non si sente così.','2026-02-20','2026-02-20 21:30:00+00'),

-- FEB 24-28: Recupero (6-7)
(uid,'morning',6,'{"q2":"Il Marco post-burnout che sceglie diversamente questa volta","q3":"La voglia di recuperare velocemente — saltare il processo di recupero"}','Vuoi recuperare velocemente per saltare il recupero: è ancora il Performer Compulsivo, applicato al riposo. Il recupero non è un task da completare.','2026-02-24','2026-02-24 08:00:00+00'),
(uid,'evening',7,'{"q2":"Visione — ho detto no a un meeting extra e sono andato a correre","q3":"La mia resistenza al riposo attivo: ho corso ma pensavo al lavoro per tutto il tempo"}','Corpo presente, mente al lavoro. Il movimento fisico senza presenza è ancora dissociazione. Prossima volta: cinque minuti in cui corpo e mente sono nello stesso posto.','2026-02-24','2026-02-24 21:00:00+00'),

(uid,'morning',7,'{"q2":"Qualcuno che sceglie la qualità del pensiero sulla quantità delle ore","q3":"L''abitudine al lavoro profondo — non riesco a proteggerla sistematicamente"}','Il lavoro profondo non si protegge con la forza di volontà — si struttura nell''agenda prima che arrivi tutto il resto. Quando lo metti in calendario?','2026-02-26','2026-02-26 08:15:00+00'),
(uid,'evening',7,'{"q2":"Visione — ho bloccato il mercoledì mattina per il deep work, irremovibile","q3":"Il mio ottimismo cauto: inizio a credere che il ciclo si possa interrompere"}','Mercoledì bloccato, ottimismo cauto. Non hai interrotto il ciclo — hai messo il primo mattone di una struttura diversa. È sufficiente per ora.','2026-02-26','2026-02-26 21:15:00+00'),

-- ══════════════════════════════════════════
-- MARZO 2026: Streak attuale (7-8)
-- ══════════════════════════════════════════

(uid,'morning',7,'{"q2":"Il fondatore che porta il team verso una visione, non via da una paura","q3":"Il meeting di strategia — ho paura di non avere tutte le risposte"}','Non avere tutte le risposte in un meeting di strategia non è debolezza — è onestà. Il tuo team si fida di te di più quando sei reale.','2026-03-01','2026-03-01 08:00:00+00'),
(uid,'evening',8,'{"q2":"Visione — ho facilitato il meeting invece di dominarlo, e sono emerse idee migliori delle mie","q3":"La mia sorpresa: quando ho smesso di avere tutte le risposte, gli altri ne hanno avute di più"}','Hai facilitato invece di dominare: idee migliori. Questa è la tua zona di espansione — leadership presente, non performativa.','2026-03-01','2026-03-01 21:30:00+00'),

(uid,'morning',8,'{"q2":"Qualcuno che è già quello che cerca di diventare, più spesso","q3":"Il confronto con me stesso di tre mesi fa — faccio fatica a vedere la distanza"}','Fai fatica a vedere la distanza da te stesso di tre mesi fa: rileggiti. Le risposte che dai oggi sono diverse. La lucidità è aumentata. Il ciclo si è accorciato.','2026-03-03','2026-03-03 07:55:00+00'),
(uid,'evening',8,'{"q2":"Visione — ho fatto una scelta difficile senza aspettare approvazione","q3":"La fiducia in me stesso: sta crescendo lentamente ma sta crescendo"}','Decisione difficile senza cercare approvazione: tre mesi fa avresti aspettato il feedback del mentor. Stai imparando a essere il tuo osservatore.','2026-03-03','2026-03-03 21:45:00+00'),

(uid,'morning',8,'{"q2":"Il Marco che costruisce un''azienda che assomiglia ai suoi valori","q3":"La cultura aziendale — non è ancora allineata con quello che voglio davvero"}','La cultura non è allineata con i tuoi valori: ma quale Marco stai chiedendo che lo sia? Il Marco del burnout o il Marco del mercoledì mattina bloccato?','2026-03-05','2026-03-05 08:10:00+00'),
(uid,'evening',8,'{"q2":"Visione — ho condiviso i miei dubbi con il team. Mi hanno sorpreso.","q3":"La mia vulnerabilità: ho condiviso dove sono incerto. La risposta mi ha sorpreso"}','Hai condiviso i dubbi e ti hanno sorpreso: la vulnerabilità autentica crea connessione reale. Non sei meno leader quando hai dubbi — sei più umano.','2026-03-05','2026-03-05 21:30:00+00'),

(uid,'morning',8,'{"q2":"Il fondatore presente, non il performer compulsivo","q3":"Questo check-in: essere onesto con me stesso invece di dare la risposta che suona bene"}','Stai facendo il check-in con onestà invece di performanza: questo è il cambiamento più sottile e più reale che si legge in 90 giorni di dati.','2026-03-07','2026-03-07 08:05:00+00'),
(uid,'evening',7,'{"q2":"Visione — ho chiuso il laptop alle 18:30 e non l''ho riaperto","q3":"La normalità del confine: stavo aspettando che mi pesasse. Non è pesato."}','Laptop chiuso alle 18:30, nessun peso. Il confine sta diventando chi sei, non quello che cerchi di fare.','2026-03-07','2026-03-07 21:00:00+00');

END $$;
