# 🔧 Fix SSL/TLS Error

## ❌ The Problem

Your connection string had this format:
```
...mongodb.net/?appName=Cluster0
```

This is **WRONG** and causes SSL errors!

## ✅ The Solution

Use this format instead:
```
...mongodb.net/healthcare-system?retryWrites=true&w=majority&appName=Cluster0
```

---

## 📝 Update Your backend/.env File

**Replace line 2 with this:**

```env
MONGODB_URI=mongodb+srv://jmeleciomstu_db_user:0FF8IyPj6ibYEitD@cluster0.fu5azdk.mongodb.net/healthcare-system?retryWrites=true&w=majority&appName=Cluster0
```

**Key Changes:**
1. `/healthcare-system` added (database name)
2. `?retryWrites=true&w=majority` added (required parameters)
3. Removed the `?` that was in wrong place

---

## 🔄 After Updating

1. **Save your .env file**
2. **Restart backend:**

```bash
cd backend
npm run dev
```

You should now see:
```
✅ MongoDB Connected: cluster0.fu5azdk.mongodb.net
Server running in development mode on port 5000
```

3. **Add sample data:**

```bash
npm run seed
```

---

**Update your .env file with the corrected connection string and try again! ✅**

