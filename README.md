# 🌐 Route Social Media App

<div align="center">

![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite_8-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase_Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![React Query](https://img.shields.io/badge/TanStack_Query_v5-FF4154?style=for-the-badge&logo=react-query&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel_Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)

<br />

**A modern, production-ready, full-stack social networking web application built with React 19, TypeScript, Tailwind CSS v4, and Firebase Firestore.**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Architecture](#-architecture) • [Getting Started](#-getting-started) • [Environment Variables](#-environment-variables) • [Project Structure](#-project-structure) • [Deployment](#-deployment)

</div>

---

## 📖 Overview

**Route Social Media** is an interactive, responsive social platform crafted to deliver a fast and smooth user experience. It combines a RESTful social network backend for feeds, posts, reactions, comments, and profile management with **Firebase Firestore** for real-time, low-latency 1-on-1 direct messaging.

Designed with **React 19**, **Tailwind CSS v4**, and **TanStack React Query v5**, the application provides optimistic UI updates, multi-level threaded discussions, seamless authentication, and complete light/dark theme personalization.

---

## ✨ Features

### 🔐 Authentication & Account Management
- **Email & Password Authentication**: Full registration and login workflows with secure JWT storage.
- **Google OAuth 2.0 Integration**: One-click Google Sign-In via Google Identity Services.
- **Form Validation**: Strict client-side schemas using **Zod** paired with **React Hook Form**.
- **Route Guards**: Secure private routes (`Protectedroute`) and guest-only redirects (`AuthProtectedroute`).
- **Account Settings**: Password modification, profile editing, and secure session termination.

### 📰 Social Feed & Content Creation
- **Infinite Feed**: Smooth post streaming powered by TanStack Query caching and pagination.
- **Media-Rich Posts**: Create and publish posts containing text and image attachments.
- **Social Reactions**: Instant Like/Unlike interactions with optimistic UI updates.
- **Bookmarks**: Save important posts to a dedicated bookmarks tab (`/bookmarks`).
- **Post Sharing**: Quick link copying and native sharing capabilities.
- **Detailed Post View**: Dedicated route (`/post/:id`) highlighting author information, media, and complete discussion threads.
- **Post Ownership Controls**: Delete and edit privileges strictly reserved for post authors.

### 💬 Threaded Comments & Discussions
- **Multi-Level Replies**: Reply directly to comments with organized nested discussion threads.
- **Comment Moderation**: Delete and manage personal comments with real-time DOM synchronization.

### ⚡ Real-Time Direct Messaging (Chat)
- **100% Real-Time Firestore Sync**: Live 1-on-1 conversations synchronized with Firestore snapshot listeners.
- **Zero Mock Data**: Fully functional chat flow connecting actual registered application users.
- **Active Conversations List**: Dynamic list of ongoing chats displaying user avatars, latest message snippets, timestamps, and unread counts.
- **Optimistic Message Delivery**: Outgoing messages appear immediately with pending and delivered states.
- **Read & Delivery Receipts**: Visual indicators verifying whether messages have been viewed by the recipient.
- **User Discovery & New Chat**: Modal search to quickly find any user on the platform and initiate a conversation.
- **Browser-Tab Scoped Identity**: Built-in tab-isolated Firebase authentication preventing cross-account state pollution in multi-account testing.

### 👤 Profile & Social Graph
- **Personal & Public Profiles**: View user statistics, follower/following counts, bio, join date, and personal posts.
- **Follow / Unfollow System**: Connect with other users with immediate UI counter updates.
- **Smart Follow Suggestions**: Discover relevant users to follow from the sidebar and navigation menus.
- **Global User Search**: Instant search bar in the top navigation bar to look up profiles across the platform.

### 🎨 Design & User Experience (UX)
- **Dark & Light Modes**: System-aware and manual theme switching with smooth transitions.
- **Fluid Animations**: Polished micro-interactions and dialog transitions powered by **Motion** (`motion/react`).
- **Responsive Layout**: Adaptive desktop sidebar, collapsable mobile drawer, and accessible dialogs inspired by Shadcn UI.
- **Network Resilience**: Live `OfflineBanner` notifying users instantly whenever connection drops.

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19** | Modern UI development using latest concurrent features |
| **Language** | **TypeScript 5+** | Full type safety across state, props, and API contracts |
| **Build Tool** | **Vite 8** | Ultra-fast HMR and optimized production bundling |
| **Styling** | **Tailwind CSS v4** | Modern utility-first CSS styling |
| **State Management** | **TanStack Query v5** | Server-state caching, background revalidation, and optimistic updates |
| **Realtime Database** | **Firebase Firestore** | Real-time chat messages, conversations, and online status |
| **Authentication** | **Firebase Auth + JWT** | REST JWT authentication alongside tab-scoped Firebase sessions |
| **OAuth** | **Google Identity Services** | Google OAuth 2.0 authentication |
| **Routing** | **React Router v7** | Declarative client-side routing, protected layouts, and dynamic segments |
| **Forms & Validation**| **React Hook Form + Zod** | Controlled forms with schema validation and error feedback |
| **Animations** | **Motion (`motion/react`)** | Performant spring physics and layout animations |
| **Icons** | **Lucide React & Tabler Icons** | Modern, clean vector iconography |
| **HTTP Client** | **Axios** | REST API calls for feed, profile, comments, and posts |

---

## 📂 Project Structure

```bash
social-media-app/
├── public/                # Public static assets & favicons
├── src/
│   ├── assets/            # Brand logos, fallback images & SVGs
│   ├── components/        # Reusable component library
│   │   ├── ChangePassword/# Modal & logic for updating passwords
│   │   ├── chat/          # ChatList, ChatInput, ChatBoxParts, NewChatModal
│   │   ├── comment/       # Comment list, reply forms, threaded comment items
│   │   ├── CreatePost/    # Modal & widget for publishing posts with images
│   │   ├── EditPostModal/ # Dialog for modifying existing post content
│   │   ├── FollowButton/  # Dynamic follow / unfollow toggle button
│   │   ├── FollowSuggestions/ # Recommended users widget
│   │   ├── Navbar/        # Header with search, notifications & theme toggle
│   │   ├── OfflineBanner/ # Real-time online/offline network indicator
│   │   ├── PostCard/      # Post card component with interactions
│   │   ├── ProtectedRoute/# Auth & guest route protection wrappers
│   │   ├── Sidebar/       # Responsive navigation sidebar
│   │   └── ui/            # UI primitives (Buttons, Cards, Dialogs, Toasts)
│   ├── context/           # React Contexts (AuthContext, ThemeContext)
│   ├── hooks/             # Custom hooks (useFeedPosts, usePostActions, useCommentActions)
│   ├── Layout/            # Master layout wrapping navbar, sidebar, and views
│   ├── lib/               # Utilities, Firebase initialization & Google OAuth
│   ├── Pages/             # Application route views
│   │   ├── Bookmarks/     # Saved posts screen
│   │   ├── chats/         # Real-time chat dashboard
│   │   ├── home/          # Main timeline & social feed
│   │   ├── Login/         # User login screen
│   │   ├── SignUp/        # User registration screen
│   │   ├── profile/       # User profile screen (self & other users)
│   │   ├── PostDetails/   # Single post view with comments
│   │   ├── settings/      # User settings & security
│   │   └── Welcome/       # Marketing landing page
│   ├── services/          # Firebase chat service & Firestore queries
│   ├── types/             # TypeScript definitions (Post, Chat, Comment, User)
│   ├── App.tsx            # Root router & provider configuration
│   └── main.tsx           # Application entry point
├── .env.example           # Example environment variables
├── package.json           # Project dependencies & scripts
├── tsconfig.json          # TypeScript compiler configuration
└── vite.config.ts         # Vite configuration
```

---

## 💻 Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Package Manager**: `npm`, `pnpm`, or `yarn`

### 1. Clone the repository
```bash
git clone https://github.com/your-username/social-media-app.git
cd social-media-app
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the project root directory:

```bash
cp .env.example .env
```

Add your Google Client ID:
```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

> **Firebase Configuration**: The Firebase project setup is configured in [`src/lib/firebase.ts`](src/lib/firebase.ts). You can use your own Firebase configuration by replacing the credentials in that file.

### 4. Start the development server
```bash
npm run dev
```

Visit [`http://localhost:5173`](http://localhost:5173) in your browser.

### 5. Build for production
```bash
npm run build
```

To test the production build locally:
```bash
npm run preview
```

---

## 🔑 Environment Variables

| Variable | Required | Description |
| :--- | :---: | :--- |
| `VITE_GOOGLE_CLIENT_ID` | Optional | Google OAuth 2.0 Web Client ID for Google Sign-In |

---

## 🌐 Deployment

The application is pre-configured for one-click deployment on **Vercel** with single-page application (SPA) rewrite rules defined in `vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Deploying to Vercel:
1. Push your code to a GitHub repository.
2. Go to [Vercel Dashboard](https://vercel.com) and click **"Add New Project"**.
3. Import your repository and select **Vite** as the framework preset.
4. Add any environment variables (e.g. `VITE_GOOGLE_CLIENT_ID`).
5. Click **Deploy**.

---

## 🤝 Contributing

Contributions are always welcome! If you would like to improve the project:

1. **Fork** the repository.
2. Create a new feature branch (`git checkout -b feature/NewFeature`).
3. Commit your changes (`git commit -m 'Add NewFeature'`).
4. Push to the branch (`git push origin feature/NewFeature`).
5. Open a **Pull Request**.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
  <sub>Developed with passion using modern web technologies.</sub>
</div>
