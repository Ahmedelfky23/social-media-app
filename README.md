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

**A modern, high-performance, full-stack social networking web application built with React 19, TypeScript, Tailwind CSS v4, and Firebase Firestore.**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Interactive Mentions](#-interactive-mention--tagging-system) • [Architecture](#-architecture) • [Getting Started](#-getting-started) • [Project Structure](#-project-structure) • [Author](#-author)

</div>

---

## 📖 Overview

**Route Social Media** is an interactive, responsive social platform crafted to deliver a fast and modern user experience. It combines a RESTful social network backend for feeds, posts, reactions, comments, and profile management with **Firebase Firestore** for real-time, zero-latency 1-on-1 direct messaging.

Engineered with **React 19**, **Tailwind CSS v4**, and **TanStack React Query v5**, the application delivers optimistic UI updates, multi-level threaded discussions, Instagram-style interactive followers/following lists, a dynamic `@mention` engine, comprehensive legal/help pages, and complete light/dark theme personalization.

---

## ✨ Features

### 🔐 Authentication & Account Management
- **Email & Password Authentication**: Complete registration and login workflows with secure JWT storage.
- **Google OAuth 2.0 Integration**: One-click Google Sign-In powered by Google Identity Services.
- **Strict Form Validation**: Client-side schemas using **Zod** paired with **React Hook Form**.
- **Route Guards**: Secure private routes (`Protectedroute`) and guest-only redirects (`AuthProtectedroute`).
- **Account Settings**: Password modification, avatar updates, bio editing, and secure session management.

### 📰 Social Feed & Content Creation
- **Infinite Feed**: Smooth post streaming powered by TanStack Query caching and background invalidation.
- **Media-Rich Posts**: Create, edit, and publish posts with high-resolution image attachments and rich text formatting.
- **Trending Posts & Topics**: Right-aligned live trending panel featuring top-engaged posts and popular hashtags.
- **Social Reactions**: Instant Like/Unlike interactions with optimistic UI counter updates.
- **Bookmarks**: Save important posts to a dedicated bookmarks tab (`/bookmarks`).
- **Post Sharing**: Quick link copying and native post sharing capabilities.
- **Detailed Post View**: Dedicated route (`/post/:id`) highlighting author information, media, and threaded discussion trees.
- **Post Ownership Controls**: Delete and edit privileges strictly reserved for post authors.

### 🏷️ Interactive Mention & Tagging System (`@mention`)
- **Real-Time Autocomplete Dropdown**: Typing `@` in posts, comments, replies, or edit modals brings up a live suggestions list.
- **Followers & Following Prioritization**: Followers and followed users appear at the top of the mention suggestions with visual relationship badges (`Follows you` / `Following`).
- **Clickable Post & Comment Mentions**: Any `@username` or `@name` in post bodies, shared posts, or comments renders as an interactive badge that navigates directly to the mentioned user's profile (`/profile/:userId`).
- **Keyboard Navigation**: Full keyboard support (`ArrowUp`, `ArrowDown`, `Enter`, `Tab`, `Escape`) for smooth selection.
- **1-Click Toolbar Buttons**: Dedicated `@ Mention` toolbar buttons across all post and comment composers.

### 💬 Threaded Comments & Discussions
- **Multi-Level Replies**: Reply directly to comments with organized, nested discussion threads.
- **Live Comment Mentions**: Mention friends and followers within comment inputs (`AddComment`) and reply forms (`AddReply`).
- **Comment Moderation**: Edit and delete personal comments with real-time DOM synchronization.

### ⚡ Real-Time Direct Messaging (Chat)
- **100% Real-Time Firestore Sync**: Live 1-on-1 conversations synchronized with Firestore snapshot listeners.
- **Zero Mock Data**: Fully functional chat flow connecting actual registered application users.
- **Active Conversations List**: Dynamic list of ongoing chats displaying user avatars, latest message snippets, timestamps, and unread counts.
- **Optimistic Message Delivery**: Outgoing messages appear immediately with pending and delivered states.
- **Read & Delivery Receipts**: Visual indicators verifying whether messages have been viewed by the recipient.
- **User Discovery & New Chat**: Modal search to quickly find any user on the platform and initiate a conversation.
- **Browser-Tab Scoped Identity**: Built-in tab-isolated Firebase authentication preventing cross-account state pollution in multi-account testing.

### 👥 Profile & Social Graph
- **Personal & Public Profiles**: View user statistics, follower/following counts, bio, join date, and personal posts.
- **Instagram-Style Followers Modal**: Clicking on Followers or Following opens an interactive dialog featuring live follow status (`Follow`, `Following`, `Follow back`), real-time search, and direct chat shortcuts.
- **Follow / Unfollow System**: Connect with other users with immediate UI counter updates.
- **Smart Follow Suggestions**: Discover relevant users to follow from the sidebar and navigation menus.
- **Global User Search**: Instant search bar in the top navigation bar to look up profiles by name or `@username`.

### 📄 Information & Legal Pages
- **About Us (`/about`)**: Company mission, architectural highlights, tech stack badges, and lead developer information.
- **Privacy Policy (`/privacy`)**: Data safety guidelines, Cloudinary & Firebase storage disclosures, encryption standards, and user rights.
- **Terms of Service (`/terms`)**: Platform guidelines, account security rules, user conduct standards, and intellectual property.
- **Help Center & FAQs (`/help`)**: Searchable FAQ directory, category filters, interactive accordion, and instant developer feedback form.

### 🎨 Design & User Experience (UX)
- **Dark & Light Modes**: System-aware and manual theme switching with smooth transitions and persistent state.
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
| **Styling** | **Tailwind CSS v4** | Modern utility-first CSS styling with glassmorphism |
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
│   │   ├── CreatePost/    # Composer widget for publishing posts with image preview
│   │   ├── EditPostModal/ # Dialog for modifying existing post content & mentions
│   │   ├── FollowButton/  # Dynamic follow / unfollow toggle button
│   │   ├── FollowersModal/# Instagram-style modal for followers & following
│   │   ├── FollowSuggestions/ # Recommended users widget
│   │   ├── Mention/       # MentionText, MentionSuggestionsList, useMentionInput
│   │   ├── Navbar/        # Header with user search, notifications & theme toggle
│   │   ├── OfflineBanner/ # Real-time online/offline network indicator
│   │   ├── PostCard/      # Post card component with interactions & mention parsing
│   │   ├── ProtectedRoute/# Auth & guest route protection wrappers
│   │   ├── Sidebar/       # Responsive navigation sidebar
│   │   ├── TrendingWidget/# Trending posts and popular topics panel
│   │   └── ui/            # UI primitives (Buttons, Cards, Dialogs, Toasts)
│   ├── context/           # React Contexts (AuthContext, ThemeContext)
│   ├── hooks/             # Custom hooks (useFeedPosts, usePostActions, useCommentActions)
│   ├── Layout/            # Master layout wrapping navbar, sidebar, and views
│   ├── lib/               # Utilities, Firebase initialization & Google OAuth
│   ├── Pages/             # Application route views
│   │   ├── About/         # About platform & creator details
│   │   ├── Bookmarks/     # Saved posts screen
│   │   ├── chats/         # Real-time chat dashboard
│   │   ├── Help/          # Searchable FAQs & developer feedback
│   │   ├── home/          # Main timeline & social feed
│   │   ├── Login/         # User login screen
│   │   ├── NotFound/      # 404 page
│   │   ├── PostDetails/   # Single post view with comments
│   │   ├── Privacy/       # Privacy policy & data rights
│   │   ├── profile/       # User profile screen (self & other users)
│   │   ├── settings/      # User settings & security
│   │   ├── SignUp/        # User registration screen
│   │   ├── Terms/         # Terms of service
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

## 👨‍💻 Author

Developed with passion by **Ahmed El-Feky**.

- **Platform:** Route Social Media App
- **Technologies:** React 19, TypeScript, Tailwind CSS v4, Firebase Firestore, TanStack Query

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
