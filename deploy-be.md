# 🧠 Setup Backend – Leap AI (Encore)

## **B1️⃣ Xóa file cũ**
Xóa các file sau trong dự án tổng (nếu tồn tại):
```
package.json
node_modules/
```

---

## **B2️⃣ Tạo file `infra.json`** trong thư mục **Backend**
```json
{
  "$schema": "https://encore.dev/schemas/infra.schema.json",
  "metadata": {
    "app_id": "crm-itc-final-kcgi",       // ID của dự án
    "env_name": "production",
    "env_type": "production",
    "base_url": "http://api.taxnet.cloud"
  },
  "sql_servers": [
    {
      "host": "finalcrm-db:5432",         // trùng với host khai báo trong docker-compose
      "databases": {
        "crm_db": {                       // trùng với tên database dùng trong dự án
          "username": "postgres",
          "password": "123456aA@"
        }
      }
    }
  ]
}
```

---

## **B3️⃣ Build Docker image**
Tại thư mục **backend**, chạy lệnh:
```bash
encore build docker --config infra.json finalcrm_backend
```

---

## **B4️⃣ Tạo file `docker-compose.yml`** trong dự án tổng
```yaml
version: "3.9"

services:
  crm_db:
    image: postgres:15
    container_name: finalcrm-db
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: "123456aA@"
      POSTGRES_DB: crm_db            # khớp với infra.json & code Encore
    volumes:
      - db_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    image: finalcrm_backend          # build bằng lệnh 'encore build docker'
    container_name: finalcrm-backend
    restart: always
    depends_on:
      - crm_db
    ports:
      - "5000:8080"                  # Encore mặc định lắng nghe 8080

volumes:
  db_data:
```

---

## **B5️⃣ Chạy dự án**
```bash
docker compose up -d
```
→ Tự động khởi tạo container database và backend.

---

## **B6️⃣ Mở cổng (publish ports)**
```bash
sudo ufw allow 5000 5432
```

---

## **B7️⃣ Setup database**
Kết nối vào database bằng thông tin trong `docker-compose.yml`,  
sau đó **chạy tuần tự các file `.sql`** trong thư mục **`migration`** của backend.
