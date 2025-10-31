import { db } from '../firebase';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { detectIntent, type Intent } from './intentDetector';
import { logger } from '../../../utils/logger';

const GOOGLE_GEMINI_API_KEY = import.meta.env.VITE_GOOGLE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatResponse {
  answer: string;
  intent: Intent;
  success: boolean;
  error?: string;
}

/**
 * Fetch context from Firestore based on detected intent
 */
async function getContextForIntent(intent: Intent, userId?: string): Promise<string> {
  logger.debug('Fetching context for intent', { intent, userId, service: 'aiChatService' });
  
  try {
    switch (intent) {
      case 'bill':
      case 'payment': {
        if (userId) {
          logger.logFirebaseOperation('query', 'bills', { userId });
          const billsQuery = query(
            collection(db, 'bills'),
            where('userId', '==', userId),
            limit(5)
          );
          const snapshot = await getDocs(billsQuery);
          const bills = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              amount: data.amount,
              status: data.status,
              dueDate: data.dueDate?.toDate?.()?.toLocaleDateString() || 'N/A',
            };
          });
          logger.info('Bills context fetched', { billCount: bills.length, userId });
          return bills.length > 0
            ? `Recent bills: ${JSON.stringify(bills)}`
            : 'No billing information available.';
        }
        return 'Please login to view billing information.';
      }

      case 'diet': {
        if (userId) {
          logger.logFirebaseOperation('query', 'dietPlans', { userId });
          const dietQuery = query(
            collection(db, 'dietPlans'),
            where('memberId', '==', userId),
            limit(3)
          );
          const snapshot = await getDocs(dietQuery);
          const plans = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              name: data.name,
              goal: data.goal,
              totalCalories: data.totalCalories,
            };
          });
          logger.info('Diet plans context fetched', { planCount: plans.length, userId });
          return plans.length > 0
            ? `Your diet plans: ${JSON.stringify(plans)}`
            : 'No diet plans assigned yet.';
        }
        return 'Please login to view diet information.';
      }

      case 'class': {
        logger.logFirebaseOperation('query', 'gymClasses');
        const classesQuery = query(
          collection(db, 'gymClasses'),
          where('isActive', '==', true),
          limit(5)
        );
        const snapshot = await getDocs(classesQuery);
        const classes = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            name: data.name,
            trainer: data.trainerName || data.instructor,
            capacity: data.capacity,
            duration: data.duration,
          };
        });
        logger.info('Classes context fetched', { classCount: classes.length });
        return classes.length > 0
          ? `Available classes: ${JSON.stringify(classes)}`
          : 'No active classes available.';
      }

      case 'membership': {
        logger.logFirebaseOperation('query', 'packages');
        const packagesQuery = query(collection(db, 'packages'), limit(5));
        const snapshot = await getDocs(packagesQuery);
        const packages = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            name: data.name,
            price: data.price,
            duration: data.durationDays,
            features: data.features?.slice(0, 3),
          };
        });
        logger.info('Packages context fetched', { packageCount: packages.length });
        return packages.length > 0
          ? `Available packages: ${JSON.stringify(packages)}`
          : 'No membership packages available.';
      }

      case 'workout':
      case 'general':
      default:
        logger.debug('Using generic context for intent', { intent });
        return 'I can help you with billing, diet plans, classes, memberships, and general gym queries.';
    }
  } catch (error) {
    logger.error('Error fetching context for intent', error, { intent, userId });
    return 'Unable to fetch specific information at the moment.';
  }
}

/**
 * Send message to Google Gemini API
 */
async function sendToGemini(prompt: string): Promise<string> {
  if (!GOOGLE_GEMINI_API_KEY) {
    logger.error('Google Gemini API key not configured', new Error('Missing API key'), {
      service: 'aiChatService',
      action: 'sendToGemini',
    });
    throw new Error('Google Gemini API key is not configured');
  }

  logger.logApiRequest('POST', GEMINI_API_URL, { service: 'aiChatService' });
  const startTime = performance.now();

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GOOGLE_GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
        ],
      }),
    });

    const duration = Math.round(performance.now() - startTime);
    logger.logApiResponse('POST', GEMINI_API_URL, response.status, duration, {
      service: 'aiChatService',
    });

    if (!response.ok) {
      const errorData = await response.json();
      logger.error('Gemini API returned error response', new Error(`Status: ${response.status}`), {
        service: 'aiChatService',
        status: response.status,
        errorData,
      });
      throw new Error(`Gemini API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      logger.warn('No text response from Gemini API', { service: 'aiChatService', data });
      throw new Error('No response from Gemini API');
    }

    logger.info('Gemini API response received', {
      service: 'aiChatService',
      responseLength: text.length,
      duration,
    });

    return text;
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    logger.error('Gemini API request failed', error, {
      service: 'aiChatService',
      duration,
    });
    throw error;
  }
}

/**
 * Main chat function - process user message and return AI response
 */
export async function chat(
  message: string,
  userId?: string,
  conversationHistory: ChatMessage[] = []
): Promise<ChatResponse> {
  logger.info('Chat request received', {
    service: 'aiChatService',
    action: 'chat',
    userId,
    messageLength: message.length,
    historyLength: conversationHistory.length,
  });

  return logger.measure('AI Chat Processing', async () => {
    try {
      // Detect intent
      const intent = detectIntent(message);
      logger.debug('Intent detected', { intent, message: message.substring(0, 50) });

      // Get relevant context
      const context = await getContextForIntent(intent, userId);

      // Build conversation history for context
      const historyContext = conversationHistory
        .slice(-5) // Last 5 messages for context
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n');

      // Build prompt for Gemini
      const prompt = `You are FitBot, an AI-powered assistant for a Gym Management System.

Your role:
- Help users with gym-related queries about billing, payments, diet plans, workout classes, memberships, and general fitness questions
- Be friendly, professional, and concise in your responses
- Use the provided context to give accurate, personalized answers
- If you don't have specific information, provide helpful general guidance
- Keep responses under 150 words unless detailed explanation is needed

Context from Database:
${context}

${historyContext ? `Recent Conversation:\n${historyContext}\n` : ''}

User Question: ${message}

Provide a helpful, accurate response:`;

      // Get response from Gemini
      const answer = await sendToGemini(prompt);

      logger.info('Chat request completed successfully', {
        service: 'aiChatService',
        intent,
        userId,
        responseLength: answer.length,
      });

      return {
        answer,
        intent,
        success: true,
      };
    } catch (error) {
      logger.error('Chat request failed', error, {
        service: 'aiChatService',
        userId,
        message: message.substring(0, 100),
      });
      
      return {
        answer: "I'm sorry, I'm having trouble processing your request right now. Please try again later.",
        intent: 'general',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }, { service: 'aiChatService', action: 'chat' });
}


