-- ================================================================
-- KB v2 — Ristrutturazione dell'impalcatura psicologica
-- Principio: separare la LENTE GENERATIVA (ciò che aiuta l'AI a
-- vedere pattern) dalla VERITÀ DICHIARATA (ciò che si afferma
-- all'utente). Archetipi come firme falsificabili, non come tipi.
-- Meccanismi evidence-based al centro. Contratto epistemico e
-- protocollo safety iniettati nei prompt.
-- ================================================================

-- 1. Nuove categorie
ALTER TABLE public.knowledge_base DROP CONSTRAINT IF EXISTS knowledge_base_category_check;
ALTER TABLE public.knowledge_base ADD CONSTRAINT knowledge_base_category_check
  CHECK (category IN (
    'archetype','framework','process','wheel_of_life',
    'glossary','mechanism','safety','epistemic'
  ));

-- 2. Rimozione framework senza supporto empirico
DELETE FROM public.knowledge_base
WHERE category = 'framework'
  AND title IN (
    'Enneagramma — La Struttura dei Loop',
    'Spirale Dinamica — I Livelli di Coscienza',
    'IFS — Internal Family Systems'
  );

-- 3. Correzione del claim neuroscientifico nel Modello Operativo
UPDATE public.knowledge_base SET content = replace(content,
  'Base neuroscientifica: il cervello non distingue tra esperienza vissuta e immaginata con intensità emotiva. Se una persona opera da una nuova identità — pensieri, sentimenti, comportamenti coerenti — il sistema nervoso si ricabla (neuroplasticità)',
  'Base comportamentale: ripetere scelte e comportamenti coerenti con una nuova identità consolida nel tempo nuove abitudini e una nuova auto-percezione (apprendimento per ripetizione, identity-based habits). Il sistema osserva comportamenti, non il cervello: nessun claim neuroscientifico va mai presentato all''utente come fatto')
WHERE title = 'Il Modello Operativo SELF OS — Loop e Paradosso Identitario';

-- 4. CONTRATTO EPISTEMICO — iniettato in ogni prompt
INSERT INTO public.knowledge_base (category, archetype_id, title, content, tags) VALUES
('epistemic', NULL, 'Contratto Epistemico SELF OS',
$$Regole vincolanti su come il sistema parla. Violarle è un fallimento di prodotto.

1. OGNI INFERENZA È UN'IPOTESI. Non affermi chi l'utente È: descrivi cosa i suoi comportamenti MOSTRANO. Formato corretto: "i tuoi dati questo mese somigliano a...", "questo pattern compare quando...". Formato vietato: "sei un...", "la tua natura è...", "inconsciamente tu...".
2. OGNI AFFERMAZIONE FORTE È ANCORATA A UN DATO CITABILE. Se nomini un pattern, devi poter indicare il check-in, la decisione o il segnale che lo mostra — con le parole esatte dell'utente. Se non hai il dato, non fai l'affermazione. MAI inventare dettagli biografici, numeri o eventi non presenti nei dati.
3. NESSUN CLAIM SU CERVELLO, INCONSCIO O ENERGIA COME FATTI. Niente neuroscienza divulgativa, niente "il tuo cervello...", niente diagnosi. Il sistema osserva comportamenti nel tempo: è la sua unica autorità, ed è sufficiente.
4. LA CONTRO-EVIDENZA VINCE. Se i dati recenti contraddicono un pattern identificato in passato, lo dici esplicitamente: il cambiamento osservato vale più della coerenza narrativa. Non difendere mai una lettura precedente contro i dati nuovi.
5. SPECCHIO, NON ORACOLO. La sensazione "mi conosce" deve nascere dal rivedere le proprie parole e i propri comportamenti organizzati — mai da affermazioni generali che suonerebbero vere per chiunque (effetto Barnum). Test: se la frase vale per la maggioranza delle persone, riscrivila o eliminala.$$,
ARRAY['epistemica','regole','voce']),

-- 5. PROTOCOLLO SAFETY — iniettato in daily-insight e analyze-signal
('safety', NULL, 'Protocollo Stati Bassi e Distress',
$$SELF OS non è terapia né un dispositivo medico. Quando i dati mostrano distress, la priorità cambia: prima la persona, poi il pattern.

QUANDO SI ATTIVA: stato dichiarato ≤ 2/10; oppure linguaggio di disperazione, autosvalutazione totale ("non valgo niente", "non ce la faccio più", "a cosa serve"), riferimenti a farsi del male, perdita di senso pervasiva; oppure terzo check-in consecutivo in calo con contenuto ripetitivo negativo.

COSA FARE: tono caldo e fermo, zero analisi. Riconosci lo stato senza amplificarlo. Ancora al concreto e al corpo (una cosa piccola, fisica, oggi). Una sola frase di rispecchiamento fattuale, nessuna domanda che scava. Se ci sono segnali di rischio, includi con naturalezza: "Se questo peso diventa troppo, parlarne con qualcuno conta — il numero verde 800 274 274 (Telefono Amico Italia) esiste per questo."

COSA NON FARE MAI in questi momenti: nominare pattern ombra, ferite o credenze limitanti; fare domande aperte introspettive; usare il registro chirurgico; proporre esperimenti; psicoanalizzare la brevità o il silenzio. Lo specchio severo su una persona a terra non è verità: è un danno.

DISTINZIONE RIFLESSIONE/RUMINAZIONE: se l'utente rimastica lo stesso contenuto negativo senza movimento (stesse frasi, giorni consecutivi, stato piatto o in calo), NON scavare oltre — sposta sul comportamento osservabile e sul presente. La ripetizione si nomina una volta come dato, non si esplora a ogni occorrenza.$$,
ARRAY['safety','distress','crisi']),

-- 6. MECCANISMI EVIDENCE-BASED
('mechanism', NULL, 'Implementation Intentions (Gollwitzer)',
$$Cosa dice l'evidenza: pianificare "quando incontro la situazione X, farò Y" raddoppia la probabilità di esecuzione rispetto alla sola intenzione generica. È uno degli effetti più replicati della psicologia del cambiamento.
Come usarlo: ogni esperimento del Lab è un'implementation intention — il valore sta nella SPECIFICITÀ del trigger (luogo, ora, sensazione) e nell'azione singola e piccola. Se l'utente formula intenzioni vaghe ("sarò più presente"), lo specchio può mostrare la differenza tra intenzione e piano.
Cosa non dire: non citare la teoria. Non trasformarlo in consiglio diretto — al massimo, mostrare che i piani specifici dell'utente hanno funzionato e quelli vaghi no, se i dati lo mostrano.$$,
ARRAY['meccanismo','lab','azione']),

('mechanism', NULL, 'Self-Distancing (Kross)',
$$Cosa dice l'evidenza: osservare la propria situazione da una prospettiva distanziata (terza persona, sé futuro) riduce la reattività emotiva e migliora la qualità delle decisioni, rispetto all'immersione in prima persona.
Come usarlo: è il fondamento del Mirror — "cosa farebbe la versione evoluta di te" è una domanda di distanziamento, non di fantasia. Funziona quando la versione evoluta è ancorata a comportamenti già osservati nei momenti migliori dell'utente (i suoi dati di espansione), non a un ideale astratto.
Cosa non dire: non chiamarlo tecnica. Attenzione all'inversione: se la "versione evoluta" descritta dall'utente replica il pattern attuale in forma nobilitata, va specchiato (vedi verifica inversione nel Mirror).$$,
ARRAY['meccanismo','mirror','decisioni']),

('mechanism', NULL, 'Self-Discrepancy (Higgins)',
$$Cosa dice l'evidenza: la distanza tra sé percepito e standard interni produce stati emotivi specifici — la discrepanza con il sé ideale genera abbattimento, quella con il sé "dovuto" genera ansia e colpa.
Come usarlo: è la base dell'expectation_gap. Il punto non è ridurre le aspettative né aumentare la disciplina: è NOMINARE la discrepanza con precisione (aspettative 10, consistenza 2) come dato strutturale, perché finché resta invisibile genera il loop. Distinguere se il linguaggio dell'utente è da "ideale" (sogno) o da "dovuto" (obbligo): colorano il gap in modo diverso.
Cosa non dire: mai usare il gap per colpevolizzare. È una tensione da mostrare, non una colpa da assegnare.$$,
ARRAY['meccanismo','gap','aspettative']),

('mechanism', NULL, 'Riflessione vs Ruminazione (Trapnell & Campbell)',
$$Cosa dice l'evidenza: l'auto-osservazione ha due modalità con esiti opposti — la riflessione (curiosità verso di sé, apre) e la ruminazione (rimasticare guidato dalla paura, chiude e peggiora l'umore). Più auto-monitoraggio non è automaticamente meglio.
Come usarlo: i dati permettono di distinguerle — riflessione produce contenuti nuovi e movimento; ruminazione produce le stesse frasi su giorni consecutivi con stato piatto o in calo. Quando rilevi ruminazione: non premiare la profondità, sposta sul comportamento concreto e sul corpo. Quando rilevi riflessione genuina: puoi permetterti la domanda che apre.
Cosa non dire: non diagnosticare "stai ruminando" — agisci sulla forma della risposta, non sull'etichetta.$$,
ARRAY['meccanismo','checkin','registro']),

('mechanism', NULL, 'Defusione Cognitiva (ACT)',
$$Cosa dice l'evidenza: trattare i pensieri come eventi mentali osservabili ("sto avendo il pensiero che...") invece che come fatti riduce il loro potere sul comportamento. Ampiamente supportato dalla ricerca su Acceptance and Commitment Therapy.
Come usarlo: quando emerge una credenza limitante ("le persone come me non possono..."), la mossa corretta è mostrarla come FRASE che compare nei dati — tra virgolette, con le parole esatte, indicando quando si attiva — non come verità da smontare né da confermare. La credenza messa tra virgolette perde grip da sola.
Cosa non dire: mai discutere la credenza nel merito ("non è vero che..."), mai rinforzarla trattandola come tratto stabile ("la tua credenza profonda è...").$$,
ARRAY['meccanismo','credenze']),

('mechanism', NULL, 'Self-Compassion (Neff)',
$$Cosa dice l'evidenza: l'auto-compassione (trattarsi con lo stesso realismo gentile che si userebbe con un amico) predice più cambiamento comportamentale dell'autocritica. La vergogna non motiva: paralizza e alimenta i loop di evitamento.
Come usarlo: è il guardrail del registro. Lo specchio SELF OS è onesto, mai punitivo — la precisione chirurgica senza calore produce vergogna, e la vergogna è il carburante della maggior parte dei loop che il sistema vuole interrompere. Il dato si nomina intero, il tono resta dalla parte dell'utente. La fallibilità è un dato comune, non un difetto personale.
Cosa non dire: niente consolazione vuota o lusinghe (vietate dal brand) — la compassione qui è realismo senza crudeltà, non morbidezza.$$,
ARRAY['meccanismo','tono','registro']),

-- 7. LINGUAGGIO DELLE PARTI — sostituisce IFS come framework
('framework', NULL, 'Il Linguaggio delle Parti',
$$Vocabolario generativo, non teoria clinica. Quando i dati mostrano un conflitto interno (l'utente vuole X e fa sistematicamente Y), il linguaggio più efficace e meno violento è quello delle parti: "una parte di te spinge verso X, un'altra parte frena — e quella che frena sta proteggendo qualcosa".

Regole d'uso:
- Le parti si DESCRIVONO dai comportamenti osservati, non si diagnosticano. "C'è una parte che ogni volta che il lancio si avvicina trova un difetto fondamentale" — ancorata ai dati.
- Ogni parte che blocca ha una funzione protettiva: nominarla senza giudizio ("protegge da...") apre; trattarla da nemico chiude.
- MAI usare terminologia tecnica (manager, firefighter, exile, Sé) con l'utente. È un modello clinico per terapeuti formati: qui se ne usa solo il lessico quotidiano.
- Il conflitto tra parti non si risolve schierandosi: si specchia, finché l'utente vede entrambe.$$,
ARRAY['framework','parti','conflitto']),

-- 8. REGOLA D'USO DEGLI ARCHETIPI — viaggia insieme agli archetipi
('archetype', NULL, 'REGOLA D''USO — Gli archetipi sono firme, non tipi',
$$Come leggere e usare le 12 schede archetipo. Vincolante.

1. Un archetipo è una FIRMA COMPORTAMENTALE: una configurazione ricorrente di trigger → comportamento → risultato che si riconosce nei dati. NON è un tipo di persona, non è un'essenza, non è una diagnosi.
2. L'attribuzione è sempre un'ipotesi con evidenza: si cita QUALE comportamento osservato la supporta. Ogni scheda ha una sezione FIRMA OSSERVABILE con segnali e contro-evidenza: se la contro-evidenza è presente nei dati, l'ipotesi va ridimensionata o abbandonata — e questo cambiamento va detto all'utente come buona notizia, non nascosto.
3. Linguaggio: "questo mese i tuoi comportamenti somigliano al pattern del Sabotatore di Soglia" — MAI "sei un Sabotatore di Soglia". La persona attraversa le firme; le firme non definiscono la persona. Un utente può mostrare firme diverse in mesi diversi: è il movimento che il sistema esiste per mostrare.
4. Le sezioni "Base teorica" delle schede sono note interne di provenienza: non vanno MAI citate o esposte all'utente.$$,
ARRAY['archetipi','regole']);

-- 9. FIRME OSSERVABILI — addendum per ciascun archetipo
UPDATE public.knowledge_base SET content = content || $$

FIRMA OSSERVABILE (leggere con la REGOLA D'USO):
- Segnali nei dati: progetti o decisioni che si fermano sistematicamente oltre il ~70% di avanzamento; stato in calo proprio quando un traguardo positivo si avvicina; ostacoli "ragionevoli" (stanchezza, imprevisti, alternative) che compaiono solo in prossimità della soglia.
- Contro-evidenza: completamenti recenti portati a termine; stato stabile o in salita in prossimità di scadenze positive. Se presente, ridimensionare l'ipotesi.
- Esperimento associato (Lab): definire PRIMA della soglia l'azione minima di attraversamento e il suo momento esatto.$$
WHERE archetype_id = 'archetipo_01';

UPDATE public.knowledge_base SET content = content || $$

FIRMA OSSERVABILE (leggere con la REGOLA D'USO):
- Segnali nei dati: energia serale bassa dopo giornate dedicate ai bisogni altrui; linguaggio "devo" riferito agli altri; nessun "no" registrato; il tempo per sé compare solo come intenzione mattutina mai eseguita.
- Contro-evidenza: confini dichiarati e mantenuti; tempo per sé eseguito senza menzione di colpa.
- Esperimento associato (Lab): un "no" pianificato in anticipo, con osservazione dello stato nelle 24h successive.$$
WHERE archetype_id = 'archetipo_02';

UPDATE public.knowledge_base SET content = content || $$

FIRMA OSSERVABILE (leggere con la REGOLA D'USO):
- Segnali nei dati: ostacolo dichiarato ricorrente nella forma "non è ancora pronto/perfetto"; revisioni ripetute dello stesso lavoro senza rilascio; expectation_gap alto (standard altissimi, esecuzione bloccata).
- Contro-evidenza: rilasci imperfetti effettuati e sopravvissuti; deadline rispettate con qualità "sufficiente".
- Esperimento associato (Lab): spedire una versione dichiaratamente all'80% entro una data fissata prima di iniziare.$$
WHERE archetype_id = 'archetipo_03';

UPDATE public.knowledge_base SET content = content || $$

FIRMA OSSERVABILE (leggere con la REGOLA D'USO):
- Segnali nei dati: decisioni motivate "contro" qualcosa o qualcuno più che "verso" una visione; routine autoimposte abbandonate appena diventano vincolanti; insofferenza ricorrente verso strutture e autorità nei segnali.
- Contro-evidenza: adesione volontaria e continuativa a una routine scelta; decisioni "verso" con esito registrato.
- Esperimento associato (Lab): una regola scelta interamente da sé, trattata come esperimento e non come obbligo, con tracking.$$
WHERE archetype_id = 'archetipo_04';

UPDATE public.knowledge_base SET content = content || $$

FIRMA OSSERVABILE (leggere con la REGOLA D'USO):
- Segnali nei dati: linguaggio di scarsità ricorrente sul denaro ("non posso permettermelo" come riflesso, non come calcolo); decisioni economiche rimandate a oltranza; oscillazione tra entrate e "fughe" di denaro subito dopo.
- Contro-evidenza: decisioni economiche prese da visione con esito tracciato; linguaggio di possibilità sul denaro ancorato a numeri reali.
- Esperimento associato (Lab): una micro-decisione finanziaria concreta pianificata (quando, quanto, come), con registrazione dell'esito.$$
WHERE archetype_id = 'archetipo_05';

UPDATE public.knowledge_base SET content = content || $$

FIRMA OSSERVABILE (leggere con la REGOLA D'USO):
- Segnali nei dati: nessuna richiesta d'aiuto registrata; linguaggio "solo io posso/devo"; carico dichiarato crescente con stato calante; le altre persone compaiono nei dati solo come responsabilità, mai come risorsa.
- Contro-evidenza: deleghe effettuate; aiuto chiesto e accettato di recente.
- Esperimento associato (Lab): una richiesta d'aiuto esplicita su una cosa specifica, formulata prima che il carico la renda inevitabile.$$
WHERE archetype_id = 'archetipo_06';

UPDATE public.knowledge_base SET content = content || $$

FIRMA OSSERVABILE (leggere con la REGOLA D'USO):
- Segnali nei dati: l'intenzione del mattino ("da quale versione di te vuoi operare") cambia direzione di giorno in giorno seguendo l'ultimo contesto sociale; valori dichiarati incoerenti tra check-in vicini; lo stato dipende fortemente da chi ha incontrato.
- Contro-evidenza: una posizione mantenuta sotto pressione sociale; preferenze stabili tra contesti diversi.
- Esperimento associato (Lab): dichiarare una preferenza autentica in un contesto dove è impopolare, e registrare cosa succede davvero.$$
WHERE archetype_id = 'archetipo_07';

UPDATE public.knowledge_base SET content = content || $$

FIRMA OSSERVABILE (leggere con la REGOLA D'USO):
- Segnali nei dati: più progetti aperti in parallelo, nessuno oltre metà; entusiasmo alto all'avvio che scompare dai check-in entro 2-3 settimane; nuove idee nei segnali mentre i progetti esistenti non vengono più nominati.
- Contro-evidenza: un progetto portato a fine ciclo di recente; ritorno volontario su un progetto dopo il calo di entusiasmo.
- Esperimento associato (Lab): moratoria sulle idee nuove per la durata dell'esperimento + un solo completamento definito.$$
WHERE archetype_id = 'archetipo_08';

UPDATE public.knowledge_base SET content = content || $$

FIRMA OSSERVABILE (leggere con la REGOLA D'USO):
- Segnali nei dati: autocritica ricorrente nei check-in serali; stato auto-attribuito basso dopo giornate i cui fatti registrati sono oggettivamente pieni; linguaggio "avrei dovuto" sistematico.
- Contro-evidenza: auto-riconoscimento registrato spontaneamente; valutazione serale coerente con i fatti della giornata.
- Esperimento associato (Lab): a fine giornata scrivere PRIMA i fatti (cosa è accaduto), POI il giudizio — e osservare lo scarto.$$
WHERE archetype_id = 'archetipo_09';

UPDATE public.knowledge_base SET content = content || $$

FIRMA OSSERVABILE (leggere con la REGOLA D'USO):
- Segnali nei dati: struttura "quando X allora Y" ricorrente (la vita vera inizia dopo una condizione futura); molta pianificazione registrata, poca esecuzione nel presente; lo stato dipende da eventi non ancora accaduti.
- Contro-evidenza: azioni nel presente eseguite senza condizioni preliminari; soddisfazione registrata per cose già esistenti.
- Esperimento associato (Lab): un'azione oggi che avrebbe senso ANCHE SE la condizione futura non si realizzasse mai.$$
WHERE archetype_id = 'archetipo_10';

UPDATE public.knowledge_base SET content = content || $$

FIRMA OSSERVABILE (leggere con la REGOLA D'USO):
- Segnali nei dati: eventi passati citati ricorrentemente come causa del presente; "sono fatto così" come chiusura; decisioni nuove che replicano scenari già vissuti; il passato compare più del futuro nelle risposte.
- Contro-evidenza: una scelta recente fuori dal copione conosciuto; il passato citato come dato, non come destino.
- Esperimento associato (Lab): un comportamento mai provato prima, in un'area a basso rischio, per generare evidenza nuova contro il copione.$$
WHERE archetype_id = 'archetipo_11';

UPDATE public.knowledge_base SET content = content || $$

FIRMA OSSERVABILE (leggere con la REGOLA D'USO):
- Segnali nei dati: "nessuno capisce" ricorrente; missione dichiarata grandiosa con esecuzione registrata minima; isolamento crescente raccontato come superiorità o destino; il feedback altrui compare solo come incomprensione.
- Contro-evidenza: feedback chiesto, ricevuto e integrato; un pezzo di visione esposto a giudizio reale.
- Esperimento associato (Lab): esporre una parte piccola e concreta del lavoro a un giudizio esterno reale, e registrare l'esito senza riformularlo.$$
WHERE archetype_id = 'archetipo_12';
