# InventoryManager

A full-stack furniture inventory management system for tracking acquisition, refurbishment, listing, and sale of furniture items. Tracks costs (acquisition, labor, materials, prep, travel), manages item state (Processing → Listed → Sold → Archived), and generates PDF financial reports with YTD/MTD revenue metrics.

**Stack:** Angular 22 · ASP.NET Core 9 · MySQL 8 · QuestPDF

---

## Local Development Setup

### Prerequisites

You'll need four tools installed before you can run this project. Install them in order — each one has an installer you just run through like any other program.

- [.NET 9 SDK](https://dotnet.microsoft.com/download) — runs the backend API server
- [Node.js 22+](https://nodejs.org/) — runs the frontend build tools (download the LTS version)
- [MySQL 8.0](https://dev.mysql.com/downloads/) — the database that stores all inventory data
- **Angular CLI** — a command-line tool for Angular; install it after Node.js by opening a terminal and running:
  ```bash
  npm install -g @angular/cli
  ```

> **Opening a terminal:** On Windows, press `Win + R`, type `cmd` or `powershell`, and hit Enter. On Mac, open the Terminal app from your Applications folder.

---

### 1. Database

MySQL is the database that stores all your inventory data. After installing MySQL, you need to create an empty database and a user account that the app will use to connect to it.

Open a terminal and connect to MySQL (it will prompt for the root password you set during installation):

```bash
mysql -u root -p
```

Once you're inside the MySQL prompt, run these commands one at a time:

```sql
-- Create the database
CREATE DATABASE inventory_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create a dedicated user for the app (replace 'your_password_here' with a password you choose)
CREATE USER 'invuser'@'localhost' IDENTIFIED BY 'your_password_here';

-- Give that user full access to the inventory database
GRANT ALL PRIVILEGES ON inventory_db.* TO 'invuser'@'localhost';
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

---

### 2. Backend

The backend is the API server — it's the middle layer that the frontend talks to, and it's the only thing that reads and writes to the database.

**First, set your database password.** Open `backend/InventoryManager.API/appsettings.json` in any text editor and replace `CHANGE_ME` with the password you chose in step 1:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost;Database=inventory_db;User=invuser;Password=your_password_here;AllowPublicKeyRetrieval=true;SslMode=None;"
}
```

**Next, create the database tables.** EF Core "migrations" are a system that automatically creates and updates your database tables to match the app's data model. Run this from the `backend/` folder:

```bash
cd backend

dotnet ef database update --project InventoryManager.Infrastructure --startup-project InventoryManager.API
```

> If `dotnet ef` is not found, install the EF Core tools first:
> ```bash
> dotnet tool install --global dotnet-ef
> ```

**Finally, start the API server:**

```bash
dotnet run --project InventoryManager.API
```

You should see output like `Now listening on: http://localhost:5000`. Leave this terminal window open — the server needs to keep running. You can visit `http://localhost:5000/api/inventory` in your browser to confirm it's working (it will return an empty JSON array `[]` if the database is empty).

---

### 3. Frontend

The frontend is the visual web app you interact with in your browser. It's built with Angular and communicates with the backend API you started in step 2.

Open a **new terminal window** (keep the backend one running), then:

```bash
cd frontend/inventory-app

# Install all the required packages (only needed the first time, or after pulling new changes)
npm install

# Start the development server
npm start
```

Once you see `Application bundle generation complete`, open your browser and go to `http://localhost:4200`. The app will automatically reload whenever you make changes to the frontend code.

---

### 4. (Optional) Import existing data

If you have the source Excel file (`Furniture Inventory.xlsx`), you can import the existing data into your local database instead of starting from scratch. The migration script reads the spreadsheet and converts it into SQL commands that MySQL can understand.

```bash
cd scripts

# Generate the SQL import file from the spreadsheet
python migrate-spreadsheet.py > import.sql

# Load the generated SQL into your database
mysql -u invuser -p inventory_db < import.sql
```

It will prompt for the `invuser` password you set in step 1.

---

## Production

The app is deployed to `https://inventory.sashashkurkin.com` on a Digital Ocean Ubuntu droplet via Apache reverse proxy. See `ChecklistHuman.md` for the full deployment guide.
