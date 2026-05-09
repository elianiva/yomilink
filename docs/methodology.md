# Methodology

## Score Calculation

The Kit-Build score measures how accurately a learner reconstructs the goal map:

```
Score = (M / T_Goal) × 100%
```

| Variable   | Meaning                                                                  |
| ---------- | ------------------------------------------------------------------------ |
| **M**      | Number of matching links (propositions in both learner map AND goal map) |
| **T_Goal** | Total number of correct propositions in the goal map                     |

**Scoring rules:**

- **Matching links**: Counted toward score
- **Missing links**: Links in goal map but absent from learner map — reported but do not penalize
- **Excessive links**: Links in learner map but absent from goal map — reported but do not penalize

This scoring method encourages exploration by not penalizing extra connections.

## Retention Decay

To measure long-term retention, three indices are calculated:

```
Immediate Index = PostTestScore / MaxScore
Delayed Index = DelayedTestScore / MaxScore
Retention Decay Rate = (Immediate - Delayed) / Immediate × 100%
```

| Metric                   | Meaning                                                             |
| ------------------------ | ------------------------------------------------------------------- |
| **Immediate Index**      | Post-test performance relative to maximum                           |
| **Delayed Index**        | Delayed test performance relative to maximum                        |
| **Retention Decay Rate** | Percentage drop from immediate to delayed. Lower = better retention |

## Bloom's Taxonomy Distribution

Each reading comprehension test contains 20 MCQ items distributed evenly across cognitive levels:

| Level                  | Cognitive Process                          | Questions |
| ---------------------- | ------------------------------------------ | --------- |
| **L1 — Remembering**   | Recall facts and basic information         | 3–4       |
| **L2 — Understanding** | Explain ideas or concepts                  | 3–4       |
| **L3 — Applying**      | Use information in new situations          | 3–4       |
| **L4 — Analyzing**     | Draw connections among ideas               | 3–4       |
| **L5 — Evaluating**    | Justify decisions or critical thinking     | 3–4       |
| **L6 — Creating**      | Synthesize information to form conclusions | 3–4       |
| **Total**              |                                            | **20**    |

## TAM Questionnaire

The Technology Acceptance Model measures two constructs on a 5-point Likert scale (1=Strongly Disagree, 2=Disagree, 3=Neutral, 4=Agree, 5=Strongly Agree):

### Perceived Usefulness (PU)

| No. | Question                                                                        |
| --- | ------------------------------------------------------------------------------- |
| 1   | Using Kit-Build improves my reading comprehension                               |
| 2   | Kit-Build helps me understand the structure and relationships in the text       |
| 3   | Kit-Build makes it easier for me to organize information from the reading       |
| 4   | Using Kit-Build helps me learn Japanese reading better than traditional methods |
| 5   | I find Kit-Build useful for my Japanese language learning                       |

### Perceived Ease of Use (PEoU)

| No. | Question                                                              |
| --- | --------------------------------------------------------------------- |
| 1   | I found Kit-Build easy to use                                         |
| 2   | The interface of Kit-Build is clear and understandable                |
| 3   | Learning to use Kit-Build was quick and easy                          |
| 4   | Connecting concepts in Kit-Build is intuitive                         |
| 5   | My interaction with Kit-Build does not require a lot of mental effort |

### Acceptance Criteria

| Construct                    | Minimum Mean |
| ---------------------------- | ------------ |
| Perceived Usefulness (PU)    | ≥ 3.5        |
| Perceived Ease of Use (PEoU) | ≥ 3.5        |

## Feedback Questionnaire

Three open-ended questions for qualitative feedback:

| No. | Question                                                   |
| --- | ---------------------------------------------------------- |
| 1   | What did you like most about using Kit-Build?              |
| 2   | What difficulties did you encounter while using Kit-Build? |
| 3   | What improvements would you suggest for the application?   |

## Statistical Analysis

### Group Comparison

| Test               | Condition               | Purpose                                               |
| ------------------ | ----------------------- | ----------------------------------------------------- |
| **Shapiro-Wilk**   | Data normality check    | Determine if parametric or non-parametric tests apply |
| **Welch's t-test** | Normal distribution     | Compare group means (robust to unequal variance)      |
| **Mann-Whitney U** | Non-normal distribution | Non-parametric group comparison                       |

### ANCOVA

Analysis of Covariance controls for prior ability differences:

| Variable        | Type                     | Description                |
| --------------- | ------------------------ | -------------------------- |
| **Dependent**   | Post-test score          | Immediate learning outcome |
| **Dependent**   | Delayed test score       | Retention outcome          |
| **Independent** | Treatment Group          | Kit-Build vs Summarizing   |
| **Covariate**   | Pre-test score           | Baseline ability           |
| **Covariate**   | Map reconstruction score | Goal map accuracy          |
| **Covariate**   | Previous Japanese score  | Prior language knowledge   |

### Expected Outcomes

| Hypothesis | Test                                    | Expected                       |
| ---------- | --------------------------------------- | ------------------------------ |
| **H₁**     | ANCOVA: Post-test ~ Group + Pre-test    | p < 0.05, f ≥ 0.25             |
| **H₂**     | ANCOVA: Delayed-test ~ Group + Pre-test | p < 0.05, f ≥ 0.30             |
| **H₃**     | TAM descriptive stats                   | Mean PU ≥ 3.5, Mean PEoU ≥ 3.5 |

## Sensitivity Analysis

G\*Power 3.1 analysis for N = 60 (30 per group):

| Test                     | Power (1-β) | α    | Detectable Effect |
| ------------------------ | ----------- | ---- | ----------------- |
| Independent means t-test | 0.8         | 0.05 | d = 0.649         |
| Wilcoxon-Mann-Whitney    | 0.8         | 0.05 | d = 0.665         |
| ANCOVA fixed effects     | 0.8         | 0.05 | f = 0.367         |
