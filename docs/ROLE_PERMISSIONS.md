# Roles and permissions

Live access comes from the server-owned user profile, never the demo role picker. All callable endpoints require a verified Google identity and an active profile. Firestore and Storage rules deny direct client access.

| Action | Institution | Reviewer | Approver | Admin |
| --- | --- | --- | --- | --- |
| Read instruments and documents | Own institution | All | All | All |
| Create/edit draft and returned submission | Own institution | No | No | No |
| Upload before verification | Own institution | No | No | No |
| Verify or return for correction | No | Yes | No | Yes |
| Request release/refund/discharge | Own institution | No | No | No |
| Decide closure request | No | No | Yes | Yes |
| Change reminder thresholds | No | No | Yes | Yes |
| Assign roles / disable accounts | No | No | No | Yes |

A reviewer cannot review an instrument they created, including returning it for correction. A decision maker must differ from the record creator, verifier and request creator. Admin privileges do not bypass these restrictions. Changing somebody's role does not erase their historical identity.

The first verified Google sign-in matching INITIAL_ADMIN_EMAIL acquires the bootstrap lock. Later matching accounts cannot acquire a second bootstrap. The administrator should provision another authorized administrator before disabling their own access. Institution onboarding assigns the authenticated UID as the institution ID; it does not attach an account to an arbitrary existing institution.
