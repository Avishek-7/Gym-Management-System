# 🏗️ RBAC System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                              │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │  Login   │  │ Register │  │Dashboard │  │ Protected│          │
│  │  Page    │  │   Page   │  │   Page   │  │  Pages   │          │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘          │
└───────┼─────────────┼─────────────┼─────────────┼─────────────────┘
        │             │             │             │
        └─────────────┴─────────────┴─────────────┘
                      │
                      ▼
        ┌─────────────────────────────────────┐
        │      React Router with Routes       │
        │  • Public Routes (login, register)  │
        │  • Protected Routes (with guards)   │
        └─────────────┬───────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────────────┐
        │       ProtectedRoute Component      │
        │  • Checks authentication            │
        │  • Verifies required role           │
        │  • Redirects if unauthorized        │
        └─────────────┬───────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────────────┐
        │         AuthContext Provider        │
        │  • user (Firebase User)             │
        │  • userRole (admin/member/trainer)  │
        │  • isAdmin, isMember, isTrainer     │
        │  • hasRole(role)                    │
        └─────────────┬───────────────────────┘
                      │
          ┌───────────┼───────────┐
          │           │           │
          ▼           ▼           ▼
    ┌─────────┐ ┌─────────┐ ┌─────────┐
    │ useAuth │ │ useRole │ │Components│
    │  Hook   │ │  Hook   │ │          │
    └─────────┘ └─────────┘ └─────────┘
          │           │           │
          └───────────┴───────────┘
                      │
                      ▼
        ┌─────────────────────────────────────┐
        │      Firebase Authentication        │
        │  • User login/logout                │
        │  • Session management               │
        └─────────────┬───────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────────────┐
        │        Firestore Database           │
        │  ┌─────────────────────────────┐   │
        │  │    userRoles Collection     │   │
        │  │  {                          │   │
        │  │    userId: "abc123",        │   │
        │  │    role: "admin",           │   │
        │  │    assignedAt: Timestamp    │   │
        │  │  }                          │   │
        │  └─────────────────────────────┘   │
        │                                     │
        │  ┌─────────────────────────────┐   │
        │  │   Firestore Security Rules  │   │
        │  │  • Backend authorization    │   │
        │  │  • Role-based access        │   │
        │  │  • Data protection          │   │
        │  └─────────────────────────────┘   │
        └─────────────────────────────────────┘
```

---

## Authentication Flow

```
┌─────────┐
│  User   │
└────┬────┘
     │
     │ 1. Enter credentials
     ▼
┌─────────────────┐
│  Login Page     │
└────┬────────────┘
     │
     │ 2. Call loginUser()
     ▼
┌─────────────────┐
│  authService    │
└────┬────────────┘
     │
     │ 3. Firebase Auth
     ▼
┌─────────────────┐
│  Firebase Auth  │
│  ✓ User signed  │
└────┬────────────┘
     │
     │ 4. onAuthStateChanged
     ▼
┌─────────────────┐
│  AuthContext    │
│  • Set user     │
└────┬────────────┘
     │
     │ 5. Fetch role from Firestore
     ▼
┌─────────────────┐
│  roleService    │
│  getUserRole()  │
└────┬────────────┘
     │
     │ 6. Query userRoles collection
     ▼
┌─────────────────┐
│  Firestore      │
│  userRoles/{id} │
└────┬────────────┘
     │
     │ 7. Return role data
     ▼
┌─────────────────┐
│  AuthContext    │
│  • Set userRole │
│  • Set isAdmin  │
│  • Set isMember │
│  • Set loading  │
└────┬────────────┘
     │
     │ 8. Role available globally
     ▼
┌─────────────────┐
│  Components     │
│  useRole()      │
└─────────────────┘
```

---

## Protected Route Flow

```
User navigates to /admin/dashboard
        │
        ▼
┌──────────────────────┐
│  ProtectedRoute      │
│  requiredRole="admin"│
└──────┬───────────────┘
       │
       │ Is user authenticated?
       ├─ NO → Redirect to /login
       │
       │ YES
       ▼
┌──────────────────────┐
│  Check if role       │
│  is assigned         │
└──────┬───────────────┘
       │
       │ Has role?
       ├─ NO → Show "Role Not Assigned" error
       │
       │ YES
       ▼
┌──────────────────────┐
│  hasRole('admin')?   │
└──────┬───────────────┘
       │
       │ Has required role?
       ├─ NO → Redirect to /unauthorized
       │
       │ YES
       ▼
┌──────────────────────┐
│  Render protected    │
│  component           │
│  <AdminDashboard />  │
└──────────────────────┘
```

---

## Role Check Flow

```
Component renders
        │
        ▼
┌──────────────────────┐
│  useRole()           │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  AuthContext         │
│  • userRole          │
│  • isAdmin           │
│  • isMember          │
│  • isTrainer         │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Conditional         │
│  Rendering           │
│                      │
│  if (isAdmin) {      │
│    <AdminPanel />    │
│  }                   │
│                      │
│  if (isMember) {     │
│    <MemberView />    │
│  }                   │
└──────────────────────┘
```

---

## Firestore Security Rule Flow

```
Client attempts to read/write data
        │
        ▼
┌──────────────────────┐
│  Firestore Request   │
│  read /bills/{id}    │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Security Rules      │
│  Evaluate            │
└──────┬───────────────┘
       │
       │ Is authenticated?
       ├─ NO → DENY
       │
       │ YES
       ▼
┌──────────────────────┐
│  Get user role from  │
│  userRoles/{userId}  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Check role          │
│  permissions         │
└──────┬───────────────┘
       │
       │ Is admin?
       ├─ YES → ALLOW
       │
       │ NO
       │ Is owner of data?
       ├─ YES → ALLOW
       │
       │ NO
       ▼
┌──────────────────────┐
│  DENY                │
│  Permission denied   │
└──────────────────────┘
```

---

## Data Access Matrix

```
┌─────────────┬──────────┬──────────┬──────────┬──────────┐
│ Collection  │  Admin   │  Trainer │  Member  │  Guest   │
├─────────────┼──────────┼──────────┼──────────┼──────────┤
│ userRoles   │ ✓ R/W    │ ✓ R (own)│ ✓ R (own)│ ✗        │
├─────────────┼──────────┼──────────┼──────────┼──────────┤
│ members     │ ✓ R/W    │ ✓ R      │ ✓ R      │ ✗        │
├─────────────┼──────────┼──────────┼──────────┼──────────┤
│ bills       │ ✓ R/W    │ ✗        │ ✓ R (own)│ ✗        │
├─────────────┼──────────┼──────────┼──────────┼──────────┤
│ classes     │ ✓ R/W    │ ✓ R/W    │ ✓ R      │ ✗        │
├─────────────┼──────────┼──────────┼──────────┼──────────┤
│ attendance  │ ✓ R/W    │ ✓ R/W    │ ✓ R (own)│ ✗        │
├─────────────┼──────────┼──────────┼──────────┼──────────┤
│ reports     │ ✓ R/W    │ ✗        │ ✗        │ ✗        │
├─────────────┼──────────┼──────────┼──────────┼──────────┤
│ analytics   │ ✓ R/W    │ ✗        │ ✗        │ ✗        │
└─────────────┴──────────┴──────────┴──────────┴──────────┘

Legend:
✓ = Allowed
✗ = Denied
R = Read
W = Write
(own) = Own data only
```

---

## Component Hierarchy

```
App
├── AuthProvider
│   └── BrowserRouter
│       └── Routes
│           ├── Public Routes
│           │   ├── /login → LoginPage
│           │   ├── /register → RegisterPage
│           │   └── /password-reset → PasswordResetPage
│           │
│           ├── Protected Routes (Auth Required)
│           │   └── ProtectedRoute
│           │       └── Dashboard
│           │
│           ├── Admin Routes (Admin Role Required)
│           │   └── ProtectedRoute (requiredRole="admin")
│           │       ├── AdminDashboard
│           │       ├── MemberManagement
│           │       ├── BillManagement
│           │       └── ReportsPanel
│           │
│           ├── Member Routes (Member Role Required)
│           │   └── ProtectedRoute (requiredRole="member")
│           │       ├── MemberDashboard
│           │       └── BillHistory
│           │
│           └── Trainer Routes (Trainer Role Required)
│               └── ProtectedRoute (requiredRole="trainer")
│                   ├── TrainerDashboard
│                   └── ManageClasses
│
└── Components use hooks
    ├── useAuth() → Access user, login, logout
    └── useRole() → Access role, isAdmin, isMember, etc.
```

---

## Security Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Layer 3: UI/UX                       │
│  • Show/hide features based on role                     │
│  • Conditional rendering                                │
│  • User-friendly error messages                         │
│  ⚠️ Can be bypassed - Not for security!                 │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              Layer 2: Route Protection                  │
│  • ProtectedRoute component                             │
│  • Redirect unauthorized users                          │
│  • Check authentication + role                          │
│  ⚠️ Client-side - Can be bypassed!                      │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│         Layer 1: Backend Security (CRITICAL!)           │
│  • Firestore Security Rules                             │
│  • Server-side role verification                        │
│  • Cannot be bypassed from client                       │
│  ✓ Real security layer!                                 │
└─────────────────────────────────────────────────────────┘
```

---

## Role Assignment Flow

```
New User Registration
        │
        ▼
┌──────────────────────┐
│  registerUser()      │
│  Firebase Auth       │
└──────┬───────────────┘
       │
       │ User created with UID
       ▼
┌──────────────────────┐
│  ensureUserRole()    │
│  roleService         │
└──────┬───────────────┘
       │
       │ Check if role exists
       ▼
┌──────────────────────┐
│  getUserRole(uid)    │
└──────┬───────────────┘
       │
       │ Role exists?
       ├─ YES → Return existing role
       │
       │ NO
       ▼
┌──────────────────────┐
│  assignUserRole()    │
│  role: "member"      │
└──────┬───────────────┘
       │
       │ Create document in Firestore
       ▼
┌──────────────────────┐
│  Firestore           │
│  userRoles/{uid}     │
│  {                   │
│    role: "member",   │
│    assignedAt: now   │
│  }                   │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Role assigned!      │
│  User is now member  │
└──────────────────────┘
```

---

## Error Handling Flow

```
User attempts action
        │
        ▼
┌──────────────────────┐
│  Check authorization │
└──────┬───────────────┘
       │
       │ Not authenticated?
       ├─ YES → Redirect to /login
       │
       │ No role assigned?
       ├─ YES → Show "Role Not Assigned" error
       │
       │ Wrong role?
       ├─ YES → Redirect to /unauthorized
       │
       │ Firestore permission denied?
       ├─ YES → Show error message
       │         Log attempt
       │         Monitor for security
       │
       │ All checks passed
       ▼
┌──────────────────────┐
│  Allow action        │
└──────────────────────┘
```

---

## File Structure

```
gym-management-system/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── ProtectedRoute.tsx     ⭐ NEW
│   │   │   └── PasswordReset.tsx
│   │   ├── admin/
│   │   │   ├── BillManagement.tsx
│   │   │   ├── MemberManagement.tsx
│   │   │   └── ReportsPanel.tsx
│   │   └── member/
│   │       └── BillHistory.tsx
│   ├── context/
│   │   └── AuthContext.tsx              📝 UPDATED
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useRole.ts                   ⭐ NEW
│   ├── pages/
│   │   └── auth/
│   │       ├── LoginPage.tsx
│   │       ├── RegisterPage.tsx
│   │       └── UnauthorizedPage.tsx     ⭐ NEW
│   ├── services/
│   │   └── auth/
│   │       └── roleService.ts           ✓ EXISTS
│   └── types/
│       └── AuthContext.ts               📝 UPDATED
├── firestore.rules                       ⭐ NEW
├── ROLE_AUDIT.md                         ⭐ NEW
├── RBAC_GUIDE.md                         ⭐ NEW
├── RBAC_QUICK_REF.md                     ⭐ NEW
├── IMPLEMENTATION_SUMMARY.md             ⭐ NEW
├── DEPLOYMENT_CHECKLIST.md               ⭐ NEW
└── ARCHITECTURE.md                       ⭐ NEW (this file)
```

---

## Technology Stack

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Stack                       │
├─────────────────────────────────────────────────────────┤
│  React 19.1.1         • UI Framework                    │
│  TypeScript 5.8.3     • Type Safety                     │
│  React Router DOM     • Client-side Routing             │
│  Tailwind CSS         • Styling                         │
│  shadcn/ui            • Component Library               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    Backend Stack                        │
├─────────────────────────────────────────────────────────┤
│  Firebase Auth        • Authentication                  │
│  Firestore            • Database                        │
│  Security Rules       • Authorization                   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    Custom Services                      │
├─────────────────────────────────────────────────────────┤
│  roleService          • Role Management                 │
│  authService          • Auth Operations                 │
│  billService          • Billing CRUD                    │
│  memberService        • Member CRUD                     │
└─────────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Development                          │
│  • Local testing with Firebase emulator                 │
│  • Test all role scenarios                              │
│  • Verify security rules                                │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ firebase deploy --only firestore:rules
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    Production                           │
│  • Firebase Hosting (optional)                          │
│  • Firestore Database                                   │
│  • Firebase Authentication                              │
│  • Security Rules Applied                               │
└─────────────────────────────────────────────────────────┘
```

---

**Last Updated:** October 3, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
