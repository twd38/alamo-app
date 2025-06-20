import { OrderList } from './order-list';
import BasicTopBar from '@/components/layouts/basic-top-bar';
import { Toaster } from 'react-hot-toast';

/**
 * Orders page component for displaying and managing orders
 */
const OrdersPage = () => {
  return (
    <div>
      <BasicTopBar />
      <div className="space-y-8 p-6">
        <OrderList />
      </div>
    </div>
  );
};

export default OrdersPage;
