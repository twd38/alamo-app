'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Printer, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function PrinterTest() {
  const [printerSerialNumber, setPrinterSerialNumber] =
    useState('D2J185007015');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    method?: string;
    error?: string;
  } | null>(null);

  const handleTest = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      const response = await fetch(
        `/api/print-label/test?sn=${encodeURIComponent(printerSerialNumber)}`
      );
      const result = await response.json();

      setTestResult(result);

      if (result.success) {
        toast.success(`Printer test successful via ${result.method}`);
      } else {
        toast.error(result.error || 'Printer test failed');
      }
    } catch (error) {
      console.error('Test API error:', error);
      const errorResult = {
        success: false,
        error: 'Failed to communicate with Zebra Cloud API'
      };
      setTestResult(errorResult);
      toast.error('Failed to test printer connection');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintTestLabel = async () => {
    setIsLoading(true);

    try {
      const testLabelData = {
        workOrderNumber: 'TEST-001',
        partNumber: 'TEST-PART',
        partName: 'Test Part',
        quantity: 1,
        dueDate: new Date().toLocaleDateString(),
        baseUrl: typeof window !== 'undefined' ? window.location.origin : ''
      };

      const response = await fetch('/api/print-label', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          labelData: testLabelData,
          printerSerialNumber: printerSerialNumber
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          `Test label sent to printer ${result.printerSerialNumber} via ${result.method}`
        );
      } else {
        toast.error(result.error || 'Failed to send test label to printer');
      }
    } catch (error) {
      console.error('Print test API error:', error);
      toast.error('Failed to communicate with Zebra Cloud API');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Printer className="h-5 w-5" />
          Zebra Cloud API Test
        </CardTitle>
        <CardDescription>
          Test connectivity to your Zebra printer via the Zebra Cloud API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="printer-sn">Printer Serial Number</Label>
          <Input
            id="printer-sn"
            type="text"
            placeholder="D2J185007015"
            value={printerSerialNumber}
            onChange={(e) => setPrinterSerialNumber(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleTest}
            disabled={isLoading || !printerSerialNumber}
            variant="outline"
            size="sm"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Test Connection
          </Button>

          <Button
            onClick={handlePrintTestLabel}
            disabled={isLoading || !printerSerialNumber}
            size="sm"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Printer className="h-4 w-4 mr-2" />
            )}
            Print Test Label
          </Button>
        </div>

        {testResult && (
          <div className="mt-4 p-3 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="font-medium">
                {testResult.success ? 'Success' : 'Failed'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {testResult.success
                ? `Connected via ${testResult.method}`
                : testResult.error}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
