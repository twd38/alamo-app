import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testPartRoutings() {
  // Get a part that has routings
  const partWithRoutings = await prisma.part.findFirst({
    where: {
      partRoutings: {
        some: {}
      }
    },
    include: {
      partRoutings: {
        include: {
          routing: {
            include: {
              steps: {
                include: {
                  operation: true,
                  workCenter: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!partWithRoutings) {
    console.log('No parts with routings found');
    return;
  }

  console.log(`Part: ${partWithRoutings.partNumber} - ${partWithRoutings.name}`);
  console.log(`Number of routings: ${partWithRoutings.partRoutings.length}`);
  
  partWithRoutings.partRoutings.forEach((pr, index) => {
    console.log(`\nRouting ${index + 1}:`);
    console.log(`  ID: ${pr.id}`);
    console.log(`  Routing Number: ${pr.routing.routingNumber}`);
    console.log(`  Is Default: ${pr.isDefault}`);
    console.log(`  Steps: ${pr.routing.steps.length}`);
  });

  // Test the structure matches what the component expects
  const firstPartRouting = partWithRoutings.partRoutings[0];
  console.log('\nTesting data structure:');
  console.log('Has routing property:', 'routing' in firstPartRouting);
  console.log('Has routing.steps property:', firstPartRouting.routing && 'steps' in firstPartRouting.routing);
  console.log('First step has operation:', firstPartRouting.routing?.steps[0] && 'operation' in firstPartRouting.routing.steps[0]);
  console.log('First step has workCenter:', firstPartRouting.routing?.steps[0] && 'workCenter' in firstPartRouting.routing.steps[0]);
}

testPartRoutings()
  .catch(console.error)
  .finally(() => prisma.$disconnect());