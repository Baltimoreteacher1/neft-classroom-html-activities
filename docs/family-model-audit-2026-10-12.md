# Family model correction — October 12, 2026

The first family-page gate tested broad subject alignment. It allowed a data
analysis tool in Lesson 2.1, although that lesson teaches recognizing statistical
questions. That is a wrong-task mismatch, even though both are statistics.

This follow-up inventoried the model types across all 166 generated family
pages, compared their lesson/session titles and authored notes, and inspected
the relevant model configurations and statistics component behavior. This is
not an exhaustive mathematical proof of every interaction in every model.

Corrections:

- **2.1:** replace the data calculator with a bilingual question classifier and
  a labeled comparison of one fixed shelf count versus counts across shelves.
  Explain expected variation, repeated observations, categorical data, and why
  identical observed answers do not automatically make a question non-statistical.
- **2.1 Part 2:** use the actual book-count dot plot and focus on dots, stacks,
  peaks, and shape. Remove the mean marker and unrelated statistics cards.
- **2.3 and Part 2:** isolate median. The even-count example sorts six ride
  times and averages 58 and 62 to get 60; its plot marks median rather than mean.
- **2.8 and Part 2:** isolate total, count, and mean. The target-mean example
  starts with 60 points in four games and lets the student add a fifth score to
  reach a mean of 16. The worked model uses the same authored numbers.
- **2.9 and Part 2:** show mean and MAD, with the two-city comparison using the
  authored data. Means of 52 match while MAD values are 4 and 10.
- **2.10 and Part 2:** expose IQR alongside the center/spread measures needed to
  choose appropriate pairs. Part 2 contrasts the authored symmetric and outlier
  sets in its worked visual.
- **4.1 Part 2:** replace the inherited 40% grid with explicit models of 150%,
  250%, and 300%, using a clear 100% benchmark.
- **4.5 Part 2:** replace percent-of-a-known-whole with a bar and equation for
  finding the unknown whole: 0.25w = 6.
- **6.8 Part 2:** replace numerical regrouping with an algebraic area model for
  4(x + 3) = 4x + 12, with expanding and factoring in opposite directions.

The family audit now pins specific model selection for the confirmed mismatches.
Behavior tests check classification edge cases, median calculations, mean
updates, MAD, IQR, and default-path migration. These checks improve detection
of the known failures; they do not replace reading the lesson objective.
