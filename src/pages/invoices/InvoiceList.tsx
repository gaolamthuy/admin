/**
 * Invoice List page component
 * Trang danh sách hóa đơn với table và filters
 */
import React from "react";
import {
  List,
  TextField,
  NumberField,
  DateField,
  TagField,
} from "@refinedev/antd";
import { Space, Table } from "antd";
import { useTable } from "@refinedev/antd";

/**
 * Invoice List component
 * Hiển thị danh sách hóa đơn với table
 */
export const InvoiceList: React.FC = () => {
  const { tableProps } = useTable({
    resource: "kv_invoices",
    sorters: {
      initial: [
        {
          field: "created_at",
          order: "desc",
        },
      ],
    },
  });

  return (
    <List
      title="Danh sách hóa đơn"
      headerButtons={
        [
          // <Button type="primary" icon={<PlusOutlined />} href="/invoices/create">
          //   Tạo hóa đơn
          // </Button>,
        ]
      }
    >
      <Table {...tableProps} rowKey="id">
        <Table.Column
          dataIndex="kiotviet_id"
          title="ID KiotViet"
          render={(value) => <TextField value={value} />}
        />

        <Table.Column
          dataIndex="code"
          title="Mã hóa đơn"
          render={(value) => <TextField value={value} />}
        />

        <Table.Column
          dataIndex="customer_name"
          title="Khách hàng"
          render={(value) => <TextField value={value} />}
        />

        <Table.Column
          dataIndex="total"
          title="Tổng tiền"
          render={(value) => (
            <NumberField
              value={value}
              options={{
                style: "currency",
                currency: "VND",
              }}
            />
          )}
        />

        <Table.Column
          dataIndex="status"
          title="Trạng thái"
          render={(value) => {
            const statusMap = {
              0: { text: "Chờ xử lý", color: "orange" },
              1: { text: "Đã xác nhận", color: "blue" },
              2: { text: "Đang giao", color: "purple" },
              3: { text: "Hoàn thành", color: "green" },
              4: { text: "Đã hủy", color: "red" },
            };
            const status = statusMap[value as keyof typeof statusMap] || {
              text: "Không xác định",
              color: "default",
            };
            return <TagField value={status.text} color={status.color} />;
          }}
        />

        <Table.Column
          dataIndex="created_at"
          title="Ngày tạo"
          render={(value) => <DateField value={value} />}
        />

        <Table.Column
          title="Thao tác"
          dataIndex="actions"
          render={(_, _record) => (
            <Space>
              {/* <Button
                type="link"
                size="small"
                href={`/invoices/show/${record.id}`}
              >
                Xem
              </Button>
              <Button
                type="link"
                size="small"
                href={`/invoices/edit/${record.id}`}
              >
                Sửa
              </Button> */}
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
