import os
import argparse
import torch
import numpy as np
import evaluate
from datasets import load_dataset
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling,
)

def fine_tune_model(task_name, base_model, dataset_path, output_dir, num_examples=None):
    """
    A generic function to fine-tune a model for a specific task.
    ...
    """
    print(f"--- Starting fine-tuning for task: {task_name} ---")

    # 1. Load and split the dataset
    print(f"Loading dataset from: {dataset_path}")
    dataset = load_dataset('json', data_files=dataset_path, split='train')

    if num_examples and num_examples > 0:
        dataset = dataset.select(range(min(num_examples, len(dataset))))
        print(f"Using the first {len(dataset)} examples for training.")

    # Split dataset into 90% training and 10% evaluation
    split_dataset = dataset.train_test_split(test_size=0.1, shuffle=True, seed=42)
    train_dataset = split_dataset['train']
    eval_dataset = split_dataset['test']
    print(f"Dataset split: {len(train_dataset)} training examples, {len(eval_dataset)} evaluation examples.")

    # 2. Load tokenizer and model
    print(f"Loading base model and tokenizer: {base_model}")
    model = AutoModelForCausalLM.from_pretrained(base_model, torch_dtype=torch.bfloat16)
    tokenizer = AutoTokenizer.from_pretrained(base_model)
    tokenizer.pad_token = tokenizer.eos_token

    # 3. Preprocess and format the dataset
    def format_dataset(examples):
        # ... (same as before)
        if task_name == 'smart_prompting':
            prompts = [f"### Instruction:\nRewrite the following vague request into a detailed and actionable GitHub issue.\n\n### Input:\n{bad}\n\n### Response:\n{good}" for bad, good in zip(examples['bad_prompt'], examples['good_prompt'])]
        elif task_name == 'comment_classification':
            prompts = [f"### Instruction:\nClassify the intent of the following GitHub comment. The intent can be 'Approved', 'ChangesRequested', or 'Commented'.\n\n### Input:\n{comment}\n\n### Response:\n{intent}" for comment, intent in zip(examples['comment'], examples['intent'])]
        else:
            raise ValueError("Unknown task_name provided.")
        return tokenizer(prompts, truncation=True, padding='max_length', max_length=512)

    print("Formatting and tokenizing the datasets...")
    tokenized_train_dataset = train_dataset.map(format_dataset, batched=True, remove_columns=train_dataset.column_names)
    tokenized_eval_dataset = eval_dataset.map(format_dataset, batched=True, remove_columns=eval_dataset.column_names)

    # 4. Define metrics computation
    accuracy_metric = evaluate.load("accuracy")

    def compute_metrics(eval_pred):
        logits, labels = eval_pred
        # Predictions are the argmax of the logits
        predictions = np.argmax(logits, axis=-1)

        # We need to decode both predictions and labels to strings to compare them
        # Important: we slice the labels to ignore padding tokens (-100)
        decoded_preds = tokenizer.batch_decode(predictions, skip_special_tokens=True)

        # Replace -100 in labels as we can't decode them
        labels = np.where(labels != -100, labels, tokenizer.pad_token_id)
        decoded_labels = tokenizer.batch_decode(labels, skip_special_tokens=True)

        def extract_intent(text):
            # Find the response part, handle case-insensitivity, and clean up
            response_part = text.split("### Response:")[-1]
            # Be robust to variations like "Approved.", " approved ", etc.
            return response_part.strip().lower().rstrip('.!')

        # Extract the single word intent
        extracted_preds = [extract_intent(pred) for pred in decoded_preds]
        extracted_labels = [extract_intent(label) for label in decoded_labels]

        # For smart_prompting, accuracy is not a meaningful metric
        if task_name == 'smart_prompting':
            return {}

        return accuracy_metric.compute(predictions=extracted_preds, references=extracted_labels)

    # 5. Set up Training Arguments
    training_args = TrainingArguments(
        output_dir=output_dir,
        per_device_train_batch_size=4,
        gradient_accumulation_steps=4,
        learning_rate=2e-4,
        num_train_epochs=1,
        logging_dir=f"{output_dir}/logs",
        logging_steps=10,
        save_steps=50,
        fp16=True,
        push_to_hub=False,
    )

    # 6. Create the Trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_train_dataset,
        eval_dataset=tokenized_eval_dataset,
        compute_metrics=compute_metrics,
        data_collator=DataCollatorForLanguageModeling(tokenizer, mlm=False),
    )

    # 7. Start Training
    print("Starting training...")
    trainer.train()
    print(f"Training complete for task: {task_name}")

    # 8. Save the final model (the best one is loaded automatically)
    print(f"Saving best fine-tuned model to: {output_dir}")
    trainer.save_model(output_dir)
    print("Model saved successfully.")
    print("--- Fine-tuning finished ---")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fine-tune a model for a specific task.")
    parser.add_argument(
        "task",
        type=str,
        choices=['smart_prompting', 'comment_classification'],
        help="The name of the task to fine-tune."
    )
    parser.add_argument(
        "--num-examples",
        type=int,
        default=0,
        help="The number of examples to use for training. 0 means all."
    )
    parser.add_argument(
        "--use-augmented-data",
        action='store_true',
        help="Use the augmented versions of the datasets."
    )
    args = parser.parse_args()

    # Define model and dataset paths
    base_model_name = "distilgpt2" # Using a smaller model to prevent timeouts

    # Get the directory where the script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Define paths relative to the script's location
    if args.use_augmented_data:
        print("--- Using AUGMENTED datasets ---")
        smart_prompting_dataset = os.path.join(script_dir, "../training_data/smart_prompts_dataset_augmented.jsonl")
        comment_classification_dataset = os.path.join(script_dir, "../training_data/comment_classification_dataset_augmented.jsonl")
    else:
        print("--- Using ORIGINAL datasets ---")
        smart_prompting_dataset = os.path.join(script_dir, "../training_data/smart_prompts_dataset.jsonl")
        comment_classification_dataset = os.path.join(script_dir, "../training_data/comment_classification_dataset.jsonl")


    # Define output directories for the fine-tuned models
    smart_prompting_output = os.path.join(script_dir, "./fine-tuned-models/smart-prompting-model")
    comment_classification_output = os.path.join(script_dir, "./fine-tuned-models/comment-classification-model")

    if args.task == 'smart_prompting':
        # --- Run the fine-tuning process for the "Smart Prompting" task ---
        fine_tune_model(
            task_name='smart_prompting',
            base_model=base_model_name,
            dataset_path=smart_prompting_dataset,
            output_dir=smart_prompting_output,
            num_examples=args.num_examples
        )
        print(f"\nSmart prompting model saved in '{os.path.abspath(smart_prompting_output)}'")

    elif args.task == 'comment_classification':
        # --- Run the fine-tuning process for the "Comment Classification" task ---
        fine_tune_model(
            task_name='comment_classification',
            base_model=base_model_name,
            dataset_path=comment_classification_dataset,
            output_dir=comment_classification_output,
            num_examples=args.num_examples
        )
        print(f"\nComment classification model saved in '{os.path.abspath(comment_classification_output)}'")

    print(f"\nFine-tuning for task '{args.task}' is complete.")