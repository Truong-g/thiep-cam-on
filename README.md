# Thư Gửi Dịu Dàng

Web thiệp cảm ơn cá nhân hóa, tối ưu cho điện thoại. Người quản trị duyệt template, chọn một mẫu cho từng người nhận, viết lời cảm ơn và tạo link riêng dạng `/c/<mã>`. Mỗi thiệp có phần mở đầu, lời thư, các chặng cuộn có hình và lời nhắn, cùng nhạc nền tùy chọn.

## Chạy cục bộ

```bash
npm install
cp .env.example .env.local
npm run dev
```

Mở `/admin` để xem bảng quản trị hoặc `/c/mai-anh` để mở thiệp mẫu. Khi chưa cấu hình Supabase, đây là chế độ xem thử: dữ liệu lưu trong trình duyệt hiện tại và link mới chỉ dùng được trên trình duyệt đó.

## Kết nối Supabase

1. Tạo một dự án Supabase và chạy toàn bộ `supabase/schema.sql` trong SQL Editor. Script tạo sẵn ba template đã duyệt và một bản nháp để bạn xem luồng duyệt.
2. Trong Auth, tắt đăng ký tự do; tạo riêng tài khoản email/mật khẩu cho quản trị viên.
3. Thêm UUID của tài khoản đó vào bảng `public.app_admins`:

   ```sql
   insert into public.app_admins (user_id)
   values ('UUID-TAI-KHOAN-QUAN-TRI');
   ```

4. Điền URL dự án, publishable key và email Auth tương ứng với username quản trị vào `.env.local`:

   ```dotenv
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   VITE_ADMIN_USERNAME=admin
   VITE_ADMIN_EMAIL=admin@example.com
   ```

   Đăng nhập chấp nhận username đã cấu hình (mặc định là `admin`) và mật khẩu Auth hiện tại. Mật khẩu không được lưu trong cấu hình frontend. Có thể tiếp tục đăng nhập bằng email để tương thích ngược.

5. Khởi động lại Vite. Đăng nhập ở `/admin`; ảnh và nhạc tải lên sẽ vào bucket `thankyou-assets`.

Nếu database đã được tạo trước đây, chạy thêm `supabase/migrations/20261101_recipient_photo.sql` trong SQL Editor để lưu và hiển thị ảnh riêng của người nhận.

Phiên quản trị được lưu trong `sessionStorage` của tab hiện tại nên vẫn còn sau khi tải lại trang. Đóng tab sẽ kết thúc phiên.

Không đưa `service_role` key vào trình duyệt. Các trang thiệp dùng RPC `get_thank_you_card` để chỉ đọc nội dung thiệp đã xuất bản theo mã link; các bảng quản trị được khóa bằng RLS và quyền admin.

## Công nghệ

- React 19 + Vite
- React Three Fiber 9 + Three.js cho lớp không gian 3D nhẹ
- Supabase Auth, Postgres, Storage
- SVG tự vẽ cho artwork mẫu; có thể thay bằng URL ảnh hoặc tải ảnh lên sau khi nối Supabase
