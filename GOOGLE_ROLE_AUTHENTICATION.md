# 🔐 Google Sign-In Role Authentication

## ✅ Domain-Based Role Authentication Implemented!

Your healthcare system now automatically assigns roles based on email domains!

---

## 🎯 How It Works

### Domain-Based Role Detection:

When users sign in with Google, their role is determined by their email domain:

**Admin Domains:** (Configure in `.env`)
- `@healthcenter.com`
- `@admin.healthcenter.ph`
- Any domain you add

**Doctor Domains:** (Configure in `.env`)
- `@healthcenter.ph`
- `@doctor.healthcenter.ph`
- Any domain you add

**Default:** Patient role for all other domains

---

## ⚙️ Configuration

### Add to `backend/.env`:

```env
# Domain-based authentication for Google Sign-In
ADMIN_DOMAINS=healthcenter.com,admin.healthcenter.ph
DOCTOR_DOMAINS=healthcenter.ph,doctor.healthcenter.ph
```

**Multiple domains:** Separate with commas

---

## 🔄 Authentication Flow

### For Admin Domains:

1. User signs in with Google using `admin@healthcenter.com`
2. System detects admin domain
3. User created with **admin** role
4. Immediate admin access
5. Full system control

### For Doctor Domains:

1. User signs in with Google using `doctor@healthcenter.ph`
2. System detects doctor domain
3. User created with **doctor** role
4. **VERIFICATION STILL REQUIRED** ✅
5. Must wait for admin approval
6. Limited access until verified

### For Patient Domains:

1. User signs in with Google using any other email
2. System assigns **patient** role
3. Immediate patient access
4. Can book appointments, view records

---

## 🔒 Security Features

### Multi-Layer Protection:

1. **Domain Whitelist** - Only trusted domains get admin/doctor roles
2. **Doctor Verification** - Even domain-based doctors need verification
3. **Admin Override** - Admins can change any role
4. **Email Validation** - Google verifies email ownership

### Important Notes:

- ✅ Admin domains: Full access immediately (be careful!)
- ✅ Doctor domains: Need admin verification
- ✅ Patient domains: Full access
- ✅ Regular registration: Still requires manual role selection

---

## 📋 Example Scenarios

### Scenario 1: Admin Signs In
```
Email: john@healthcenter.com (in ADMIN_DOMAINS)
Result: User created as admin → Immediate admin access
```

### Scenario 2: Doctor Signs In
```
Email: dr.smith@healthcenter.ph (in DOCTOR_DOMAINS)
Result: User created as doctor → Pending verification → Limited access
```

### Scenario 3: Patient Signs In
```
Email: patient@gmail.com (not in whitelist)
Result: User created as patient → Immediate patient access
```

### Scenario 4: Existing User
```
Email: already.exists@healthcenter.com
Result: Logs in with existing role (no change)
```

---

## 🛠️ Customization

### To Add Your Domains:

1. Edit `backend/.env`
2. Add domains to lists:
```env
ADMIN_DOMAINS=yourdomain.com,yourorg.org
DOCTOR_DOMAINS=doctors.yourdomain.com
```
3. Restart backend server

### To Disable Domain Auth:

Remove or comment out in `.env`:
```env
# ADMIN_DOMAINS=healthcenter.com
# DOCTOR_DOMAINS=healthcenter.ph
```

All Google sign-ins will default to **patient** role.

---

## ✅ Current Behavior

### With Domain Config:
- Google admin domains → Admin role
- Google doctor domains → Doctor role (needs verification)
- All other domains → Patient role

### Without Domain Config:
- All Google sign-ins → Patient role
- Admin must manually assign roles

---

## 🔍 How to Test

### Test Admin Role:
1. Add your email domain to `ADMIN_DOMAINS`
2. Sign in with Google using that email
3. Should get admin role immediately

### Test Doctor Role:
1. Add your email domain to `DOCTOR_DOMAINS`
2. Sign in with Google using that email
3. Should get doctor role but needs verification
4. Admin must approve before full access

---

## ⚠️ Important Security Notes

1. **Admin domains have POWER** - Be careful who you add!
2. **Doctor domains still need verification** - Security maintained
3. **Email domains are public** - Anyone can see the domains
4. **Regular login** - Unaffected, still manual selection

---

**Domain-based authentication is now active! Configure your domains to enable! 🎯**
