'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  RefreshCw,
  CalendarIcon,
  ExternalLink,
  MoreHorizontal,
  Eye,
  Edit2,
  Clock,
  Trash2,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { signOut } from 'next-auth/react';
import { format } from 'date-fns';
import useSWR from 'swr';
import { getOrders } from '@/lib/queries';
import type { Order } from '@/lib/queries';
import { detectCarrierAndTrackingURL } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

type Email = {
  id: string;
  subject?: string;
  snippet?: string;
};

type ApiErrorResponse = {
  error: string;
  authError?: 'MISSING_REFRESH_TOKEN' | 'REFRESH_FAILED' | 'INVALID_GRANT';
};

/**
 * A component that displays orders and allows refreshing data from emails
 */
export const OrderList = () => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [needsReauth, setNeedsReauth] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  // Use SWR to fetch orders using the server action directly
  const {
    data: orders,
    error,
    isLoading,
    mutate
  } = useSWR('orders', getOrders, {
    onError: (err) => {
      console.error('Error fetching orders:', err);
      toast.error('Failed to fetch orders from database');
    },
    revalidateOnFocus: false
  });

  const handleSignOut = async (): Promise<void> => {
    await signOut({ callbackUrl: '/login' });
  };

  const refreshOrderData = async (): Promise<void> => {
    setIsProcessing(true);
    setNeedsReauth(false);

    try {
      const response = await fetch('/api/gmail', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        const errorData = data as ApiErrorResponse;

        // Handle specific authentication errors
        if (errorData.authError) {
          setNeedsReauth(true);

          switch (errorData.authError) {
            case 'MISSING_REFRESH_TOKEN':
              throw new Error(
                'Gmail access requires additional permissions. Please sign out and sign in again.'
              );
            case 'REFRESH_FAILED':
            case 'INVALID_GRANT':
              throw new Error(
                'Your Google account access has been revoked or expired. Please sign in again.'
              );
            default:
              throw new Error(errorData.error || 'Authentication error');
          }
        }

        // Handle different HTTP error scenarios based on status code
        if (response.status === 401) {
          throw new Error(
            'You need to be logged in with Gmail access to fetch emails'
          );
        } else if (
          response.status === 500 &&
          errorData.error?.includes('auth secret')
        ) {
          throw new Error(
            'Server authentication configuration issue. Please contact the administrator.'
          );
        } else {
          throw new Error(errorData.error || 'Failed to fetch emails');
        }
      }

      // Success case - trigger revalidation of orders data
      toast.success('Processing order emails...');

      // Allow a moment for the backend to process the orders
      setTimeout(() => {
        mutate(); // Trigger revalidation of the orders data
        toast.success('Orders updated successfully');
      }, 1000);
    } catch (error) {
      console.error('Error processing emails:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to process emails'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Returns the appropriate badge variant based on order status
   */
  const getStatusBadgeVariant = (
    status: string
  ):
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline'
    | 'todo'
    | 'in-progress'
    | 'completed'
    | 'paused'
    | 'scrapped' => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'completed';
      case 'shipped':
        return 'in-progress';
      case 'processing':
        return 'todo';
      case 'cancelled':
        return 'scrapped';
      case 'ordered':
        return 'paused';
      default:
        return 'outline';
    }
  };

  /**
   * Format date with time or return placeholder text
   */
  const formatDateWithTime = (date: Date | null | undefined): string => {
    if (!date) return '-';
    return format(new Date(date), 'MMM d, yyyy h:mm a');
  };

  /**
   * Format date or return placeholder text
   */
  const formatDate = (date: Date | null | undefined): string => {
    if (!date) return '-';
    return format(new Date(date), 'MMM d, yyyy');
  };

  /**
   * Format relative time (e.g. "2 hours ago") for updatedAt
   */
  const formatRelativeTime = (
    date: Date | null | undefined
  ): React.ReactNode => {
    if (!date) return <span className="text-muted-foreground text-sm">-</span>;

    const now = new Date();
    const updatedDate = new Date(date);
    const diffInSeconds = Math.floor(
      (now.getTime() - updatedDate.getTime()) / 1000
    );

    // Format as relative time if less than 24 hours ago
    if (diffInSeconds < 86400) {
      let relativeTime = '';

      if (diffInSeconds < 60) {
        relativeTime = 'Just now';
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        relativeTime = `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
      } else {
        const hours = Math.floor(diffInSeconds / 3600);
        relativeTime = `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
      }

      return (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{relativeTime}</span>
          {/* <span className="text-xs text-muted-foreground" title={formatDateWithTime(date)}>
            {format(updatedDate, 'MMM d, yyyy')}
          </span> */}
        </div>
      );
    }

    // Format as date for older updates
    return (
      <div className="flex flex-col">
        <span className="text-sm font-medium">
          {format(updatedDate, 'MMM d, yyyy')}
        </span>
        <span className="text-xs text-muted-foreground">
          {format(updatedDate, 'h:mm a')}
        </span>
      </div>
    );
  };

  /**
   * Format delivery date - shows deliveredAt date or estimated date with prefix
   */
  const formatDeliveryDate = (order: Order): React.ReactNode => {
    if (order.deliveredAt) {
      return (
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {format(new Date(order.deliveredAt), 'MMM d, yyyy')}
          </span>
          <span className="text-xs text-green-600">Delivered</span>
        </div>
      );
    }

    if (order.estimatedArrival) {
      return (
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {format(new Date(order.estimatedArrival), 'MMM d, yyyy')}
          </span>
          <span className="text-xs text-muted-foreground">Estimated</span>
        </div>
      );
    }

    return (
      <span className="text-muted-foreground text-sm">No date available</span>
    );
  };

  /**
   * Handles the delete confirmation for an order
   */
  const handleDeleteOrder = (order: Order): void => {
    setOrderToDelete(order);
    setDeleteDialogOpen(true);
  };

  /**
   * Performs the actual deletion after confirmation
   */
  const confirmDeleteOrder = async (): Promise<void> => {
    if (!orderToDelete) return;

    try {
      // Here you would call an API to delete the order
      // For now we'll just simulate success with a delay
      toast.success(`Deleting order ${orderToDelete.orderNumber}...`);

      // Close the dialog
      setDeleteDialogOpen(false);
      setOrderToDelete(null);

      // Simulate API call with delay
      setTimeout(() => {
        // Filter out the deleted order locally for immediate UI update
        const updatedOrders =
          orders?.filter((o) => o.id !== orderToDelete.id) || [];
        mutate(updatedOrders, false);
        toast.success(
          `Order ${orderToDelete.orderNumber} deleted successfully`
        );
      }, 500);
    } catch (error) {
      toast.error(
        `Failed to delete order: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
    }
  };

  if (error) {
    return (
      <div className="rounded-md border p-6 bg-red-50">
        <h2 className="text-lg font-medium text-red-800 mb-3">
          Error loading orders
        </h2>
        <p className="text-sm text-red-700">
          There was a problem loading your orders. Please try refreshing the
          page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Order Tracking</h2>
        {needsReauth ? (
          <div className="border border-yellow-300 bg-yellow-50 p-4 rounded-md">
            <h3 className="font-medium text-yellow-800">
              Google Account Authentication Required
            </h3>
            <p className="text-sm text-yellow-700 mb-3">
              You need to reconnect your Google account to access Gmail data.
              This usually happens when permissions change or tokens expire.
            </p>
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Sign Out & Reconnect</span>
            </Button>
          </div>
        ) : (
          <Button
            variant="default"
            onClick={refreshOrderData}
            disabled={isProcessing}
            className="flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing Emails...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                <span>Refresh Order Data</span>
              </>
            )}
          </Button>
        )}
      </div>

      <div className="rounded-md border pb-2">
        <Table>
          <TableCaption>Orders imported from Gmail</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Order Number</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Delivery</TableHead>
              <TableHead>Tracking</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="max-w-[20px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                    <span className="text-muted-foreground">
                      Loading orders...
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : orders && orders.length > 0 ? (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    {order.orderNumber}
                  </TableCell>
                  <TableCell>{order.supplier || 'Unknown'}</TableCell>
                  <TableCell>
                    {order.metadata &&
                    typeof order.metadata === 'object' &&
                    'additionalNotes' in order.metadata
                      ? (order.metadata.additionalNotes as string) || ''
                      : ''}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(order.status)}>
                      {order.status.charAt(0).toUpperCase() +
                        order.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                      {formatDeliveryDate(order)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {order.metadata &&
                    typeof order.metadata === 'object' &&
                    'trackingUrl' in order.metadata &&
                    order.metadata.trackingUrl ? (
                      <a
                        href={order.metadata.trackingUrl as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        <span>Track</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : order.metadata &&
                      typeof order.metadata === 'object' &&
                      'trackingNumber' in order.metadata &&
                      order.metadata.trackingNumber ? (
                      (() => {
                        const trackingNumber = order.metadata
                          .trackingNumber as string;
                        const { carrier, trackingURL } =
                          detectCarrierAndTrackingURL(trackingNumber);

                        return trackingURL ? (
                          <a
                            href={trackingURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                            title={`${carrier}: ${trackingNumber}`}
                          >
                            <span>{trackingNumber}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span
                            className="text-muted-foreground text-sm"
                            title="Tracking number"
                          >
                            {trackingNumber}
                          </span>
                        );
                      })()
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                      {formatRelativeTime(order.updatedAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            toast.success(`Viewing order ${order.orderNumber}`)
                          }
                          className="cursor-pointer"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            toast.success(`Editing order ${order.orderNumber}`)
                          }
                          className="cursor-pointer"
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteOrder(order)}
                          className="cursor-pointer text-red-600 hover:text-red-700 focus:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No orders found. Click "Refresh Order Data" to fetch orders
                  from your emails.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete order{' '}
              <strong>{orderToDelete?.orderNumber}</strong>?
              <br />
              <br />
              This action cannot be undone and all order data will be
              permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteOrder}
              className="bg-red-600 hover:bg-red-700 focus:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
