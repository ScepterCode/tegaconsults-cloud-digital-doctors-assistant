# Deployment Guide - Digital Doctors Assistant

## Deploy on Render

Follow these steps to deploy the Digital Doctors Assistant on Render:

### Step 1: Connect Your Repository
1. Go to [render.com](https://render.com)
2. Sign up or log in with your GitHub account
3. Click "New +" and select "Web Service"
4. Connect your GitHub repository containing the DDA code

### Step 2: Configure the Service
The `render.yaml` file in the root directory contains all configuration:
- **Runtime**: Node.js
- **Build Command**: `npm ci && npm run build`
- **Start Command**: `npm start`
- **Plan**: Free tier (or select paid for better performance)

### Step 3: Set Environment Variables
In the Render dashboard, add the following environment variable:

```
OPENAI_API_KEY: your_actual_openai_api_key_here
```

**Important**: 
- Get your OpenAI API key from [platform.openai.com](https://platform.openai.com)
- This is required for the Dr. Tega AI chatbot to work

### Step 4: Deploy
1. Click "Create Web Service"
2. Render will automatically build and deploy your app
3. Once deployed, you'll receive a URL like: `https://digital-doctors-assistant-xxxx.onrender.com`

### Step 5: Test Your Deployment
1. Visit your Render URL
2. Log in with default credentials:
   - **Username**: `admin` or `patient`
   - **Password**: `paypass`
3. Test all features including:
   - Patient registration
   - Appointments
   - Department management (admin only)
   - Billing/subscriptions
   - AI chatbot (Dr. Tega)

### Free Tier Limitations (Render)
- Services spin down after 15 minutes of inactivity
- Limited to 0.5 CPU and 512 MB RAM
- For production use, upgrade to a paid plan

### Monitoring & Logs
- View real-time logs in Render dashboard
- Check build logs for any deployment issues
- Monitor performance metrics under "Metrics" tab

### Troubleshooting

**Build Fails**
- Check that `npm run build` works locally first
- Verify all dependencies are in `package.json`
- Ensure `.env.example` has the right format

**App Won't Start**
- Check `npm start` works locally
- Verify environment variables are set correctly
- Review logs in Render dashboard

**AI Chatbot Not Working**
- Verify OPENAI_API_KEY is set and valid
- Check OpenAI account has available quota
- Review browser console for errors

### Next Steps for Production
1. **Database**: Consider using PostgreSQL instead of in-memory storage
2. **Email Notifications**: Set up email service for appointment reminders
3. **Payment Integration**: Configure Paystack and bank transfer processing
4. **HTTPS**: Render automatically provides HTTPS
5. **Domain**: Add a custom domain in Render settings

### Support
For Render-specific issues, visit [render.com/docs](https://render.com/docs)
