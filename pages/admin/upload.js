import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import {
  Typography,
  Card,
  Input,
  Radio,
  Space,
  Spin,
  Empty,
  Upload,
  message,
  Badge,
  Row,
  Col,
  Image,
  Tag,
  Layout,
  notification,
} from 'antd';
import { SearchOutlined, UploadOutlined, PictureOutlined, PlusOutlined } from '@ant-design/icons';
import { supabase } from '../../utils/api';
import { useRouter } from 'next/router';

const { Title, Text } = Typography;
const { Meta } = Card;
const { Content } = Layout;

const CARD_WIDTH = 220; // Slightly smaller to fit 5 cards
const CARD_ASPECT_RATIO = 1.5;
const IMAGE_HEIGHT = CARD_WIDTH / CARD_ASPECT_RATIO;
const GRID_GAP = 16;

const UploadPage = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [uploadingProduct, setUploadingProduct] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([{ label: 'All', value: 'all' }]);

  const router = useRouter();
  const [cardWidth, setCardWidth] = useState(0);
  const [cardHeight, setCardHeight] = useState(0);

  // Fetch products and categories on mount
  useEffect(() => {
    fetchProducts();
    fetchCategories();

    // Debug environment variables on mount
    console.log('Environment variables on mount:', {
      webhookApiUrl: process.env.NEXT_PUBLIC_WEBHOOK_API_URL,
      webhookUsername: process.env.NEXT_PUBLIC_WEBHOOK_USERNAME,
      webhookPassword: process.env.NEXT_PUBLIC_WEBHOOK_PASSWORD ? '***' : 'undefined',
    });
  }, []);

  // Filter products when search term or category changes
  useEffect(() => {
    filterProducts();
  }, [searchTerm, category, products]);

  // Add resize handler
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      let cardW;

      if (width < 576) {
        // xs
        cardW = width * 0.9; // 90% of screen width
      } else if (width < 768) {
        // sm
        cardW = width * 0.45; // ~45% of screen width
      } else if (width < 992) {
        // md
        cardW = width * 0.3; // ~30% of screen width
      } else {
        // lg and above
        cardW = width * 0.22; // ~22% of screen width
      }

      setCardWidth(cardW);
      setCardHeight(cardW / CARD_ASPECT_RATIO);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('kv_product_categories')
        .select('category_name, rank, glt_color_border')
        .neq('glt_color_border', null)
        .order('rank');

      if (error) throw error;

      const categoryOptions = [
        { label: 'All', value: 'all' },
        ...(data || []).map((cat) => ({
          label: cat.category_name,
          value: cat.category_name,
          color: cat.glt_color_border,
        })),
      ];

      setCategories(categoryOptions);
    } catch (error) {
      console.error('Error fetching categories:', error);
      message.error('Failed to load categories');
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);

      // Fetch products with image URLs from view_product
      const { data, error } = await supabase
        .from('view_product')
        .select('*')
        .order('category_rank, cost');

      if (error) throw error;

      // View already contains image URLs, no need for additional queries
      console.log('Products loaded from view_product:', data?.length || 0, 'items');
      if (data && data.length > 0) {
        console.log('Sample product data:', {
          kiotviet_id: data[0].kiotviet_id,
          full_name: data[0].full_name,
          glt_gallery_thumbnail_url: data[0].glt_gallery_thumbnail_url,
          glt_gallery_zoom_url: data[0].glt_gallery_zoom_url,
        });
      }
      setProducts(data || []);
      setFilteredProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      message.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let result = [...products];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(
        (product) =>
          product.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.code && product.code.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply category filter
    if (category !== 'all') {
      result = result.filter((product) => product.category_name === category);
    }

    setFilteredProducts(result);
  };

  const handleUpload = async ({ file, onSuccess, onError }) => {
    if (!uploadingProduct) {
      message.error('No product selected for this upload');
      onError('No product selected');
      return;
    }

    // Check file size (5MB limit - matches backend limit)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      message.error('File size exceeds 5MB limit');
      onError('File too large');
      return;
    }

    try {
      setUploading(true);

      // Create form data to send to webhook
      const formData = new FormData();
      formData.append('image', file);
      formData.append('kiotvietProductId', uploadingProduct.kiotviet_id);

      // Get API URL and auth credentials from env
      const apiUrl = process.env.NEXT_PUBLIC_WEBHOOK_API_URL || 'https://n8n.gaolamthuy.vn';
      const username = process.env.NEXT_PUBLIC_WEBHOOK_USERNAME || 'gaolamthuy';
      const password = process.env.NEXT_PUBLIC_WEBHOOK_PASSWORD || 'gaolamthuy.0627';

      // Debug environment variables
      console.log('Environment variables:', {
        apiUrl,
        username,
        password: password ? '***' : 'undefined',
      });

      // Validate environment variables
      if (!apiUrl || !username || !password) {
        throw new Error('Missing environment variables for webhook configuration');
      }

      // Basic auth credentials
      const auth = btoa(`${username}:${password}`);

      // Send to webhook API
      const response = await fetch(`${apiUrl}/webhook/process-product-image`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
        },
        body: formData,
      });

      const result = await response.json();

      // Debug logging
      console.log('Webhook response:', result);

      if (!response.ok) {
        throw new Error(result.message || 'Failed to upload image');
      }

      // Validate response structure
      if (!result.processedImageUrl || !result.originalImageUrl) {
        console.error('Invalid response structure:', result);
        throw new Error('Invalid response structure from webhook');
      }

      // Get URLs from response - new structure
      const { processedImageUrl: thumbnailUrl, originalImageUrl: zoomUrl } = result;

      message.success(`Uploaded image for ${result.productFullname || uploadingProduct.full_name}`);
      onSuccess(file);

      // Update database with new image URLs
      try {
        const { error: updateError } = await supabase
          .from('kv_products')
          .update({
            glt_gallery_thumbnail_url: thumbnailUrl,
            glt_gallery_zoom_url: zoomUrl,
            glt_image_updated_at: new Date().toISOString(),
          })
          .eq('kiotviet_id', uploadingProduct.kiotviet_id);

        if (updateError) {
          console.error('Error updating database:', updateError);
          message.warning('Image uploaded but database update failed');
        } else {
          console.log('Database updated successfully');
        }
      } catch (dbError) {
        console.error('Database update error:', dbError);
        message.warning('Image uploaded but database update failed');
      }

      // Update local state to show the new image
      setProducts((prev) =>
        prev.map((p) =>
          p.kiotviet_id === uploadingProduct.kiotviet_id
            ? {
                ...p,
                glt_gallery_thumbnail_url: thumbnailUrl,
                glt_gallery_zoom_url: zoomUrl,
                glt_image_updated_at: new Date().toISOString(),
              }
            : p
        )
      );

      // Update filtered products as well
      setFilteredProducts((prev) =>
        prev.map((p) =>
          p.kiotviet_id === uploadingProduct.kiotviet_id
            ? {
                ...p,
                glt_gallery_thumbnail_url: thumbnailUrl,
                glt_gallery_zoom_url: zoomUrl,
                glt_image_updated_at: new Date().toISOString(),
              }
            : p
        )
      );
    } catch (error) {
      console.error('Error uploading image:', error);

      notification.error({
        message: 'Upload Failed',
        description: error.message || 'Failed to upload image',
        duration: 4,
      });

      onError(error);
    } finally {
      setUploading(false);
      setUploadingProduct(null);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  return (
    <Content style={{ padding: '0 16px', maxWidth: '100%', overflowX: 'hidden' }}>
      <div style={{ marginBottom: 16, padding: '8px 0' }}>
        <Title level={3} style={{ margin: '8px 0' }}>
          Upload Product Photos
        </Title>

        <Space direction="vertical" style={{ width: '100%' }}>
          <Input
            placeholder="Search by name..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ marginBottom: 8 }}
          />

          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: 8 }}>
            <Radio.Group
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ whiteSpace: 'nowrap', padding: '4px 0' }}
            >
              {categories.map((cat) => (
                <Radio.Button
                  value={cat.value}
                  key={cat.value}
                  style={{
                    borderColor: cat.color || '#d9d9d9',
                    marginRight: 8,
                  }}
                >
                  {cat.label}
                </Radio.Button>
              ))}
            </Radio.Group>
          </div>
        </Space>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <Empty description="No products found" />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fill, ${CARD_WIDTH}px)`,
            gap: `${GRID_GAP}px`,
            justifyContent: 'center',
            padding: '8px 0',
          }}
        >
          {filteredProducts.map((product) => (
            <Badge
              key={product.kiotviet_id}
              count={
                <Upload
                  customRequest={handleUpload}
                  showUploadList={false}
                  accept="image/*"
                  onClick={() => setUploadingProduct(product)}
                  disabled={uploading && uploadingProduct?.kiotviet_id === product.kiotviet_id}
                >
                  <div
                    style={{
                      borderRadius: '50%',
                      background:
                        uploadingProduct?.kiotviet_id === product.kiotviet_id && uploading
                          ? '#faad14'
                          : '#1890ff',
                      width: 32,
                      height: 32,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    {uploadingProduct?.kiotviet_id === product.kiotviet_id && uploading ? (
                      <Spin size="small" style={{ color: 'white' }} />
                    ) : (
                      <PlusOutlined style={{ color: 'white' }} />
                    )}
                  </div>
                </Upload>
              }
            >
              <Card
                hoverable
                style={{
                  width: CARD_WIDTH,
                  borderColor: product.glt_color_border || '#d9d9d9',
                }}
                cover={
                  <div
                    style={{
                      height: IMAGE_HEIGHT,
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#f5f5f5',
                    }}
                  >
                    {product.glt_gallery_thumbnail_url ? (
                      <Image
                        alt={product.full_name}
                        src={product.glt_gallery_thumbnail_url}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '8px 8px 0 0',
                        }}
                        preview={{
                          src: product.glt_gallery_zoom_url || product.glt_gallery_thumbnail_url,
                        }}
                      />
                    ) : (
                      <PictureOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />
                    )}
                  </div>
                }
              >
                <Meta
                  title={
                    <Typography.Paragraph
                      ellipsis={{ rows: 2, expandable: false }}
                      style={{
                        marginBottom: 0,
                        minHeight: '44px',
                        fontSize: '14px',
                        lineHeight: '1.5715',
                      }}
                    >
                      {product.full_name}
                    </Typography.Paragraph>
                  }
                  description={
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Text strong style={{ fontSize: '16px' }}>
                        {formatPrice(product.whole_p10_price)}
                      </Text>
                      <Tag color={product.glt_color_border}>{product.category_name}</Tag>
                    </Space>
                  }
                />
              </Card>
            </Badge>
          ))}
        </div>
      )}
    </Content>
  );
};

UploadPage.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default UploadPage;
