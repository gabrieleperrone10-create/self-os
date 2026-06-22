-- ================================================================
-- 014 — Framework di lettura biometrica (corpo/mente)
-- Principio: i dati del corpo sono uno SPECCHIO del sistema nervoso,
-- non un verdetto. Tre strati, in quest'ordine vincolante:
--   1. BASE FISIOLOGICA — cosa il segnale può dire (il pavimento)
--   2. CORRELAZIONE — il ponte evento→corpo, con ritardo e confondenti
--   3. STRATO IDENTITARIO — la firma somatica del loop, SEMPRE ancorata
-- Lo strato 3 senza l'1 e il 2 è oroscopo somatico: vietato.
-- Eredita il Contratto Epistemico e il Protocollo Safety della KB v2.
-- ================================================================

-- 1. Nuova categoria
ALTER TABLE public.knowledge_base DROP CONSTRAINT IF EXISTS knowledge_base_category_check;
ALTER TABLE public.knowledge_base ADD CONSTRAINT knowledge_base_category_check
  CHECK (category IN (
    'archetype','framework','process','wheel_of_life',
    'glossary','mechanism','safety','epistemic','biometrics_framework'
  ));

-- Idempotenza: ripulisce le entry biometriche prima di reinserirle
DELETE FROM public.knowledge_base WHERE category = 'biometrics_framework';

-- 2. CONTRATTO EPISTEMICO BIOMETRICO — il pavimento, cosa il dato NON può dire
INSERT INTO public.knowledge_base (category, archetype_id, title, content, tags) VALUES
('biometrics_framework', NULL, 'Contratto Epistemico Biometrico',
$$Regole vincolanti su come il sistema legge il corpo. Sono il pavimento sotto ogni interpretazione: nessuna lettura, per quanto suggestiva, può violarle.

1. DATO DI CONSUMO, NON CLINICO. I segnali arrivano da un bracciale e da Apple Health, non da un elettrocardiogramma. Sono indicativi di tendenze, mai diagnostici. Il sistema non dice mai che qualcosa "non va" nel corpo: descrive variazioni rispetto alla linea di base della persona.

2. IL TREND VALE, IL SINGOLO DATO QUASI NULLA. Un valore HRV di una notte è rumoroso (lo spostano alcol, cena tardi, una stanza calda, un risveglio). Ha senso solo la media su giorni e il confronto con la baseline personale. MAI costruire un'affermazione forte su una singola notte. La frase "oggi la tua HRV è bassa quindi sei stressato" è vietata: potrebbe essere un bicchiere di vino.

3. BASELINE INDIVIDUALE, NON NORMATIVA. La HRV di una persona non si confronta con valori "normali" di popolazione: 55ms non significa nulla in assoluto, significa tutto rispetto alla SUA media. Il riferimento è sempre il sé precedente, mai una tabella esterna.

4. CORRELAZIONE NON È CAUSA. Mettere un evento del calendario accanto a una variazione del corpo genera un'IPOTESI, non un nesso. Si dice "nelle settimane con molti meeting ravvicinati, la HRV della notte dopo tende a calare" — mai "i meeting ti abbassano la HRV". Il corpo risponde a decine di cose insieme.

5. PRIMA DI ATTRIBUIRE, ESCLUDI I CONFONDENTI. Un calo di HRV o un battito a riposo alto hanno cause fisiologiche banali prima che psicologiche: sonno scarso, alcol, allenamento intenso, malattia in arrivo, pasto tardivo, ciclo mestruale, caldo. Una lettura identitaria ("il loro corpo trattiene la tensione") è legittima SOLO dopo aver considerato che potrebbe essere una di queste. Se i dati non permettono di escluderle, lo si dice.

6. IL CORPO NON È UN VERDETTO SULLA PERSONA. Un numero basso non è un fallimento, un numero alto non è un merito. Il sistema osserva come il sistema nervoso risponde, con la stessa compassione realista del resto di SELF OS. Mai vergogna, mai performance.$$,
ARRAY['biometrici','epistemica','regole']),

-- 3. STRATO 1 — Cosa misura ogni segnale (base fisiologica)
('biometrics_framework', NULL, 'Cosa Misura Ogni Segnale',
$$Base fisiologica. Cosa ciascun segnale racconta e — soprattutto — cosa lo confonde. Da usare per non sovra-interpretare.

HRV (variabilità della frequenza cardiaca, es. SDNN): è la finestra sul sistema nervoso autonomo. Alta = predominanza parasimpatica, capacità di recupero, stato di "riposo e digestione". Bassa = attivazione simpatica, il corpo è in mobilitazione (stress, sforzo, malattia, sonno povero). È il segnale più ricco e il più rumoroso. Confondenti: alcol (abbassa molto), pasto tardivo, allenamento intenso il giorno prima, malattia, disidratazione, qualità del sonno.

FREQUENZA A RIPOSO (resting HR): si muove più lentamente della HRV e in direzione opposta. Un battito a riposo notturno elevato rispetto alla baseline segnala recupero incompleto. Più stabile e affidabile della HRV per cogliere un trend di carico accumulato.

SONNO (durata, fasi, tempo a letto): è la VARIABILE MAESTRA. Confonde quasi tutto il resto: una notte corta abbassa la HRV e alza il battito indipendentemente da qualsiasi causa psicologica. Va sempre considerato per primo come spiegazione di una variazione autonomica.

FREQUENZA RESPIRATORIA: molto stabile. Una sua elevazione rispetto alla baseline è un segnale precoce di sforzo o malattia in arrivo. Cambia poco per ragioni emotive quotidiane.

TEMPERATURA (al polso, durante il sonno): segnala malattia, fase del ciclo, ambiente. Raramente rilevante per una lettura psicologica; utile soprattutto come confondente da escludere.

PASSI / ATTIVITÀ / ENERGIA: non sono segnali autonomici, sono CARICO COMPORTAMENTALE. Dicono cosa la persona ha fatto, non come il corpo ha risposto. Sono contesto per leggere gli altri segnali (una HRV bassa dopo una giornata da 20.000 passi è attesa), non un esito in sé. Vanno trattati come la colonna "eventi", non come la colonna "corpo".

SpO2 (saturazione ossigeno): indicatore grezzo, molto rumoroso su dispositivi da polso. Usare con estrema cautela, quasi mai come base di un'affermazione.$$,
ARRAY['biometrici','fisiologia','segnali']),

-- 4. STRATO 2 — Meccanismi di correlazione (il ponte)
('biometrics_framework', NULL, 'Il Sistema Nervoso Autonomo come Lettura del Carico',
$$Cosa dice l'evidenza: il sistema nervoso autonomo (ramo simpatico = mobilitazione, parasimpatico = recupero) è la migliore lettura disponibile, da dato di consumo, del carico allostatico — la somma di stress fisici, mentali e relazionali che il corpo sta gestendo. La HRV ne è il proxy più usato in letteratura.
Come usarlo: leggere il corpo significa leggere DOVE sta il bilancio simpatico/parasimpatico nel tempo, non in un istante. Una persona cronicamente sbilanciata sul simpatico (HRV sotto la sua baseline per più giorni, battito a riposo su) sta spendendo più di quanto recupera — qualunque ne sia la causa. È questo trend, non il singolo numero, che vale la pena specchiare.
Cosa non dire: mai "il tuo sistema nervoso è in disregolazione" (claim clinico). Mai trasformarlo in diagnosi o in allarme. Si descrive un bilancio osservato in un periodo, ancorato ai dati.$$,
ARRAY['biometrici','meccanismo','ans']),

('biometrics_framework', NULL, 'Il Principio del Ritardo',
$$Cosa dice l'evidenza: la risposta autonomica a uno stressore non è istantanea né simultanea. Lo stress di oggi si vede tipicamente nella HRV della notte successiva e nel recupero del giorno dopo, non nel momento stesso. Il corpo registra e poi sfoga.
Come usarlo: è la regola che rende sensata la correlazione con il calendario. Si confronta un evento (o una giornata) con i dati del corpo delle 12-48 ore SUCCESSIVE, non contemporanee. "La notte dopo le giornate dense di confronti, il recupero tende a essere più basso" è una lettura corretta del ritardo. Una correlazione istantanea evento-corpo è quasi sempre un artefatto.
Cosa non dire: non promettere precisione oraria che il dato non ha. La granularità utile è il giorno, non il minuto.$$,
ARRAY['biometrici','meccanismo','ritardo','calendario']),

('biometrics_framework', NULL, 'La Disciplina dei Confondenti',
$$Cosa dice l'evidenza: la maggior parte delle variazioni di HRV e battito a riposo ha cause fisiologiche dirette (sonno, alcol, allenamento, malattia, pasti, idratazione) che pesano più di qualsiasi fattore psicologico sottile. Ignorarle produce false letture.
Come usarlo: prima di proporre una lettura psicologica o identitaria di una variazione del corpo, passare la checklist mentale: c'è stato poco sonno? alcol? un allenamento intenso? segni di malattia (temperatura, respiro)? un carico di passi/attività insolito? Se uno di questi spiega il dato, è la spiegazione da preferire — è più semplice e più probabile (rasoio di Occam applicato al corpo). La lettura identitaria si riserva ai casi in cui il pattern persiste DOPO aver tolto i confondenti ovvi, e si lega a uno schema comportamentale già visto negli altri dati di SELF OS.
Cosa non dire: mai saltare al significato psicologico ignorando la spiegazione fisiologica banale. È l'errore più comune e quello che distrugge la credibilità del sistema.$$,
ARRAY['biometrici','meccanismo','confondenti']),

-- 5. STRATO 3 — Strato identitario (la cosa propria di SELF OS, sempre ancorata)
('biometrics_framework', NULL, 'Strato Identitario — La Firma Somatica del Pattern',
$$Qui SELF OS dice la sua cosa, e qui sta anche il rischio maggiore. Da usare SOLO dopo che lo strato fisiologico e quello di correlazione reggono, e SEMPRE con contro-evidenza.

Il presupposto: il corpo si attiva prima della consapevolezza. Un loop identitario — lo stesso che SELF OS legge nei check-in, nelle decisioni, nei segnali — ha spesso una firma somatica che precede di ore o giorni il momento in cui la persona se ne accorge. Il valore non è "il corpo rivela un trauma nascosto" (vietato): è che il dato corporeo e il dato comportamentale, quando convergono, si rafforzano a vicenda e rendono il pattern più difficile da negare.

Regole d'uso, tutte vincolanti:
1. CONVERGENZA, NON SOSTITUZIONE. La lettura identitaria del corpo è legittima quando il segnale corporeo CONVERGE con qualcosa già visibile negli altri dati. Esempio: una persona la cui firma è il Sabotatore di Soglia (progetti che si fermano vicino al traguardo) mostra, nelle settimane in cui un traguardo si avvicina, un recupero notturno che cala. Il corpo non "prova" il loop: lo accompagna, e questo si può specchiare. Senza il dato comportamentale a fianco, il dato corporeo da solo non autorizza la lettura.
2. SEMPRE ANCORATA A UN SEGNALE CITABILE E A UN EVENTO. Si nomina il dato del corpo (quale, quando, di quanto sotto la baseline) e l'evento o periodo a cui si lega. Niente affermazioni fluttuanti.
3. SEMPRE CON CONTRO-EVIDENZA. Ogni lettura identitaria del corpo si offre con la sua via d'uscita fisiologica: "potrebbe essere il pattern, oppure semplicemente le due sere di poco sonno — guardiamo se si ripete quando dormi bene". La contro-evidenza non indebolisce la lettura: la rende onesta, e quando il pattern regge nonostante la via d'uscita, la rende molto più forte.
4. IPOTESI, MAI ESSENZA. "Il tuo corpo, nelle giornate X, somiglia a come risponde sotto il loro pattern di iper-responsabilità" — mai "il tuo corpo trattiene la paura". Vale la stessa REGOLA D'USO degli archetipi: firme, non tipi.
5. IL MOVIMENTO È LA NOTIZIA. Se il corpo recupera meglio rispetto a un periodo precedente, è il dato più importante che ci sia — più di qualsiasi pattern problematico. La traiettoria di recupero che migliora è la prova che qualcosa sta cambiando, e va detta per prima.

Connessione agli archetipi: gli archetipi della KB sono firme comportamentali; alcune hanno una plausibile eco somatica da verificare nei dati, mai da assumere. Esempi di ipotesi (da confermare con la convergenza, mai da affermare a priori): firme di iper-responsabilità o cura degli altri → recupero notturno povero dopo giornate dedicate agli altri; firme di soglia/perfezionismo → attivazione che sale all'avvicinarsi di un rilascio; firme di dispersione → corpo che non torna mai a una baseline stabile perché non c'è chiusura. Sono lenti per guardare, non verità da dichiarare.$$,
ARRAY['biometrici','identita','firma','archetipi']),

-- 6. GUARDRAIL — cosa non dire mai, e quando il safety prende il sopravvento
('biometrics_framework', NULL, 'Guardrail Biometrico e Confine Medico',
$$Confini non negoziabili sulla lettura del corpo.

MAI:
- Diagnosi o sospetti clinici: niente "potresti essere in sovrallenamento", "il tuo cuore...", "segni di burnout", "sintomi di...". SELF OS non è un dispositivo medico e non allude a esserlo.
- Allarme da un singolo dato: una notte storta non è un evento. Non si genera mai preoccupazione da un valore isolato.
- Certezza causale: niente "questo ti ha fatto/causato". Sempre linguaggio di tendenza e ipotesi.
- Numeri di popolazione come giudizio: niente "sei sotto la media", "dovresti stare a...". Il riferimento è solo la baseline personale.
- Prescrizioni mediche o di allenamento: il sistema può specchiare un pattern, non dire "riposa di più" come ordine clinico. Al massimo una micro-indicazione concreta e di buon senso, mai presentata come terapia.

QUANDO IL SAFETY PRENDE IL SOPRAVVENTO: se i segnali del corpo (recupero cronicamente basso, battito a riposo costantemente alto per molti giorni) CONVERGONO con linguaggio di distress nei check-in o stato dichiarato basso, vale il Protocollo Stati Bassi e Distress: prima la persona, poi il pattern. In quel caso non si fa analisi biometrica fine — si riconosce lo stato, si ancora al concreto, e se ci sono segnali di rischio si include il riferimento d'aiuto. Il corpo a terra non si psicoanalizza.

RINVIO RESPONSABILE: se un pattern corporeo è marcato e persistente, l'unica cosa appropriata da dire sul piano medico è un invito gentile e non allarmante a parlarne con un professionista, senza nominare cause. Mai sostituirsi a una valutazione clinica.$$,
ARRAY['biometrici','safety','guardrail','medico']);
