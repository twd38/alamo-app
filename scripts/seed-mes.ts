import { PrismaClient, WorkCenterType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding MES Phase 1 data...');

  // Create Work Centers
  const workCenters = await Promise.all([
    prisma.workCenter.upsert({
      where: { code: 'WC-MACH-001' },
      update: {},
      create: {
        code: 'WC-MACH-001',
        name: 'CNC Machining Center 1',
        description: 'Primary CNC machining center for precision parts',
        type: WorkCenterType.MACHINING,
        capacity: 100,
        efficiency: 0.85,
        setupTime: 30,
        costPerHour: 125,
        isActive: true
      }
    }),
    prisma.workCenter.upsert({
      where: { code: 'WC-ASSY-001' },
      update: {},
      create: {
        code: 'WC-ASSY-001',
        name: 'Assembly Station 1',
        description: 'Main assembly station for mechanical components',
        type: WorkCenterType.ASSEMBLY,
        capacity: 50,
        efficiency: 0.9,
        setupTime: 15,
        costPerHour: 75,
        isActive: true
      }
    }),
    prisma.workCenter.upsert({
      where: { code: 'WC-INSP-001' },
      update: {},
      create: {
        code: 'WC-INSP-001',
        name: 'Quality Inspection Station',
        description: 'Quality control and dimensional inspection',
        type: WorkCenterType.INSPECTION,
        capacity: 200,
        efficiency: 0.95,
        setupTime: 10,
        costPerHour: 60,
        isActive: true
      }
    }),
    prisma.workCenter.upsert({
      where: { code: 'WC-PACK-001' },
      update: {},
      create: {
        code: 'WC-PACK-001',
        name: 'Packaging Station',
        description: 'Final packaging and shipping preparation',
        type: WorkCenterType.PACKAGING,
        capacity: 150,
        efficiency: 0.95,
        setupTime: 5,
        costPerHour: 45,
        isActive: true
      }
    })
  ]);

  console.log(`Created ${workCenters.length} work centers`);

  // Create Operations
  const operations = await Promise.all([
    // Machining Operations
    prisma.operation.upsert({
      where: { code: 'OP-MILL-001' },
      update: {},
      create: {
        code: 'OP-MILL-001',
        name: 'CNC Milling',
        description: 'Standard CNC milling operation',
        workCenterId: workCenters[0].id, // Machining Center
        defaultDuration: 45,
        setupTime: 30,
        requiresSkill: 'CNC Operator Level 2',
        isActive: true
      }
    }),
    prisma.operation.upsert({
      where: { code: 'OP-TURN-001' },
      update: {},
      create: {
        code: 'OP-TURN-001',
        name: 'CNC Turning',
        description: 'CNC lathe turning operation',
        workCenterId: workCenters[0].id, // Machining Center
        defaultDuration: 30,
        setupTime: 20,
        requiresSkill: 'CNC Operator Level 2',
        isActive: true
      }
    }),
    // Assembly Operations
    prisma.operation.upsert({
      where: { code: 'OP-ASSY-001' },
      update: {},
      create: {
        code: 'OP-ASSY-001',
        name: 'Manual Assembly',
        description: 'Manual component assembly',
        workCenterId: workCenters[1].id, // Assembly Station
        defaultDuration: 20,
        setupTime: 10,
        requiresSkill: 'Assembly Technician',
        isActive: true
      }
    }),
    prisma.operation.upsert({
      where: { code: 'OP-WELD-001' },
      update: {},
      create: {
        code: 'OP-WELD-001',
        name: 'Spot Welding',
        description: 'Spot welding for metal components',
        workCenterId: workCenters[1].id, // Assembly Station
        defaultDuration: 15,
        setupTime: 15,
        requiresSkill: 'Certified Welder',
        isActive: true
      }
    }),
    // Inspection Operations
    prisma.operation.upsert({
      where: { code: 'OP-INSP-001' },
      update: {},
      create: {
        code: 'OP-INSP-001',
        name: 'Visual Inspection',
        description: 'Visual quality inspection',
        workCenterId: workCenters[2].id, // Inspection Station
        defaultDuration: 10,
        setupTime: 5,
        requiresSkill: 'Quality Inspector',
        isActive: true
      }
    }),
    prisma.operation.upsert({
      where: { code: 'OP-MEAS-001' },
      update: {},
      create: {
        code: 'OP-MEAS-001',
        name: 'Dimensional Measurement',
        description: 'Precision dimensional measurement',
        workCenterId: workCenters[2].id, // Inspection Station
        defaultDuration: 20,
        setupTime: 10,
        requiresSkill: 'CMM Operator',
        isActive: true
      }
    }),
    // Packaging Operations
    prisma.operation.upsert({
      where: { code: 'OP-PACK-001' },
      update: {},
      create: {
        code: 'OP-PACK-001',
        name: 'Standard Packaging',
        description: 'Standard packaging for shipment',
        workCenterId: workCenters[3].id, // Packaging Station
        defaultDuration: 10,
        setupTime: 5,
        requiresSkill: 'Packaging Operator',
        isActive: true
      }
    })
  ]);

  console.log(`Created ${operations.length} operations`);

  // Create Procedures for each operation
  const procedures = [];
  
  // Milling procedures
  const millingProcedures = [
    {
      operationId: operations[0].id,
      stepNumber: 1,
      title: 'Setup and Fixture',
      instructions: 'Mount the workpiece in the vise or fixture. Ensure proper alignment and secure clamping.',
      estimatedTime: 10,
      requiredTools: ['Vise', 'Clamps', 'Dial indicator'],
      safetyNotes: 'Ensure workpiece is securely clamped before starting spindle',
      qualityChecks: ['Verify workpiece alignment', 'Check fixture security']
    },
    {
      operationId: operations[0].id,
      stepNumber: 2,
      title: 'Tool Setup',
      instructions: 'Load required cutting tools into tool magazine. Set tool offsets in CNC control.',
      estimatedTime: 15,
      requiredTools: ['End mills', 'Tool holders', 'Tool setter'],
      safetyNotes: 'Handle cutting tools with care',
      qualityChecks: ['Verify tool dimensions', 'Check tool wear']
    },
    {
      operationId: operations[0].id,
      stepNumber: 3,
      title: 'Program Execution',
      instructions: 'Load CNC program. Run in single block mode first, then execute full program.',
      estimatedTime: 20,
      requiredTools: ['CNC program', 'Coolant'],
      safetyNotes: 'Keep hands clear of moving parts',
      qualityChecks: ['Monitor surface finish', 'Check dimensions periodically']
    }
  ];

  for (const proc of millingProcedures) {
    procedures.push(
      await prisma.procedure.upsert({
        where: {
          operationId_stepNumber: {
            operationId: proc.operationId,
            stepNumber: proc.stepNumber
          }
        },
        update: proc,
        create: proc
      })
    );
  }

  // Assembly procedures
  const assemblyProcedures = [
    {
      operationId: operations[2].id,
      stepNumber: 1,
      title: 'Component Preparation',
      instructions: 'Gather all required components. Verify part numbers and quantities.',
      estimatedTime: 5,
      requiredTools: ['Parts list', 'Component bins'],
      safetyNotes: 'Handle components carefully to avoid damage',
      qualityChecks: ['Verify all components present', 'Check for visible defects']
    },
    {
      operationId: operations[2].id,
      stepNumber: 2,
      title: 'Assembly Process',
      instructions: 'Follow assembly drawing. Install components in specified sequence.',
      estimatedTime: 10,
      requiredTools: ['Assembly drawing', 'Hand tools', 'Torque wrench'],
      safetyNotes: 'Use proper ergonomics',
      qualityChecks: ['Verify correct orientation', 'Check fastener torque']
    },
    {
      operationId: operations[2].id,
      stepNumber: 3,
      title: 'Final Check',
      instructions: 'Perform functional test. Verify all components properly secured.',
      estimatedTime: 5,
      requiredTools: ['Test fixture', 'Checklist'],
      safetyNotes: 'Follow lockout/tagout procedures for testing',
      qualityChecks: ['Functional test passed', 'Visual inspection complete']
    }
  ];

  for (const proc of assemblyProcedures) {
    procedures.push(
      await prisma.procedure.upsert({
        where: {
          operationId_stepNumber: {
            operationId: proc.operationId,
            stepNumber: proc.stepNumber
          }
        },
        update: proc,
        create: proc
      })
    );
  }

  console.log(`Created ${procedures.length} procedures`);

  // Get some existing parts to create routings for
  const parts = await prisma.part.findMany({
    take: 3,
    orderBy: { partNumber: 'asc' }
  });

  if (parts.length > 0) {
    // Create sample routings
    const routings = [];
    
    for (let i = 0; i < Math.min(2, parts.length); i++) {
      const part = parts[i];
      
      const routing = await prisma.routing.create({
        data: {
          partId: part.id,
          routingNumber: `RT-${part.partNumber}-001`,
          version: 1,
          isActive: true,
          notes: `Standard routing for ${part.partNumber}`,
          steps: {
            create: [
              {
                stepNumber: 10,
                operationId: operations[0].id, // Milling
                workCenterId: workCenters[0].id, // Machining Center
                setupTime: 30,
                runTime: 45,
                queueTime: 60,
                moveTime: 15,
                notes: 'Initial machining operation'
              },
              {
                stepNumber: 20,
                operationId: operations[2].id, // Assembly
                workCenterId: workCenters[1].id, // Assembly Station
                setupTime: 10,
                runTime: 20,
                queueTime: 30,
                moveTime: 10,
                notes: 'Component assembly'
              },
              {
                stepNumber: 30,
                operationId: operations[4].id, // Visual Inspection
                workCenterId: workCenters[2].id, // Inspection Station
                setupTime: 5,
                runTime: 10,
                queueTime: 15,
                moveTime: 5,
                notes: 'Quality inspection'
              },
              {
                stepNumber: 40,
                operationId: operations[6].id, // Packaging
                workCenterId: workCenters[3].id, // Packaging Station
                setupTime: 5,
                runTime: 10,
                queueTime: 10,
                moveTime: 5,
                notes: 'Final packaging'
              }
            ]
          }
        }
      });
      
      routings.push(routing);
      
      // Create PartRouting junction record and set first one as default
      await prisma.partRouting.create({
        data: {
          partId: part.id,
          routingId: routing.id,
          isDefault: i === 0
        }
      });
    }
    
    console.log(`Created ${routings.length} routings with part assignments`);
  } else {
    console.log('No parts found to create routings for');
  }

  console.log('MES Phase 1 seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding MES data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });