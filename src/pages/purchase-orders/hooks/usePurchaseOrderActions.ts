/**
 * usePurchaseOrderActions Hook
 * Quản lý các actions cho purchase order list (edit, show, delete)
 */

import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { PurchaseOrderActions } from '../types/purchase-order-list';

/**
 * Hook quản lý các actions cho purchase order
 * @returns Object chứa action handlers
 */
export const usePurchaseOrderActions = (): PurchaseOrderActions => {
  const navigate = useNavigate();

  /**
   * Handle edit action - navigate to edit page
   * @param id - Purchase Order ID
   */
  const handleEdit = useCallback(
    (id: string | number) => {
      navigate(`/purchase-orders/edit/${id}`);
    },
    [navigate]
  );

  /**
   * Handle show action - navigate to show page
   * @param id - Purchase Order ID
   */
  const handleShow = useCallback(
    (id: string | number) => {
      navigate(`/purchase-orders/show/${id}`);
    },
    [navigate]
  );

  /**
   * Handle delete action - placeholder for delete logic
   * @param id - Purchase Order ID
   */
  const handleDelete = useCallback((id: string | number) => {
    // TODO: Implement delete logic
    console.log('Delete purchase order:', id);
    // Delete logic sẽ được handle bởi DeleteButton component
  }, []);

  return {
    onEdit: handleEdit,
    onShow: handleShow,
    onDelete: handleDelete,
  };
};
