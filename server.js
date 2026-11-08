require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// 从 .env 文件中读取 Key
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';

async function callAI(messages, systemPrompt = '') {
  const msgs = systemPrompt ? [{ role: 'system', content: systemPrompt }, ...messages] : messages;
  const res = await axios.post(
    DEEPSEEK_URL,
    { model: 'deepseek-chat', messages: msgs, temperature: 0.7 }, // deepseek-chat 是官方标准模型名
    { headers: { 'Authorization': `Bearer ${DEEPSEEK_KEY}`, 'Content-Type': 'application/json' }, timeout: 60000 }
  );
  return res.data.choices[0].message.content;
}

app.get('/api/config', (req, res) => res.json({ configured: true, model: 'deepseek-chat' }));

app.post('/api/polish', async (req, res) => {
  try {
    const system = `你是一位金融行业简历顾问。请用 STAR 法则改写经历，输出 Markdown，包含【情境】【任务】【行动】【结果】。`;
    const result = await callAI([{ role: 'user', content: req.body.text }], system);
    res.json({ result });
  } catch (e) {
    console.error("🚨 简历报错:", e.response?.data || e.message);
    res.status(500).json({ error: e.response?.data?.error?.message || e.message });
  }
});

app.post('/api/interview/evaluate', async (req, res) => {
  try {
    const system = `你是HRD。输出严格 JSON：{ "score": 80, "logic": 80, "expertise": 80, "composure": 80, "strengths": "亮点", "issues": "问题", "suggestion": "建议", "logic_reason": "原因", "expertise_reason": "原因", "composure_reason": "原因" }`;
    const raw = await callAI([{ role: 'user', content: req.body.answer }], system);
    let data; try { data = JSON.parse(raw.match(/\{[\s\S]*\}/)[0]); } catch { data = { score: 70, logic: 70, expertise: 70, composure: 70, strengths: '完整', issues: '细节不足', suggestion: '补充数据', logic_reason: '一般', expertise_reason: '一般', composure_reason: '一般' }; }
    res.json(data);
  } catch (e) {
    console.error("🚨 面试报错:", e.response?.data || e.message);
    res.status(500).json({ error: e.response?.data?.error?.message || e.message });
  }
});

app.post('/api/report/analyze', async (req, res) => {
  try {
    const system = `你是财务分析师。输出严格 JSON：{ "core_profit": "利润", "cash_flow_health": "现金流", "risk_index": 50, "risk_summary": "风险" }`;
    const raw = await callAI([{ role: 'user', content: req.body.text }], system);
    let data; try { data = JSON.parse(raw.match(/\{[\s\S]*\}/)[0]); } catch { data = { core_profit: '失败', cash_flow_health: '失败', risk_index: 50, risk_summary: '重试' }; }
    res.json(data);
  } catch (e) {
    console.error("🚨 财报报错:", e.response?.data || e.message);
    res.status(500).json({ error: e.response?.data?.error?.message || e.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ DeepSeek 服务已启动：端口 ${PORT}`);
});
