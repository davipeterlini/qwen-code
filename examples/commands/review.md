---
name: review
description: Request a code review
allowed-tools:
  - Read
  - Grep
  - Shell
---

# Code Review Command

Review the changes in the current branch and provide feedback.

## Review Process

1. **Get changed files**

   ```bash
   !git diff --name-only main
   ```

2. **Read each changed file**
   - Understand the context
   - Identify the changes
   - Check for potential issues

3. **Review for**:
   - **Security**: Look for vulnerabilities, injection risks, insecure data handling
   - **Performance**: Identify potential bottlenecks, inefficient algorithms
   - **Code Quality**: Check naming, structure, duplication, comments
   - **Testing**: Verify tests exist and cover edge cases
   - **Best Practices**: Framework conventions, design patterns

4. **Provide feedback**:
   - Start with positive observations
   - List concerns with specific line numbers
   - Suggest concrete improvements
   - Prioritize issues (critical, major, minor)

## Output Format

```markdown
## Review Summary

**Files Changed:** X
**Lines Added:** Y
**Lines Removed:** Z

## Positive Observations

- ...

## Concerns

### Critical

- [ ] ...

### Major

- [ ] ...

### Minor

- [ ] ...

## Suggestions

1. ...
```

## Arguments

- Branch to compare against (default: main)
- Focus area (optional): security, performance, style

## Examples

```
/review
/review develop
/review main --focus=security
```
