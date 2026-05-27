# Smart Roster Backend

Flask backend for uploading employee availability files, extracting structured data, saving processed JSON, and generating roster output for the frontend.

## What It Does

- accepts `pdf`, `csv`, `xlsx`, `xls`, `json`, and `txt`
- extracts employee availability into normalized JSON
- saves processed JSON into `backend/data`
- generates roster output with Gemini when available
- falls back to local scheduling logic if Gemini is unavailable

## Run

```bash
cd backend
python main.py
```

Server default:

```text
http://localhost:5000
```

## Environment

Create a `.env` file in `backend/`:

```env
FLASK_ENV=development
FLASK_DEBUG=True
API_PORT=5000
GOOGLE_API_KEY=your_gemini_api_key
```

Optional:

```env
GEMINI_MODEL=gemini-1.5-flash
```

`GEMINI_API_KEY` is also accepted as a fallback key name.

## API

### Health

```http
GET /api/health
```

Response:

```json
{
  "status": "ok"
}
```

### Upload And Generate

```http
POST /api/upload
```

Request:
- multipart form-data
- field name: `file`

Success response:

```json
{
  "status": "success",
  "filename": "Employee_Details.pdf",
  "stored_file": "Employee_Details.json",
  "data": {
    "employees": {},
    "total_employees": 0,
    "extracted_at": "2026-05-27T00:00:00"
  },
  "roster": {
    "roster": [],
    "summary": "..."
  }
}
```

### Generate Roster From Existing Data

```http
POST /api/generate-roster
```

Accepts either:

```json
{
  "data": { "...": "..." }
}
```

or

```json
{
  "stored_file": "Employee_Details.json"
}
```

## Scheduling Rules

- if explicit future dates are present in the uploaded data, those dates are used
- if only weekdays are present, the fallback schedule covers the next 14 days
- scheduling starts from tomorrow
- today is not included
- past dates are ignored

## Storage

- uploaded files: `backend/uploads/`
- processed JSON: `backend/data/`

## Frontend Connection

Frontend calls:

```text
http://localhost:5000/api/upload
```

After a successful upload, the frontend redirects to the roster page and renders the generated result.