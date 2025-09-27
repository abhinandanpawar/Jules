# Model Accuracy Improvement Plan

This document outlines a strategic plan to systematically improve the performance of the fine-tuned models used in the Jules Command Center. The ultimate goal is to achieve an accuracy of 99% on their respective tasks: `smart_prompting` and `comment_classification`.

Achieving such high accuracy requires a multi-faceted approach, focusing on data quality, sophisticated training techniques, and rigorous evaluation.

---

## 1. Data-Centric Approach: The Foundation

The single most important factor for model performance is the quality and quantity of the training data.

-   **Data Collection & Expansion:**
    -   **Current State:** The current datasets are small (`smart_prompts_dataset.jsonl` has 199 examples, `comment_classification_dataset.jsonl` has 49). This is insufficient for high accuracy.
    -   **Action Plan:**
        -   Actively collect and label at least **1,000 high-quality examples** for each task.
        -   For `smart_prompting`, gather more real-world examples of vague user requests and their ideal, well-structured versions.
        -   For `comment_classification`, analyze more GitHub pull request comments to build a larger and more diverse dataset of intents.

-   **Data Augmentation:**
    -   To further expand the datasets, we can use augmentation techniques:
        -   **Paraphrasing:** Use a powerful LLM (like GPT-4) to rephrase existing examples, creating new, semantically similar data points.
        -   **Back-Translation:** Translate the examples to another language and then back to English to create variations.

-   **Data Quality & Cleaning:**
    -   **Action Plan:**
        -   Conduct a thorough review of the existing datasets to identify and correct any errors, inconsistencies, or ambiguous labels.
        -   Establish clear, written guidelines for what constitutes a "good prompt" or a specific "intent" to ensure all data is labeled consistently.

## 2. Advanced Training & Tuning

Once we have a robust dataset, we can optimize the training process.

-   **Hyperparameter Tuning:**
    -   The current training script uses fixed hyperparameters. To find the optimal settings, we must perform a systematic search.
    -   **Action Plan:**
        -   Implement a hyperparameter tuning framework (like Optuna or Ray Tune).
        -   Run experiments to find the best values for key hyperparameters, including `learning_rate`, `num_train_epochs`, `per_device_train_batch_size`, and `weight_decay`.

-   **Cross-Validation:**
    -   To ensure the model generalizes well and isn't just memorizing the training data, we should use k-fold cross-validation during the tuning phase. This provides a more reliable estimate of the model's performance.

## 3. Model Selection

The choice of the base model is critical. While small models are fast, larger models offer significantly higher potential accuracy.

-   **Explore Larger Base Models:**
    -   **Current State:** We are using `distilgpt2` to ensure the script runs in constrained environments. This is a major limiting factor.
    -   **Action Plan:**
        -   Once sufficient data and a proper training environment (like Google Colab with a powerful GPU) are in place, experiment with larger, state-of-the-art base models.
        -   **Recommended Models:** Llama 3 8B, Mistral 7B, Qwen2 7B, or other similar high-performing open-source models.

-   **Task-Specific Architectures:**
    -   For the `comment_classification` task, we can also experiment with models specifically designed for classification (e.g., fine-tuning a `BERT` or `RoBERTa`-based model) instead of a generative model.

## 4. Rigorous Evaluation

To confidently measure our progress toward 99% accuracy, we need a formal evaluation process.

-   **Establish a Hold-Out Test Set:**
    -   Before training begins, we must split our full dataset into three parts: **training, validation, and testing** (e.g., an 80/10/10 split).
    -   The test set must **never** be used during training or hyperparameter tuning. It will only be used once at the very end to provide an unbiased measure of the final model's performance.

-   **Define Clear Metrics:**
    -   **For `comment_classification`:** We will use standard classification metrics:
        -   **Accuracy:** The primary target (99%).
        -   **Precision, Recall, and F1-Score:** To understand the model's performance on each specific class (`Approved`, `ChangesRequested`, `Commented`).
    -   **For `smart_prompting`:** Evaluation is more complex. We will use a hybrid approach:
        -   **Automated Metrics:** Use BLEU and ROUGE scores to measure the similarity between the model's output and the reference "good prompt".
        -   **Human Evaluation:** A human reviewer will score the generated prompts on a scale of 1-5 for clarity, actionability, and completeness. This is the most important metric for this task.

## Roadmap to 99% Accuracy

This is a phased approach to achieving our goal.

-   **Phase 1 (Data Foundation):** Focus entirely on collecting, cleaning, and augmenting the datasets to at least 1,000 examples each.
-   **Phase 2 (Baseline & Tuning):** With the improved dataset, perform hyperparameter tuning on a mid-sized base model (e.g., Qwen1.5-1.8B) to establish a strong performance baseline.
-   **Phase 3 (Advanced Modeling):** Move to a large-scale base model (e.g., Llama 3 8B) and retrain using the optimal hyperparameters found in Phase 2.
-   **Phase 4 (Final Evaluation):** Evaluate the best model from Phase 3 on the hold-out test set to measure our final accuracy.