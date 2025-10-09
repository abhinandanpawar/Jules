# Training & Deployment Guide for Custom AI Models

This guide provides a complete walkthrough for fine-tuning your own custom language models using the `fine_tune.py` script and the datasets in this directory. It will then show you how to deploy your trained model and integrate it into the Jules Command Center application.

## Overview of the Process

The process involves four main stages:
1.  **Setup:** Preparing a suitable Python environment with GPU access.
2.  **Training:** Running the `fine_tune.py` script to create your custom models.
3.  **Deployment:** Pushing your models to a hosting service to get an API endpoint.
4.  **Integration:** Updating the Jules Command Center to use your new custom models.

---

## Step 1: Set Up the Training Environment

Training language models requires a powerful GPU. The easiest and most cost-effective way to do this is by using a free Google Colab notebook.

1.  **Open Google Colab:** Go to [colab.research.google.com](https://colab.research.google.com).
2.  **Create a New Notebook:** Click `File > New notebook`.
3.  **Enable GPU:** In the notebook menu, go to `Runtime > Change runtime type`. In the dropdown for "Hardware accelerator", select **T4 GPU** and click `Save`. This is crucial.

---

## Step 2: Prepare Files in Colab

You need to upload the `training` and `training_data` directories to your Colab environment.

1.  **Zip Your Local Files:** On your local machine, create a zip file containing the `training` and `training_data` directories from the `jules-command-center` project. Name it `jules_training_files.zip`.
2.  **Upload to Colab:** In your Colab notebook, click on the **Files** icon on the left sidebar. Click the **Upload** icon and select the `jules_training_files.zip` file you just created.
3.  **Unzip the Files:** In a Colab code cell, run the following command to unzip your files:
    ```python
    !unzip jules_training_files.zip
    ```
    You should now see the `training` and `training_data` directories in your Colab file explorer.

---

## Step 3: Install Dependencies

Now, install all the necessary Python libraries.

1.  **Navigate to the Directory:** In a Colab code cell, run this command to move into the correct directory:
    ```python
    %cd training
    ```
2.  **Install Requirements:** Run the following command to install all the libraries listed in `requirements.txt`. This may take a few minutes.
    ```python
    !pip install -r requirements.txt
    ```

---

## Step 4: Run the Fine-Tuning Script

You are now ready to start training your custom models. The script must be run separately for each of the two models: `smart_prompting` and `comment_classification`.

1.  **Run the Training for Each Model:** In a Colab code cell, run the following commands. Note that each command may take a significant amount of time.

    To train the **Smart Prompting** model:
    ```python
    !python fine_tune.py smart_prompting
    ```

    To train the **Comment Classification** model:
    ```python
    !python fine_tune.py comment_classification
    ```

2.  **(Optional) Training on a Smaller Dataset:**
    For quick testing or to avoid timeouts in resource-constrained environments, you can train on a smaller subset of the data using the `--num-examples` flag.

    For example, to train the smart prompting model on only 50 examples:
    ```python
    !python fine_tune.py smart_prompting --num-examples 50
    ```

3.  **Monitor the Output:** You will see progress bars and logging output from the `transformers` library as the models are trained.

4.  **Verify the Output:** Once the scripts are finished, you will have a new directory named `fine-tuned-models` inside your `training` directory. This will contain two subdirectories: `smart-prompting-model` and `comment-classification-model`. These are your custom-trained models!

---

## Step 5: Deploy Your Models

To use your models in the application, you need to host them on a service that provides an inference API. The Hugging Face Hub is an excellent platform for this.

1.  **Log in to Hugging Face:** You will need a Hugging Face account. In a Colab cell, run the following to log in. You'll need to generate an Access Token with `write` permissions from your Hugging Face account settings.
    ```python
    from huggingface_hub import login
    login() # Paste your token when prompted
    ```
2.  **Push Your Models to the Hub:** Run the following Python code in a new cell to upload your two fine-tuned models to your Hugging Face account. Replace `your-hf-username` with your actual Hugging Face username.
    ```python
    from transformers import AutoModelForCausalLM, AutoTokenizer

    # --- Push the Smart Prompting Model ---
    model_path = "./fine-tuned-models/smart-prompting-model"
    repo_name = "your-hf-username/tinyllama-jules-smart-prompting"

    model = AutoModelForCausalLM.from_pretrained(model_path)
    tokenizer = AutoTokenizer.from_pretrained(model_path)

    model.push_to_hub(repo_name)
    tokenizer.push_to_hub(repo_name)
    print(f"Pushed smart prompting model to: {repo_name}")

    # --- Push the Comment Classification Model ---
    model_path = "./fine-tuned-models/comment-classification-model"
    repo_name = "your-hf-username/tinyllama-jules-comment-classification"

    model = AutoModelForCausalLM.from_pretrained(model_path)
    tokenizer = AutoTokenizer.from_pretrained(model_path)

    model.push_to_hub(repo_name)
    tokenizer.push_to_hub(repo_name)
    print(f"Pushed comment classification model to: {repo_name}")
    ```
3.  **Activate an Inference Endpoint:** Go to your model repositories on the Hugging Face Hub. You can use their **Inference API** for light usage or deploy the model to a dedicated **Inference Endpoint** for production use. Follow their documentation to get your API URL and an API key.

---

## Step 6: Integrate with Jules Command Center

This is the final step!

1.  **Update Your Environment File:** Go back to your local `jules-command-center` project and open the `.env.local` file.
2.  **Set the API Variables:** Update the `AI_API_URL` and `AI_API_KEY` with the details from the inference endpoint you just set up on Hugging Face. You will need separate endpoints for each of the two models.
3.  **Restart the Application:** Relaunch your Jules Command Center application.

Your application is now running with a custom-trained AI model that is expertly tailored to your specific workflow. Congratulations!