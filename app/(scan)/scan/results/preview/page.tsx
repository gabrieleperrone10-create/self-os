/**
 * Preview statica del report scan — solo per sviluppo.
 * Mostra come appare la results page con dati reali del demo user.
 * Visita: /scan/results/preview
 */

import type { ScanReport } from '@/types/scan';
import ResultsClient from '../results-client';

const DEMO_REPORT: ScanReport = {
  archetype_primary: {
    id: 'S1',
    title: 'Sabotatore di Soglia',
    score: 82,
    description: 'Arrivi al 90% — con la prima startup nel 2019, con l\'agenzia nel 2021, con il programma nel 2023. Ogni volta lo stesso schema: qualcosa si rompe proprio quando eri più vicino. Non è sfortuna. È un sistema di protezione che si attiva esattamente quando il successo diventa reale e duraturo, perché il successo duraturo porta responsabilità che senti di non poter sostenere.',
  },
  archetype_secondary: {
    id: 'S6',
    title: 'Guerriero Solo',
    score: 71,
    description: 'Fai tutto da solo perché è più sicuro. Deleghi ma poi controlli comunque. Il tuo team potrebbe essere più autonomo, ma tu non riesci a togliere la mano. Questo ti tiene esausto, ti impedisce di costruire qualcosa che sopravviva a te — che è esattamente quello che vuoi costruire.',
  },
  archetype_tertiary: {
    id: 'S9',
    title: 'Giudice Interiore',
    score: 58,
    description: 'Quando ottieni un risultato: sollievo momentaneo, poi subito al prossimo. Quando qualcosa va male: fuori concordi, dentro ti distruggi. La voce che dice che non sarà mai abbastanza ha uno score di 5/5. Questa non è ambizione — è una sorveglianza continua che non ti lascia mai riposare.',
  },
  spiral_level: 'Arancione',
  spiral_description: 'Operi dal livello Arancione — achievement, performance, successo come identità — e senti la tensione verso il Verde, dove il valore non dipende dai risultati.',
  loop_primary: {
    area: 'Business & Carriera',
    trigger: 'Il progetto raggiunge il 90% — sta per diventare reale, visibile, permanente',
    thought: '"Non è ancora pronto. C\'è qualcosa da sistemare prima. Quando sarà perfetto lo lancio."',
    behavior: 'Rimandi il lancio tre volte con motivi sempre diversi. Crei un problema dove non c\'era. Sei iperproduttivo su dettagli secondari mentre l\'essenziale aspetta.',
    result: 'Il progetto si perde, si ridimensiona, o viene abbandonato appena prima della soglia. Ricominci da capo in un altro contesto.',
    reinforcement: '"Non era ancora il momento giusto. La prossima volta sarà diverso."',
  },
  loop_secondary: {
    area: 'Finanze & Abbondanza',
    trigger: 'Periodo di guadagno buono — le risorse ci sono, la tensione dovrebbe diminuire',
    thought: '"Adesso posso investire in questo progetto nuovo. E anche in quest\'altro."',
    behavior: 'Investi in troppi progetti contemporaneamente. Non costruisci mai un buffer stabile. Dipendi strutturalmente dal prossimo lancio per coprire le spese.',
    result: 'Il ciclo si resetta — torni al punto di partenza finanziario nonostante i guadagni. Come tuo padre.',
    reinforcement: '"I soldi non si sa mai quanto durano. Meglio usarli per costruire qualcosa."',
  },
  loop_tertiary: {
    area: 'Relazioni & Team',
    trigger: 'Qualcuno del team fa qualcosa in modo diverso da come lo faresti tu',
    thought: '"Se lo lascio fare così andrà male. È più veloce farlo io. Non posso permettermi errori."',
    behavior: 'Controlli ogni deliverable. Fai tu invece di insegnare. Il team non cresce perché non gli lasci spazio.',
    result: 'Rimani l\'unico load-bearing wall — esausto, indispensabile, impossibilitato a scalare.',
    reinforcement: '"Se non ci fossi io, tutto cadrebbe. Meglio così."',
  },
  belief_limiting_primary: {
    text: '"Il successo duraturo non è per me — c\'è un tetto invisibile e ogni volta che mi avvicino vengo spinto indietro."',
    origin: 'A 14 anni hai visto tuo padre perdere tutto nel silenzio. Hai imparato che il successo è fragile e che gli uomini non mostrano quando hanno paura. Hai costruito un sistema per non arrivare mai abbastanza in alto da poter cadere come lui.',
  },
  belief_limiting_secondary: {
    text: '"Il mio valore dipende da ciò che produco — se mi fermo, non esisto."',
    origin: 'In famiglia le emozioni si nascondevano e il lavoro era identità. "Non dare problemi" è diventato "non esistere senza produrre". Prendersi cura di sé è ancora un lusso che ti concederai dopo.',
  },
  belief_resource: {
    text: '"Vedo ciò che gli altri non vedono ancora — e so come aiutarli ad aprirsi."',
  },
  wheel_expansion: ['Contributo & Scopo', 'Crescita Personale'],
  wheel_loops: ['Finanze & Abbondanza', 'Business & Carriera', 'Salute & Corpo'],
  wheel_priority: {
    area: 'Finanze & Abbondanza',
    reason: 'La volatilità finanziaria tiene tutto il resto in uno stato di allerta permanente — è il substrato su cui si costruisce o si demolisce ogni altro cambiamento.',
  },
  identity_target: {
    name: 'Il Costruttore Presente',
    shift_from: 'Imprenditore che guadagna ogni giorno il diritto di esistere attraverso i risultati — e sabota il successo quando diventa reale',
    shift_to: 'Leader che costruisce da un\'identità stabile, non da una paura di non essere abbastanza — e lascia che le cose rimangano',
    first_action: 'Dichiarare il programma flagship finito entro 7 giorni e aprire le iscrizioni — senza un\'altra modifica, senza un altro motivo per aspettare',
  },
  letter: 'Quello che emerge da tutto ciò che hai condiviso è questo: sei un uomo che ha costruito una comprensione profonda di se stesso — due anni di terapia, 150 domande, una chiarezza rara — e continua comunque a fermarsi al 90%. Non perché non sai. Ma perché sapere e fare sono due cose distinte, e il tuo sistema ha imparato a usare la comprensione come un altro modo per non arrivare. Hai scritto che la versione più evoluta di te ti direbbe: "Finalmente ti sei fermato abbastanza a lungo da capire che correre non era la risposta." Quella versione ti sta aspettando dall\'altra parte di un lancio che hai già pronto. La domanda che questo sistema ti restituisce non è come smettere di sabotarti — ma cosa succederebbe, concretamente, se permettessi a questo di rimanere?',
};

// Simulated D1,D4,D7,D10,D13,D16,D19,D22 scores for Marco Ferretti (1-5 scale → normalized to 1-10)
// Areas: Salute, Relazioni, Famiglia, Business, Finanze, Crescita, Divertimento, Contributo
const DEMO_RADAR_SCORES = [4, 6, 7, 5, 3, 8, 4, 9];

export default function ScanResultsPreviewPage() {
  return <ResultsClient report={DEMO_REPORT} radarScores={DEMO_RADAR_SCORES} />;
}
