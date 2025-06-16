# Cursor Rules for Bible App Development

## Code Organization

### File Structure
- All components must be placed in the `src/components` directory
- Feature-specific components should be grouped in subdirectories
- Each component should have its own directory with component file and styles
- Shared utilities should be placed in `src/utils`
- Types should be defined in `src/types`

### Naming Conventions
- React components: PascalCase (e.g., `DailyVerse.tsx`)
- CSS modules: camelCase with `.module.css` extension (e.g., `dailyVerse.module.css`)
- Utility functions: camelCase (e.g., `formatDate.ts`)
- Constants: UPPER_SNAKE_CASE
- Interfaces/Types: PascalCase with 'I' prefix for interfaces (e.g., `IUserProps`)

## Component Guidelines

### Component Structure
```typescript
// Imports
import React from 'react';
import styles from './ComponentName.module.css';

// Types/Interfaces
interface IComponentProps {
  // Props definition
}

// Component
const ComponentName: React.FC<IComponentProps> = ({ prop1, prop2 }) => {
  // Component logic
  return (
    // JSX
  );
};

export default ComponentName;
```

### Styling Rules
- Use CSS Modules for component-specific styles
- Follow BEM naming convention within CSS modules
- Maintain consistent color variables in global CSS
- Use responsive design units (rem, em, vh, vw)
- Implement dark mode support

## TypeScript Guidelines

### Type Definitions
- Define interfaces for all component props
- Use type inference where possible
- Avoid using `any` type
- Use union types for multiple possible values
- Define enums for constant values

### Type Safety
- Enable strict mode in tsconfig.json
- Use proper type guards
- Implement proper error handling types
- Use generics where appropriate

## State Management

### Context Usage
- Create contexts for global state
- Use context providers at appropriate levels
- Implement proper context typing
- Use context hooks for state access

### Local State
- Use useState for simple state
- Use useReducer for complex state
- Implement proper state initialization
- Handle state updates safely

## Error Handling

### Error Boundaries
- Implement error boundaries at route level
- Use custom error components
- Provide meaningful error messages
- Implement proper error logging

### API Error Handling
- Implement proper error types
- Use try-catch blocks
- Provide user-friendly error messages
- Implement retry mechanisms

## Performance

### Code Splitting
- Use dynamic imports for large components
- Implement proper loading states
- Use React.lazy for component loading
- Implement proper suspense boundaries

### Optimization
- Use React.memo for expensive components
- Implement proper useCallback and useMemo
- Optimize re-renders
- Use proper key props in lists

## Testing

### Component Testing
- Write unit tests for components
- Test user interactions
- Test error states
- Test loading states

### Integration Testing
- Test component integration
- Test API integration
- Test user flows
- Test error scenarios

## Documentation

### Code Documentation
- Document complex functions
- Document component props
- Document state management
- Document API integration

### Component Documentation
- Document component purpose
- Document usage examples
- Document props interface
- Document state management

## Git Workflow

### Branch Naming
- feature/feature-name
- bugfix/bug-description
- hotfix/issue-description
- release/version-number

### Commit Messages
- feat: new feature
- fix: bug fix
- docs: documentation
- style: formatting
- refactor: code restructuring
- test: testing
- chore: maintenance

## Security

### Input Validation
- Validate all user inputs
- Sanitize data
- Implement proper XSS protection
- Use proper CSRF protection

### Authentication
- Implement proper auth flow
- Secure sensitive routes
- Handle token management
- Implement proper session handling

## Accessibility

### ARIA Guidelines
- Use proper ARIA roles
- Implement proper labels
- Handle keyboard navigation
- Support screen readers

### Color Contrast
- Maintain WCAG 2.1 compliance
- Use proper color contrast
- Support high contrast mode
- Implement proper focus states

## Internationalization

### Text Content
- Use translation keys
- Support RTL languages
- Handle date formatting
- Handle number formatting

### Component Structure
- Support dynamic text direction
- Handle text overflow
- Support different character sets
- Implement proper text alignment

## Monitoring

### Error Tracking
- Implement error logging
- Track user errors
- Monitor performance
- Track API errors

### Analytics
- Track user interactions
- Monitor performance metrics
- Track feature usage
- Monitor error rates 