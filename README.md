# Mad Fan

Laravel 13 fan loyalty platform: Inertia/React fan site, Inertia + Filament admin, Paseto API.

**Repository:** https://github.com/KemzyG/MadFan-Campaign

---

## Requirements

| Tool | Version / notes |
|------|-----------------|
| PHP | 8.3+ (8.4 recommended) |
| PHP extensions | `bcmath`, `ctype`, `curl`, `fileinfo`, `json`, `mbstring`, `openssl`, `pdo_mysql`, `tokenizer`, `xml`, `zip`, `gd` or `imagick`, **`gmp`** (required for Paseto `/api` auth) |
| Composer | 2.x |
| Node.js | 18+ |
| npm | 9+ |
| Database | MySQL 8+ or PostgreSQL (SQLite OK for local smoke tests) |

---

## Local deployment

### 1. Clone

```bash
git clone https://github.com/KemzyG/MadFan-Campaign.git
cd MadFan-Campaign
```

### 2. Install dependencies

```bash
composer install
npm install
```

### 3. Environment

```bash
cp .env.example .env
php artisan key:generate
```

Edit `.env` and set at least:

```env
APP_NAME=MadFan
APP_URL=http://127.0.0.1:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=madfan
DB_USERNAME=root
DB_PASSWORD=

# Local: allow mock social task verification without API tokens
SOCIAL_ALLOW_MOCK_VERIFICATION=true
```

### 4. Database and storage

```bash
php artisan migrate --seed
php artisan storage:link
php artisan db:seed --class=FilamentAdminSeeder --force
```

Default Filament admin comes from `FILAMENT_ADMIN_*` in `.env` (change before first seed).

### 5. Run the app

```bash
composer run dev
```

Starts Laravel (`php artisan serve`), the queue listener, and Vite.

| URL | Purpose |
|-----|---------|
| http://127.0.0.1:8000 | Fan site / campaign |
| http://127.0.0.1:8000/admin | Filament admin |
| http://127.0.0.1:8000/app | Inertia admin console |
| http://127.0.0.1:8000/api | Mobile/API (Bearer Paseto token) |

### 6. Optional checks

```bash
php artisan test --compact
npm run build
```

---

## Live / production deployment

Point the web server document root at **`public/`** only. Never expose the project root.

### 1. Server setup

1. Create the app directory (example: `/var/www/madfan`).
2. Create MySQL/PostgreSQL database and user.
3. Install PHP 8.3/8.4 with the extensions above (including **`gmp`**).
4. Install Composer and Node.js (or build assets in CI and deploy `public/build`).
5. Enable HTTPS (Let’s Encrypt or your provider).
6. Ensure `storage/` and `bootstrap/cache/` are writable by the web user.

### 2. First deploy

```bash
git clone https://github.com/KemzyG/MadFan-Campaign.git /var/www/madfan
cd /var/www/madfan

cp .env.example .env
# Edit .env for production (section below)

composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction
npm ci --ignore-scripts
npm run build

php artisan key:generate --force
php artisan migrate --force
php artisan db:seed --class=FilamentAdminSeeder --force
php artisan storage:link
php artisan filament:assets
php artisan optimize
```

**One-command deploy** (maintenance mode → install → migrate → build → optimize → up):

```bash
composer run deploy
```

### 3. Production `.env`

```env
APP_NAME=MadFan
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com
APP_KEY=                    # unique; never reuse from another environment
FORCE_HTTPS=true

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=madfan
DB_USERNAME=...
DB_PASSWORD=...

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=true
SESSION_SECURE_COOKIE=true

CACHE_STORE=database        # or redis
QUEUE_CONNECTION=database   # or redis / sync
LOG_LEVEL=error
FILESYSTEM_DISK=local

CORS_ALLOWED_ORIGINS=https://your-domain.com
CORS_SUPPORTS_CREDENTIALS=false

SOCIAL_ALLOW_MOCK_VERIFICATION=false

FILAMENT_ADMIN_EMAIL=admin@your-domain.com
FILAMENT_ADMIN_PASSWORD=...   # strong password

# Optional dedicated admin host
# ADMIN_DOMAIN=mod.your-domain.com
```

Fill Twitter / Discord / Telegram API values if Season tasks need live social verification. With `SOCIAL_ALLOW_MOCK_VERIFICATION=false`, missing tokens fail closed.

### 4. Web server (Nginx example)

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    root /var/www/madfan/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_pass unix:/run/php/php8.4-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
        expires 7d;
        access_log off;
    }
}
```

Apache: document root → `public/`, enable `mod_rewrite`, keep `public/.htaccess`.

### 5. Cron and queues

```cron
* * * * * cd /var/www/madfan && php artisan schedule:run >> /dev/null 2>&1
```

If `QUEUE_CONNECTION` is not `sync`:

```bash
php artisan queue:work --tries=3 --max-time=3600
```

### 6. Updating an existing deploy

```bash
cd /var/www/madfan
git pull origin main
composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction
npm ci --ignore-scripts
npm run build
php artisan migrate --force
php artisan filament:assets
php artisan optimize
```

Or:

```bash
composer run deploy
```

**Do not delete** `storage/app/paseto_symmetric.key` between deploys — that invalidates all API tokens.

### 7. Smoke test

- `https://your-domain.com/up`
- Fan campaign `/`
- Passport / tasks after login
- Filament `/admin`
- Inertia console `/app` (or admin domain root)
- API: register/login and call `/api/me` with Bearer token

### 8. Post-deploy checklist

- [ ] `APP_ENV=production` and `APP_DEBUG=false`
- [ ] Unique `APP_KEY`
- [ ] Document root is `public/`
- [ ] HTTPS works; `SESSION_SECURE_COOKIE=true`
- [ ] `SESSION_ENCRYPT=true`
- [ ] `CORS_ALLOWED_ORIGINS` is exact HTTPS origins (never `*`)
- [ ] `SOCIAL_ALLOW_MOCK_VERIFICATION=false`
- [ ] Social tokens set if live verification is required
- [ ] `php artisan storage:link` done; storage writable
- [ ] `php artisan optimize` succeeded
- [ ] Scheduler (and queue worker if needed) running
- [ ] `storage/app/paseto_symmetric.key` preserved

---

## Composer scripts

```bash
composer run setup            # first-time local: install, key, migrate, npm build
composer run deploy           # production: down → install → migrate → build → optimize → up
composer run deploy:assets    # npm build + Filament assets only
composer run deploy:optimize  # config/route/view + Filament optimize
composer run cpanel:package   # optional zip for shared hosting
composer run dev              # local: server + queue + Vite
composer run test             # Pest test suite
```

---

## Project layout (high level)

```text
app/            Application code
bootstrap/      Framework bootstrap
config/         Config
database/       Migrations, seeders, factories
deploy/         Optional shared-hosting helpers
public/         Web root (point the server here)
resources/      Views, JS, CSS, assets
routes/         web.php, api.php
storage/        Logs, uploads, cache, keys
tests/          Pest tests
```

---

## Notes

- Fan avatars live under `storage/app/public` (public via `storage:link`).
- Task proof screenshots are private under `storage/app/private` (auth-gated routes only).
- For shared hosting / cPanel packaging details, see `deploy/cpanel/` on the machine (local docs may be gitignored).
