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

### Step 2: Configure Your GitHub OAuth App

The application uses GitHub OAuth for authentication. You'll need to create a GitHub OAuth App to get the required credentials.

1.  **Navigate to GitHub Developer Settings:**
    *   Go to your GitHub **Settings** > **Developer settings**.
    *   Click on **"OAuth Apps"** in the left sidebar, then click the **"New OAuth App"** button.

2.  **Fill in the Application Details:**
    *   **Application name:** `Jules Command Center (Local)`
    *   **Homepage URL:** `http://localhost:3000`
    *   **Authorization callback URL:** `http://localhost:3000/api/auth/callback/github`

3.  **Generate a Client Secret:**
    *   Click the **"Register application"** button.
    *   On the next page, you will see your **Client ID**.
    *   Click the **"Generate a new client secret"** button. Copy the secret immediately—you won't be able to see it again.

### Step 3: Create Your Environment Configuration

1.  **Create the `.env.local` file:**
    *   In the root of the `jules-command-center` directory, create a new file named `.env.local`.
    *   Copy the following content into the file:

    ```env
    # --- GitHub OAuth App Credentials ---
    # Copy the Client ID from your GitHub OAuth App page.
    GITHUB_CLIENT_ID="your_client_id_here"
    # Copy the Client Secret you generated.
    GITHUB_CLIENT_SECRET="your_client_secret_here"

    # --- NextAuth Configuration ---
    # A secret for encrypting the session JWT. Generate one here: https://generate-secret.vercel.app/32
    NEXTAUTH_SECRET="your_nextauth_secret_here"

    # --- Application Settings ---
    # A comma-separated list of the repositories you want to display.
    # Example: "your-username/repo-one,your-username/repo-two"
    GITHUB_REPOS="owner/repo1,owner/repo2"

    # --- AI Feature Configuration (Optional) ---
    # The URL of the TinyLlama inference API endpoint.
    AI_API_URL="your_inference_api_url_here"
    # The API key for the inference service, if required.
    AI_API_KEY="your_inference_api_key_here"

    # --- Webhook Configuration (Optional) ---
    # A secret for verifying GitHub webhook payloads.
    GITHUB_WEBHOOK_SECRET="your_secret_here"
    ```

2.  **Update the variables:**
    *   Replace `"your_client_id_here"` and `"your_client_secret_here"` with the credentials from your GitHub OAuth App.
    *   Generate a `NEXTAUTH_SECRET` and paste it in place of `"your_nextauth_secret_here"`.
    *   Replace `"owner/repo1,owner/repo2"` with the list of your GitHub repositories.

### Step 4: Set Up the GitHub Webhook (Optional)

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

## Screenshots

> **Note:** Due to persistent technical issues in the development environment, we are currently unable to generate updated screenshots. This section will be updated with images of the application's features as soon as the environment is stabilized.

**Kanban Board**
*A unified view of all tasks across your repositories.*
![Kanban Board Placeholder](https://user-images.githubusercontent.com/12345/67890.png) <!-- Placeholder -->

**Analytics Dashboard**
*Gain insights into project velocity and task distribution.*
![Analytics Dashboard Placeholder](https://user-images.githubusercontent.com/12345/67890.png) <!-- Placeholder -->

## Keywords

`Kanban Board`, `Project Management`, `AI Assistant`, `Software Development`, `GitHub Issues`, `Task Management`, `Developer Tool`, `Next.js`, `React`, `TypeScript`, `AI-Powered`, `Workflow Automation`, `Jules`, `Command Center`, `Analytics`