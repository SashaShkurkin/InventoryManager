# InventoryManager — Project Context

## What This Is

A full-stack furniture inventory management system for tracking acquisition, refurbishment, listing, and sale of furniture items. Tracks all cost components (acquisition, labor, materials, prep, travel) and generates PDF financial reports. Single-user/business tool with no authentication layer.

Deployment target: `inventory.sashashkurkin.com` (Digital Ocean Ubuntu droplet)

---

## Tech Stack

**Backend** — .NET 9 / ASP.NET Core Web API
- MySQL 8.0 via Entity Framework Core (Pomelo provider)
- QuestPDF 2026.5 for PDF report generation
- AutoMapper 12.0 for DTO mapping
- Clean Architecture: API → Core → Infrastructure → Reports

**Frontend** — Angular 22 (standalone components, no NgModule)
- Angular Material 22 for UI
- TypeScript 6 / SCSS
- Dev server: `http://localhost:4200`, proxying API calls to `http://localhost:5000`

**Server** — Apache 2.4 reverse proxy on Ubuntu, Certbot/Let's Encrypt for HTTPS

---

## Project Structure

```
backend/
  InventoryManager.sln
  InventoryManager.API/        # Controllers, AutoMapper profiles, Program.cs
  InventoryManager.Core/       # Models, DTOs, Interfaces (no external deps)
  InventoryManager.Infrastructure/  # EF Core DbContext, Repository
  InventoryManager.Reports/    # QuestPDF report service
frontend/
  inventory-app/               # Angular 22 app
    src/app/
      core/                    # Models + InventoryService (single HTTP service)
      features/                # Routed pages (lazy-loaded)
        overview/              # Dashboard: YTD/MTD metrics + items by state
        search/                # Autocomplete search
        item-view/             # Item detail
        item-editor/           # Create/edit form + image upload
        reports/               # PDF download buttons
      shared/                  # NavShellComponent, ItemCardComponent
scripts/
  migrate-spreadsheet.py       # Converts Furniture Inventory.xlsx → SQL INSERTs
Furniture Inventory.xlsx        # Source data (4 sheets: Current, Archive, Sales, etc.)
ChecklistHuman.md              # 12-phase deployment guide
```

---

## Data Model — InventoryItem

Key fields:
- `sku` — unique identifier (indexed)
- `state` — enum: `Processing | Listed | Sold | Archived`
- Cost fields: `acquisitionCost`, `laborCost`, `materialsCost`, `prepCost`, `travelCost`
- Pricing: `listPrice`, `soldPrice`, `profit`
- Metadata: `type`, `subType`, `style`, `color`, `tags` (comma-separated), `imageUrl`
- Dates: `dateAcquired`, `dateListed`, `dateSold` (DateOnly)

---

## API Endpoints

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/inventory` | Paginated list, filter by state/price |
| GET | `/api/inventory/search?q=` | Autocomplete (SKU, title, tags) |
| GET | `/api/inventory/{sku}` | Single item detail |
| POST | `/api/inventory` | Create item |
| PUT | `/api/inventory/{sku}` | Full update |
| PATCH | `/api/inventory/{sku}/state` | State transition only |
| DELETE | `/api/inventory/{sku}` | Delete item |
| POST | `/api/inventory/{sku}/image` | Upload image (JPG/PNG/WebP/GIF) |
| GET | `/api/dashboard` | YTD/MTD revenue, profit, unit counts |
| GET | `/api/reports/all-time` | PDF: full history |
| GET | `/api/reports/current` | PDF: active items |
| GET | `/api/reports/revenue` | PDF: sold items by month |

---

## Configuration

- **Dev:** `appsettings.Development.json` — API on `localhost:5000`, MySQL on localhost
- **Prod:** `appsettings.Production.json` — created manually on server with real DB credentials (gitignored)
- CORS origins configured in `appsettings.json` per environment

---

## Current State (as of June 2026)

**Complete:**
- Full CRUD API with image upload
- MySQL schema with EF migrations
- Three PDF report types (QuestPDF)
- Dashboard with YTD/MTD metrics
- All Angular feature pages implemented
- CORS configured for dev + prod
- Data migration script for existing Excel data

**Next Step:** Deploy per `ChecklistHuman.md` (12-phase deployment guide).

**Not yet built:** Authentication, image lightbox, batch import UI, mobile app.

---

## Key Decisions & Constraints

- **No authentication** — user preference; app lives on a private subdomain
- **Images on disk** — stored at `wwwroot/images/` on the server, not cloud storage
- **`@angular/animations` must be explicitly installed** — not pulled in transitively by Angular Material with the CLI 22 builder
- **.NET 9** (not 8) — 9 was the installed SDK at build time
- **Angular CLI 22** — latest at build time

---

## Common Commands

```bash
# Backend — run dev server
cd backend
dotnet run --project InventoryManager.API

# Backend — publish for production
dotnet publish InventoryManager.API -c Release -o ./publish

# Frontend — dev server
cd frontend/inventory-app
npm start

# Frontend — production build
ng build --configuration production

# Data migration (generates SQL from Excel)
cd scripts
python migrate-spreadsheet.py
```
