import React, { useEffect, useState } from 'react';
import { Row, Col, Typography, Select, Pagination, Slider } from 'antd';
import axios from 'axios';
import { useLocation, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

import CardComponent from '../../components/CardComponent/CardComponent';
import ContainerComponent from '../../components/ContainerComponent/ContainerComponent';
import ButtonComponent from '../../components/ButtonComponent/ButtonComponent';
import BreadcrumbComponent from "../../components/BreadcrumbComponent/BreadcrumbComponent";
import LoadingComponent from '../../components/LoadingComponent/Loading'
import * as ProductService from '../../services/ProductService'
import { useDebounce } from '../../hooks/useDebounce';

const { Option } = Select;
const { Title } = Typography;

const TypeProduct = () => {
  const searchProduct = useSelector((state) => state?.product?.search)
  const searchDebounce = useDebounce(searchProduct, 500)
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false)
  const [colorsAvailable, setColorsAvailable] = useState('');
  const [colorOptions, setColorOptions] = useState([]);
  const [minPrice, setMinPrice] = useState(null);
  const [maxPrice, setMaxPrice] = useState(null);
  const [sortBy, setSortBy] = useState(null);

  const user = useSelector((state) => state.user)
  const { type } = useParams(); 
  const location = useLocation();
  const { state } = useLocation();
  const {  parentLabel, key, keyPath } = state || {};
  const filterBy = location.state?.filterBy || 'type';
  const label = location.state?.label || type; // Fallback nếu không có state

  const [panigate, setPanigate] = useState({
    page: 0,
    limit: 10,
    total: 1,
  })

  // Lấy danh sách màu sắc từ server
  useEffect(() => {
    const fetchColors = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/product/colors`);
        const colorsArray = res.data?.data?.data || [];
        setColorOptions(colorsArray);
      } catch (err) {
        console.error('Lỗi API:', err);
        setColorOptions([]);
      }
    };
    fetchColors();
  }, []);

  // Lấy danh sách sản phẩm theo loại (type)
  const fetchProductType = async (filterBy, label, page, limit) => {
    setLoading(true);
    try {
      const res = await ProductService.getProductType(filterBy, label, page, limit);
      if (res?.status === 'OK') {
        setProducts(res?.data);
        setPanigate({ ...panigate, total: res?.totalPage });
      }
    } finally {
      setLoading(false);
    }
  };

  // Gọi hàm lấy sản phẩm khi thay đổi URL params hoặc phân trang
  useEffect(() => {
    if (type) { // Sử dụng type từ URL params thay vì chỉ phụ thuộc vào state
      fetchProductType(filterBy, label, panigate.page, panigate.limit);
    }
  }, [type, filterBy, label, panigate.page, panigate.limit]);

  // Hàm xử lý khi bấm nút "Lọc"
  const handleFilter = async () => {
    try {
      setLoading(true);
      const filtered = await ProductService.filterProducts({
        colors: colorsAvailable,
        minPrice,
        maxPrice,
        sortBy,
        [filterBy]: label
      });
      setProducts(filtered);
      setLoading(false)
    } catch (err) {
      console.error("Lỗi khi lọc ở typeproduct:", err);
    }
  };

  // Hàm xử lý thay đổi trang
  const onChange = (current, pageSize) => {
    setPanigate({ ...panigate, page: current - 1, limit: [pageSize] })
  }

  // Cấu trúc breadcrumb
  const breadcrumbs = [
    { name: 'Trang chủ', link: '/' },
    ...(parentLabel
      ? [{ name: parentLabel, link: keyPath && keyPath.length > 0 ? `/product/${keyPath[0]}` : '' }]
      : []),
    ...(label ? [{ name: label, isCurrent: true }] : []),
  ];
  
  return (
    <ContainerComponent>
      <div style={{ padding: "16px 0" }}>
      <BreadcrumbComponent breadcrumbs={breadcrumbs} />
        <Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>{label}</Title>

        {/* Bộ lọc sản phẩm */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }} justify="start">
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Chọn màu sắc"
              style={{ width: '100%' }}
              value={colorsAvailable}
              onChange={(value) => setColorsAvailable(value)}
              allowClear
            >
              {colorOptions.map((color) => (
                <Option key={color} value={color}>
                  {color}
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div style={{ padding: '0 8px' }}>
              <span>Khoảng giá:</span>
              <Slider
                range
                min={0}
                max={100000000}
                step={100000}
                defaultValue={[0, 50000000]}
                onChange={(value) => {
                  setMinPrice(value[0]);
                  setMaxPrice(value[1]);
                }}
                tooltip={{ formatter: (val) => `${val.toLocaleString()} đ` }}
              />
            </div>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Sắp xếp"
              style={{ width: '100%' }}
              onChange={(value) => setSortBy(value)}
              allowClear
            >
              <Option value="price_asc">Giá thấp đến cao</Option>
              <Option value="price_desc">Giá cao đến thấp</Option>
              <Option value="name_asc">Tên A-Z</Option>
              <Option value="name_desc">Tên Z-A</Option>
            </Select>
          </Col>

          <Col xs={24} sm={6} md={4}>
            <ButtonComponent
              size="middle"
              styleButton={{
                backgroundColor: 'brown',
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                marginBottom: '10px',
                width: '100%'
              }}
              styleTextButton={{
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold',
              }}
              textButton={loading ? 'Đang lọc...' : 'Lọc'}
              disabled={loading}
              onClick={handleFilter}
            />
          </Col>
        </Row>

        {/* Lưới sản phẩm */}
        <LoadingComponent isLoading={loading}>
          <Row gutter={[16, 24]} style={{ padding: 0 }}>
            {products.length > 0 ? (
              products?.filter((pro) => {
                if (searchDebounce === '') {
                  return pro
                } else if (pro?.name?.toLowerCase()?.includes(searchDebounce?.toLowerCase())) {
                  return pro
                }
              })?.map((product) => (
                <Col key={product._id} xs={12} sm={12} md={8} lg={6} xl={6}>
                  <CardComponent
                    name={product.name}
                    price={product.price}
                    image={product.image}
                    description={product.description}
                    id={product._id}
                    discount={product.discount}
                    size={product.size}
                    colors={product.colors}
                    countInStock={product.countInStock}
                    _id = {product._id}
                    user = {user?.id}
                  />
                </Col>
              ))
            ) : (
              <Col span={24} style={{ textAlign: 'center' }}>
                <p>Không tìm thấy sản phẩm phù hợp.</p>
              </Col>
            )}
          </Row>
        </LoadingComponent>

        {/* Phân trang */}
        <Pagination
          defaultCurrent={panigate.page + 11}
          total={panigate?.total}
          onChange={onChange}
          pageSize={8}
          style={{ display: 'flex', justifyContent: 'center', margin: '32px 0' }}
        />
      </div>
    </ContainerComponent>
  );
};

export default TypeProduct;
