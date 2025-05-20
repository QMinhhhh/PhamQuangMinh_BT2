# NFT Viewer - BASE Mainnet

Ứng dụng Node.js để xem các NFT từ một địa chỉ ví trên mạng BASE Mainnet.

## Tính năng

- Nhập địa chỉ ví và xem danh sách NFT
- Hiển thị thông tin NFT bao gồm hình ảnh, tên và mô tả
- Giao diện thân thiện, dễ sử dụng
- Xử lý lỗi cơ bản
- API endpoint để lấy thông tin NFT

## Yêu cầu hệ thống

- Node.js (phiên bản 14.0.0 trở lên)
- npm (Node Package Manager)

## Cài đặt

1. **Clone hoặc tải về dự án**

2. **Cài đặt các dependencies**
   ```bash
   npm install
   ```

3. **Cấu hình môi trường**
   - Tạo file `.env` từ file mẫu và cấu hình port (tùy chọn):
     ```env
     PORT=3000
     ```
   
   Lưu ý: Ứng dụng sử dụng Base Chain official RPC endpoint (mainnet.base.org) để kết nối với mạng BASE. Không cần cấu hình thêm API key, nhưng có thể mất nhiều thời gian hơn để kết nối do tải mạng cao.

## Chạy ứng dụng

1. **Khởi động server**
   ```bash
   npm start
   ```
   Hoặc chạy trong chế độ development với nodemon:
   ```bash
   npm run dev
   ```

2. **Truy cập ứng dụng**
   - Mở trình duyệt web
   - Truy cập `http://localhost:3000`

## Cấu trúc dự án

```
├── server.js      # File server Node.js chính
├── index.html     # Giao diện người dùng
├── styles.css     # File CSS cho giao diện
├── app.js         # File JavaScript phía client
├── package.json   # Cấu hình dự án và dependencies
├── .env           # File cấu hình môi trường
└── README.md      # Hướng dẫn sử dụng
```

## Giải thích code

### 1. Server (server.js)
- Sử dụng Express.js để tạo server
- Cung cấp API endpoint `/api/nfts/:walletAddress`
- Sử dụng ethers.js để tương tác với blockchain
- Xử lý lỗi và trả về dữ liệu dạng JSON

### 2. Client (app.js)
- Xử lý tương tác người dùng
- Gọi API để lấy thông tin NFT
- Hiển thị dữ liệu và thông báo lỗi

### 3. Giao diện (index.html, styles.css)
- Sử dụng Bootstrap cho layout responsive
- Tùy chỉnh CSS cho giao diện thân thiện
- Hiệu ứng loading và thông báo

## Lưu ý

- Đảm bảo có kết nối internet để tải các thư viện và tương tác với blockchain
- API Key cần được bảo mật, không chia sẻ công khai
- Một số NFT có thể không hiển thị được hình ảnh do metadata không hợp lệ

## Tài nguyên tham khảo

- [Express.js Documentation](https://expressjs.com/)
- [ethers.js Documentation](https://docs.ethers.io/)
- [Alchemy Documentation](https://docs.alchemy.com/)
- [Bootstrap Documentation](https://getbootstrap.com/docs/)