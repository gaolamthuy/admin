# Security Notes

## Secrets

- `.env.local` không commit
- `SUPABASE_SERVICE_ROLE_KEY` chỉ dùng server (Edge/Server), tuyệt đối không đưa vào bundle client
- Sử dụng secret manager cho staging/prod

## Auth & RLS

- Middleware kiểm tra session và điều hướng theo role
- RLS phải bảo vệ bảng domain; test bằng user `staff`

## Logging

- Không log PII, token, hoặc response chứa thông tin nhạy cảm

## Dependency hygiene

- Bám đúng phiên bản trong `package.json`
- Tránh dùng API của Next/React vượt quá phiên bản hiện tại

## Incidents

- Revoke/rotate key khi nghi ngờ lộ
- Force logout bằng cách revoke refresh tokens trên Supabase
