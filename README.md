# 🏁 Moto Gymkhana Leaderboard

A web platform for tracking Moto Gymkhana lap times, rider performance, maps, bikes, and YouTube video runs.

Built with:
- Next.js
- Supabase (database + backend)
- React (frontend)

---

## 🚀 Features

- 🏁 Live leaderboard sorted by best lap time
- 🧑 Rider tracking (no duplicates, linked by ID)
- 🗺 Map filtering
- 🏍 Bike filtering
- 👤 Rider filtering
- 🎥 YouTube video integration (thumbnail + modal player)
- 🥇 Podium view (Top 3 results)
- 🟢 Approved results system (admin controlled)

---

## 🧠 Database Structure (Supabase)

### riders
- id (uuid)
- name (text)
- created_at

### results
- id (uuid)
- rider_id (fk → riders.id)
- map_name (text)
- lap_time (float seconds)
- bike (text)
- youtube_url (text)
- approved (boolean)
- created_at

---

## ⚙️ Setup (New Machine)

### 1. Install Node.js
Install version **20+**

Check:
```bash
node -v
npm -v
