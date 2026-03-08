# Day Compass 🧭

A minimalist, daily-focused tracker that brings your spaced repetition learning, one-off reminders, and a daily accomplishment log into a single, clean dashboard. 

I built this because I wanted a frictionless way to stay on top of topics I need to review over time (like LeetCode problems or core CS concepts), while also keeping track of what I actually get done every day without the bloat of a massive project management tool.

![Screenshot built with Next.js and Tailwind](https://github.com/user-attachments/assets/replace-with-your-screenshot-url) *(Add a screenshot here later!)*

## 🚀 What it does

*   **Spaced Repetition System (SRS)**: Add topics you're learning and set a custom review timetable (e.g., standard 1, 3, 7, 14, 30-day intervals). The dashboard tells you exactly what chapter or concept to revise today.
*   **One-Time Reminders**: Simple, set-and-forget tasks or reminders plotted against specific dates.
*   **Daily Log**: A distraction-free textbox that lets you bullet-point everything you achieved today. It builds up a nice timeline so you can see your momentum over the last few days.
*   **Zero Backend Hassle**: Built to run entirely as a front-end client connecting directly to an open Google Cloud Firestore. Drop in a Project ID and start adding topics.

## 🛠 Tech Stack

*   **Framework**: Next.js 14+ (App Router) exported as static HTML/CSS/JS.
*   **Styling**: Tailwind CSS for a sleek, modern, dark-themed UI.
*   **Icons**: Lucide React.
*   **Database**: Firebase Cloud Firestore (No Authentication required, utilizing pure REST/SDK calls).
*   **Hosting**: Easy deployment on GitHub Pages using GitHub Actions.

## 🏃‍♂️ Running it locally

If you want to spin this up on your own machine:

1.  **Clone the repo**
    ```bash
    git clone https://github.com/your-username/day-compass.git
    cd day-compass
    ```

2.  **Install the dependencies**
    ```bash
    npm install
    ```

3.  **Connect it to your database**
    Copy the `.env.local.example` to `.env.local` and add your Firebase Project ID:
    ```bash
    cp .env.local.example .env.local
    ```
    Then, edit `.env.local`:
    ```env
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
    ```
    *Note: Ensure your Firestore database rules allow unauthenticated read/writes!*

4.  **Start the dev server**
    ```bash
    npm run dev
    ```
    Head over to `http://localhost:3000` to see your dashboard!

## 📦 Deployment

Because this app uses Next.js Static Exports, it generates a completely static bundle (`out/` directory). A ready-to-go `.github/workflows/deploy.yml` file is included in this repository. 

Whenever you push to the `main` branch, GitHub Actions will automatically construct the static site and deploy it directly to GitHub Pages.

## 🤝 Contributing

This is a personal tool tailored for a very specific workflow, but if you find a bug or have a feature you think perfectly complements the setup, feel free to open a PR or an Issue!

---
*Stay consistent. The reps add up.*
