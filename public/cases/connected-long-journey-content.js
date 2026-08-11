(() => {
  const STORAGE_KEY = "chang-li-portfolio-language";

  const locales = {
    zh: {
      meta: {
        lang: "zh-CN",
        title: "Connected on a Long Journey｜产品体验与服务设计",
        description: "面向长期在外的货车司机及其家庭，通过异步沟通、亲子互动和线下社区支持，探索长期分离中的家庭连接体验。",
      },
      language: { label: "切换案例语言" },
      viewer: { open: "查看高清大图", close: "关闭大图" },
      nav: { ariaLabel: "案例导航", back: "返回项目", overview: "概览", research: "研究", system: "系统方案", reflection: "反思" },
      hero: {
        type: "产品体验设计｜服务设计｜家庭支持",
        summary: "为长期在外的货车司机家庭设计持续、低负担的情感连接体验。",
        imageAlt: "Connected on a Long Journey 原始项目中的家庭工作坊与App概念界面",
        imageCaption: "原始项目画面：数字产品概念与线下家庭工作坊。",
        meta: [
          { label: "我的角色", value: "产品体验设计 / 服务设计 / UI概念设计" },
          { label: "项目周期", value: "2024年9月—2024年11月" },
          { label: "项目性质", value: "个人学术项目" },
          { label: "用户", value: "长期货车司机、配偶、子女及社区支持者" },
          { label: "交付内容", value: "App概念、用户流程、线下工作坊、服务蓝图", wide: true },
        ],
      },
      overview: {
        eyebrow: "01 / 项目概览",
        title: "一个连接数字沟通、亲子互动与线下支持的产品服务系统。",
        body: "Connected on a Long Journey 面向长期在外的货车司机及其家庭。项目将异步家庭沟通、亲子互动任务、家庭协作和社区工作坊组织为一套概念系统，用于回应长期分离中的沟通中断、情绪表达困难与家庭支持缺口。",
        cards: [
          { title: "核心对象", text: "货车司机、配偶、子女，以及能够提供本地支持的社区角色。" },
          { title: "核心挑战", text: "作息不一致、驾驶安全限制和长期缺席，使实时沟通难以稳定发生。" },
          { title: "设计范围", text: "移动端概念、家庭互动流程、线下工作坊与服务蓝图。" },
          { title: "项目状态", text: "2024年学术概念项目，未上线，也未完成正式可用性与长期影响验证。" },
        ],
      },
      context: {
        eyebrow: "02 / 背景与挑战",
        title: "长期分离不是一次旅程中的无聊，而是一种持续存在的家庭关系挑战。",
        statement: "司机需要持续在道路和城市之间工作，但家庭生活仍在另一端不断发生。",
        body: "驾驶时间、休息安排和家庭作息不一致，使实时沟通难以稳定发生。司机可能错过家庭日常与子女成长，配偶需要独自承担更多家庭事务，子女也难以理解父亲长期缺席的原因。设计机会不是要求家庭更频繁地同时在线，而是建立安全、低负担且可持续的连接方式。",
      },
      research: {
        eyebrow: "03 / 探索性研究",
        title: "从司机、配偶、子女和工作坊材料中理解长期分离。",
        intro: "原始展板记录了3名长期货车司机的探索性访谈，并保留了妻子与子女的访谈摘录、利益相关者分析以及线下家庭工作坊材料。",
        participantsLabel: "原始项目记录的研究对象",
        participants: ["3名长期货车司机", "配偶访谈摘录", "子女访谈摘录", "家庭工作坊参与者"],
        methodsLabel: "原始项目使用的方法",
        methods: ["半结构式访谈与情境提问", "多角色痛点和需求总结", "利益相关者地图", "线下故事分享与制作活动"],
        imageAlt: "原始展板中的货车司机访谈、家庭角色总结和利益相关者地图",
        imageCaption: "原始研究证据局部：3名司机访谈、多角色需求总结和利益相关者地图。页面没有采用展板中来源未标注的统计数字。",
        sourceSummary: "查看原始研究展板",
        limitLabel: "研究限制",
        limit: "原项目保留了访谈内容、照片和工作坊材料，但没有完整记录参与者招募方式、逐字稿、系统编码过程或完整样本规模。因此，这些内容只能作为探索性证据，而不是具有代表性的结论。",
      },
      insights: {
        eyebrow: "04 / 多角色洞察",
        title: "同一段长期分离，对不同家庭成员意味着不同的负担。",
        intro: "下列内容基于原展板中的Interview、Stakeholder Interview与Summary重新整理，没有加入新的虚构问题。",
        painLabel: "主要痛点",
        needLabel: "核心需求",
        roles: [
          { title: "司机", pains: ["长期缺席家庭日常", "驾驶、休息和家庭作息不一致", "难以及时表达情绪", "担心家庭问题但远程支持能力有限"], needs: ["不依赖同时在线的沟通方式", "低操作负担", "更自然地了解家庭日常", "在不影响驾驶安全的情况下参与家庭生活"] },
          { title: "配偶", pains: ["独自承担更多家务、育儿和突发事件", "缺少陪伴和情绪支持", "难以判断司机何时方便沟通", "容易感觉家庭责任分配不均"], needs: ["可异步表达和分享", "家庭任务协作", "本地社区或邻里支持", "被理解和被回应"] },
          { title: "子女", pains: ["父亲缺席重要时刻", "缺少稳定陪伴", "不理解父亲的工作环境", "实时视频往往短暂或难以持续"], needs: ["轻量的亲子互动", "了解父亲的工作和旅程", "留下父亲之后能够看到的内容", "获得持续而非偶发的回应"] },
        ],
      },
      challenge: { eyebrow: "05 / 核心设计挑战", title: "我们如何在不要求家庭成员同时在线、也不干扰司机安全驾驶的前提下，支持持续的家庭连接？" },
      principles: {
        eyebrow: "06 / 设计原则",
        title: "把安全、低负担和用户控制放在情感功能之前。",
        intro: "这些原则是对原始研究和方案的重新整理，用于说明设计判断，并不代表已经完成验证。",
        items: [
          { title: "异步优先", text: "沟通不依赖家庭成员同时在线，内容可以在合适的时间查看和回应。" },
          { title: "驾驶安全优先", text: "主要操作发生在停车、休息或非驾驶状态；驾驶状态不提供复杂交互。" },
          { title: "轻量且可选", text: "亲子任务和情感表达不能变成新的家庭作业或强制负担。" },
          { title: "数字与线下结合", text: "App无法独立解决家庭的全部问题，需要与工作坊和社区支持形成互补。" },
        ],
      },
      system: {
        eyebrow: "07 / 产品服务系统",
        title: "两层方案：数字产品支持日常连接，线下服务建立共同话题。",
        intro: "原项目同时设计了App概念与线下家庭工作坊。两者分别回应长期日常沟通和实体共同体验。",
        groups: [
          { badge: "数字产品", title: "Digital Product", text: "围绕异步分享、家庭协作和亲子互动组织核心功能。", items: [
            { name: "家庭动态与异步留言", note: "家人发布照片、文字或语音，司机在停车或休息时查看。" },
            { name: "情绪自我记录与选择性分享", note: "用户主动记录状态，并决定是否向家庭成员展示。" },
            { name: "家庭待办与任务协作", note: "减少家庭事务信息遗漏，支持责任协作。" },
            { name: "亲子互动任务与成长记录", note: "通过低负担任务形成持续互动和可回看的记录。" },
            { name: "家庭社区与活动信息", note: "连接其他家庭、工作坊和本地支持。" },
            { name: "AI Assistant概念", note: "2024概念探索，未进行技术实现或验证。" },
          ] },
          { badge: "线下服务", title: "Offline Service", text: "使用路线、地方物品和手工表达帮助家人理解司机工作并建立共享话题。", items: [
            { name: "Dad’s Journey故事分享", note: "通过路线地图和照片讲述司机的工作经历。" },
            { name: "地方特产展示", note: "用司机带回的地方物品连接旅途与家庭日常。" },
            { name: "手工明信片与感谢卡", note: "家庭成员通过文字和绘画表达想法。" },
            { name: "家庭工作坊", note: "为讨论工作、情绪与家庭角色提供实体触点。" },
          ] },
        ],
      },
      flows: {
        eyebrow: "08 / 关键产品流程",
        title: "用三条低负担路径连接家庭日常、亲子互动与支持需求。",
        intro: "这些流程仅使用原项目中已经存在的功能，不增加新的产品能力。",
        groups: [
          { title: "家庭异步分享", text: "让沟通从必须同时在线，转为可以在安全时间查看和回应。", steps: ["配偶或子女发布家庭动态、语音或照片", "司机在停车或休息时查看", "司机使用低负担方式回应", "内容沉淀为家庭记录"] },
          { title: "亲子互动任务", text: "用轻量任务支持持续参与，而不是追求高频实时视频。", steps: ["家庭创建轻量亲子任务", "子女完成任务或上传记录", "司机在非驾驶状态下给予反馈", "任务保留为成长记录"] },
          { title: "情绪与家庭任务支持", text: "将情绪表达和实际家庭协作放在同一套可控流程中。", steps: ["用户主动记录情绪或状态", "选择是否与家庭成员分享", "使用待办减少信息遗漏", "必要时连接社区交流或线下支持"] },
        ],
      },
      app: {
        eyebrow: "09 / App概念界面",
        title: "原始高保真概念覆盖配偶、子女与司机三类角色。",
        intro: "原展板展示了情绪管理、社区互动、家庭待办、亲子任务、时间提醒和概念性AI助手等界面。",
        status: "2024年原始概念项目，未上线，也未进行正式可用性测试；其中AI Assistant未进行技术实现或验证。",
        features: ["家庭待办", "社区互动", "亲子任务", "情绪记录", "时间提醒", "概念性 AI Assistant"],
        imageAlt: "Connected on a Long Journey 原始高保真App概念界面",
        imageCaption: "原始高保真局部：家庭待办、社区互动、亲子任务、情绪记录、时间提醒与概念性AI Assistant。",
        sourceSummary: "查看原始高保真概念展板",
      },
      workshop: {
        eyebrow: "10 / 线下工作坊证据",
        title: "让路线、地方物品和手工卡片成为谈论司机工作的媒介。",
        intro: "原项目实际组织并记录了三类线下活动。工作坊不能证明家庭关系已经改善，但提供了观察家庭如何讨论司机工作与表达感受的机会。",
        items: [
          { title: "Dad’s Journey故事分享", text: "使用路线地图、工作照片和地标，帮助家人了解司机在外工作的具体经历。" },
          { title: "地方特产展示", text: "家庭围绕司机从不同地区带回的物品分享旅途故事和记忆。" },
          { title: "Creating Postcards of Love", text: "参与者通过文字、绘画和明信片表达感谢、想念与鼓励。" },
        ],
        imageAlt: "原始项目中的家庭故事分享、地方特产展示和明信片制作工作坊",
        imageCaption: "原始工作坊记录：路线分享、地方物品交流、手工明信片与参与者产出。",
        sourceSummary: "查看原始工作坊证据展板",
      },
      blueprint: {
        eyebrow: "11 / 服务蓝图",
        title: "从日常App触点延伸到故事分享、地方物品与手工表达。",
        intro: "下表依据原始服务蓝图重建为可读结构，只保留原展板能够确认的阶段、触点与支持资源。",
        tableLabel: "Connected on a Long Journey 服务蓝图",
        stages: ["情绪管理", "增强归属感", "故事分享", "地方特产展示", "手工表达"],
        rows: [
          { label: "用户 / 家庭行为", cells: ["主动记录情绪并决定是否分享", "通过家庭任务、动态和留言保持联系", "使用路线地图和照片分享司机经历", "展示并讨论司机带回的地方物品", "制作明信片、卡片或绘画"] },
          { label: "数字或实体触点", cells: ["App", "App", "地图 / 工作坊", "地方特产", "明信片与绘画材料"] },
          { label: "前台服务", cells: ["App提供情绪状态与活动信息", "App支持司机与配偶、子女互动", "组织家庭成员进行路线和故事分享", "组织家庭成员分享地方物品背后的故事", "引导家庭成员通过卡片表达想法"] },
          { label: "后台活动", cells: ["记录状态并编辑活动信息", "设置和维护家庭日常任务", "整理场地并准备路线材料", "采购、运输与陈列相关物品", "布置和整理制作材料"] },
          { label: "支持资源", cells: ["数据记录与基础技术支持", "服务器与通信技术", "场地、地图和活动道具", "市场供应与物品来源", "明信片、绘画和制作材料"] },
        ],
        sourceSummary: "查看原始服务蓝图局部",
        sourceAlt: "原始展板中的Connected on a Long Journey服务蓝图",
        sourceCaption: "原始蓝图局部，网站正文使用HTML和CSS重建以提高可读性。",
      },
      output: {
        eyebrow: "12 / 项目产出",
        title: "这是概念产出，不是已经验证的社会影响。",
        items: [
          { title: "数字产品概念", text: "面向司机、配偶和子女的多角色App概念。" },
          { title: "三条核心流程", text: "异步分享、亲子任务和情绪 / 家庭任务支持。" },
          { title: "线下工作坊", text: "故事分享、地方物品展示与手工表达。" },
          { title: "服务蓝图", text: "连接数字产品、家庭行为、社区组织和实体资源。" },
        ],
      },
      reflection: {
        eyebrow: "13 / 反思与局限",
        title: "项目体现了多角色与线上线下触点的系统思考，也明确了下一轮在安全、隐私和验证方面需要完成的工作。",
        body: "原项目最有价值的部分，是把司机、配偶、子女和社区支持放进同一套服务系统，并通过真实工作坊探索实体触点。下一轮需要把这些概念转化为可测试的核心任务，并邀请安全、隐私与运营相关角色共同评估。",
        limitationsTitle: "需要进一步验证的关键问题",
        limitations: ["研究样本和研究记录有限", "App概念尚未进行正式可用性测试", "驾驶状态安全与交互限制需要专业验证", "家庭内容的权限、同意与删除机制仍需完善", "工作坊运营方式与概念性AI Assistant均未完成验证"],
        nextTitle: "下一步验证",
        next: ["分别与司机、配偶和子女进行任务测试", "验证停车和休息状态下的核心操作", "测试异步留言、亲子任务和家庭隐私设置", "与物流公司、社区组织者和安全专家评估运营可行性"],
      },
      next: { title: "返回 Quiet Fitness Cabin", subtitle: "查看低压力健身产品服务系统案例" },
    },
    en: {
      meta: { lang: "en", title: "Connected on a Long Journey | Product Experience and Service Design", description: "A product-service concept supporting long-haul truck drivers and their families through asynchronous communication, parent-child interaction and offline community support." },
      language: { label: "Switch case study language" },
      viewer: { open: "View HD detail", close: "Close full detail" },
      nav: { ariaLabel: "Case study navigation", back: "Back to work", overview: "Overview", research: "Research", system: "System", reflection: "Reflection" },
      hero: {
        type: "Product Experience | Service Design | Family Support",
        summary: "Designing continuous, low-burden family connection for long-haul truck drivers and their families.",
        imageAlt: "Family workshop and app concept from the original Connected on a Long Journey project",
        imageCaption: "Original project material: digital concept and offline family workshop.",
        meta: [
          { label: "Role", value: "Product Experience Design / Service Design / UI Concept" },
          { label: "Timeline", value: "Sep 2024 - Nov 2024" },
          { label: "Context", value: "Individual Academic Project" },
          { label: "Users", value: "Long-haul drivers, spouses, children and community supporters" },
          { label: "Outputs", value: "Mobile app concept, user flows, offline workshop and service blueprint", wide: true },
        ],
      },
      overview: {
        eyebrow: "01 / Overview",
        title: "A product-service system connecting digital communication, parent-child interaction and offline support.",
        body: "Connected on a Long Journey addresses prolonged separation between long-haul truck drivers and their families. The concept brings asynchronous family communication, parent-child tasks, household coordination and community workshops into one system to respond to communication gaps, emotional expression and local support needs.",
        cards: [
          { title: "Primary users", text: "Truck drivers, spouses, children and community roles able to provide local support." },
          { title: "Core challenge", text: "Different schedules and driving-safety constraints make reliable real-time communication difficult." },
          { title: "Design scope", text: "Mobile concept, family interaction flows, offline workshop and service blueprint." },
          { title: "Project status", text: "A 2024 academic concept. It was not launched or formally validated for usability or long-term impact." },
        ],
      },
      context: {
        eyebrow: "02 / Context and Challenge",
        title: "Prolonged separation is not a travel inconvenience. It is an ongoing family relationship challenge.",
        statement: "Drivers keep moving between roads and cities while family life continues at home.",
        body: "Driving hours, rest schedules and family routines rarely align. Drivers can miss everyday family life and children’s development, spouses carry more household responsibility, and children may not understand why their father is absent. The opportunity is not to force more real-time contact, but to create safer, lower-burden and more continuous ways to stay connected.",
      },
      research: {
        eyebrow: "03 / Exploratory Research",
        title: "Understanding prolonged separation through drivers, family members and workshop material.",
        intro: "The original board documents exploratory interviews with three long-haul truck drivers, excerpts from spouses and children, stakeholder analysis and an offline family workshop.",
        participantsLabel: "Documented participants and evidence",
        participants: ["Three long-haul truck drivers", "Interview excerpts from spouses", "Interview excerpts from children", "Family workshop participants"],
        methodsLabel: "Methods documented in the original project",
        methods: ["Semi-structured interviews and contextual questions", "Multi-role pain-point and needs summary", "Stakeholder mapping", "Offline story-sharing and making activities"],
        imageAlt: "Truck-driver interviews, multi-role summary and stakeholder map from the original project board",
        imageCaption: "Original evidence: three driver interviews, multi-role needs and stakeholder mapping. Unsupported statistics from the board are not used on this page.",
        sourceSummary: "View the original research board",
        limitLabel: "Research limitation",
        limit: "The original project preserves interview content, photographs and workshop material, but does not fully document recruitment, transcripts, systematic coding or the complete sample size. The findings are therefore presented as exploratory evidence rather than representative conclusions.",
      },
      insights: {
        eyebrow: "04 / Multi-role Insights",
        title: "The same prolonged separation creates different burdens for each family member.",
        intro: "The following points were reorganised from the original Interview, Stakeholder Interview and Summary sections without adding new user problems.",
        painLabel: "Key pain points", needLabel: "Core needs",
        roles: [
          { title: "Driver", pains: ["Absence from everyday family life", "Driving, rest and family routines do not align", "Difficulty expressing emotion in time", "Concern about family problems with limited ability to help remotely"], needs: ["Communication that does not require everyone online", "Low interaction burden", "A natural view of everyday family life", "Participation without compromising driving safety"] },
          { title: "Spouse", pains: ["More household, childcare and emergency responsibility", "Limited companionship and emotional support", "Uncertainty about when the driver is available", "A sense of unequal family responsibility"], needs: ["Asynchronous sharing", "Household task coordination", "Local community support", "Being understood and acknowledged"] },
          { title: "Children", pains: ["Father misses important moments", "Limited consistent companionship", "Little understanding of the father’s work context", "Real-time video is often brief or unreliable"], needs: ["Lightweight parent-child interaction", "Understanding the father’s work and routes", "Leaving content the father can view later", "Continuous rather than occasional response"] },
        ],
      },
      challenge: { eyebrow: "05 / Design Challenge", title: "How might we support continuous family connection without requiring everyone to be online at the same time or distracting drivers while they are driving?" },
      principles: {
        eyebrow: "06 / Design Principles", title: "Safety, low burden and user control come before emotional features.", intro: "These principles reorganise the original research and concept into explicit design decisions. They have not been fully validated.",
        items: [
          { title: "Asynchronous first", text: "Communication can be viewed and answered at an appropriate time rather than requiring simultaneous availability." },
          { title: "Driving safety first", text: "Core interaction happens while parked, resting or otherwise not driving; no complex controls are designed for active driving." },
          { title: "Lightweight and optional", text: "Parent-child tasks and emotional expression should not become another obligation." },
          { title: "Digital plus offline", text: "The app cannot solve every family need and must be complemented by workshops and community support." },
        ],
      },
      system: {
        eyebrow: "07 / Product-service System", title: "Two layers: a digital product for everyday connection and offline services for shared topics.", intro: "The original project combines an app concept with an offline family workshop, addressing daily communication and embodied shared experience.",
        groups: [
          { badge: "Digital product", title: "Digital Product", text: "Core functions support asynchronous sharing, family coordination and parent-child interaction.", items: [
            { name: "Family updates and asynchronous messages", note: "Family members post photos, text or voice; drivers review them while parked or resting." },
            { name: "Self-recorded emotion and selective sharing", note: "Users record their own state and choose whether to share it." },
            { name: "Household to-do and coordination", note: "Supports practical coordination and reduces missed information." },
            { name: "Parent-child tasks and growth records", note: "Lightweight tasks create ongoing interaction and a record to revisit." },
            { name: "Family community and activity information", note: "Connects families to workshops and local support." },
            { name: "AI Assistant concept", note: "A 2024 concept exploration; not technically implemented or validated." },
          ] },
          { badge: "Offline service", title: "Offline Service", text: "Routes, local objects and handmade expression help families understand the driver’s work and create shared topics.", items: [
            { name: "Dad’s Journey story sharing", note: "Maps and photographs support discussion of the driver’s work." },
            { name: "Local-specialty display", note: "Objects brought home connect road journeys with family life." },
            { name: "Handmade postcards and gratitude cards", note: "Family members express thoughts through writing and drawing." },
            { name: "Family workshop", note: "A physical touchpoint for discussing work, emotion and family roles." },
          ] },
        ],
      },
      flows: {
        eyebrow: "08 / Key Product Flows", title: "Three low-burden paths connect everyday updates, parent-child interaction and support needs.", intro: "The flows use only functions documented in the original project.",
        groups: [
          { title: "Asynchronous family sharing", text: "Communication shifts from simultaneous availability to safe-time review and response.", steps: ["A spouse or child posts an update, voice message or photo", "The driver reviews it while parked or resting", "The driver responds with a low-burden action", "The content becomes part of the family record"] },
          { title: "Parent-child interaction task", text: "Lightweight tasks support continuous participation instead of depending on frequent live video.", steps: ["The family creates a simple parent-child task", "The child completes or uploads the task", "The driver responds while not driving", "The task is retained as a growth record"] },
          { title: "Emotion and household support", text: "Emotional expression and practical household coordination sit within one controllable flow.", steps: ["A user records their own emotion or state", "They choose whether to share it", "Household to-dos reduce missed information", "Community or offline support is available when needed"] },
        ],
      },
      app: {
        eyebrow: "09 / App Concept", title: "The original high-fidelity concept addresses spouses, children and drivers.", intro: "The board includes emotion management, community interaction, household to-dos, parent-child tasks, time reminders and a conceptual AI assistant.", status: "Original 2024 concept project; not launched and not formally usability tested. The AI Assistant was not technically implemented or validated.", features: ["Household to-dos", "Community interaction", "Parent-child tasks", "Emotion records", "Time reminders", "Conceptual AI Assistant"], imageAlt: "Original high-fidelity app concept for Connected on a Long Journey", imageCaption: "Original high-fidelity detail: family to-dos, community interaction, parent-child tasks, emotion records, time reminders and a conceptual AI Assistant.", sourceSummary: "View the original high-fidelity concept board",
      },
      workshop: {
        eyebrow: "10 / Workshop Evidence", title: "Routes, local objects and handmade cards became prompts for discussing the driver’s work.", intro: "The original project organised and documented three offline activities. The workshop does not prove improved family relationships, but it created an opportunity to observe how families discussed work and expressed feelings.",
        items: [
          { title: "Dad’s Journey story sharing", text: "Route maps, work photographs and landmarks helped family members understand the driver’s work context." },
          { title: "Local-specialty display", text: "Families used objects brought back from different places to share road stories and memories." },
          { title: "Creating Postcards of Love", text: "Participants expressed gratitude, missing and encouragement through writing, drawing and postcards." },
        ],
        imageAlt: "Family story sharing, local-specialty display and postcard-making workshop from the original project", imageCaption: "Original workshop record: route sharing, local objects, handmade postcards and participant outputs.", sourceSummary: "View the original workshop evidence board",
      },
      blueprint: {
        eyebrow: "11 / Service Blueprint", title: "The service moves from everyday app touchpoints to story sharing, local objects and handmade expression.", intro: "The table reconstructs the original blueprint for readability and keeps only stages, touchpoints and resources that can be confirmed from the source board.", tableLabel: "Connected on a Long Journey service blueprint",
        stages: ["Emotion management", "Sense of belonging", "Story sharing", "Local-specialty display", "Handmade expression"],
        rows: [
          { label: "User / family actions", cells: ["Record emotion and choose whether to share", "Use family tasks, updates and messages to stay connected", "Share driver routes and work stories with maps and photos", "Display and discuss local objects brought home", "Create postcards, cards or drawings"] },
          { label: "Digital or physical touchpoints", cells: ["App", "App", "Map / workshop", "Local objects", "Postcards and art materials"] },
          { label: "Front-stage service", cells: ["The app presents emotion and activity information", "The app supports interaction with spouses and children", "Organisers facilitate route and story sharing", "Organisers facilitate stories behind local objects", "Organisers guide family members in expressing thoughts"] },
          { label: "Back-stage activity", cells: ["Record status and edit activity information", "Set and maintain daily family tasks", "Prepare the venue and route material", "Purchase, transport and display objects", "Place and organise making materials"] },
          { label: "Support resources", cells: ["Data records and basic technical support", "Server and communication technology", "Venue, maps and workshop props", "Market supply and object sources", "Postcards, drawing and making materials"] },
        ],
        sourceSummary: "View the original blueprint detail", sourceAlt: "Original Connected on a Long Journey service blueprint", sourceCaption: "Original blueprint detail. The main page rebuilds it in HTML and CSS for readability.",
      },
      output: {
        eyebrow: "12 / Concept Output", title: "These are project outputs, not validated social outcomes.",
        items: [
          { title: "Digital product concept", text: "A multi-role app concept for drivers, spouses and children." },
          { title: "Three core flows", text: "Asynchronous sharing, parent-child tasks, and emotion / household support." },
          { title: "Offline workshop", text: "Story sharing, local-object display and handmade expression." },
          { title: "Service blueprint", text: "A system connecting digital products, family actions, community organisation and physical resources." },
        ],
      },
      reflection: {
        eyebrow: "13 / Reflection and Limitations", title: "The project demonstrates system thinking and defines the validation required for a safer, more responsible next iteration.", body: "The strongest part of the original project is placing drivers, spouses, children and community support within one service system, supported by a documented workshop. The next iteration should turn these concepts into testable core tasks and involve safety, privacy and operational stakeholders in the evaluation.",
        limitationsTitle: "Key questions requiring further validation", limitations: ["The research sample and documentation were limited", "The app concept did not receive formal usability testing", "Driving-state safety and interaction restrictions require specialist validation", "Permissions, consent and deletion controls for family content remain unresolved", "Workshop operations and the conceptual AI Assistant were not validated"],
        nextTitle: "Next validation steps", next: ["Run separate task tests with drivers, spouses and children", "Validate core actions while parked or resting", "Test asynchronous messages, parent-child tasks and family privacy settings", "Assess operational feasibility with logistics companies, community organisers and safety specialists"],
      },
      next: { title: "Back to Quiet Fitness Cabin", subtitle: "View the low-pressure fitness product-service case study" },
    },
  };

  const get = (obj, path) => path.split(".").reduce((value, key) => value?.[key], obj);
  const escapeHtml = (value) => String(value).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));

  function renderList(id, items) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  }

  function renderCards(id, items) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = items.map((item, index) => `<article class="connected-card"><span class="number">${String(index + 1).padStart(2, "0")}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></article>`).join("");
  }

  function render(locale) {
    const source = locales[locale];
    document.documentElement.lang = source.meta.lang;
    document.title = source.meta.title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.content = source.meta.description;

    document.querySelectorAll("[data-copy]").forEach((el) => {
      const value = get(source, el.dataset.copy);
      if (typeof value === "string") el.textContent = value;
    });
    document.querySelectorAll("[data-copy-alt]").forEach((el) => {
      const value = get(source, el.dataset.copyAlt);
      if (typeof value === "string") el.alt = value;
    });
    document.querySelectorAll("[data-copy-aria]").forEach((el) => {
      const value = get(source, el.dataset.copyAria);
      if (typeof value === "string") el.setAttribute("aria-label", value);
    });
    document.querySelectorAll("[data-lightbox] img").forEach((image) => image.setAttribute("aria-label", source.viewer.open));

    const heroMeta = document.getElementById("hero-meta");
    heroMeta.innerHTML = source.hero.meta.map((item) => `<div class="${item.wide ? "wide" : ""}"><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.value)}</span></div>`).join("");

    const overview = document.getElementById("overview-cards");
    overview.innerHTML = source.overview.cards.map((item) => `<article><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></article>`).join("");

    renderList("research-participants", source.research.participants);
    renderList("research-methods", source.research.methods);

    const roleInsights = document.getElementById("role-insights");
    roleInsights.innerHTML = source.insights.roles.map((role, index) => `<article class="connected-role-card"><span class="connected-role-card__index">${String(index + 1).padStart(2, "0")}</span><h3>${escapeHtml(role.title)}</h3><h4>${escapeHtml(source.insights.painLabel)}</h4><ul>${role.pains.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul><h4>${escapeHtml(source.insights.needLabel)}</h4><ul>${role.needs.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article>`).join("");

    renderCards("principle-cards", source.principles.items);

    const system = document.getElementById("system-groups");
    system.innerHTML = source.system.groups.map((group) => `<article class="connected-system-group"><span>${escapeHtml(group.badge)}</span><h3>${escapeHtml(group.title)}</h3><p>${escapeHtml(group.text)}</p><ul>${group.items.map((item) => `<li><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.note)}</small></li>`).join("")}</ul></article>`).join("");

    const flows = document.getElementById("flow-groups");
    flows.innerHTML = source.flows.groups.map((group) => `<article class="connected-flow-group"><h3>${escapeHtml(group.title)}</h3><p>${escapeHtml(group.text)}</p><div class="connected-flow-steps">${group.steps.map((step, index) => `<div class="connected-flow-step"><span>${index + 1}</span><strong>${escapeHtml(step)}</strong></div>`).join("")}</div></article>`).join("");

    const appFeatureSummary = document.getElementById("app-feature-summary");
    if (appFeatureSummary) {
      appFeatureSummary.innerHTML = source.app.features
        .map((item, index) => `<article><span>${String(index + 1).padStart(2, "0")}</span><h3>${escapeHtml(item)}</h3></article>`)
        .join("");
    }

    renderCards("workshop-cards", source.workshop.items);

    const blueprint = document.getElementById("blueprint-table");
    const headerCells = [`<div class="connected-blueprint-cell header"></div>`, ...source.blueprint.stages.map((stage) => `<div class="connected-blueprint-cell header">${escapeHtml(stage)}</div>`)].join("");
    const rowCells = source.blueprint.rows.map((row) => `<div class="connected-blueprint-cell row-label">${escapeHtml(row.label)}</div>${row.cells.map((cell) => `<div class="connected-blueprint-cell">${escapeHtml(cell)}</div>`).join("")}`).join("");
    blueprint.innerHTML = headerCells + rowCells;

    renderCards("output-cards", source.output.items);
    renderList("reflection-limitations", source.reflection.limitations);
    renderList("reflection-next", source.reflection.next);

    document.querySelectorAll("[data-language]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.language === locale)));
    try { localStorage.setItem(STORAGE_KEY, locale); } catch {}
  }

  const lightbox = document.getElementById("connected-lightbox");
  const lightboxImage = document.getElementById("connected-lightbox-image");
  const lightboxCaption = document.getElementById("connected-lightbox-caption");

  document.querySelectorAll("[data-lightbox]").forEach((figure) => {
    const trigger = figure.querySelector(".connected-view-detail");
    const image = figure.querySelector("img");
    const caption = figure.querySelector("figcaption");
    if (!trigger || !image || !lightbox || !lightboxImage || !lightboxCaption) return;

    const openLightbox = () => {
      const inlineSrc = image.currentSrc || image.src;
      const hdSrc = image.dataset.fullSrc || (inlineSrc.includes("/full/")
        ? inlineSrc
        : inlineSrc.replace(
            "/assets/connected-long-journey/",
            "/assets/connected-long-journey/full/"
          ));
      lightboxImage.onerror = () => {
        lightboxImage.onerror = null;
        lightboxImage.src = inlineSrc;
      };
      lightboxImage.src = hdSrc;
      lightboxImage.alt = image.alt;
      lightboxCaption.textContent = caption?.textContent || image.alt;
      lightbox.showModal();
    };

    trigger.addEventListener("click", openLightbox);
    image.addEventListener("click", openLightbox);
    image.tabIndex = 0;
    image.setAttribute("role", "button");
    image.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openLightbox();
      }
    });
  });

  document.querySelector("[data-lightbox-close]")?.addEventListener("click", () => lightbox?.close());
  lightbox?.addEventListener("click", (event) => {
    if (event.target === lightbox) lightbox.close();
  });

  document.querySelectorAll("[data-language]").forEach((button) => button.addEventListener("click", () => render(button.dataset.language)));
  let initial = "zh";
  try { initial = localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "zh"; } catch {}
  render(initial);
})();
