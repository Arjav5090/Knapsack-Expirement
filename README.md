# 🧠 Strategy Skill Knapsack Experiment – Quiz Web App

This is the official implementation of a behavioral experiment that measures **strategy skills** in problem-solving using variations of the classic **0-1 Knapsack Problem**. The app is built in **Next.js** and designed to guide users through a multi-phase quiz experience, collecting both performance data and open-ended reflections to evaluate metacognitive strategy.

---

## 🚀 Features

- **Interactive Knapsack Questions** with real-time reward/weight tracking
- **Structured Phases**:
  - Training (familiarization)
  - Task skill elicitation (under timing constraints)
  - Benchmark test (free navigation, semi-random difficulty order)
  - Prediction test (descending difficulty)
  - Meta-analysis (question difficulty estimation)
- **Detailed Timer and Scoring Logic**
- **Text Response Collection** for post-test strategy evaluation
- **Scroll-based Navigation** during benchmark tests to simulate realistic scanning behavior
- **Probabilistic Rewards** based on performance
- **Insight Prize Evaluation** using NLP

---

## 🧪 Experiment Flow

1. **Intro** – Welcome message + experiment goals
2. **Instructions** – Knapsack mechanics explained
3. **Training Set Phase 1** – Ungraded practice with immediate feedback
4. **Training Set Phase 2** – Timed, graded questions (task skill elicitation)
5. **Benchmark Test** – Semi-randomized ordering to test for strategy skills
6. **Text Reflection Phase** – Insightful responses to open-ended strategy prompts
7. **Prediction Test** – Descending difficulty test (performance used for LLM prediction)
8. **Meta-analysis Phase** – Participants label question difficulty levels
9. **Debriefing** – Reveal of study design, prize draw

---

## 📊 Design Highlights

- **Difficulty Calibration** via dominance relationships among knapsack items
- **Time Constraints**:
  - Phase 2: 90s/question or 15min total
  - Benchmark & Prediction Tests: 30 questions, 20min each
- **Reward System**:
  - Correct: full points
  - Unanswered: partial
  - Incorrect: none
- **User Tracking**:
  - Question order and navigation behavior
  - Time on skipped/unanswered items
  - Highlighting and timer checks
- **Post-Hoc Analysis** using collected meta-data and user-generated strategy text

---

## 🧠 Research Goals

This implementation allows us to:

- **Disentangle performance differences** not explained by raw ability
- **Infer strategic behavior** through navigation patterns and responses
- **Predict future behavior** using both meta-data and natural language responses

---

## 🛠️ Tech Stack

- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [PostgreSQL/Firebase/Supabase] *(optional for user data storage)*
- LLM/Insight Evaluation pipeline *(not included in this repo)*

---


## 🧩 TODO / Future Enhancements

- [ ] Integrate LLM backend for strategy skill prediction
- [ ] Adaptive question routing (e.g., based on task skill)
- [ ] Admin dashboard for reviewing participant meta-data
- [ ] Export tools for data analysis (.csv or .json)



