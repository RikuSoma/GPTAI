import { Message, QuizAttempt, QuizQuestion } from '../types';

const STORAGE_KEY = 'study-app-state';

export interface PersistedState {
  messages: Message[];
  log: QuizAttempt[];
  reviewQueue: QuizQuestion[];
}

export const loadPersistedState = (): PersistedState | undefined => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return undefined;
    }
    return JSON.parse(raw) as PersistedState;
  } catch (error) {
    console.error('Failed to load persisted state', error);
    return undefined;
  }
};

export const savePersistedState = (state: PersistedState): void => {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Failed to save state', error);
  }
};
