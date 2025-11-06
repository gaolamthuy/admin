# Cloudflare Pages Functions

## Cloudinary Signature Function

### Setup

1. **Thêm Environment Variables trong Cloudflare Pages Dashboard:**
   - Vào Settings → Variables and Secrets
   - Thêm 2 secrets (KHÔNG commit giá trị thực vào repo):
     - `CLOUDINARY_API_KEY` = `<YOUR_CLOUDINARY_API_KEY>`
     - `CLOUDINARY_API_SECRET` = `<YOUR_CLOUDINARY_API_SECRET>`

2. **Deploy:**
   - Function tự động deploy khi push code lên GitHub
   - Hoặc dùng Wrangler CLI: `wrangler pages deploy`

### Usage

**Endpoint:** `POST /api/cloudinary-signature`

**Request:**

```json
{
  "public_id": "gaolamthuy/15742017",
  "timestamp": "<UNIX_SECONDS>",
  "overwrite": true,
  "invalidate": true
}
```

**Response:**

```json
{
  "signature": "<SHA1_SIGNATURE>",
  "api_key": "<YOUR_CLOUDINARY_API_KEY>",
  "timestamp": "<UNIX_SECONDS>"
}
```

### Security

- ✅ API_SECRET chỉ tồn tại ở server-side (Cloudflare environment)
- ✅ Không bao giờ expose trong client bundle
- ✅ CORS có thể được restrict theo domain nếu cần
