import { z } from 'zod';
import { Prisma } from '@prisma/client';

type RoutingWithSteps = Prisma.RoutingGetPayload<{
  include: {
    steps: {
      include: {
        operation: true;
        workCenter: true;
      };
    };
  };
}>;

type RoutingStep = RoutingWithSteps['steps'][0];

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field?: string;
  message: string;
  stepNumber?: number;
}

export interface ValidationWarning {
  field?: string;
  message: string;
  stepNumber?: number;
}

// Routing validation rules
export function validateRouting(routing: RoutingWithSteps): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Basic routing validation
  if (!routing.routingNumber || routing.routingNumber.trim() === '') {
    errors.push({ field: 'routingNumber', message: 'Routing number is required' });
  }

  if (routing.version < 1) {
    errors.push({ field: 'version', message: 'Version must be at least 1' });
  }

  if (!routing.partId) {
    errors.push({ field: 'partId', message: 'Part is required' });
  }

  // Validate effective date
  if (!routing.effectiveDate) {
    errors.push({ field: 'effectiveDate', message: 'Effective date is required' });
  }

  // Validate expiry date
  if (routing.expiryDate && routing.effectiveDate && routing.expiryDate <= routing.effectiveDate) {
    errors.push({ field: 'expiryDate', message: 'Expiry date must be after effective date' });
  }

  // Validate steps
  if (!routing.steps || routing.steps.length === 0) {
    errors.push({ message: 'Routing must have at least one step' });
  } else {
    // Validate individual steps
    routing.steps.forEach((step, index) => {
      validateRoutingStep(step, errors, warnings);
    });

    // Check for duplicate step numbers
    const stepNumbers = routing.steps.map(s => s.stepNumber);
    const duplicates = stepNumbers.filter((item, index) => stepNumbers.indexOf(item) !== index);
    if (duplicates.length > 0) {
      errors.push({ 
        message: `Duplicate step numbers found: ${Array.from(new Set(duplicates)).join(', ')}`
      });
    }

    // Check for step number gaps
    const sortedSteps = [...routing.steps].sort((a, b) => a.stepNumber - b.stepNumber);
    for (let i = 0; i < sortedSteps.length - 1; i++) {
      if (sortedSteps[i + 1].stepNumber - sortedSteps[i].stepNumber > 1) {
        warnings.push({
          message: `Gap in step numbers between step ${sortedSteps[i].stepNumber} and ${sortedSteps[i + 1].stepNumber}`
        });
      }
    }

    // Validate total time
    const totalTime = calculateTotalTime(routing.steps);
    if (totalTime > 480) { // 8 hours
      warnings.push({
        message: `Total routing time (${totalTime} minutes) exceeds 8 hours. Consider breaking into multiple shifts.`
      });
    }

    // Check for inactive work centers or operations
    routing.steps.forEach(step => {
      if (!step.workCenter.isActive) {
        errors.push({
          stepNumber: step.stepNumber,
          message: `Step ${step.stepNumber} uses inactive work center: ${step.workCenter.name}`
        });
      }
      if (!step.operation.isActive) {
        errors.push({
          stepNumber: step.stepNumber,
          message: `Step ${step.stepNumber} uses inactive operation: ${step.operation.name}`
        });
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Step validation
function validateRoutingStep(
  step: RoutingStep, 
  errors: ValidationError[], 
  warnings: ValidationWarning[]
): void {
  // Step number validation
  if (step.stepNumber < 1) {
    errors.push({
      stepNumber: step.stepNumber,
      field: 'stepNumber',
      message: `Step ${step.stepNumber}: Step number must be at least 1`
    });
  }

  // Time validations
  if (step.setupTime < 0) {
    errors.push({
      stepNumber: step.stepNumber,
      field: 'setupTime',
      message: `Step ${step.stepNumber}: Setup time cannot be negative`
    });
  }

  if (step.runTime < 0) {
    errors.push({
      stepNumber: step.stepNumber,
      field: 'runTime',
      message: `Step ${step.stepNumber}: Run time cannot be negative`
    });
  }

  if (step.runTime === 0) {
    warnings.push({
      stepNumber: step.stepNumber,
      field: 'runTime',
      message: `Step ${step.stepNumber}: Run time is zero`
    });
  }

  if (step.queueTime < 0) {
    errors.push({
      stepNumber: step.stepNumber,
      field: 'queueTime',
      message: `Step ${step.stepNumber}: Queue time cannot be negative`
    });
  }

  if (step.moveTime < 0) {
    errors.push({
      stepNumber: step.stepNumber,
      field: 'moveTime',
      message: `Step ${step.stepNumber}: Move time cannot be negative`
    });
  }

  // Excessive time warnings
  const stepTotalTime = step.setupTime + step.runTime + step.queueTime + step.moveTime;
  if (stepTotalTime > 240) { // 4 hours
    warnings.push({
      stepNumber: step.stepNumber,
      message: `Step ${step.stepNumber}: Total time (${stepTotalTime} minutes) exceeds 4 hours`
    });
  }

  if (step.queueTime > 120) { // 2 hours
    warnings.push({
      stepNumber: step.stepNumber,
      message: `Step ${step.stepNumber}: Queue time (${step.queueTime} minutes) is excessive`
    });
  }

  // Work center capacity check
  if (step.workCenter.capacity && step.runTime > step.workCenter.capacity * 60) {
    warnings.push({
      stepNumber: step.stepNumber,
      message: `Step ${step.stepNumber}: Run time exceeds work center daily capacity`
    });
  }
}

// Calculate total time for all steps
export function calculateTotalTime(steps: RoutingStep[]): number {
  return steps.reduce((total, step) => {
    return total + step.setupTime + step.runTime + step.queueTime + step.moveTime;
  }, 0);
}

// Calculate total cost for routing
export function calculateTotalCost(steps: RoutingStep[]): number {
  return steps.reduce((total, step) => {
    const stepTime = step.setupTime + step.runTime + step.queueTime + step.moveTime;
    const hourlyRate = step.workCenter.costPerHour || 0;
    return total + (stepTime / 60) * hourlyRate;
  }, 0);
}

// Validate routing before save
export async function validateRoutingBeforeSave(
  routingData: any,
  prisma: any
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check for duplicate routing number/version combination
  if (routingData.partId && routingData.routingNumber && routingData.version) {
    const existing = await prisma.routing.findFirst({
      where: {
        partId: routingData.partId,
        routingNumber: routingData.routingNumber,
        version: routingData.version,
        id: { not: routingData.id } // Exclude current routing if updating
      }
    });

    if (existing) {
      errors.push({
        message: 'A routing with this number and version already exists for this part'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}