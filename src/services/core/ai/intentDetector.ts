export type Intent = 
  | 'bill' 
  | 'payment' 
  | 'diet' 
  | 'workout' 
  | 'class' 
  | 'membership' 
  | 'attendance' 
  | 'supplement' 
  | 'general';

export interface IntentKeywords {
  intent: Intent;
  keywords: string[];
}

const intentKeywords: IntentKeywords[] = [
  {
    intent: 'bill',
    keywords: ['bill', 'invoice', 'charge', 'cost', 'owe', 'debt', 'balance'],
  },
  {
    intent: 'payment',
    keywords: ['payment', 'pay', 'paid', 'due', 'overdue', 'receipt', 'transaction'],
  },
  {
    intent: 'diet',
    keywords: ['diet', 'food', 'nutrition', 'meal', 'eating', 'calories', 'protein', 'carbs', 'fat'],
  },
  {
    intent: 'workout',
    keywords: ['workout', 'exercise', 'training', 'routine', 'fitness', 'lift', 'cardio', 'strength'],
  },
  {
    intent: 'class',
    keywords: ['class', 'session', 'schedule', 'yoga', 'pilates', 'zumba', 'spin', 'hiit', 'trainer'],
  },
  {
    intent: 'membership',
    keywords: ['membership', 'package', 'plan', 'subscription', 'join', 'enroll', 'price', 'pricing'],
  },
  {
    intent: 'attendance',
    keywords: ['attendance', 'checkin', 'check-in', 'present', 'absent', 'attend'],
  },
  {
    intent: 'supplement',
    keywords: ['supplement', 'protein powder', 'creatine', 'bcaa', 'pre-workout', 'vitamins', 'store'],
  },
];

/**
 * Detect intent from user question using keyword matching
 * Returns the most relevant intent based on keyword matches
 */
export function detectIntent(question: string): Intent {
  const q = question.toLowerCase();
  
  // Count matches for each intent
  const intentScores = intentKeywords.map(({ intent, keywords }) => {
    const matchCount = keywords.filter(keyword => q.includes(keyword)).length;
    return { intent, score: matchCount };
  });

  // Sort by score and get the highest
  intentScores.sort((a, b) => b.score - a.score);

  // Return the intent with highest score, or 'general' if no matches
  return intentScores[0].score > 0 ? intentScores[0].intent : 'general';
}

/**
 * Get related keywords for a given intent
 */
export function getKeywordsForIntent(intent: Intent): string[] {
  const found = intentKeywords.find(item => item.intent === intent);
  return found ? found.keywords : [];
}

