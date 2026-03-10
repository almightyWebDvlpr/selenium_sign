# Deploy To Oracle Cloud Always Free

## 1. Create the VM

- Create an Ubuntu VM in Oracle Cloud Always Free.
- Assign a public IP.
- Allow inbound TCP `22`, `80`, and `443`.
- Keep the app bound to `127.0.0.1:3000`; expose only `nginx`.

## 2. Connect

```bash
ssh ubuntu@YOUR_VM_PUBLIC_IP
```

## 3. Bootstrap the server

```bash
chmod +x deploy/oracle/setup-ubuntu.sh
./deploy/oracle/setup-ubuntu.sh
```

## 4. Upload the app

```bash
mkdir -p ~/apps
cd ~/apps
git clone https://github.com/almightyWebDvlpr/selenium_sign.git
cd selenium_sign
npm install
```

## 5. Put secrets and signing key on the VM

Create `.env`:

```bash
cp .env.example .env
```

Set at least:

- `HOST=127.0.0.1`
- `PORT=3000`
- `MONGODB_URI=...`
- `CONFLUENCE_EMAIL=...`
- `CONFLUENCE_API_TOKEN=...`
- `GOOGLE_CHAT_WEBHOOK_URL=...`
- `SERVICE_API_TOKEN=...`
- `SIGNING_KEY_FILE=/home/ubuntu/apps/selenium_sign/pb_3247112235.jks`
- `SIGNING_KEY_PASSWORD=...`
- `SIGNING_WORK_DIR=/tmp/selenium_sign`
- `SIGNING_HEADLESS=true`

Upload your `.jks` file to the path in `SIGNING_KEY_FILE`.

## 6. Start with pm2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

Then run the command that `pm2 startup` prints with `sudo`.

PM2 startup docs: [PM2 Startup Script](https://pm2.keymetrics.io/docs/usage/startup/)

## 7. Configure nginx

```bash
sudo cp deploy/oracle/nginx-selenium-sign.conf /etc/nginx/sites-available/selenium-sign
sudo ln -sf /etc/nginx/sites-available/selenium-sign /etc/nginx/sites-enabled/selenium-sign
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## 8. Verify

```bash
curl http://127.0.0.1:3000/health
curl http://YOUR_VM_PUBLIC_IP/health
```

## 9. Add HTTPS

After the domain points to the VM:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.example
```

## 10. Security

- Keep port `3000` closed in Oracle security rules.
- Open only `22`, `80`, `443`.
- Use `SERVICE_API_TOKEN` for every non-health request.
- Prefer restricting SSH ingress to your own IP range.

## Example request

```bash
curl -X POST https://your-domain.example/receive-data \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_API_TOKEN" \
  -d '{"foo":"bar"}'
```
