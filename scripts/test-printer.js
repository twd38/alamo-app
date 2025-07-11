#!/usr/bin/env node

/**
 * Test script for Zebra Cloud API printer functionality
 * Usage: node test-printer.js [serial-number]
 *
 * This script tests both connectivity and actual label printing
 * via the Zebra Cloud API integration.
 */

const baseURL = 'http://localhost:3000';
const defaultSerialNumber = 'D2J185007015';

// Get printer serial number from command line or use default
const printerSerialNumber = process.argv[2] || defaultSerialNumber;

console.log('🖨️  Zebra Cloud API Printer Test');
console.log('=====================================');
console.log(`📍 Base URL: ${baseURL}`);
console.log(`🏷️  Printer Serial Number: ${printerSerialNumber}`);
console.log();

const testLabelData = {
  workOrderNumber: 'TEST-WO-001',
  partNumber: 'TEST-PART-123',
  partName: 'Test Component',
  quantity: 1,
  dueDate: new Date().toLocaleDateString(),
  baseUrl: baseURL
};

async function testPrinterConnection() {
  console.log('⏳ Starting Zebra Cloud API tests...');
  console.log();

  try {
    // Test 1: Connectivity Test
    console.log('🔍 Test 1: Printer Connectivity via Cloud API');
    const testResponse = await fetch(
      `${baseURL}/api/print-label/test?sn=${encodeURIComponent(printerSerialNumber)}`
    );

    if (!testResponse.ok) {
      throw new Error(
        `HTTP ${testResponse.status}: ${testResponse.statusText}`
      );
    }

    const testResult = await testResponse.json();
    console.log(
      `✅ Connection test: ${testResult.success ? 'PASSED' : 'FAILED'}`
    );

    if (testResult.success) {
      console.log(`📡 Method: ${testResult.method}`);
      console.log(`💬 Message: ${testResult.message}`);
    } else {
      console.log(`❌ Error: ${testResult.error}`);
    }

    console.log();

    // Test 2: Label Printing Test
    console.log('🖨️  Test 2: Label Printing via Cloud API');
    const printResponse = await fetch(`${baseURL}/api/print-label`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        labelData: testLabelData,
        printerSerialNumber: printerSerialNumber
      })
    });

    if (!printResponse.ok) {
      throw new Error(
        `HTTP ${printResponse.status}: ${printResponse.statusText}`
      );
    }

    const printResult = await printResponse.json();
    console.log(`✅ Print test: ${printResult.success ? 'PASSED' : 'FAILED'}`);

    if (printResult.success) {
      console.log(`📡 Method: ${printResult.method}`);
      console.log(`🖨️  Printer: ${printResult.printerSerialNumber}`);
      console.log(`💬 Message: ${printResult.message}`);
    } else {
      console.log(`❌ Error: ${printResult.error}`);
      if (printResult.details) {
        console.log(`📋 Details: ${printResult.details}`);
      }
    }

    console.log();
    console.log('✅ All tests completed!');
    console.log();
    console.log('📋 Test Summary:');
    console.log(
      `   - Connectivity: ${testResult.success ? '✅ PASS' : '❌ FAIL'}`
    );
    console.log(
      `   - Label Print: ${printResult.success ? '✅ PASS' : '❌ FAIL'}`
    );
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.log();
    console.log('🔧 Troubleshooting:');
    console.log(
      '   1. Make sure your Next.js server is running on http://localhost:3000'
    );
    console.log(
      '   2. Verify ZEBRA_API_KEY and ZEBRA_TENANT are set in your .env file'
    );
    console.log(
      '   3. Ensure the printer serial number is correct and registered with Zebra Cloud'
    );
    console.log('   4. Check your internet connection for Cloud API access');
    process.exit(1);
  }
}

testPrinterConnection();
