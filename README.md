🌙 Moon Knight — Full-Stack Lunar Photo Editing App
🔗 Hosted Frontend URL https://moon-knight-jet.vercel.app/
Backend URL -> https://moon-knight.onrender.com/
Db URL -> https://console.neon.tech/app/projects/dry-river-19258437

📌 Overview

Moon Knight is a full-stack web application designed for editing and organizing moon / night-photography images.
It provides a smooth photo-editing experience, user authentication, album management, and cloud-based saving — powered by a React frontend and Node.js backend.

🧩 Features (Frontend + Backend)
🌗 Frontend (React + Vite)

Upload and preview moon images

Edit brightness, contrast, saturation & more

Manage albums and photo collections

Lightweight, fast UI optimized for night photos

🌑 Backend (Node + Express + Prisma)

User authentication (Login/Signup)

Image edit saving and retrieval

Album creation + image storage

API endpoints for all operations

DB powered by Prisma ORM

🗂 Repository Structure
Moon_Knight-/
│
├── moon_backend/             # Backend server (Node.js)
│   ├── src/                  # Controllers, Routes, Services
│   ├── prisma/               # Prisma Schema & Migrations
│   ├── package.json
│   └── .env.example
│
├── src/                      # React frontend
├── public/                   # Static assets
├── .env                      # Frontend env variables
├── package.json              # Frontend dependencies
└── README.md

🚀 Installation & Setup
1️⃣ Clone the Repository
git clone https://github.com/pankaj-cod/Moon_Knight-.git
cd Moon_Knight-

🎨 FRONTEND SETUP (React + Vite)
Install dependencies
npm install

Run development server
npm run dev

Environment variables

Create .env:

VITE_API_URL=http://localhost:5000

⚙️ BACKEND SETUP (Node.js + Prisma)

Go to backend folder:

cd moon_backend
npm install

Prisma setup
npx prisma generate
npx prisma migrate dev

Run backend server
npm run dev

Backend .env example
DATABASE_URL=your_database_connection
JWT_SECRET=your_secret_key
CLOUDINARY_URL=your_cloudinary_key

🌍 Deployment
Frontend (LIVE)

✔ Hosted on Vercel
👉 https://moon-knight-jet.vercel.app

Backend

Deployable on:

Railway

Render

Supabase (DB)

PlanetScale (optional)

Config files included:
railway.json, nixpacks.toml

📄 PROJECT PROPOSAL (Required Section)
Moon Knight — Full-Stack Lunar Photo Editing App
Project Proposal
1. Introduction

Moon Knight is a specialized web application tailored for users interested in editing night-time and moon photography. It offers essential editing tools in a lightweight interface combined with cloud storage and album management.

2. Problem Statement

Moon photography often requires quick enhancements such as brightness, clarity, and contrast corrections. Desktop tools are heavy and online editors do not focus on night photography.
Moon Knight solves this by providing a simple, fast, cloud-connected editor.

3. Objectives

Create a web-based photo editor with essential controls

Implement user authentication

Allow users to save and manage edited images

Enable album creation & storage

Deploy both frontend + backend to the cloud

4. Tech Stack
Frontend:

React

Vite

Tailwind (optional)

Backend:

Node.js

Express

Prisma ORM

Cloudinary for image storage

Database:

PostgreSQL / MySQL

Deployment:

Vercel (frontend)

Railway / Render (backend)

5. Scope

This project includes:

Photo upload + editing interface

API service for saving images

Login/signup system

Album management

Full deployment

Responsive UI

6. Expected Outcome

A fully deployed, user-ready platform where anyone can upload, edit, and save moon photographs seamlessly across devices.

🤝 Contributing

Fork the repo

Create a branch:

git checkout -b feature-name


Commit changes

Open a Pull Request

📬 Contact

For issues, suggestions, or improvements, open an Issue on GitHub.
