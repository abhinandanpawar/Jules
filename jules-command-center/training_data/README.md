# Training Datasets for Jules Command Center AI

This directory contains the datasets generated for fine-tuning a language model (like TinyLlama) to power the AI features of the Jules Command Center.

## Datasets

There are two distinct datasets, each tailored for a specific task. Both are provided in the **JSONL (.jsonl)** format, where each line is a separate JSON object.

---

### 1. Smart Prompting Dataset

-   **File:** `smart_prompts_dataset.jsonl`
-   **Purpose:** To train a model to rewrite short, vague user requests into well-structured, detailed, and actionable GitHub issues.

#### Structure

Each JSON object in this file has the following structure:

```json
{
  "bad_prompt": "A short, vague, or poorly defined user request.",
  "good_prompt": "A well-structured, detailed GitHub issue description written in Markdown, based on the bad prompt."
}
```

#### Example

```json
{
  "bad_prompt": "fix the header",
  "good_prompt": "### Bug Fix: Resolve Header Layout Issue on Mobile Devices\n\n**Bug Description:**\nThe main site header is not rendering correctly on mobile screen sizes (below 600px). The logo overlaps the navigation links, making them unclickable.\n\n**Steps to Reproduce:**\n1. Open the website on a mobile device or in a browser with the viewport width set to less than 600px.\n2. Observe the main header at the top of the page.\n\n**Expected Behavior:**\nThe header elements should be aligned properly, with no overlap. A hamburger menu should be visible to toggle the navigation links.\n\n**Actual Behavior:**\nThe logo and navigation links are overlapping."
}
```

---

### 2. Comment Classification Dataset

-   **File:** `comment_classification_dataset.jsonl`
-   **Purpose:** To train a model to classify the intent of a GitHub comment on a pull request.

#### Structure

Each JSON object in this file has the following structure:

```json
{
  "comment": "The text of the GitHub comment.",
  "intent": "The classified intent of the comment."
}
```

The `intent` field can be one of three possible values:

-   `Approved`: The comment indicates approval and that the pull request is ready to be merged.
-   `ChangesRequested`: The comment explicitly or implicitly requests changes to the code.
-   `Commented`: The comment is a general question, observation, or note that does not indicate approval or a request for changes.

#### Example

```json
{
  "comment": "This doesn't seem to work on mobile. The layout breaks below 600px. Please fix.",
  "intent": "ChangesRequested"
}
```

---

These datasets provide a strong foundation for fine-tuning a model to understand the specific nuances of software development and project management communication.