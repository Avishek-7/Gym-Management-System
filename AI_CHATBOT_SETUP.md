# AI ChatBot Setup Guide

## 🤖 Overview

The Gym Management System now includes an AI-powered chatbot using **Google's Gemini API**. The chatbot can help users with:

- 💰 Billing & Payment queries
- 🍎 Diet plan information
- 🏋️ Workout & class schedules
- 📋 Membership packages
- 💊 Supplement information
- 🎯 General fitness questions

---

## 🔧 Setup Instructions

### 1. Get Google Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Get API Key"** or **"Create API Key"**
4. Copy your API key (it starts with `AIza...`)

### 2. Configure Environment Variables

Add the following to your `.env` file in the root directory:

```env
# Google Gemini AI API Key
VITE_GOOGLE_GEMINI_API_KEY=your_api_key_here
```

**Example:**
```env
VITE_GOOGLE_GEMINI_API_KEY=AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Restart Development Server

After adding the API key, restart your development server:

```bash
npm run dev
```

---

## 📁 File Structure

```
src/
├── components/
│   └── ai/
│       └── chatBot.tsx              # Main ChatBot UI component
├── services/
│   └── core/
│       └── ai/
│           ├── aiChatService.ts     # Google Gemini API integration
│           └── intentDetector.ts    # Intent detection logic
└── pages/
    ├── admin/AdminDashboard.tsx     # ChatBot integrated ✅
    ├── member/MemberDashboard.tsx   # ChatBot integrated ✅
    └── trainer/TrainerDashboard.tsx # ChatBot integrated ✅
```

---

## 🎨 Features

### 1. **Floating Chat Button**
- Located at bottom-right corner of dashboards
- Click to open/close chat window
- Animated hover effects

### 2. **Smart Intent Detection**
The chatbot automatically detects user intent and fetches relevant context:
- **Bill/Payment** → Fetches user's bills
- **Diet** → Fetches user's diet plans
- **Class** → Fetches available gym classes
- **Membership** → Fetches membership packages
- **Workout** → General fitness advice
- **Supplement** → Supplement information

### 3. **Context-Aware Responses**
- Personalized responses based on user data
- Conversation history for context
- Role-based information (Admin, Trainer, Member)

### 4. **Modern UI**
- Dark theme with glass-morphism design
- Smooth animations
- Message timestamps
- Typing indicators
- Responsive layout

---

## 🔒 Security Considerations

### API Key Protection
- ✅ API key stored in environment variables
- ✅ Never commit `.env` file to version control
- ✅ Add `.env` to `.gitignore`

### Firestore Security
- ✅ Role-based data access enforced
- ✅ Users can only access their own data
- ✅ Context fetching respects user permissions

---

## 🧪 Testing the ChatBot

### Sample Questions to Try:

**Billing:**
- "What are my pending bills?"
- "When is my next payment due?"
- "Show my billing history"

**Diet:**
- "What's my diet plan?"
- "Show my nutrition goals"
- "What should I eat today?"

**Classes:**
- "What classes are available?"
- "Show me yoga classes"
- "When is my next class?"

**Membership:**
- "What membership packages do you offer?"
- "How much does membership cost?"
- "What's included in the premium package?"

**General:**
- "How do I lose weight?"
- "What exercises should I do for abs?"
- "How many calories should I eat?"

---

## 🐛 Troubleshooting

### Issue: "Google Gemini API key is not configured"

**Solution:**
1. Check if `VITE_GOOGLE_GEMINI_API_KEY` is in your `.env` file
2. Ensure the variable name is **exactly** `VITE_GOOGLE_GEMINI_API_KEY`
3. Restart your dev server after adding the key

### Issue: API returns 400/403 error

**Solution:**
1. Verify your API key is valid
2. Check if you've enabled the Gemini API in Google Cloud Console
3. Ensure you haven't exceeded the free tier quota

### Issue: ChatBot not showing

**Solution:**
1. Check browser console for errors
2. Ensure you're logged in
3. Clear browser cache and reload

### Issue: No context data in responses

**Solution:**
1. Check Firestore security rules
2. Verify user has data in collections (bills, dietPlans, etc.)
3. Check browser console for Firestore permission errors

---

## 📊 API Usage & Limits

### Google Gemini Free Tier:
- **60 requests per minute**
- **1,500 requests per day**
- **1 million tokens per minute**

For production use, consider upgrading to a paid plan.

---

## 🚀 Advanced Configuration

### Customizing AI Responses

Edit `src/services/core/ai/aiChatService.ts`:

```typescript
// Adjust temperature for creativity (0.0-1.0)
temperature: 0.7,  // Lower = more focused, Higher = more creative

// Adjust max response length
maxOutputTokens: 1024,  // Increase for longer responses
```

### Adding New Intents

Edit `src/services/core/ai/intentDetector.ts`:

```typescript
{
  intent: 'new_intent',
  keywords: ['keyword1', 'keyword2', 'keyword3'],
}
```

Then add context fetching logic in `aiChatService.ts` in the `getContextForIntent()` function.

---

## 📝 Notes

- The chatbot uses **Google Gemini Pro** model by default
- Conversation history is stored in component state (not persisted)
- All database queries respect Firestore security rules
- Context is limited to the last 5 messages for efficiency

---

## 🎉 Success!

Your AI ChatBot is now ready to use! Open any dashboard and click the floating chat button in the bottom-right corner.

For questions or issues, refer to:
- [Google Gemini API Docs](https://ai.google.dev/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- Project README.md
