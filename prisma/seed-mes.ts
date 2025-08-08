import { PrismaClient, WorkCenterType, OperationStatus, InstructionStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function seedMES() {
  console.log('🌱 Seeding MES data...');

  // Create Work Centers
  const workCenters = await Promise.all([
    prisma.workCenter.upsert({
      where: { code: 'WC-CNC-001' },
      update: {},
      create: {
        code: 'WC-CNC-001',
        name: 'CNC Milling Station 1',
        type: WorkCenterType.MACHINING,
        description: '5-axis CNC milling machine for precision parts',
        isActive: true,
        capacity: 8, // hours per day
        costPerHour: 150,
        setupTime: 30, // minutes
      },
    }),
    prisma.workCenter.upsert({
      where: { code: 'WC-CNC-002' },
      update: {},
      create: {
        code: 'WC-CNC-002',
        name: 'CNC Turning Station 1',
        type: WorkCenterType.MACHINING,
        description: 'CNC lathe for rotational parts',
        isActive: true,
        capacity: 8,
        costPerHour: 120,
        setupTime: 25,
      },
    }),
    prisma.workCenter.upsert({
      where: { code: 'WC-ASM-001' },
      update: {},
      create: {
        code: 'WC-ASM-001',
        name: 'Assembly Station 1',
        type: WorkCenterType.ASSEMBLY,
        description: 'Manual assembly workstation',
        isActive: true,
        capacity: 8,
        costPerHour: 75,
        setupTime: 10,
      },
    }),
    prisma.workCenter.upsert({
      where: { code: 'WC-QC-001' },
      update: {},
      create: {
        code: 'WC-QC-001',
        name: 'Quality Inspection',
        type: WorkCenterType.INSPECTION,
        description: 'CMM and manual inspection station',
        isActive: true,
        capacity: 8,
        costPerHour: 100,
        setupTime: 15,
      },
    }),
    prisma.workCenter.upsert({
      where: { code: 'WC-WLD-001' },
      update: {},
      create: {
        code: 'WC-WLD-001',
        name: 'Welding Station 1',
        type: WorkCenterType.ASSEMBLY,
        description: 'TIG/MIG welding station',
        isActive: true,
        capacity: 8,
        costPerHour: 110,
        setupTime: 20,
      },
    }),
  ]);

  console.log(`✅ Created ${workCenters.length} work centers`);

  // Create Operations
  const operations = await Promise.all([
    prisma.operation.upsert({
      where: { code: 'OP-CNC-001' },
      update: {},
      create: {
        code: 'OP-CNC-001',
        name: 'CNC Milling - Standard',
        description: 'Standard CNC milling operation for precision parts',
        workCenterId: workCenters[0].id,
        setupTime: 30,
        defaultDuration: 45,
      },
    }),
    prisma.operation.upsert({
      where: { code: 'OP-CNC-002' },
      update: {},
      create: {
        code: 'OP-CNC-002',
        name: 'CNC Turning - Standard',
        description: 'Standard CNC turning operation for rotational parts',
        workCenterId: workCenters[1].id,
        setupTime: 25,
        defaultDuration: 35,
      },
    }),
    prisma.operation.upsert({
      where: { code: 'OP-ASM-001' },
      update: {},
      create: {
        code: 'OP-ASM-001',
        name: 'Manual Assembly',
        description: 'Manual assembly of components',
        workCenterId: workCenters[2].id,
        setupTime: 10,
        defaultDuration: 20,
      },
    }),
    prisma.operation.upsert({
      where: { code: 'OP-QC-001' },
      update: {},
      create: {
        code: 'OP-QC-001',
        name: 'Quality Inspection',
        description: 'Quality control and dimensional inspection',
        workCenterId: workCenters[3].id,
        setupTime: 15,
        defaultDuration: 30,
      },
    }),
    prisma.operation.upsert({
      where: { code: 'OP-WLD-001' },
      update: {},
      create: {
        code: 'OP-WLD-001',
        name: 'TIG Welding',
        description: 'TIG welding for precision joints',
        workCenterId: workCenters[4].id,
        setupTime: 20,
        defaultDuration: 40,
      },
    }),
  ]);

  console.log(`✅ Created ${operations.length} operations`);

  // Create Procedures with their steps
  const cncProcedure = await prisma.procedure.create({
    data: {
      code: 'PROC-CNC-001',
      title: 'CNC Milling Standard Procedure',
      description: 'Standard operating procedure for CNC milling operations',
      status: InstructionStatus.APPROVED,
      operations: {
        connect: { id: operations[0].id }
      },
      steps: {
        create: [
          {
            stepNumber: 1,
            title: 'Setup and Preparation',
            instructions: '1. Review work order and drawings\n2. Select appropriate cutting tools\n3. Install tools in tool holder\n4. Load material into fixture',
            estimatedTime: 10,
            requiredTools: ['Tool holder', 'Cutting tools', 'Fixture', 'Measuring instruments'],
            safetyNotes: 'Ensure machine is in safe mode before setup. Wear safety glasses and gloves.',
            qualityChecks: ['Verify material dimensions', 'Check tool condition', 'Confirm fixture alignment'],
          },
          {
            stepNumber: 2,
            title: 'Machine Programming',
            instructions: '1. Load CNC program\n2. Set work offsets\n3. Set tool offsets\n4. Run simulation if available',
            estimatedTime: 5,
            requiredTools: ['CNC control panel', 'Program storage device'],
            safetyNotes: null,
            qualityChecks: ['Verify program number matches work order', 'Check critical dimensions in program'],
          },
          {
            stepNumber: 3,
            title: 'Machining Operation',
            instructions: '1. Start spindle warm-up cycle\n2. Run first part at reduced speed\n3. Inspect first article\n4. Adjust offsets if needed\n5. Run production',
            estimatedTime: 15,
            requiredTools: ['Coolant', 'Chip removal tools'],
            safetyNotes: 'Keep hands clear of moving parts. Monitor for unusual sounds or vibrations.',
            qualityChecks: ['First article inspection', 'In-process dimensional checks every 10 parts'],
          }
        ]
      }
    },
  });

  const assemblyProcedure = await prisma.procedure.create({
    data: {
      code: 'PROC-ASM-001',
      title: 'Assembly Standard Procedure',
      description: 'Standard operating procedure for assembly operations',
      status: InstructionStatus.APPROVED,
      operations: {
        connect: { id: operations[2].id }
      },
      steps: {
        create: [
          {
            stepNumber: 1,
            title: 'Component Preparation',
            instructions: '1. Gather all required components\n2. Verify component quantities\n3. Inspect components for defects\n4. Arrange components in assembly order',
            estimatedTime: 5,
            requiredTools: ['Component bins', 'Inspection checklist'],
            safetyNotes: null,
            qualityChecks: ['Component count verification', 'Visual defect inspection'],
          },
          {
            stepNumber: 2,
            title: 'Assembly Process',
            instructions: '1. Follow assembly sequence diagram\n2. Use specified torque settings for fasteners\n3. Apply adhesives as specified\n4. Ensure proper component orientation',
            estimatedTime: 10,
            requiredTools: ['Torque wrench', 'Assembly fixtures', 'Adhesive applicator'],
            safetyNotes: 'Use proper ergonomic practices. Ensure adequate ventilation when using adhesives.',
            qualityChecks: ['Torque verification', 'Component alignment check', 'Adhesive coverage inspection'],
          }
        ]
      }
    },
  });

  console.log(`✅ Created procedures with steps`);

  console.log('✅ MES seed data created successfully!');
}

seedMES()
  .catch((e) => {
    console.error('Error seeding MES data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });