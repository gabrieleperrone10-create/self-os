-- ================================================================
-- SELF OS — Demo Decisions + Patterns + Reports + Letters
-- Esegui DOPO demo-checkins.sql
-- ================================================================

DO $$
DECLARE
  uid UUID := 'dec0de00-0000-4000-8000-000000000001';
BEGIN

-- ─── Decisions (Mirror) ─────────────────────────────────────────
INSERT INTO public.decisions (user_id, description, state_score, origin, ai_mirror, outcome, outcome_date, created_at) VALUES

(uid,
 'Assumere un head of sales esterno vs fare io stesso le vendite per altri 3 mesi',
 8, 'vision',
 'Le ultime volte che hai deciso in stato 8+ hai scelto da espansione — e i risultati ti hanno sorpreso positivamente. Il pattern che emerge: quando deleghi da visione, liberi energia per quello in cui sei davvero unico. La domanda che resta: cosa temi perderesti se qualcun altro portasse quelle conversazioni con i clienti?',
 'Ho assunto Sara come head of sales. I primi 30 giorni sono stati difficili — dovevo lasciarla sbagliare senza intervenire. Ora sta chiudendo deal che io non avrei mai chiuso nel mio stile.',
 '2026-01-28',
 '2025-12-12 10:30:00+00'),

(uid,
 'Pivotare la feature principale in risposta a 3 richieste clienti, oppure restare fedele alla roadmap originale',
 5, 'fear',
 'Stai decidendo in stato 5/10 da paura: i tuoi dati mostrano che le decisioni in questo contesto sono quelle che hai poi rimpianto. Le ultime volte che hai pivotato per pressione esterna hai descritto il risultato come "ho perso il filo di quello che stavamo costruendo". Cosa ti dice il tuo stato di oggi su questa scelta?',
 NULL, NULL,
 '2025-12-19 14:00:00+00'),

(uid,
 'Partecipare a una conferenza internazionale (3 giorni fuori) mentre il team è in crisi operativa',
 4, 'fear',
 'Stato 4/10, origine paura: stai considerando di andare via mentre percepisci una crisi. Il pattern dai tuoi check-in: in stato basso, la fuga verso l''esterno sembra soluzione ma accelera il senso di distanza dal tuo centro. La domanda che conta: da cosa stai cercando di allontanarti?',
 'Non sono andato. Ho usato quei 3 giorni per conversazioni individuali con ogni membro del team. Era quello che serviva davvero.',
 '2026-02-01',
 '2026-01-20 09:00:00+00'),

(uid,
 'Accettare un round seed da un investitore che non mi convince al 100% ma offre buone condizioni economiche',
 6, 'fear',
 'Stato 6/10, origine paura. La tua storia decisionale mostra un pattern: le decisioni prese per non perdere un''opportunità raramente ti hanno portato dove volevi. "Non mi convince al 100%" merita attenzione — cosa esattamente non ti convince? La risposta a quella domanda è più importante della decisione stessa.',
 'Ho declinato. Due settimane dopo ho incontrato un investitore con cui mi sono sentito completamente allineato. Ho alzato la soglia.',
 '2026-02-20',
 '2026-01-27 11:00:00+00'),

(uid,
 'Licenziare un dev che lavora bene tecnicamente ma avvelena la cultura del team',
 7, 'vision',
 'Stato 7/10, visione: stai decidendo con relativa chiarezza su qualcosa che coinvolge sia performance che cultura. Il tuo profilo mostra tendenza a rimandare le conversazioni difficili — questa sembra una di quelle. Non è una domanda tecnica: è una domanda su che tipo di ambiente vuoi costruire, e se sei disposto a difenderlo.',
 'L''ho fatto. È stata la conversazione più difficile dell''anno. Il team ha respirato per la prima volta in mesi. Lo avrei dovuto fare 3 mesi prima.',
 '2026-02-15',
 '2026-02-05 15:00:00+00'),

(uid,
 'Lanciare la campagna marketing adesso con il materiale che abbiamo vs aspettare la perfezione',
 6, 'fear',
 'Stato 6/10, paura. "Aspettare la perfezione" è il tuo segnale di allarme: nei tuoi dati, la perfezione come condizione di partenza è quasi sempre autosabotaggio. Le ultime 3 volte che hai aspettato, il lancio è avvenuto lo stesso — con 3-4 settimane di ritardo e senza miglioramenti sostanziali.',
 NULL, NULL,
 '2026-02-14 10:00:00+00'),

(uid,
 'Aumentare il mio stipendio da founder anche se l''azienda non è ancora profittevole',
 5, 'fear',
 'Stato 5/10, paura: stai decidendo sulla tua remunerazione in bassa chiarezza. Il pattern non è sulla cifra — è che stai usando il tuo stipendio come proxy del tuo valore. Che stipendio ti daresti se fossi sicuro di valere il tuo contributo?',
 'Ho aumentato. Non era una questione di soldi — era una questione di quanto credevo nel progetto. Aumentare lo stipendio mi ha fatto capire che ci credo davvero.',
 '2026-03-01',
 '2026-02-22 14:00:00+00'),

(uid,
 'Costruire la prossima funzionalità in house o affidarla a un''agenzia esterna',
 8, 'vision',
 'Stato 8/10, visione: condizioni ottimali. La tua zona di espansione emerge quando deleghi da fiducia, non da urgenza. La domanda strategica: cosa puoi costruire con il team interno che un''agenzia non può replicare? La risposta a quello è la tua risposta.',
 NULL, NULL,
 '2026-03-04 11:00:00+00');

-- ─── Patterns ───────────────────────────────────────────────────
INSERT INTO public.patterns (user_id, type, title, description, frequency, first_seen, last_seen, is_active, metadata) VALUES

(uid, 'shadow', 'Autosabotaggio Pre-Successo',
 'Si manifesta puntualmente quando un progetto è vicino a un traguardo significativo. Apri nuove iniziative, trovi problemi, crei attrito — tutto ciò che impedisce di attraversare la soglia. Identificato in almeno 3 contesti diversi nelle ultime 12 settimane.',
 8, '2025-12-07', '2026-02-12', true,
 '{"trigger": "Avvicinarsi a un milestone importante", "contexts": ["lancio prodotto", "chiusura round", "campagna marketing"]}'),

(uid, 'state', 'Ciclo Picco-Crollo',
 'Ciclo ricorrente di circa 3-4 settimane: alta energia (7-9) → overwork (5-7) → burnout (2-4) → recupero lento (4-6) → ricomincia. Tre cicli completi identificati in 90 giorni. Il picco è alimentato dalla visione, il crollo dall''eccesso non sostenibile.',
 3, '2025-12-07', '2026-02-20', true,
 '{"cycle_length_days": 21, "burnout_trigger": "più di 10 ore/giorno per 5+ giorni consecutivi"}'),

(uid, 'belief', 'Il Riposo Come Colpa',
 'Convinzione operativa: fermarsi equivale a perdere terreno. Si manifesta come controllo compulsivo delle notifiche, incapacità di staccare nei weekend, senso di colpa nel riposo. Nominato esplicitamente in 7 check-in.',
 7, '2025-12-24', '2026-02-20', true,
 '{"keywords": ["perdere terreno", "senso di colpa", "sempre disponibile", "non posso fermarmi"]}'),

(uid, 'expansion', 'Flow Creator',
 'Stato di massima performance che emerge in condizioni specifiche: lavoro profondo senza interruzioni (3-4 ore), nessun confronto esterno, focus singolo. Le migliori idee strategiche arrivano invariabilmente in questo contesto. Emerso spontaneamente in 5 check-in.',
 5, '2026-01-10', '2026-03-05', true,
 '{"conditions": ["deep work blocks", "no notifications", "single focus"], "duration_optimal_hours": 3}'),

(uid, 'shadow', 'Controllo Travestito da Standard',
 'Riscrivere il lavoro dei collaboratori, correggere codice del CTO senza comunicarlo, rifare il copy del copywriter: pattern di controllo che si maschera da ricerca di qualità. Dall''esterno è quasi sempre visibile prima che dall''interno. Identificato in 6 check-in.',
 6, '2025-12-07', '2026-02-15', true,
 '{"manifestations": ["riscrivere codice del CTO", "rifare landing 3 volte", "correggere copy senza comunicarlo"]}');

-- ─── Weekly Reports ─────────────────────────────────────────────
INSERT INTO public.weekly_reports (user_id, week_start, week_end, checkin_count, avg_state_score, top_patterns, decisions_count, vision_decisions, ai_report, generated_at) VALUES

(uid, '2026-02-09', '2026-02-15', 10, 7.20,
 ARRAY['Flow Creator', 'Ciclo Picco-Crollo', 'Autosabotaggio Pre-Successo'], 2, 2,
 E'Questa settimana hai operato prevalentemente dalla tua zona di espansione: stato medio 7.2, due decisioni da visione, quattro ore di lavoro profondo che hai descritto come il tuo momento di massima chiarezza. Il dato più rilevante non è la performance — è che hai messo un confine strutturale (mercoledì bloccato) invece di affidarti alla forza di volontà.\n\nIl pattern del controllo è riemerso giovedì, quando la pressione della campagna ha attivato il micromanagement. Hai riscritto il copy del copywriter: non perché fosse sbagliato, ma perché non era il tuo. Questo non è uno standard alto — è fiducia bassa travestita da cura.\n\nLa domanda che ti lasci per la settimana prossima: quando il controllo si riattiva, cosa sta cercando di proteggere esattamente?',
 '2026-02-15 22:00:00+00'),

(uid, '2026-02-16', '2026-02-22', 8, 4.10,
 ARRAY['Ciclo Picco-Crollo', 'Il Riposo Come Colpa', 'Autosabotaggio Pre-Successo'], 0, 0,
 E'Sei entrato nel fondo del ciclo. Stato medio 4.1, nessuna decisione registrata, due giorni sotto il 3. Questo non è un fallimento — è la parte del ciclo che ancora non hai imparato a navigare prima di arrivarci.\n\nIl dato che emerge questa settimana è diverso dai cicli precedenti: ti sei nominato nel crollo mentre accadeva, non solo dopo. A gennaio ci hai messo tre giorni a riconoscerlo — questa volta lo hai visto il primo giorno. La lucidità sul pattern sta crescendo, anche quando il pattern stesso non cambia ancora.\n\nHai lavorato fino alle 2 di notte su qualcosa che poteva aspettare. Il debito che stai accumulando non è di lavoro — è di presenza.',
 '2026-02-22 22:00:00+00'),

(uid, '2026-03-02', '2026-03-07', 10, 7.83,
 ARRAY['Flow Creator', 'Il Riposo Come Colpa'], 2, 2,
 E'La settimana migliore degli ultimi 90 giorni: stato medio 7.8, coerenza dei check-in 10/10, due decisioni da visione. La più significativa: hai facilitato un meeting invece di dominarlo, e le idee emerse dal team erano migliori delle tue.\n\nIl laptop chiuso alle 18:30 senza peso — questo è il dato più piccolo e più importante della settimana. Non è la disciplina che lo ha reso possibile: è che il confine sta diventando chi sei, non quello che cerchi di fare.\n\nIl ciclo Picco-Crollo non è sparito. Ma questa settimana sei nella fase di picco con più consapevolezza di come proteggere l''energia — non bruciandola, ma usandola con intenzione.',
 '2026-03-07 22:00:00+00');

-- ─── Monthly Letters ────────────────────────────────────────────
INSERT INTO public.monthly_letters (user_id, month, year, ai_letter, generated_at) VALUES

(uid, 1, 2026,
 E'Caro Marco,\n\nGennaio 2026 è stato il mese del secondo crollo — e del secondo rialzo. Il ciclo si è ripetuto quasi identico a dicembre, con la stessa traiettoria: energia alta nelle prime due settimane, overwork nella terza, burnout nella quarta. Lo stato è sceso fino al 2 il 25 gennaio: il punto più basso da quando hai iniziato a tracciarti.\n\nQuello che ha reso gennaio diverso da dicembre non è il ciclo — il ciclo era lo stesso. È stato il momento in cui hai chiesto aiuto al tuo co-founder senza aspettare di essere completamente a pezzi. Hai detto che ne avevi bisogno. Hai resistito alla vergogna. Lui ha risposto. Questa è la riga più importante di tutto il mese, anche se non sembra.\n\nLe tue decisioni di gennaio parlano di una tensione ancora aperta: hai deciso bene quando stavi bene — l''investitore declinato, la conferenza saltata, Sara assunta come head of sales. Ti sei paralizzato quando eri esausto. Il tuo stato interno è ancora il predittore più accurato della qualità delle tue scelte.\n\nIl pattern del riposo come colpa è la ferita che tiene in piedi il ciclo. Finché riposarsi ti sembra una perdita, il sistema continuerà a rompersi perché non si ricarica mai davvero.\n\nLa versione di te che emerge da questo mese non è più forte — è più consapevole. E per ora, questo è sufficiente.',
 '2026-02-01 10:00:00+00'),

(uid, 2, 2026,
 E'Caro Marco,\n\nFebbraio 2026 ha avuto tre movimenti distinti, e li hai attraversati tutti con occhi più aperti di prima.\n\nLa prima settimana è stata la continuazione del recupero di gennaio: hai corso senza telefono, hai bloccato il mercoledì mattina, hai detto no a un meeting extra. Piccole cose — ma erano le tue piccole cose, non la performance di una versione migliore di te.\n\nPoi è arrivata la settimana di picco: stato medio 8.5, lavoro profondo, idee che emergono naturalmente. Hai licenziato il dev che avvelenava la cultura, e il team ha respirato per la prima volta in mesi. Hai detto che avresti dovuto farlo tre mesi prima. Forse è vero. Ma l''hai fatto adesso, da un posto di chiarezza.\n\nE poi il crollo è tornato. Stato medio 3.8 nella settimana più dura. Hai lavorato fino alle 2, hai rimandato tutto, ti sei visto nel loop mentre ci eri dentro. La differenza rispetto a gennaio: ci hai messo meno a nominarlo, e non ti sei odiato quanto prima.\n\nIl ciclo non si è interrotto, ma il tuo rapporto con esso sta cambiando. Non sei più sorpreso dal crollo. Inizi a riconoscerne i segnali in anticipo. Questo non è guarigione — è consapevolezza che cresce. Ed è il lavoro reale.',
 '2026-03-01 10:00:00+00');

END $$;
