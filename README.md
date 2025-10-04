# Code Swap 💻✨

**Code Swap** is a modern, responsive web app where developers can **share, discover, and copy tiny code snippets**.
It’s a lightweight, social platform for devs to collaborate and showcase micro-projects.

---

## 🌟 Features

### 1. Share Your Snippets

- Post small, reusable code snippets.
- Add a **title, language tag, description**, and optional **screenshot**.
- Share anonymously or with your username.

### 2. Discover Snippets

- Explore code snippets from developers around the world.
- Filter by **language, tags, or keywords**.
- See trending snippets and top authors.

### 3. Interact & Engage

- Like snippets and see real-time like counts.
- Comment on snippets to provide tips or feedback.
- Copy any snippet instantly with one click.

### 4. User Authentication

- **Sign up and log in with just a unique username and password**.
- Secure sessions powered by Supabase.
- Manage your profile, posts, and interactions easily.

### 5. Modern UI & UX

- Clean, minimalist theme.
- Syntax-highlighted code blocks for readability.
- Smooth animations and responsive layouts for desktop & mobile.
- Sticky top navbar with search and quick post access.

---

## 🗂 Database Structure (Supabase)

**users**

- `id` – auto
- `username` – unique
- `password` – hashed
- `joined_at` – timestamp

**snippets**

- `id` – auto
- `user_id` – reference to users
- `title` – text
- `language` – text
- `description` – text
- `code` – text
- `likes` – integer, default 0
- `created_at` – timestamp

**comments**

- `id` – auto
- `snippet_id` – reference to snippets
- `user_id` – reference to users
- `text` – text
- `created_at` – timestamp

---

## ⚙ Functionality

- **CRUD Operations:** Create, read, update, delete your own snippets.
- **Real-time updates:** Likes and comments update instantly.
- **Search & filter:** Easily find snippets by language, keyword, or tags.
- **Copy snippet:** One-click copy functionality for quick usage.
- **Responsive:** Works beautifully on desktop, tablet, and mobile.

---

## 🎨 UI Enhancements

- Infinite scroll or “Load More” for feeds
- Toast notifications for success or errors

---

## 🧩 Tech Stack

- **Frontend:** React + Tailwind
- **Backend:** Supabase (database, authentication, file storage)
- **State Management:** React Context

---

## 🚀 Getting Started

1. Sign up with a **unique username** and password.
2. Create a snippet with title, language, description, and code.
3. Explore, like, comment, and copy snippets from the community.
4. Manage your profile and track your contributions.

---

## 🔗 Why Code Swap?

- Quick way to **share useful code**.
- Build your **developer reputation** with likes and comments.
- Discover **tiny solutions** for common problems.
- Engage with a **global developer community**.

---

## 🤝 Contributors

We welcome contributions from developers worldwide!
If you want to help improve Code Swap, you can:

- Report bugs 🐛
- Suggest features ✨
- Improve UI / UX 🎨
- Add sample snippets 💻

### Contributors List

| Name        | Role                | GitHub/Website                     |
| ----------- | ------------------- | ---------------------------------- |
| Mohd Sahbaz | Founder & Developer | [https://github.com/MohdSahbaz](#) |

> **Tip:** Add your name to this list via a pull request and help make Code Snippet Swap better! 🚀

---
