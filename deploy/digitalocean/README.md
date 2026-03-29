# Low-Cost Production Deployment

This setup keeps the monthly spend close to the smallest practical amount:

- Frontend: Cloudflare Pages
- Backend: one DigitalOcean Basic Droplet
- Database: PostgreSQL in Docker on the same Droplet
- Reverse proxy: Nginx on the Droplet

## Expected Cost

- Cloudflare Pages: free on the standard Pages plan
- DigitalOcean Basic Droplet: starts at around $4 per month
- Domain: typically billed separately by your registrar

Official pricing:

- Cloudflare Pages: https://pages.cloudflare.com/
- DigitalOcean Droplets: https://www.digitalocean.com/pricing/droplets

## Architecture

1. Cloudflare Pages serves the React frontend.
2. The frontend calls `https://api.yourdomain.com`.
3. Nginx on the Droplet proxies requests to the backend container.
4. The Spring Boot backend connects to the PostgreSQL container over Docker networking.
5. PostgreSQL data is stored in the `postgres_data` Docker volume.

## DNS Layout

- `water.yourdomain.com` -> Cloudflare Pages
- `api.yourdomain.com` -> DigitalOcean Droplet public IP

## 1. Create the Droplet

Recommended for lowest cost:

- Region: choose one close to your users
- Image: Ubuntu 24.04 LTS
- Plan: Basic shared CPU
- Size: smallest plan that still feels safe for Java + Postgres, usually 1 GB RAM

## 2. Prepare the Server

SSH into the Droplet and install Docker, Docker Compose plugin, and Nginx.

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg nginx
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
```

Log out and back in once so Docker group access applies.

## 3. Copy the Project

Clone or upload this project to the server, for example:

```bash
git clone <your-repo-url> water
cd water
```

Or copy the project directory manually.

## 4. Configure Environment

Copy the example env file:

```bash
cd deploy/digitalocean
cp .env.example .env
```

Edit `.env` and set:

- a strong `POSTGRES_PASSWORD`
- your real frontend domain in `APP_CORS_ALLOWED_ORIGIN_PATTERNS`

## 5. Start Backend and Database

From `deploy/digitalocean` run:

```bash
docker compose up -d --build
```

Check status:

```bash
docker compose ps
docker compose logs -f backend
```

The backend listens only on `127.0.0.1:8098`, so it is not exposed directly to the internet.

## 6. Configure Nginx

Copy the sample config:

```bash
sudo cp nginx.api.conf.example /etc/nginx/sites-available/water-api
sudo nano /etc/nginx/sites-available/water-api
```

Replace `api.yourdomain.com` with your real API hostname, then enable it:

```bash
sudo ln -s /etc/nginx/sites-available/water-api /etc/nginx/sites-enabled/water-api
sudo nginx -t
sudo systemctl reload nginx
```

## 7. Add HTTPS

Use Certbot with Nginx:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

## 8. Deploy the Frontend to Cloudflare Pages

In Cloudflare Pages:

1. Create a new project from your Git repo.
2. Point it to `frontend/water-mobile-ui`.
3. Set:
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Add environment variable:
   - `VITE_API_BASE_URL=https://api.yourdomain.com`
5. Deploy.

Then attach your custom domain, for example `water.yourdomain.com`.

Cloudflare Pages docs:

- https://developers.cloudflare.com/pages/

## 9. Production Checks

After deployment, verify:

```bash
curl https://api.yourdomain.com/customers
```

Then open the frontend and confirm:

- customer list loads
- inventory loads
- borrow/refill/return work
- ledger loads
- earnings and settlements work

## 10. Updates

When you change the backend:

```bash
cd ~/water/deploy/digitalocean
git pull
docker compose up -d --build
```

When you change the frontend:

- push to the connected Git branch
- Cloudflare Pages rebuilds automatically

## 11. Backups

This is a low-cost setup, so the database is on the same server as the app.

At minimum:

- enable DigitalOcean backups if budget allows
- or regularly dump PostgreSQL

Manual backup example:

```bash
docker exec water-db pg_dump -U water_user water_app > backup.sql
```

## Notes

- This setup is cheap, but it is still a single-server deployment.
- If the Droplet is lost and you have no backups, the database is lost.
- For higher reliability later, move PostgreSQL to a managed database.
