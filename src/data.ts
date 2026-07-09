import { User, Training } from './types';

export const INITIAL_USERS: User[] = [
  { id: 'user-deborah', name: 'Déborah Braga', avatarColor: 'from-rose-500 to-pink-600' }
];

export const INITIAL_TRAININGS: Training[] = [
  // Déborah Braga (user-deborah) - Semana 1
  {
    id: 't-deborah-1-1',
    userId: 'user-deborah',
    week: 1,
    description: 'Dia 1: Tiros de Velocidade (8x400m)',
    dayOfWeek: 'Terça-feira',
    plannedKm: 6.2,
    completedKm: 6.2,
    done: true,
    notes: 'Aquecimento: 10 min trote leve, mobilidade de tornozelos, quadris e joelhos, 4 acelerações de 60m. Treino principal: 8x400m forte (ritmo 5:00-5:15 min/km) com 1min30 de recuperação caminhando/trotando. Desaquecimento: 10 min trote leve.'
  },
  {
    id: 't-deborah-1-2',
    userId: 'user-deborah',
    week: 1,
    description: 'Dia 2: Treino de Resistência',
    dayOfWeek: 'Sexta-feira',
    plannedKm: 5.0,
    completedKm: 5.0,
    done: true,
    notes: 'Aquecimento: 10 min leves. Treino principal: 25 min em ritmo contínuo confortável (6:00-6:20 min/km). Nos últimos 5 minutos, acelere um pouco. Desaquecimento: 5 min caminhando.'
  },
  {
    id: 't-deborah-1-3',
    userId: 'user-deborah',
    week: 1,
    description: 'Dia 3: Longão de Sábado',
    dayOfWeek: 'Sábado',
    plannedKm: 7.0,
    completedKm: 7.0,
    done: true,
    notes: 'Ritmo conversável (6:30-7:00 min/km). Foco em aumentar a capacidade aeróbica. Não faça o longão rápido.'
  },

  // Déborah Braga (user-deborah) - Semana 2
  {
    id: 't-deborah-2-1',
    userId: 'user-deborah',
    week: 2,
    description: 'Dia 1: Tiros de Velocidade (8x400m)',
    dayOfWeek: 'Terça-feira',
    plannedKm: 6.2,
    completedKm: 6.2,
    done: true,
    notes: 'Aquecimento: 10 min trote leve, mobilidade articular, 4 acelerações de 60m. Treino principal: 8x400m forte (5:00-5:15 min/km). Desaquecimento: 10 min trote leve.'
  },
  {
    id: 't-deborah-2-2',
    userId: 'user-deborah',
    week: 2,
    description: 'Dia 2: Treino de Resistência',
    dayOfWeek: 'Sexta-feira',
    plannedKm: 5.0,
    completedKm: 5.0,
    done: true,
    notes: 'Aquecimento: 10 min leves. Treino principal: 25 min em ritmo contínuo (6:00-6:20 min/km). Nos últimos 5 minutos, acelerar um pouco. Desaquecimento: 5 min caminhando.'
  },
  {
    id: 't-deborah-2-3',
    userId: 'user-deborah',
    week: 2,
    description: 'Dia 3: Longão de Sábado',
    dayOfWeek: 'Sábado',
    plannedKm: 7.0,
    completedKm: 7.0,
    done: true,
    notes: 'Ritmo conversável (6:30-7:00 min/km). Foco em aumentar a capacidade aeróbica.'
  },

  // Déborah Braga (user-deborah) - Semana 3 (Atual/Foco)
  {
    id: 't-deborah-3-1',
    userId: 'user-deborah',
    week: 3,
    description: 'Dia 1: Tiros de Velocidade (8x400m)',
    dayOfWeek: 'Terça-feira',
    plannedKm: 6.2,
    completedKm: 6.2,
    done: true,
    notes: 'Aquecimento: 10 min trote leve, mobilidade, 4 acelerações. Principal: 8x400m forte (5:00-5:15 min/km). Desaquecimento: 10 min trote.'
  },
  {
    id: 't-deborah-3-2',
    userId: 'user-deborah',
    week: 3,
    description: 'Dia 2: Treino de Resistência',
    dayOfWeek: 'Sexta-feira',
    plannedKm: 5.5,
    completedKm: 0,
    done: false,
    notes: 'Aumentado o tempo contínuo de ritmo. Corra confortável (6:00-6:20 min/km) e acelere nos últimos 5 min. Desaquecimento: 5 min caminhando.'
  },
  {
    id: 't-deborah-3-3',
    userId: 'user-deborah',
    week: 3,
    description: 'Dia 3: Longão de Sábado',
    dayOfWeek: 'Sábado',
    plannedKm: 8.0,
    completedKm: 0,
    done: false,
    notes: 'Subindo para 8 km de volume! Ritmo leve conversável (6:30-7:00 min/km).'
  },

  // Déborah Braga (user-deborah) - Semana 4
  {
    id: 't-deborah-4-1',
    userId: 'user-deborah',
    week: 4,
    description: 'Dia 1: Tiros de Velocidade (8x400m)',
    dayOfWeek: 'Terça-feira',
    plannedKm: 6.2,
    completedKm: 0,
    done: false,
    notes: 'Aquecimento: 10 min trote leve, mobilidade, 4 acelerações. Treino: 8x400m forte (5:00-5:15 min/km). Desaquecimento: 10 min trote.'
  },
  {
    id: 't-deborah-4-2',
    userId: 'user-deborah',
    week: 4,
    description: 'Dia 2: Treino de Resistência',
    dayOfWeek: 'Sexta-feira',
    plannedKm: 5.5,
    completedKm: 0,
    done: false,
    notes: 'Aquecimento 10 min leves + 30 min ritmo (6:00-6:20 min/km) + 5 min caminhando desaquecimento.'
  },
  {
    id: 't-deborah-4-3',
    userId: 'user-deborah',
    week: 4,
    description: 'Dia 3: Longão de Sábado',
    dayOfWeek: 'Sábado',
    plannedKm: 8.0,
    completedKm: 0,
    done: false,
    notes: '8 km em ritmo leve (6:30-7:00 min/km). Respiração controlada e confortável.'
  },
  {
    id: 't-deborah-4-4',
    userId: 'user-deborah',
    week: 4,
    description: 'Dia 4: Teste de Cooper (12 Minutos)',
    dayOfWeek: 'Domingo',
    plannedKm: 3.5,
    completedKm: 0,
    done: false,
    notes: 'Aquecimento de 10 minutos. Tente correr a maior distância possível em 12 minutos. Anote distância, ritmo médio e frequência cardíaca!'
  }
];
