# Hướng dẫn Deploy Frontend

## 1. Build FE

- cd vào folder FE  
- Mở file `package.json` và đảm bảo có dòng:
  ```json
  "build": "vite build"
  ```
- Chạy lệnh:
  ```bash
  npm run build
  ```
- Sau khi build xong, copy nội dung trong thư mục `dist` vào thư mục web:
  ```bash
  sudo cp -r dist/* /var/www/hrm/
  ```

---

## 2. Cấu hình Nginx

- Thêm file **`taxnet.conf`** vào thư mục `/etc/nginx/sites-avaiable`:
  ```bash
  sudo nano /etc/nginx/sites-enabled/taxnet.conf
  ```

---

### Nội dung file `taxnet.conf`

```
server {
    listen 80;
    server_name taxnet.cloud;

    root /var/www/frontend; # Thư mục chứa build vừa xong
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    # Cache tĩnh (tùy chọn)
    location ~* \.(?:ico|css|js|gif|jpe?g|png|woff2?|eot|ttf|svg)$ {
        expires 6M;
        access_log off;
        add_header Cache-Control "public";
    }
}

server {
    listen 80;
    server_name api.taxnet.cloud;

    location / {
        proxy_pass http://127.0.0.1:5000; #port BE
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 3. Kiểm tra và khởi động lại Nginx

```bash
sudo nginx -t # Test file conf
sudo systemctl restart nginx
```
