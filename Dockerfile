FROM node:22-alpine

WORKDIR /app

# 複製依賴定義
COPY package*.json ./

# 安裝依賴（不更新 npm 本身，Node 22 內建版本已夠用）
RUN npm ci --omit=dev=false

# 複製所有原始碼
COPY . .

# 建置前端
RUN npm run build

# 暴露後端 port
EXPOSE 3001

# 啟動後端伺服器（生產模式直接 serve static + API）
CMD ["node", "server/index.js"]
