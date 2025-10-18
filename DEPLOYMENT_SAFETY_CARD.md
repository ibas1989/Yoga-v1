# 🛡️ Deployment Safety Quick Reference

## 🚨 Before Every Deployment

```bash
# 1. Run comprehensive checks (MANDATORY)
npm run pre-deploy

# 2. Test build process
npm run test-build

# 3. Deploy with safety checks
npm run deploy
```

## ✅ What Gets Checked Automatically

### **Code Quality**
- ✅ TypeScript compilation
- ✅ ESLint compliance
- ✅ Build process success

### **Component Integrity**
- ✅ Critical files exist
- ✅ Component imports work
- ✅ Dialog state management
- ✅ Navigation consistency

### **Deployment Safety**
- ✅ No hardcoded URLs
- ✅ Proper error boundaries
- ✅ Z-index handling
- ✅ Mobile responsiveness

## 🔧 Quick Fixes for Common Issues

### **TypeScript Errors**
```bash
npm run type-check
# Fix all errors before deploying
```

### **ESLint Warnings**
```bash
npm run lint
# Fix all warnings before deploying
```

### **Build Failures**
```bash
npm run clean
npm run build
# Check for missing dependencies
```

### **Dialog Issues**
- Check z-index values
- Verify nested dialog handling
- Test mobile view

### **Navigation Issues**
- Use returnTo parameter consistently
- Test all navigation paths
- Check mobile swipe behavior

## 🚨 Emergency Procedures

### **If Deployment Fails**
```bash
# 1. Check what went wrong
npm run health-check

# 2. Rollback if necessary
git revert <commit-hash>

# 3. Fix issues locally
npm run pre-deploy

# 4. Redeploy
npm run deploy
```

### **If App Breaks After Deployment**
```bash
# 1. Run health check
npm run health-check

# 2. Check specific routes
npm run verify

# 3. Review error logs
# Check browser console
# Check server logs
```

## 📊 Daily Monitoring

```bash
# Run this daily to check app health
npm run health-check
```

## 🎯 Success Indicators

- ✅ All pre-deployment checks pass
- ✅ All health checks pass
- ✅ No TypeScript errors
- ✅ No ESLint warnings
- ✅ All routes accessible
- ✅ All dialogs work correctly
- ✅ Mobile view works properly

## 📞 When to Get Help

- Pre-deployment checks fail
- Health checks fail
- Build process fails
- Navigation doesn't work
- Dialogs don't open/close properly
- Mobile view breaks

## 🎉 Remember

**Prevention is better than cure!**
- Always run checks before deploying
- Test locally first
- Monitor after deployment
- Document any issues
