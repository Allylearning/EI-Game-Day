# **App Name**: EIFC: Game day

## Core Features:

- Pre-Match Form: User setup form to capture name, email, and selfie. Data saved to Firestore, initiating a new user session (matchId).
- Scenario Loader & Display: Load six random emotional match-day scenario prompts from a JSON array. The user interface should allow for open-text input to each prompt.
- AI-Powered EQ Scoring: Grade user answers to match scenarios using a tool powered by the OpenAI API (or Gemini) to assess emotional intelligence across patience, empathy, resilience, focus, teamwork, and confidence.
- EQ Stat Aggregation: Calculate the average scores per EQ stat category, and overall score.
- Player Card Generator: Generate a FIFA-style player card image, embedding user’s name, selfie, EQ stats, and an optional title (based on highest stat).
- Leaderboard Integration: Integrate with Neon Postgres database via Vercel API to post user scores and retrieve the top 10 scores for the current week, which should be displayed as the weekly Leaderboard
- Social Sharing & Virality: Provide shareable links (with referral tracking), PNG download, and social/messaging platform sharing options after card generation.

## Style Guidelines:

- Dark background (#121212) to create a modern and immersive experience.
- A slightly lighter dark gray (#1E1E1E) for subtle contrast.
- Bright cyan (#00DBFF), differing noticeably in saturation and brightness from the primary, to draw attention to calls to action and important interface elements.
- Headline font: 'Space Grotesk' (sans-serif) for headlines; body font: 'Inter' (sans-serif) for body.
- Use soccer-themed icons for different stat categories.
- Layout should provide seamless integration between the gameplay, card generation and leaderboard.
- Use animations on the card generation to boost engagement and provide feedback.