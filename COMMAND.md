# STALL ALERTER — COMMAND EXECUTION & DEPLOYMENT GUIDE (COMMAND.md)

इस गाइड में प्रोजेक्ट को लोकल चलाने, टेस्ट करने और क्लाउड प्लेटफॉर्म्स पर डिप्लॉय करने के सभी कमांड्स दिए गए हैं।

---

## 1. लोकल डेवलपमेंट कमांड्स (Local Run Commands)

### A. बैकएंड चलाना (FastAPI + Python)
1. **डिपेंडेंसी इंस्टॉल करें (अगर पहली बार चला रहे हैं):**
   ```bash
   pip install -r requirements.txt
   ```
2. **FastAPI सर्वर रन करें:**
   ```bash
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   - **API बेस URL:** `http://127.0.0.1:8000`
   - **Swagger इंटरएक्टिव डॉक्यूमेंटेशन:** `http://127.0.0.1:8000/docs`
   - **हेल्थचेक:** `http://127.0.0.1:8000/health`

---

### B. फ्रंटएंड चलाना (Next.js 16 + React + TypeScript)
1. **वेब डायरेक्टरी में जाएं और पैकेज इंस्टॉल करें (अगर पहली बार चला रहे हैं):**
   ```bash
   cd web
   npm install
   ```
2. **डेवलपमेंट सर्वर शुरू करें:**
   ```bash
   npm run dev
   ```
   - **डैशबोर्ड URL:** `http://localhost:3000`

3. **प्रोडक्शन बिल्ड चेक करें:**
   ```bash
   npm run build
   ```

---

### C. एक क्लिक में दोनों सर्वर चलाना (Windows One-Click)
रूट डायरेक्टरी में मौजूद बैच फाइल पर डबल-क्लिक करें:
```cmd
start_all.bat
```

---

### D. ऑटोमेटेड टेस्ट चलाना (Run Tests)
```bash
# सभी Pytest यूनिट और इंटीग्रेशन टेस्ट
pytest -v

# डायरेक्ट ऑफलाइन एंड-टू-एंड वेरिफिकेशन
python -c "import sys; sys.path.insert(0, '.'); import tests.run_offline_verification as r; r.run_all_offline_tests()"
```

---

## 2. Docker / कंटेनर से चलाना (Containerized Run)

अगर आपके सिस्टम में Docker इंस्टॉल है:
```bash
# बैकएंड कंटेनर बिल्ड और रन करें
docker compose up --build -d

# लॉग्स देखें
docker compose logs -f

# बंद करने के लिए
docker compose down
```

---

## 3. इसको कहाँ और कैसे डिप्लॉय कर सकते हैं? (Cloud Deployment Options)

यह प्रोजेक्ट आधुनिक 2-टियर आर्किटेक्चर (Next.js Frontend + Python FastAPI Backend) पर बना है। इसे आप निम्नलिखित प्लेटफॉर्म्स पर आसानी से डिप्लॉय कर सकते हैं:

### विकल्प 1: Vercel + Render / Railway (सबसे आसान और मुफ़्त/सस्ता तरीका - Recommended)
1. **Frontend (Vercel):**
   - [Vercel](https://vercel.com/) पर अपना GitHub रिपॉजिटरी कनेक्ट करें।
   - **Root Directory:** `web` सेट करें।
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
   - **Environment Variable:**
     `NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.onrender.com`

2. **Backend (Render या Railway):**
   - [Render](https://render.com/) पर "New Web Service" बनाएं।
   - अपना GitHub रिपॉजिटरी चुनें।
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables:**
     - `STALL_ALERTER_API_KEY=your-secure-random-32char-key`
     - `DATABASE_PATH=stall_alerter.db` (या PostgreSQL URL)

---

### विकल्प 2: AWS / DigitalOcean / Linode (Single VPS via Docker)
1. VPS में SSH लॉग इन करें और Git रिपॉजिटरी क्लोन करें:
   ```bash
   git clone https://github.com/ajayroll1/Stall_Alert.git
   cd Stall_Alert
   ```
2. Docker Compose से बैकएंड चलाएं:
   ```bash
   docker compose up -d
   ```
3. Nginx को रिवर्स प्रॉक्सी के रूप में कॉन्फ़िगर करें जो SSL (Let's Encrypt / Certbot) के साथ पोर्ट 80/443 को 8000 और 3000 पर रूट करे।

---

## 4. प्रोजेक्ट स्ट्रक्चर का प्रोडक्शन ऑडिट (Production-Grade Audit)

```
Stall_Alert/
├── app/                  # [Backend] FastAPI, रूटर्स, डेटाबेस कनेक्शन, डोमेन लॉजिक
│   ├── __init__.py
│   └── main.py           # कोर API एंडपॉइंट्स, SLA रूल्स, सैनिटाइजेशन और ऑडिट लॉग्स
├── docs/                 # [Enterprise Docs] आर्किटेक्चर, सिक्योरिटी, API और थ्रेट मॉडल
│   ├── AI_GUARDRAILS.md
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── AUDIT_REPORT.md
│   ├── DEPLOYMENT.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── SECURITY.md
│   └── TECH_STACK.md
├── examples/             # टेस्ट डेटा (candidates.csv)
├── frontend/             # लाइटवेट स्टैंडअलोन HTML/JS कंसोल
├── tests/                # ऑटोमेटेड टेस्ट सूट (Pytest + Offline Verifier)
│   ├── test_logic.py
│   └── run_offline_verification.py
├── web/                  # [Frontend] Next.js 16 + React 19 + TypeScript + Tailwind
│   ├── src/
│   │   ├── app/          # App Router (page.tsx, layout.tsx, globals.css)
│   │   ├── components/   # Reusable UI (Tour, Footer, Modals)
│   │   ├── api.ts        # Typed API क्लाइंट
│   │   └── types.ts      # TypeScript इंटरफेस
│   ├── package.json
│   └── tsconfig.json
├── .env.example          # पर्यावरण चर टेम्पलेट
├── .gitignore            # गिट अनदेखी सूची
├── docker-compose.yml    # प्रोडक्शन कंपोज़ कॉन्फ़िगरेशन
├── Dockerfile            # बैकएंड डॉकर कंटेनर फ़ाइल
├── MARK.md               # फीचर पूर्णता चेकलिस्ट (Verified)
├── COMMAND.md            # रन और डिप्लॉयमेंट कमांड्स
└── README.md             # प्रोजेक्ट ओवरव्यू और क्विक-स्टार्ट
```

### स्ट्रक्चर पर समीक्षा (Verdict):
- **मॉड्यूलर सेपरेशन:** बैकएंड (`app/`), फ्रंटेंड (`web/`), टेस्ट्स (`tests/`), और डॉक्यूमेंटेशन (`docs/`) स्पष्ट रूप से अलग-अलग हैं।
- **सुरक्षा और स्वच्छता:** कोई सीक्रेट्स या हार्डकोडेड टोकन्स कमिट नहीं हैं, `.gitignore` ठीक से कॉन्फ़िगर है।
- **कंटेनराइजेशन:** `Dockerfile` और `docker-compose.yml` पहले से मौजूद हैं।
- **निष्कर्ष:** यह फ़ोल्डर स्ट्रक्चर पूरी तरह **इंडस्ट्री-स्टैंडर्ड और प्रोडक्शन-ग्रेड** है।
