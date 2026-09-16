(() => {
  const STORAGE_KEY = "chang-li-portfolio-language";
  const ASSET_PATH = "/assets/quiet-fitness-cabin/";
  const APP_NORMALIZED_PATH = "/assets/quiet/app-normalized/";
  const APP_NORMALIZED_ASSETS = {
    "app-flow-01-needs.webp": "app-01.webp",
    "app-flow-02-expert-list.webp": "app-02.webp",
    "app-flow-03-match-confirmation.webp": "app-03.webp",
    "app-flow-04-venue-location.webp": "app-04.webp",
    "app-flow-05-expert-requests.webp": "app-05.webp",
  };
  const FULL_ASSET_PATH = `${ASSET_PATH}full/`;
  const FULL_ASSET_DIMENSIONS = {
    "spatial-system.webp": [4634, 2784],
    "modular-equipment.webp": [2640, 2496],
  };

  const locales = {
    zh: {
      meta: {
        lang: "zh-CN",
        title: "Quiet Fitness Cabin｜产品服务系统设计",
        description:
          "Quiet Fitness Cabin 产品服务系统设计案例，连接预约匹配、低密度训练空间、模块化器械与可选健身支持。",
      },
      language: { label: "切换案例语言" },
      viewer: { open: "查看高清大图", close: "关闭大图" },
      nav: {
        ariaLabel: "案例导航",
        back: "返回项目",
        overview: "概览",
        solution: "解决方案",
        reflection: "反思",
      },
      hero: {
        type: "产品服务系统设计｜App、空间与健身服务",
        summary:
          "面向在传统健身房中感到社交压力或不适的健身新手，通过预约匹配、低密度训练空间、模块化器械和可选指导，降低开始和持续训练过程中的心理压力。",
        imageAlt: "Quiet Fitness Cabin 低密度健身空间总体效果图",
        imageCaption: "总体空间效果图，来自原始 Fitness.pdf 展板。",
        meta: [
          { label: "我的角色", value: "UX设计 / 服务设计 / 空间体验" },
          { label: "项目周期", value: "2024.06–2024.09" },
          { label: "项目性质", value: "个人概念项目" },
          {
            label: "交付内容",
            value:
              "现场调研、用户旅程、服务系统、App流程与界面、模块化器械、空间概念、服务蓝图",
            wide: true,
          },
        ],
      },
      overview: {
        eyebrow: "01 / 项目概览",
        title: "一个连接数字产品、训练空间与健身服务的系统概念。",
        body:
          "Quiet Fitness Cabin 并非单一私人健身舱。项目以线上预约匹配为入口，将健身新手、经验者、线下场馆、模块化器械、洗浴预约与训练后补给组织为一套产品服务系统。",
        cards: [
          {
            title: "核心对象",
            text: "在传统健身房中感到社交压力或不适的健身新手，以及能够提供陪伴和经验支持的健身用户。",
          },
          { title: "核心路径", text: "需求设置—伙伴匹配—场地预约—线下训练—训练后服务。" },
          { title: "设计范围", text: "App、服务流程、低密度空间、模块化器械与服务蓝图。" },
          { title: "项目状态", text: "产品服务系统概念，未上线，也未完成工程与大样本验证。" },
        ],
      },
      context: {
        eyebrow: "02 / 背景与挑战",
        title: "传统健身房的压力来自整个训练旅程，而不只是空间本身。",
        statement:
          "被注视、不会使用器械、不敢求助、害怕独自训练和高人流，会共同放大开始健身的不确定感。",
        body:
          "原始项目同时关注两类用户：在传统健身房中感到社交压力或不适的用户，以及缺少伙伴、灵活场地与训练成就感的经验用户。设计机会在于让两类需求通过可选择的匹配和服务机制发生连接。",
      },
      research: {
        eyebrow: "03 / 探索性研究",
        title: "从场馆观察、情境访谈与竞品分析中理解训练压力。",
        intro:
          "原始展板记录了健身场馆现场观察、情境访谈与问题询问，以及竞品和市场分析。由于没有清楚记录参与者数量，本案例不填写研究人数。",
        subjectsLabel: "研究对象",
        subjects: [
          "健身爱好者 / 有经验的健身用户",
          "在传统健身房中感到社交压力或不适的用户",
        ],
        methodsLabel: "研究方式",
        methods: ["健身场馆现场观察", "情境访谈与开放式提问", "竞品与市场分析"],
        imageAlt: "原始展板中的健身场馆观察和访谈照片局部",
        imageCaption:
          "原始研究照片记录了两类用户在器械、场地、伙伴和求助方面的体验。页面未采用展板中来源不清的统计数字。",
        sourceSummary: "查看原始研究展板",
        evidence: [
          "不敢在遇到困难时向他人求助",
          "害怕被注视",
          "害怕独自训练",
          "器械复杂且存在技术门槛",
          "场地拥挤和高人流增加压力",
          "健身经验者也存在缺少成就感与伙伴的问题",
        ],
        limitLabel: "研究限制",
        limit:
          "原始项目保留了现场观察与访谈照片，但没有完整记录参与者数量、逐字访谈和系统化编码，因此本案例将这些发现视为探索性洞察，而非经过大样本验证的结论。",
      },
      insights: {
        eyebrow: "04 / 核心洞察",
        title: "初步洞察 / Preliminary Insights",
        intro: "这些是基于现场观察、访谈和旅程分析形成的探索性洞察。",
        badge: "探索性洞察",
        items: [
          "在传统健身房中感到社交压力或不适的用户，需要控制场地人数与自身暴露程度。",
          "器械复杂和不敢主动求助会放大第一次训练的不确定感。",
          "有经验用户需要伙伴、灵活场地和更明确的训练成就感。",
          "陪伴和指导必须是可选择的，否则可能产生新的社交压力。",
        ],
      },
      principles: {
        eyebrow: "05 / 设计原则",
        title: "用可预测、可控制和低压力组织服务体验。",
        intro: "这些原则用于回应当前探索性洞察，不代表已经完成验证。",
        items: [
          {
            title: "可预测",
            text: "用户在到达前了解伙伴、场地人数、设备状态和使用流程。",
          },
          {
            title: "可控制",
            text: "用户可以选择匹配对象、场地与是否获得经验者或工作人员支持。",
          },
          {
            title: "低压力",
            text: "减少公开犯错、主动向陌生人求助和进入高人流空间的时刻。",
          },
        ],
      },
      journey: {
        eyebrow: "06 / 用户旅程",
        title: "把原始旅程压缩为四个影响开始和持续训练的核心阶段。",
        intro:
          "下方原图作为研究证据，文字卡只提炼用户疑问、主要压力点与对应机会，避免重复展板内容。",
        questionLabel: "用户疑问",
        painLabel: "主要压力点",
        opportunityLabel: "对应机会",
        imageAlt: "原始展板中的健身用户旅程图",
        imageCaption: "原始用户旅程局部：训练前、训练中与训练后。",
        sourceSummary: "查看原始用户旅程展板",
        items: [
          {
            title: "寻找与进入",
            question: "环境是否友好、拥挤？我能否在到达前确认伙伴和场地？",
            pain: "高人流、陌生环境、独自进入和不熟悉器械会增加开始训练的压力。",
            opportunity: "提前展示场地人数、预约状态，并让用户自主选择是否匹配经验者。",
          },
          {
            title: "热身与使用器械",
            question: "动作与姿势是否正确？器械是否适合当前训练？",
            pain: "器械复杂、训练知识不足，又不愿在公开环境中主动求助。",
            opportunity: "提供模块化器械、清晰自助指导和可选工作人员支持。",
          },
          {
            title: "拉伸与可选社交",
            question: "拉伸是否正确？我是否需要与他人交流？",
            pain: "缺少伙伴和动力，但强制社交也可能形成新的压力。",
            opportunity: "将陪伴、拉伸指导和社交保持为可选项。",
          },
          {
            title: "洗浴与营养补充",
            question: "洗浴是否拥挤？补给是否适合身体？",
            pain: "被注视感延续到洗浴和公共补给区域，补给信息也不清晰。",
            opportunity: "提供洗浴预约、补给信息、营养建议和更安静的服务区域。",
          },
        ],
      },
      service: {
        eyebrow: "07 / 服务系统",
        title: "把方案拆成数字产品、空间设备和服务支持三个层面。",
        intro:
          "系统通过App完成匹配和预约，通过低密度空间与模块化器械承接训练，并由经验者和工作人员提供可选支持。",
        items: [
          {
            title: "数字产品",
            text: "需求设置、伙伴匹配、场地预约、器械与训练指导。",
          },
          {
            title: "空间和设备",
            text: "按人数与使用需求划分的低密度空间、模块化组合器械和专业补给区域。",
          },
          {
            title: "服务支持",
            text: "经验者陪伴、工作人员指导、洗浴预约和营养建议。",
          },
        ],
      },
      flow: {
        eyebrow: "08 / 关键流程",
        title: "用一条跨触点路径连接线上沟通与线下训练。",
        intro: "原始系统图和服务蓝图共同呈现了以下核心顺序。",
        items: [
          { title: "设置需求", text: "说明训练需求、时间和地点偏好。" },
          { title: "伙伴匹配", text: "查看经验者或同伴列表并建立线上沟通。" },
          { title: "预约场地", text: "确认伙伴、场馆位置和预约信息。" },
          { title: "线下训练", text: "进入低密度空间，使用器械并获得可选指导。" },
          { title: "训练后服务", text: "预约洗浴，查看补给信息并获得营养建议。" },
        ],
      },
      decisions: {
        eyebrow: "09 / 关键设计决策",
        title: "在降低社交压力、使用安全和运营可行性之间进行取舍。",
        intro: "三项决策聚焦第一次训练的核心路径，不扩展未经原始材料支持的结论。",
        reasonLabel: "依据",
        limitLabel: "取舍",
        items: [
          {
            title: "伙伴匹配必须是可选的",
            reason: "部分新手需要经验者指导，但强制匹配也可能形成新的社交压力。",
            limit:
              "允许用户独立训练会降低伙伴服务的使用率，因此系统仍需提供足够清晰的自助器械与训练指导。",
          },
          {
            title: "采用低密度分区，而不是完全封闭的私人健身舱",
            reason:
              "减少同时使用人数能够降低拥挤和被注视感，同时保留工作人员观察、安全支持和设备共享的可能。",
            limit:
              "低密度空间不能完全消除被他人看到的情况，但比完全封闭空间更具安全和运营弹性。",
          },
          {
            title: "围绕第一次训练连接App、空间和服务",
            reason:
              "用户的不确定感从寻找场地、预约和到达前就已经开始，并不只发生在训练过程中。",
            limit:
              "跨触点系统会增加实施复杂度，因此下一轮应优先验证“需求设置—伙伴匹配—场地预约—第一次训练”这一条路径。",
          },
        ],
      },
      app: {
        eyebrow: "10 / App Design / App设计",
        title: "用五个关键任务连接健身新手、经验者和线下场馆。",
        intro:
          "App围绕需求设置、伙伴匹配与场地预约展开，并分别展示新手和经验者侧的关键任务。",
        status: "2024年原始概念原型，用于验证服务流程，并非成熟上线UI。",
        flow: ["设置训练需求", "查看和选择经验者", "确认伙伴匹配", "预约训练场地", "查看场馆位置"],
        groups: [
          {
            title: "新手界面",
            items: [
              {
                src: "app-flow-01-needs.webp",
                title: "设置训练需求",
                text: "填写训练类型、时间和地点偏好，为后续匹配提供条件。",
                alt: "Quiet Fitness Cabin 新手训练需求设置界面",
              },
              {
                src: "app-flow-02-expert-list.webp",
                title: "查看和选择经验者",
                text: "浏览经验者列表，在主动发起联系前比较可见信息。",
                alt: "Quiet Fitness Cabin 经验者列表界面",
              },
              {
                src: "app-flow-03-match-confirmation.webp",
                title: "确认伙伴匹配",
                text: "查看已建立联系的伙伴，并决定是否进入下一步预约。",
                alt: "Quiet Fitness Cabin 伙伴匹配确认界面",
              },
              {
                src: "app-flow-04-venue-location.webp",
                title: "预约场地并查看位置",
                text: "选择场馆服务并通过地图确认训练地点。",
                alt: "Quiet Fitness Cabin 场馆预约与地图界面",
              },
            ],
          },
          {
            title: "经验者界面",
            items: [
              {
                src: "app-flow-05-expert-requests.webp",
                title: "处理伙伴预约",
                text: "经验者查看新手请求，并选择接受或暂不接受。",
                alt: "Quiet Fitness Cabin 经验者处理伙伴预约界面",
              },
            ],
          },
        ],
        iaSummary: "查看信息架构与早期线框",
        iaAlt: "Quiet Fitness Cabin App 信息架构和早期线框",
        iaCaption: "辅助材料：原始2024信息架构与低保真流程。图中沿用当时的“Social anxiety novices”标签；当前案例已改为更中性的“健身新手”定位。",
      },
      testing: {
        eyebrow: "11 / Low-fidelity Testing / 低保真测试",
        title: "测试中发现的问题与对应改进。",
        intro:
          "原始项目邀请健身用户体验低保真界面。材料没有记录测试人数、完成率或满意度，因此这里只呈现展板明确记录的问题与改进。",
        imageAlt: "健身用户体验Quiet Fitness Cabin低保真界面的现场照片与记录",
        imageCaption: "原始低保真测试照片与展板中的问题记录。",
        issueLabel: "发现的问题",
        improvementLabel: "对应改进",
        items: [
          {
            issue: "用户需要时间理解匹配和预约功能。",
            improvement: "强化匹配与预约的步骤关系，让核心流程更容易识别。",
          },
          {
            issue: "预约经验者的入口较分散。",
            improvement: "集中预约入口，减少在不同列表和页面之间寻找。",
          },
          {
            issue: "信息透明度不足。",
            improvement: "补充更清楚的用户、预约与状态信息，支持用户做出选择。",
          },
          {
            issue: "字体和图标较小，可见性不足。",
            improvement: "放大字体与图标，提高界面的可读性和操作可见性。",
          },
        ],
      },
      spatial: {
        eyebrow: "12 / Spatial and Equipment System / 空间与器械系统",
        title: "用人数分区和模块化器械降低拥挤与使用门槛。",
        intro:
          "空间通过人数和使用需求分区，降低拥挤与碰撞；模块化器械用于适应不同用户和训练需求。",
        evidence: [
          {
            src: "spatial-system.webp",
            title: "空间布局与使用场景",
            text: "包含场地草图、总体效果图、平面图、剖面图、预约验证和团体训练场景。",
            alt: "Quiet Fitness Cabin 场地草图、空间效果图、平面图和剖面图",
          },
          {
            src: "modular-equipment.webp",
            title: "模块化器械与连接结构",
            text: "原始展板展示两类组合器械草图，并以榫卯式结构表达部件之间的组合方式。",
            alt: "Quiet Fitness Cabin 模块化健身器械草图和榫卯式组合结构",
          },
        ],
        items: [
          {
            title: "入口与预约验证",
            text: "原始场景图展示入口设备进行预约验证，并连接随后发生的团体训练场景。",
          },
          {
            title: "安全与工作人员支持",
            text: "服务蓝图记录器械组装、训练和拉伸辅助；原材料未单独展示紧急支持设施。",
          },
          {
            title: "App与空间预约状态连接",
            text: "App原型包含场馆预约和地图，服务蓝图包含预约系统、实时通知与场馆预约。",
          },
        ],
        statusLabel: "概念状态",
        status:
          "场地、平面、剖面、器械和使用场景均来自原始项目表达；方案尚未完成工程、安全或运营验证。",
      },
      blueprint: {
        eyebrow: "13 / Service Blueprint / 服务蓝图",
        title: "将线上沟通、伙伴预约、线下健身和训练后补给串联起来。",
        intro:
          "蓝图把跨触点体验拆分为用户行为、前台服务、后台技术和支持流程。",
        stages: ["线上沟通", "伙伴预约", "线下健身", "训练后补给"],
        tableLabel: "简化服务蓝图，包含四个阶段和四条泳道",
        cornerLabel: "泳道 / 阶段",
        imageAlt: "Quiet Fitness Cabin 服务蓝图",
        imageCaption: "原始服务蓝图局部，展示从App到训练后补给的服务协作。",
        sourceSummary: "查看原始服务蓝图",
        rows: [
          {
            title: "用户行为",
            cells: [
              "设置需求，浏览伙伴并开始线上沟通。",
              "选择伙伴，确认预约与场馆。",
              "到场验证，使用器械并完成训练。",
              "预约洗浴，查看补给与营养信息。",
            ],
          },
          {
            title: "前台服务",
            cells: [
              "回应线上沟通并说明服务。",
              "确认伙伴和场地预约信息。",
              "提供器械、训练与拉伸支持。",
              "协助洗浴预约并提供营养建议。",
            ],
          },
          {
            title: "后台系统",
            cells: [
              "聊天与用户信息支持。",
              "预约系统与实时通知。",
              "器械信息与动作支持系统。",
              "洗浴预约与补给建议系统。",
            ],
          },
          {
            title: "支持流程",
            cells: [
              "平台内容与场馆合作维护。",
              "支付与预约流程管理。",
              "器械清洁、安装与定期检查。",
              "洗浴管理与补给区域维护。",
            ],
          },
        ],
      },
      business: {
        eyebrow: "附加材料",
        title: "商业画布 / Business Canvas",
        intro:
          "商业画布仅为概念阶段的系统范围探索，尚未完成市场或商业可行性验证。",
        imageAlt: "Quiet Fitness Cabin 原始商业画布",
        imageCaption: "原始商业画布局部，未经过商业可行性验证。",
      },
      outcome: {
        eyebrow: "14 / Design Outcome / 设计产出",
        title: "一套跨越App、空间、器械与服务的概念系统。",
        body:
          "完成了一个连接App、健身伙伴、低密度训练空间、模块化器械和运动后服务的产品服务系统概念。",
      },
      reflection: {
        eyebrow: "15 / Reflection / 反思",
        title: "缩小下一轮验证范围，先验证最关键的开始路径。",
        quote:
          "包容性健身体验不仅涉及空间能否进入，也涉及用户能否控制被注视、获得指导和参与社交的程度。",
        body1:
          "原项目覆盖了较多触点，但系统范围过大，使核心价值不够集中。下一轮应优先验证“需求设置—伙伴匹配—场地预约—第一次训练”这一条核心路径，并评估匹配机制是否真的降低压力。",
        body2:
          "现有材料缺少参与者数量、逐字访谈、系统化编码、工程验证和运营验证，因此当前产出应被理解为探索性的产品服务系统概念，而不是已上线或被证明有效的产品。",
      },
      next: {
        label: "下一个项目",
        description: "帮助长期在外的货车司机与家庭成员维持持续的情感连接。",
      },
    },
    en: {
      meta: {
        lang: "en",
        title: "Quiet Fitness Cabin | Product-Service System Design",
        description:
          "A product-service system concept connecting partner matching, low-density fitness spaces, modular equipment and optional support.",
      },
      language: { label: "Change case study language" },
      viewer: { open: "View HD detail", close: "Close full detail" },
      nav: {
        ariaLabel: "Case study navigation",
        back: "Back to Work",
        overview: "Overview",
        solution: "Solution",
        reflection: "Reflection",
      },
      hero: {
        type: "Product-Service System Design | App, Space & Fitness Service",
        summary:
          "For beginners who feel social pressure or discomfort in conventional gyms, the concept combines partner booking, low-density training spaces, modular equipment and optional guidance to reduce pressure when starting and sustaining exercise.",
        imageAlt: "Overall render of the Quiet Fitness Cabin low-density fitness space",
        imageCaption: "Overall spatial render from the original Fitness.pdf board.",
        meta: [
          { label: "My role", value: "UX Design / Service Design / Spatial Experience" },
          { label: "Duration", value: "2024.06–2024.09" },
          { label: "Project nature", value: "Individual Concept Project" },
          {
            label: "Deliverables",
            value:
              "Field research, user journey, service system, app flows and UI, modular equipment, spatial concept and service blueprint",
            wide: true,
          },
        ],
      },
      overview: {
        eyebrow: "01 / Overview",
        title: "A system concept connecting digital product, training space and fitness services.",
        body:
          "Quiet Fitness Cabin is not a single private gym cabin. It uses partner matching and booking as the entry point, connecting beginners, experienced users, offline venues, modular equipment, shower booking and post-workout nutrition in one product-service system.",
        cards: [
          {
            title: "Core users",
            text: "Beginners who feel social pressure or discomfort in conventional gyms, and experienced users who can offer companionship and practical support.",
          },
          {
            title: "Core path",
            text: "Set needs, match a partner, book a venue, exercise offline and access post-workout services.",
          },
          {
            title: "Design scope",
            text: "App, service flow, low-density spaces, modular equipment and service blueprint.",
          },
          {
            title: "Project status",
            text: "A product-service system concept, not launched or validated at engineering or large-sample level.",
          },
        ],
      },
      context: {
        eyebrow: "02 / Context & Challenge",
        title: "Pressure in conventional gyms appears across the whole journey, not only in the space.",
        statement:
          "Feeling watched, not knowing how to use equipment, avoiding help, exercising alone and high foot traffic can compound uncertainty before exercise even begins.",
        body:
          "The original project considers two user groups: people who feel social pressure or discomfort in conventional gyms, and experienced users who lack partners, flexible venues and a clear sense of achievement. The design opportunity is to connect these needs through optional matching and service support.",
      },
      research: {
        eyebrow: "03 / Exploratory Research",
        title: "Understanding exercise pressure through venue visits, user questions and competitor structures.",
        intro:
          "The original board records on-site gym observation, contextual interviews and questioning, plus competitor and market analysis. The participant count was not documented clearly, so this case study does not state one.",
        subjectsLabel: "Research participants",
        subjects: [
          "Fitness enthusiasts / experienced gym users",
          "People who feel social pressure or discomfort in conventional gyms",
        ],
        methodsLabel: "Research methods",
        methods: ["On-site observation in fitness venues", "Contextual interviews and questioning", "Competitor and market analysis"],
        imageAlt: "Gym observation and interview photographs from the original project board",
        imageCaption:
          "The source photographs record issues around equipment, venues, partners and help-seeking. Unsupported statistics from the board are not used on this page.",
        sourceSummary: "View the original research board",
        evidence: [
          "Reluctance to ask others for help when difficulties arise",
          "Fear of being watched",
          "Fear of working out alone",
          "Complex equipment and technical barriers",
          "Crowding and high foot traffic increase pressure",
          "Experienced users also lack achievement and exercise partners",
        ],
        limitLabel: "Research limitation",
        limit:
          "The original project retains photographs from observations and interviews, but does not fully document participant numbers, verbatim transcripts or systematic coding. The findings are therefore treated as exploratory insights rather than large-sample validated conclusions.",
      },
      insights: {
        eyebrow: "04 / Key Insights",
        title: "Preliminary Insights",
        intro: "These exploratory insights were formed from observation, interviews and journey analysis.",
        badge: "Exploratory insight",
        items: [
          "People who feel social pressure or discomfort in conventional gyms need control over venue density and personal exposure.",
          "Complex equipment and reluctance to ask for help amplify first-session uncertainty.",
          "Experienced users need partners, flexible venues and a clearer sense of achievement.",
          "Companionship and guidance must remain optional or they may create new social pressure.",
        ],
      },
      principles: {
        eyebrow: "05 / Design Principles",
        title: "Organise the service around predictability, control and low pressure.",
        intro: "These principles respond to the exploratory insights and are not presented as validated.",
        items: [
          {
            title: "Predictable",
            text: "Users understand the partner, venue capacity, equipment and process before arrival.",
          },
          {
            title: "Controllable",
            text: "Users choose their match, venue and whether to receive support from peers or staff.",
          },
          {
            title: "Low pressure",
            text: "Reduce moments that require public mistakes, active help-seeking or entry into crowded spaces.",
          },
        ],
      },
      journey: {
        eyebrow: "06 / User Journey",
        title: "Four core stages shape whether users can start and continue exercising.",
        intro:
          "The original journey remains as supporting evidence. The cards summarise only the user question, main pressure point and corresponding opportunity.",
        questionLabel: "User question",
        painLabel: "Main pressure point",
        opportunityLabel: "Corresponding opportunity",
        imageAlt: "The fitness user journey from the original project board",
        imageCaption: "Original journey detail: before, during and after exercise.",
        sourceSummary: "View the original user-journey board",
        items: [
          {
            title: "Find & enter",
            question: "Is the venue welcoming or crowded? Can I confirm the partner and venue before arrival?",
            pain: "Crowding, an unfamiliar environment, entering alone and unfamiliar equipment increase pressure.",
            opportunity: "Show capacity and booking status in advance, with experienced-user matching kept optional.",
          },
          {
            title: "Warm up & use equipment",
            question: "Are my movement and posture correct? Does the equipment fit this exercise?",
            pain: "Complex equipment, incomplete knowledge and reluctance to ask for help increase uncertainty.",
            opportunity: "Provide modular equipment, clear self-guidance and optional staff support.",
          },
          {
            title: "Stretch & optional social support",
            question: "Am I stretching correctly? Do I want to interact with other people?",
            pain: "A lack of partners can reduce motivation, while compulsory interaction can create new pressure.",
            opportunity: "Keep companionship, stretching guidance and social interaction optional.",
          },
          {
            title: "Shower & nutrition",
            question: "Is the shower crowded? Is this nutrition appropriate for my body?",
            pain: "Exposure continues in shared facilities, while nutrition information remains unclear.",
            opportunity: "Offer shower booking, nutrition information, advice and a quieter service area.",
          },
        ],
      },
      service: {
        eyebrow: "07 / Service System",
        title: "Three connected layers: digital product, space and equipment, and service support.",
        intro:
          "The app handles matching and booking; low-density spaces and modular equipment support exercise; experienced users and staff provide optional guidance.",
        items: [
          {
            title: "Digital product",
            text: "Need setting, partner matching, venue booking, equipment and exercise guidance.",
          },
          {
            title: "Space & equipment",
            text: "Low-density areas divided by capacity and need, modular equipment and a dedicated nutrition area.",
          },
          {
            title: "Service support",
            text: "Experienced-user companionship, staff guidance, shower booking and nutrition advice.",
          },
        ],
      },
      flow: {
        eyebrow: "08 / Key Flow",
        title: "A cross-touchpoint path from online communication to offline exercise.",
        intro: "The system map and service blueprint describe the following core sequence.",
        items: [
          { title: "Set needs", text: "Describe exercise needs, time and location preferences." },
          { title: "Match a partner", text: "Review experienced users or peers and begin online communication." },
          { title: "Book a venue", text: "Confirm the partner, location and booking information." },
          { title: "Exercise offline", text: "Use a low-density space, equipment and optional guidance." },
          { title: "Post-workout service", text: "Book a shower, review nutrition information and receive advice." },
        ],
      },
      decisions: {
        eyebrow: "09 / Design Decisions",
        title: "Balancing lower social pressure, safe use and operational feasibility.",
        intro: "These three decisions focus on the first-session path without extending beyond the source material.",
        reasonLabel: "Rationale",
        limitLabel: "Trade-off",
        items: [
          {
            title: "Partner matching must remain optional",
            reason: "Some beginners need experienced guidance, but compulsory matching can create new social pressure.",
            limit:
              "Independent exercise may reduce partner-service use, so the system still needs clear self-guided equipment and training support.",
          },
          {
            title: "Use low-density zoning rather than fully enclosed private cabins",
            reason:
              "Fewer simultaneous users can reduce crowding and exposure while retaining staff observation, safety support and shared equipment.",
            limit:
              "Low-density areas cannot remove all visibility, but they offer more safety and operational flexibility than fully enclosed rooms.",
          },
          {
            title: "Connect app, space and service around the first session",
            reason:
              "Uncertainty begins while finding a venue, booking and preparing to arrive, not only during exercise.",
            limit:
              "A cross-touchpoint system adds implementation complexity, so the next round should prioritise need setting, partner matching, venue booking and the first session.",
          },
        ],
      },
      app: {
        eyebrow: "10 / App Design",
        title: "Five key tasks connect beginners, experienced users and offline venues.",
        intro:
          "The app centres on need setting, partner matching and venue booking, with key tasks shown for both user roles.",
        status: "Original 2024 concept prototype used to explore the service flow, not a mature live interface.",
        flow: ["Set exercise needs", "Review experienced users", "Confirm a match", "Book a venue", "View the venue location"],
        groups: [
          {
            title: "Beginner interface",
            items: [
              {
                src: "app-flow-01-needs.webp",
                title: "Set exercise needs",
                text: "Enter exercise type, time and location preferences before matching.",
                alt: "Quiet Fitness Cabin beginner exercise-needs screen",
              },
              {
                src: "app-flow-02-expert-list.webp",
                title: "Review experienced users",
                text: "Browse available people and compare visible information before making contact.",
                alt: "Quiet Fitness Cabin experienced-user list screen",
              },
              {
                src: "app-flow-03-match-confirmation.webp",
                title: "Confirm a match",
                text: "Review established connections and decide whether to continue to booking.",
                alt: "Quiet Fitness Cabin partner match confirmation screen",
              },
              {
                src: "app-flow-04-venue-location.webp",
                title: "Book a venue and view its location",
                text: "Select a venue service and confirm the exercise location on the map.",
                alt: "Quiet Fitness Cabin venue booking and map screen",
              },
            ],
          },
          {
            title: "Experienced-user interface",
            items: [
              {
                src: "app-flow-05-expert-requests.webp",
                title: "Handle partner requests",
                text: "Review beginner requests and choose whether to accept them.",
                alt: "Quiet Fitness Cabin experienced-user partner request screen",
              },
            ],
          },
        ],
        iaSummary: "View information architecture and early wireframes",
        iaAlt: "Quiet Fitness Cabin app information architecture and early wireframes",
        iaCaption: "Supporting material: the original 2024 architecture and low-fidelity flow. The source image retains its original “Social anxiety novices” label; the current case uses the more neutral term “fitness beginners.”",
      },
      testing: {
        eyebrow: "11 / Low-fidelity Testing",
        title: "Issues identified in testing and the corresponding improvements.",
        intro:
          "The original project asked gym users to try the low-fidelity interface. No participant count, completion rate or satisfaction score was recorded, so only the documented issues and changes are shown.",
        imageAlt: "A gym user trying the Quiet Fitness Cabin low-fidelity interface",
        imageCaption: "Original testing photographs and issue notes from the project board.",
        issueLabel: "Issue",
        improvementLabel: "Improvement",
        items: [
          {
            issue: "Users needed time to understand matching and booking.",
            improvement: "Clarify the relationship between matching and booking steps.",
          },
          {
            issue: "Entry points for booking experienced users were dispersed.",
            improvement: "Consolidate booking within the matching flow.",
          },
          {
            issue: "Information transparency was insufficient.",
            improvement: "Show clearer user, booking and status information.",
          },
          {
            issue: "Text and icons were too small for easy visibility.",
            improvement: "Increase text and icon sizes to improve readability and discoverability.",
          },
        ],
      },
      spatial: {
        eyebrow: "12 / Spatial and Equipment System",
        title: "Capacity zoning and modular equipment reduce crowding and use barriers.",
        intro:
          "The space is divided by capacity and use needs to reduce crowding and collision; modular equipment adapts to different users and training needs.",
        evidence: [
          {
            src: "spatial-system.webp",
            title: "Spatial layout & use scenarios",
            text: "Site sketch, overall render, floor plan, section, booking verification and group exercise scenes.",
            alt: "Quiet Fitness Cabin site sketch, spatial render, floor plan and section",
          },
          {
            src: "modular-equipment.webp",
            title: "Modular equipment & connection detail",
            text: "Two equipment concepts and a mortise-and-tenon-inspired connection approach.",
            alt: "Quiet Fitness Cabin modular equipment sketches and connection structure",
          },
        ],
        items: [
          {
            title: "Entry & booking verification",
            text: "The source scene shows booking verification at the entrance, followed by a group-exercise scenario.",
          },
          {
            title: "Safety & staff support",
            text: "The blueprint documents equipment setup, exercise and stretching support; emergency facilities are not shown separately.",
          },
          {
            title: "App-to-space booking status",
            text: "The app includes venue booking and a map; the blueprint includes booking systems, live notifications and venue reservations.",
          },
        ],
        statusLabel: "Concept status",
        status:
          "The site, plans, section, equipment and use scenes come from the original project. No engineering, safety or operational validation is claimed.",
      },
      blueprint: {
        eyebrow: "13 / Service Blueprint",
        title: "Connecting online communication, partner booking, offline fitness and post-workout nutrition.",
        intro: "The blueprint separates user actions, frontstage service, backstage technology and support processes.",
        stages: ["Online communication", "Partner booking", "Offline fitness", "Post-workout nutrition"],
        tableLabel: "Simplified service blueprint with four stages and four swimlanes",
        cornerLabel: "Lane / stage",
        imageAlt: "Quiet Fitness Cabin service blueprint",
        imageCaption: "Original blueprint detail showing coordination from the app to post-workout services.",
        sourceSummary: "View the original service blueprint",
        rows: [
          {
            title: "User actions",
            cells: [
              "Set needs, browse partners and begin online communication.",
              "Choose a partner and confirm the booking and venue.",
              "Verify arrival, use equipment and complete the session.",
              "Book a shower and review nutrition information.",
            ],
          },
          {
            title: "Frontstage service",
            cells: [
              "Respond online and explain the service.",
              "Confirm partner and venue booking details.",
              "Provide equipment, exercise and stretching support.",
              "Support shower booking and nutrition guidance.",
            ],
          },
          {
            title: "Backstage system",
            cells: [
              "Support chat and user information.",
              "Run booking and live-notification systems.",
              "Provide equipment information and movement support.",
              "Support shower booking and nutrition suggestions.",
            ],
          },
          {
            title: "Support process",
            cells: [
              "Maintain platform content and venue partnerships.",
              "Manage payment and booking operations.",
              "Clean, install and inspect equipment.",
              "Maintain showers and the nutrition area.",
            ],
          },
        ],
      },
      business: {
        eyebrow: "Supporting material",
        title: "Business Canvas",
        intro:
          "The business canvas is a concept-stage exploration of system scope and has not undergone market or commercial feasibility validation.",
        imageAlt: "The original Quiet Fitness Cabin business canvas",
        imageCaption: "Original business canvas detail; no commercial feasibility is claimed.",
      },
      outcome: {
        eyebrow: "14 / Design Outcome",
        title: "A concept system spanning app, space, equipment and service.",
        body:
          "The project produced a product-service system concept connecting an app, fitness partners, low-density training spaces, modular equipment and post-workout services.",
      },
      reflection: {
        eyebrow: "15 / Reflection",
        title: "Narrow the next validation round to the most critical starting path.",
        quote:
          "Inclusive fitness is not only about physical access, but also control over exposure, guidance and social participation.",
        body1:
          "The original project covers many touchpoints, but the broad system scope weakens the focus of its core value. The next iteration should prioritise the need setting, partner matching, venue booking and first-session path, then examine whether matching truly reduces pressure.",
        body2:
          "The current material lacks participant counts, verbatim interviews, systematic coding, engineering validation and operational validation. The outcome should therefore be understood as an exploratory product-service system concept, not a launched or proven product.",
      },
      next: {
        label: "Next Project",
        description:
          "Supporting sustained emotional connection between long-haul truck drivers and their family members.",
      },
    },
  };

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function getValue(source, path) {
    return path.split(".").reduce((value, key) => value?.[key], source);
  }

  function setCopy(source) {
    document.querySelectorAll("[data-copy]").forEach((element) => {
      const value = getValue(source, element.dataset.copy);
      if (typeof value === "string") element.textContent = value;
    });
    document.querySelectorAll("[data-copy-aria]").forEach((element) => {
      const value = getValue(source, element.dataset.copyAria);
      if (typeof value === "string") element.setAttribute("aria-label", value);
    });
    document.querySelectorAll("[data-copy-alt]").forEach((element) => {
      const value = getValue(source, element.dataset.copyAlt);
      if (typeof value === "string") element.setAttribute("alt", value);
    });
  }

  function setHtml(id, html) {
    const element = document.getElementById(id);
    if (element) element.innerHTML = html;
  }

  function renderMeta(items) {
    setHtml(
      "hero-meta",
      items
        .map(
          (item) => `
            <div class="${item.wide ? "is-wide" : ""}">
              <strong>${escapeHtml(item.label)}</strong>
              <span>${escapeHtml(item.value)}</span>
            </div>`
        )
        .join("")
    );
  }

  function renderSimpleList(id, items) {
    setHtml(id, items.map((item) => `<li>${escapeHtml(item)}</li>`).join(""));
  }

  function renderInfoCards(id, items) {
    setHtml(
      id,
      items
        .map(
          (item) => `
            <article class="quiet-info-card">
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.text)}</p>
            </article>`
        )
        .join("")
    );
  }

  function renderEvidence(items) {
    setHtml(
      "research-evidence",
      items
        .map(
          (item, index) => `
            <article>
              <span>${String(index + 1).padStart(2, "0")}</span>
              <p>${escapeHtml(item)}</p>
            </article>`
        )
        .join("")
    );
  }

  function renderInsights(source) {
    setHtml(
      "insight-cards",
      source.items
        .map(
          (item, index) => `
            <article class="quiet-card quiet-insight-card">
              <div class="quiet-card__top">
                <span class="quiet-number">${String(index + 1).padStart(2, "0")}</span>
                <span class="quiet-badge">${escapeHtml(source.badge)}</span>
              </div>
              <h3>${escapeHtml(item)}</h3>
            </article>`
        )
        .join("")
    );
  }

  function renderPrinciples(items) {
    setHtml(
      "principle-cards",
      items
        .map(
          (item, index) => `
            <article class="quiet-card">
              <span class="quiet-number">${String(index + 1).padStart(2, "0")}</span>
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.text)}</p>
            </article>`
        )
        .join("")
    );
  }

  function renderJourney(source) {
    setHtml(
      "journey-cards",
      source.items
        .map(
          (item, index) => `
            <article class="quiet-journey-card">
              <div class="quiet-journey-card__top">
                <span class="quiet-number">${String(index + 1).padStart(2, "0")}</span>
              </div>
              <h3>${escapeHtml(item.title)}</h3>
              <dl>
                <div><dt>${escapeHtml(source.questionLabel)}</dt><dd>${escapeHtml(item.question)}</dd></div>
                <div><dt>${escapeHtml(source.painLabel)}</dt><dd>${escapeHtml(item.pain)}</dd></div>
                <div><dt>${escapeHtml(source.opportunityLabel)}</dt><dd>${escapeHtml(item.opportunity)}</dd></div>
              </dl>
            </article>`
        )
        .join("")
    );
  }

  function renderService(items) {
    setHtml(
      "service-cards",
      items
        .map(
          (item, index) => `
            <article class="quiet-card">
              <span class="quiet-system-icon">${String(index + 1).padStart(2, "0")}</span>
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.text)}</p>
            </article>`
        )
        .join("")
    );
  }

  function renderFlow(items) {
    setHtml(
      "flow-steps",
      items
        .map(
          (item, index) => `
            <li>
              <span>${String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>${escapeHtml(item.title)}</strong>
                <p>${escapeHtml(item.text)}</p>
              </div>
            </li>`
        )
        .join("")
    );
  }

  function renderDecisions(source) {
    setHtml(
      "decision-cards",
      source.items
        .map(
          (item, index) => `
            <article class="quiet-decision">
              <span class="quiet-number">${String(index + 1).padStart(2, "0")}</span>
              <h3>${escapeHtml(item.title)}</h3>
              <div class="quiet-decision__detail">
                <strong>${escapeHtml(source.reasonLabel)}</strong>
                <p>${escapeHtml(item.reason)}</p>
              </div>
              <div class="quiet-decision__detail quiet-decision__detail--risk">
                <strong>${escapeHtml(source.limitLabel)}</strong>
                <p>${escapeHtml(item.limit)}</p>
              </div>
            </article>`
        )
        .join("")
    );
  }

  function renderMedia(id, items) {
    setHtml(
      id,
      items
        .map(
          (item) => {
            const dimensions = FULL_ASSET_DIMENSIONS[item.src];
            const imagePath = ASSET_PATH;
            const fullSource = dimensions
              ? ` data-full-src="${FULL_ASSET_PATH}${escapeHtml(item.src)}"`
              : "";
            const intrinsicSize = dimensions
              ? ` width="${dimensions[0]}" height="${dimensions[1]}"`
              : "";
            return `
            <figure class="quiet-media-card">
              <div class="quiet-media-card__image">
                <img src="${imagePath}${escapeHtml(item.src)}"${fullSource}${intrinsicSize} loading="lazy" alt="${escapeHtml(item.alt)}" />
              </div>
              <figcaption>
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.text)}</p>
              </figcaption>
            </figure>`;
          }
        )
        .join("")
    );
  }

  function renderApp(source) {
    setHtml(
      "app-flow",
      source.flow
        .map(
          (item, index) => `
            <li>
              <span>${String(index + 1).padStart(2, "0")}</span>
              <strong>${escapeHtml(item)}</strong>
            </li>`
        )
        .join("")
    );

    setHtml(
      "app-groups",
      source.groups
        .map(
          (group) => `
            <section class="quiet-app-group">
              <h3>${escapeHtml(group.title)}</h3>
              <div class="quiet-app-screens">
                ${group.items
                  .map(
                    (item) => `
                      <figure class="quiet-app-screen">
                        <div class="quiet-app-screen__device">
                          <img src="${APP_NORMALIZED_PATH}${escapeHtml(APP_NORMALIZED_ASSETS[item.src] || item.src)}" loading="lazy" alt="${escapeHtml(item.alt)}" />
                        </div>
                        <figcaption>
                          <strong>${escapeHtml(item.title)}</strong>
                          <p>${escapeHtml(item.text)}</p>
                        </figcaption>
                      </figure>`
                  )
                  .join("")}
              </div>
            </section>`
        )
        .join("")
    );
  }

  function renderSpatialItems(items) {
    setHtml(
      "spatial-items",
      items
        .map(
          (item, index) => `
            <article>
              <span>${String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>${escapeHtml(item.title)}</strong>
                <p>${escapeHtml(item.text)}</p>
              </div>
            </article>`
        )
        .join("")
    );
  }

  function renderTesting(source) {
    setHtml(
      "testing-items",
      source.items
        .map(
          (item, index) => `
            <article>
              <span class="quiet-number">${String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>${escapeHtml(source.issueLabel)}</strong>
                <p>${escapeHtml(item.issue)}</p>
              </div>
              <div>
                <strong>${escapeHtml(source.improvementLabel)}</strong>
                <p>${escapeHtml(item.improvement)}</p>
              </div>
            </article>`
        )
        .join("")
    );
  }

  function renderBlueprint(source) {
    setHtml(
      "blueprint-table",
      `
        <div class="quiet-blueprint-cell quiet-blueprint-cell--corner">${escapeHtml(source.cornerLabel)}</div>
        ${source.stages
          .map(
            (stage, index) => `
              <div class="quiet-blueprint-cell quiet-blueprint-cell--stage">
                <span>${String(index + 1).padStart(2, "0")}</span>
                <strong>${escapeHtml(stage)}</strong>
              </div>`
          )
          .join("")}
        ${source.rows
        .map(
          (row) => `
            <div class="quiet-blueprint-cell quiet-blueprint-cell--lane">${escapeHtml(row.title)}</div>
            ${row.cells
              .map((cell) => `<div class="quiet-blueprint-cell">${escapeHtml(cell)}</div>`)
              .join("")}`
        )
        .join("")
      }`
    );
  }

  function setupImageViewer(source) {
    const lightbox = document.getElementById("quiet-lightbox");
    const lightboxImage = document.getElementById("quiet-lightbox-image");
    const lightboxCaption = document.getElementById("quiet-lightbox-caption");
    if (!lightbox || !lightboxImage || !lightboxCaption) return;

    document
      .querySelectorAll("figure.quiet-evidence-figure, figure.quiet-media-card")
      .forEach((figure) => {
        const image = figure.querySelector("img");
        const caption = figure.querySelector("figcaption");
        if (!image) return;

        figure.dataset.lightbox = "true";
        let trigger = figure.querySelector(".quiet-view-detail");
        if (!trigger) {
          trigger = document.createElement("button");
          trigger.type = "button";
          trigger.className = "quiet-view-detail";
          figure.appendChild(trigger);
        }
        trigger.textContent = source.viewer.open;
        trigger.setAttribute("aria-label", source.viewer.open);
        image.setAttribute("aria-label", source.viewer.open);
        image.tabIndex = 0;
        image.setAttribute("role", "button");

        const openLightbox = () => {
          const inlineSrc = image.currentSrc || image.src;
          const hdSrc = image.dataset.fullSrc || (inlineSrc.includes("/full/")
            ? inlineSrc
            : inlineSrc.replace(
                "/assets/quiet-fitness-cabin/",
                "/assets/quiet-fitness-cabin/full/"
              ));
          lightboxImage.onerror = () => {
            lightboxImage.onerror = null;
            lightboxImage.src = inlineSrc;
          };
          lightboxImage.src = hdSrc;
          lightboxImage.alt = image.alt;
          const heading = figure.querySelector("figcaption h3");
          lightboxCaption.textContent =
            heading?.textContent || caption?.textContent || image.alt;
          lightbox.showModal();
        };

        if (figure.dataset.lightboxBound !== "true") {
          trigger.addEventListener("click", openLightbox);
          image.addEventListener("click", openLightbox);
          image.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openLightbox();
            }
          });
          figure.dataset.lightboxBound = "true";
        }
      });
  }

  function captureReadingAnchor() {
    const sections = [...document.querySelectorAll("main > section[id]")];
    let anchor = null;
    sections.forEach((section) => {
      if (section.getBoundingClientRect().top <= 150) anchor = section;
    });
    return anchor
      ? { id: anchor.id, offset: anchor.getBoundingClientRect().top }
      : { id: null, offset: window.scrollY };
  }

  function render(locale, preserveScroll) {
    const source = locales[locale];
    const readingAnchor = preserveScroll ? captureReadingAnchor() : null;

    document.documentElement.lang = source.meta.lang;
    document.body.dataset.language = locale;
    document.title = source.meta.title;
    document.querySelector('meta[name="description"]').content = source.meta.description;
    setCopy(source);
    renderMeta(source.hero.meta);
    renderInfoCards("overview-cards", source.overview.cards);
    renderSimpleList("research-subjects", source.research.subjects);
    renderSimpleList("research-methods", source.research.methods);
    renderEvidence(source.research.evidence);
    renderInsights(source.insights);
    renderPrinciples(source.principles.items);
    renderJourney(source.journey);
    renderService(source.service.items);
    renderFlow(source.flow.items);
    renderDecisions(source.decisions);
    renderApp(source.app);
    renderTesting(source.testing);
    renderMedia("spatial-evidence", source.spatial.evidence);
    renderSpatialItems(source.spatial.items);
    renderBlueprint(source.blueprint);
    setupImageViewer(source);

    document.querySelectorAll("[data-language]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.language === locale));
    });

    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // The case study remains usable when browser storage is unavailable.
    }

    if (preserveScroll) {
      const previousOverflowAnchor = document.documentElement.style.overflowAnchor;
      document.documentElement.style.overflowAnchor = "none";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const previousBehavior = document.documentElement.style.scrollBehavior;
          document.documentElement.style.scrollBehavior = "auto";
          const section = readingAnchor.id ? document.getElementById(readingAnchor.id) : null;
          if (section) {
            const delta = section.getBoundingClientRect().top - readingAnchor.offset;
            window.scrollBy(0, delta);
          } else {
            window.scrollTo(0, readingAnchor.offset);
          }
          document.documentElement.style.scrollBehavior = previousBehavior;
          document.documentElement.style.overflowAnchor = previousOverflowAnchor;
        });
      });
    }
  }

  const quietLightbox = document.getElementById("quiet-lightbox");
  document.querySelector("[data-lightbox-close]")?.addEventListener("click", () =>
    quietLightbox?.close()
  );
  quietLightbox?.addEventListener("click", (event) => {
    if (event.target === quietLightbox) quietLightbox.close();
  });

  document.querySelectorAll("[data-language]").forEach((button) => {
    button.addEventListener("click", () => render(button.dataset.language, true));
  });

  let initialLocale = "zh";
  try {
    initialLocale = localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "zh";
  } catch {
    initialLocale = "zh";
  }
  render(initialLocale, false);
})();
