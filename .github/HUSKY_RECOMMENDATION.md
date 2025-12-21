# Husky Recommendation - Có nên bỏ husky không?

## 📊 Tình huống

- **Solo developer** - Chỉ có 1 người dev
- **Husky đang gây nhiều lỗi** khi commit
- **lint-staged** đang block commits

## 🎯 Đề xuất: Disable husky (Recommended cho solo dev) ✅

### Option 1: Disable husky hooks (Recommended)

**Cách 1: Comment out pre-commit hook**
```bash
# Edit .husky/pre-commit
# Comment out: npm run lint:staged
```

**Cách 2: Uninstall husky (Nếu không cần)**
```bash
npm uninstall husky lint-staged
rm -rf .husky
```

**Cách 3: Disable trong package.json**
```json
{
  "scripts": {
    "prepare": "echo 'Husky disabled'"
  }
}
```

### Option 2: Fix husky config (Nếu muốn giữ)

**Giữ lại nhưng chỉ chạy format, không chạy lint:**
```json
// .lintstagedrc
{
  "*.{js,jsx,ts,tsx}": ["prettier --write"],
  "*.{json,md,yml,yaml}": ["prettier --write"]
}
```

## ✅ Recommendation cho solo dev

**Nên disable husky** vì:

1. ✅ **Solo dev** - Không cần enforce code quality qua hooks
2. ✅ **Tự chịu trách nhiệm** - Bạn tự review code của mình
3. ✅ **Nhanh hơn** - Không bị block khi commit
4. ✅ **Linh hoạt** - Có thể chạy lint/format manually khi cần

**Workflow thay thế:**
```bash
# Manual check trước khi push
npm run lint:fix
npm run format
git add .
git commit -m "..."
git push
```

## 🔧 Quick Fix

### Disable husky ngay:

```bash
# Option 1: Comment out pre-commit
echo "# npm run lint:staged" > .husky/pre-commit

# Option 2: Remove husky
npm uninstall husky lint-staged
rm -rf .husky
```

### Hoặc giữ lại nhưng chỉ format:

```bash
# Edit .lintstagedrc - chỉ giữ prettier
{
  "*.{js,jsx,ts,tsx,json,md,yml,yaml}": ["prettier --write"]
}
```

## 📝 Notes

- **Husky hữu ích** cho team lớn để enforce code quality
- **Solo dev** có thể tự quản lý quality
- **Có thể enable lại** sau nếu cần
