# DYNAMATRIX FLOW

## Business Workflows

**Company:** Dynamatrix Solution\
**Product:** Dynamatrix Flow\
**Version:** 1.0

## 1. Employee Account Creation

``` text
Admin opens Team
→ Add Employee
→ Enters name, email, position, role
→ System generates next Employee ID (example DMS-014)
→ System generates secure temporary password
→ Password is hashed immediately
→ User record is created with mustChangePassword=true
→ Temporary credentials are shown once
→ Admin securely shares credentials
→ Activity log is created
```

The temporary password must not be retrievable later.

## 2. First Login

``` text
Employee enters Employee ID + temporary password
→ Credentials verified
→ Account status checked
→ mustChangePassword=true
→ Redirect to /change-password
→ Employee enters new password + confirmation
→ New password validated and hashed
→ passwordChangedAt updated
→ mustChangePassword=false
→ Redirect to dashboard
```

No workspace access until the forced password change is complete.

## 3. Admin Password Reset

``` text
Admin selects employee
→ Reset Password
→ Confirm action
→ New temporary password generated
→ New hash stored
→ mustChangePassword=true
→ Existing sessions revoked where supported
→ Temporary password shown once
→ Activity log records reset event, never password
```

## 4. Project Creation

``` text
Admin → New Project
→ Project details
→ Project code
→ Priority/status/dates
→ Select active Project Lead
→ Save
→ Project created
→ Lead added as ProjectMember(PROJECT_LEAD)
→ Lead receives notification
→ Activity created
```

## 5. Add Project Members

``` text
Admin or Project Lead
→ Project → Team
→ Add Members
→ Select active employees
→ Choose project role
→ Save
→ Membership records created
→ Members receive project assignment notification
→ Activity created
```

## 6. Task Creation & Assignment

``` text
Admin/Project Lead → New Task
→ Select project/milestone
→ Title + description
→ Select project member as assignee
→ Priority + start/due date
→ Save
→ Task status TODO
→ Assignee receives notification
→ Activity created
```

Do not assign tasks to inactive users or non-members.

## 7. Employee Task Work

``` text
TODO
→ Employee starts task
→ IN_PROGRESS
→ Progress update + optional note
```

If blocked:

``` text
IN_PROGRESS
→ BLOCKED
→ Blocker reason required
→ Lead can see blocker
→ Notification/activity where appropriate
```

When resolved:

``` text
BLOCKED
→ IN_PROGRESS
```

## 8. Review Workflow

``` text
Employee completes work
→ Updates progress
→ Submit for Review
→ IN_REVIEW
→ Project Lead notified
```

Lead approves:

``` text
IN_REVIEW
→ COMPLETED
→ progress=100
→ completedAt set
→ Employee notified
```

Lead requests changes:

``` text
IN_REVIEW
→ IN_PROGRESS
→ Feedback/comment required
→ Employee notified
```

## 9. Reassignment

``` text
Lead/Admin opens task
→ Change Assignee
→ New assignee must be active project member
→ Assignment changed
→ Old/new assignees notified where appropriate
→ Activity + TaskUpdate created
```

History must preserve prior assignment context in logs/metadata.

## 10. Overdue Tasks

A task is overdue when:

``` text
dueDate < current organization time
AND status NOT IN (COMPLETED, CANCELLED)
```

Overdue is a derived condition, not necessarily a separate task status.

Display overdue tasks prominently in My Tasks and Lead/Admin dashboards.

## 11. Upcoming Tasks

Group assigned active tasks into:

``` text
Overdue
Today
Tomorrow
Next 7 Days
Later
```

Sort by due date and priority within useful groups.

## 12. Project Resource Sharing

``` text
Project Member → Project → Resources
→ Add Resource
→ Title + valid URL
→ Category
→ Description/tags
→ Optional related task
→ Save
→ Resource visible to project members
→ Activity created
```

Examples include research, official documentation, API docs, Figma,
GitHub, Drive, client references, competitors, tutorials, and meeting
references.

## 13. Resource Edit/Archive

Employee may edit own resource according to RBAC.

Project Lead/Admin may manage resources in their scope.

Archive removes it from normal active lists while preserving history.

## 14. Project Lead Change

``` text
Admin → Project Settings
→ Change Project Lead
→ Select active employee
→ Ensure new lead membership
→ Update old/new project roles as appropriate
→ Notify both users
→ Activity log
```

Only Admin performs lead reassignment in MVP.

## 15. Remove Project Member

``` text
Admin/Lead → Project Team
→ Remove Member
→ System checks active assigned tasks
→ Require reassign/unassign decision
→ Confirm
→ membership.removedAt set
→ Project access revoked
→ Activity created
```

Never delete historical task updates/comments authored by the removed
member.

## 16. Project Completion

Before completing a project, show:

-   active tasks;
-   blocked tasks;
-   tasks in review;
-   overdue tasks;
-   incomplete milestones.

Admin/Lead may resolve them or explicitly confirm according to policy.

Then:

``` text
Project status → COMPLETED
→ completion activity
→ project remains readable
```

Archiving is a separate later action.

## 17. Notifications

Create notifications for meaningful events, not every tiny edit.

Important events:

-   project assignment;
-   task assignment/reassignment;
-   review requested;
-   review approved/changes requested;
-   due-soon reminder;
-   overdue task;
-   relevant task comment;
-   important project update.

## 18. Activity Logging

Activity answers: "What changed, who changed it, and when?"

Task updates answer: "How did this task progress?"

Do not duplicate sensitive data into either history.

## 19. Failure Handling

For mutations:

``` text
Validate
→ Authorize
→ Execute transaction
→ Create history/notification
→ Commit
→ Revalidate UI
```

If the transaction fails, do not leave partial business state.

## 20. MVP Workflow Principle

Keep the workflow understandable:

``` text
Leader creates people and projects
→ Lead organizes project work
→ Employees execute and report progress
→ Lead reviews
→ Everyone shares project knowledge
→ Leader monitors delivery
```
