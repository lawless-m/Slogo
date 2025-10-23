# Maintaining Language Feature Parity

This document explains how to ensure both Logo implementations (JavaScript and C#) support the same features.

## The Problem

This repository contains two Logo interpreters:
- **JavaScript** (web, in root directory)
- **C#** (desktop, in `axi-csharp/`)

As features are added to one implementation, they should also be added to the other to maintain compatibility.

## The Solution: Shared Test Suite

### `PARITY_TESTS.logo`

This file contains Logo programs that test all supported features. Both implementations should be able to run all uncommented tests successfully.

### How to Use It

#### Testing JavaScript Implementation

1. Open `index.html` in your browser
2. Open `PARITY_TESTS.logo` in a text editor
3. Uncomment one test at a time (remove the `;` at start of lines)
4. Copy the test into the web editor
5. Click "Run"
6. Verify the output is correct

#### Testing C# Implementation

1. Build and run the C# application:
   ```bash
   cd axi-csharp
   dotnet run --project Axi.Avalonia
   ```
2. Open `PARITY_TESTS.logo` in a text editor
3. Uncomment one test at a time
4. Copy the test into the C# application
5. Run and verify output matches

### When Adding New Features

1. **Implement in one language** (say, JavaScript)
2. **Add a test** to `PARITY_TESTS.logo`
3. **Run the test** in JavaScript - it should pass
4. **Run the test** in C# - it should fail (feature not implemented)
5. **Implement in C#** to match JavaScript
6. **Run the test** in C# - it should now pass
7. **Document** the feature in README.md

## Current Feature Matrix

| Feature | JavaScript | C# | Test # |
|---------|------------|-----|---------|
| Basic Movement | ✅ | ✅ | 1 |
| Variables | ✅ | ✅ | 2 |
| Arithmetic (+,-,*,/) | ✅ | ✅ | 3 |
| Parentheses | ✅ | ✅ | 4 |
| SQRT | ✅ | ✅ | 5 |
| Trigonometry (SIN/COS) | ✅ | ✅ | 6 |
| ABS, ROUND | ✅ | ✅ | 7 |
| Procedures (no params) | ✅ | ✅ | 8 |
| Procedures (with params) | ✅ | ✅ | 9 |
| Variable modification | ✅ | ✅ | 10 |
| Built-in shapes | ✅ | ✅ | 11 |
| Nested expressions | ✅ | ✅ | 12 |
| MOD operator | ✅ | ✅ | 13 |
| Unary minus | ✅ | ✅ | 14 |
| Complex expressions | ✅ | ✅ | 15 |

## Automated Testing (Future)

For future improvement, consider:

1. **Unit Tests**: Create automated test suites in both languages
2. **Output Comparison**: Run the same Logo program in both, compare SVG output
3. **CI/CD**: Automated testing on every commit
4. **Test Runner**: Script that runs all tests and reports differences

## Adding a New Feature Checklist

- [ ] Implement feature in Implementation #1
- [ ] Add test to `PARITY_TESTS.logo`
- [ ] Verify test passes in Implementation #1
- [ ] Implement feature in Implementation #2
- [ ] Verify test passes in Implementation #2
- [ ] Update feature matrix in this document
- [ ] Document in README.md with examples
- [ ] Update HTML help (for JavaScript)
- [ ] Commit both implementations together

## Example: Adding IF/IFELSE

If you wanted to add conditionals:

1. **Implement in JavaScript**:
   - Add comparison operators to tokenizer
   - Add ComparisonNode to AST
   - Add IfNode to AST
   - Update parser
   - Update executor

2. **Add test to PARITY_TESTS.logo**:
   ```logo
   ; Test 16: IF conditional
   MAKE "x 50
   IF :x > 40 [
     FORWARD 100
   ]
   ```

3. **Test in JavaScript** - should work

4. **Test in C#** - should fail with "Unknown command: IF"

5. **Implement in C#** (same steps as JavaScript)

6. **Test in C#** - should now work

7. **Update docs** everywhere

This ensures features stay in sync!

## Why This Matters

- **Portability**: Users can write programs once, run anywhere
- **Documentation**: Examples in README work for both
- **Trust**: Users know the implementations are compatible
- **Quality**: Prevents feature drift between implementations

## Questions?

If you're unsure whether implementations are in sync:
1. Run `PARITY_TESTS.logo` in both
2. If all tests pass, you're good!
3. If any test fails, investigate why
