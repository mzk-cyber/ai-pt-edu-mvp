## AI 物理治疗师教育平台（MVP）

### 当前实现状态
- **后端**：FastAPI 已完成（病例库采样 + 证据表驱动检查结果 + 追问/检查上限 + 讲评评分 + Claude 可选接入）
- **前端**：需要安装 Node.js 后再生成 Next.js（本机当前未检测到 Node/npm）

### 1) 启动后端

```powershell
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.app.main:app --reload --port 8000
```

- Swagger: `http://127.0.0.1:8000/docs`
- Health: `http://127.0.0.1:8000/health`

### 2)（可选）配置 Claude

复制 `backend/.env.example` 为 `backend/.env`，填写 `ANTHROPIC_API_KEY`。

### 3) 前端准备（你需要先装 Node.js）

安装 Node.js LTS 后，确保在终端能运行：

```powershell
node -v
npm -v
```

### 4) 启动前端（Next.js）

```powershell
cd frontend
npm install
npm run dev
```

打开 `http://localhost:3000`。

如需修改后端地址，创建 `frontend/.env.local` 并设置：

```text
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000
```

