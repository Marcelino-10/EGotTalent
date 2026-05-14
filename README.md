# EGotTalent: Talent Submission App

This repository houses the backend API and frontend serving for the "E3dadi Got Talent" application. It's responsible for receiving talent show submissions, calculating weighted scores, storing this data, and providing an interface to view aggregated results.

## Project Overview

The `EGotTalent` repository is a key component of a larger talent management system. It focuses on the core web application functionality, enabling users to submit scores and view performance metrics.

| Repository | Description |
|---|---|
| EGotTalent | Backend API (Express.js) and frontend serving for the "E3dadi Got Talent" application. Manages score calculations, data storage, and retrieval. |

This project provides a clear separation of concerns, with the backend handling data persistence and API logic, and the frontend offering a user-friendly interface for interaction.

## Development

This project uses npm as its package manager.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd EGotTalent
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up environment variables:** Create a `.env` file in the root directory with your MongoDB connection string:
    ```dotenv
    MONGO_URI=your_mongodb_connection_string
    PORT=3000
    ```

### Running the Application

To start the development server, use the following command:

```bash
node app.js
```

The server will start, typically on port 3000, and a confirmation message will be logged to the console.

### Code Formatting and Linting

This project does not have pre-configured code formatting or linting scripts. It is recommended to maintain consistent code style manually or integrate tools like Prettier and ESLint into your development workflow.

## Architecture

The EGotTalent application employs a client-server architecture, utilizing Express.js for the backend and MongoDB for data storage.

*   **Express.js Server (`app.js`):**
    *   **Middleware:** `express.json()` and `express.urlencoded()` for parsing request bodies, and `express.static()` for serving frontend files.
    *   **Database Models:** Defines a `Submission` schema using Mongoose to store participant details (name, score, weight, calculated result) and timestamps.
    *   **API Endpoints:**
        *   `GET /`: Serves the main `index.html` file, rendering the user interface.
        *   `POST /calcScore`: Accepts new submissions, calculates the `result` (score \* weight), and saves the entry to the database.
        *   `GET /scores`: Fetches the 500 most recent submissions and calculates an aggregated `finalScore` (total weighted result / total weight). It returns both the submissions and the aggregated statistics.
    *   **Database Connection:** Connects to MongoDB using `process.env.MONGO_URI`.
    *   **Server Initialization:** Logs a message upon successful startup.

*   **Frontend Interface (`index.html`):**
    *   Provides the user interface with input fields for participant name and score, a submit button, and areas to display the overall final score and a list of recent submissions.

*   **Client-side Logic (`script.js`):**
    *   `postSubmission(name, score)`: Handles submitting new score data to the `/calcScore` API endpoint.
    *   `loadScores()`: Fetches score data from the `/scores` API endpoint and updates the DOM to display the final score and the list of recent submissions.

*   **Database (MongoDB):**
    *   Stores all submission records. The `Submission` model defines the data structure.

**Data Flow:**

1.  The user accesses the application via `index.html`.
2.  When a user submits a score, `script.js` sends a POST request to `/calcScore`.
3.  The Express server receives the data, calculates the weighted result, and saves it to MongoDB.
4.  To view scores, `script.js` makes a GET request to `/scores`.
5.  The server queries MongoDB, computes the aggregated final score, and returns the results.
6.  `script.js` then updates the `index.html` to reflect the latest scores and submissions.