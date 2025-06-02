# 🌐 CollabSphere – Open Project Collaboration Platform


---

## 🧠 Statement 

**CollabSphere** is a full-stack web application designed to empower individuals to start, join, and collaborate on projects in an open, democratic environment.  
It blends the collaborative workflow of **GitHub** with the skill-showcasing power of **LinkedIn**, creating a true peer-to-peer creation ecosystem.

Built using the **MERN stack** with real-time features and clean UI, CollabSphere promotes equal opportunity in project ownership and contribution.

---

## ⚙️ Features

### 🛡️ Secure JWT Authentication
* User registration & login with **JSON Web Tokens**
* Profiles with name, bio, skills, and GitHub/LinkedIn links

### 📝 Project Creation & Management
* Create  projects
* Edit details like title, description, and required skills
* Delete Project
* Team Management  

### 🔍 Project Discovery & Filters
* Explore public projects via the **Project Feed**
* Filter by skillset or technology stack

### 🤝 Join Requests & Invitations
* Request to join public projects
* Project owners can invite users
* Your Pending Join Requests
* Recieved Join Requests (For Your Projects)
* Recieved Collaboration Invites

### 👥 Team Management
* Owners can view, invite, or remove team members
** (Future Scope)*: Assign roles and permissions

### 🔔 Real-time Notifications
* Powered by **Socket.IO**
* Alerts for join requests, responses, invites, and team changes
* Notifications for Unread Notifications

### 🧑‍💼  User Profiles
* View our profile details 
- View others' bios, skills, and projects
- Invite users directly from their profile

---

## 💻 Technologies Used

| Layer       | Stack / Tools                                           |
|-------------|---------------------------------------------------------|
| Frontend    | React.js, React Router, Axios, Bootstrap |
| Backend     | Node.js, Express.js, Mongoose, JWT, bcryptjs           |
| Database    | MongoDB (local or cloud via MongoDB Atlas)             |
| Real-Time   | Socket.IO                                               |
| UI Helpers  | react-select, date-fns                                  |

---

📍 Landing Page

* Introduction to the platform, how it works, and a call-to-action to log in or register.
---

📝 Register Page

* Allows new users to create an account by entering their profile details such as name, bio, skills, and social links.
---

🔐 Login Page

* Secure login form for existing users using email and password authentication.
---

🧭 Dashboard

* A personalized user hub showing:
  -Projects you created
  -Projects you've joined
  -Collaboration requests you've sent or received
  -Invitations awaiting your response
---

🌍 Project Feed

* Explore all public projects, filter by required skills or tech stacks, and find relevant collaboration opportunities.
---

🔍 Project Details Page

* View a complete overview of a project including:
 -Description
 -Required skills
 -Owner information
 -Option to request to join
---

🛠️ Create Project Page

* Form-based interface to launch a new project by providing title, description, and skills needed.
---

✏️ Edit Project Page

* Modify the details of a project you own, including its status (Open, In Progress, Completed).
---

👤 User Profile Page

* View another user's profile including their:
  -Bio
  -Skills
  -Social links
  -Projects created and joined
  -Option to invite them to collaborate.
---

🔔 Notifications Page

* Centralized place to manage:
  -Incoming join requests
  -Collaboration invitations
  -Accepted/declined updates
  -Team member activity
  
* Group Chat Notifications
   - where we find our Unread notifications
---

👥 Team Management Page

* Manage your project's team members:
 -View current collaborators
 -Invite new users
 -Remove members if needed
---

❌ 404 Page

* Displayed when a user tries to access a route that doesn't exist.
---

## 🛠️ Setup Instructions

### 📦 Prerequisites

* Node.js (v16+ recommended)*
* npm 
* MongoDB (local instance or MongoDB Atlas)
* Git

---

### 🔧 Backend Setup

* git clone https://github.com/yourusername/CollabSphere.git
* cd collabsphere/backend
* Update your .env with actual values:
   - PORT=5001
   - MONGO_URI=mongodb://localhost:27017/
   - JWT_SECRET=your_secure_jwt_secret
   - FRONTEND_URL=http://localhost:3000
* Install Dependencies:
   - npm install
* Run the Development Server:
   - npm start

---

### 🎨 Frontend Setup 

* Navigate to the Frontend:
   - cd ../frontend
* Update your .env file with actual values:
   - REACT_APP_API_URL=http://localhost:5001/api
   - REACT_APP_SOCKET_URL=http://localhost:5001
* Install Dependencies:
   - npm install
* Run the Development Server:
   - npm start
