# ESLint + VS Code Real-Time Linting Setup

## ✅ What's Now Configured

### 1. VS Code Settings (`.vscode/settings.json`)
- **Real-time linting**: `"eslint.run": "onType"`
- **Auto-fix on save**: ESLint will fix issues automatically when you save
- **Status bar indicator**: Shows ESLint status
- **File type validation**: Properly recognizes .ts/.tsx files

### 2. ESLint 9.x Flat Config (`eslint.config.js`)
- **Modern flat configuration**: Uses the latest ESLint configuration format
- **Next.js integration**: Includes official Next.js ESLint rules
- **TypeScript support**: Full TypeScript linting with proper types
- **React support**: React and React Hooks rules

### 3. ESLint + Prettier Integration
- **Prettier rules as ESLint errors**: Formatting issues show up as lint errors
- **No conflicts**: ESLint and Prettier work together seamlessly
- **Auto-formatting**: Both linting and formatting happen on save

### 4. Enhanced ESLint Rules
- Console.log warnings (except console.warn/error)
- React Hooks dependency warnings
- Next.js Core Web Vitals rules
- Code quality rules (prefer-const, no-var, etc.)
- Prettier formatting rules

## 🔧 Required VS Code Extensions

Make sure you have these extensions installed:

1. **ESLint** (dbaeumer.vscode-eslint) - ✅ You mentioned you have this
2. **Prettier** (esbenp.prettier-vscode) - Recommended for formatting

## 🚀 How to Verify It's Working

### 1. Check ESLint Status
- Look at the bottom-right status bar in VS Code
- You should see "ESLint" with a checkmark or warning icon

### 2. Test Real-Time Linting
Create a test file with intentional errors:

```typescript
// test-eslint.tsx
var test = "hello";  // Should show: prefer 'const' over 'var'
console.log(test);   // Should show: Unexpected console statement
```

You should see:
- **Red squiggly lines** under the errors
- **Problems panel** (Ctrl+Shift+M) showing the issues
- **Hover tooltips** explaining the problems

### 3. Test Auto-Fix on Save
- Add some formatting issues (extra spaces, wrong quotes)
- Save the file (Cmd+S)
- Issues should be automatically fixed

## 🛠 Troubleshooting

### ESLint Not Working?

1. **Restart ESLint Server**:
   - Open Command Palette (Cmd+Shift+P)
   - Type "ESLint: Restart ESLint Server"
   - Press Enter

2. **Check Output Panel**:
   - View → Output
   - Select "ESLint" from dropdown
   - Look for error messages

3. **Verify ESLint Extension**:
   - Extensions panel (Cmd+Shift+X)
   - Search for "ESLint"
   - Make sure it's enabled

4. **Check File Type**:
   - Bottom-right corner should show "TypeScript React" or "TypeScript"
   - If not, click and select the correct language

### No Auto-Fix on Save?

1. **Check Settings**:
   ```json
   "editor.codeActionsOnSave": {
     "source.fixAll.eslint": "explicit"
   }
   ```

2. **Manual Fix**:
   - Right-click in file
   - Select "Fix all ESLint problems"

### Performance Issues?

If ESLint is slow:

1. **Limit Working Directories**:
   ```json
   "eslint.workingDirectories": ["."]
   ```

2. **Reduce Validation**:
   ```json
   "eslint.run": "onSave"  // Instead of "onType"
   ```

## 📝 Available Commands

In Command Palette (Cmd+Shift+P):

- **ESLint: Fix all auto-fixable Problems**
- **ESLint: Restart ESLint Server**
- **ESLint: Show Output Channel**
- **Tasks: Run Task** → "ESLint: Check All Files"

## 🎯 Expected Behavior

✅ **You should now see**:
- Red underlines for ESLint errors
- Yellow underlines for ESLint warnings
- Auto-fixes when you save files
- ESLint status in status bar
- Problems listed in Problems panel

✅ **Common issues you'll catch**:
- `console.log` statements (warnings)
- Missing React dependencies in useEffect
- Formatting issues (spacing, quotes, etc.)
- TypeScript errors
- Unused variables
- Code quality issues

## 🔄 Next Steps

1. **Restart VS Code** to ensure all settings take effect
2. **Open a .tsx file** and try typing some code with errors
3. **Check the status bar** for ESLint status
4. **Test auto-fix** by saving a file with formatting issues

Your ESLint setup should now provide real-time feedback as you type!