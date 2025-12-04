# Business Task Tracker - Vercel Deployment

A professional team task management system with time tracking, analytics, and beautiful visualizations.

## Features

✅ **Full-Screen 3-Column Layout** - Optimized for professional use
✅ **User Login Tracking** - Records login time, date, and work hours
✅ **Task Management** - Create, complete, and track tasks with deadlines
✅ **Time Tracking** - Built-in timer with session recording
✅ **Beautiful Analytics** - Bar charts, pie charts, and detailed stats
✅ **Data Export** - Download weekly, monthly, and yearly reports
✅ **Real-time Notifications** - Get notified of all actions
✅ **Team Collaboration** - Multi-user support with individual tracking

## Quick Deploy to Vercel

### Option 1: Deploy with Vercel CLI (Easiest)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Navigate to project folder:**
   ```bash
   cd task-tracker-vercel
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Follow the prompts:**
   - Set up and deploy? **Y**
   - Which scope? Choose your account
   - Link to existing project? **N**
   - Project name? **task-tracker** (or any name you want)
   - In which directory? **./
**
   - Want to override settings? **N**

5. **Done!** You'll get a URL like: `https://task-tracker-abc123.vercel.app`

### Option 2: Deploy via Vercel Website

1. **Go to [vercel.com](https://vercel.com)**
2. **Sign up/Login** (free account)
3. **Click "Add New Project"**
4. **Import this folder** or connect your GitHub
5. **Deploy!**

Your app will be live at: `https://your-project-name.vercel.app`

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start dev server:**
   ```bash
   npm run dev
   ```

3. **Open:** http://localhost:5173

## Build for Production

```bash
npm run build
```

The build output will be in the `dist/` folder.

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast builds
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **LocalStorage** for data persistence

## Usage

1. **Login** with your name and email
2. **Add tasks** with categories, priorities, and due dates
3. **Start timer** to track work sessions
4. **View analytics** for team performance
5. **Export data** for reports

## Support

For issues or questions, visit the Vercel documentation: https://vercel.com/docs

---

**Made with ❤️ for professional team management**
