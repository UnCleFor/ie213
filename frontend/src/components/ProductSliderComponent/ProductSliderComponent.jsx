import React, { useRef } from "react";
import Slider from "react-slick";
import CardComponent from "../CardComponent/CardComponent";
import { ArrowButton } from "../PromotionProductSliderComponent/style";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import {
  ProductSliderWrapper,
  ProductSliderRow,
  SliderContainer,
  SlideItemWrapper,
  SwipeHint
} from "./style";
import { useSelector } from 'react-redux';
import { getAllProduct, getNewestProducts, getDiscountedProducts } from "../../services/ProductService";
import { useDebounce } from "../../hooks/useDebounce";
import { useQuery } from "@tanstack/react-query";

const ProductSliderComponent = ({ 
  limit, 
  type = 'all', // 'all', 'newest', 'discounted'
  title = '' 
}) => {
  const sliderRef = useRef(null); // Ref dùng để điều khiển slider
  const user = useSelector((state) => state.user); // Lấy thông tin Người dùng
  const searchProduct = useSelector((state) => state.product.search); // Lấy keyword tìm kiếm từ store
  const searchDebounce = useDebounce(searchProduct, 1000); / Debounce từ khóa tìm kiếm để tránh gọi API liên tục

  // Chọn service phù hợp dựa trên prop type
  const getService = () => {
    switch (type) {
      case 'newest':
        return getNewestProducts;
      case 'discounted':
        return getDiscountedProducts;
      default:
        return getAllProduct;
    }
  };

  // Hàm fetch dữ liệu sản phẩm, dùng cho react-query
  const fetchProducts = async (context) => {
    const limit = context?.queryKey && context?.queryKey[1];
    const search = context?.queryKey && context?.queryKey[2];
    const productType = context?.queryKey && context?.queryKey[3];
    
    const service = getService();
    
    // Nếu là sản phẩm mới hoặc giảm giá thì không dùng search
    if (productType === 'newest' || productType === 'discounted') {
      const res = await service(limit, 0); // page luôn là 0 cho slider
      return res.data;
    } else {
      const res = await service(search, limit); // all products có filter theo search
      return res.data;
    }
  };

  // Sử dụng useQuery để gọi API và quản lý trạng thái tải dữ liệu
  const { isLoading, data: products = [], error } = useQuery({
    queryKey: ['products', limit, searchDebounce, type],
    queryFn: fetchProducts,
    retry: 3,
    retryDelay: 1000,
    keepPreviousData: true
  });

  if (error) {
    return <div>Lỗi khi tải sản phẩm.</div>;
  }
  
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center'
      }}>
        Đang tải sản phẩm...
      </div>
    );
  }
  
  if (!isLoading && products.length === 0) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
      }}>
        Không tìm thấy sản phẩm phù hợp.
      </div>
    );
  }

  // Duyệt danh sách sản phẩm và render mỗi sản phẩm dưới dạng CardComponent
  const items = products.map((item) => (
    <SlideItemWrapper key={item._id}>
      <CardComponent
        name={item.name}
        price={item.price}
        image={item.image}
        description={item.description}
        id={item._id}
        discount={item.discount}
        size={item.size}
        colors={item.colors}
        countInStock={item.countInStock}
        _id={item._id}
        user={user?.id}
        createdAt={type === 'newest' ? item.createdAt : undefined}
      />
    </SlideItemWrapper>
  ));

  // Cấu hình cho react-slick slider
  const settings = {
    dots: false,
    infinite: false,
    slidesToShow: 4,
    slidesToScroll: 1,
    arrows: false,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 3 } },
      { breakpoint: 820, settings: { slidesToShow: 2 } },
      { breakpoint: 768, settings: { slidesToShow: 2 } },
      { breakpoint: 480, settings: { slidesToShow: 1 } },
    ],
  };

  return (
    <ProductSliderWrapper>
      {title && <h2 style={{ padding: '0 16px' }}>{title}</h2>}
      <ProductSliderRow>
        <ArrowButton direction="left" onClick={() => sliderRef.current?.slickPrev()}>
          ←
        </ArrowButton>

        <SliderContainer>
          <Slider ref={sliderRef} {...settings}>
            {items}
          </Slider>
        </SliderContainer>

        <ArrowButton direction="right" onClick={() => sliderRef.current?.slickNext()}>
          →
        </ArrowButton>
      </ProductSliderRow>
      <SwipeHint>← Vuốt để xem thêm →</SwipeHint>
    </ProductSliderWrapper>
  );
};

export default ProductSliderComponent;