# CollabSphere – Open Project Collaboration Platform 🚀

**CollabSphere** is a dynamic, peer-to-peer project collaboration platform designed to connect individuals with diverse skills and ideas. It empowers users to initiate, discover, and contribute to projects in an open and equitable environment. Think of it as a blend of GitHub's project hosting capabilities with LinkedIn's networking and skill-showcasing aspects, all focused on fostering collaborative creation.



## ✨ Key Features

CollabSphere offers a rich set of features to facilitate seamless project collaboration:

🔐 **Simple JWT-based User Authentication:**
   - Secure user registration with email, password, and profile details.
   - Robust login system using JSON Web Tokens for session management.
   - Profile information includes name, bio, skills, and links to GitHub/LinkedIn.

📝 **Project Creation & Management:**
   - Users can easily create new projects, providing a title, detailed description, and required skills.
   - Option to set projects as public (discoverable by anyone) or private (invite-only).
   - Project owners can edit project details and manage its status (Open, In Progress, Completed).

🔍 **Project Discovery & Exploration:**
   - A dedicated "Project Feed" page where users can browse all public projects.
   - Filter projects by specific skills or tech stacks to find relevant opportunities.
   - Project cards display key information: title, required skills, and project owner.

🙋‍♂️ **Collaboration & Team Building:**
   - **Request to Join:** Users can send collaboration requests to join projects that interest them.
   - **Invitations:** Project owners (and potentially team members) can invite other users to collaborate on their projects.
   - **Accept/Reject Mechanism:** Users can accept or decline incoming collaboration requests and project invitations.

👥 **Team Management:**
   - Project owners have a dedicated page to view and manage their project team members.
   - Functionality to remove members from a project.
   - (Future Scope: Assign roles and permissions within a team).

📊 **Personalized Dashboard:**
   - A central hub for each logged-in user.
   - Displays:
     - Projects they created.
     - Projects they have joined as a collaborator.
     - Pending collaboration requests they've sent.
     - Received collaboration invitations awaiting their response.
     - Received join requests for projects they own.

📬 **Real-time Notifications:**
   - Integrated notification system powered by Socket.IO.
   - Users receive instant notifications for:
     - New join requests for their projects.
     - Updates on their sent join requests (accepted/rejected).
     - New project invitations.
     - Updates on their sent invitations (accepted/declined).
     - Team members joining or leaving a project.
   - A dedicated notifications page to view and manage all alerts.

📄 **User Profiles:**
   - Publicly viewable user profiles (respecting privacy settings if implemented).
   - Displays user's name, bio, skills, and social links (GitHub, LinkedIn).
   - Lists projects created by the user and projects they have joined.
   - Option for users to edit their own profile information.

🌐 **Equal Opportunity Collaboration:**
   - No predefined roles like "creator" vs. "student." Every user has the same capabilities to start new projects or join existing ones, fostering a truly peer-to-peer environment.

## 🛠️ Tech Stack

*   **Frontend:** React.js, React Router, React-Bootstrap (or Tailwind CSS), Axios, Socket.IO Client, date-fns, react-select.
*   **Backend:** Node.js, Express.js, MongoDB (with Mongoose), JSON Web Tokens (JWT), Socket.IO, bcryptjs, express-validator.
*   **Database:** MongoDB.

## 🚀 Getting Started

### Prerequisites

*   Node.js (v16+ recommended)
*   npm or yarn
*   MongoDB (local instance or cloud service like MongoDB Atlas)
*   Git (recommended)

### Backend Setup

1.  Navigate to the `backend` directory: `cd backend`
2.  Create `.env` from `.env.example`: `cp .env.example .env`
3.  Update `.env` with your `MONGO_URI`, `JWT_SECRET`, and `FRONTEND_URL`.
4.  Install dependencies: `npm install` (or `yarn install`)
5.  Start the server: `npm run dev` (for development) or `npm start`

### Frontend Setup

1.  Navigate to the `frontend` directory: `cd frontend`
2.  Create `.env` from `.env.example`: `cp .env.example .env`
3.  Update `.env` with `REACT_APP_API_URL` (e.g., `http://localhost:5001/api`) and `REACT_APP_SOCKET_URL` (e.g., `http://localhost:5001`).
4.  Install dependencies: `npm install` (or `yarn install`)
5.  Start the development server: `npm start` (or `yarn start`)

The frontend will typically be available at `http://localhost:3000` and the backend at `http://localhost:5001`.

## 🗺️ Pages Overview

1.  **Landing Page (`/`):** Introduction, "How it works," and CTA to login/register.
2.  **Register Page (`/register`):** New user account creation.
3.  **Login Page (`/login`):** Existing user sign-in.
4.  **Dashboard Page (`/dashboard`):** User's central hub for projects and collaborations.
5.  **Project Feed (`/projects`):** Discover and search all public projects.
6.  **Project Details Page (`/projects/:id`):** Full view of a single project, option to request join.
7.  **Create Project Page (`/create-project`):** Form to create a new project.
8.  **Edit Project Page (`/edit-project/:projectId`):** Modify details of an owned project.
9.  **Profile Page (`/profile/:userId`):** View any user's profile, invite others to projects.
10. **Notifications Page (`/notifications`):** View all project-related activity and manage requests/invites.
11. **Team Management Page (`/team/:projectId`):** For project owners to view/edit team members and invite new ones.
12. **404 Page:** For routes not found.

## 🤝 Contributing

Contributions are welcome! If you'd like to contribute, please follow these steps:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature/YourFeature`).
3. Make your changes.
4. Commit your changes (`git commit -m 'Add some feature'`).
5. Push to the branch (`git push origin feature/YourFeature`).
6. Open a Pull Request.

Please make sure to update tests as appropriate.

## 📜 License

This project is licensed under the MIT License - see the `LICENSE.md` file (if you create one) for details.

---

**To make this README even better, consider adding:**
*   A high-quality logo or mockup image at the top.
*   A `LICENSE.md` file.
*   More detailed setup instructions if there are any non-obvious steps.
*   Deployment guidelines (if you plan to deploy it).
*   A "Future Enhancements" section if you have more ideas.
