# 🚀 RBAC Quick Reference

## Import Statements

```typescript
// Hook
import { useRole } from '../hooks/useRole';

// Component
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Types
import type { UserRole } from './services/auth/roleService';

// Service Functions
import { 
  getUserRole, 
  ensureUserRole, 
  hasUserRole,
  assignUserRole 
} from './services/auth/roleService';
```

---

## useRole Hook

```typescript
const { role, isAdmin, isMember, isTrainer, hasRole, hasAnyRole } = useRole();

if (isAdmin) { /* admin only */ }
if (isMember) { /* member only */ }
if (isTrainer) { /* trainer only */ }
if (hasRole(['admin', 'trainer'])) { /* admin or trainer */ }
```

---

## Protected Routes

```tsx
// Authentication only
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>

// Single role
<ProtectedRoute requiredRole="admin">
  <AdminPanel />
</ProtectedRoute>

// Multiple roles
<ProtectedRoute requiredRole={['admin', 'trainer']}>
  <ManageClasses />
</ProtectedRoute>
```

---

## Conditional Rendering

```tsx
{isAdmin && <AdminTools />}
{isMember && <MemberProfile />}
{hasRole(['admin', 'trainer']) && <ManageButton />}
```

---

## Service-Level Checks

```typescript
const isAdmin = await hasUserRole(userId, 'admin');
if (!isAdmin) throw new Error('Unauthorized');
```

---

## Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

---

## Role Hierarchy

| Role | Level | Description |
|------|-------|-------------|
| admin | 3 | Full access |
| trainer | 2 | Manage classes |
| member | 1 | Own data only |

---

## Common Patterns

### Pattern 1: Role Badge
```tsx
<span className={role === 'admin' ? 'badge-admin' : 'badge-member'}>
  {role}
</span>
```

### Pattern 2: Role-Based Navigation
```tsx
const dashboardPath = isAdmin ? '/admin' : isMember ? '/member' : '/trainer';
navigate(dashboardPath);
```

### Pattern 3: Fallback UI
```tsx
{isAdmin ? <AdminView /> : <RestrictedView />}
```

---

## Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Role is null | Check Firestore `userRoles` collection |
| Permission denied | Deploy Firestore rules |
| Infinite loading | Check error in console, verify auth state |
| Wrong redirect | Check `requiredRole` in ProtectedRoute |

---

## Security Checklist

- [ ] ProtectedRoute on all sensitive routes
- [ ] Role check in components
- [ ] Firestore rules deployed
- [ ] Service-level authorization
- [ ] Error handling for unauthorized access

---

**Quick Start:**
1. Use `useRole()` in components
2. Wrap routes with `<ProtectedRoute>`
3. Deploy firestore rules
4. Test all role scenarios

**Docs:** See `RBAC_GUIDE.md` for full documentation
