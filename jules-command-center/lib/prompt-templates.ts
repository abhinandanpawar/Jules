export const templates: { [key: string]: { name: string; template: string } } = {
  general: {
    name: 'General Task',
    template: `### Objective

(Please provide a clear and concise description of what needs to be done.)

### Acceptance Criteria

- [ ] (Define the conditions that must be met for the task to be considered complete.)
- [ ] (Add more criteria as needed.)

### Additional Context

(Provide any extra information, links, or screenshots that might be helpful.)`,
  },
  bug: {
    name: 'Bug Fix',
    template: `### Bug Description

(A clear and concise description of what the bug is.)

### Steps to Reproduce

1. Go to '...'
2. Click on '....'
3. See error

### Expected Behavior

(A clear and concise description of what you expected to happen.)

### Actual Behavior

(A clear and concise description of what actually happened.)

### Screenshots

(If applicable, add screenshots to help explain your problem.)`,
  },
  feature: {
    name: 'New Feature Request',
    template: `### User Story

As a [type of user], I want [an action] so that [a benefit].

### Feature Description

(A clear and concise description of the new feature.)

### Acceptance Criteria

- [ ] Given [context], when [I do something], then [I expect something to happen].
- [ ] (Add more criteria as needed.)

### Design / Mockups

(Please provide links to any relevant design files, mockups, or screenshots.)`,
  },
};