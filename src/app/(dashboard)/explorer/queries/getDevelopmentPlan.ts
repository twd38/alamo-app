'use server';

import { prisma } from '@/lib/db';

export async function getDevelopmentPlan(developmentPlanId: string) {
  const developmentPlan = await prisma.developmentPlan.findUnique({
    where: { id: developmentPlanId }
  });

  return developmentPlan;
}
