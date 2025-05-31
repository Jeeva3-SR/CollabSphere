import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import User from './models/User.js';
import Project from './models/Project.js';
// Import other models if you want to seed them: Notification, CollaborationRequest, Invitation

dotenv.config(); // To load .env variables like MONGO_URI

const seedData = async () => {
  try {
    await connectDB(); // Connect to the database

    // Clear existing data (optional, be careful with this in production)
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Project.deleteMany({});
    // await Notification.deleteMany({});
    // await CollaborationRequest.deleteMany({});
    // await Invitation.deleteMany({});
    console.log('Existing data cleared.');

    // --- Create Users ---
    const users = [];
    const user1 = new User({
      name: 'Alice Wonderland',
      email: 'alice@example.com',
      password: 'password123', // Password will be hashed by the pre-save hook
      bio: 'Curious developer exploring new technologies. Passionate about open source and collaborative projects.',
      skills: ['javascript', 'react', 'node.js', 'mongodb'],
      githubLink: 'https://github.com/alice',
      linkedinLink: 'https://linkedin.com/in/alice',
      avatar: 'https://i.pravatar.cc/150?u=alice@example.com'
    });
    users.push(await user1.save());

    const user2 = new User({
      name: 'Bob The Builder',
      email: 'bob@example.com',
      password: 'password123',
      bio: 'Full-stack engineer with a knack for building scalable web applications. Loves Python and Django.',
      skills: ['python', 'django', 'sql', 'docker', 'aws'],
      githubLink: 'https://github.com/bob',
      linkedinLink: 'https://linkedin.com/in/bob',
      avatar: 'https://i.pravatar.cc/150?u=bob@example.com'
    });
    users.push(await user2.save());

    const user3 = new User({
      name: 'Carol Danvers',
      email: 'carol@example.com',
      password: 'password123',
      bio: 'UI/UX designer focused on creating intuitive and beautiful user experiences. Proficient in Figma and Adobe XD.',
      skills: ['ui-design', 'ux-research', 'figma', 'adobe-xd', 'prototyping'],
      githubLink: 'https://github.com/carol',
      linkedinLink: 'https://linkedin.com/in/carol',
      avatar: 'https://i.pravatar.cc/150?u=carol@example.com'
    });
    users.push(await user3.save());
    console.log(`${users.length} Users created.`);


    // --- Create Projects ---
    const projects = [];
    const project1 = new Project({
      title: 'Ecoleta - Waste Collection App',
      description: 'A platform to connect people with waste collection points. Built with React Native for mobile and Node.js for the backend.',
      owner: users[0]._id, // Alice
      teamMembers: [users[0]._id],
      requiredSkills: ['react-native', 'node.js', 'express', 'sqlite'],
      isPublic: true,
      status: 'Open',
      // coverImage: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxNTgwfDB8MXxzZWFyY2h8MTF8fGVkdWNhdGlvbnxlbnwwfHx8fDE2MTk4MjAwODI&ix=X&q=80&w=400'
    });
    projects.push(await project1.save());
    users[0].createdProjects.push(project1._id);
    users[0].joinedProjects.push(project1._id);


    const project2 = new Project({
      title: 'AI Powered Recipe Generator',
      description: 'A web application that uses machine learning to generate unique recipes based on user-provided ingredients and preferences.',
      owner: users[1]._id, // Bob
      teamMembers: [users[1]._id, users[0]._id], // Bob and Alice
      requiredSkills: ['python', 'machine-learning', 'flask', 'react', 'css'],
      isPublic: true,
      status: 'In Progress',
    });
    projects.push(await project2.save());
    users[1].createdProjects.push(project2._id);
    users[1].joinedProjects.push(project2._id);
    users[0].joinedProjects.push(project2._id); // Alice also joined this

    const project3 = new Project({
      title: 'CollabSphere Platform Design',
      description: 'Designing the UI/UX for the CollabSphere project itself. Focus on user flows, wireframes, and high-fidelity mockups.',
      owner: users[2]._id, // Carol
      teamMembers: [users[2]._id],
      requiredSkills: ['ui-design', 'ux-research', 'figma', 'user-testing'],
      isPublic: false, // Private project
      status: 'Open',
    });
    projects.push(await project3.save());
    users[2].createdProjects.push(project3._id);
    users[2].joinedProjects.push(project3._id);


    // Save users again to update their project lists
    await users[0].save();
    await users[1].save();
    await users[2].save();

    console.log(`${projects.length} Projects created.`);
    console.log('Seed data inserted successfully!');
    process.exit();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

// To run the seeder: node backend/seed.js
// You might want to add command line arguments to control destroy/import
// e.g., if (process.argv[2] === '-d') { /* destroy data */ }
seedData();