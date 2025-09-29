# Jules Command Center

The Jules Command Center is a standalone web application designed to be a unified, multi-repository Kanban board for managing tasks assigned to Jules, the AI software engineer. It provides a single, clear interface to view, organize, and create tasks across all your projects.

![Jules Command Center Screenshot](https://user-images.githubusercontent.com/12345/67890.png) <!-- Placeholder image -->

## Features

- **Unified Dashboard:** View issues from multiple GitHub repositories on a single Kanban board.
- **Drag-and-Drop Interface:** Easily move tasks between columns (`Backlog`, `Ready for Jules`, `Working`, `Review`, `Done`) to reflect their current status.
- **Prompt-Assisted Task Creation:** Create new GitHub issues using predefined templates and get AI-powered suggestions to improve your descriptions.
- **Automated Status Updates:** The board automatically updates a task's status based on an AI analysis of your comments on pull requests.
- **Real-time Data:** Fetches live issue data directly from the GitHub API.
- **Configurable:** Easily configure which repositories you want to manage.

## Getting Started

Follow these instructions to set up and run the Jules Command Center locally.

### Step 1: Clone the Repository

First, clone this repository to your local machine if you haven't already.

### Step 2: Create Your Environment Configuration

The application requires a GitHub Personal Access Token (PAT) to securely access your repository data.

1.  **Generate a GitHub Personal Access Token:**
    *   Go to your GitHub **[Developer settings](https://github.com/settings/tokens?type=beta)**.
    *   Click **"Generate new token"** (select the "classic" token type if prompted).
    *   Give your token a descriptive name (e.g., "JulesCommandCenter").
    *   Set an expiration date for the token.
    *   Under **"Scopes"**, select the entire **`repo`** scope. This is required to read repository data and create issues.
    *   Click **"Generate token"** and **copy the token immediately**. You will not be able to see it again.

2.  **Create the `.env.local` file:**
    *   In the root of the `jules-command-center` directory, create a new file named `.env.local`.
    *   Copy the following content into the file:

    ```env
    # The Personal Access Token (PAT) you just generated from GitHub.
    GITHUB_PAT="your_github_personal_access_token_here"

    # A comma-separated list of the repositories you want to display.
    # Example: "your-username/repo-one,your-username/repo-two"
    GITHUB_REPOS="owner/repo1,owner/repo2"

    # --- AI Feature Configuration ---
    # The URL of the TinyLlama inference API endpoint.
    AI_API_URL="your_inference_api_url_here"

    # The API key for the inference service, if required.
    AI_API_KEY="your_inference_api_key_here"

    # A secret for verifying GitHub webhook payloads.
    GITHUB_WEBHOOK_SECRET="your_secret_here"
    ```

3.  **Update the variables:**
    *   Replace `"your_github_personal_access_token_here"` with the PAT you copied.
    *   Replace `"owner/repo1,owner/repo2"` with the list of your GitHub repositories that you want to manage.

### Step 3: Set Up the GitHub Webhook

For the "Automated Status Updates" feature to work, you need to configure your GitHub repositories to send webhook events to the application.

1.  **Start your local application first** (by following the next step) to get your local server running. You will need a publicly accessible URL for your local server. We recommend using a tool like **[ngrok](https://ngrok.com/)** to expose your `localhost:3000`.
    *   Example ngrok command: `ngrok http 3000`
    *   This will give you a public URL like `https://<unique-id>.ngrok-free.app`.

2.  **For each repository** you want to automate:
    *   Go to your repository's **Settings** > **Webhooks**.
    *   Click **"Add webhook"**.
    *   **Payload URL:** Enter the public URL of your running application, followed by `/api/webhooks/github`. Example: `https://<unique-id>.ngrok-free.app/api/webhooks/github`.
    *   **Content type:** Select `application/json`.
    *   **Secret:** You must set a webhook secret for security. Generate a secure, random string and add it to your `.env.local` file as `GITHUB_WEBHOOK_SECRET="your_secret_here"`. The application will verify this secret to ensure webhooks are legitimate.
    *   **Which events would you like to trigger this webhook?** Select "Let me select individual events." and then choose **"Issue comments"** and **"Pull request review comments"**.
    *   Make sure **"Active"** is checked, and click **"Add webhook"**.

### Step 4: Install Dependencies and Run the Application

Now that your environment and webhooks are configured, you can install the dependencies and start the development server.

```bash
# Navigate to the project directory
cd jules-command-center

# Install project dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. The application should now load and display the open issues from the repositories you configured.

### AI Model Training

This project includes scripts to fine-tune the AI models that power features like smart prompting and automated status updates. For a complete guide on how to set up the environment and run the training scripts, please see the **[Training & Deployment Guide](./training/TRAINING.md)**.

## How to Use

- **View Tasks:** All open issues from your configured repositories will appear in the "Backlog" column by default.
- **Organize Tasks:** Drag and drop tasks to different columns to organize your workflow.
- **Create a New Task:** Click the "New Task" button in the header. A modal will appear where you can:
    1.  Select the **Repository** for the new task.
    2.  Choose a **Task Type** (e.g., 'Bug Fix', 'New Feature'). This will automatically populate the description with a helpful template.
    3.  Fill in the **Title** and complete the templated **Description**.
    4.  Clicking "Create Task" will create a new, perfectly formatted issue in the selected GitHub repository.