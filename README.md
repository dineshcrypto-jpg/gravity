# KSN Super Store

Welcome to the **KSN Super Store**! This is a modern e-commerce application built with Next.js and Supabase.

## Features
- **Storefront**: A beautiful shopping experience for customers.
- **Admin Dashboard**: Manage orders and inventory at `/admin/orders`.
- **Database**: Powered by Supabase for real-time updates and reliability.

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Setup environment variables**:
   Copy the example file and fill in your Supabase credentials:
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` with your actual values:
   - `NEXT_PUBLIC_SUPABASE_URL` — Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Your Supabase anon/public key
   - `NEXT_PUBLIC_WHATSAPP_NUMBER` — WhatsApp number for order notifications

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Visit the site**:
   - Storefront: [http://localhost:3000](http://localhost:3000)
   - Admin: [http://localhost:3000/admin/orders](http://localhost:3000/admin/orders)

---

## Deploy to Vercel (Recommended)

This is a Next.js app and needs a Node.js server. The easiest way to deploy is **Vercel** (free):

1. Push your code to **GitHub**
2. Go to [vercel.com](https://vercel.com) → Sign up with GitHub
3. Click **"Add New Project"** → Import your GitHub repo
4. In the **Environment Variables** section, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_WHATSAPP_NUMBER`
5. Click **Deploy**
6. Go to **Settings → Domains** → Add your custom domain
7. Update your domain's DNS to point to Vercel (Vercel shows you exactly what to set)

> **Note:** This app CANNOT be deployed to simple shared hosting (GoDaddy, Hostinger, etc.) that only serves static HTML files. It requires a Node.js server.

## Version
- **Current Version**: v1.2.5
