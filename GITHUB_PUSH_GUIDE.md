# How to Push Code to GitHub

## Option 1: From Replit (Easiest)

### Step 1: Connect GitHub to Replit
1. Click on your **profile picture** (top right in Replit)
2. Click **Account**
3. Scroll to **GitHub** section
4. Click **Connect GitHub**
5. Authorize Replit to access your GitHub

### Step 2: Push to GitHub
1. Click the **Git** icon in left sidebar (looks like a branch)
2. Click **Create a new repository**
3. Fill in:
   - **Repository name**: `digital-doctors-assistant`
   - **Description**: Healthcare management system
   - **Public or Private**: Your choice
4. Click **Create and push**
5. Done! Your code is now on GitHub

---

## Option 2: From Terminal (If Already Have Git Set Up)

### Step 1: Create GitHub Repository
1. Go to **github.com**
2. Click **New** (green button)
3. Name it: `digital-doctors-assistant`
4. Click **Create repository**

### Step 2: Copy the HTTPS URL
- GitHub will show you a URL like: `https://github.com/YOUR_USERNAME/digital-doctors-assistant.git`
- Copy this URL

### Step 3: Push from Replit Terminal

Open Replit's Shell and run these commands:

```bash
# Configure Git (do this once)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Initialize git if not already done
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: Digital Doctors Assistant"

# Add remote GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/digital-doctors-assistant.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## Step-by-Step Example

```bash
# 1. Configure Git
git config --global user.name "John Doe"
git config --global user.email "john@example.com"

# 2. Initialize repository
git init

# 3. Add all files
git add .

# 4. Create initial commit
git commit -m "Initial commit: Digital Doctors Assistant with AI services"

# 5. Add GitHub repository
git remote add origin https://github.com/johndoe/digital-doctors-assistant.git

# 6. Push to GitHub
git branch -M main
git push -u origin main
```

---

## After First Push

**For subsequent updates:**

```bash
# Make your changes...

# Add changes
git add .

# Commit
git commit -m "Your commit message describing changes"

# Push to GitHub
git push
```

---

## Troubleshooting

### "fatal: not a git repository"
```bash
git init
```

### "Permission denied" or authentication error
1. Go to github.com
2. Settings → Developer settings → Personal access tokens
3. Generate a token
4. Use token instead of password when pushing

### Can't find Git icon in Replit
- Click the three dots menu (⋮)
- Look for "Version Control" or "Git"

---

## What Happens After You Push

✅ Your code is now on GitHub  
✅ Render can auto-deploy from this repository  
✅ You can invite collaborators  
✅ Track changes with commit history  

---

## Next: Deploy to Render

Once your code is on GitHub:
1. Go to **render.com**
2. Click **New +** → **Web Service**
3. Select **Deploy from a Git repository**
4. Paste your GitHub repository URL
5. Follow the Render deployment steps

**Total time to deploy: ~5 minutes**
