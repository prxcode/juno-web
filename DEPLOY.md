# Deployment Guide for Juno (Online Java Compiler)

## 🚀 Quick Deployment to Vercel

This project is configured for **zero-configuration deployment**.

1.  **Push to GitHub**: Commit and push your code.
2.  **Import in Vercel**:
    -   Go to [Vercel Dashboard](https://vercel.com).
    -   Click **Add New > Project**.
    -   Select your GitHub repo.
3.  **Deploy**:
    -   Vercel will auto-detect "Create React App".
    -   It will auto-detect the `api/` folder for backend functions.
    -   Click **Deploy**.

**That's it!** No environment variables or extra services (like Railway) are needed because we use the public Piston API.

---

## 💻 Local Development

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Start the Backend** (Terminal 1):
    Runs the API server on `http://localhost:3001`.
    ```bash
    npm start
    ```

3.  **Start the Frontend** (Terminal 2):
    Runs the React dev server on `http://localhost:3000` (proxies to backend).
    ```bash
    npm run dev
    ```

4.  **Open Browser**:
    Go to `http://localhost:3000`.
