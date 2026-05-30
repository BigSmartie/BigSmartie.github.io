OK啊，我们也是顺利来到了第二期Agent的进化，第二期还是有很多改动的，也是目前为止持续最长时间的一版，亮点还是比较多的，呜呜呜呜呜学到的新知识更多了

## UI更新

呜呜呜呜呜我是一个前端呐！！！streamlit写的前端我是真的看到很头痛，所以，逼不得已我决定使用Vue3 + Vite重构一下，这一步也是很艰巨呢，因为我要把后端也改成FastAPI，这还是很耗费工夫的，但是也没什么说的

## Ollama

oki！！！这一点也是第二期最主要的一个变动，也是非常重要的一个变动。通过使用Ollama，我们摒弃了各大大模型厂商的API Key，拒绝消费，保留隐私，采用了由Ollama驱动的本地模型矩阵

那么什么是Ollama呢？它是一个“模型启动器”或“模型管家”：

- 在没有它之前，在本地跑大模型需要配置复杂的环境、安装各种驱动；

- 有了它，你只需要一行命令 `ollama run gemma2`，模型就跑起来了。它自动帮你管理显存分配（GPU）和内存调度（CPU）。

在第二期中，我采用了几个不同的模型：

- **逻辑大脑 (`gemma2` / `qwen2`)：** 专门负责理解问题，并调用工具。它们在中文理解和逻辑推理上非常出色。

- **视觉眼睛 (`qwen3-vl:8b`)：** 这是一类特殊的模型（Vision-Language Model），它能读懂像素。当上传图片时，系统会自动切到这个模型。

```python
# 以前连接云端
# llm = ChatOpenAI(api_key="sk-...", base_url="https://api.deepseek.com")

# 现在连接本地 Ollama
llm = ChatOpenAI(
    api_key="ollama", # 随便填，本地不需要校验
    base_url="http://localhost:11434/v1", # 指向你电脑自己的地址
    model="gemma2"
)
```

此外，使用Ollama还有一个优点，就是在后续的开发过程中，可以让我更好的去学习调参等等相关操作，在云端 API 模式下，模型就是一个黑盒，只能改改 `temperature`。但在 Ollama 体系下，你拥有了对模型的深度控制权。

虽然说 Ollama 本身不直接负责微调训练，但它是微调结果的最佳载体。

- 当我未来用自己的数据训练出一个 `adapter`或 `GGUF` 文件后，可以直接把它喂给 Ollama 运行。

- 这种 训练 -> 导出 -> Ollama 加载 的链路是目前本地 AI 开发者最主流的路径。

## 多模态 RAG 与视觉能力

在第二期的代码逻辑中，我们不再只是提取文字，而是通过**描述即向量**的技术路线，打通了视觉和文字的壁垒。

#### 文档入库时的“视觉扫描”

当你上传一份带图表的 PDF 时，后台会发生以下连锁反应：

- **图像剥离：** 系统会自动检测并提取出文档里的所有插图、架构图。

- **视觉理解（AI 看图）：** 调用本地的 `qwen3-vl:8b` 模型对每一张图进行“深度侧写”。它会写下：这是一张显示了分布式系统负载均衡逻辑的流程图，包含 A、B、C 三个节点……

- **OCR 文本叠加：** 提取图片里的文字，防止遗漏关键数据。

```python
# 伪代码：处理PDF中的图片并存入Qdrant
def process_image_in_pdf(image_bytes,image_path):
    # 调用本地视觉模型(Ollama: qwen3-vl)
    # 我们把图片发给模型，问它：图里画了什么？
    description = vision_model.analyze(
        prompt="请详细描述这张图片的内容，包括文字、图表和逻辑关系。",
        image=image_bytes
    )

    # 构造Metadata
    # 这样以后搜索到文字时，能顺便把图片找出来显示
    metadata = {
        "source": image_path,
        "type": "image",
        "description": description  # 核心：把描述存进去
    }

    # 存入向量数据库（注意：我们是对描述文字进行向量化）
    vector_db.add_text(
        text=description, 
        metadata=metadata
    )
```

#### 语义注入：让图片也能被搜索

这是最聪明的一步：系统把图片描述文字和原始图片路径一起塞进了向量数据库。

- **效果：** 当你问“那个关于负载均衡的图在哪？”时，由于数据库里存了图片的描述文字，系统能通过语义匹配精准地把那张图揪出来给你看。

```python
def handle_user_query_with_image(user_text,uploaded_image):
    # 视觉预处理：如果有图片，先让视觉模型把图片“翻译”成文字
    image_context = ""
    if uploaded_image:
        image_context = ollama.generate(
            model="qwen3-vl",
            prompt="识别图中的关键信息、报错代码或架构逻辑",
            images=[uploaded_image]
        )

    # 构造最终的Prompt给Gemma2，把视觉发现和用户问题组合在一起
    final_prompt = f"""
    用户的视觉证据：{image_context}
    用户的问题：{user_text}
    请结合上述视觉证据，给出专业的解决方案。
    """

    # 给出回答
    response = logic_model.chat(final_prompt)
    return response
```

#### 实时交互中的“拍照识图”

除了读 PDF 里的图，你在对话框直接粘贴一张截图，Agent 也能处理：

- **实时分析：** 它会先调用 `describe_image_with_ollama` 函数，把图片翻译成它能听懂的语言。

- **证据融合：** 比如你发了一张报错截图并问“怎么改？“，它会把图片里的报错信息和它的编程知识结合起来，给出最终答案。

```python
# 检索增强逻辑
query = "帮我解释一下那个负载均衡的架构图"

# 在 Qdrant 中搜索，因为搜索的是“描述”，所以会匹配到我们之前存入的图片描述
docs = vector_db.similarity_search(query)

# 后端返回给前端的数据结构，前端会根据type渲染图片标签
results = []
for doc in docs:
    if doc.metadata["type"] == "image":
        results.append({
            "answer": doc.page_content,
            "image_url": doc.metadata["source"] # 传回路径，前端直接显示图
        })
```

## 深度记忆系统与反思机制

在第一期，AI 就像患了短期记忆丧失症，每次聊天都是从零开始。第二期我们构建了一个分层记忆体系：

#### 用户画像

Agent 会在后台维护一个 `profile.json` 文件。它不是简单地存聊天记录，而是存关于你的**结构化结论**。

```python
# 每隔几轮对话，触发一次后台反思
def update_user_profile(chat_history):
    # 让大模型分析最近 10 条对话
    analysis = llm.analyze(f"根据以下对话，总结用户的偏好、职业、目前关注的技术点：{chat_history}")

    # 结果可能存入 profile.json:
    # {
    #   "name": "用户",
    #   "interests": ["Vue 3", "嵌入式开发", "Python 性能优化"],
    #   "style": "喜欢简洁、直接的代码示例，不喜欢长篇大论"
    # }
    save_to_json(analysis)
```

#### 反思机制

这是第二期最nb的操作。每当对话结束，后端FastAPI会利用异步任务开启一个反思进程。

- **它在想什么？** 刚才用户提到了一个新知识点吗？我要不要把它存入长期记忆？

- **为什么要这么做？** 这样可以防止聊天记录太长导致大模型断片，保留最有价值的内容。

#### 智慧提炼

Agent 能从海量废话中提炼出干货。比如你跟它聊了一下午代码 Bug，它最后会总结出一份该项目的常见坑点指南，并把这个指南存入向量数据库。下次如果说再问相关问题，它直接调取这个提炼好的智慧，而不是去翻几百页的原始记录。

## 推理链路可视化：ReAct 模式的“思考过程”

你在使用第二期系统时，一定发现模型回答前会先出一堆文字，甚至带有一个 `<thought>` 标签。这就是 **ReAct (Reasoning and Acting)** 框架。

- **第一期：** 提问 -> 检索 -> 回答（像抢答机器人）。

- **第二期：** 提问 -> **思考（Thought）** -> **行动（Action，如查搜索、读图）** -> **观察（Observation）** -> 最终回答。

```python
# Agent 的思考链条
prompt = """你现在拥有以下工具：搜索、天气、PDF 检索。当用户提问时，请按照以下格式思考：Thought: 我需要先做什么？Action: 调用某个工具Observation: 工具返回的结果...Final Answer: 最终结论"""
```

这种模式让 Agent 具备了拆解复杂任务的能力。比如你问：根据明天的天气推荐我该带哪份文档去出差？它会先查天气工具，再根据天气去搜你的知识库，最后给你建议。

oki，那么第二期的更新呢也就到这里，敬请期待第三期的Agent会变成什么样子捏~~我预计要为Agent接入MCP
