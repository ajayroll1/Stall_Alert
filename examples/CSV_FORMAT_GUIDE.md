# CSV FORMAT SPECIFICATION — STALL ALERTER

इस गाइड में Stall Alerter में अपलोड की जाने वाली CSV फ़ाइल के सभी आवश्यक कॉलम्स (Columns), डेटा फॉर्मेट्स और उदाहरण दिए गए हैं।

---

## 1. आवश्यक कॉलम्स (Required Columns)

आपकी CSV फ़ाइल की पहली लाइन (Header Row) में निम्नलिखित हेडर नाम **हूबहू (Exact Match)** होने चाहिए:

| कॉलम का नाम (Header) | प्रकार (Type) | अनिवार्य? (Required) | विवरण / उदाहरण |
| :--- | :--- | :---: | :--- |
| `external_id` | String | **हाँ** | ATS की कैंडिडेट आईडी (जैसे `C-1001`, `APP-9821`) |
| `name` | String | **हाँ** | कैंडिडेट का पूरा नाम (जैसे `Asha Sharma`) |
| `email` | String | **हाँ** | कैंडिडेट का ईमेल पता (जैसे `asha@example.com`) |
| `job_title` | String | **हाँ** | जॉब प्रोफाइल (जैसे `Backend Engineer`, `Product Lead`) |
| `stage` | String | **हाँ** | हायरिंग राउंड का नाम (जैसे `Technical Interview`, `Recruiter Screen`) |
| `stage_entered_at` | Date/ISO | **हाँ** | कैंडिडेट इस राउंड में कब आया (`YYYY-MM-DD` या `YYYY-MM-DDTHH:MM:SSZ`) |
| `last_activity_at` | Date/ISO | नहीं (वैकल्पिक) | अंतिम गतिविधि की तिथि (जैसे `2026-10-15T14:30:00Z`) |
| `recruiter` | String | नहीं (वैकल्पिक) | जिम्मेदार रिक्रूटर का नाम (जैसे `Riya Sen`, `Ankit`) |

---

## 2. तैयार सैंपल CSV डेटा (Sample CSV Data)

आप सीधे नीचे दिए गए डेटा को एक `.csv` फ़ाइल (उदा. `candidates.csv`) में सेव करके अपलोड कर सकते हैं:

```csv
external_id,name,email,job_title,stage,stage_entered_at,last_activity_at,recruiter
C-1001,Asha Sharma,asha.sharma@example.com,Senior Backend Engineer,Technical Interview,2026-10-01T10:00:00Z,2026-10-02T14:30:00Z,Riya Sen
C-1002,Rohan Verma,rohan.verma@example.com,Lead Product Analyst,Recruiter Screen,2026-10-25T09:15:00Z,2026-10-26T11:00:00Z,Ankit Mehta
C-1003,Elena Rostova,elena.r@example.com,Staff Security Architect,Application Review,2026-10-10T11:00:00Z,2026-10-12T09:00:00Z,Riya Sen
C-1004,Devendra Patel,dev.patel@example.com,Senior Frontend Engineer,Offer Extended,2026-10-22T16:00:00Z,2026-10-23T10:00:00Z,Sara Jenkins
C-1005,Maya Lin,maya.lin@example.com,AI Research Engineer,Onsite Loop,2026-10-05T08:30:00Z,2026-10-06T15:00:00Z,Ankit Mehta
```

---

## 3. डेटाबेस में कैसे सेव होता है? (Database Guarantee)

- जब आप **"Import CSV"** बटन से फ़ाइल अपलोड करते हैं:
  1. बैकएंड फ़ाइल को वैलिडेट करता है और स्प्रेडशीट फॉर्मूला इंजेक्शन (`=`, `@`, `+`, `-`) से सुरक्षित करता है।
  2. हर पंक्ति का रिकॉर्ड सीधे **`candidates`** डेटाबेस टेबल में इंसर्ट होता है।
  3. `external_id` के आधार पर सिस्टम **Idempotent Upsert** करता है—यानी अगर वही आईडी दोबारा अपलोड की जाए तो डेटा अपडेट होगा, डुप्लीकेट नहीं बनेगा।
  4. अपलोड के बाद जब आप **"Run Stall Scan"** बटन दबाते हैं, तो सिस्टम तुरंत डेटाबेस से कैंडिडेट्स को स्कैन करके ओवरड्यू अलर्ट्स बनाता है।
