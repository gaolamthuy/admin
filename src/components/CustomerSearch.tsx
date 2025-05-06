import React, { useState, useEffect, useRef } from "react";
import {
  Input,
  AutoComplete,
  Button,
  Spin,
  Empty,
  Card,
  Row,
  Col,
  Typography,
  Divider,
} from "antd";
import {
  UserOutlined,
  SearchOutlined,
  CloseCircleOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { supabase } from "../services/supabaseClient";
import { debounce } from "lodash";
import { Customer } from "../types";

const { Text, Title } = Typography;

interface CustomerSearchProps {
  onSelectCustomer: (customer: Customer | null) => void;
  selectedCustomer: Customer | null;
}

const CustomerSearch: React.FC<CustomerSearchProps> = ({
  onSelectCustomer,
  selectedCustomer,
}) => {
  const [searchText, setSearchText] = useState("");
  const [options, setOptions] = useState<
    { value: string; label: React.ReactNode; customer: Customer }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [customerInvoices, setCustomerInvoices] = useState<any[]>([]);

  // Create debounced search function
  const debouncedSearch = useRef(
    debounce(async (searchValue: string) => {
      if (searchValue.length < 2) {
        setOptions([]);
        return;
      }

      await searchCustomers(searchValue);
    }, 500)
  ).current;

  // Clean up debounce on component unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  // Load customer history when a customer is selected
  useEffect(() => {
    if (selectedCustomer && selectedCustomer.kiotviet_id) {
      loadCustomerHistory(selectedCustomer.kiotviet_id);
    } else {
      setCustomerInvoices([]);
    }
  }, [selectedCustomer]);

  const loadCustomerHistory = async (kiotvietCustomerId: number) => {
    try {
      const { data, error } = await supabase
        .from("kiotviet_invoices")
        .select("*, kiotviet_invoice_details(*)")
        .eq("kiotviet_customer_id", kiotvietCustomerId)
        .order("purchase_date", { ascending: false })
        .limit(5);

      if (error) throw error;
      setCustomerInvoices(data || []);
    } catch (error) {
      console.error("Error loading customer history:", error);
    }
  };

  const searchCustomers = async (value: string) => {
    setLoading(true);
    try {
      // Create a function to remove Vietnamese accents
      const removeAccents = (str: string) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      };

      // Convert search value to lowercase and remove accents
      const normalizedValue = removeAccents(value.toLowerCase());

      // First, try direct search with original value
      const { data, error } = await supabase
        .from("kv_customers")
        .select("*")
        .or(
          `name.ilike.%${value}%,code.ilike.%${value}%,contact_number.ilike.%${value}%`
        )
        .limit(10);

      if (error) throw error;

      // Format results for AutoComplete
      if (data && data.length > 0) {
        const formattedOptions = data.map((customer) => ({
          value: customer.name,
          label: (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>
                <UserOutlined /> {customer.name}
              </span>
              <span style={{ color: "#999" }}>{customer.contact_number}</span>
            </div>
          ),
          customer: customer,
        }));
        setOptions(formattedOptions);
      } else {
        // If no results, try searching with normalized (no accents) text in a more manual way
        // Note: This is a simplified version - in a real app, you'd want this normalization to happen at the database level
        const { data: allCustomers } = await supabase
          .from("kv_customers")
          .select("*")
          .limit(100); // Get a reasonable batch of customers to filter locally

        if (allCustomers) {
          const filteredCustomers = allCustomers.filter(
            (customer) =>
              removeAccents(customer.name?.toLowerCase() || "").includes(
                normalizedValue
              ) ||
              removeAccents(customer.code?.toLowerCase() || "").includes(
                normalizedValue
              ) ||
              (customer.contact_number || "").includes(normalizedValue)
          );

          const formattedOptions = filteredCustomers.map((customer) => ({
            value: customer.name,
            label: (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>
                  <UserOutlined /> {customer.name}
                </span>
                <span style={{ color: "#999" }}>{customer.contact_number}</span>
              </div>
            ),
            customer: customer,
          }));
          setOptions(formattedOptions);
        } else {
          setOptions([]);
        }
      }
    } catch (error) {
      console.error("Error searching customers:", error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    debouncedSearch(value);
  };

  const handleSelect = (_: string, option: any) => {
    onSelectCustomer(option.customer);
    setSearchText("");
    setOptions([]);
    setShowHistory(true);
  };

  const handleClear = () => {
    onSelectCustomer(null);
    setSearchText("");
    setOptions([]);
    setShowHistory(false);
    setCustomerInvoices([]);
  };

  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };

  if (selectedCustomer) {
    return (
      <div style={{ width: "100%" }}>
        <Card
          size="small"
          title={
            <>
              <UserOutlined /> Khách hàng
            </>
          }
          extra={
            <Button
              type="text"
              icon={<CloseCircleOutlined />}
              onClick={handleClear}
            />
          }
          style={{ marginBottom: "10px" }}
        >
          <Row gutter={[8, 8]}>
            <Col span={24}>
              <Text strong>{selectedCustomer.name}</Text>
            </Col>
            <Col span={12}>
              <Text type="secondary">Mã: {selectedCustomer.code}</Text>
            </Col>
            <Col span={12}>
              <Text type="secondary">
                SĐT: {selectedCustomer.contact_number}
              </Text>
            </Col>
            {selectedCustomer.location_name && (
              <Col span={24}>
                <Text type="secondary">
                  Địa chỉ: {selectedCustomer.location_name}
                </Text>
              </Col>
            )}
          </Row>

          {customerInvoices.length > 0 && (
            <>
              <Divider plain>
                <Button
                  type="link"
                  icon={<HistoryOutlined />}
                  onClick={toggleHistory}
                  size="small"
                >
                  {showHistory ? "Ẩn lịch sử" : "Xem lịch sử"}
                </Button>
              </Divider>

              {showHistory && (
                <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                  {customerInvoices.map((invoice) => (
                    <Card
                      key={invoice.id}
                      size="small"
                      style={{ marginBottom: "8px" }}
                      title={`HD-${invoice.code} (${new Date(
                        invoice.purchase_date
                      ).toLocaleDateString("vi-VN")})`}
                      type="inner"
                    >
                      <div>
                        <Text>
                          Tổng: {invoice.total?.toLocaleString("vi-VN")} VND
                        </Text>
                      </div>
                      <div>
                        <Text type="secondary">
                          Số mặt hàng:{" "}
                          {invoice.kiotviet_invoice_details?.length || 0}
                        </Text>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div style={{ width: "100%" }}>
      <AutoComplete
        options={options}
        onSelect={handleSelect}
        onSearch={handleSearch}
        value={searchText}
        style={{ width: "100%" }}
        notFoundContent={
          loading ? (
            <Spin size="small" />
          ) : searchText.length >= 3 ? (
            <Empty description="Không tìm thấy" />
          ) : (
            "Nhập tối thiểu 3 ký tự"
          )
        }
        placeholder="Tìm khách hàng theo tên, mã, số điện thoại..."
      >
        <Input.Search
          size="large"
          loading={loading}
          prefix={<UserOutlined />}
          enterButton
        />
      </AutoComplete>
    </div>
  );
};

export default CustomerSearch;
