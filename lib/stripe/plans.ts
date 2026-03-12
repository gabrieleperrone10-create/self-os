import type { UserPlan } from '@/types';

export interface Plan {
  id: UserPlan;
  label: string;
  price: number; // EUR/month
  priceId: string | null; // Stripe Price ID
  features: string[];
  highlight?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    label: 'Free',
    price: 0,
    priceId: null,
    features: [
      'Scan iniziale',
      '30 check-in / mese',
      'Dashboard base',
      'Streak counter',
    ],
  },
  {
    id: 'pro',
    label: 'Pro',
    price: 19,
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? null,
    highlight: true,
    features: [
      'Tutto Free',
      'Mirror decisionale illimitato',
      'Identity Map completa',
      'Pattern recognition AI',
      'Check-in illimitati',
      'Esportazione dati',
    ],
  },
  {
    id: 'coach',
    label: 'Coach',
    price: 79,
    priceId: process.env.STRIPE_COACH_PRICE_ID ?? null,
    features: [
      'Tutto Pro',
      'Dashboard clienti',
      'Note private per cliente',
      'Clienti illimitati',
      'Report settimanali clienti',
    ],
  },
];

export function getPlan(id: UserPlan): Plan {
  return PLANS.find(p => p.id === id) ?? PLANS[0];
}
