/**
 * Customer List page component
 * Trang danh sách khách hàng với table và filters
 */
import React from "react";
import { List, TextField, TagField, DateField } from "@refinedev/antd";
import { Button, Table, Space } from "antd";
import { useTable } from "@refinedev/antd";

/**
 * Customer List component
 * Hiển thị danh sách khách hàng với table
 */
export const CustomerList: React.FC = () => {
  const { tableProps } = useTable({
    resource: "kv_customers",
    sorters: {
      initial: [
        {
          field: "created_date",
          order: "desc",
        },
      ],
    },
  });

  return (
    <List
      title="Danh sách khách hàng"
      headerButtons={
        [
          // <Button type="primary" icon={<PlusOutlined />} href="/customers/create">
          //   Thêm khách hàng
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
          title="Mã khách hàng"
          render={(value) => <TextField value={value} />}
        />

        <Table.Column
          dataIndex="name"
          title="Tên khách hàng"
          render={(value) => <TextField value={value} />}
        />

        <Table.Column
          dataIndex="contact_number"
          title="Số điện thoại"
          render={(value) => <TextField value={value} />}
        />

        <Table.Column
          dataIndex="glt_is_active"
          title="Trạng thái"
          render={(value) => (
            <TagField
              value={value ? "Hoạt động" : "Không hoạt động"}
              color={value ? "green" : "red"}
            />
          )}
        />

        <Table.Column
          dataIndex="created_date"
          title="Ngày tạo"
          render={(value) => <DateField value={value} />}
        />

        <Table.Column
          title="Thao tác"
          dataIndex="actions"
          render={(_, record) => (
            <Space>
              {/* <Button
                type="link"
                size="small"
                href={`/customers/show/${record.id}`}
              >
                Xem
              </Button>
              <Button
                type="link"
                size="small"
                href={`/customers/edit/${record.id}`}
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
