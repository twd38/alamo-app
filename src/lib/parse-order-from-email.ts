/**
 * Basic regex-based order parsing from email content.
 * This is a fallback method in case the OpenAI API is unavailable or fails.
 * Provides limited extraction capabilities compared to the AI-based solution.
 */
export function parseOrderFromEmail(subject: string, snippet: string) {
  const orderNumberMatch = snippet.match(/Order Number[:\s]+([A-Z0-9\-]+)/i) || 
                          snippet.match(/#\s*([A-Z0-9\-]+)/i) ||
                          snippet.match(/Order[:\s]+([A-Z0-9\-]+)/i);
  
  const supplierMatch = subject.match(/from\s+(\w+)/i) || 
                        subject.match(/(\w+)\s+order/i);
  
  // Try to extract estimated delivery date
  const deliveryDateMatch = snippet.match(/deliver(?:y|ed)(?:\s+by|\s+on|\s+date)?[:\s]+([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?)/i) ||
                           snippet.match(/(?:estimated|expected)(?:\s+delivery|\s+arrival)[:\s]+([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?)/i);

  // Determine order status from subject or content
  let status = "ordered";
  if (subject.toLowerCase().includes("shipped") || snippet.toLowerCase().includes("shipped")) {
    status = "shipped";
  } else if (subject.toLowerCase().includes("delivered") || snippet.toLowerCase().includes("delivered")) {
    status = "delivered";
  } else if (subject.toLowerCase().includes("processing") || snippet.toLowerCase().includes("processing")) {
    status = "processing";
  } else if (subject.toLowerCase().includes("cancelled") || snippet.toLowerCase().includes("cancelled") ||
            subject.toLowerCase().includes("canceled") || snippet.toLowerCase().includes("canceled")) {
    status = "cancelled";
  }
  
  return {
    orderNumber: orderNumberMatch?.[1] ?? null,
    supplier: supplierMatch?.[1] ?? "Unknown Supplier",
    status: status,
    estimatedArrival: deliveryDateMatch?.[1] ?? null,
  };
}
  