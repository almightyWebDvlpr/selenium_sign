# selenium_sign

Remote signing service built on Express and Selenium.

## What changed

- signing requests are serialized through an internal queue
- working files are stored in `SIGNING_WORK_DIR` instead of a hardcoded local Downloads path
- service can be protected with `SERVICE_API_TOKEN`
- `/health` endpoint is available without auth
- runtime settings are controlled through `.env`

## Required env

See [.env.example](/Users/serhiikurylenko/Documents/_GitHub/selenium_sign/.env.example).

Important variables:

- `HOST`
- `PORT`
- `MONGODB_URI`
- `SIGNING_KEY_FILE`
- `SIGNING_KEY_PASSWORD`
- `SIGNING_WORK_DIR`
- `SERVICE_API_TOKEN` (recommended for remote access)

## Run

```bash
npm install
npm start
```

## Health check

```bash
curl http://localhost:3000/health
```

## Sign request

```bash
curl -X POST http://localhost:3000/receive-data \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"foo":"bar"}'
```

If `SERVICE_API_TOKEN` is not set, auth is not enforced.

## Deployment note

For reliable Selenium execution, deploy this service on a VPS or VM where you control:

- Chrome/Chromium installation
- ChromeDriver / Selenium runtime
- filesystem access
- long-running Node process manager such as `pm2`
