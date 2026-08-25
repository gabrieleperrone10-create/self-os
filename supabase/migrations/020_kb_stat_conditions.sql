-- ================================================================
-- KB — Condizioni e formule (modulo STAT)
--
-- Le formule di Hubbard riscritte in registro personale, preservando
-- l'unica cosa che nella dottrina non è negoziabile: la SEQUENZA. E il
-- correttivo esplicito alla deriva documentata della Data Series, dove
-- il "why finding" degenerava in caccia al colpevole — applicato a se
-- stessi diventa auto-colpevolizzazione, che non è una diagnosi.
--
-- Categoria 'stat_conditions': la legge solo la route stat-program,
-- via fetchStatContext() in lib/knowledge-base/fetch.ts.
-- ================================================================

INSERT INTO public.knowledge_base (category, archetype_id, title, content, tags) VALUES

('stat_conditions', NULL, 'Le condizioni e le loro formule',
$$Cos'è una condizione: la lettura dello stato di una produzione in un periodo, non un giudizio sulla persona. Sei condizioni, dalla peggiore alla migliore: Non-Existence (nessuna produzione), Danger (calo netto), Emergency (calo lieve, o fermo sotto il livello che ci si era dati), Normal (lieve miglioramento), Affluence (salita netta), Power (fascia alta mantenuta nel tempo).

Ogni condizione ha una formula, e i passi vanno in SEQUENZA ESATTA. L'ordine non è stile: è la formula. Invertire due passi la rende inefficace, ed è considerato l'errore più grave nell'applicazione.

NON-EXISTENCE — riprendi il contatto (cosa ti ha fatto smettere?), chiarisci in una frase perché questa cosa conta, fai la prossima unità più piccola possibile, registrala. In questa fase il dato conta più del risultato.

DANGER — fermati e gestisci di persona la causa, senza delegarla a "farò meglio la prossima volta". Trova la causa specifica di QUESTO calo, non una spiegazione generica. Prendi un'azione correttiva oggi, non alla prossima settimana. Cambia qualcosa nell'organizzazione dell'attività perché il calo non si ripeta uguale.

EMERGENCY — aumenta il volume dell'azione base prima di cambiare metodo. Se il volume da solo non basta, cambia il modo in cui la fai. Taglia il superfluo che ti distrae da questa priorità. Ripristina la disciplina minima non negoziabile.

NORMAL — non cambiare niente: quello che stai facendo funziona. Se migliora, scopri cosa l'ha migliorata e continua a farlo senza abbandonare il resto. Se peggiora anche di poco, scopri subito perché e rimedia prima che diventi un calo.

AFFLUENCE — economizza, non espandere tutto insieme solo perché va bene ora. Consolida ciò che ha già funzionato prima di aggiungere. Investi il surplus in ciò che rende ripetibile il risultato, non in una tantum. Scopri cosa ha causato l'affluence e rafforzalo deliberatamente.

POWER — non disconnetterti da ciò che ti ha portato qui: non cambiare metodo adesso. Scrivi in poche righe come si fa, cioè le condizioni che hanno reso possibile questo livello. È un altopiano da cui non vuoi scendere, non un picco da ammirare.$$,
ARRAY['stat','condizioni','formule']),

('stat_conditions', NULL, 'La regola cardinale e i modi di sbagliarla',
$$La regola cardinale: non applicare MAI la formula di una condizione in cui non sei. Trattare una Normal come un'Emergency produce iper-correzione — cambi ciò che stava funzionando. Trattare un'Affluence come una Normal produce mancato consolidamento — non capitalizzi ciò che ha funzionato e la salita si spegne.

L'errore più frequente nasce dal leggere un periodo solo. Una condizione si legge su due punti; la tendenza su molti. Quando le due letture divergono, la divergenza È l'informazione: un periodo storto dentro una tendenza in salita è una fluttuazione, non un'emergenza, e applicargli la formula di Danger è esattamente l'errore cardinale. Simmetricamente, un periodo buono dentro una tendenza in calo è un rimbalzo, non un recupero: non va festeggiato né consolidato.

MOTION VS PRODUCTION. Si può essere pieni di attività senza che il prodotto finale arrivi. Una statistica che misura movimento invece di produzione dà la sensazione di controllo e non predice nulla. Quando il risultato non si muove mentre tutti i livelli di attività sono in ordine, l'ipotesi giusta non è "serve più sforzo": è che qualcosa di rilevante non è misurato affatto, oppure che una delle stat sta contando motion.

QUANTITÀ PRIMA DEL METODO. Su lavoro che non è stato fatto non si valuta il metodo: una produzione ferma non ha un problema di metodo, ha un problema di produzione. Solo con il lavoro effettivamente svolto ha senso chiedersi se il modo in cui lo si fa funziona.$$,
ARRAY['stat','regola-cardinale','motion-production']),

('stat_conditions', NULL, 'Registro: diagnosi strutturale, mai colpa',
$$Nella pratica documentata dell'originale, lo strumento per risalire alla causa di una statistica in calo è degenerato in caccia al colpevole: trovare CHI tiene giù le stat. Applicato a se stessi, quel registro diventa auto-colpevolizzazione — "non ho disciplina" — che non è una diagnosi, non è azionabile, ed è spesso falsa: quando il lavoro risulta fatto, la costanza è precisamente ciò che i dati SCAGIONANO.

Come si scrive un programma, quindi. Si nomina un livello strutturale, mai un difetto di carattere. Si citano i numeri veri della persona, non formule generiche: "3 → 3 allenamenti, il carico fermo a 100kg da sei settimane" e non "stai facendo progressi altalenanti". Si dice cosa fare in questo periodo, in sequenza, e nient'altro.

Cosa non fare mai: nessun tono motivazionale, nessun incoraggiamento, nessuna congratulazione — la persuasione verbale è la fonte più debole di cambiamento e suona come cheerleading. Nessun consiglio mascherato da domanda ("hai considerato di...?"). Nessuna promessa di risultato. Nessun passo inventato che non sia nella formula della condizione assegnata, e nessun riordino della sequenza. Se i dati non bastano per dire qualcosa di specifico, dirlo è meglio che riempire lo spazio.$$,
ARRAY['stat','registro','epistemico']);
