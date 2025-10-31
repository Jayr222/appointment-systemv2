# 📝 Create Your .env File

## ✅ Here's your .env file content:

### Copy and paste this into `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://jmeleciomstu_db_user:0FF8IyPj6ibYEitD@cluster0.fu5azdk.mongodb.net/?appName=Cluster0
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRE=7d
NODE_ENV=development
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=http://localhost:5173
```

---

## 📁 How to Create the File

### Option 1: Using VS Code
1. Open VS Code
2. Go to `backend/` folder
3. Click "New File"
4. Name it: `.env` (including the dot!)
5. Paste the content above
6. Save (Ctrl+S)

### Option 2: Using PowerShell/Command Line
```powershell
cd backend
New-Item -Path .env -ItemType File
```

Then open `.env` and paste the content.

### Option 3: Using Notepad
1. Open Notepad
2. Paste the content
3. Save As
4. Navigate to `backend/` folder
5. Name: `.env`
6. Save

---

## ⚠️ Important Notes

1. **File name must be exactly:** `.env` (starts with a dot)
2. **Location must be:** `backend/.env` (in backend folder)
3. **No brackets** around the password!
4. **Keep the connection string on ONE line**

---

## ✅ After Creating .env

### Test Your Connection:

```bash
cd backend
npm run dev
```

You should see:
```
✅ MongoDB Connected: cluster0.fu5azdk.mongodb.net
```

### Add Sample Data:

```bash
cd backend
npm run seed
```

---

## 🔒 Security

Your `.env` file contains sensitive information. It's already in `.gitignore` so it won't be committed to Git.

---

**Create the file now and paste the content above! 📝**

