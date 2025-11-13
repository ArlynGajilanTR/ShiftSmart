# Pre-Commit Hooks Setup Guide

**Status:** ✅ Installed and Configured  
**Last Updated:** November 13, 2025

## Overview

Pre-commit hooks automatically validate your code before each commit, ensuring code quality and consistency.

## Installation Status

✅ **Pre-commit installed**: `/Users/lng1512/Library/Python/3.9/bin/pre-commit`  
✅ **Git hooks installed**: `.git/hooks/pre-commit`  
✅ **Configuration**: `.pre-commit-config.yaml`

## What Gets Checked

### 1. File Hygiene

- ✅ Trailing whitespace removal
- ✅ End-of-file fixer
- ✅ Line ending consistency (LF)
- ✅ Large file detection (>1MB)

### 2. Code Quality

- ✅ **Prettier** - JavaScript/TypeScript formatting
- ✅ **ESLint** - Code linting
- ✅ **TypeScript** - Type checking (`tsc --noEmit`)

### 3. SQL & Database

- ✅ **SQLFluff** - SQL formatting and linting (PostgreSQL dialect)

### 4. Markdown

- ✅ **Markdownlint** - Markdown formatting
  - Disabled rules: MD013 (line length), MD040 (code language), MD024 (duplicate headings), MD029 (list numbering)

### 5. Configuration Files

- ✅ YAML syntax validation
- ✅ JSON syntax validation (excludes tsconfig.json comments)

### 6. Security & Data Protection

- ✅ Private key detection
- ✅ Merge conflict markers
- ✅ Production email check (excludes .md and .sql files)
- ✅ Test data validation (TEST\_\* constants)

## Usage

### Automatic (Recommended)

Pre-commit hooks run automatically on `git commit`:

```bash
git add .
git commit -m "your message"
# Hooks run automatically before commit
```

### Manual Run

Run hooks on all files:

```bash
/Users/lng1512/Library/Python/3.9/bin/pre-commit run --all-files
```

Run hooks on staged files only:

```bash
/Users/lng1512/Library/Python/3.9/bin/pre-commit run
```

### Bypass (Use Sparingly)

Skip hooks for a specific commit:

```bash
git commit --no-verify -m "emergency fix"
```

⚠️ **Warning:** Only use `--no-verify` for emergencies. CI checks will still run.

## Configuration

Configuration file: `.pre-commit-config.yaml`

### Key Settings

```yaml
# Auto-fix enabled for:
- Prettier formatting
- Trailing whitespace
- End of files
- SQL formatting

# Excluded directories:
- node_modules/
- .next/
- dist/
- build/
- tests/e2e/playwright-report/
```

### Disabled Checks

For practicality, some checks are disabled:

- **MD013** - Line length (80 chars) - too strict for documentation
- **MD040** - Code language tags - not always needed
- **MD024** - Duplicate headings - common in documentation
- **MD029** - List numbering style - auto-formatting handles this

## Troubleshooting

### Hook Fails on Commit

If a hook fails:

1. **Review the error message** - it will tell you what failed
2. **Fix the issue** manually or let auto-fix handle it
3. **Re-stage files**: `git add .`
4. **Try commit again**: `git commit -m "your message"`

### TypeScript Errors

If TypeScript check fails:

```bash
# Run TypeScript check manually
npx tsc --noEmit

# Fix errors, then commit
```

### ESLint Errors

If ESLint fails:

```bash
# Run ESLint manually
npm run lint

# Auto-fix when possible
npm run lint -- --fix

# Commit after fixing
```

### Update Hooks

Update to latest hook versions:

```bash
/Users/lng1512/Library/Python/3.9/bin/pre-commit autoupdate
```

### Clear Cache

If hooks behave unexpectedly:

```bash
/Users/lng1512/Library/Python/3.9/bin/pre-commit clean
/Users/lng1512/Library/Python/3.9/bin/pre-commit install --install-hooks
```

## Performance

### First Run

First time hooks run on a file, they need to install dependencies:

- ⏱️ **Initial setup**: 2-5 minutes
- ⏱️ **Subsequent runs**: 5-15 seconds

### Speed Tips

- Hooks run only on staged files (not all files)
- Use `git add <specific-files>` to limit scope
- Auto-fixes happen instantly

## Integration with Engineering Build Rules

Pre-commit hooks enforce:

- ✅ Code quality standards
- ✅ Consistent formatting
- ✅ Test data validation
- ✅ No production IDs in code

They complement the CI checks:

- **Pre-commit**: Local validation (fast feedback)
- **CI**: Full validation on PR (comprehensive)

## Files Modified by Hooks

Hooks may auto-modify these files:

- Any file with trailing whitespace
- Files missing final newline
- JavaScript/TypeScript files (Prettier)
- SQL files (SQLFluff)
- Markdown files (markdownlint)

After auto-fixes:

1. Review changes: `git diff`
2. Re-stage: `git add .`
3. Commit again

## PATH Configuration (Optional)

To use `pre-commit` command directly, add to your shell config:

**For zsh** (`~/.zshrc`):

```bash
export PATH="$HOME/Library/Python/3.9/bin:$PATH"
```

**For bash** (`~/.bash_profile`):

```bash
export PATH="$HOME/Library/Python/3.9/bin:$PATH"
```

Then reload: `source ~/.zshrc` or `source ~/.bash_profile`

After this, you can use:

```bash
pre-commit run --all-files
```

## Summary

✅ **Installed**: Pre-commit hooks are active  
✅ **Auto-fix**: Most issues fixed automatically  
✅ **Fast**: Only checks changed files  
✅ **Safe**: No code changes without your review  
✅ **CI Compatible**: Works with GitHub Actions

Pre-commit hooks are your first line of defense for code quality! 🛡️

---

**Questions?**

- Check `.pre-commit-config.yaml` for configuration
- See [Engineering Build Rules](../ENGINEERING_BUILD_RULES.md)
- Review [Contributing Guide](../CONTRIBUTING.md)

**Last Updated:** November 13, 2025  
**Maintained by:** Reuters Breaking News Team
