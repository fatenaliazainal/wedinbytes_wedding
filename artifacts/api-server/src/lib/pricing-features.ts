import { and, eq } from "drizzle-orm";
import { db, pricingFeatureTable } from "@workspace/db";

export async function invitationHasFeature(
  invitation: { packageId: number | null },
  featureName: string,
) {
  if (!invitation.packageId) return false;
  const [feature] = await db
    .select({ id: pricingFeatureTable.id })
    .from(pricingFeatureTable)
    .where(and(
      eq(pricingFeatureTable.packageId, invitation.packageId),
      eq(pricingFeatureTable.name, featureName),
    ))
    .limit(1);
  return Boolean(feature);
}