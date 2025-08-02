import { PrismaClient, WorkCenterType } from '@prisma/client';

const prisma = new PrismaClient();

async function seedMES() {
  console.log('🌱 Seeding MES data...');

  // Create Work Centers
  const workCenters = await Promise.all([
    prisma.workCenter.create({
      data: {
        code: 'WC-MACH-01',
        name: 'CNC Machine Center 1',
        description: 'High-precision CNC machining center for complex parts',
        type: WorkCenterType.MACHINING,
        capacity: 2.5,
        efficiency: 0.85,
        setupTime: 45,
        costPerHour: 125.00,
        isActive: true,
      },
    }),
    prisma.workCenter.create({
      data: {
        code: 'WC-ASSY-01',
        name: 'Assembly Station 1',
        description: 'Main assembly station for product assembly',
        type: WorkCenterType.ASSEMBLY,
        capacity: 4.0,
        efficiency: 0.90,
        setupTime: 15,
        costPerHour: 75.00,
        isActive: true,
      },
    }),
    prisma.workCenter.create({
      data: {
        code: 'WC-INSP-01',
        name: 'Quality Inspection',
        description: 'Quality control and inspection station',
        type: WorkCenterType.INSPECTION,
        capacity: 6.0,
        efficiency: 0.95,
        setupTime: 10,
        costPerHour: 60.00,
        isActive: true,
      },
    }),
    prisma.workCenter.create({
      data: {
        code: 'WC-PACK-01',
        name: 'Packaging Line 1',
        description: 'Automated packaging line',
        type: WorkCenterType.PACKAGING,
        capacity: 10.0,
        efficiency: 0.92,
        setupTime: 20,
        costPerHour: 50.00,
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${workCenters.length} work centers`);

  // Create Operations for each work center
  const operations = await Promise.all([
    // Machining Operations
    prisma.operation.create({
      data: {
        code: 'OP-MILL-001',
        name: 'CNC Milling',
        description: 'Precision milling operation for metal parts',
        workCenterId: workCenters[0].id,
        defaultDuration: 30,
        setupTime: 20,
        requiresSkill: 'CNC Operator Level 2',
        isActive: true,
      },
    }),
    prisma.operation.create({
      data: {
        code: 'OP-TURN-001',
        name: 'CNC Turning',
        description: 'Lathe turning operation for cylindrical parts',
        workCenterId: workCenters[0].id,
        defaultDuration: 25,
        setupTime: 15,
        requiresSkill: 'CNC Operator Level 2',
        isActive: true,
      },
    }),
    // Assembly Operations
    prisma.operation.create({
      data: {
        code: 'OP-ASSY-001',
        name: 'Manual Assembly',
        description: 'Manual assembly of components',
        workCenterId: workCenters[1].id,
        defaultDuration: 15,
        setupTime: 5,
        requiresSkill: 'Assembly Technician',
        isActive: true,
      },
    }),
    prisma.operation.create({
      data: {
        code: 'OP-SOLD-001',
        name: 'Soldering',
        description: 'Electronic component soldering',
        workCenterId: workCenters[1].id,
        defaultDuration: 20,
        setupTime: 10,
        requiresSkill: 'Soldering Certified',
        isActive: true,
      },
    }),
    // Inspection Operations
    prisma.operation.create({
      data: {
        code: 'OP-INSP-001',
        name: 'Visual Inspection',
        description: 'Visual quality inspection',
        workCenterId: workCenters[2].id,
        defaultDuration: 10,
        setupTime: 5,
        requiresSkill: 'Quality Inspector',
        isActive: true,
      },
    }),
    prisma.operation.create({
      data: {
        code: 'OP-TEST-001',
        name: 'Functional Testing',
        description: 'Functional testing of assembled products',
        workCenterId: workCenters[2].id,
        defaultDuration: 15,
        setupTime: 10,
        requiresSkill: 'Test Technician',
        isActive: true,
      },
    }),
    // Packaging Operations
    prisma.operation.create({
      data: {
        code: 'OP-PACK-001',
        name: 'Standard Packaging',
        description: 'Standard product packaging',
        workCenterId: workCenters[3].id,
        defaultDuration: 5,
        setupTime: 10,
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${operations.length} operations`);

  // Create Procedures for some operations
  const procedures = await Promise.all([
    // Procedures for CNC Milling
    prisma.procedure.create({
      data: {
        operationId: operations[0].id,
        stepNumber: 1,
        title: 'Setup and Preparation',
        instructions: '1. Review work order and drawings\n2. Select appropriate cutting tools\n3. Install tools in tool holder\n4. Load material into fixture',
        estimatedTime: 10,
        requiredTools: ['Tool holder', 'Cutting tools', 'Fixture', 'Measuring instruments'],
        safetyNotes: 'Ensure machine is in safe mode before setup. Wear safety glasses and gloves.',
        qualityChecks: ['Verify material dimensions', 'Check tool condition', 'Confirm fixture alignment'],
        imageUrls: [],
      },
    }),
    prisma.procedure.create({
      data: {
        operationId: operations[0].id,
        stepNumber: 2,
        title: 'Machine Programming',
        instructions: '1. Load CNC program\n2. Set work offsets\n3. Set tool offsets\n4. Run simulation if available',
        estimatedTime: 5,
        requiredTools: ['CNC control panel', 'Program storage device'],
        qualityChecks: ['Verify program number matches work order', 'Check critical dimensions in program'],
        imageUrls: [],
      },
    }),
    prisma.procedure.create({
      data: {
        operationId: operations[0].id,
        stepNumber: 3,
        title: 'Machining Operation',
        instructions: '1. Start spindle warm-up cycle\n2. Run first part at reduced speed\n3. Inspect first article\n4. Adjust offsets if needed\n5. Run production',
        estimatedTime: 15,
        requiredTools: ['Coolant', 'Chip removal tools'],
        safetyNotes: 'Keep hands clear of moving parts. Monitor for unusual sounds or vibrations.',
        qualityChecks: ['First article inspection', 'In-process dimensional checks every 10 parts'],
        imageUrls: [],
      },
    }),
    // Procedures for Assembly
    prisma.procedure.create({
      data: {
        operationId: operations[2].id,
        stepNumber: 1,
        title: 'Component Preparation',
        instructions: '1. Gather all required components\n2. Verify component quantities\n3. Inspect components for defects\n4. Arrange components in assembly order',
        estimatedTime: 5,
        requiredTools: ['Component bins', 'Inspection checklist'],
        qualityChecks: ['Component count verification', 'Visual defect inspection'],
        imageUrls: [],
      },
    }),
    prisma.procedure.create({
      data: {
        operationId: operations[2].id,
        stepNumber: 2,
        title: 'Assembly Process',
        instructions: '1. Follow assembly sequence diagram\n2. Use specified torque settings for fasteners\n3. Apply adhesives as specified\n4. Ensure proper component orientation',
        estimatedTime: 10,
        requiredTools: ['Torque wrench', 'Assembly fixtures', 'Adhesive applicator'],
        safetyNotes: 'Use proper ergonomic practices. Ensure adequate ventilation when using adhesives.',
        qualityChecks: ['Torque verification', 'Component alignment check', 'Adhesive coverage inspection'],
        imageUrls: [],
      },
    }),
  ]);

  console.log(`✅ Created ${procedures.length} procedures`);

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