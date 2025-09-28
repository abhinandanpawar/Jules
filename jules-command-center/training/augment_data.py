import json
import random
import os

def augment_comment_classification(input_path, output_path, multiplier=10):
    """
    Augments the comment classification dataset.
    """
    with open(input_path, 'r') as f:
        lines = f.readlines()

    data = [json.loads(line) for line in lines]
    augmented_data = []

    # Simple synonym/phrase replacements
    approved_phrases = ["Looks good to me!", "LGTM", "Approved", "This is perfect, thank you!", "Ship it!", "No notes from me, looks great.", "Excellent work.", "Ready to go.", "This is great.", "I'm happy with this."]
    changes_requested_phrases = ["Needs changes.", "Please fix this.", "Requesting changes.", "Please add a test.", "This is missing error handling.", "Please rename this.", "The styling needs adjustment.", "This introduces a vulnerability.", "Please update the README."]
    commented_phrases = ["Why this approach?", "What do you think about this?", "I'm not sure about this part.", "Just leaving a note.", "Will this impact performance?", "Thanks for this.", "This is a good improvement."]

    # Basic case and whitespace variations
    for _ in range(multiplier):
        for item in data:
            original_comment = item['comment']
            intent = item['intent']

            new_comment = original_comment

            # Case variations
            rand = random.random()
            if rand < 0.3:
                new_comment = new_comment.lower()
            elif rand < 0.6:
                new_comment = new_comment.upper()

            # Add extra whitespace
            if random.random() < 0.2:
                new_comment = "  " + new_comment + "  "

            # Combine with another random phrase of the same intent
            if random.random() < 0.4:
                if intent == 'Approved':
                    new_comment += " " + random.choice(approved_phrases)
                elif intent == 'ChangesRequested':
                    new_comment += " " + random.choice(changes_requested_phrases)
                elif intent == 'Commented':
                    new_comment += " " + random.choice(commented_phrases)

            augmented_data.append({"comment": new_comment.strip(), "intent": intent})

    # Remove duplicates and add original data
    unique_augmented_data = [dict(t) for t in {tuple(d.items()) for d in augmented_data}]
    final_data = data + unique_augmented_data

    with open(output_path, 'w') as f:
        for item in final_data:
            f.write(json.dumps(item) + '\n')

    print(f"Augmented comment classification data from {len(data)} to {len(final_data)} examples.")

def augment_smart_prompts(input_path, output_path, multiplier=5):
    """
    Augments the smart prompts dataset.
    """
    with open(input_path, 'r') as f:
        lines = f.readlines()

    data = [json.loads(line) for line in lines]
    augmented_data = []

    typo_chars = "abcdefghijklmnopqrstuvwxyz"

    for _ in range(multiplier):
        for item in data:
            bad_prompt = item['bad_prompt']
            good_prompt = item['good_prompt']

            new_bad_prompt = bad_prompt

            # Introduce a typo
            if random.random() < 0.3 and len(new_bad_prompt) > 2:
                pos = random.randint(0, len(new_bad_prompt) - 1)
                char_to_replace = new_bad_prompt[pos]
                if char_to_replace != ' ':
                    new_bad_prompt = new_bad_prompt[:pos] + random.choice(typo_chars) + new_bad_prompt[pos+1:]

            # Change phrasing slightly
            if random.random() < 0.5:
                if "fix" in new_bad_prompt:
                    new_bad_prompt = new_bad_prompt.replace("fix", "resolve")
                elif "add" in new_bad_prompt:
                    new_bad_prompt = new_bad_prompt.replace("add", "implement")
                elif "change" in new_bad_prompt:
                    new_bad_prompt = new_bad_prompt.replace("change", "update")
                else:
                    prefix = random.choice(["Can you please ", "We need to ", "Could you "])
                    new_bad_prompt = prefix + new_bad_prompt

            augmented_data.append({"bad_prompt": new_bad_prompt, "good_prompt": good_prompt})

    # Remove duplicates and add original data
    unique_augmented_data = [dict(t) for t in {tuple(d.items()) for d in augmented_data}]
    final_data = data + unique_augmented_data

    with open(output_path, 'w') as f:
        for item in final_data:
            f.write(json.dumps(item) + '\n')

    print(f"Augmented smart prompts data from {len(data)} to {len(final_data)} examples.")


if __name__ == "__main__":
    # Get the directory where the script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Define paths relative to the script's location
    comment_input_path = os.path.join(script_dir, '../training_data/comment_classification_dataset.jsonl')
    comment_output_path = os.path.join(script_dir, '../training_data/comment_classification_dataset_augmented.jsonl')

    smart_prompt_input_path = os.path.join(script_dir, '../training_data/smart_prompts_dataset.jsonl')
    smart_prompt_output_path = os.path.join(script_dir, '../training_data/smart_prompts_dataset_augmented.jsonl')

    # Run augmentation
    augment_comment_classification(comment_input_path, comment_output_path)
    augment_smart_prompts(smart_prompt_input_path, smart_prompt_output_path)