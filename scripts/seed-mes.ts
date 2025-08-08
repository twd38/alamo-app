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

  // Create CNC Milling Procedure with steps
  const cncProcedure = await prisma.procedure.upsert({
    where: { code: 'PROC-CNC-001' },
    update: {},
    create: {
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
            instructions: 'Review work order and drawings. Select appropriate cutting tools. Install tools in tool holder. Load material into fixture.',
            estimatedTime: 10,
            requiredTools: ['Tool holder', 'Cutting tools', 'Fixture', 'Measuring instruments'],
            safetyNotes: 'Ensure machine is in safe mode before setup. Wear safety glasses and gloves.',
            qualityChecks: ['Verify material dimensions', 'Check tool condition', 'Confirm fixture alignment'],
          },
          {
            stepNumber: 2,
            title: 'Machine Programming',
            instructions: 'Load CNC program. Set work offsets. Set tool offsets. Run simulation if available.',
            estimatedTime: 5,
            requiredTools: ['CNC control panel', 'Program storage device'],
            safetyNotes: null,
            qualityChecks: ['Verify program number matches work order', 'Check critical dimensions in program'],
          },
          {
            stepNumber: 3,
            title: 'Machining Operation',
            instructions: 'Start spindle warm-up cycle. Run first part at reduced speed. Inspect first article. Adjust offsets if needed. Run production.',
            estimatedTime: 15,
            requiredTools: ['Coolant', 'Chip removal tools'],
            safetyNotes: 'Keep hands clear of moving parts. Monitor for unusual sounds or vibrations.',
            qualityChecks: ['First article inspection', 'In-process dimensional checks every 10 parts'],
          }
        ]
      }
    },
  });

  // Create Assembly Procedure with steps
  const assemblyProcedure = await prisma.procedure.upsert({
    where: { code: 'PROC-ASM-001' },
    update: {},
    create: {
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
            instructions: 'Gather all required components. Verify part numbers and quantities.',
            estimatedTime: 5,
            requiredTools: ['Parts list', 'Component bins'],
            safetyNotes: 'Handle components carefully to avoid damage',
            qualityChecks: ['Verify all components present', 'Check for visible defects']
          },
          {
            stepNumber: 2,
            title: 'Assembly Process',
            instructions: 'Follow assembly drawing. Install components in specified sequence.',
            estimatedTime: 10,
            requiredTools: ['Assembly drawing', 'Hand tools', 'Torque wrench'],
            safetyNotes: 'Use proper ergonomics',
            qualityChecks: ['Verify correct orientation', 'Check fastener torque']
          },
          {
            stepNumber: 3,
            title: 'Final Check',
            instructions: 'Perform functional test. Verify all components properly secured.',
            estimatedTime: 5,
            requiredTools: ['Test fixture', 'Checklist'],
            safetyNotes: 'Follow lockout/tagout procedures for testing',
            qualityChecks: ['Functional test passed', 'Visual inspection complete']
          }
        ]
      }
    },
  });

  const procedures = [cncProcedure, assemblyProcedure];
  console.log(`✅ Created ${procedures.length} procedures with steps`);

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