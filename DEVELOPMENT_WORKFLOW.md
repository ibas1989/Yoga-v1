# 🚀 Development Workflow Guidelines

## 📋 Overview

This document establishes a robust development workflow to prevent deployment issues and ensure code quality. Follow these guidelines to maintain a stable, reliable application.

---

## 🔄 Development Process

### 1. **Before Making Changes**

```bash
# 1. Always start with a clean state
npm run clean

# 2. Install dependencies
npm install

# 3. Run pre-deployment checks
npm run pre-deploy
```

### 2. **During Development**

#### **Code Quality Standards**
- ✅ Run `npm run type-check` before committing
- ✅ Run `npm run lint` and fix all warnings
- ✅ Test your changes in development mode
- ✅ Verify navigation flows work correctly

#### **Component Development**
```bash
# Test individual components
npm run dev
# Navigate to the component and test all scenarios
```

#### **Dialog Development** (Critical for your app)
- ✅ Test nested dialogs (CompleteSessionDialog → AddStudentDialog)
- ✅ Verify z-index layering works correctly
- ✅ Test mobile view responsiveness
- ✅ Ensure proper state management

### 3. **Before Deployment**

#### **Mandatory Pre-Deployment Checklist**
```bash
# 1. Run comprehensive checks
npm run pre-deploy

# 2. Test build process
npm run test-build

# 3. Clean and rebuild
npm run clean && npm run build

# 4. Run health check (if deployed)
npm run health-check
```

#### **Manual Testing Checklist**
- [ ] **Navigation Flow**: Test all navigation paths
- [ ] **Dialog Interactions**: Test all dialog combinations
- [ ] **Mobile View**: Test on mobile device/simulator
- [ ] **Data Persistence**: Verify data saves correctly
- [ ] **Error Handling**: Test error scenarios

---

## 🛡️ Prevention Strategies

### **1. Automated Checks**

#### **Pre-Deployment Validation**
```bash
# This runs automatically before deployment
npm run deploy
```

**What it checks:**
- ✅ TypeScript compilation
- ✅ ESLint compliance
- ✅ Build process success
- ✅ Component integrity
- ✅ Navigation consistency
- ✅ Dialog state management
- ✅ Common deployment issues

#### **Health Monitoring**
```bash
# Run after deployment to verify health
npm run health-check
```

**What it monitors:**
- ✅ Critical routes accessibility
- ✅ Navigation flow integrity
- ✅ Component functionality
- ✅ Common deployment issues

### **2. Code Quality Rules**

#### **TypeScript Standards**
```typescript
// ✅ Good: Proper typing
interface ComponentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ❌ Bad: Any types
const handleClick = (data: any) => { ... }
```

#### **Dialog State Management**
```typescript
// ✅ Good: Proper nested dialog handling
<Dialog open={open} onOpenChange={(newOpen) => {
  if (!newOpen && showAddStudentDialog) {
    return; // Prevent closing when child dialog is open
  }
  onOpenChange(newOpen);
}}>

// ❌ Bad: Direct state change
<Dialog open={open} onOpenChange={onOpenChange}>
```

#### **Navigation Consistency**
```typescript
// ✅ Good: Consistent returnTo usage
const handleEdit = () => {
  router.push(`/sessions/${sessionId}/edit?returnTo=${encodeURIComponent(returnTo)}`);
};

// ❌ Bad: Hardcoded navigation
const handleEdit = () => {
  router.push('/sessions/edit');
};
```

### **3. Testing Strategies**

#### **Component Testing**
1. **Dialog Testing**
   - Test opening/closing
   - Test nested dialog behavior
   - Test mobile responsiveness
   - Test state persistence

2. **Navigation Testing**
   - Test all navigation paths
   - Test returnTo parameter handling
   - Test back button behavior
   - Test mobile swipe navigation

3. **Data Flow Testing**
   - Test data persistence
   - Test state updates
   - Test error handling
   - Test edge cases

---

## 🚨 Common Issues & Solutions

### **Issue 1: Dialog Navigation Problems**
**Symptoms:** User gets redirected when adding students
**Prevention:** Use proper dialog state management
**Solution:** Implement nested dialog protection

### **Issue 2: Build Failures**
**Symptoms:** Deployment fails with build errors
**Prevention:** Run `npm run test-build` before deployment
**Solution:** Fix TypeScript/ESLint errors

### **Issue 3: Navigation Inconsistency**
**Symptoms:** Users get lost in navigation
**Prevention:** Always use returnTo parameter
**Solution:** Implement consistent navigation patterns

### **Issue 4: Mobile View Issues**
**Symptoms:** UI breaks on mobile devices
**Prevention:** Test on mobile during development
**Solution:** Use responsive design patterns

---

## 📊 Monitoring & Maintenance

### **Daily Checks**
```bash
# Run health check daily
npm run health-check
```

### **Weekly Maintenance**
```bash
# Update dependencies
npm update

# Run full test suite
npm run pre-deploy
```

### **Monthly Reviews**
- Review error logs
- Update documentation
- Refactor problematic code
- Update deployment scripts

---

## 🔧 Emergency Procedures

### **If Deployment Fails**
1. **Immediate Response**
   ```bash
   # Check deployment logs
   npm run verify
   
   # Run health check
   npm run health-check
   ```

2. **Rollback Procedure**
   ```bash
   # Revert to previous working version
   git revert <commit-hash>
   
   # Redeploy
   npm run deploy
   ```

3. **Investigation**
   - Check pre-deployment logs
   - Review recent changes
   - Test locally
   - Fix issues before redeploying

---

## 📚 Best Practices

### **Code Organization**
- Keep components focused and single-purpose
- Use proper TypeScript typing
- Implement proper error boundaries
- Follow consistent naming conventions

### **Dialog Management**
- Always handle nested dialogs properly
- Use appropriate z-index values
- Implement proper state management
- Test mobile responsiveness

### **Navigation Patterns**
- Always use returnTo parameter
- Implement consistent back navigation
- Test all navigation paths
- Handle edge cases properly

### **Deployment Safety**
- Never deploy without running pre-deployment checks
- Always test locally first
- Use staging environment when possible
- Monitor post-deployment health

---

## 🎯 Success Metrics

### **Quality Metrics**
- ✅ Zero TypeScript errors
- ✅ Zero ESLint warnings
- ✅ All pre-deployment checks pass
- ✅ All health checks pass

### **User Experience Metrics**
- ✅ All navigation flows work
- ✅ All dialogs function correctly
- ✅ Mobile view works properly
- ✅ No user-reported issues

---

## 📞 Support

### **When Things Go Wrong**
1. Check this document first
2. Run diagnostic scripts
3. Review error logs
4. Test locally
5. Document the issue

### **Getting Help**
- Review error messages carefully
- Check component documentation
- Test individual components
- Use browser developer tools
- Check network requests

---

## 🎉 Conclusion

Following this workflow will significantly reduce deployment issues and improve code quality. The automated checks catch most problems before they reach production, and the manual testing ensures a great user experience.

**Remember:** It's better to spend time on prevention than fixing issues in production!
