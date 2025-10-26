/**
 * ProductDataTable Component
 * DataTable component cho product list view
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductDataTableProps } from '../types/product-list';

/**
 * Component hiển thị product list dưới dạng table
 * @param props - ProductDataTableProps
 * @returns JSX Element
 */
export const ProductDataTable: React.FC<ProductDataTableProps> = ({
  products,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Danh sách sản phẩm</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-muted-foreground">
            Hiển thị {products.length} sản phẩm
          </p>
        </div>
        {/* DataTable sẽ được render bởi parent component */}
      </CardContent>
    </Card>
  );
};
