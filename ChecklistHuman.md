# Phase 10 — Deployment Checklist (Beginner-Friendly)
**Plain-English instructions for putting the Inventory Manager live at inventory.sashashkurkin.com**

---

## Before You Start — Things You Need

- Your **Digital Ocean droplet IP address** (find it in your Digital Ocean dashboard at cloud.digitalocean.com → Droplets)
- Your **droplet root password** (or SSH key — you set this when you created the droplet)
- Your **Digital Ocean domain panel** open (Networks → Domains)
- About **30–45 minutes** of uninterrupted time

---

## PART 1 — Connect to Your Server

Think of your Digital Ocean droplet like a remote computer sitting in a data center. You need to "log in" to it from your Windows machine to run commands on it.

---

### Step 1.1 — Open PowerShell on your Windows machine

**Why:** PowerShell is the terminal we use to type commands. We need it to connect to the remote server.

1. Press `Windows Key + X`
2. Click **"Terminal"** or **"Windows PowerShell"**

---

### Step 1.2 — Connect to your droplet via SSH

**Why:** SSH (Secure Shell) is like a remote control for your server. This command opens a secure connection to it.

Type this command, replacing `YOUR_DROPLET_IP` with the actual IP from your Digital Ocean dashboard (looks like `143.198.xxx.xxx`):

```
ssh root@YOUR_DROPLET_IP
```

Press **Enter**.

- If it asks: `Are you sure you want to continue connecting? (yes/no)` — type `yes` and press Enter.
- Then type your root password and press Enter. *(Note: when typing a password in a terminal, nothing appears on screen — that is normal. Just type it and press Enter.)*

**You should see something like:** `root@ubuntu-droplet:~#`
That means you are now "inside" your server. Any commands you type from here run on the remote machine.

---

## PART 2 — Install Software on the Server

Your server is a fresh Ubuntu Linux machine. It doesn't have the software needed to run your app yet. We need to install it.

---

### Step 2.1 — Update the server's software list

**Why:** Before installing anything, we tell the server to check for the latest versions of all software. Like "refreshing" an app store.

```bash
sudo apt update && sudo apt upgrade -y
```

This may take 1–3 minutes. You'll see a lot of text scrolling. That is normal. Wait for the prompt (`#`) to come back.

---

### Step 2.2 — Install MySQL (the database)

**Why:** MySQL is the database engine that stores all your inventory data — SKUs, prices, descriptions, everything.

```bash
sudo apt install -y mysql-server
```

Wait for it to finish. Then run the security setup:

```bash
sudo mysql_secure_installation
```

It will ask you several questions. Answer them like this:
- `Would you like to setup VALIDATE PASSWORD component?` → type `n`, press Enter
- `New password:` → type a strong password you will remember (example: `Furniture2026!`), press Enter
- `Re-enter new password:` → type it again
- All remaining questions → type `y` and press Enter

**Write down the password you chose. You will need it shortly.**

---

### Step 2.3 — Install .NET 9 (the backend runtime)

**Why:** .NET is the framework that runs the backend server code (the API that talks to the database). We need version 9 to match what we built.

```bash
sudo apt install -y dotnet-sdk-9.0
```

If that doesn't find it, run these two commands first (they add Microsoft's package source to Ubuntu):

```bash
sudo apt install -y wget
wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
sudo apt update
sudo apt install -y dotnet-sdk-9.0
```

Verify it worked:
```bash
dotnet --version
```
You should see something like `9.0.xxx`.

---

### Step 2.4 — Install Node.js (needed for the Angular build)

**Why:** Node.js is a JavaScript runtime. We need it to build the Angular frontend into files that a browser can load.

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify:
```bash
node --version
npm --version
```
Both should print version numbers.

---

### Step 2.5 — Install the Angular CLI

**Why:** The Angular CLI (`ng`) is the tool that compiles your Angular app into the final HTML/CSS/JavaScript files for the browser.

```bash
sudo npm install -g @angular/cli
```

---

## PART 3 — Set Up the Database

Now we create the actual database and a user account for the app to use.

---

### Step 3.1 — Log into MySQL

**Why:** We need to talk directly to MySQL to create a database and a user for the app.

```bash
sudo mysql
```

You'll see a `mysql>` prompt. You are now inside MySQL.

---

### Step 3.2 — Create the database

**Why:** This creates an empty container called `inventory_db` where all your inventory records will live.

Type this exactly (copy-paste if possible) and press Enter:

```sql
CREATE DATABASE inventory_db CHARACTER SET utf8mb4;
```

You should see: `Query OK, 1 row affected`

---

### Step 3.3 — Create a database user for the app

**Why:** Instead of using the all-powerful root account, we create a limited user (`invuser`) just for the app. This is a security best practice.

Replace `YOUR_DB_PASSWORD` with a password you choose (example: `Inv3ntory!2026`). **Write this down.**

```sql
CREATE USER 'invuser'@'localhost' IDENTIFIED BY 'YOUR_DB_PASSWORD';
GRANT ALL PRIVILEGES ON inventory_db.* TO 'invuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Type each line and press Enter. The last line `EXIT;` takes you back to the regular terminal prompt.

---

## PART 4 — Get Your Code onto the Server

We need to copy your project files from your Windows computer to the server. The easiest way is through GitHub.

---

### Step 4.1 — Push your code to GitHub (do this on your WINDOWS machine)

**Why:** GitHub is like a cloud storage service for code. We push your code there from Windows, then pull it down onto the server.

Open a **new PowerShell window on your Windows machine** (keep the server connection open in the other window).

```powershell
cd C:\Repos\InventoryManager
git add .
git commit -m "Complete implementation phases 1-9"
git remote add origin https://github.com/SashaShkurkin/InventoryManager.git
git push -u origin main
```

> **Note:** If you haven't created a GitHub repo yet, go to github.com → sign in → click the `+` button → "New repository" → name it `InventoryManager` → make it Private → click Create → then come back and run the commands above.
>
> It will ask for your GitHub username and password/token. If it asks for a token, go to GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic) → Generate new token → check "repo" → copy the token and paste it as the password.

---

### Step 4.2 — Clone the code onto the server (back in your SERVER terminal)

**Why:** This downloads your code from GitHub onto the server.

Switch back to your **server terminal window** and run:

```bash
cd /var/www
sudo git clone https://github.com/SashaShkurkin/InventoryManager.git
```

It will ask for your GitHub username and password/token. Enter the same ones as above.

Now your code is at `/var/www/InventoryManager` on the server.

---

## PART 5 — Set Up the Backend (.NET API)

---

### Step 5.1 — Create the production settings file

**Why:** The backend needs to know how to connect to the MySQL database. We store that in a settings file. We create a **production** version of this file that contains the real password and is never uploaded to GitHub.

```bash
cd /var/www/InventoryManager/backend/InventoryManager.API
sudo nano appsettings.Production.json
```

This opens a text editor. Type (or paste) the following, replacing `YOUR_DB_PASSWORD` with the password you chose in Step 3.3:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=inventory_db;User=invuser;Password=YOUR_DB_PASSWORD;AllowPublicKeyRetrieval=true;SslMode=None;"
  },
  "CorsOrigins": [
    "https://inventory.sashashkurkin.com"
  ]
}
```

To save and exit nano:
- Press `Ctrl + X`
- Press `Y` (yes, save)
- Press `Enter`

---

### Step 5.2 — Create the database tables

**Why:** Right now the database exists but is empty — no tables yet. This command reads the migration files we wrote and creates all the tables automatically.

```bash
cd /var/www/InventoryManager/backend
dotnet ef database update --project InventoryManager.Infrastructure --startup-project InventoryManager.API
```

You should see: `Done.`

---

### Step 5.3 — Build and publish the backend

**Why:** "Publishing" compiles all the C# code into a single optimized package ready to run as a server process.

```bash
cd /var/www/InventoryManager/backend
dotnet publish InventoryManager.API -c Release -o /var/www/inventory-api
```

This creates a folder at `/var/www/inventory-api` with everything the server needs.

---

### Step 5.4 — Create the images folder

**Why:** When you upload photos for inventory items, they need somewhere to be stored on the server.

```bash
sudo mkdir -p /var/www/inventory-api/wwwroot/images
sudo chmod 755 /var/www/inventory-api/wwwroot/images
```

---

### Step 5.5 — Create a systemd service (auto-start the backend)

**Why:** We want the backend to start automatically whenever the server reboots, and to restart itself if it crashes. A "systemd service" does exactly that — think of it like Task Scheduler on Windows.

```bash
sudo nano /etc/systemd/system/inventory-api.service
```

Paste this entire block exactly as-is:

```ini
[Unit]
Description=Furniture Inventory API
After=network.target

[Service]
WorkingDirectory=/var/www/inventory-api
ExecStart=/usr/bin/dotnet /var/www/inventory-api/InventoryManager.API.dll
Restart=always
RestartSec=10
KillSignal=SIGINT
SyslogIdentifier=inventory-api
User=www-data
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=ASPNETCORE_URLS=http://localhost:5000

[Install]
WantedBy=multi-user.target
```

Save and exit: `Ctrl+X`, then `Y`, then `Enter`.

Now enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable inventory-api
sudo systemctl start inventory-api
```

Check that it started correctly:

```bash
sudo systemctl status inventory-api
```

You should see **`Active: active (running)`** in green. If you see an error, the most common cause is the database password in `appsettings.Production.json` being wrong — double-check it.

To exit the status view, press `Q`.

---

## PART 6 — Build and Deploy the Frontend (Angular)

---

### Step 6.1 — Build the Angular app for production

**Why:** The Angular source code (TypeScript, SCSS) needs to be "compiled" into plain HTML, CSS, and JavaScript that any browser can understand. The production build is also smaller and faster than a development build.

```bash
cd /var/www/InventoryManager/frontend/inventory-app
sudo npm install
sudo ng build --configuration production
```

This takes 1–3 minutes. When done, the compiled files are at:
`/var/www/InventoryManager/frontend/inventory-app/dist/inventory-app/browser/`

---

### Step 6.2 — Copy the built files to the web root

**Why:** Apache (the web server) needs to find the files in a known location to serve them to visitors.

```bash
sudo mkdir -p /var/www/inventory-frontend
sudo cp -r /var/www/InventoryManager/frontend/inventory-app/dist/inventory-app/browser/. /var/www/inventory-frontend/
sudo chown -R www-data:www-data /var/www/inventory-frontend
```

---

## PART 7 — Configure Apache (The Web Server)

Apache is already running on your server (you mentioned you use it). It's the traffic director — it takes incoming web requests and decides what to do with them.

---

### Step 7.1 — Enable required Apache modules

**Why:** Apache has optional add-on modules. We need to turn on the ones that allow it to:
- Forward `/api` requests to our .NET backend (`proxy`, `proxy_http`)
- Handle Angular's single-page routing (`rewrite`)

```bash
sudo a2enmod proxy proxy_http rewrite headers
sudo systemctl reload apache2
```

---

### Step 7.2 — Create the Apache config for your subdomain

**Why:** This file tells Apache: "when someone visits inventory.sashashkurkin.com, serve files from `/var/www/inventory-frontend/` and forward any `/api` requests to the .NET backend."

```bash
sudo nano /etc/apache2/sites-available/inventory.conf
```

Paste this entire block:

```apache
<VirtualHost *:80>
    ServerName inventory.sashashkurkin.com

    DocumentRoot /var/www/inventory-frontend
    <Directory /var/www/inventory-frontend>
        Options -Indexes
        AllowOverride All
        Require all granted
        FallbackResource /index.html
    </Directory>

    ProxyPreserveHost On
    ProxyPass /api http://localhost:5000/api
    ProxyPassReverse /api http://localhost:5000/api

    ProxyPass /images http://localhost:5000/images
    ProxyPassReverse /images http://localhost:5000/images

    ErrorLog ${APACHE_LOG_DIR}/inventory-error.log
    CustomLog ${APACHE_LOG_DIR}/inventory-access.log combined
</VirtualHost>
```

Save and exit: `Ctrl+X`, then `Y`, then `Enter`.

---

### Step 7.3 — Enable the new site

**Why:** Creating the config file doesn't automatically turn it on. We activate it here.

```bash
sudo a2ensite inventory.conf
sudo systemctl reload apache2
```

---

## PART 8 — Point Your Domain to the Server (DNS)

DNS is like the internet's phone book — it converts `inventory.sashashkurkin.com` into your server's IP address. We need to add a record.

---

### Step 8.1 — Find your droplet's IP address

If you don't remember it, go to:
**cloud.digitalocean.com → Droplets → click your droplet**
The IP address is displayed at the top (looks like `143.198.xxx.xxx`).

---

### Step 8.2 — Add the DNS A record

**Why:** This record tells the internet "inventory.sashashkurkin.com lives at THIS IP address."

1. Go to **cloud.digitalocean.com**
2. Click **"Networking"** in the left sidebar
3. Click **"Domains"**
4. Click on **`sashashkurkin.com`**
5. Under **"Create new record"**:
   - **Type:** A
   - **Hostname:** `inventory`
   - **Will direct to:** select your droplet from the dropdown (or type the IP)
   - **TTL:** 3600 (default is fine)
6. Click **"Create Record"**

**Wait 5–10 minutes** for the DNS to propagate before moving to the next step. You can test it by running this on your Windows machine:
```
ping inventory.sashashkurkin.com
```
When you see your droplet's IP in the response, DNS is working.

---

## PART 9 — Enable HTTPS / SSL (the padlock in the browser)

**Why:** HTTPS encrypts the connection between your browser and the server. Without it, browsers show a "Not Secure" warning and some features won't work. Certbot is a free tool that handles this automatically.

---

### Step 9.1 — Install Certbot

**Why:** Certbot is the tool that contacts Let's Encrypt (a free certificate authority) and gets you a free SSL certificate.

```bash
sudo apt install -y certbot python3-certbot-apache
```

---

### Step 9.2 — Get and install the certificate

**Why:** This command talks to Let's Encrypt, proves you own the domain, downloads a certificate, and automatically edits your Apache config to use HTTPS — all in one step.

```bash
sudo certbot --apache -d inventory.sashashkurkin.com
```

It will ask:
- **Email address:** enter your email (for renewal reminders)
- **Terms of service:** type `A` and press Enter (agree)
- **Share email with EFF:** type `N` if you prefer
- **Redirect HTTP to HTTPS:** type `2` and press Enter (always redirect — recommended)

When it finishes, you should see: `Successfully deployed certificate for inventory.sashashkurkin.com`

Certbot automatically renews the certificate every 90 days — you don't need to do anything for that.

---

## PART 10 — Import Your Existing Spreadsheet Data

This step takes your existing `Furniture Inventory.xlsx` file and loads all the data into the database.

---

### Step 10.1 — Install Python dependencies on the server

**Why:** The migration script is written in Python and needs the `openpyxl` library to read Excel files.

```bash
sudo apt install -y python3 python3-pip
pip3 install openpyxl
```

---

### Step 10.2 — Run the migration script

**Why:** This reads all 4 sheets from your spreadsheet, converts them to SQL, and writes a file called `migration.sql` that we can then run against the database.

```bash
cd /var/www/InventoryManager/scripts
python3 migrate-spreadsheet.py --output migration.sql
```

You should see output like:
```
Sheet 'Current Inventory': 65 rows  (state=None)
Sheet 'Inventory Archive': 32 rows  (state='Archived')
Sheet 'May '26 Sales': 33 rows  (state='Sold')
...
SQL written to: migration.sql
```

---

### Step 10.3 — Review the generated SQL (optional but recommended)

**Why:** This lets you quickly check that the file looks right before loading it into your real database.

```bash
head -30 migration.sql
```

You should see INSERT statements with your item data. If it looks completely wrong or empty, something went wrong — check that `Furniture Inventory.xlsx` is in the `/var/www/InventoryManager/` folder.

---

### Step 10.4 — Load the data into MySQL

**Why:** This actually puts the data into the database. Replace `YOUR_DB_PASSWORD` with the password you created in Step 3.3.

```bash
mysql -u invuser -p inventory_db < migration.sql
```

It will prompt for your password. Type `YOUR_DB_PASSWORD` and press Enter (nothing will appear as you type).

Verify it worked:

```bash
mysql -u invuser -p inventory_db -e "SELECT COUNT(*) FROM inventory_items;"
```

You should see a number matching (roughly) the total rows across your spreadsheet sheets.

---

## PART 11 — Test Everything

---

### Step 11.1 — Open the app in your browser

Go to: **https://inventory.sashashkurkin.com**

You should see the app load with your inventory data.

**Checklist:**
- [ ] The page loads (no "can't connect" error)
- [ ] The padlock / HTTPS shows in your browser's address bar
- [ ] The hamburger menu (☰) opens a navigation drawer
- [ ] Overview page shows your inventory grouped by Processing / Listed / Sold
- [ ] Dashboard numbers (Revenue YTD, etc.) show dollar amounts
- [ ] Search page — type a few letters of a SKU or item name — suggestions appear
- [ ] Clicking a suggestion takes you to the item view
- [ ] Item view shows the image placeholder (or image if one is set), all fields
- [ ] Edit button opens the editor with fields pre-filled
- [ ] Reports page — clicking a button opens a PDF in a new tab

---

### Step 11.2 — If something isn't working

**Backend not responding (API errors):**
```bash
sudo systemctl status inventory-api
sudo journalctl -u inventory-api -n 50
```
The second command shows the last 50 lines of backend logs. Look for red error messages.

**Apache/site not loading:**
```bash
sudo tail -30 /var/log/apache2/inventory-error.log
```

**Database issues:**
```bash
mysql -u invuser -p inventory_db -e "SHOW TABLES;"
```
Should show `inventory_items`. If not, re-run Step 5.2.

---

## PART 12 — Future Updates (How to Redeploy)

When you make changes to the code on your Windows machine and want to push them live:

**On your Windows machine:**
```powershell
cd C:\Repos\InventoryManager
git add .
git commit -m "describe what you changed"
git push
```

**On the server:**
```bash
cd /var/www/InventoryManager
sudo git pull

# Rebuild backend
cd backend
sudo dotnet publish InventoryManager.API -c Release -o /var/www/inventory-api
sudo systemctl restart inventory-api

# Rebuild frontend
cd ../frontend/inventory-app
sudo ng build --configuration production
sudo cp -r dist/inventory-app/browser/. /var/www/inventory-frontend/
```

---

## Quick Reference — Useful Server Commands

| What you want to do | Command |
|---|---|
| Check if backend is running | `sudo systemctl status inventory-api` |
| Restart the backend | `sudo systemctl restart inventory-api` |
| See backend error logs | `sudo journalctl -u inventory-api -n 100` |
| Restart Apache | `sudo systemctl restart apache2` |
| See Apache error logs | `sudo tail -50 /var/log/apache2/inventory-error.log` |
| Connect to MySQL | `mysql -u invuser -p inventory_db` |
| Disconnect from the server | `exit` |
