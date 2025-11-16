# 📧 Email Setup Guide for Password Reset

## Common Issues and Solutions

### Issue: Email not being sent

The most common reasons emails aren't being sent:

1. **Email credentials not configured** - Check your `.env` file
2. **Gmail requires App Password** - You can't use your regular Gmail password
3. **2-Factor Authentication not enabled** - Required for App Passwords

---

## 🔧 Setting Up Gmail for Email Sending

### Step 1: Enable 2-Factor Authentication

1. Go to your Google Account: https://myaccount.google.com
2. Click **Security** in the left sidebar
3. Under "Signing in to Google", click **2-Step Verification**
4. Follow the prompts to enable it

### Step 2: Generate an App Password

1. Go back to **Security** settings
2. Under "Signing in to Google", click **App passwords**
3. You may need to sign in again
4. Select **Mail** as the app
5. Select **Other (Custom name)** as the device
6. Enter a name like "Healthcare System"
7. Click **Generate**
8. **Copy the 16-character password** (it looks like: `abcd efgh ijkl mnop`)

### Step 3: Update Your .env File

Open `backend/.env` and update these lines:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=abcdefghijklmnop
```

**Important:**
- Use your **full Gmail address** for `EMAIL_USER`
- Use the **16-character App Password** (no spaces) for `EMAIL_PASS`
- Do NOT use your regular Gmail password

### Step 4: Restart Your Server

After updating the `.env` file:

```bash
# Stop your server (Ctrl+C)
# Then restart it
cd backend
npm run dev
```

You should see:
```
✅ Email transporter verified successfully
```

If you see an error, check the console output for specific details.

---

## 🔍 Troubleshooting

### Error: "EAUTH" (Authentication failed)
- **Solution:** Make sure you're using an App Password, not your regular password
- Verify the App Password has no spaces
- Make sure 2-Factor Authentication is enabled

### Error: "ECONNECTION" (Connection failed)
- **Solution:** Check your `EMAIL_HOST` and `EMAIL_PORT`
- For Gmail, use `smtp.gmail.com` and port `587`

### Error: "Email transporter verification failed"
- **Solution:** Check all email environment variables are set correctly
- Make sure there are no extra spaces in your `.env` file
- Restart your server after making changes

### No error, but email still not received
- Check your **Spam/Junk folder**
- Verify the email address in your account is correct
- Check the server console for detailed error messages
- Make sure `FRONTEND_URL` is set correctly in your `.env`

---

## ✅ Testing

1. Start your backend server
2. Look for: `✅ Email transporter verified successfully`
3. Try the forgot password feature
4. Check the console for:
   - `✅ Password reset email sent successfully to: [email]`
   - Or specific error messages

---

## 📝 Example .env Configuration

```env
PORT=5000
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
NODE_ENV=development

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=yourname@gmail.com
EMAIL_PASS=abcdefghijklmnop

FRONTEND_URL=http://localhost:5173
```

---

## 🆘 Still Not Working?

1. **Check the server console** - Look for error messages with ❌
2. **Verify your .env file** - Make sure it's in the `backend/` folder
3. **Test with a different email provider** - Some providers have different settings
4. **Check firewall/antivirus** - They might block SMTP connections

---

**Need help?** Check the server console output for specific error messages!

