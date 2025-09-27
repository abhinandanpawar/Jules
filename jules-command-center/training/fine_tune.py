import os
import argparse
import torch
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

    Args:
        task_name (str): A descriptive name for the task (e.g., 'smart_prompting').
        base_model (str): The name of the base model from the Hugging Face Hub.
        dataset_path (str): The local path to the .jsonl dataset file.
        output_dir (str): The directory to save the fine-tuned model.
        num_examples (int, optional): The number of examples to use for training.
    """
    print(f"--- Starting fine-tuning for task: {task_name} ---")

    # 1. Load the dataset
    print(f"Loading dataset from: {dataset_path}")
    dataset = load_dataset('json', data_files=dataset_path, split='train')
    if num_examples and num_examples > 0:
        dataset = dataset.select(range(min(num_examples, len(dataset))))
        print(f"Using the first {len(dataset)} examples for training.")

    # 2. Load tokenizer and model
    print(f"Loading base model and tokenizer: {base_model}")
    # Use bfloat16 for better performance on modern GPUs
    model = AutoModelForCausalLM.from_pretrained(base_model, torch_dtype=torch.bfloat16)
    tokenizer = AutoTokenizer.from_pretrained(base_model)
    tokenizer.pad_token = tokenizer.eos_token # Set padding token

    # 3. Preprocess and format the dataset
    def format_dataset(examples):
        if task_name == 'smart_prompting':
            # For prompt improvement, we create a clear instruction format
            prompts = [f"### Instruction:\nRewrite the following vague request into a detailed and actionable GitHub issue.\n\n### Input:\n{bad}\n\n### Response:\n{good}" for bad, good in zip(examples['bad_prompt'], examples['good_prompt'])]
        elif task_name == 'comment_classification':
            # For classification, we teach it to respond with the intent
            prompts = [f"### Instruction:\nClassify the intent of the following GitHub comment. The intent can be 'Approved', 'ChangesRequested', or 'Commented'.\n\n### Input:\n{comment}\n\n### Response:\n{intent}" for comment, intent in zip(examples['comment'], examples['intent'])]
        else:
            raise ValueError("Unknown task_name provided.")

        # Add the end-of-sequence token to each prompt
        return tokenizer(prompts, truncation=True, padding='max_length', max_length=512)

    print("Formatting and tokenizing the dataset...")
    tokenized_dataset = dataset.map(format_dataset, batched=True, remove_columns=dataset.column_names)

    # 4. Set up Training Arguments
    training_args = TrainingArguments(
        output_dir=output_dir,
        per_device_train_batch_size=4,  # Adjust based on GPU memory
        gradient_accumulation_steps=4, # Adjust based on GPU memory
        learning_rate=2e-4,
        num_train_epochs=1, # Reduced from 3 to prevent timeout
        logging_dir=f"{output_dir}/logs",
        logging_steps=10,
        save_steps=500,
        fp16=True, # Use mixed precision for performance
        push_to_hub=False, # We will do this manually after training
    )

    # 5. Create the Trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_dataset,
        data_collator=DataCollatorForLanguageModeling(tokenizer, mlm=False),
    )

    # 6. Start Training
    print("Starting training...")
    trainer.train()
    print(f"Training complete for task: {task_name}")

    # 7. Save the final model
    print(f"Saving fine-tuned model to: {output_dir}")
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
    args = parser.parse_args()

    # Define model and dataset paths
    base_model_name = "distilgpt2" # Using a smaller model to prevent timeouts

    # Assumes the script is run from the `jules-command-center/training/` directory
    # and the data is in the `jules-command-center/training_data/` directory.
    smart_prompting_dataset = "../training_data/smart_prompts_dataset.jsonl"
    comment_classification_dataset = "../training_data/comment_classification_dataset.jsonl"

    # Define output directories for the fine-tuned models
    smart_prompting_output = "./fine-tuned-models/smart-prompting-model"
    comment_classification_output = "./fine-tuned-models/comment-classification-model"

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