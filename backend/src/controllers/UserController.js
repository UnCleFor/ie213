const UserService = require('../services/UserService')
const JwtService = require('../services/JwtService')
// validator cho email (npm install email-validator)
var validator = require("email-validator");
const EmailService = require('../services/EmailService')
const crypto = require('crypto')
const UserModel = require('../models/UserModel')
const bcrypt = require('bcrypt')

const LoginHistory = require('../models/LoginHistoryModel');
const User = require('../models/UserModel');
const mongoose = require('mongoose')

    // API tạo người dùng mới
const createUser = async (req, res) => {
    try {
        const { name, email, password, confirmPassword, phone } = req.body;

        // Email validation
        const isCheckEmail = validator.validate(email);

        // Phone number validation regex (Vietnamese format)
        const phoneRegex = /^(0|\+84)(3[2-9]|5[2689]|7[06-9]|8[1-689]|9[0-9])[0-9]{7}$/;

        // Password requirements:
        // - At least 8 characters
        // - At least 1 uppercase letter
        // - At least 1 lowercase letter
        // - At least 1 number
        // - At least 1 special character
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        // Validation checks
        if (!name || !email || !password || !confirmPassword || !phone) {
            return res.status(200).json({
                status: 'ERR',
                message: 'Cần điền đầy đủ thông tin'
            });
        } else if (!isCheckEmail) {
            return res.status(200).json({
                status: 'ERR',
                message: 'Email không hợp lệ'
            });
        } else if (password !== confirmPassword) {
            return res.status(200).json({
                status: 'ERR',
                message: 'Mật khẩu nhập lại không trùng khớp'
            });
        } else if (!phoneRegex.test(phone)) {
            return res.status(200).json({
                status: 'ERR',
                message: 'Số điện thoại không hợp lệ (phải là số điện thoại Việt Nam)'
            });
        } else if (!passwordRegex.test(password)) {
            return res.status(200).json({
                status: 'ERR',
                message: 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt'
            });
        }

        // If all validations pass, create the user
        const response = await UserService.createUser(req.body);
        return res.status(200).json(response);
    } catch (e) {
        return res.status(404).json({
            status: 'ERR',
            message: e.message || 'Lỗi hệ thống'
        });
    }
};

    // API đăng nhập người dùng
const loginUser = async (req, res) => {
    try {
        // lấy ra các thông tin cần thiết từ body của req đc gửi từ ui xuống để tạo user mới 
        const { email, password } = req.body
        // check email có hợp lệ ko
        const isCheckEmail = validator.validate(email);
        // nếu thiếu 1 trường thì báo lỗi
        if (!email || !password) {
            return res.status(200).json({
                status: 'ERR',
                message: 'Cần điền đầy đủ thông tin'
            })
        } else if (!isCheckEmail) {
            return res.status(200).json({
                status: 'ERR',
                message: 'Email bị lỗi'
            })
        }
        // Kiểm tra xem người dùng đã đăng nhập ở nơi khác chưa
        const user = await UserModel.findOne({ email });

        if (!user) {
            return res.status(200).json({
                status: 'ERR',
                message: 'Người dùng không tồn tại'
            });
        }
        
        if (user.isLoggedIn) {
            return res.status(200).json({
                status: 'ERR',
                message: 'Tài khoản này đã được đăng nhập ở nơi khác'
            });
        }
        if (user.isBlocked) {
            return res.status(200).json({
                status: 'ERR',
                message: 'Tài khoản đã bị chặn'
            });
          }

        const ketqua = await UserService.loginUser(req.body)
         // Ghi lịch sử đăng nhập
         const loginRecord = await LoginHistory.create({
            user: user._id,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            status: 'success',
            loginAt: new Date()
        });
        // Cập nhật trạng thái người dùng
        await User.findByIdAndUpdate(user._id, {
            isLoggedIn: true,
            lastActive: new Date(),
            currentSession: loginRecord._id
        });

        //tách phần refresh token ra khỏi kết quả và tạo ra newResponse để lưu lại kết quả sau khi tách
        const { refresh_token, ...newResponse } = ketqua
        //bỏ refresn token vào cookie
        res.cookie('refresh-token', refresh_token, {
            HttpOnly: true,
            Secure: true,
            sameSite: 'None',
        })
        return res.status(200).json({...newResponse, refresh_token})
    }
    catch (e) {
        // Ghi lịch sử thất bại nếu có email
        if (req.body.email) {
            const user = await UserModel.findOne({ email: req.body.email });
            if (user) {
                await LoginHistory.create({
                    user: user._id,
                    ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                    userAgent: req.get('User-Agent'),
                    status: 'failed',
                    failureReason: e.message,
                    loginAt: new Date()
                });
            }
        }

        return res.status(404).json({
            message: e
        })
    }
}

    // API cập nhật thông tin người dùng
const updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const { name, email, password, phone } = req.body;

        // Validation patterns
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email validation
        const phoneRegex = /^(0|\+84)(3[2-9]|5[2689]|7[06-9]|8[1-689]|9[0-9])[0-9]{7}$/; // Vietnamese phone
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        // Required field check
        if (!userId) {
            return res.status(200).json({
                status: 'ERR',
                message: 'Thiếu userId'
            });
        }

        // Validate email if provided
        if (email && !emailRegex.test(email)) {
            return res.status(200).json({
                status: 'ERR',
                message: 'Email không hợp lệ'
            });
        }

        // Validate phone if provided
        if (phone && !phoneRegex.test(phone)) {
            return res.status(200).json({
                status: 'ERR',
                message: 'Số điện thoại không hợp lệ (phải là số điện thoại Việt Nam)'
            });
        }

        // Validate password if provided
        if (password && !passwordRegex.test(password)) {
            return res.status(200).json({
                status: 'ERR',
                message: 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt'
            });
        }

        // If all validations pass, update the user
        const response = await UserService.updateUser(userId, req.body);
        return res.status(200).json(response);

    } catch (e) {
        return res.status(404).json({
            status: 'ERR',
            message: e.message || 'Lỗi hệ thống khi cập nhật thông tin'
        });
    }
};

    // API xóa người dùng theo ID
const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id
        if (!userId) {
            return res.status(200).json({
                status: 'ERR',
                message: 'Mật khẩu nhập lại không trùng khớp'
            })
        }

        // thực hiện xóa user
        const ketqua = await UserService.deleteUser(userId)
        return res.status(200).json(ketqua)
    }
    catch (e) {
        return res.status(404).json({
            message: e
        })
    }
}

    // API lấy danh sách tất cả người dùng
const getAllUser = async (req, res) => {
    try {
        // thực hiện gọi dịch vụ tạo user mới
        const ketqua = await UserService.getAllUser()
        return res.status(200).json(ketqua)
    }
    catch (e) {
        return res.status(404).json({
            message: e
        })
    }
}

    // API lấy thông tin chi tiết người dùng theo ID
const getDetailsUser = async (req, res) => {
    try {
        const userId = req.params.id
        if (!userId) {
            return res.status(200).json({
                status: 'ERR',
                message: 'Mật khẩu nhập lại không trùng khớp'
            })
        }

        // thực hiện gọi dịch vụ tạo user mới
        const ketqua = await UserService.getDetailsUser(userId)
        return res.status(200).json(ketqua)
    }
    catch (e) {
        return res.status(404).json({
            message: e
        })
    }
}

    // API làm mới access token
const refreshToken = async (req, res) => {
    try {
        // lấy refresh token trong cookie
        let token = req.headers.token.split(' ')[1]
        if (!token) {
            return res.status(200).json({
                status: 'ERR',
                message: 'Token bị thiếu'
            })
        }

        const ketqua = await JwtService.refreshTokenJwtService(token)
        return res.status(200).json(ketqua)
    }
    catch (e) {
        return res.status(404).json({
            message: e
        })
    }
}

    // API đăng xuất người dùng
const logoutUser = async (req, res) => {
    try {
        res.clearCookie('refresh-token', {
            httpOnly: true,
            secure: false,      // true nếu dùng HTTPS (trên prod)
            sameSite: 'lax',    // hoặc 'strict' nếu muốn an toàn hơn
        });

        return res.status(200).json({
            status: 'OK',
            message: 'Đăng xuất thành công'
        });
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
};

    // API xóa nhiều người dùng theo danh sách ID
const deleteManyUser = async (req, res) => {
    try {
        const ids = req.body.ids
        if (!ids) {
            return res.status(200).json({
                status: 'ERR',
                message: 'Thiếu ds id của user'
            })
        }

        // thực hiện xóa user
        const ketqua = await UserService.deleteManyUser(ids)
        return res.status(200).json(ketqua)
    }
    catch (e) {
        return res.status(404).json({
            message: e
        })
    }
}

    // API lấy email người dùng theo ID
const getUserEmail = async (req, res) => {
    try {
        const userId = req.params.id
        if (!userId) {
            return res.status(200).json({
                status: 'ERR',
                message: 'Thiếu id user'
            })
        }
        // thực hiện gọi dịch vụ tạo user mới
        const ketqua = await UserService.getUserEmail(userId)
        return res.status(200).json(ketqua)
    }
    catch (e) {
        return res.status(404).json({
            message: e
        })
    }
}

    // API quên mật khẩu
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body

        // Tìm user theo email
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Email không tồn tại trong hệ thống' });
        }

        // Tạo mã OTP 6 số
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Lưu OTP vào user (thêm trường otp + thời gian hết hạn otp)
        user.resetPasswordOTP = otp;
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // Hết hạn sau 10 phút
        await user.save();

        // Gửi email OTP
        await EmailService.sendOTPEmail({
            to: email,
            subject: "Mã OTP đặt lại mật khẩu",
            text: `Mã OTP của bạn là: ${otp}`,
        });

        return res.status(200).json({ status: 'OK', message: 'OTP đã được gửi về email' });

    }
    catch (e) {
        console.error(e);  // Để kiểm tra lỗi chi tiết trong console
        return res.status(500).json({ status: 'ERR', message: e.message });
    }
}

    // API đặt lại mật khẩu
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        // Kiểm tra có đủ thông tin không
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ status: 'ERR', message: 'Thiếu thông tin yêu cầu' });
        }

        // Ràng buộc độ mạnh của mật khẩu
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({
                status: 'ERR',
                message: 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt'
            });
        }

        // Tìm user theo email
        const user = await UserModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ status: 'ERR', message: 'Email không tồn tại' });
        }
        if (user.resetPasswordOTP !== otp) {
            return res.status(400).json({ status: 'ERR', message: 'Mã OTP không đúng' });
        }

        if (user.resetPasswordExpire < Date.now()) {
            return res.status(400).json({ status: 'ERR', message: 'Mã OTP đã hết hạn' });
        }

        // Đặt lại mật khẩu (hash mật khẩu mới)
        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        user.password = hashedPassword;

        // Xóa OTP và thời gian hết hạn sau khi reset mật khẩu
        user.resetPasswordOTP = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        return res.status(200).json({ status: 'OK', message: 'Đặt lại mật khẩu thành công' });
    } catch (e) {
        console.error(e);  // Để kiểm tra lỗi chi tiết trong console
        return res.status(500).json({ status: 'ERR', message: e.message });
    }
};

    // API update trạng thái đăng nhập
const updateLogoutStatus = async (req, res) => {
    try {
        const userId = req.params.id;

        // Kiểm tra đầu vào
        if (!userId) {
            return res.status(200).json({
                status: 'ERR',
                message: 'Thiếu userId'
            });
        }

        // Gọi service xử lý logout
        const result = await UserService.updateLogoutStatus(userId);
        return res.status(200).json(result);

    } catch (e) {
        return res.status(500).json({
            status: 'ERR',
            message: e.message || 'Lỗi hệ thống khi cập nhật trạng thái logout'
        });
    }
};

    // API chặn hoặc bỏ chặn người dùng
const blockUser = async (req, res) => {
    try {
        const { id } = req.params;
        const isBlocked = req.body.data;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'ERROR',
                message: 'ID người dùng không hợp lệ'
            });
        }

        const updatedUser = await User.findByIdAndUpdate(
            id,
            { isBlocked },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({
                status: 'ERROR',
                message: 'Không tìm thấy người dùng'
            });
        }

        return res.status(200).json({
            status: 'OK',
            message: isBlocked ? 'Đã chặn người dùng' : 'Đã bỏ chặn người dùng',
            data: updatedUser
        });
    } catch (e) {
        return res.status(500).json({
            status: 'ERROR',
            message: e.message
        });
    }
};


module.exports = {
    createUser,
    loginUser,
    updateUser,
    deleteUser,
    getAllUser,
    getDetailsUser,
    refreshToken,
    logoutUser,
    deleteManyUser,
    getUserEmail,
    forgotPassword,
    resetPassword,
    updateLogoutStatus,
    blockUser
}