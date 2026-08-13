import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Goal = 'conexao' | 'calma' | 'ansiedade' | 'oracao' | 'palavra';

// Data local do aparelho. Não usar toISOString aqui: ele devolve UTC e,
// no Brasil, faria o dia virar às 21h.
const pad2 = (n: number) => String(n).padStart(2, '0');

const todayKey = (d: Date = new Date()) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

// Diferença em dias entre duas chaves YYYY-MM-DD, sem fuso no meio
const daysBetween = (from: string, to: string) => {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  const a = Date.UTC(fy, fm - 1, fd);
  const b = Date.UTC(ty, tm - 1, td);
  return Math.round((b - a) / 86_400_000);
};

export const DAILY_MAX = 100;

/**
 * Limites do plano Essencial (gratuito):
 * - só a prática de Afirmação, uma vez por dia
 * - dentro de Praticar, só o bloco Respiração
 * - um único agendamento, e ele precisa ser da Afirmação
 */
export const FREE = {
  practiceId: 'afirmacao',
  maxSchedules: 1,
};

/**
 * Prática de socorro: fica liberada em qualquer plano e mesmo com o saldo
 * do dia completo. É a única que não pontua.
 */
export const ALWAYS_OPEN_PRACTICE = 'ansiedade';

interface DayRecord {
  date: string;
  points: number;
  practices: number;
}

// Agendamento: o usuário escolhe qual prática quer em qual horário.
// Por enquanto fica salvo localmente; as notificações entram na próxima fase.
export interface Schedule {
  id: string;
  practiceId: string;
  hour: number;
  minute: number;
  enabled: boolean;
  days: number[]; // 0 = domingo ... 6 = sábado
}

export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export const dayLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
export const dayNames = [
  'domingo',
  'segunda',
  'terça',
  'quarta',
  'quinta',
  'sexta',
  'sábado',
];

export const daysSummary = (days: number[]): string => {
  const set = [...new Set(days)].sort();
  if (set.length === 7) return 'Todos os dias';
  if (set.length === 5 && [1, 2, 3, 4, 5].every((d) => set.includes(d))) return 'Dias de semana';
  if (set.length === 2 && set.includes(0) && set.includes(6)) return 'Fim de semana';
  if (set.length === 0) return 'Nenhum dia';
  return set.map((d) => dayNames[d].slice(0, 3)).join(', ');
};

interface AppState {
  // Perfil
  name: string;
  goal: Goal | null;
  onboarded: boolean;

  // Gamificação
  today: string;
  pointsToday: number;
  practicesToday: number;
  affirmationReadToday: boolean;
  freePracticeUsedToday: boolean;
  streak: number;
  lastActiveDay: string | null;
  history: DayRecord[];

  // Agendamento
  schedules: Schedule[];
  promptedToday: string[]; // agendamentos que já abriram a tela cheia hoje
  doneToday: string[]; // agendamentos já executados hoje

  // Assinatura: vem exclusivamente do entitlement do RevenueCat.
  // Não existe trial local: o teste gratuito é o da loja, controlado por
  // conta Apple/Google, então reinstalar o app não devolve o benefício.
  premium: boolean;

  // Ações
  setProfile: (name: string, goal: Goal) => void;
  addSchedule: (practiceId: string, hour: number, minute: number, days: number[]) => void;
  toggleSchedule: (id: string) => void;
  removeSchedule: (id: string) => void;
  markPrompted: (scheduleId: string) => void;
  markScheduleDone: (practiceId: string) => void;
  rollDayIfNeeded: () => void;
  addPoints: (points: number, opts?: { practice?: boolean }) => void;
  markAffirmationRead: () => void;
  seenToday: string[]; // ids de frases já mostradas hoje
  markSeen: (id: string) => void;
  clearSeen: (ids: string[]) => void;
  markFreePracticeUsed: () => void;
  setPremium: (active: boolean) => void;
  hasPremiumAccess: () => boolean;
  dayComplete: () => boolean;

  // Painel de teste liberado por gesto (5 toques no nome do perfil)
  devUnlocked: boolean;
  unlockDev: () => void;

  // Só vira true quando os dados salvos terminaram de carregar
  hydrated: boolean;
  setHydrated: () => void;
  reset: () => void;
}

const initial = {
  name: '',
  goal: null as Goal | null,
  onboarded: false,
  today: todayKey(),
  pointsToday: 0,
  practicesToday: 0,
  affirmationReadToday: false,
  freePracticeUsedToday: false,
  streak: 0,
  lastActiveDay: null as string | null,
  history: [] as DayRecord[],
  schedules: [] as Schedule[],
  promptedToday: [] as string[],
  doneToday: [] as string[],
  seenToday: [] as string[],
  premium: false,
  devUnlocked: false,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initial,

      setProfile: (name, goal) => set({ name, goal, onboarded: true }),

      addSchedule: (practiceId, hour, minute, days) => {
        const s = get();
        const item: Schedule = {
          id: `${Date.now()}`,
          practiceId,
          hour,
          minute,
          enabled: true,
          days: days.length > 0 ? [...new Set(days)].sort() : ALL_DAYS,
        };
        const schedules = [...s.schedules, item].sort(
          (a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute)
        );
        set({ schedules });
      },

      toggleSchedule: (id) =>
        set({
          schedules: get().schedules.map((x) =>
            x.id === id ? { ...x, enabled: !x.enabled } : x
          ),
        }),

      removeSchedule: (id) => set({ schedules: get().schedules.filter((x) => x.id !== id) }),

      markPrompted: (scheduleId) => {
        const s = get();
        if (s.promptedToday.includes(scheduleId)) return;
        set({ promptedToday: [...s.promptedToday, scheduleId] });
      },

      // Ao concluir uma prática, marca o agendamento de hoje mais próximo dela.
      markScheduleDone: (practiceId) => {
        const s = get();
        const now = new Date();
        const weekday = now.getDay();
        const minutesNow = now.getHours() * 60 + now.getMinutes();

        const candidate = s.schedules
          .filter((x) => x.practiceId === practiceId && x.enabled)
          .filter((x) => (x.days ?? ALL_DAYS).includes(weekday))
          .filter((x) => !s.doneToday.includes(x.id))
          // o horário mais próximo do agora, passado ou a até 15 min no futuro
          .map((x) => ({ x, delta: Math.abs(minutesNow - (x.hour * 60 + x.minute)) }))
          .filter(({ x, delta }) => delta <= 120 || minutesNow >= x.hour * 60 + x.minute)
          .sort((a, b) => a.delta - b.delta)[0];

        if (!candidate) return;
        set({ doneToday: [...s.doneToday, candidate.x.id] });
      },

      rollDayIfNeeded: () => {
        const s = get();
        const t = todayKey();
        if (s.today === t) return;
        // Só entra no histórico o dia em que houve alguma atividade
        const hadActivity = s.pointsToday > 0 || s.practicesToday > 0;
        const closed: DayRecord = {
          date: s.today,
          points: s.pointsToday,
          practices: s.practicesToday,
        };
        const history = hadActivity ? [closed, ...s.history].slice(0, 60) : s.history;

        // Sequência quebra quando passou mais de um dia sem prática
        const brokeStreak = s.lastActiveDay ? daysBetween(s.lastActiveDay, t) > 1 : s.streak > 0;

        set({
          ...(brokeStreak ? { streak: 0 } : null),
          today: t,
          pointsToday: 0,
          practicesToday: 0,
          affirmationReadToday: false,
          freePracticeUsedToday: false,
          promptedToday: [],
          doneToday: [],
          seenToday: [],
          history,
        });
      },

      addPoints: (points, opts) => {
        // Fecha o dia anterior antes de somar, senão pontos de hoje
        // entrariam no saldo de ontem quando o app ficou aberto a noite toda.
        get().rollDayIfNeeded();

        const s = get();
        const t = todayKey();

        // Sequência: cresce uma vez por dia; reinicia se pulou algum dia.
        let streak = s.streak;
        if (s.lastActiveDay !== t) {
          if (s.lastActiveDay) {
            const diff = daysBetween(s.lastActiveDay, t);
            streak = diff === 1 ? s.streak + 1 : 1;
          } else {
            streak = 1;
          }
        }

        set({
          pointsToday: Math.min(DAILY_MAX, s.pointsToday + points),
          practicesToday: s.practicesToday + (opts?.practice ? 1 : 0),
          streak,
          lastActiveDay: t,
        });
      },

      markAffirmationRead: () => set({ affirmationReadToday: true }),

      markSeen: (id) => {
        const s = get();
        if (s.seenToday.includes(id)) return;
        set({ seenToday: [...s.seenToday, id] });
      },

      // Quando um tipo esgota todas as frases do dia, libera só aquele tipo
      clearSeen: (ids) => set({ seenToday: get().seenToday.filter((x) => !ids.includes(x)) }),
      markFreePracticeUsed: () => set({ freePracticeUsedToday: true }),

      // Quem manda no acesso é o entitlement do RevenueCat, nunca o app
      setPremium: (active) => {
        if (get().premium === active) return;
        set({ premium: active });
      },

      hasPremiumAccess: () => get().premium,

      // Saldo de Alegria cheio: a jornada do dia está concluída
      dayComplete: () => get().pointsToday >= DAILY_MAX,

      unlockDev: () => set({ devUnlocked: true }),

      hydrated: false,
      setHydrated: () => set({ hydrated: true }),

      reset: () => set({ ...initial, today: todayKey() }),
    }),
    {
      name: 'im-here-store',
      storage: createJSONStorage(() => AsyncStorage),
      // `hydrated` é estado de sessão: não deve ser salvo nem restaurado
      partialize: ({ hydrated, ...rest }) => rest as AppState,
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);

export const meterLabel = (points: number): string => {
  if (points <= 25) return 'Comece com uma pequena pausa';
  if (points <= 50) return 'Você está construindo presença';
  if (points <= 75) return 'Dia equilibrado';
  return 'Jornada diária concluída';
};

export const greeting = (name: string): string => {
  const h = new Date().getHours();
  const period = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  return name ? `${period}, ${name}.` : `${period}.`;
};
