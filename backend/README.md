# Backend (FastAPI)

## Run

```powershell
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.app.main:app --reload --port 8000
```

Open API docs at `http://127.0.0.1:8000/docs`.

## AI 讲评（可选）

`/attempts/{id}/feedback` 会按顺序尝试：

1. **智谱 GLM**（若设置了 `ZHIPU_API_KEY`）
2. **Claude**（若设置了 `ANTHROPIC_API_KEY` 且智谱未返回内容）
3. **本地模板**（以上都没有或调用失败）

### 智谱 AI（推荐国内部署）

1. 复制 `backend/.env.example` 为 `backend/.env`（本地）或在 **Render → Environment** 添加变量。
2. 设置：
   - `ZHIPU_API_KEY` = 控制台里的 API Key
   - `ZHIPU_MODEL` = `glm-4-flash`（或你在控制台开通的模型名）

**不要**把真实 Key 提交到 GitHub。

### Claude (Anthropic) optional

在 `backend/.env` 或 Render 中设置 `ANTHROPIC_API_KEY`（可与智谱并存；配置了智谱时会优先用智谱）。

