# Rate-My-Professor-Style Website (Update 5)

This update delivers an **enhanced, AI-styled web interface** for the Rate-My-Professor project.  
The system now provides a full college-first discovery flow: users can explore universities by location, type (Public/Private), and tuition range — then view professors and departments in each institution.

---

## ⚙️ Features (Update 5)

- 🌎 **College-First Flow:**  
  Select *Location → Type (Public/Private) → Tuition Range* → view filtered universities.

- 🎓 **College Directory Page:**  
  Displays list of colleges with **city, state, type, and tuition fees**.

- 👩‍🏫 **Professor Directory:**  
  Shows all professors within a selected college with **department, level, and email**.

- 💬 **Rating Interface:**  
  Users can view and rate professors (no login required).

- 🧠 **AI-Enhanced Interface:**  
  Modernized look using **Next.js + Tailwind** for a clean, responsive, and intuitive UI.

---

## 🧑‍💻 Tech Stack

**Backend:** FastAPI, SQLAlchemy, SQLite (local dev)  
**Frontend:** Next.js (React + TypeScript), Tailwind CSS, React Query, Axios  
**Database:** SQLite (can be upgraded to PostgreSQL)  
**Environment:** Visual Studio Code

---

## 🚀 Quickstart (VS Code)

1. **Clone or open** this project folder in **VS Code**.  
   Continue from your previous setup — Update 3 and 4 backend files remain the same.

2. **Activate virtual environment (backend)**  
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate      # macOS / Linux
   # Windows:
   # .venv\Scripts\activate