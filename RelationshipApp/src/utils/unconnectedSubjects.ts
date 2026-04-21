import type { UserCompositeChart } from '../../../shared/api/relationships';
import type { OwnedGuestSubject } from '../../../shared/api/relationshipUsers';

/**
 * A guest subject the user has created but that isn't yet the "other side"
 * of any saved relationship the user owns. These are the rows that populate
 * the "Added but not connected" affordance in Add Fork + Relationships tab.
 */
export function getUnconnectedSubjects(
  ownedSubjects: readonly OwnedGuestSubject[],
  relationshipHistory: readonly UserCompositeChart[],
  selfProfileId: string | null
): OwnedGuestSubject[] {
  if (ownedSubjects.length === 0) return [];

  const connectedPartnerIds = new Set<string>();
  const connectedPartnerNames = new Set<string>();
  for (const row of relationshipHistory) {
    // Pick up whichever side isn't the signed-in user. Collecting both sides
    // defensively handles rows that happen to list the user as `userB` rather
    // than `userA` (or where only one id is populated server-side).
    if (row.userA_id && row.userA_id !== selfProfileId) {
      connectedPartnerIds.add(row.userA_id);
    }
    if (row.userB_id && row.userB_id !== selfProfileId) {
      connectedPartnerIds.add(row.userB_id);
    }
    // Fallback for older rows that predate userA_id/userB_id wiring: match
    // on display name so a connection still suppresses its subject.
    if (row.userA_name) connectedPartnerNames.add(row.userA_name.trim().toLowerCase());
    if (row.userB_name) connectedPartnerNames.add(row.userB_name.trim().toLowerCase());
  }

  return ownedSubjects.filter((subject) => {
    if (connectedPartnerIds.has(subject._id)) {
      return false;
    }
    const fullName = [subject.firstName, subject.lastName]
      .filter(Boolean)
      .join(' ')
      .trim()
      .toLowerCase();
    if (fullName && connectedPartnerNames.has(fullName)) {
      return false;
    }
    return true;
  });
}
