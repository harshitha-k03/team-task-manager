# Member Dashboard Implementation TODO

## Plan Status: IN PROGRESS

### Backend APIs
- [ ] STEP 1: Add `/api/projects/my-projects` endpoint
- [ ] STEP 2: Enhance `/api/tasks/my-tasks` with better population

### Frontend
- [ ] STEP 3: Redesign Dashboard with 3 sections
- [ ] STEP 4: Add loading states and animations
- [ ] STEP 5: Test API integration

---

## Implementation Notes

### Backend Changes Required:
1. `server/routes/projects.js` - Add my-projects route
2. `server/routes/tasks.js` - Review and enhance my-tasks

### Frontend Changes Required:
1. `client/src/pages/Dashboard.jsx` - Complete redesign
   - Section 1: My Projects cards
   - Section 2: My Tasks cards
   - Section 3: Kanban board

### Acceptance Criteria:
- Members can see their projects
- Members can see their assigned tasks
- Kanban shows only assigned tasks
- Status can be updated
- Empty states are handled
- Loading states are shown
