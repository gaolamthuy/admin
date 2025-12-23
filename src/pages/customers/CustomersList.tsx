/**
 * Customers List Page
 * Sử dụng TanStack Query
 *
 * @module pages/customers/CustomersList
 */

import { useNavigate } from 'react-router-dom';
import { useCustomers } from '@/hooks/useCustomers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Eye } from 'lucide-react';
import { formatDate } from '@/utils/date';
import { Button } from '@/components/ui/button';

/**
 * Customers List Page Component
 */
export const CustomersList = () => {
  const navigate = useNavigate();
  const { data: customers = [], isLoading } = useCustomers();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Danh sách khách hàng</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Chưa có khách hàng nào</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã KH</TableHead>
                  <TableHead>Tên khách hàng</TableHead>
                  <TableHead>Số điện thoại</TableHead>
                  <TableHead>Địa chỉ</TableHead>
                  <TableHead>Công nợ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map(customer => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">
                      {customer.code || `#${customer.id}`}
                    </TableCell>
                    <TableCell>{customer.name || '-'}</TableCell>
                    <TableCell>{customer.contact_number || '-'}</TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="truncate">
                          {customer.address || '-'}
                          {customer.ward_name && `, ${customer.ward_name}`}
                          {customer.location_name &&
                            `, ${customer.location_name}`}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {customer.debt
                        ? new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                          }).format(Number(customer.debt))
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          customer.glt_is_active === false
                            ? 'destructive'
                            : 'default'
                        }
                      >
                        {customer.glt_is_active === false
                          ? 'Không hoạt động'
                          : 'Hoạt động'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {customer.created_date
                        ? formatDate(customer.created_date)
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          navigate(`/customers/show/${customer.id}`)
                        }
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Xem
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomersList;
