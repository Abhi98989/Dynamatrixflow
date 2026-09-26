# DYNAMATRIX FLOW

## RBAC & Authorization Rules

**Company:** Dynamatrix Solution\
**Product:** Dynamatrix Flow\
**Version:** 1.0

## 1. Purpose

This document defines who can do what. UI visibility is not security.
Every protected operation MUST be checked on the server.

## 2. Roles

### Admin / Company Leader

Organization-wide authority for employee accounts, projects,
memberships, oversight, and system administration.

### Project Lead

Project-scoped management authority only for projects they lead.

### Employee

Project member who works on assigned tasks and contributes project
resources/comments.

## 3. Authorization Context

A decision may depend on all of:

``` text
Authenticated user
+ System role
+ Account status
+ Project membership
+ Project-specific role
+ Whether user is project lead
+ Whether task is assigned to user
+ Current entity state
```

Do not authorize solely from a client-provided role.

## 4. Permission Matrix

  ------------------------------------------------------------------------------
  Action                             Admin       Project Lead           Employee
  --------------------- ------------------ ------------------ ------------------
  View company                         Yes            Limited                 No
  dashboard                                                   

  Create employee                      Yes                 No                 No

  Edit employee account                Yes                 No Own profile fields
                                                                            only

  Reset employee                       Yes                 No         Change own
  password                                                              password

  Activate/deactivate                  Yes                 No                 No
  employee                                                    

  Create project                       Yes                 No                 No

  Edit any project                     Yes                 No                 No

  Edit project led by                  Yes                Yes                 No
  user                                                        

  Archive project                      Yes      No by default                 No

  Assign/change project                Yes                 No                 No
  lead                                                        

  Add/remove project                   Yes       Yes, own led                 No
  members                                             project 

  View project                         Yes     If member/lead          If member

  View project internal                Yes       Yes, own led      No by default
  notes                                               project 

  Create milestone                     Yes       Yes, own led                 No
                                                      project 

  Edit milestone                       Yes       Yes, own led                 No
                                                      project 

  Create task                          Yes       Yes, own led      No by default
                                                      project 

  Assign task                          Yes       Yes, own led                 No
                                                      project 

  Reassign task                        Yes       Yes, own led                 No
                                                      project 

  Update own assigned                  Yes                Yes                Yes
  task status                                                 

  Update another                       Yes       Yes, own led                 No
  employee's task                                     project 

  Submit own task for                  Yes                Yes                Yes
  review                                                      

  Approve/complete                     Yes       Yes, own led      No by default
  reviewed task                                       project 

  Request changes on                   Yes       Yes, own led                 No
  review                                              project 

  Add task comment                     Yes  If project access  If project access

  Add project resource                 Yes                Yes    Yes, if project
                                                                          member

  Edit own resource                    Yes                Yes  Yes, own resource

  Edit any project                     Yes       Yes, own led                 No
  resource                                            project 

  Archive resource                     Yes       Yes, own led  Own resource only
                                                      project   if policy allows

  View project activity                Yes                Yes               Yes,
                                                                  project-scoped

  View organization                    Yes                 No                 No
  activity                                                    

  View own                             Yes                Yes                Yes
  notifications                                               

  View another user's    No except support                 No                 No
  notifications                    tooling                    

  View team workload                   Yes   Own led projects      Own work only

  Manage system                        Yes                 No                 No
  settings                                                    
  ------------------------------------------------------------------------------

## 5. Admin Rules

Admin can access all projects and tasks for legitimate
company-management purposes.

Admin must still:

-   pass input validation;
-   respect archived states;
-   create activity logs for sensitive changes;
-   never retrieve an employee's existing password;
-   reset credentials instead of revealing them.

## 6. Project Lead Rules

Project Lead authority is project-scoped.

A user with `PROJECT_LEAD` system role does NOT automatically control
all projects.

Required check:

``` text
project.projectLeadId === currentUser.id
```

or an explicit project permission model added later.

A Project Lead can manage members/tasks/resources only within that
project.

## 7. Employee Rules

Employees can:

-   view projects where active membership exists;
-   view tasks/resources/activity inside those projects;
-   update tasks assigned to them within permitted workflow transitions;
-   comment on accessible tasks;
-   add useful project resources;
-   edit their own basic profile information;
-   change their own password.

Employees cannot:

-   create employee accounts;
-   see organization-wide data;
-   assign themselves to projects;
-   change project leads;
-   manage unrelated employees;
-   access another project's URL by guessing IDs;
-   approve their own review by default.

## 8. Task Transition Permissions

### Employee/Assignee

Allowed normal transitions:

``` text
TODO -> IN_PROGRESS
IN_PROGRESS -> BLOCKED
BLOCKED -> IN_PROGRESS
IN_PROGRESS -> IN_REVIEW
```

Employees should not normally move `IN_REVIEW -> COMPLETED`.

### Project Lead/Admin

May:

``` text
TODO -> IN_PROGRESS
IN_PROGRESS -> BLOCKED
BLOCKED -> IN_PROGRESS
IN_PROGRESS -> IN_REVIEW
IN_REVIEW -> IN_PROGRESS   (changes requested)
IN_REVIEW -> COMPLETED
COMPLETED -> IN_PROGRESS   (reopen, with reason)
ANY VALID STATE -> CANCELLED
```

Every exceptional transition should be auditable.

## 9. Resource Permissions

A project member can add a resource to a project they belong to.

Employee: - create resource; - edit own resource; - view project
resources.

Project Lead: - all employee permissions; - edit/archive project
resources; - organize categories/tags.

Admin: - organization-wide management.

A resource linked to a task must use a task from the same project.

## 10. Project Membership Removal

Before removing a member:

1.  Identify active tasks assigned to that member.
2.  Require reassignment, unassignment, or explicit confirmation.
3.  Preserve historical task ownership/activity.
4.  Set `removedAt` rather than destroying membership history.
5.  Revoke project access immediately after removal.

## 11. Inactive Accounts

An `INACTIVE` or `SUSPENDED` account:

-   cannot authenticate;
-   cannot receive new assignments;
-   remains visible in historical records;
-   should not be silently removed from prior activity.

## 12. Server Authorization Helpers

Centralize checks such as:

``` text
requireAuthenticatedUser()
requireActiveUser()
requireAdmin()
canViewProject(userId, projectId)
canManageProject(userId, projectId)
canManageMembers(userId, projectId)
canCreateTask(userId, projectId)
canUpdateTask(userId, taskId)
canReviewTask(userId, taskId)
canManageResource(userId, resourceId)
```

Avoid duplicating slightly different authorization logic across routes.

## 13. Search Authorization

Search must filter by access before returning results.

Admin: - organization-wide results.

Project Lead/Employee: - projects/tasks/resources belonging only to
accessible projects; - employee directory fields only as permitted.

Never return unauthorized results and then hide them in the UI.

## 14. Direct URL Protection

Every page such as:

``` text
/projects/[projectId]
/projects/[projectId]/tasks/[taskId]
/team/[employeeId]
```

must re-check access on the server.

Guessing an ID must never bypass authorization.

## 15. Audit Requirements

Log sensitive actions including:

-   employee creation/deactivation;
-   password reset initiated;
-   project creation/archive;
-   project lead changes;
-   membership changes;
-   task assignment/reassignment;
-   task status/review changes;
-   resource archive;
-   permission-sensitive changes.

Do not log passwords, hashes, tokens, cookies, or secrets.

## 16. Default-Deny Principle

If an action is not explicitly allowed, deny it until the permission is
defined.

This is the required behavior for all new Dynamatrix Flow features.
