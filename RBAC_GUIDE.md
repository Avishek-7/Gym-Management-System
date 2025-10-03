# Role-Based Access Control (RBAC) Implementation Guide

## 🎉 Implementation Complete!

This guide explains how to use the newly implemented role-based access control system in your Gym Management application.

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [Role System](#role-system)
3. [AuthContext with Roles](#authcontext-with-roles)
4. [useRole Hook](#userole-hook)
5. [Protected Routes](#protected-routes)
6. [Firestore Security Rules](#firestore-security-rules)
7. [Usage Examples](#usage-examples)
8. [Deployment](#deployment)

---

## Overview

The RBAC system provides:
- ✅ **Three roles**: `admin`, `member`, `trainer`
- ✅ **AuthContext with role information** - Global access to user role
- ✅ **useRole hook** - Easy role checking in components
- ✅ **ProtectedRoute component** - Route-level authorization
- ✅ **Firestore Security Rules** - Backend security

---

## Role System

### Available Roles

```typescript
type UserRole = 'admin' | 'member' | 'trainer';
```

### Role Descriptions

| Role | Description | Access Level |
|------|-------------|--------------|
| **admin** | System administrator | Full access to all features |
| **member** | Gym member | Access to own data only |
| **trainer** | Gym trainer/instructor | Manage classes and attendance |

### Default Role

When a new user registers, they are automatically assigned the **`member`** role.

---

## AuthContext with Roles

The `AuthContext` now includes role information:

```typescript
interface AuthContextType {
  user: FirebaseUser | null;
  userRole: UserRole | null;          // Current user's role
  loading: boolean;
  isAdmin: boolean;                    // Quick check if admin
  isMember: boolean;                   // Quick check if member
  isTrainer: boolean;                  // Quick check if trainer
  hasRole: (role: UserRole | UserRole[]) => boolean;  // Check specific role(s)
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}
```

### How It Works

1. **User logs in** → Firebase authentication
2. **AuthContext fetches role** → From Firestore `userRoles` collection
3. **Role is cached** → Available globally through context
4. **On logout** → Role is cleared

---

## useRole Hook

### Import

```typescript
import { useRole } from '../hooks/useRole';
```

### Usage

```typescript
const MyComponent = () => {
  const { role, isAdmin, isMember, isTrainer, hasRole, hasAnyRole } = useRole();

  // Check specific role
  if (isAdmin) {
    return <AdminPanel />;
  }

  // Check multiple roles
  if (hasRole(['admin', 'trainer'])) {
    return <ManageClasses />;
  }

  // Check if user has any role
  if (!hasAnyRole) {
    return <RoleNotAssigned />;
  }

  return <MemberView />;
};
```

### Available Properties

```typescript
{
  role: UserRole | null;              // 'admin' | 'member' | 'trainer' | null
  isAdmin: boolean;                   // true if role === 'admin'
  isMember: boolean;                  // true if role === 'member'
  isTrainer: boolean;                 // true if role === 'trainer'
  hasRole: (role) => boolean;         // Check specific role(s)
  hasAnyRole: boolean;                // true if role is assigned
}
```

---

## Protected Routes

### Import

```typescript
import { ProtectedRoute } from './components/auth/ProtectedRoute';
```

### Basic Usage

#### 1. Require Authentication Only

```tsx
<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } 
/>
```

#### 2. Require Specific Role

```tsx
<Route 
  path="/admin/dashboard" 
  element={
    <ProtectedRoute requiredRole="admin">
      <AdminDashboard />
    </ProtectedRoute>
  } 
/>
```

#### 3. Require Multiple Roles

```tsx
<Route 
  path="/manage-classes" 
  element={
    <ProtectedRoute requiredRole={['admin', 'trainer']}>
      <ManageClasses />
    </ProtectedRoute>
  } 
/>
```

#### 4. Custom Redirects

```tsx
<ProtectedRoute 
  requiredRole="admin"
  redirectTo="/login"                    // If not authenticated
  unauthorizedRedirect="/member/dashboard" // If wrong role
>
  <AdminPanel />
</ProtectedRoute>
```

### Protected Route Behavior

| Scenario | Behavior |
|----------|----------|
| Not authenticated | Redirect to `/login` |
| No role assigned | Show error message |
| Wrong role | Redirect to `/unauthorized` |
| Correct role | Render component |
| Loading | Show loading spinner |

---

## Firestore Security Rules

### Deployment

The Firestore security rules are defined in `firestore.rules`. To deploy:

```bash
# Deploy security rules to Firebase
firebase deploy --only firestore:rules
```

### Rule Structure

```javascript
// Helper Functions
function isAuthenticated()       // Check if user is logged in
function getUserRole(userId)     // Get user's role
function hasRole(role)          // Check if user has specific role
function isAdmin()              // Check if user is admin
function isMember()             // Check if user is member
function isTrainer()            // Check if user is trainer
function isOwner(userId)        // Check if accessing own data
```

### Collection Rules Summary

| Collection | Read | Write | Notes |
|------------|------|-------|-------|
| **userRoles** | Own role, Admin | Admin only | Role assignments |
| **members** | All auth users | Admin only | Member profiles |
| **bills** | Own bills, Admin | Admin only | Billing records |
| **subscriptions** | Own subs, Admin | Admin only | Subscription data |
| **payments** | Own payments, Admin | Admin only | Payment records |
| **receipts** | Own receipts, Admin | Admin only | Receipt documents |
| **notifications** | Own notifs, Admin | Admin/Trainer create | Notifications |
| **classes** | All auth users | Admin/Trainer | Class schedules |
| **attendance** | Own/Admin/Trainer | Admin/Trainer | Attendance records |
| **inventory** | All auth users | Admin only | Equipment inventory |
| **reports** | Admin only | Admin only | System reports |
| **analytics** | Admin only | Admin only | Analytics data |
| **trainers** | All auth users | Admin/Own profile | Trainer profiles |
| **memberships** | All auth users | Admin only | Membership types |
| **userProfiles** | Own/Admin | Own/Admin | User profiles |

### Testing Security Rules

```bash
# Run Firebase emulator with security rules
firebase emulators:start

# Test rules in Firebase Console
# Go to Firestore > Rules > Playground
```

---

## Usage Examples

### Example 1: Protected Admin Component

```tsx
// components/admin/AdminPanel.tsx
import React from 'react';
import { useRole } from '../../hooks/useRole';

const AdminPanel: React.FC = () => {
  const { isAdmin } = useRole();

  // Double-check role in component (defense in depth)
  if (!isAdmin) {
    return (
      <div className="p-4 bg-red-500/20 text-red-400 rounded">
        Access Denied: Admin role required
      </div>
    );
  }

  return (
    <div>
      <h1>Admin Panel</h1>
      {/* Admin features */}
    </div>
  );
};

export default AdminPanel;
```

### Example 2: Conditional UI Rendering

```tsx
// components/Dashboard.tsx
import React from 'react';
import { useRole } from '../hooks/useRole';

const Dashboard: React.FC = () => {
  const { isAdmin, isMember, isTrainer, role } = useRole();

  return (
    <div>
      <h1>Dashboard</h1>
      
      {/* Show role badge */}
      <span className="badge">{role}</span>

      {/* Admin-only section */}
      {isAdmin && (
        <div>
          <h2>Admin Tools</h2>
          <button>Manage Members</button>
          <button>View Reports</button>
        </div>
      )}

      {/* Trainer section */}
      {isTrainer && (
        <div>
          <h2>Trainer Tools</h2>
          <button>Manage Classes</button>
          <button>Mark Attendance</button>
        </div>
      )}

      {/* Member section */}
      {isMember && (
        <div>
          <h2>My Profile</h2>
          <button>View Bills</button>
          <button>Book Classes</button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
```

### Example 3: Role-Based Navigation

```tsx
// components/Navigation.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useRole } from '../hooks/useRole';

const Navigation: React.FC = () => {
  const { isAdmin, isTrainer, hasRole } = useRole();

  return (
    <nav>
      <Link to="/">Home</Link>
      
      {/* Admin links */}
      {isAdmin && (
        <>
          <Link to="/admin/dashboard">Admin Dashboard</Link>
          <Link to="/admin/members">Manage Members</Link>
          <Link to="/admin/reports">Reports</Link>
        </>
      )}

      {/* Trainer links */}
      {isTrainer && (
        <>
          <Link to="/trainer/classes">My Classes</Link>
          <Link to="/trainer/attendance">Attendance</Link>
        </>
      )}

      {/* Links for admin and trainer */}
      {hasRole(['admin', 'trainer']) && (
        <Link to="/manage-schedule">Manage Schedule</Link>
      )}
    </nav>
  );
};

export default Navigation;
```

### Example 4: Service with Role Check

```tsx
// services/member/memberService.ts
import { hasUserRole } from '../auth/roleService';

export const deleteMember = async (
  memberId: string,
  currentUserId: string
): Promise<void> => {
  // Verify user is admin before deleting
  const isAdmin = await hasUserRole(currentUserId, 'admin');
  
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin role required to delete members');
  }

  // Proceed with deletion
  await deleteDoc(doc(db, 'members', memberId));
};
```

### Example 5: Role-Based Data Fetching

```tsx
// components/BillHistory.tsx
import { useRole } from '../../hooks/useRole';
import { useAuth } from '../../hooks/useAuth';

const BillHistory: React.FC = () => {
  const { isAdmin } = useRole();
  const { user } = useAuth();

  const fetchBills = async () => {
    if (isAdmin) {
      // Admin: fetch all bills
      return await getAllBills();
    } else if (user) {
      // Member: fetch only their bills
      return await getUserBills(user.uid);
    }
  };

  // ... rest of component
};
```

---

## Deployment

### Step 1: Deploy Firestore Rules

```bash
# Make sure you're logged in to Firebase
firebase login

# Deploy security rules
firebase deploy --only firestore:rules
```

### Step 2: Verify Rules Deployment

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database** > **Rules**
4. Verify the rules are updated

### Step 3: Test in Production

```typescript
// Test scenarios:
1. Try to access admin routes as member → Should redirect to /unauthorized
2. Try to read other user's bills → Should be blocked by Firestore
3. Try to update member data as non-admin → Should fail
4. Login as admin → Should access all features
```

### Step 4: Monitor Security

```bash
# View Firestore security rule logs
firebase projects:list
firebase use <your-project-id>
firebase firestore:indexes
```

---

## Common Patterns

### Pattern 1: Role-Required Component Wrapper

```tsx
// components/common/RoleRequired.tsx
import React from 'react';
import { useRole } from '../../hooks/useRole';
import type { UserRole } from '../../services/auth/roleService';

interface RoleRequiredProps {
  roles: UserRole | UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleRequired: React.FC<RoleRequiredProps> = ({
  roles,
  children,
  fallback = <div>Access Denied</div>
}) => {
  const { hasRole } = useRole();

  if (!hasRole(roles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Usage:
<RoleRequired roles="admin">
  <AdminPanel />
</RoleRequired>

<RoleRequired roles={['admin', 'trainer']}>
  <ManageClasses />
</RoleRequired>
```

### Pattern 2: Higher-Order Component (HOC)

```tsx
// hoc/withRoleCheck.tsx
import React from 'react';
import { useRole } from '../hooks/useRole';
import type { UserRole } from '../services/auth/roleService';

export function withRoleCheck<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole: UserRole | UserRole[]
) {
  return (props: P) => {
    const { hasRole } = useRole();

    if (!hasRole(requiredRole)) {
      return <div>Access Denied</div>;
    }

    return <Component {...props} />;
  };
}

// Usage:
const AdminPanel = withRoleCheck(AdminPanelComponent, 'admin');
```

---

## Troubleshooting

### Issue: Role not showing after login

**Solution:**
```typescript
// Check if role exists in Firestore
import { getUserRole } from './services/auth/roleService';

const role = await getUserRole(userId);
console.log('User role:', role);
```

### Issue: Firestore permission denied

**Solution:**
1. Check if security rules are deployed: `firebase deploy --only firestore:rules`
2. Verify user is authenticated
3. Check role in Firestore `userRoles` collection
4. Test rules in Firebase Console > Firestore > Rules > Playground

### Issue: Loading indefinitely

**Solution:**
```typescript
// Add error boundary in AuthContext
try {
  const role = await getUserRole(firebaseUser.uid);
  setUserRole(role);
} catch (error) {
  console.error('Error fetching role:', error);
  setUserRole(null);
} finally {
  setLoading(false);
}
```

---

## Best Practices

1. ✅ **Always use ProtectedRoute for sensitive pages**
2. ✅ **Add role checks in components (defense in depth)**
3. ✅ **Verify roles on backend (Firestore rules)**
4. ✅ **Use service-level authorization for CRUD operations**
5. ✅ **Show appropriate error messages for unauthorized access**
6. ✅ **Log authorization failures for security monitoring**
7. ✅ **Test all role scenarios before production**
8. ✅ **Keep roles simple and well-defined**
9. ✅ **Document which features require which roles**
10. ✅ **Regular security audits**

---

## Security Checklist

- [ ] Firestore security rules deployed
- [ ] All admin routes use ProtectedRoute
- [ ] All admin components check role
- [ ] Services verify role before operations
- [ ] Sensitive data queries filtered by userId
- [ ] Error messages don't expose system details
- [ ] Logging configured for unauthorized access
- [ ] Tested all role combinations
- [ ] Documentation updated
- [ ] Team trained on RBAC system

---

## Next Steps

1. **Create Role-Based Dashboards**
   - `/admin/dashboard` - Admin features
   - `/member/dashboard` - Member features
   - `/trainer/dashboard` - Trainer features

2. **Implement Role Assignment UI**
   - Admin panel to assign/change user roles
   - Role management interface

3. **Add Audit Logging**
   - Log role changes
   - Log unauthorized access attempts
   - Monitor security events

4. **Create Role-Based Analytics**
   - Track feature usage by role
   - Monitor access patterns

---

## Support

For questions or issues:
- Check `ROLE_AUDIT.md` for implementation status
- Review Firestore rules in `firestore.rules`
- Test with Firebase emulator locally
- Contact: support@gymfit.com

---

**Last Updated:** October 3, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
