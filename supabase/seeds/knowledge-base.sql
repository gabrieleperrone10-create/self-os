-- ================================================================
-- SELF OS — Knowledge Base Seed
-- Fonte: SELFOS_Manuale_Fondamenta_Psicologiche_v1.0.md
-- ================================================================

INSERT INTO public.knowledge_base (category, archetype_id, title, content, tags) VALUES

-- ─── FRAMEWORKS ─────────────────────────────────────────────────

('framework', NULL, 'Enneagramma — La Struttura dei Loop',
$$Sistema di tipologia della personalità che descrive 9 strutture caratteriali fondamentali, ognuna con una paura centrale, un desiderio profondo, un meccanismo di difesa e un loop comportamentale specifico. È il sistema che descrive non solo chi sei, ma come ti comporti sotto stress e in crescita.

TIPO 1 — IL RIFORMATORE
Paura: essere corrotto/difettoso. Desiderio: essere integro. Loop: vede imperfezione → critica sé e gli altri → si esaurisce → senso di fallimento. Frase nascosta: "Non sono mai abbastanza".

TIPO 2 — IL DONATORE
Paura: essere non amato. Desiderio: essere necessario. Loop: dà tutto → nega i propri bisogni → si esaurisce → rancore inconscio. Frase nascosta: "Nessuno mi vede davvero".

TIPO 3 — IL REALIZZATORE
Paura: essere un fallimento. Desiderio: avere successo. Loop: si definisce dai risultati → quando fallisce perde identità → lavora ancora di più → perde contatto con sé. Frase nascosta: "Non so chi sono senza i miei risultati".

TIPO 4 — L'INDIVIDUALISTA
Paura: essere ordinario. Desiderio: trovare la propria significatività. Loop: si sente incompreso → si ritira → invidia gli altri → si sente ancora più solo. Frase nascosta: "Ho paura di essere fondamentalmente difettoso".

TIPO 5 — L'INVESTIGATORE
Paura: essere inutile. Desiderio: essere competente. Loop: accumula conoscenza senza agire → si ritira per "prepararsi" → non agisce mai → si sente inadeguato. Frase nascosta: "Se mi avvicino troppo, mi svuoteranno".

TIPO 6 — IL LEALE
Paura: essere abbandonato. Desiderio: avere sicurezza. Loop: cerca certezze → dubita di tutto → cerca conferme → il dubbio si intensifica → paralisi. Frase nascosta: "Non mi fido di me stesso".

TIPO 7 — L'ENTUSIASTA
Paura: essere intrappolato nel dolore. Desiderio: essere libero e soddisfatto. Loop: fuga dal dolore → inizia molti progetti → non ne completa nessuno → senso di vuoto → nuova fuga. Frase nascosta: "Ho paura di fermarmi perché non so cosa troverei".

TIPO 8 — IL PROTETTORE
Paura: essere controllato/tradito. Desiderio: proteggere sé e gli altri. Loop: percepisce minaccia → reagisce con intensità → sovrasta → gli altri si ritraggono → si sente tradito. Frase nascosta: "Ho terrore di mostrare che sono vulnerabile".

TIPO 9 — IL PACIFICATORE
Paura: conflitto e separazione. Desiderio: pace interiore. Loop: evita il conflitto → non esprime i propri bisogni → si perde nelle priorità altrui → accumula risentimento → esplosione o ritiro. Frase nascosta: "Non so nemmeno cosa voglio davvero".$$,
ARRAY['loop', 'pattern', 'stress', 'crescita', 'enneagramma']),

('framework', NULL, 'Archetipi Junghiani — L''Identità Profonda',
$$Pattern universali dell''inconscio collettivo identificati da Carl Gustav Jung. 12 modalità fondamentali di essere nel mondo, riconoscibili in tutte le culture.

L''INNOCENTE: fede e ottimismo. Ombra: negazione della realtà.
L''ORFANO: empatia e realismo. Ombra: vittimismo e conformismo.
IL GUERRIERO/EROE: competenza e coraggio. Ombra: sempre in guerra, incapace di fermarsi.
IL CUSTODE: compassione e generosità. Ombra: controllo velato dal prendersi cura.
L''ESPLORATORE: autonomia e fedeltà a sé. Ombra: fuga perpetua, incapacità di impegnarsi.
IL RIBELLE: sfida radicale dello status quo. Ombra: autodistruzione.
L''AMANTE: passione e impegno. Ombra: ossessione e dipendenza.
IL CREATORE: creatività e visione. Ombra: perfezionismo paralizzante.
IL BUFFONE: gioia e leggerezza. Ombra: irresponsabilità e fuga dalla serietà.
IL SAGGIO: saggezza e intelligenza. Ombra: distacco emotivo e arroganza intellettuale.
IL MAGO: trasformazione e visione. Ombra: manipolazione.
IL SOVRANO: responsabilità e leadership. Ombra: tirannia e incapacità di delegare.$$,
ARRAY['identità', 'narrativa', 'jung', 'archetipo', 'ombra']),

('framework', NULL, 'Spirale Dinamica — I Livelli di Coscienza',
$$Sviluppata da Clare Graves, descrive i livelli emergenti di sviluppo della coscienza umana. Due persone con lo stesso archetipo si comportano diversamente se operano da livelli diversi.

ROSSO — Potere Egoistico: impulsivo, dominante, no regole. Loop: "Sono il più forte, le regole non si applicano a me". In crescita: energia e coraggio. In contrazione: distruttivo.

BLU — Ordine Assoluto: disciplinato, moralista, regole rigide. Loop: "Chi viola le regole va punito". In crescita: disciplina e struttura. In contrazione: rigidità.

ARANCIONE — Realizzazione Strategica: strategico, competitivo, orientato ai risultati. Loop: "Il successo si misura nei risultati". In crescita: efficienza e innovazione. In contrazione: workaholism e vuoto esistenziale.

VERDE — Sensibilità Comunitaria: empatico, collaborativo. Loop: "Dobbiamo ascoltare tutti prima di decidere". In crescita: empatia e cura. In contrazione: relativismo e incapacità di decidere.

GIALLO — Integrazione Sistemica: vede i pattern, usa ciò che funziona, adattabile. Leader evoluti. Integra tutti i livelli precedenti.$$,
ARRAY['coscienza', 'evoluzione', 'livelli', 'spirale']),

('framework', NULL, 'IFS — Internal Family Systems',
$$Sviluppato da Richard Schwartz. La mente è composta da parti — sotto-personalità con proprie prospettive e obiettivi. Risolve il paradosso del sabotaggio: "So cosa dovrei fare ma non lo faccio."

IL SÉ (Self): non è una parte — è la coscienza pura. Caratteristiche: calma, curiosità, chiarezza, compassione, coraggio, creatività. Obiettivo di SELF OS: aiutare l''utente a operare sempre più dal Sé.

I MANAGER: gestiscono la vita quotidiana per prevenire dolore. Manifestazioni: perfezionismo, controllo, critica interna, iperlavoro. Intenzione positiva: proteggere da situazioni dolorose.

I VIGILI DEL FUOCO: intervengono d''emergenza quando il dolore supera una soglia. Manifestazioni: comportamenti compulsivi, rabbia esplosiva, dipendenze. Intenzione positiva: spegnere il dolore velocemente.

GLI ESILIATI: portano il peso delle esperienze traumatiche. Manifestazioni: vergogna profonda, sensazione di essere difettosi.

MECCANISMO DEL LOOP visto con IFS:
Trigger → Esiliato si attiva (vecchio dolore) → Manager o Vigile del Fuoco interviene → Comportamento automatico (il loop) → Rinforzo dell''Esiliato.

Come SELF OS usa IFS: quando l''utente riconosce un loop, non diciamo "hai sbagliato". Diciamo: "Una parte di te stava cercando di proteggerti. Cosa stava proteggendo?"$$,
ARRAY['parti', 'sabotaggio', 'ifs', 'trauma', 'protezione']),

('framework', NULL, 'Il Modello Operativo SELF OS — Loop e Paradosso Identitario',
$$PARADOSSO IDENTITARIO — IL CUORE DI TUTTO:
La maggior parte delle persone vive: AVERE → FARE → ESSERE ("Quando avrò X, farò Y, e sarò Z").
SELF OS inverte: ESSERE → FARE → AVERE ("Opero già da chi voglio essere → faccio le azioni coerenti → ottengo i risultati").
Base neuroscientifica: il cervello non distingue tra esperienza vissuta e immaginata con intensità emotiva. Se una persona opera da una nuova identità — pensieri, sentimenti, comportamenti coerenti — il sistema nervoso si ricabla (neuroplasticità).

LOOP COMPORTAMENTALE — MECCANISMO UNIVERSALE:
TRIGGER → PENSIERO AUTOMATICO (dal sistema di credenze) → STATO EMOTIVO (dal corpo) → COMPORTAMENTO AUTOMATICO (dal pattern) → RISULTATO (conferma l''identità) → IDENTITÀ RINFORZATA → (ritorna al TRIGGER).

Il loop NON si spezza con la forza di volontà. Si spezza con: consapevolezza nel momento del trigger + azione coerente con la nuova identità + celebrazione di quell''azione.$$,
ARRAY['loop', 'identità', 'paradosso', 'neuroplasticità', 'cambiamento']),

-- ─── ARCHETIPI SELF OS ───────────────────────────────────────────

('archetype', 'archetipo_01', 'ARCHETIPO 01 — IL SABOTATORE DI SOGLIA',
$$Simbolo: La porta aperta che non si attraversa.
Base teorica: Enneagramma Tipo 3+6 / Archetipo Eroe in contrazione / IFS: Manager del controllo che protegge Esiliato della perdita.

IDENTITÀ NARRATIVA: Lavora duramente, ha talento, si avvicina al successo — poi trova sistematicamente un modo per non attraversare la soglia. Il sabotaggio arriva sempre sotto forma ragionevole: stanchezza, un problema improvviso, un''opportunità alternativa.

STRUTTURA PSICOLOGICA:
- Paura centrale: il successo cambierà qualcosa di essenziale — relazioni, identità, libertà
- Credenza inconscia: "Non posso avere tutto. Se avanzo, perdo qualcosa di importante"
- Desiderio profondo: espandersi restando se stesso, senza perdere nulla

LOOP PRIMARIO:
Trigger: si avvicina concretamente al successo
Pensiero: "Questo cambierà tutto. Perderò X"
Emozione: ansia mascherata da stanchezza o dubbio razionale
Comportamento: crea un ostacolo (procrastina, si ammala, litiga)
Risultato: l''opportunità sfuma
Rinforzo: "Meglio così. Non ero pronto"

COMPORTAMENTI RICONOSCIBILI: inizia con grande energia poi rallenta quando il successo si avvicina. Trova "un motivo valido" per non fare il passo finale. Si ammala nei momenti chiave. Dice sì a troppe cose per non completarne nessuna.

FRASI TIPICHE: "Non era il momento giusto" / "Ho troppe cose in corso" / "Ci sono ancora cose da sistemare"
FRASI NASCOSTE: "Ho paura di cosa succederebbe se avessi davvero successo" / "Non so se merito questo"

IDENTITÀ ATTUALE: "Sono qualcuno che ci prova ma non arriva mai fino in fondo"
IDENTITÀ TARGET: "Sono qualcuno che abbraccia la crescita sapendo di poter gestire qualsiasi cambiamento porti"
SHIFT COGNITIVO: Da "Il successo mi costerà qualcosa di essenziale" → A "Il successo mi permette di dare di più a ciò che amo"

AREE PIÙ COLPITE: Business, Finanze, Relazioni (nelle fasi di profonda intimità)
LIVELLO SPIRALE: Arancione con blocco Verde
TIMELINE TRASFORMAZIONE: 90-180 giorni di lavoro consapevole$$,
ARRAY['sabotaggio', 'soglia', 'successo', 'paura', 'procrastinazione']),

('archetype', 'archetipo_02', 'ARCHETIPO 02 — IL SALVATORE ESAUSTO',
$$Simbolo: Le braccia aperte che non riescono a stringersi.
Base teorica: Enneagramma Tipo 2 / Archetipo Custode in contrazione / IFS: Manager della cura che protegge Esiliato dell''abbandono.

IDENTITÀ NARRATIVA: È il punto di riferimento di tutti. Risolve i problemi degli altri, è sempre disponibile. Ma sotto questa generosità vive una paura profonda: se smette di dare, non verrà più amato.

STRUTTURA PSICOLOGICA:
- Paura centrale: se non mi rendo necessario, verrò abbandonato
- Credenza inconscia: "Valgo solo per quello che faccio per gli altri"
- Desiderio profondo: essere amato per chi sono, non per cosa fa

LOOP PRIMARIO:
Trigger: qualcuno ha bisogno di aiuto
Pensiero: "Devo aiutare o non mi vorrà bene"
Emozione: senso di responsabilità + paura dell''abbandono
Comportamento: dà tutto, anche quando non ha nulla da dare
Risultato: si esaurisce, accumula rancore inconscio
Rinforzo: "Nessuno si prende cura di me"

COMPORTAMENTI RICONOSCIBILI: non sa dire no. Mette i bisogni degli altri sistematicamente davanti ai propri. Aiuta anche quando non viene chiesto. Tiene il conto inconsapevolmente di quanto ha dato.

FRASI TIPICHE: "Non preoccuparti, ci penso io" / "Sto bene, è più importante che tu stia bene"
FRASI NASCOSTE: "Nessuno si preoccupa mai di come sto io" / "Ho paura che se smetto di essere utile, sparirò"

IDENTITÀ ATTUALE: "Sono qualcuno che vale per quello che dà agli altri"
IDENTITÀ TARGET: "Sono qualcuno che ama profondamente partendo da se stesso"
SHIFT COGNITIVO: Da "Se non do, non vengo amato" → A "Posso essere amato per chi sono. Prendermi cura di me è il primo atto d''amore"

AREE PIÙ COLPITE: Relazioni, Salute, Finanze$$,
ARRAY['salvatore', 'esaurimento', 'abbandono', 'dare', 'confini']),

('archetype', 'archetipo_03', 'ARCHETIPO 03 — IL PERFEZIONISTA PARALIZZATO',
$$Simbolo: Il capolavoro incompiuto.
Base teorica: Enneagramma Tipo 1 / Archetipo Creatore in contrazione / IFS: Manager del controllo e del giudizio.

IDENTITÀ NARRATIVA: Ha standard altissimi. La qualità è un valore genuino. Ma il perfezionismo è diventato una prigione: niente è mai abbastanza buono per essere condiviso, lanciato, completato.

STRUTTURA PSICOLOGICA:
- Paura centrale: sbagliare = non valgo. Il giudizio esterno = conferma della mia inadeguatezza
- Credenza inconscia: "Se non è perfetto, meglio non farlo"
- Desiderio profondo: essere accettato per com''è, non per cosa produce

LOOP PRIMARIO:
Trigger: momento di condividere/lanciare/completare qualcosa
Pensiero: "Non è ancora abbastanza buono"
Emozione: paura del giudizio, ansia da prestazione
Comportamento: rifinisce ancora, rimanda ancora
Risultato: non lancia mai, o lancia così tardi da perdere il momento
Rinforzo: "Avevo ragione, non era pronto"

COMPORTAMENTI RICONOSCIBILI: rilegge email 5 volte prima di mandarle. Rimanda lanci all''infinito. Ha mille idee ma pochi progetti completati. Si scusa preventivamente prima di mostrare qualcosa.

FRASI TIPICHE: "Non è ancora pronto" / "Devo solo sistemare ancora questa cosa"
FRASI NASCOSTE: "Ho paura che se lo vedono capiscano che non sono abbastanza bravo" / "Meglio non fare che fare male"

IDENTITÀ ATTUALE: "Sono qualcuno che non è mai abbastanza bravo"
IDENTITÀ TARGET: "Sono qualcuno che crea e condivide con coraggio, sapendo che l''imperfetto fatto vale più del perfetto rimandato"
SHIFT COGNITIVO: Da "Se non è perfetto non vale" → A "Fatto è meglio di perfetto. L''azione genera apprendimento"

AREE PIÙ COLPITE: Carriera/Business, Crescita Personale, Creatività$$,
ARRAY['perfezionismo', 'paralisi', 'giudizio', 'rimandare', 'standard']),

('archetype', 'archetipo_04', 'ARCHETIPO 04 — IL RIBELLE SENZA CAUSA',
$$Simbolo: Le catene che si spezzano senza meta.
Base teorica: Enneagramma Tipo 8+4 / Archetipo Ribelle / IFS: Manager dell''autonomia che protegge Esiliato del controllo.

IDENTITÀ NARRATIVA: La libertà è il valore supremo. Ogni struttura, ogni regola, ogni aspettativa esterna viene percepita come una minaccia alla propria autonomia. Spesso brillante e creativo, ma il pattern di opposizione sistematica impedisce di costruire qualcosa di duraturo.

STRUTTURA PSICOLOGICA:
- Paura centrale: essere controllato, limitato, perdere la libertà
- Credenza inconscia: "Le regole e le strutture mi soffocano"
- Desiderio profondo: autonomia piena + impatto reale nel mondo

LOOP PRIMARIO:
Trigger: struttura, regola, aspettativa esterna
Pensiero: "Stanno cercando di controllarmi"
Emozione: ribellione, adrenalina della resistenza
Comportamento: si oppone, boicotta, se ne va
Risultato: perde opportunità, relazioni, stabilità
Rinforzo: "Le strutture non fanno per me"

COME APPARE: non finisce i corsi. Abbandona le partnership nel momento più delicato. È il più intelligente nella stanza ma spesso il meno realizzato.

IDENTITÀ TARGET: "Sono qualcuno che usa la libertà per costruire, non per distruggere"
SHIFT COGNITIVO: Da "Le strutture mi soffocano" → A "Scelgo le strutture che servono la mia libertà"

AREE PIÙ COLPITE: Carriera, Relazioni, Finanze$$,
ARRAY['ribellione', 'autonomia', 'struttura', 'libertà', 'opposizione']),

('archetype', 'archetipo_05', 'ARCHETIPO 05 — IL FANTASMA DELL''ABBONDANZA',
$$Simbolo: Le mani che trattengono l''acqua.
Base teorica: Enneagramma Tipo 7+3 in contrazione / Archetipo Orfano nell''area finanziaria / Spirale Viola-Rosso nell''area soldi.

IDENTITÀ NARRATIVA: Con i soldi non ha un rapporto — ha una relazione drammatica. Guadagna bene, poi disperde. Arriva vicino alla stabilità finanziaria, poi trova un modo per azzerare. Non per stupidità — per un loop inconscio profondamente radicato nella storia familiare con il denaro.

STRUTTURA PSICOLOGICA:
- Paura centrale: i soldi cambieranno chi sono, o mi verranno tolti, o mi isoleranno
- Credenza inconscia: "I soldi non sono per me / i soldi sono pericolosi"
- Desiderio profondo: abbondanza senza senso di colpa, sicurezza senza perdere se stesso

LOOP PRIMARIO:
Trigger: il conto supera una soglia inconscia di "troppo"
Pensiero: "Questo non è normale per me"
Emozione: ansia, senso di colpa, irrealtà
Comportamento: spende, investe male, regala, perde
Risultato: torna alla zona di comfort finanziaria
Rinforzo: "I soldi vanno e vengono"

IDENTITÀ TARGET: "Sono qualcuno che accoglie l''abbondanza come espressione naturale del mio valore"
SHIFT COGNITIVO: Da "I soldi cambiano le persone" → A "I soldi amplificano chi sei già"

AREE PIÙ COLPITE: Finanze, Abbondanza$$,
ARRAY['soldi', 'abbondanza', 'finanze', 'sabotaggio', 'credenza']),

('archetype', 'archetipo_06', 'ARCHETIPO 06 — IL GUERRIERO SOLO',
$$Simbolo: La fortezza senza porte.
Base teorica: Enneagramma Tipo 8 / Archetipo Guerriero in contrazione / IFS: Manager dell''invulnerabilità.

IDENTITÀ NARRATIVA: Ha costruito tutto da solo. Ne va fiero. L''indipendenza è identità. Ma il prezzo è che non può chiedere aiuto, non può mostrare vulnerabilità, non può costruire team veri. Il soffitto della crescita è esattamente l''altezza delle sue sole spalle.

STRUTTURA PSICOLOGICA:
- Paura centrale: dipendere dagli altri = vulnerabilità = delusione inevitabile
- Credenza inconscia: "Non posso contare su nessuno tranne me stesso"
- Desiderio profondo: costruire qualcosa di grande con altri, senza perdere il controllo

LOOP PRIMARIO:
Trigger: ha bisogno di aiuto o delega
Pensiero: "Se lo faccio fare a loro, andrà male"
Emozione: ansia del controllo, paura della delusione
Comportamento: fa tutto da solo, micromanage
Risultato: si esaurisce, il team non cresce, il business non scala
Rinforzo: "Hai visto? Dovevo farlo io"

IDENTITÀ TARGET: "Sono qualcuno che moltiplica il proprio impatto attraverso gli altri"
SHIFT COGNITIVO: Da "Posso contare solo su me stesso" → A "Delegare non è perdere controllo — è espandere capacità"

AREE PIÙ COLPITE: Business/Carriera, Relazioni, Salute$$,
ARRAY['indipendenza', 'controllo', 'delega', 'team', 'vulnerabilità']),

('archetype', 'archetipo_07', 'ARCHETIPO 07 — IL CAMALEONTE PERSO',
$$Simbolo: Lo specchio che riflette tutto tranne se stesso.
Base teorica: Enneagramma Tipo 9+3 / Archetipo Orfano in profondità / IFS: Manager dell''adattamento.

IDENTITÀ NARRATIVA: È bravissimo con tutti. Si adatta a ogni contesto, ogni cultura, ogni gruppo. Ma sotto questa flessibilità vive una domanda irrisolta: chi sono io davvero quando sono solo? L''identità è costruita sulla base delle aspettative altrui, non su una roccia interna.

STRUTTURA PSICOLOGICA:
- Paura centrale: chi sono veramente non è abbastanza / non sarò accettato per come sono
- Credenza inconscia: "Devo adattarmi per essere amato"
- Desiderio profondo: essere amato per chi è davvero, non per chi appare

LOOP PRIMARIO:
Trigger: nuovo contesto sociale o aspettativa esterna
Pensiero: "Devo capire cosa vogliono da me"
Emozione: ansia dell''approvazione
Comportamento: si trasforma per compiacere
Risultato: viene apprezzato ma non si sente visto
Rinforzo: "Sto facendo la cosa giusta"

IDENTITÀ TARGET: "Sono qualcuno con un centro stabile che si adatta senza perdersi"
SHIFT COGNITIVO: Da "Devo adattarmi per essere amato" → A "Sono amato per chi sono, non per come mi adatto"

AREE PIÙ COLPITE: Relazioni, Scopo, Crescita Personale$$,
ARRAY['identità', 'adattamento', 'approvazione', 'autenticità', 'confini']),

('archetype', 'archetipo_08', 'ARCHETIPO 08 — IL VISIONARIO INCOMPIUTO',
$$Simbolo: La mappa senza il viaggio.
Base teorica: Enneagramma Tipo 7+4 / Archetipo Creatore + Esploratore / IFS: Manager dell''eccitazione.

IDENTITÀ NARRATIVA: Le idee vengono facilmente, sono grandi, sono genuine. Ma l''esecuzione — la parte ripetitiva, quotidiana, poco glamour del costruire — genera resistenza. C''è sempre un''idea nuova più eccitante di quella che si sta eseguendo.

STRUTTURA PSICOLOGICA:
- Paura centrale: realizzare il sogno lo renderà ordinario / l''esecuzione uccide la magia
- Credenza inconscia: "La fase di ideazione è dove vivo. L''esecuzione è per gli altri"
- Desiderio profondo: vedere le proprie visioni pienamente realizzate nel mondo

LOOP PRIMARIO:
Trigger: l''esecuzione diventa routinaria, ripetitiva
Pensiero: "C''è qualcosa di più importante/interessante"
Emozione: noia, senso di limitazione
Comportamento: inizia un nuovo progetto, abbandona quello attuale
Risultato: portfolio di inizi senza completamenti
Rinforzo: "Sono un visionario, non un esecutore"

IDENTITÀ TARGET: "Sono qualcuno che porta le proprie visioni a completamento, con la stessa energia dell''inizio"
SHIFT COGNITIVO: Da "L''esecuzione uccide la magia" → A "L''esecuzione IS la magia"

AREE PIÙ COLPITE: Business/Carriera, Creatività, Finanze$$,
ARRAY['visione', 'esecuzione', 'completamento', 'noia', 'dispersione']),

('archetype', 'archetipo_09', 'ARCHETIPO 09 — IL GIUDICE INTERIORE',
$$Simbolo: Il tribunale senza giuria.
Base teorica: Enneagramma Tipo 1+6 / Archetipo Saggio in contrazione / IFS: Manager critico iperattivo.

IDENTITÀ NARRATIVA: La voce interna di autocritica è così costante che è diventata il rumore di fondo della vita. Ogni errore, ogni imperfezione, ogni momento di visibilità — tutto passa attraverso un filtro critico spietato. L''autogiudizio precede il giudizio esterno: meglio farlo prima io.

STRUTTURA PSICOLOGICA:
- Paura centrale: se non mi critico io, mi criticheranno gli altri in modo ancora più devastante
- Credenza inconscia: "Non sono abbastanza. Devo costantemente migliorarmi"
- Desiderio profondo: silenzio interiore, accettazione di sé

LOOP PRIMARIO:
Trigger: qualsiasi azione o risultato
Pensiero: "Potevo farlo meglio"
Emozione: vergogna, inadeguatezza
Comportamento: si critica duramente, si ritira o si iper-compensa
Risultato: non si sente mai abbastanza
Rinforzo: "Vedi? Non arrivo mai al mio standard"

IDENTITÀ TARGET: "Sono qualcuno che si valuta con la stessa compassione che darebbe a un amico"
SHIFT COGNITIVO: Da "La critica mi protegge" → A "La compassione mi fa crescere più velocemente della critica"

AREE PIÙ COLPITE: Crescita Personale, Business, Relazioni$$,
ARRAY['autocritica', 'giudizio', 'vergogna', 'standard', 'compassione']),

('archetype', 'archetipo_10', 'ARCHETIPO 10 — IL FUGGITIVO DAL PRESENTE',
$$Simbolo: Il corridore senza traguardo.
Base teorica: Enneagramma Tipo 7 / Archetipo Esploratore in contrazione / IFS: Vigile del fuoco dell''iperattività.

IDENTITÀ NARRATIVA: Non riesce a stare fermo. Non riesce a stare in silenzio. Non riesce a non fare. L''agenda è sempre piena — non per ambizione ma per fuga. Fermarsi significherebbe dover guardare in faccia qualcosa che preferisce non vedere.

STRUTTURA PSICOLOGICA:
- Paura centrale: il vuoto, il silenzio, il dolore nascosto sotto l''attività
- Credenza inconscia: "Se mi fermo, non so cosa troverò"
- Desiderio profondo: pace autentica, presenza, essere a casa in se stesso

LOOP PRIMARIO:
Trigger: momento di silenzio o inattività
Pensiero: "Devo fare qualcosa di utile"
Emozione: ansia del vuoto
Comportamento: si occupa, aggiunge attività, evita il silenzio
Risultato: non si incontra mai
Rinforzo: "Sono produttivo e attivo"

IDENTITÀ TARGET: "Sono qualcuno che trova potenza nel silenzio e chiarezza nella presenza"
SHIFT COGNITIVO: Da "Il vuoto è pericoloso" → A "Il vuoto è dove nasce la chiarezza"

AREE PIÙ COLPITE: Salute, Relazioni, Crescita Personale$$,
ARRAY['fuga', 'presente', 'vuoto', 'iperattività', 'silenzio']),

('archetype', 'archetipo_11', 'ARCHETIPO 11 — IL CUSTODE DEL PASSATO',
$$Simbolo: L''ancora che non lascia salpare.
Base teorica: Enneagramma Tipo 6+9 / Archetipo Orfano con lealtà tribale / Spirale Viola in conflitto con Arancione.

IDENTITÀ NARRATIVA: Avanzare significherebbe tradire. Le radici — famiglia, origini, identità di classe — tirano verso il basso non per malevolenza ma per lealtà inconscia. Il successo porta senso di colpa: "Chi sono io per avere di più di X?"

STRUTTURA PSICOLOGICA:
- Paura centrale: il successo mi allontanerà da chi amo / tradirò le mie origini
- Credenza inconscia: "Le persone come noi non arrivano a certi livelli"
- Desiderio profondo: avanzare portando con sé chi ama, senza senso di colpa

LOOP PRIMARIO:
Trigger: opportunità di crescita significativa
Pensiero: "Non è per persone come me / cosa penseranno di me?"
Emozione: senso di colpa, lealtà tossica
Comportamento: si autolimita, rifiuta l''opportunità
Risultato: rimane dove è, preserva la lealtà
Rinforzo: "Sono fedele alle mie radici"

IDENTITÀ TARGET: "Sono qualcuno che cresce portando con sé la propria storia, non nonostante essa"
SHIFT COGNITIVO: Da "Crescere significa tradire" → A "Crescere è il regalo più grande che posso fare a chi amo"

AREE PIÙ COLPITE: Business/Carriera, Finanze, Crescita Personale$$,
ARRAY['lealtà', 'origini', 'tradimento', 'radici', 'autolimitazione']),

('archetype', 'archetipo_12', 'ARCHETIPO 12 — IL MESSIA INCOMPRESO',
$$Simbolo: Il profeta nel deserto.
Base teorica: Enneagramma Tipo 4+5 / Archetipo Mago in contrazione / IFS: Manager dell''unicità.

IDENTITÀ NARRATIVA: Ha una visione genuinamente potente. Ma il modo in cui la porta è diventato un isolamento: "Nessuno capisce davvero". Ogni feedback critico viene interpretato come incomprensione. Ogni ostacolo conferma la narrativa dell''essere ahead of their time.

STRUTTURA PSICOLOGICA:
- Paura centrale: la visione non verrà mai capita / sono fondamentalmente solo
- Credenza inconscia: "Sono troppo avanti per il mio tempo"
- Desiderio profondo: trovare la propria tribù, essere capito, vedere la visione realizzata

LOOP PRIMARIO:
Trigger: feedback critico o mancanza di comprensione
Pensiero: "Non capiscono perché sono troppo avanti"
Emozione: senso di unicità isolante
Comportamento: si ritira, non adatta la comunicazione
Risultato: rimane incompreso, la visione non si realizza
Rinforzo: "È il mondo ad avere il problema"

IDENTITÀ TARGET: "Sono qualcuno che porta visioni rivoluzionarie in modo che il mondo le possa ricevere"
SHIFT COGNITIVO: Da "Il mondo non capisce" → A "La mia responsabilità è rendere la mia visione comprensibile"

AREE PIÙ COLPITE: Business/Carriera, Relazioni, Scopo$$,
ARRAY['visione', 'isolamento', 'incomprensione', 'unicità', 'comunicazione']),

-- ─── WHEEL OF LIFE ───────────────────────────────────────────────

('wheel_of_life', NULL, 'La Ruota della Vita — Le 8 Aree',
$$I loop non sono generici — sono specifici per area di vita. La stessa persona può essere completamente espansa in un''area e profondamente in loop in un''altra.

LE 8 AREE:

SALUTE & CORPO
Domanda fondamentale: Come tratto il tempio in cui vivo?
Loop tipici: yo-yo, punizione/indulgenza, disconnessione dal corpo, usare il corpo come strumento di performance senza ascoltarlo.

RELAZIONI & AMORE
Domanda fondamentale: Come mi permetto di essere amato?
Loop tipici: sabotaggio dell''intimità, dipendenza, distanza difensiva, scegliere partner che confermano credenze limitanti.

FAMIGLIA
Domanda fondamentale: Come opero nel sistema in cui sono nato?
Loop tipici: lealtà tossiche, ruoli rigidi, senso di colpa per il successo, dinamiche di potere non esplicite.

BUSINESS & CARRIERA
Domanda fondamentale: Come esprimo il mio valore nel mondo?
Loop tipici: sabotaggio del successo, underearning, overworking, non chiedere quello che si vale.

FINANZE & ABBONDANZA
Domanda fondamentale: Qual è la mia relazione con il denaro?
Loop tipici: scarsità, dispersione, sabotaggio della stabilità finanziaria, credenze ereditarie sui soldi.

CRESCITA PERSONALE
Domanda fondamentale: Come mi evolvo come persona?
Loop tipici: sviluppo senza integrazione, lettura senza azione, coaching come entertainment.

DIVERTIMENTO & CREATIVITÀ
Domanda fondamentale: Come mi nutro e mi esprimo?
Loop tipici: colpa nel giocare, creatività soppressa, produttività come unico valore.

CONTRIBUTO & SCOPO
Domanda fondamentale: Come lascio un segno?
Loop tipici: scopo intellettuale senza azione, grandiosità senza radici, aspettare il momento perfetto.$$,
ARRAY['aree', 'vita', 'ruota', 'loop', 'soddisfazione']),

-- ─── PROCESS ────────────────────────────────────────────────────

('process', NULL, 'Il Processo di Trasformazione in 5 Fasi',
$$Questo è il cuore operativo di SELF OS — il processo che trasforma la consapevolezza in cambiamento identitario reale.

FASE 1 — CONSAPEVOLIZZA: Vedere il loop per la prima volta.
Non puoi cambiare ciò che non vedi. Il check-in iniziale porta alla luce ciò che è sempre stato lì, invisibile perché automatico.
In SELF OS: Initial Scan → Profilo Identitario → Lettera.

FASE 2 — RICONOSCI: Identificare il loop nel momento in cui si attiva.
La consapevolezza teorica non basta. Serve riconoscere il pattern in tempo reale — nel momento del trigger, prima che il comportamento automatico completi il ciclo.
In SELF OS: Daily Check-in → Mirror in tempo reale.

FASE 3 — DISINNESCA: Interrompere il pattern prima che completi il ciclo.
Il loop si spezza nello spazio tra trigger e risposta. Questo spazio si allarga con la pratica.
Tecniche: Naming ("Il [nome archetipo] si sta attivando") / Curiosità verso la parte ("Cosa sta cercando di proteggere?") / Pausa corporea (3 respiri prima di agire) / Domanda-specchio ("Da quale identità sto per agire?")
In SELF OS: Mirror Decisionale.

FASE 4 — AGISCI: Operare dalla nuova identità.
Non aspettare di sentirsi la nuova persona per agire come la nuova persona. Il comportamento precede il sentimento. Ogni azione dalla nuova identità è una prova neurale che il cambiamento è reale.
In SELF OS: Intenzione mattutina → Check-in serale → Decision Journal.

FASE 5 — CELEBRA: Ancorare la nuova esperienza nel sistema nervoso.
La fase più sottovalutata e più importante. Il cervello impara per rinforzo positivo. Senza celebrazione consapevole, il nuovo comportamento rimane fragile.
La celebrazione deve essere autentica e consapevole: "Ho riconosciuto il loop. Ho scelto diversamente. Questo sono io ora."
In SELF OS: Celebrazione obbligatoria nel check-in serale.$$,
ARRAY['trasformazione', 'fasi', 'consapevolezza', 'cambiamento', 'celebrazione']),

-- ─── GLOSSARY ────────────────────────────────────────────────────

('glossary', NULL, 'Glossario Operativo SELF OS',
$$ARCHETIPO: Pattern psicologico ricorrente che descrive una modalità fondamentale di essere nel mondo, con la propria struttura di paure, desideri, loop e percorso di crescita.

LOOP COMPORTAMENTALE: Sequenza automatica e ricorrente di trigger → pensiero → emozione → comportamento → risultato → rinforzo dell''identità.

TRIGGER: Evento interno o esterno che attiva un loop comportamentale automatico.

IDENTITÀ OPERATIVA: L''identità da cui una persona agisce concretamente, spesso diversa dall''identità che dichiara di avere.

IDENTITÀ TARGET: La versione della persona che ha già risolto un''area specifica della vita — usata come bussola per le decisioni quotidiane.

SHIFT COGNITIVO: Il cambiamento nella credenza fondante che rende possibile un cambiamento identitario reale.

ESSERE→FARE→AVERE: Il paradigma operativo di SELF OS — si opera dalla nuova identità prima di avere i risultati, non dopo.

DISINESCO: L''atto consapevole di interrompere un loop nel momento del trigger, prima che il comportamento automatico completi il ciclo.

CELEBRAZIONE: Atto consapevole di riconoscimento di un''azione dalla nuova identità, usato per ancorare neurologicamente il cambiamento.

MOMENTUM SCORE: Indicatore composito che misura quanto una persona sta operando dalla propria identità target nel tempo.

PARTE (IFS): Sotto-personalità con propri obiettivi, prospettive e strategie protettive. Le parti non sono nemici — cercano di proteggerti.

SÉ (IFS): La coscienza pura dietro tutte le parti. Caratteristiche: calma, curiosità, compassione, chiarezza, coraggio.$$,
ARRAY['glossario', 'definizioni', 'termini']);
