# Jules Command Center

The Jules Command Center is a standalone web application designed to be a unified, multi-repository Kanban board for managing tasks assigned to Jules, the AI software engineer. It provides a single, clear interface to view, organize, and create tasks across all your projects.

![Jules Command Center Screenshot](https://user-images.githubusercontent.com/12345/67890.png) <!-- Placeholder image -->

## Features

- **Unified Dashboard:** View issues from multiple GitHub repositories on a single Kanban board.
- **Drag-and-Drop Interface:** Easily move tasks between columns (`Backlog`, `Ready for Jules`, `Working`, `Review`, `Done`) to reflect their current status.
- **Prompt-Assisted Task Creation:** Create new GitHub issues using predefined templates for 'Bug Fix', 'New Feature', and more, ensuring your requests are perfectly structured.
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
    # Replace with your actual username and repository names.
    # Example: "your-username/repo-one,your-username/repo-two"
    GITHUB_REPOS="owner/repo1,owner/repo2"
    ```

3.  **Update the variables:**
    *   Replace `"your_github_personal_access_token_here"` with the PAT you copied.
    *   Replace `"owner/repo1,owner/repo2"` with the list of your GitHub repositories that you want to manage.

### Step 3: Install Dependencies and Run the Application

Now that your environment is configured, you can install the dependencies and start the development server.

```bash
# Navigate to the project directory
cd jules-command-center

# Install project dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. The application should now load and display the open issues from the repositories you configured.

## How to Use

- **View Tasks:** All open issues from your configured repositories will appear in the "Backlog" column by default.
- **Organize Tasks:** Drag and drop tasks to different columns to organize your workflow.
- **Create a New Task:** Click the "New Task" button in the header. A modal will appear where you can:
    1.  Select the **Repository** for the new task.
    2.  Choose a **Task Type** (e.g., 'Bug Fix', 'New Feature'). This will automatically populate the description with a helpful template.
    3.  Fill in the **Title** and complete the templated **Description**.
    4.  Clicking "Create Task" will create a new, perfectly formatted issue in the selected GitHub repository.