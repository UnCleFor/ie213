import React, { useState } from 'react';
import { Layout, Menu, Button } from 'antd';
import {
  UserOutlined,
  AppstoreOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ShoppingCartOutlined,
  LoginOutlined
} from '@ant-design/icons';
import HeaderComponent from '../../components/HeaderComponent/HeaderComponent';
import AdminUser from '../../components/AdminUser/AdminUser';
import AdminProduct from '../../components/AdminProduct/AdminProduct';
import { getItem } from '../../utils';
import AdminOrder from '../../components/AdminOrder/AdminOrder';
import AdminLogin from '../../components/AdminLogin/AdminLogin';

const { Sider, Content } = Layout;

const AdminPage = () => {
  const items = [
    getItem('Truy cập', 'login', <LoginOutlined />),
    getItem('Người dùng', 'user', <UserOutlined />),
    getItem('Sản phẩm', 'product', <AppstoreOutlined />),
    getItem('Đơn hàng', 'order', <ShoppingCartOutlined />)
  ];

  // Lưu trạng thái sidebar và mục menu được chọn
  const [collapsed, setCollapsed] = useState(false);
  const [keySelected, setKeySelected] = useState('login');

  // Hàm render nội dung trang dựa vào mục menu được chọn
  const renderPage = (key) => {
    switch (key) {
      case 'login':
        return <AdminLogin />
      case 'user':
        return <AdminUser />;
      case 'product':
        return <AdminProduct />;
      case 'order':
        return <AdminOrder />;
      default:
        return null;
    }
  };

  // Thay đổi giá trị của mục menu được chọn
  const handleOnClick = ({ key }) => {
    setKeySelected(key);
  };

  return (
    <>
      {/* Vẫn hiển thị header nhưng ẩn Thanh tìm kiếm và Giỏ hàng */}
      <HeaderComponent isHiddenSearch isHiddenCart />

      {/* Chia bố cục cho Sider và Content */}
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          collapsed={collapsed}
          trigger={null} // Ẩn trigger mặc định
          collapsible
          breakpoint="lg"
          collapsedWidth="0"
          style={{
            background: '#fff',
            boxShadow: '0px 0 5px rgba(0,0,0,0.1)',
            zIndex: 1000,
            position: 'relative',
          }}
        >
          {/* Nút toggle custom nằm ở trên */}
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined style={{ color: 'white' }} /> : <MenuFoldOutlined style={{ color: 'white' }} />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              position: 'absolute',
              top: 1,
              left: 1,
              zIndex: 1001,
              fontSize: 18,
              backgroundColor: 'brown',
            }}
          />
          <div
            style={{
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: 20,
              marginTop: 40, // Đẩy logo xuống để nhường chỗ cho nút toggle
            }}
          >
            {collapsed ? 'A' : 'Admin'}
          </div>

          {/* Menu điều hướng được hiển thị bên trái */}
          <Menu
            mode="inline"
            selectedKeys={[keySelected]}
            onClick={handleOnClick}
            items={items}
            style={{ borderRight: 0 }}
          />
        </Sider>

        {/* Nội dung chính được hiển thị bên phải */}
        <Layout>
          <Content
            style={{

              padding: '24px',
              background: '#fff',

              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            {renderPage(keySelected)}
          </Content>
        </Layout>
      </Layout>
    </>
  );
};

export default AdminPage;