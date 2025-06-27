import PageContainer from '@/components/page-container';
import { ComingSoon } from '@/components/coming-soon';

const InventoryPage = () => {
  return (
    <PageContainer>
      <ComingSoon
        title="Inventory Management"
        description="Part inventory tracking, stock levels, and location management features are being developed. This will include real-time stock monitoring, transaction history, and automated reorder points."
        variant="default"
        size="sm"
      />
    </PageContainer>
  );
};

export default InventoryPage;
