# ✅React项目的目录结构和组织规范

# 典型回答

良好的React项目目录结构和组织规范对于项目的**可维护性、可扩展性和团队协作**至关重要。虽然React本身对项目结构没有强制要求，但经过社区实践，形成了几种主流的结构模式。

**推荐目录结构（按功能/组件组织）**：

```
src/
├── api/                    # API请求层
│   ├── client.ts          # HTTP客户端配置（axios/fetch封装）
│   ├── endpoints/         # 按领域模块划分的API
│   │   ├── user.ts
│   │   └── product.ts
│   └── types.ts           # API请求/响应类型定义
├── assets/                # 静态资源
│   ├── images/
│   ├── fonts/
│   └── styles/            # 全局样式
│       ├── variables.css
│       ├── reset.css
│       └── global.css
├── components/            # 共享组件（通用UI组件）
│   ├── ui/               # 基础UI组件库
│   │   ├── Button/
│   │   ├── Modal/
│   │   ├── Input/
│   │   └── index.ts
│   ├── layout/            # 布局组件
│   │   ├── Header/
│   │   ├── Sidebar/
│   │   └── Layout.tsx
│   └── common/            # 业务共享组件
│       ├── Loading/
│       ├── Empty/
│       └── ErrorBoundary/
├── hooks/                 # 共享自定义Hook
│   ├── useAuth.ts
│   ├── useDebounce.ts
│   └── usePagination.ts
├── pages/                 # 页面组件（路由对应）
│   ├── Home/
│   ├── Login/
│   ├── Dashboard/
│   │   ├── index.tsx      # 页面入口
│   │   ├── Dashboard.tsx  # 页面组件
│   │   ├── components/    # 页面私有组件
│   │   ├── hooks/         # 页面私有Hook
│   │   └── utils.ts       # 页面私有工具函数
│   └── NotFound/
├── store/                 # 全局状态管理
│   ├── userStore.ts
│   └── settingsStore.ts
├── types/                 # 全局类型定义
│   ├── common.ts
│   └── global.d.ts
├── utils/                 # 工具函数
│   ├── format.ts
│   ├── validation.ts
│   └── helpers.ts
├── routes/                # 路由配置
│   └── index.tsx
├── App.tsx                # 应用入口组件
└── main.tsx              # 应用启动入口
```

# 扩展知识

### 组件组织的三种模式

```bash
模式1：按文件类型分组（Group by Type）
  src/
  ├── components/
  ├── containers/    # 容器组件（有状态）
  ├── presentational/ # 展示组件
  └── pages/
  
  ✅ 适合：小型项目，快速上手
  ❌ 问题：业务逻辑分散，扩展困难

模式2：按功能模块分组（Group by Feature）
  src/
  ├── features/
  │   ├── auth/
  │   │   ├── components/
  │   │   ├── hooks/
  │   │   ├── api.ts
  │   │   └── types.ts
  │   ├── products/
  │   └── cart/
  ├── shared/        # 跨功能共享
  └── app/           # 应用配置
  
  ✅ 适合：中大型项目，高内聚低耦合
  ✅ 推荐：团队协作友好，便于代码拆分

模式3：按层级分组（Group by Layer）—— DDD分层
  src/
  ├── application/   # 应用层（用例）
  ├── domain/        # 领域层（业务逻辑）
  ├── infrastructure/ # 基础设施层（API、存储）
  └── presentation/  # 表示层（UI组件）
  
  ✅ 适合：复杂业务系统
  ❌ 学习成本高，需要规范约束
```

### 组件命名规范

```jsx
// 1. 文件名: 大驼峰(PascalCase)，与组件名一致
// Button.tsx
// UserProfile.tsx

// 2. 组件名: 大驼峰，见名知意
// ❌ <Comp1 />, <MyComponent />
// ✅ <UserCard />, <LoginForm />, <DataTable />

// 3. 文件与目录同名
// Button/
//   index.tsx      # 导出Button组件
//   Button.tsx     # 组件实现
//   Button.test.tsx
//   Button.module.css

// 4. 辅助文件小驼峰(camelCase)
// useUser.ts          # 自定义Hook
// utils.ts            # 工具函数
// constants.ts        # 常量
```

### 代码组织规范

```jsx
// 组件内代码顺序规范
import { useState, useCallback } from 'react';  // 1. 第三方依赖
import { useAuth } from '@/hooks';               // 2. 内部依赖
import { formatDate } from '@/utils';            // 3. 工具函数
import { Button } from '@/components/ui';        // 4. 共享组件
import styles from './UserCard.module.css';       // 5. 样式文件

import type { User } from '@/types';             // 6. 类型导入

// 7. 常量定义
const AVATAR_SIZE = 48;

// 8. 组件定义
function UserCard({ user }: UserCardProps) {
  // 8.1 Hooks（按逻辑分组）
  const { user: currentUser } = useAuth();
  const [expanded, setExpanded] = useState(false);
  
  // 8.2 事件处理器
  const handleToggle = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);
  
  // 8.3 条件渲染逻辑
  if (!user) return <Empty />;
  
  // 8.4 主渲染
  return (
    <div className={styles.card}>
      <img src={user.avatar} alt={user.name} />
      <h3>{user.name}</h3>
      {expanded && <p>{user.bio}</p>}
      <Button onClick={handleToggle}>
        {expanded ? '收起' : '展开'}
      </Button>
    </div>
  );
}

// 9. 类型导出
export interface UserCardProps {
  user: User;
}

// 10. 默认导出
export default UserCard;
```

### CSS组织规范

```bash
CSS方案选择：
├── CSS Modules（推荐）
│   ├── 组件级样式隔离
│   ├── 编译时生成唯一className
│   └── 最适合团队协作
│
├── Tailwind CSS（推荐）
│   ├── 原子化CSS
│   ├── 极快的开发速度
│   └── 需要团队统一约定
│
├── CSS-in-JS（styled-components / Emotion）
│   ├── 动态样式能力强
│   ├── 运行时性能开销
│   └── 适合设计系统

CSS Modules示例：
// Button.module.css
.button {
  padding: 8px 16px;
  border-radius: 4px;
}
.primary {
  background: blue;
  color: white;
}

// Button.tsx
import styles from './Button.module.css';
function Button({ variant, children }) {
  return (
    <button className={`${styles.button} ${styles[variant]}`}>
      {children}
    </button>
  );
}
```

### 导入路径规范

```jsx
// 推荐：使用路径别名（@/ 或 ~/）
// vite.config.ts 或 tsconfig.json 中配置
// "@/*": ["src/*"]

import { Button } from '@/components/ui';
import { useAuth } from '@/hooks';
import { fetchUser } from '@/api/endpoints/user';
import { formatDate } from '@/utils/format';

// 不推荐：深层相对路径
import { Button } from '../../../../components/ui/Button';

// 明确区分默认导入和命名导入
import React, { useState, useEffect } from 'react';
import * as icons from 'lucide-react';
import type { FC, ReactNode } from 'react';
```

### 测试文件组织

```bash
测试文件位置方案：

方案1：与源文件同目录（推荐）
  components/
  └── Button/
      ├── Button.tsx
      ├── Button.test.tsx      # 单元测试
      ├── Button.stories.tsx   # Storybook
      └── index.ts

方案2：集中放在__tests__目录
  __tests__/
  ├── components/
  │   └── Button.test.tsx
  └── hooks/
      └── useAuth.test.ts
  
  ❌ 问题：与源文件分离，查找困难

方案3：混合模式
  src/
  ├── components/Button.tsx
  └── __tests__/
      └── components/
          └── Button.test.tsx
```

### 架构规范检查清单

```bash
项目规范检查清单：

[ ] 是否统一使用路径别名（@/）？
[ ] 组件文件是否遵循大驼峰命名？
[ ] 通用组件是否放在shared/components？
[ ] 页面组件是否按功能模块组织？
[ ] 自定义Hook是否在hooks目录集中管理？
[ ] API请求是否统一封装在api目录？
[ ] 类型定义是否集中管理？
[ ] CSS方案是否统一？
[ ] 是否有ESLint和Prettier配置？
[ ] 是否有git提交规范（commitlint）？
[ ] 是否统一了导入顺序？
[ ] 组件代码顺序是否一致？
```
