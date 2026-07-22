# NEET-style CBT Mock Test App (MERN)

A full CBT (Computer Based Test) platform styled after the official NTA exam interface:
- Admin bulk-uploads a test (CSV/XLSX/JSON of questions) with duration + marking scheme.
- Students log in (name + email, no password) and take a fully timed, auto-submitting test with the
  same question palette / mark-for-review / save-and-next flow as the real exam.
- On submission, students get a detailed analysis: score, subject-wise breakdown, accuracy, time taken,
  rank & percentile (based on everyone who has attempted that test), and a question-wise review with the
  correct answer and explanation for every question.

## Stack
- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT auth, Multer + csv-parse/xlsx for bulk upload
- **Frontend:** React (Vite), React Router, Axios

## Project structure
```
neet-cbt-app/
  backend/     Express API + MongoDB models
  frontend/    React (Vite) client
  sample-questions.csv   Example file to test the bulk upload
```

## 1. Prerequisites
- Node.js 18+
- MongoDB running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas connection string

## 2. Backend setup
```bash
cd backend
npm install
cp .env.example .env
# edit .env: set MONGO_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run dev
```
Server runs on `http://localhost:5000`.

## 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
```
App runs on `http://localhost:5173` (Vite dev server proxies `/api` calls to the backend).

## 4. Using the app
1.  click **Admin login**, and sign in with the email/password
  
2. In the Admin panel, click **+ Upload New Test**, fill in the title/duration/marking scheme, and
   upload `sample-questions.csv` (included in this project) to try it out.
3. Log out, go back to `/login`, and log in as a student (just name + email — no password).
4. Pick the test from the dashboard, read the instructions, and take the timed test. The interface
   mirrors the NTA CBT layout: candidate info bar, countdown timer, question palette with color-coded
   status, and Save & Next / Clear / Mark for Review controls.
5. On submit, you'll land on the analysis page with your score, subject-wise stats, rank, percentile,
   and a full question-wise review with explanations.

## Bulk upload file format
Your CSV/XLSX/JSON needs these columns (header names are flexible/case-insensitive):

| Column        | Notes                                      |
|---------------|---------------------------------------------|
| Subject       | e.g. Physics, Chemistry, Biology            |
| Question      | question text                               |
| Option1..4    | the four options                            |
| CorrectOption | `1`-`4` or `A`-`D`                          |
| Explanation   | shown in the post-test analysis (optional)  |

A JSON file should be an array of objects with the same keys, e.g.:
```json
[
  {
    "Subject": "Physics",
    "Question": "SI unit of electric flux is:",
    "Option1": "Weber", "Option2": "Volt-metre", "Option3": "Newton per coulomb", "Option4": "None",
    "CorrectOption": 2,
    "Explanation": "Electric flux has SI unit N·m²/C, equivalent to Volt-metre."
  }
]
```

## Notes / next steps you may want
- Negative marking, correct marks, and duration are all configurable per test at upload time.
- Rank/percentile are computed live from all `Attempt` documents for that test — no separate
  leaderboard job needed.
- Progress during a test autosaves to `localStorage`, so an accidental refresh doesn't lose answers
  (the timer resumes from where it left off).
- For production: move the JWT secret/admin password out of `.env` into a proper secrets manager,
  add rate limiting on `/auth`, and consider server-side timer enforcement (currently the timer is
  client-driven with auto-submit; a stricter version would track a server-side `startedAt` timestamp
  per attempt and reject submissions after the deadline).

## demo link
-https://cbtpracticeom.vercel.app/
