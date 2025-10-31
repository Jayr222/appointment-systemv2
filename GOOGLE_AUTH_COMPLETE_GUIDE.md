# 🔐 Complete Google Authentication Guide

## ✅ Google Sign-In WITH Domain-Based Roles!

Your healthcare system now has **professional Google Sign-In with automatic role assignment**!

---

## 🎯 How Google Authentication Works

### New User Flow:

1. **User clicks "Sign in with Google"**
2. **Selects Google account**
3. **Backend verifies Google token**
4. **Checks user by email**

### If User Exists:
- Login with existing role
- No role change

### If New User:
- **Check email domain**
- **Assign role based on domain:**
  - `@healthcenter.com` → **Admin**
  - `@healthcenter.ph` → **Doctor** (needs verification!)
  - Other domains → **Patient**
- **Create account**
- **Generate JWT token**
- **Redirect to appropriate dashboard**

---

## ⚙️ Configuration Required

### Backend `.env`:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# Domain-based roles (Optional but recommended)
ADMIN_DOMAINS=healthcenter.com,admin.healthcenter.ph
DOCTOR_DOMAINS=healthcenter.ph,doctor.healthcenter.ph
```

### Frontend `.env`:

```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

---

## 🔒 Security Layers

### Layer 1: Google Authentication
- Google verifies identity
- Email ownership confirmed
- Token security

### Layer 2: Domain Whitelist
- Only trusted domains get admin/doctor roles
- Prevents random users getting elevated access

### Layer 3: Doctor Verification (for doctors)
- Even domain-based doctors need admin approval
- `isVerified: false` by default
- Limited access until approved

---

## 📊 Complete Authentication Matrix

| User Type | Email Domain | Role Assigned | Verification Needed | Access Level |
|-----------|-------------|---------------|---------------------|--------------|
| Admin | `@healthcenter.com` | Admin | ❌ No | Full system |
| Doctor | `@healthcenter.ph` | Doctor | ✅ Yes | Limited → Full after approval |
| Patient | `@gmail.com` | Patient | ❌ No | Patient features |
| Existing | Any | Existing role | - | Based on current role |

---

## 🎯 Usage Examples

### Example 1: Admin Google Sign-In
```
Email: admin@healthcenter.com
Domain: healthcenter.com
Role: admin
Verification: Not needed
Access: Immediate full access
```

### Example 2: Doctor Google Sign-In
```
Email: dr.smith@healthcenter.ph
Domain: healthcenter.ph
Role: doctor
Verification: Required!
Access: Limited until admin approves
```

### Example 3: Patient Google Sign-In
```
Email: patient@gmail.com
Domain: gmail.com
Role: patient
Verification: Not needed
Access: Immediate patient access
```

---

## 🔍 Admin Workflow

### For Google-Signed Doctors:

1. **Doctor signs in** with Google
2. **Account created** with doctor role
3. **Admin sees** in "Verify Doctors" page
4. **Admin reviews** (can see Google profile)
5. **Admin approves** → Full doctor access
6. **Admin rejects** → Remains limited

### For Manual Role Changes:

1. **Any user signs in** with Google (gets default role)
2. **Admin goes** to "Manage Users"
3. **Admin changes** role to doctor/admin
4. **User now has** that role

---

## 🧪 Testing

### Test Admin Google Login:
1. Add your email domain to `ADMIN_DOMAINS`
2. Sign in with Google
3. Should redirect to admin dashboard

### Test Doctor Google Login:
1. Add your email domain to `DOCTOR_DOMAINS`
2. Sign in with Google
3. Should redirect to doctor dashboard
4. See "verification pending" notice
5. Admin must approve

### Test Patient Google Login:
1. Use any other email
2. Sign in with Google
3. Should redirect to patient dashboard
4. Immediate access

---

## ✅ Features Summary

### Google Sign-In:
- ✅ One-click authentication
- ✅ Google profile picture
- ✅ Secure token exchange
- ✅ No password needed

### Domain-Based Roles:
- ✅ Automatic role assignment
- ✅ Admin domain whitelist
- ✅ Doctor domain whitelist
- ✅ Patient default
- ✅ Configurable via `.env`

### Doctor Verification:
- ✅ Always required for doctors
- ✅ Even domain-based doctors
- ✅ Admin approval process
- ✅ Full audit trail

### Security:
- ✅ Multi-layer protection
- ✅ Domain whitelisting
- ✅ Verification gate
- ✅ JWT token auth
- ✅ Role-based access control

---

## 📝 Quick Setup

### 1. Get Google Credentials
- Google Cloud Console → Create OAuth client
- Copy Client ID and Secret

### 2. Configure Backend
Add to `backend/.env`:
```env
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret
ADMIN_DOMAINS=yourdomain.com
DOCTOR_DOMAINS=doctors.yourdomain.com
```

### 3. Configure Frontend
Create `frontend/.env`:
```env
VITE_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
```

### 4. Restart Servers
```bash
cd backend && npm run dev
cd frontend && npm run dev
```

---

## 🎉 Complete Authentication System

**Your healthcare system now has:**

1. ✅ **Traditional login** - Email/password
2. ✅ **Google Sign-In** - One-click auth
3. ✅ **Domain-based roles** - Automatic assignment
4. ✅ **Doctor verification** - Extra security
5. ✅ **JWT tokens** - Secure sessions
6. ✅ **Role-based access** - Controlled permissions
7. ✅ **Admin override** - Manual role changes

---

**Professional multi-layer authentication system is complete! 🔐🎉**

