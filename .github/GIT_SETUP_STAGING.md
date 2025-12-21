# Git Setup Staging Branch - Hướng dẫn tạo staging từ main

## ⚠️ Warning đã fix

**Warning:** `npm warn Unknown project config "strict-peer-dependencies"`

**Nguyên nhân:** `.npmrc` có config `strict-peer-dependencies=false` (deprecated trong npm mới)

**Đã fix:** Xóa dòng `strict-peer-dependencies=false` khỏi `.npmrc`

## 📋 Setup Staging Branch từ Main hiện tại

### Tình huống: Đã commit lên main, giờ tạo staging

**Không có vấn đề gì!** Bạn có thể:

### Option 1: Tạo staging từ main hiện tại (Recommended) ✅

```bash
# Đảm bảo đang ở main và đã commit/push hết changes
git checkout main
git status  # Check xem còn uncommitted changes không

# Tạo staging branch từ main hiện tại
git checkout -b staging
git push -u origin staging
```

**Kết quả:**

- `staging` branch sẽ có tất cả code từ `main` hiện tại
- Từ giờ làm việc trên `staging`
- Khi ready, merge `staging` → `main`

### Option 2: Nếu muốn reset staging về commit trước đó

```bash
# Tạo staging từ commit trước đó (nếu cần)
git checkout main
git checkout -b staging <commit-hash-before-your-changes>
git push -u origin staging

# Sau đó cherry-pick hoặc merge changes vào staging
```

## 🎯 Workflow sau khi có staging

### Daily workflow:

```bash
# 1. Work trên staging
git checkout staging
git pull origin staging

# 2. Make changes
# ... code ...

# 3. Commit và push
git add .
git commit -m "feat: your feature"
git push origin staging

# 4. Test trên Cloudflare Preview (auto-deploy từ staging)

# 5. Khi ready, merge vào main
git checkout main
git pull origin main
git merge staging
git push origin main

# 6. Production auto-deploys từ main
```

## ✅ Quick Setup Commands

```bash
# Tạo staging branch từ main hiện tại
git checkout main
git checkout -b staging
git push -u origin staging

# Verify
git branch -a
# Should see: main, staging, remotes/origin/main, remotes/origin/staging
```

## 📝 Notes

- ✅ **Không có vấn đề** nếu đã commit lên main trước khi tạo staging
- ✅ Staging sẽ có tất cả code từ main hiện tại
- ✅ Từ giờ làm việc trên staging, merge vào main khi ready
- ✅ Cloudflare Pages sẽ auto-deploy cả 2 branches
