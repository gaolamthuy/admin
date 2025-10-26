/**
 * useProductActions Hook
 * Quản lý các actions cho product list (edit, show, delete)
 */

import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { ProductActions } from '../types/product-list';

/**
 * Hook quản lý các actions cho product
 * @returns Object chứa action handlers
 */
export const useProductActions = (): ProductActions => {
  const navigate = useNavigate();

  /**
   * Handle edit action - navigate to edit page
   * @param id - Product ID
   */
  const handleEdit = useCallback(
    (id: string | number) => {
      navigate(`/products/edit/${id}`);
    },
    [navigate]
  );

  /**
   * Handle show action - navigate to show page
   * @param id - Product ID
   */
  const handleShow = useCallback(
    (id: string | number) => {
      navigate(`/products/show/${id}`);
    },
    [navigate]
  );

  /**
   * Handle delete action - placeholder for delete logic
   * @param id - Product ID
   */
  const handleDelete = useCallback((id: string | number) => {
    // TODO: Implement delete logic
    console.log('Delete product:', id);
    // Delete logic sẽ được handle bởi DeleteButton component
  }, []);

  return {
    onEdit: handleEdit,
    onShow: handleShow,
    onDelete: handleDelete,
  };
};
