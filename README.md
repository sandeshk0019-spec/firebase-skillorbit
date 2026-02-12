# SkillOrbit ✨

**Your Personal AI Co-Processor for Learning.**

SkillOrbit is a futuristic, AI-powered learning platform designed to make education more engaging, personalized, and effective. It leverages generative AI to provide a suite of tools that help users forge new neural pathways through interactive quizzes, expert tutoring, and specialized cognitive games.

---

## Features

SkillOrbit is packed with cutting-edge features designed to augment your learning matrix:

*   🤖 **Cognitive Tutor:** Interface with a friendly AI tutor for step-by-step guidance on complex topics. Supports text-based queries and image uploads for visual context.
*   🧠 **AI Quiz Matrix:** Generate custom multiple-choice quizzes on any subject and topic imaginable. A powerful tool for study preparation and knowledge validation.
*   🎮 **Game Zone:** A collection of interactive mini-games designed to make learning fun and sharpen your mind through play.
    *   **Zen Match:** A relaxing memory game to connect related concepts.
    *   **Cosmic Typer:** Improve your typing speed and recall of key terms in a fast-paced "study words rain" game.
    *   **Math Voyager:** An action-packed arithmetic game where you pilot a ship to collect correct answers.
    *   **Chem Lab Sim:** A virtual chemistry lab to experiment with different reagents and witness spectacular (and safe!) reactions.
*   🗣️ **Neuro-Speech Hub:** A dedicated space with advanced tools to help build confidence in reading and speaking, including speech analysis and reading challenges for users with dyslexia.

## Tech Stack

SkillOrbit is built with a modern, robust, and scalable technology stack:

*   **Framework:** [Next.js](https://nextjs.org/) (with App Router)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **UI Components:** [ShadCN UI](https://ui.shadcn.com/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Generative AI:** [Genkit](https://firebase.google.com/docs/genkit) with Google's Gemini models
*   **Backend & Database:** [Firebase](https://firebase.google.com/) (Authentication, Firestore)

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   Node.js (v18 or newer)
*   npm, yarn, or pnpm

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/skill-orbit.git
    cd skill-orbit
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**
    Create a file named `.env` in the root of your project and add your Google AI API key. You can get one from [Google AI Studio](https://aistudio.google.com/app/apikey).
    ```
    GEMINI_API_KEY=YOUR_API_KEY_HERE
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

## Pushing to GitHub

To push your project to your own GitHub repository, follow these steps:

1.  **Create a new repository on GitHub.**
    Go to [github.com/new](https://github.com/new) to create a new repository. You can name it whatever you like. Make sure you do **not** initialize it with a README, .gitignore, or license file, as this project already contains those.

2.  **Initialize Git in your local project (if you haven't already).**
    ```bash
    git init
    ```

3.  **Add all the files to be tracked.**
    ```bash
    git add .
    ```

4.  **Make your first commit.**
    ```bash
    git commit -m "Initial commit from Firebase Studio"
    ```

5.  **Rename the default branch to `main`.**
    ```bash
    git branch -M main
    ```

6.  **Link your local repository to the one on GitHub.**
    Your repository URL has been added below.
    ```bash
    git remote add origin https://github.com/sandeshk0019-spec/skill_orbit.git
    ```

7.  **Push your code to GitHub.**
    This command sends all your committed files to your GitHub repository.
    ```bash
    git push -u origin main
    ```

---
*This project was bootstrapped with Firebase Studio.*