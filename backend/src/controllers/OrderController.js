const OrderService = require('../services/OrderService')
const Products = require('../models/ProductModel')


const createOrder = async (req, res) => {
  try {
    // lấy ra các thông tin cần thiết từ body của req đc gửi từ ui xuống để tạo Order mới 
    const {
      orderItems,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      totalPrice,
      fullName,
      address,
      phone,
      totalDiscount
    } = req.body

    const missingFields = [];
    // kiểm tra các trường bắt buộc
    if (!paymentMethod) missingFields.push('paymentMethod');
    if (!itemsPrice) missingFields.push('itemsPrice');
    if (!shippingPrice) missingFields.push('shippingPrice');
    if (!totalPrice) missingFields.push('totalPrice');
    if (!fullName) missingFields.push('fullName');
    if (!address) missingFields.push('address');
    if (!phone) missingFields.push('phone');
    if (totalDiscount === undefined || totalDiscount === null) missingFields.push('totalDiscount');

    if (missingFields.length > 0) {
      return res.status(200).json({
        status: 'Lỗi',
        message: `Thiếu thông tin: ${missingFields.join(', ')}`
      });
    }
    // Kiểm tra tồn kho
    for (const item of orderItems) {
      const product = await Products.findById(item.product);
      if (product.countInStock < item.amount) {
        return res.status(400).json({
          status: 'Lỗi',
          message: `Sản phẩm ${item.name} không đủ hàng. Còn ${product.countInStock} sản phẩm`,
        });
      }
    }

    // Trừ số lượng tồn kho
    for (const item of orderItems) {
      const product = await Products.findById(item.product);
      product.countInStock -= item.amount;
      product.selled += item.amount
      await product.save();
    }
    // // thực hiện gọi dịch vụ tạo proudct mới
    const ketqua = await OrderService.createOrder(req.body)
    return res.status(200).json(ketqua)
  } catch (e) {
    return res.status(404).json({
      massage: e
    })
  }
}
  // Lấy chi tiết đơn hàng theo ID
const getOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.id
    if (!orderId) {
      return res.status(200).json({
        message: 'Không tìm thấy đơn hàng'
      })
    }
    const ketqua = await OrderService.getOrderDetails(orderId)
    res.status(200).json(ketqua)
  } catch (err) {
    res.status(500).json({
      message: 'Lỗi server',
      error: err.message
    })
  }
}

  // Lấy toàn bộ đơn hàng
const getAllOrders = async (req, res) => {
  try {
    const ketqua = await OrderService.getAllOrders()
    return res.status(200).json(ketqua)
  } catch (error) {
    res.status(500).json({
      message: 'Lỗi server',
      error: error.message
    })
  }
}

  // Cập nhật đơn hàng theo ID
const updatedOrder = async (req, res) => {
  try {
    const OrderId = req.params.id
    const data = req.body
    if (!OrderId) {
      return res.status(200).json({
        status: 'ERR',
        message: 'Order Id là bắt buộc'
      })
    }
    const ketqua = await OrderService.updateOrder(OrderId, data)
    return res.status(200).json(ketqua)
  } catch (e) {
    return res.status(404).json({
      message: e
    })
  }
}

  // Xóa đơn hàng theo ID
const deleteOrder = async (req, res) => {
  try {
    const OrderId = req.params.id
    if (!OrderId) {
      return res.status(200).json({
        status: 'ERR',
        message: 'Order Id là bắt buộc'
      })
    }
    const ketqua = await OrderService.deleteOrder(OrderId)
    return res.status(200).json(ketqua)
  } catch (e) {
    return res.status(404).json({
      message: e
    })
  }
}

  // Xóa nhiều đơn hàng theo danh sách ID
const deleteManyOrder = async (req, res) => {
  try {
    const ids = req.body.ids
    if (!ids) {
      return res.status(200).json({
        status: 'ERR',
        message: 'Thiếu danh sách id'
      })
    }
    const ketqua = await OrderService.deleteManyOrder(ids)
    return res.status(200).json(ketqua)
  } catch (e) {
    return res.status(404).json({
      message: e
    })
  }
}

  // Lấy danh sách đơn hàng theo từng người dùng (userId)
const getOrderByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res.status(200).json({
        status: 'ERR',
        message: 'User Id là bắt buộc'
      });
    }

    const ketqua = await OrderService.getOrderByUser(userId);
    return res.status(200).json(ketqua);
  } catch (e) {
    return res.status(404).json({
      message: e.message
    });
  }
};

module.exports = {
  createOrder,
  getOrderDetails,
  getAllOrders,
  updatedOrder,
  deleteOrder,
  deleteManyOrder,
  getOrderByUser
}