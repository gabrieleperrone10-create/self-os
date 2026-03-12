-- ================================================================
-- SELF OS — Demo Scan Seed v2.0
-- Persona: Marco Ferretti, 32 anni, coach & imprenditore
-- Archetipo primario: S1 Sabotatore di Soglia
-- Archetipo secondario: S6 Guerriero Solo
-- Archetipo terziario: S9 Giudice Interiore
-- ================================================================

DO $$
DECLARE
  uid UUID := 'dec0de00-0000-4000-8000-000000000001';
BEGIN

-- Rimuovi scan esistenti per questo utente
DELETE FROM public.scans WHERE user_id = uid;

INSERT INTO public.scans (user_id, answers, analysis, completed_at)
VALUES (
  uid,

  -- ── 150 RISPOSTE ────────────────────────────────────────────────
  $answers${
    "D1": 6,
    "D2": "Vado bene per un periodo poi mollo tutto — cicli di disciplina e abbandono",
    "D3": "ambivalente — lo uso come strumento, raramente come casa",
    "D4": 5,
    "D5": "Mi avvicino poi inconsapevolmente trovo un motivo per allontanarmi",
    "D6": ["Non ti apri mai davvero", "Fai sempre di testa tua", "Non ti fidi mai completamente"],
    "D7": 6,
    "D8": "Una fonte di conflitto o stress costante",
    "D9": 4,
    "D10": 6,
    "D11": "Arrivo vicino a qualcosa di grande poi qualcosa va storto",
    "D12": "la paura che sia finalmente abbastanza buono per fallire davvero",
    "D13": 5,
    "D14": "Eccitazione ma anche paura che finisca",
    "D15": "Investo in nuovi progetti — spesso troppi contemporaneamente",
    "D16": 7,
    "D17": "Leggo e studio molto ma faccio fatica ad applicare e integrare",
    "D18": "Lavorare meno e con più focus. Ho 12 corsi incompiuti sul computer.",
    "D19": 3,
    "D20": "Ansioso — ho bisogno di fare qualcosa di utile",
    "D21": "Avevo una passione creativa che ho abbandonato nel tempo",
    "D22": 8,
    "D23": "Una visione potente ma frustrazione perché non si realizza abbastanza",
    "D24": "aiutare gli imprenditori a smettere di sabotarsi e costruire qualcosa di reale",
    "D25": ["Trovo mille cose da sistemare prima — non è mai il momento giusto", "Sono iperproduttivo ma su cose secondarie e irrilevanti"],
    "D26": "Dico sì anche se non voglio — e poi me ne pento",
    "D27": "Sollievo momentaneo, poi immediatamente al prossimo traguardo",
    "D28": "Lo faccio io stesso per essere sicuro del risultato finale",
    "D29": "Fuori concordo, dentro mi distruggo",
    "D30": "Arrivo al 90% di un progetto e poi qualcosa si rompe — un collaboratore se ne va, un cliente importante sparisce, io creo un conflitto. È successo con la prima startup nel 2019, con l'agenzia nel 2021, con il programma di coaching nel 2023. Stesso schema, contesti diversi.",
    "D31": "Qualcosa va storto proprio quando ero più vicino",
    "D32": "Mi autocritico duramente per un po' poi riesco a passare oltre",
    "D33": 8,
    "D34": ["Lavoro di più e più duramente anche quando non serve", "Cerco di controllare ogni dettaglio di ciò che posso"],
    "D35": "Non è mai il momento giusto — c'è sempre qualcosa da sistemare prima",
    "D36": "Lo delego ma poi controllo comunque — non riesco a lasciar andare",
    "D37": "Cerco immediatamente di risolvere il problema — non reggo vederli soffrire",
    "D38": 5,
    "D39": 7,
    "D40": "Da cosa mi fa sentire più sicuro e al riparo dal rischio",
    "D41": "Prima cerco di mediare, poi accumulo tensione per settimane. Quando esplodo, lo faccio nel modo sbagliato, al momento sbagliato. Poi mi vergogno dell'esplosione e mi scuso troppo.",
    "D42": 2,
    "D43": 4,
    "D44": "Cerco di soddisfarle anche a mie spese — non riesco a deludere",
    "D45": "Quasi nulla — non ho tempo o mi sento in colpa",
    "D46": "perdere l'identità che ho costruito — scoprire che senza il lavoro non sono nessuno",
    "D47": "Arrivo all'80% poi perdo interesse o slancio",
    "D48": 4,
    "D49": "Ho continuato una partnership di business per 8 mesi sapendo che non funzionava. Perché avevo paura di dire la verità e perdere la relazione. Ho perso entrambe le cose.",
    "D50": 7,
    "D51": "Mi entusiasmo immediatamente e voglio iniziare subito",
    "D52": 6,
    "D53": 4,
    "D54": "Le creo per gli altri ma fatico a seguirle io stesso",
    "D55": 5,
    "D56": "licenziare i clienti sbagliati e costruire solo il programma che mi entusiasma davvero",
    "D57": "Cerco subito una soluzione senza elaborare cosa è successo",
    "D58": 6,
    "D59": "Di pancia, velocemente, poi cerco conferme. Se le trovo, procedo. Se non le trovo, procedo lo stesso ma con ansia. Non ho mai capito bene se decido o se reagisco.",
    "D60": "permettersi di rallentare",
    "D61": "avere libertà di tempo, non dover dimostrare nulla a nessuno",
    "D62": "necessari ma pericolosi — non si sa mai per quanto tempo restano",
    "D63": "ciò che guadagno, non di più",
    "D64": "esposizione al giudizio — l'altra persona vede dove sei rotto",
    "D65": "ammettere che non sei autosufficiente — una forma di fallimento",
    "D66": "avevo ragione a non fidarmi di me stesso",
    "D67": "persone che hanno smesso di avere dubbi, oppure molto brave a nasconderli",
    "D68": "essere utile, essere forte, non essere un peso",
    "D69": "un lusso che non mi posso permettere adesso — dopo, quando avrò finito",
    "D70": 5,
    "D71": 5,
    "D72": 4,
    "D73": 4,
    "D74": 3,
    "D75": 4,
    "D76": 4,
    "D77": 3,
    "D78": 4,
    "D79": 3,
    "D80": 3,
    "D81": "quanto spesso mi paralizzo quando le cose stanno andando bene — e non riesco a dirlo a nessuno",
    "D82": "riposarmi davvero senza sentirmi in colpa",
    "D83": "mio padre — che ha costruito tanto e non ha mai goduto di niente, poi ha perso tutto",
    "D84": "Non devo guadagnarmi il diritto di esistere ogni giorno",
    "D85": "In competizione — dovevo sempre dimostrare il mio valore",
    "D86": "Si nascondevano — non si fa vedere la debolezza",
    "D87": "Rigido — le regole erano legge, non si discuteva",
    "D88": "Scarsità — i soldi non bastano mai, bisogna stare attenti",
    "D89": "Relativizzato — non esagerare, non montarti la testa",
    "D90": "A 14 anni mio padre perse l'azienda. In pochi mesi passammo dall'agio al dover vendere la casa. Non ne parlò mai. Imparai che il successo è fragile e che gli uomini non mostrano quando hanno paura.",
    "D91": "Un uomo è forte, non chiede aiuto, risolve i problemi da solo. Il pianto è debolezza. Il lavoro è identità. Se non lavori, non conti.",
    "D92": 4,
    "D93": 5,
    "D94": 4,
    "D95": 3,
    "D96": "Diventare mio padre — che ha dato tutto al lavoro e ha perso tutto. Mi sto avvicinando nel pattern con i soldi: guadagno, non risparmio, dipendo dal prossimo lancio.",
    "D97": 3,
    "D98": "Curioso, un po' solo, molto creativo. Leggevo tantissimo. Cercavo sempre di capire come funzionavano le persone. Non mi sentivo mai completamente nel gruppo — come se ci fosse sempre un vetro tra me e gli altri.",
    "D99": "Smettila di correre. Sei già abbastanza. Le persone ti amano anche quando non produci niente.",
    "D100": 7,
    "D101": 4,
    "D102": 3,
    "D103": "essere forte, essere utile, non dare problemi",
    "D104": "non essere abbastanza — che alla fine le persone scoprano che sotto c'è poco",
    "D105": ["Libertà", "Successo e realizzazione", "Crescita e evoluzione", "Contributo e impatto", "Amore e connessione", "Salute e vitalità", "Sicurezza", "Piacere e divertimento"],
    "D106": "Salute e vitalità",
    "D107": "non dover spiegare a nessuno perché faccio quello che faccio — e avere risorse per farlo senza ansia",
    "D108": 4,
    "D109": 8,
    "D110": 4,
    "D111": "costruire il programma di coaching che ho nella testa da 3 anni ma non ho mai lanciato completamente",
    "D112": 5,
    "D113": "il modo in cui gestisco i soldi — la volatilità finanziaria mi tiene in uno stato di allerta permanente",
    "D114": 6,
    "D115": "le urgenze che creo io stesso rimandando decisioni importanti",
    "D116": 4,
    "D117": "Prevalentemente successo esterno",
    "D118": "costruire qualcosa che sopravviva a me",
    "D119": 3,
    "D120": "quando sono in sessione di coaching con qualcuno e vedo il momento in cui qualcosa si apre. E quando scrivo — quando le parole arrivano da sole senza che le cerchi.",
    "D121": "il networking forzato. Le calls senza scopo. Gestire l'operativo quando so già come andrà. Spiegare me stesso a persone che non vogliono capire.",
    "D122": "Viktor Frankl — perché ha trovato significato dove non c'era niente, e lo ha condiviso senza pietismo",
    "D123": 4,
    "D124": "un centro residenziale dove gli imprenditori vengono per 30 giorni a lavorare sull'identità, non sulle strategie",
    "D125": "Un uomo che ha costruito un business solido con un team autonomo. Non è più l'unico load-bearing wall. Lavora 4 giorni a settimana, ha tempo per leggere e scrivere, non controlla il telefono ogni 10 minuti. È calmo — non la calma di chi ha smesso di ambire, ma quella di chi sa dove sta andando.",
    "D126": "Si ferma. Respira. Chiede cosa sta succedendo davvero prima di agire. Non risolve immediatamente — crea spazio. La soluzione arriva da quello spazio.",
    "D127": "Ha un buffer di 6 mesi di spese fisso che non tocca. Investe una percentuale fissa del ricavo prima di spendere il resto. Non prende decisioni finanziarie quando è in uno stato di eccitazione o paura.",
    "D128": "Dorme 7-8 ore. Fa movimento perché gli piace, non perché deve. Si prende un giorno a settimana senza lavoro — un vero giorno.",
    "D129": "Dice la verità prima che accumuli. Non sparisce quando le cose si fanno intense. Sa stare nel disagio di una conversazione difficile senza risolverla artificialmente.",
    "D130": "Finalmente ti sei fermato abbastanza a lungo da capire che correre non era la risposta. Ti ci è voluto del tempo. Valeva la pena aspettare.",
    "D131": "Credere che il mio valore non dipenda dalla mia produttività. Credere che merito il successo anche prima di averlo dimostrato oggi.",
    "D132": "Sono abbastanza anche oggi — non solo quando produco qualcosa di eccezionale.",
    "D133": "Il Costruttore Presente",
    "D134": "smettere di rimandare il lancio del programma flagship — ha tutto, gli manca solo il coraggio di dichiararlo finito",
    "D135": "controllare ogni deliverable del team. Accettare progetti che non lo entusiasmano. Giustificarsi per le sue scelte con persone che non hanno chiesto spiegazioni.",
    "D136": "Finanze & Abbondanza",
    "D137": 4,
    "D138": "la convinzione che il successo duraturo non sia per me — come se ci fosse un tetto invisibile. E il fatto che non abbia mai risolto il pattern con i soldi.",
    "D139": 8,
    "D140": 5,
    "D141": "un lancio che ho posticipato 3 volte — ogni volta trovo un motivo diverso. So che il motivo vero è che se lo lancio e funziona, non avrò più scuse.",
    "D142": "le sessioni di coaching profondo con i clienti giusti. E le mattine quando scrivo prima che inizi il rumore del giorno.",
    "D143": 6,
    "D144": 5,
    "D145": 4,
    "D146": "se chiudere o continuare una partnership di business che funziona finanziariamente ma mi costa energie che non ho. So già la risposta.",
    "D147": 4,
    "D148": 5,
    "D149": "che mi mostri i pattern che non riesco a vedere da solo. Non voglio un altro strumento di produttività. Voglio capire perché ogni volta che arrivo vicino a qualcosa di importante, trovo un modo per non arrivarci.",
    "D150": "Ho già fatto 2 anni di terapia. Conosco i concetti. Il mio problema non è la comprensione — è la distanza tra ciò che capisco e ciò che poi faccio davvero."
  }$answers$::jsonb,

  -- ── REPORT IDENTITARIO (ScanReport format) ──────────────────────
  $analysis${
    "archetype_primary": {
      "id": "S1",
      "title": "Sabotatore di Soglia",
      "score": 82,
      "description": "Arrivi al 90% — con la prima startup nel 2019, con l'agenzia nel 2021, con il programma nel 2023. Ogni volta lo stesso schema: qualcosa si rompe proprio quando eri più vicino. Non è sfortuna. È un sistema di protezione che si attiva esattamente quando il successo diventa reale e duraturo, perché il successo duraturo porta responsabilità che senti di non poter sostenere."
    },
    "archetype_secondary": {
      "id": "S6",
      "title": "Guerriero Solo",
      "score": 71,
      "description": "Fai tutto da solo perché è più sicuro. Deleghi ma poi controlli comunque. Il tuo team potrebbe essere più autonomo, ma tu non riesci a togliere la mano. Questo ti tiene esausto, ti impedisce di costruire qualcosa che sopravviva a te — che è esattamente quello che vuoi costruire."
    },
    "archetype_tertiary": {
      "id": "S9",
      "title": "Giudice Interiore",
      "score": 58,
      "description": "Quando ottieni un risultato: sollievo momentaneo, poi subito al prossimo. Quando qualcosa va male: fuori concordi, dentro ti distruggi. La voce che dice che non sarà mai abbastanza ha uno score di 5/5. Questa non è ambizione — è una sorveglianza continua che non ti lascia mai riposare."
    },
    "spiral_level": "Arancione",
    "spiral_description": "Operi dal livello Arancione — achievement, performance, successo come identità — e senti la tensione verso il Verde, dove il valore non dipende dai risultati.",
    "loop_primary": {
      "area": "Business & Carriera",
      "trigger": "Il progetto raggiunge il 90% — sta per diventare reale, visibile, permanente",
      "thought": "'Non è ancora pronto. C'è qualcosa da sistemare prima. Quando sarà perfetto lo lancio.'",
      "behavior": "Rimandi il lancio tre volte con motivi sempre diversi. Crei un problema dove non c'era. Sei iperproduttivo su dettagli secondari mentre l'essenziale aspetta.",
      "result": "Il progetto si perde, si ridimensiona, o viene abbandonato appena prima della soglia. Ricominci da capo in un altro contesto.",
      "reinforcement": "'Non era ancora il momento giusto. La prossima volta sarà diverso.'"
    },
    "loop_secondary": {
      "area": "Finanze & Abbondanza",
      "trigger": "Periodo di guadagno buono — le risorse ci sono, la tensione dovrebbe diminuire",
      "thought": "'Adesso posso investire in questo progetto nuovo. E anche in quest'altro.'",
      "behavior": "Investi in troppi progetti contemporaneamente. Non costruisci mai un buffer stabile. Dipendi strutturalmente dal prossimo lancio per coprire le spese.",
      "result": "Il ciclo si resetta — torni al punto di partenza finanziario nonostante i guadagni. Come tuo padre.",
      "reinforcement": "'I soldi non si sa mai quanto durano. Meglio usarli per costruire qualcosa.'"
    },
    "loop_tertiary": {
      "area": "Relazioni & Team",
      "trigger": "Qualcuno del team fa qualcosa in modo diverso da come lo faresti tu",
      "thought": "'Se lo lascio fare così andrà male. È più veloce farlo io. Non posso permettermi errori.'",
      "behavior": "Controlli ogni deliverable. Fai tu invece di insegnare. Il team non cresce perché non gli lasci spazio.",
      "result": "Rimani l'unico load-bearing wall — esausto, indispensabile, impossibilitato a scalare.",
      "reinforcement": "'Se non ci fossi io, tutto cadrebbe. Meglio così.'"
    },
    "belief_limiting_primary": {
      "text": "'Il successo duraturo non è per me — c'è un tetto invisibile e ogni volta che mi avvicino vengo spinto indietro.'",
      "origin": "A 14 anni hai visto tuo padre perdere tutto nel silenzio. Hai imparato che il successo è fragile e che gli uomini non mostrano quando hanno paura. Hai costruito un sistema per non arrivare mai abbastanza in alto da poter cadere come lui."
    },
    "belief_limiting_secondary": {
      "text": "'Il mio valore dipende da ciò che produco — se mi fermo, non esisto.'",
      "origin": "In famiglia le emozioni si nascondevano e il lavoro era identità. 'Non dare problemi' è diventato 'non esistere senza produrre'. Prendersi cura di sé è ancora un lusso che ti concederai dopo."
    },
    "belief_resource": {
      "text": "'Vedo ciò che gli altri non vedono ancora — e so come aiutarli ad aprirsi.'"
    },
    "wheel_expansion": ["Contributo & Scopo", "Crescita Personale"],
    "wheel_loops": ["Finanze & Abbondanza", "Business & Carriera", "Salute & Corpo"],
    "wheel_priority": {
      "area": "Finanze & Abbondanza",
      "reason": "La volatilità finanziaria tiene tutto il resto in uno stato di allerta permanente — è il substrato su cui si costruisce o si demolisce ogni altro cambiamento."
    },
    "identity_target": {
      "name": "Il Costruttore Presente",
      "shift_from": "Imprenditore che guadagna ogni giorno il diritto di esistere attraverso i risultati — e sabota il successo quando diventa reale",
      "shift_to": "Leader che costruisce da un'identità stabile, non da una paura di non essere abbastanza — e lascia che le cose rimangano",
      "first_action": "Dichiarare il programma flagship finito entro 7 giorni e aprire le iscrizioni — senza un'altra modifica, senza un altro motivo per aspettare"
    },
    "letter": "Quello che emerge da tutto ciò che hai condiviso è questo: sei un uomo che ha costruito una comprensione profonda di se stesso — due anni di terapia, 150 domande, una chiarezza rara — e continua comunque a fermarsi al 90%. Non perché non sai. Ma perché sapere e fare sono due cose distinte, e il tuo sistema ha imparato a usare la comprensione come un altro modo per non arrivare. Hai scritto che la versione più evoluta di te ti direbbe: 'Finalmente ti sei fermato abbastanza a lungo da capire che correre non era la risposta.' Quella versione ti sta aspettando dall'altra parte di un lancio che hai già pronto. La domanda che questo sistema ti restituisce non è come smettere di sabotarti — ma cosa succederebbe, concretamente, se permettessi a questo di rimanere?"
  }$analysis$::jsonb,

  NOW() - INTERVAL '1 day'
);

-- Assicurati che onboarding sia completato
UPDATE public.profiles
SET onboarding_completed = true, updated_at = NOW()
WHERE id = uid;

END $$;
