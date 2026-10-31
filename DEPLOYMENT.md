# 🚀 STALL ALERTER — FREE DEPLOYMENT GUIDE (Easiest Way)

Bhai, is guide mein sabse easiest aur 100% FREE tarike se Frontend aur Backend dono ko live internet par host karne ke step-by-step instructions hain.

---

## 📌 Summary: Kahan Host Karenge?

* **Backend (FastAPI + Python + SQLite):** **Render.com** (100% Free Web Service)
* **Frontend (Next.js 16 + React + TypeScript):** **Vercel.com** (100% Free Hobby Tier)

Dono platforms best hain, zero credit card chahiye, aur GitHub se direct connect hokar automatic deploy ho jate hain!

---

## 🟢 PART 1: Backend Host Karna (Render.com Par)

Render par hum FastAPI backend host karenge.

### Step 1: Render Account Banao
1. [Render.com](https://render.com) par jao.
2. **"Sign up with GitHub"** par click karo (apne usi GitHub account se login karo jisme `Stall_Alert` repo hai).

### Step 2: New Web Service Create Karo
1. Dashboard par **"New +"** button dabao aur **"Web Service"** select karo.
2. **"Build and deploy from a Git repository"** choose karo aur `Stall_Alert` repo select karo.

### Step 3: Settings Fill Karo
* **Name:** `stall-alerter-api` (ya koi bhi name)
* **Region:** Singapore ya Frankfurt (jo closest ho)
* **Branch:** `main`
* **Root Directory:** *(Isko blank chhod do)*
* **Runtime:** `Python 3`
* **Build Command:**
  ```bash
  pip install -r requirements.txt
  ```
* **Start Command:**
  ```bash
  uvicorn app.main:app --host 0.0.0.0 --port $PORT
  ```
* **Instance Type:** `Free` (0 $/month)

### Step 4: Environment Variables Add Karo (Very Important)
Scroll down karke **"Environment Variables"** section mein jao aur yeh 7 keys add karo:
1. `API_KEY` = `dev-stall-alerter-secret-key-32chars-min`
2. `SMTP_HOST` = `smtp.gmail.com`
3. `SMTP_PORT` = `587`
4. `SMTP_USER` = `ajaymahto2580@gmail.com`
5. `SMTP_PASS` = `frgxopbjbuxnnmrh`
6. `SMTP_FROM_EMAIL` = `ajaymahto2580@gmail.com`
7. `DEFAULT_RECRUITER_EMAIL` = `ajaymahto2580@gmail.com`

### Step 5: Deploy Karo
* Niche **"Create Web Service"** button daba do.
* 2-3 minute mein backend build hokar live ho jayega.
* Render aapko ek live URL dega, jaise:
  👉 `https://stall-alerter-api.onrender.com`
* Ise copy karke rakh lo!

---

## 🔵 PART 2: Frontend Host Karna (Vercel.com Par)

Next.js frontend ke liye Vercel sabse fast aur best platform hai (kyunki Vercel ne hi Next.js banaya hai).

### Step 1: Vercel Account Banao
1. [Vercel.com](https://vercel.com) par jao.
2. **"Sign Up"** par click karke **"Continue with GitHub"** select karo.

### Step 2: Project Import Karo
1. Dashboard par **"Add New..."** -> **"Project"** select karo.
2. Apne `Stall_Alert` repo ke samne **"Import"** button click karo.

### Step 3: Root Directory Set Karo (Most Important Step!)
* Vercel settings mein **"Root Directory"** ke samne **Edit** button dabao.
* Wahan **`web`** select karo (kyunki hamara Next.js code `web` folder ke andar hai).
* Framework Preset automatic **"Next.js"** detect ho jayega.

### Step 4: Environment Variables Add Karo
**Environment Variables** section ko expand karo aur yeh do variables dalo:

1. `NEXT_PUBLIC_API_URL`
   * Value: Apka Render Backend URL (jo Part 1 ke Step 5 mein mila tha), bina aakhri slash ke.
   * Example: `https://stall-alerter-api.onrender.com`
2. `NEXT_PUBLIC_API_KEY`
   * Value: `dev-stall-alerter-secret-key-32chars-min`

### Step 5: Deploy Karo
* **"Deploy"** button par click kar do!
* 1 minute ke andar apka frontend build ho jayega aur balloons udate hue **"Congratulations!"** screen aayegi.
* Aapko ek live domain mil jayega, jaise:
  👉 `https://stall-alerter.vercel.app`

---

## 🟡 PART 3: CORS Setting Check (Bonus Step)

Jab Vercel ka frontend URL mil jaye (e.g. `https://stall-alerter.vercel.app`), toh FastAPI backend already safe wildcards handle karta hai. Lekin best practice ke liye Render ke Environment Variables mein `ALLOWED_ORIGINS` mein apna Vercel domain dal sakte ho.

---

## ⚡ Quick Pro-Tips:
1. **Render Free Tier Sleep:** Free tier Render web service agar 15 minute tak use na ho toh sleep mode mein chali jati hai. Jab pehli baar Vercel dashboard khologe, toh pehla API call hone mein 20-30 seconds lag sakte hain backend wake up hone ke liye. Uske baad full speed chalega.
2. **Automatic CD (Continuous Deployment):** Jaise hi aap GitHub par koi bhi naya commit push karoge, Render aur Vercel dono automatically 1 minute mein naya version deploy kar denge!

Bhai bas yehi simple steps follow karo, project internet par free mein live ho jayega! 🚀
