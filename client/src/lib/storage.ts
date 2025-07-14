import { Subtopic, SubtopicContent, ChatMessage, PracticeQuestions } from "@shared/schema";

const STORAGE_KEYS = {
  SUBTOPICS: 'learning-app-subtopics',
  CONTENT: 'learning-app-content', 
  CHAT_HISTORY: 'learning-app-chat-history',
  PRACTICE_QUESTIONS: 'learning-app-practice-questions',
} as const;

// Subtopics storage
export const subtopicsStorage = {
  get: (unitId: string): Subtopic[] | null => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEYS.SUBTOPICS}-${unitId}`);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  set: (unitId: string, subtopics: Subtopic[]): void => {
    try {
      localStorage.setItem(`${STORAGE_KEYS.SUBTOPICS}-${unitId}`, JSON.stringify(subtopics));
    } catch (error) {
      console.error('Failed to cache subtopics:', error);
    }
  },

  clear: (unitId: string): void => {
    localStorage.removeItem(`${STORAGE_KEYS.SUBTOPICS}-${unitId}`);
  },

  clearAll: (): void => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_KEYS.SUBTOPICS)) {
        localStorage.removeItem(key);
      }
    });
  },
};

// Content storage
export const contentStorage = {
  get: (subtopicId: string): SubtopicContent | null => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEYS.CONTENT}-${subtopicId}`);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  set: (subtopicId: string, content: SubtopicContent): void => {
    try {
      localStorage.setItem(`${STORAGE_KEYS.CONTENT}-${subtopicId}`, JSON.stringify(content));
    } catch (error) {
      console.error('Failed to cache content:', error);
    }
  },

  clear: (subtopicId: string): void => {
    localStorage.removeItem(`${STORAGE_KEYS.CONTENT}-${subtopicId}`);
  },

  clearAll: (): void => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_KEYS.CONTENT)) {
        localStorage.removeItem(key);
      }
    });
  },

  clearByUnit: (unitId: string): void => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_KEYS.CONTENT)) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const content: SubtopicContent = JSON.parse(stored);
            // We'd need to track which subtopics belong to which unit
            // For now, we'll clear all content when clearing a unit
          }
        } catch {
          // Invalid JSON, remove anyway
          localStorage.removeItem(key);
        }
      }
    });
  },
};

// Chat history storage
export const chatStorage = {
  get: (subtopicId: string): ChatMessage[] => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEYS.CHAT_HISTORY}-${subtopicId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  set: (subtopicId: string, messages: ChatMessage[]): void => {
    try {
      localStorage.setItem(`${STORAGE_KEYS.CHAT_HISTORY}-${subtopicId}`, JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to cache chat history:', error);
    }
  },

  add: (subtopicId: string, message: ChatMessage): void => {
    const existing = chatStorage.get(subtopicId);
    existing.push(message);
    chatStorage.set(subtopicId, existing);
  },

  clear: (subtopicId: string): void => {
    localStorage.removeItem(`${STORAGE_KEYS.CHAT_HISTORY}-${subtopicId}`);
  },

  clearAll: (): void => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_KEYS.CHAT_HISTORY)) {
        localStorage.removeItem(key);
      }
    });
  },
};

// Practice questions storage
export const practiceQuestionsStorage = {
  get: (subtopicId: string): PracticeQuestions | null => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEYS.PRACTICE_QUESTIONS}-${subtopicId}`);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  set: (subtopicId: string, questions: PracticeQuestions): void => {
    try {
      localStorage.setItem(`${STORAGE_KEYS.PRACTICE_QUESTIONS}-${subtopicId}`, JSON.stringify(questions));
    } catch (error) {
      console.error('Failed to cache practice questions:', error);
    }
  },

  add: (subtopicId: string, newQuestions: PracticeQuestions): void => {
    const existing = practiceQuestionsStorage.get(subtopicId);
    if (existing) {
      const combined = {
        ...existing,
        questions: [...existing.questions, ...newQuestions.questions],
        generatedAt: new Date().toISOString(),
      };
      practiceQuestionsStorage.set(subtopicId, combined);
    } else {
      practiceQuestionsStorage.set(subtopicId, newQuestions);
    }
  },

  clear: (subtopicId: string): void => {
    localStorage.removeItem(`${STORAGE_KEYS.PRACTICE_QUESTIONS}-${subtopicId}`);
  },

  clearAll: (): void => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_KEYS.PRACTICE_QUESTIONS)) {
        localStorage.removeItem(key);
      }
    });
  },
};

// Global cache management
export const cacheManager = {
  clearUnit: (unitId: string): void => {
    subtopicsStorage.clear(unitId);
    contentStorage.clearByUnit(unitId);
    // Chat history is kept per subtopic, would need mapping to clear by unit
  },

  clearAll: (): void => {
    subtopicsStorage.clearAll();
    contentStorage.clearAll();
    chatStorage.clearAll();
    practiceQuestionsStorage.clearAll();
  },

  getSize: (): string => {
    let totalSize = 0;
    for (const key in localStorage) {
      if (key.startsWith('learning-app-')) {
        totalSize += localStorage[key].length;
      }
    }
    return `${(totalSize / 1024).toFixed(1)} KB`;
  },
};
