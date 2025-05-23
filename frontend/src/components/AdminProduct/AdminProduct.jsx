import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useMutationHooks } from "../../hooks/useMutationHook";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Form, Button, Modal, Space, Select, Input } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { WrapperHeader, WrapperUploadFile } from './style';
import TableComponent from '../TableComponent/TableComponent';
import InputComponent from '../InputComponent/InputComponent';
import DrawerComponent from '../DrawerComponent/DrawerComponent';
import Loading from '../LoadingComponent/Loading';
import * as ProductService from '../../services/ProductService';
import * as message from '../../components/Message/Message';
import { getBase64 } from '../../utils';
import ModalComponent from '../ModalComponent/ModalComponent';
import numeral from 'numeral';
const AdminProduct = () => {
  // Khai báo hai form cho thêm và cập nhật đơn hàng
  const [formAdd] = Form.useForm();
  const [formUpdate] = Form.useForm();

  const queryClient = useQueryClient();
  const user = useSelector((state) => state?.user);

  // Các biến trạng thái quản lý modal, drawer, loading, v.v.
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rowSelected, setRowSelected] = useState('');
  const [isOpenDrawer, setIsOpenDrawer] = useState(false);
  const [isLoadingUpdate, setIsLoadingUpdate] = useState(false);
  const [isFinishUpdated, setIsFinishUpdated] = useState(false);
  const [isFinishDeletedMany, setIsFinishDeletedMany] = useState(false);
  const [isModalOpenDelete, setIsModalOpenDelete] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState('');

  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const searchInput = useRef(null);

  // Trạng thái lưu thông tin đơn hàng
  const [stateProduct, setStateProduct] = useState({
    name: '',
    image: '',
    images: [],
    type: '',
    price: '',
    countInStock: '',
    description: '',
    room: '',      // Thêm phòng
    brand: '',     // Thêm thương hiệu
    origin: '',    // Thêm xuất xứ
    discount: '',  // Thêm giảm giá
    selled: '',    // Thêm số lượng đã bán
    colors: [],    // Thêm màu sắc
    size: {
      length: '',
      width: '',
      height: ''
    }
  });

  const [stateProductDetails, setStateProductDetails] = useState({
    name: '',
    image: '',
    images: [],
    type: '',
    price: '',
    countInStock: '',
    description: '',
    room: '',      // Thêm phòng
    brand: '',     // Thêm thương hiệu
    origin: '',    // Thêm xuất xứ
    discount: '',  // Thêm giảm giá
    selled: '',    // Thêm số lượng đã bán
    colors: [],    // Thêm màu sắc
    size: {
      length: '',
      width: '',
      height: ''
    }
  });

  // Trạng thái lưu phòng được chọn trong drawer chi tiết sản phẩm
  const [selectedRoomDetails, setSelectedRoomDetails] = useState(stateProductDetails?.room || '');

  // Khai báo mutation cho cập nhật, xóa, xóa nhiều đơn hàng
  const mutation = useMutationHooks((data) => {
    const { name, image, images, type, price, countInStock, description, room, brand, origin, discount, colors, size } = data;
    return ProductService.createProduct({ name, image, images, type, price, countInStock, description, room, brand, origin, discount, colors, size });
  });

  const mutationUpdate = useMutationHooks(({ id, token, ...rests }) => {
    return ProductService.updateProduct(id, rests, token);
  });

  const mutationDelete = useMutationHooks(({ id, token }) => {
    return ProductService.deleteProduct(id, token);
  });

  const mutationDeleteMany = useMutationHooks(({ token, ...ids }) => {
    return ProductService.deleteManyProduct(ids, token);
  });

  // Trạng thái phản hồi từ mutation
  const { data, isLoading, isSuccess, isError } = mutation;
  const { data: dataUpdated, isLoading: isLoadingUpdated, isSuccess: isSuccessUpdated, isError: isErrorUpdated } = mutationUpdate;
  const { data: dataDeleted, isLoading: isLoadingDeleted, isSuccess: isSuccessDeleted, isError: isErrorDeleted } = mutationDelete;
  const { data: dataDeletedMany, isLoading: isLoadingDeletedMany, isSuccess: isSuccessDeletedMany, isError: isErrorDeletedMany } = mutationDeleteMany;

  // Hàm lấy toàn bộ sản phẩm
  const getAllProducts = async () => {
    const res = await ProductService.getAllProductAdmin();
    return res;
  };

  // Query lấy danh sách đơn hàng
  const { isLoading: isLoadingProduct, data: products } = useQuery({
    queryKey: ['products'],
    queryFn: getAllProducts,
  });

  // Hàm lấy chi tiết đơn hàng và cập nhật vào drawer
  const fetchGetDetailsProduct = async (rowSelected) => {
    setIsLoadingUpdate(true);
    setIsOpenDrawer(true);
    const res = await ProductService.getDetailsProduct(rowSelected);
    if (res?.data) {
      setStateProductDetails({
        name: res?.data?.name,
        image: res?.data?.image,
        images: res?.data?.images || [],
        type: res?.data?.type,
        price: res?.data?.price,
        countInStock: res?.data?.countInStock,
        description: res?.data?.description,
        room: res?.data?.room || '',
        brand: res?.data?.brand || '',
        origin: res?.data?.origin || '',
        discount: res?.data?.discount || '',
        selled: res?.data?.selled || '',
        colors: res?.data?.colors || [],
        size: {
          length: res?.data?.size?.length || '',
          width: res?.data?.size?.width || '',
          height: res?.data?.size?.height || ''
        }
      });
    }
    setIsLoadingUpdate(false);
  };

  // Hàm xử lý khi người dùng yêu cầu xem chi tiết sản phẩm được chọn
  const handleDetailsProduct = () => {
    if (rowSelected) {
      setIsLoadingUpdate(true);
      fetchGetDetailsProduct(rowSelected);
    }
  };

  // Hàm xử lý đóng modal và reset form cập nhật
  const handleCancel = () => {
    setIsModalOpen(false);
    setStateProduct({
      name: '',
      image: '',
      images: [],
      type: '',
      price: '',
      countInStock: '',
      description: '',
      room: '',      // Thêm phòng
      brand: '',     // Thêm thương hiệu
      origin: '',    // Thêm xuất xứ
      discount: '',  // Thêm giảm giá
      selled: '',    // Thêm số lượng đã bán
      colors: [],    // Thêm màu sắc
      size: {
        length: '',
        width: '',
        height: ''
      }
    });
    formAdd.resetFields();
    formUpdate.resetFields();
    mutation.reset();
  };

  // Hàm xử lý khi người dùng thay đổi giá trị trong form nhập liệu
  const handleOnchange = (e) => {
    const { name, value } = e.target;

    // Nếu thay đổi là liên quan đến kích thước sản phẩm (chiều dài, rộng, cao)
    if (name === 'length' || name === 'width' || name === 'height') {
      const newSize = {
        ...(stateProduct.size || {}),
        [name]: value
      };

      // Cập nhật state lưu thông tin sản phẩm
      setStateProduct(prev => ({
        ...prev,
        size: newSize
      }));

      // Đồng bộ giá trị vào form Ant Design
      formAdd.setFieldsValue({
        size: newSize
      });

    } else {
      setStateProduct(prev => ({
        ...prev,
        [name]: value
      }));

      // Đồng bộ với form Ant Design
      formAdd.setFieldsValue({
        [name]: value
      });
    }
  };

  // Hàm xử lý khi thay đổi input trong drawer chi tiết đơn hàng
  const handleOnchangeDetails = (e) => {
    const { name, value } = e.target;
    // Xử lý cho các trường liên quan đến size nếu cần (ví dụ: length, width, height)
    if (name === 'length' || name === 'width' || name === 'height') {
      setStateProductDetails((prevState) => ({
        ...prevState,
        size: {
          ...(prevState.size || {}),
          [name]: value
        }
      }));
    } else {
      setStateProductDetails((prevState) => ({
        ...prevState,
        [name]: value
      }));
    }
  };

  // Hàm xử lý sự kiện khi người dùng chọn ảnh đại diện (avatar)
  const handleOnchangeAvatar = async ({ fileList }) => {
    const file = fileList?.[0];
    if (!file) return;

    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }

    // Cập nhật cả state và form value
    setStateProduct({
      ...stateProduct,
      image: file.preview,
    });

    formAdd.setFieldsValue({
      image: file.preview // Cập nhật giá trị cho trường 'image' trong form
    });
  };

  // Xử lý khi người dùng upload nhiều ảnh sản phẩm mới
  const handleOnchangeImages = async ({ fileList }) => {
    const newImages = await Promise.all(fileList.map(file => getBase64(file.originFileObj)));
    setStateProduct({
      ...stateProduct,
      images: newImages
    });
  };

  // Xử lý khi người dùng upload ảnh cho sản phẩm đã có (cập nhật chi tiết sản phẩm)
  const handleOnchangeImagesDetails = async ({ fileList }) => {
    const newImages = await Promise.all(
      fileList.map(file => {
        if (file.originFileObj) {
          return getBase64(file.originFileObj); // ảnh mới upload
        }
        return file.url || file.thumbUrl; // ảnh cũ đã có
      })
    );

    // Cập nhật state chi tiết sản phẩm với danh sách ảnh mới
    setStateProductDetails(prev => ({
      ...prev,
      images: newImages
    }));
  };

  // Xử lý khi người dùng thay ảnh đại diện (avatar) của sản phẩm đã có
  const handleOnchangeAvatarDetails = async ({ fileList }) => {
    const file = fileList[0];
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setStateProductDetails({
      ...stateProductDetails,
      image: file.preview
    });
  };

  // Đóng modal xác nhận xoá sản phẩm
  const handleCancelDelete = () => {
    setIsModalOpenDelete(false)
  }

  // Submit form để tạo sản phẩm mới
  const onFinish = () => {
    mutation.mutate(stateProduct);
  };

  // Submit để cập nhật sản phẩm đã chọn
  const onUpdateProduct = () => {
    setIsFinishUpdated(true);
    mutationUpdate.mutate({
      id: rowSelected,
      token: user.access_token,
      ...stateProductDetails
    });
  };

  // Hàm xóa một đơn hàng
  const handleDeleteProduct = () => {
    mutationDelete.mutate({
      id: rowSelected,
      token: user.access_token,
    });
  };

  // Hàm xóa nhiều đơn hàng
  const handleDeleteManyProducts = (ids) => {
    setIsFinishDeletedMany(true)
    mutationDeleteMany.mutate({
      ids: ids,
      token: user.access_token
    })
  }

  // Hàm render nút chỉnh sửa và xóa trên mỗi dòng bảng
  const renderAction = (record) => (
    <div>
      <EditOutlined
        onClick={(e) => {
          e.stopPropagation(); // Ngăn click lan lên dòng
          setIsLoadingUpdate(true);
          setRowSelected(record._id);
          fetchGetDetailsProduct(record._id); // Gọi fetch chi tiết ở đây
        }}
        style={{ color: 'black', fontSize: '30px', paddingLeft: '10px', cursor: 'pointer' }}
      />
      <DeleteOutlined
        onClick={(e) => {
          e.stopPropagation(); // Chặn click lan tới onRow
          setRowSelected(record._id);
          setIsModalOpenDelete(true);
        }}
        style={{ color: 'red', fontSize: '30px', paddingLeft: '10px', cursor: 'pointer' }}
      />
    </div>
  );

  // Hàm xử lý tìm kiếm trong bảng
  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  // Hàm xử lý khi người dùng nhấn "Reset" trong ô tìm kiếm của cột
  const handleReset = (clearFilters, confirm) => {
    clearFilters();          // Xóa bộ lọc hiện tại
    setSearchText('');       // Reset từ khóa tìm kiếm
    confirm();               // Kích hoạt lại lọc (với từ khóa rỗng)
  };

  // Hàm cấu hình search cho từng cột cụ thể
  const getColumnSearchProps = dataIndex => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
      <div style={{ padding: 8 }} onKeyDown={e => e.stopPropagation()}>
        <InputComponent
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Tìm
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters, confirm)}
            size="small"
            style={{ width: 90 }}
          >
            Đặt lại
          </Button>
        </Space>
      </div>
    ),
    filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />,
    onFilter: (value, record) =>
      record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
    filterDropdownProps: {
      onOpenChange(open) {
        if (open) {
          setTimeout(() => {
            var _a;
            return (_a = searchInput.current) === null || _a === void 0 ? void 0 : _a.select();
          }, 100);
        }
      },
    },
  });

  // Danh sách các loại sản phẩm được phân loại theo từng phòng trong nhà
  const productTypesByRoom = {
    'Phòng khách': ['Sofa', 'Bàn trà', 'Kệ tivi', 'Ghế đơn', 'Tủ trang trí'],
    'Phòng ngủ': ['Giường', 'Tủ quần áo', 'Tab đầu giường', 'Bàn trang điểm', 'Chăn ga gối'],
    'Phòng ăn': ['Bàn ăn', 'Ghế ăn', 'Tủ bếp', 'Tủ rượu', 'Phụ kiện bàn ăn'],
    'Phòng làm việc': ['Bàn làm việc', 'Ghế làm việc', 'Kệ sách', 'Tủ hồ sơ', 'Đèn bàn'],
    'Trang trí nhà cửa': ['Tranh treo tường', 'Đèn trang trí', 'Thảm', 'Cây giả', 'Đồng hồ trang trí']
  };

  // Danh sách tất cả các loại sản phẩm có thể có trong hệ thống (dùng cho dropdown, lọc,...)
  const productTypes = [
    "Sofa", "Bàn trà", "Kệ tivi", "Ghế đơn", "Tủ trang trí", "Giường", "Tủ quần áo",
    "Tab đầu giường", "Bàn trang điểm", "Chăn ga gối", "Bàn ăn", "Ghế ăn", "Tủ bếp",
    "Tủ rượu", "Phụ kiện bàn ăn", "Bàn làm việc", "Ghế làm việc", "Kệ sách", "Tủ hồ sơ",
    "Đèn bàn", "Tranh treo tường", "Đèn trang trí", "Thảm", "Cây giả", "Đồng hồ trang trí"
  ];

  // Trạng thái bộ lọc hiện tại (dùng để lọc sản phẩm theo phòng và loại)
  const [filters, setFilters] = useState({
    room: undefined,
    type: undefined,
  });

  // Cập nhật bộ lọc khi người dùng thay đổi trên bảng
  const handleTableChange = (pagination, currentFilters) => {
    setFilters({
      room: currentFilters.room || undefined,
      type: currentFilters.type || undefined,
    });
  };

  const getAvailableTypes = () => {
    // Nếu không chọn phòng nào, trả về tất cả type
    if (!filters.room || filters.room.length === 0) {
      return productTypes;
    }

    // Lấy tất cả type của các room được chọn
    const types = new Set();
    filters.room.forEach(room => {
      productTypesByRoom[room]?.forEach(type => types.add(type));
    });
    return Array.from(types);
  };

  // Cấu hình các cột cho bảng hiển thị đơn hàng
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      sorter: (a, b) => a.name.length - b.name.length,
      ...getColumnSearchProps('name'),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      sorter: (a, b) => a.price - b.price,
      render: (price) => `${numeral(price).format('0,0').replace(/,/g, '.')} đ`,
      filters: [
        { text: 'Dưới 1.000.000đ', value: 'under1tr' },
        { text: '1.000.000đ - 5.000.000đ', value: '1to5tr' },
        { text: '5.000.000đ - 10.000.000đ', value: '5to10tr' },
        { text: 'Trên 10.000.000đ', value: 'above10tr' },
      ],
      onFilter: (value, record) => {
        const price = record.price;
        switch (value) {
          case 'under1tr': return price < 1000000;
          case '1to5tr': return price >= 1000000 && price <= 5000000;
          case '5to10tr': return price > 5000000 && price <= 10000000;
          case 'above10tr': return price > 10000000;
          default: return true;
        }
      },
      width: '30%',
    },
    {
      title: 'Room',
      dataIndex: 'room',
      filters: Object.keys(productTypesByRoom).map(room => ({
        text: room,
        value: room,
      })),
      filteredValue: filters.room,
      onFilter: (value, record) => {
        // Nếu có filter type, kiểm tra cả type
        if (filters.type && filters.type.length > 0) {
          return record.room === value &&
            filters.type.includes(record.type);
        }
        return record.room === value;
      },
      filterMultiple: true,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      filters: getAvailableTypes().map(type => ({
        text: type,
        value: type,
      })),
      filteredValue: filters.type,
      onFilter: (value, record) => {
        // Luôn ưu tiên kiểm tra type trước
        if (record.type !== value) return false;

        // Nếu có chọn phòng thì kiểm tra phòng
        if (filters.room && filters.room.length > 0) {
          return filters.room.includes(record.room);
        }

        // Nếu không chọn phòng thì chỉ cần khớp type
        return true;
      },
      filterMultiple: true,
    },
    {
      title: 'Action',
      dataIndex: 'action',
      render: (_, record) => renderAction(record),
    },
  ];

  // Map dữ liệu đơn hàng để hiển thị trong bảng
  const dataTable = products?.data?.length && products?.data?.map((product) => ({
    ...product,
    key: product._id
  }));

  // Cập nhật lại dữ liệu vào form khi drawer mở
  useEffect(() => {
    if (isModalOpen) {
      formAdd.setFieldsValue(stateProduct); // Đồng bộ state vào form mỗi khi mở lại
    }
  }, [isModalOpen]);

  // Cập nhật giá trị của form khi stateProductDetails thay đổi
  useEffect(() => {
    formUpdate.setFieldsValue(stateProductDetails);
  }, [formUpdate, stateProductDetails]);

  // Xử lý khi thêm sản phẩm thành công/thất bại
  useEffect(() => {
    if (isSuccess && data?.status === 'OK') {
      message.success('Thêm sản phẩm thành công!');
      handleCancel();
      queryClient.invalidateQueries(['products']);
    } else if (data?.status === 'ERR') {
      message.error('Thêm sản phẩm thất bại!');
    }
  }, [isSuccess, isError]);

  // Xử lý khi cập nhật sản phẩm thành công/thất bại
  useEffect(() => {
    if (isSuccessUpdated && dataUpdated?.status === 'OK') {
      message.success('Cập nhật thành công!');
      queryClient.invalidateQueries(['products']);
      setIsFinishUpdated(false)
      setIsOpenDrawer(false);
    } else if (dataUpdated?.status === 'ERR') {
      setIsFinishUpdated(false);
      message.error('Cập nhật thất bại!');
    }
  }, [isSuccessUpdated, isErrorUpdated]);

  // Xử lý khi xóa sản phẩm thành công/thất bại
  useEffect(() => {
    if (isSuccessDeleted && dataDeleted?.status === 'OK') {
      message.success('Xóa sản phẩm thành công!');
      queryClient.invalidateQueries(['products']);
      setIsModalOpenDelete(false);
    } else if (isErrorDeleted) {
      message.error('Xóa sản phẩm thất bại!');
    }
  }, [isSuccessDeleted, isErrorDeleted]);

  // Xử lý khi xóa nhiều sản phẩm thành công/thất bại
  useEffect(() => {
    if (isSuccessDeletedMany && dataDeletedMany?.status === 'OK') {
      message.success('Xóa các sản phẩm thành công!');
      queryClient.invalidateQueries(['products']);
      setIsFinishDeletedMany(false);
    } else if (isErrorDeletedMany) {
      message.error('Xóa các sản phẩm thất bại!');
    }
  }, [isSuccessDeletedMany, isErrorDeletedMany]);

  return (
    <div>
      <WrapperHeader>Quản lý sản phẩm</WrapperHeader>
      <div style={{ marginTop: '10px' }}>
        <Button
          type="dashed"
          onClick={() => setIsModalOpen(true)}
          style={{
            height: 150,
            width: 150,
            borderRadius: 10,
            fontSize: 16,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999'
          }}
        >
          <PlusOutlined style={{ fontSize: 40, marginBottom: 8 }} />
          New Product
        </Button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <TableComponent
          deleteAll={handleDeleteManyProducts}
          forceRender
          columns={columns}
          isLoading={isLoadingProduct || isFinishDeletedMany}
          data={dataTable}
          onRow={(record) => ({
            onClick: () => setRowSelected(record._id)
          })}
          onChange={handleTableChange}
          exportFileName="products_list"
        />
      </div>

      {/* Modal thêm sản phẩm */}
      <Modal forceRender title="Tạo sản phẩm mới" open={isModalOpen} onCancel={handleCancel} footer={null}>
        <Loading isLoading={isLoading}>
          <Form
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 16 }}
            form={formAdd}
            onFinish={onFinish}
            autoComplete="off"
            initialValues={{
              size: {
                length: stateProduct.size?.length || '',
                width: stateProduct.size?.width || '',
                height: stateProduct.size?.height || ''
              },
            }}
          >
            {/* Các trường nhập liệu cho sản phẩm */}
            {['name', 'price', 'countInStock', 'description', 'brand', 'origin', 'discount'].map((field) => (
              <Form.Item
                key={field}
                label={field.charAt(0).toUpperCase() + field.slice(1)}
                name={field}
                rules={[{ required: true, message: `Vui lòng nhập ${field}` }]}
              >
                <InputComponent
                  value={stateProduct[field]}
                  onChange={handleOnchange}
                  name={field}
                />
              </Form.Item>
            ))}

            {/* Các trường phòng và loại sản phẩm */}
            <Form.Item
              label="Room"
              name="room"
              rules={[{ required: true, message: 'Vui lòng chọn phòng' }]}
            >
              <Select
                value={stateProduct.room}
                onChange={(value) => {
                  handleOnchange({ target: { name: 'room', value } });
                  setSelectedRoom(value);
                  // Reset type nếu đổi phòng
                  formAdd.setFieldsValue({ type: undefined });
                }}
              >
                {Object.keys(productTypesByRoom).map((room) => (
                  <Select.Option key={room} value={room}>
                    {room}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Type"
              name="type"
              rules={[{ required: true, message: 'Vui lòng chọn loại sản phẩm' }]}
            >
              <Select
                value={stateProduct.type}
                onChange={(value) => handleOnchange({ target: { name: 'type', value } })}
                disabled={!selectedRoom}
                placeholder={!selectedRoom ? 'Vui lòng chọn phòng trước' : 'Chọn loại sản phẩm'}
              >
                {(productTypesByRoom[selectedRoom] || []).map((type) => (
                  <Select.Option key={type} value={type}>
                    {type}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            {/* Cập nhật màu sắc */}
            <Form.Item
              label="Colors"
              name="colors"
              rules={[{ required: true, message: 'Vui lòng chọn màu sắc' }]}
            >
              <Select
                mode="multiple"
                value={stateProduct.colors}
                onChange={(value) => handleOnchange({ target: { name: 'colors', value } })}
              >
                {['Đỏ', 'Xanh', 'Vàng', 'Trắng', 'Đen'].map((color) => (
                  <Select.Option key={color} value={color}>
                    {color}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            {/* Cập nhật kích thước */}
            <Form.Item label="Size" required>
              <Input.Group compact>
                <Form.Item
                  name={['size', 'length']}
                  rules={[{ required: true, message: 'Vui lòng nhập chiều dài' }]}
                  noStyle
                >
                  <InputComponent
                    name="length" // Thêm prop name
                    style={{ width: '33.3%' }}
                    placeholder="Length"
                    onChange={handleOnchange}
                  />
                </Form.Item>

                <Form.Item
                  name={['size', 'width']}
                  rules={[{ required: true, message: 'Vui lòng nhập chiều rộng' }]}
                  noStyle
                >
                  <InputComponent
                    name="width" // Thêm prop name
                    style={{ width: '33.3%' }}
                    placeholder="Width"
                    onChange={handleOnchange}
                  />
                </Form.Item>

                <Form.Item
                  name={['size', 'height']}
                  rules={[{ required: true, message: 'Vui lòng nhập chiều cao' }]}
                  noStyle
                >
                  <InputComponent
                    name="height" // Thêm prop name
                    style={{ width: '33.3%' }}
                    placeholder="Height"
                    onChange={handleOnchange}
                  />
                </Form.Item>
              </Input.Group>
            </Form.Item>

            {/* Cập nhật ảnh */}
            <Form.Item
              label="Avatar"
              name="image"
              rules={[{ required: true, message: 'Vui lòng chọn ảnh' }]}
            >
              <WrapperUploadFile
                onChange={handleOnchangeAvatar}
                maxCount={1}
                beforeUpload={() => false}
                customRequest={({ onSuccess }) => setTimeout(() => onSuccess("ok"), 0)}
              >
                <Button>Select Avatar</Button>
              </WrapperUploadFile>
              <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {stateProduct?.image && (
                  <img
                    src={stateProduct?.image}
                    style={{
                      height: '60px',
                      width: '60px',
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                    alt=""
                  />
                )}
              </div>
            </Form.Item>

            {/* Thêm ảnh phụ */}
            <Form.Item label="Images">
              <WrapperUploadFile
                multiple
                onChange={handleOnchangeImages}
                maxCount={5}
                beforeUpload={() => false}
                customRequest={({ onSuccess }) => setTimeout(() => onSuccess("ok"), 0)}
              >
                <Button>Select Images</Button>
              </WrapperUploadFile>
              <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {stateProduct.images?.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt=""
                    style={{
                      width: '60px',
                      height: '60px',
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                  />
                ))}
              </div>
            </Form.Item>
            {data?.status === 'ERR' && (<span style={{ color: 'red' }}>{data?.message}</span>)}
            <Form.Item wrapperCol={{ offset: 20, span: 16 }}>
              <Button type="primary" htmlType="submit">Xác nhận</Button>
            </Form.Item>
          </Form>
        </Loading>
      </Modal>

      {/* Drawer chi tiết sản phẩm */}
      <DrawerComponent
        title="Chi tiết sản phẩm"
        isOpen={isOpenDrawer}
        onClose={() => {
          setIsOpenDrawer(false);
          mutationUpdate.reset();  // Reset mutation khi đóng drawer
        }}
      >
        <Loading isLoading={isLoadingUpdate || isFinishUpdated}>
          <Form
            labelCol={{ span: 4 }}
            wrapperCol={{ span: 20 }}
            form={formUpdate}
            onFinish={onUpdateProduct}
            autoComplete="off"
          >
            {/* Các trường cơ bản */}
            {['name', 'price', 'countInStock', 'description'].map((field) => (
              <Form.Item
                key={field}
                label={field.charAt(0).toUpperCase() + field.slice(1)}
                name={field}
                rules={[{ required: true, message: `Vui lòng nhập ${field}` }]}
              >
                <InputComponent
                  value={stateProductDetails[field]}
                  onChange={handleOnchangeDetails}
                  name={field}
                />
              </Form.Item>
            ))}

            <Form.Item
              label="Room"
              name="room"
              rules={[{ required: true, message: 'Vui lòng chọn phòng' }]}
            >
              <Select
                value={stateProductDetails.room}
                onChange={(value) => {
                  handleOnchangeDetails({ target: { name: 'room', value } });
                  setSelectedRoomDetails(value);
                  formUpdate.setFieldsValue({ type: undefined }); // reset loại sản phẩm khi đổi phòng
                }}
              >
                {Object.keys(productTypesByRoom).map((room) => (
                  <Select.Option key={room} value={room}>
                    {room}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Type"
              name="type"
              rules={[{ required: true, message: 'Vui lòng chọn loại sản phẩm' }]}
            >
              <Select
                value={stateProductDetails.type}
                onChange={(value) => handleOnchangeDetails({ target: { name: 'type', value } })}
                disabled={!selectedRoomDetails}
                placeholder={!selectedRoomDetails ? 'Vui lòng chọn phòng trước' : 'Chọn loại sản phẩm'}
              >
                {(productTypesByRoom[selectedRoomDetails] || []).map((type) => (
                  <Select.Option key={type} value={type}>
                    {type}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            {/* Các trường bổ sung */}
            {['brand', 'origin', 'discount', 'selled'].map((field) => (
              <Form.Item
                key={field}
                label={field.charAt(0).toUpperCase() + field.slice(1)}
                name={field}
                rules={[{ required: true, message: `Vui lòng nhập ${field}` }]}
              >
                <InputComponent
                  value={stateProductDetails[field]}
                  onChange={handleOnchangeDetails}
                  name={field}
                />
              </Form.Item>
            ))}

            {/* Trường màu sắc */}
            <Form.Item
              label="Colors"
              name="colors"
              rules={[{ required: true, message: 'Vui lòng chọn màu sắc' }]}
            >
              <Select
                mode="multiple"
                value={stateProductDetails.colors}
                onChange={(value) => handleOnchangeDetails({ target: { name: 'colors', value } })}
              >
                {['Đỏ', 'Xanh', 'Vàng', 'Trắng', 'Đen'].map((color) => (
                  <Select.Option key={color} value={color}>
                    {color}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            {/* Trường kích thước */}
            <Form.Item label="Size" required>
              <Input.Group compact>
                <Form.Item
                  name={['size', 'length']}
                  rules={[{ required: true, message: 'Vui lòng nhập chiều dài' }]}
                  noStyle
                >
                  <InputComponent
                    style={{ width: '33.3%' }}
                    placeholder="Length"
                    name="length"
                    value={stateProductDetails?.size?.length || ''}
                    onChange={handleOnchangeDetails}
                  />
                </Form.Item>
                <Form.Item
                  name={['size', 'width']}
                  rules={[{ required: true, message: 'Vui lòng nhập chiều rộng' }]}
                  noStyle
                >
                  <InputComponent
                    style={{ width: '33.3%' }}
                    placeholder="Width"
                    name="width"
                    value={stateProductDetails?.size?.width || ''}
                    onChange={handleOnchangeDetails}
                  />
                </Form.Item>
                <Form.Item
                  name={['size', 'height']}
                  rules={[{ required: true, message: 'Vui lòng nhập chiều cao' }]}
                  noStyle
                >
                  <InputComponent
                    style={{ width: '33.3%' }}
                    placeholder="Height"
                    name="height"
                    value={stateProductDetails?.size?.height || ''}
                    onChange={handleOnchangeDetails}
                  />
                </Form.Item>
              </Input.Group>
            </Form.Item>

            {/* Ảnh chính */}
            <Form.Item
              label="Avatar"
              name="image"
              valuePropName="fileList" // Thêm prop này
              getValueFromEvent={(e) => e.fileList} // Chuyển đổi event thành giá trị
              rules={[{ required: true, message: 'Vui lòng chọn ảnh' }]}
            >
              <WrapperUploadFile
                onChange={handleOnchangeAvatar}
                maxCount={1}
                beforeUpload={() => false}
                customRequest={({ onSuccess }) => setTimeout(() => onSuccess("ok"), 0)}
              >
                <Button>Select Avatar</Button>
              </WrapperUploadFile>
              <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {stateProductDetails?.image && (
                  <img
                    src={stateProductDetails?.image}
                    style={{
                      height: '60px',
                      width: '60px',
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                    alt=""
                  />
                )}
              </div>
            </Form.Item>

            {/* Ảnh phụ */}
            <Form.Item label="Images" name="images">
              <WrapperUploadFile
                multiple
                onChange={handleOnchangeImagesDetails}
                beforeUpload={() => false}
                customRequest={({ onSuccess }) => setTimeout(() => onSuccess("ok"), 0)}
              >
                <Button>Select Images</Button>
              </WrapperUploadFile>
              <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {stateProductDetails.images?.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt=""
                    style={{
                      width: '60px',
                      height: '60px',
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                  />
                ))}
              </div>
            </Form.Item>
            {dataUpdated?.status === 'ERR' && <span style={{ color: 'red' }}>{dataUpdated?.message}</span>}
            <Form.Item wrapperCol={{ offset: 18, span: 6 }}>
              <Button type="primary" htmlType="submit">Áp dụng</Button>
            </Form.Item>
          </Form>
        </Loading>
      </DrawerComponent>

      {/* Modal xoá sản phẩm */}
      <ModalComponent
        title="Xóa sản phẩm"
        open={isModalOpenDelete}
        onCancel={handleCancelDelete}
        onOk={handleDeleteProduct}
      >
        <Loading isLoading={isLoadingDeleted}>
          <div>Bạn có muốn xóa sản phẩm này không ?</div>
        </Loading>
      </ModalComponent>
    </div>
  );
};

export default AdminProduct;
