# 📊 Logging System Documentation

## Overview

The Gym Management System includes a comprehensive, centralized logging system that tracks all application operations, errors, and user actions. This logging infrastructure helps with debugging, monitoring, and maintaining code quality.

---

## 🎯 Features

### 1. **Multiple Log Levels**
- **DEBUG**: Detailed information for development and debugging
- **INFO**: General informational messages about application flow
- **WARN**: Warning messages for potentially harmful situations
- **ERROR**: Error messages for serious issues that need attention

### 2. **Structured Logging**
- Timestamp for every log entry
- Context information (user, service, action)
- Error stack traces
- Performance metrics

### 3. **Log History**
- Stores last 1000 log entries in memory
- Export logs as JSON
- Query log history

### 4. **Performance Tracking**
- Measure operation duration
- Log API request/response times
- Track database query performance

---

## 📝 Usage Examples

### Basic Logging

```typescript
import { logger } from '@/utils/logger';

// Info level
logger.info('User profile loaded', {
  userId: '123',
  component: 'ProfilePage'
});

// Debug level (only in development)
logger.debug('Fetching user data', {
  userId: '123',
  endpoint: '/api/users/123'
});

// Warning level
logger.warn('API rate limit approaching', {
  remaining: 10,
  limit: 100
});

// Error level
logger.error('Failed to save data', error, {
  userId: '123',
  action: 'saveProfile'
});
```

### Service Logging

```typescript
import { logService } from '@/utils/logger';

// Initialize service
logService.init('memberService');

// Log service operation
logService.operation('memberService', 'createMember', {
  memberEmail: 'john@example.com'
});

// Log service error
logService.error('memberService', 'createMember', error, {
  memberEmail: 'john@example.com'
});
```

### User Action Logging

```typescript
import { logger } from '@/utils/logger';

// Log user actions
logger.logAction('Create Bill', userId, {
  billAmount: 500,
  component: 'BillingPage'
});

logger.logAction('Update Member', userId, {
  memberId: 'mem123',
  fields: ['name', 'email']
});
```

### Authentication Logging

```typescript
import { logger } from '@/utils/logger';

// Login event
logger.logAuth('login', userId, {
  email: 'user@example.com',
  userRole: 'admin'
});

// Logout event
logger.logAuth('logout', userId);

// Failed login
logger.logAuth('failed', undefined, {
  email: 'user@example.com',
  reason: 'Invalid credentials'
});

// Registration
logger.logAuth('register', userId, {
  email: 'newuser@example.com'
});
```

### Firebase Operation Logging

```typescript
import { logger } from '@/utils/logger';

// Before Firebase query
logger.logFirebaseOperation('query', 'members', {
  filters: { status: 'active' }
});

// Before Firebase write
logger.logFirebaseOperation('create', 'bills', {
  billId: 'bill123'
});

// Before Firebase update
logger.logFirebaseOperation('update', 'dietPlans', {
  planId: 'plan456'
});
```

### API Request/Response Logging

```typescript
import { logger } from '@/utils/logger';

// Log API request
logger.logApiRequest('POST', '/api/members', {
  component: 'MemberForm'
});

// Log API response
logger.logApiResponse('POST', '/api/members', 200, 350, {
  component: 'MemberForm',
  memberId: 'mem789'
});
```

### Performance Measurement

```typescript
import { logger } from '@/utils/logger';

// Measure async operation
const result = await logger.measure(
  'Fetch Dashboard Data',
  async () => {
    const stats = await getDashboardStats();
    const revenue = await getRevenueData();
    return { stats, revenue };
  },
  { component: 'AdminDashboard' }
);

// Automatically logs start, completion with duration, or error
```

---

## 🏗️ Implementation in Services

### Example: Member Service

```typescript
// src/services/member/memberService.ts
import { logger } from '../../utils/logger';

export async function createMember(memberData: CreateMemberRequest) {
  logger.info('Creating new member', {
    service: 'memberService',
    action: 'createMember',
    email: memberData.email
  });

  try {
    logger.logFirebaseOperation('create', 'members', {
      email: memberData.email
    });

    const docRef = await addDoc(collection(db, 'members'), {
      ...memberData,
      createdAt: Timestamp.now()
    });

    logger.info('Member created successfully', {
      service: 'memberService',
      memberId: docRef.id,
      email: memberData.email
    });

    return docRef.id;
  } catch (error) {
    logger.error('Failed to create member', error, {
      service: 'memberService',
      action: 'createMember',
      email: memberData.email
    });
    throw error;
  }
}
```

### Example: AI Chat Service

```typescript
// src/services/core/ai/aiChatService.ts
import { logger } from '../../../utils/logger';

export async function chat(message: string, userId?: string) {
  logger.info('Chat request received', {
    service: 'aiChatService',
    userId,
    messageLength: message.length
  });

  return logger.measure('AI Chat Processing', async () => {
    try {
      const intent = detectIntent(message);
      logger.debug('Intent detected', { intent });

      const context = await getContextForIntent(intent, userId);
      const answer = await sendToGemini(prompt);

      logger.info('Chat request completed', {
        service: 'aiChatService',
        intent,
        responseLength: answer.length
      });

      return { answer, intent, success: true };
    } catch (error) {
      logger.error('Chat request failed', error, {
        service: 'aiChatService',
        userId
      });
      throw error;
    }
  }, { service: 'aiChatService' });
}
```

---

## 📊 Log Output Format

### Console Output (Development)

```
[INFO] User logged in
  🕐 Time: 2025-10-31T10:45:23.456Z
  📋 Context: {
    userId: "abc123",
    email: "admin@gym.com",
    userRole: "admin"
  }

[ERROR] Failed to fetch members
  🕐 Time: 2025-10-31T10:45:25.789Z
  📋 Context: {
    service: "memberService",
    action: "getMembers"
  }
  ❌ Error: Firebase permission denied
  📚 Stack: Error: Firebase permission denied
    at memberService.ts:45
    at ...
```

### JSON Export Format

```json
[
  {
    "timestamp": "2025-10-31T10:45:23.456Z",
    "level": "INFO",
    "message": "User logged in",
    "context": {
      "userId": "abc123",
      "email": "admin@gym.com",
      "userRole": "admin"
    }
  },
  {
    "timestamp": "2025-10-31T10:45:25.789Z",
    "level": "ERROR",
    "message": "Failed to fetch members",
    "context": {
      "service": "memberService",
      "action": "getMembers"
    },
    "error": {
      "name": "Error",
      "message": "Firebase permission denied",
      "stack": "Error: Firebase permission denied\\n    at memberService.ts:45\\n    at ..."
    }
  }
]
```

---

## 🔧 Configuration

### Set Log Level

```typescript
import { logger, LogLevel } from '@/utils/logger';

// Set minimum log level
logger.setLogLevel(LogLevel.INFO); // Only INFO, WARN, ERROR
logger.setLogLevel(LogLevel.DEBUG); // All levels
logger.setLogLevel(LogLevel.ERROR); // Only errors
logger.setLogLevel(LogLevel.NONE); // Disable logging
```

### Enable/Disable Console Output

```typescript
import { logger } from '@/utils/logger';

// Disable console output (still stores in history)
logger.setConsoleEnabled(false);

// Enable console output
logger.setConsoleEnabled(true);
```

### Environment-Based Configuration

The logger automatically adjusts based on environment:

```typescript
// Development: LogLevel.DEBUG (all logs)
// Production: LogLevel.INFO (INFO, WARN, ERROR only)
```

---

## 📈 Monitoring & Analytics

### Get Log History

```typescript
import { logger } from '@/utils/logger';

// Get all logs
const allLogs = logger.getHistory();

// Get last 50 logs
const recentLogs = logger.getHistory(50);

// Export logs as JSON
const logsJson = logger.exportLogs();

// Clear log history
logger.clearHistory();
```

### Log Analysis

```typescript
// Count errors in last hour
const oneHourAgo = Date.now() - 3600000;
const errors = logger.getHistory()
  .filter(log => 
    log.level === 'ERROR' && 
    new Date(log.timestamp).getTime() > oneHourAgo
  );

console.log(`Errors in last hour: ${errors.length}`);
```

---

## 🎯 Best Practices

### 1. **Always Include Context**

```typescript
// ❌ Bad
logger.error('Failed', error);

// ✅ Good
logger.error('Failed to create member', error, {
  service: 'memberService',
  action: 'createMember',
  userId: currentUser.id
});
```

### 2. **Use Appropriate Log Levels**

```typescript
// DEBUG: Development details
logger.debug('Processing payment', { amount, method });

// INFO: Normal operations
logger.info('Payment processed', { paymentId, amount });

// WARN: Unusual but not error
logger.warn('Payment took longer than expected', { duration: 5000 });

// ERROR: Actual errors
logger.error('Payment failed', error, { paymentId });
```

### 3. **Log Before and After Critical Operations**

```typescript
logger.info('Starting bill creation', { userId, amount });
try {
  const billId = await createBill(data);
  logger.info('Bill created successfully', { billId, amount });
} catch (error) {
  logger.error('Bill creation failed', error, { userId, amount });
}
```

### 4. **Use Performance Measurement for Slow Operations**

```typescript
// Automatically logs duration
const data = await logger.measure(
  'Load Dashboard Data',
  () => fetchDashboardData(),
  { component: 'Dashboard' }
);
```

### 5. **Include User Context When Available**

```typescript
logger.info('Action performed', {
  userId: user.uid,
  userEmail: user.email,
  userRole: user.role,
  action: 'updateProfile'
});
```

---

## 🐛 Debugging with Logs

### View Logs in Browser Console

Open Developer Tools → Console, and you'll see formatted logs with expandable context.

### Export Logs for Analysis

```typescript
// In browser console
const logs = window.logger.exportLogs();
console.log(logs); // Copy and paste to file
```

### Filter Logs by Service

```typescript
const memberServiceLogs = logger.getHistory()
  .filter(log => log.context?.service === 'memberService');
```

---

## 🚀 Production Considerations

### 1. **Log Levels**
- Production automatically uses `LogLevel.INFO`
- Reduces noise while keeping important events

### 2. **Performance**
- Log history limited to 1000 entries
- Minimal overhead with smart filtering

### 3. **Privacy**
- Never log sensitive data (passwords, tokens)
- Sanitize user data in logs

### 4. **Error Tracking**
- Consider integrating with Sentry or similar
- Use logger as foundation

---

## 📚 Files with Logging Implemented

### Already Updated:
- ✅ `src/utils/logger.ts` - Core logging utility
- ✅ `src/services/core/ai/aiChatService.ts` - AI chat service
- ✅ `src/services/auth/authService.ts` - Authentication service

### To Update (Recommended):
- `src/services/member/memberService.ts` - Member operations
- `src/services/billing/billService.ts` - Billing operations
- `src/services/diet/dietService.ts` - Diet plan operations
- `src/services/fitness/classService.ts` - Class operations
- `src/services/notification/notificationService.ts` - Notifications
- All component files with user actions

---

## 📝 Summary

The logging system provides:
- ✅ Structured logging with context
- ✅ Multiple log levels (DEBUG, INFO, WARN, ERROR)
- ✅ Performance tracking
- ✅ Firebase operation tracking
- ✅ Authentication event tracking
- ✅ API request/response logging
- ✅ Log history and export
- ✅ Development and production modes

**Start using it everywhere for better debugging and monitoring!** 🎉
