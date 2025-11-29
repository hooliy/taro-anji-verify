# taro-anji-verify

基于 Taro 和 React 的安吉验证码组件库 (Anji Plus Verify for Taro)。
支持滑动拼图验证 (Block Puzzle) 和文字点选验证 (Click Word)。

## 安装

```bash
npm install taro-anji-verify
# 或者
yarn add taro-anji-verify
# 或者
pnpm add taro-anji-verify
```

## 使用

### 引入组件

```tsx
import { VerifySlide, VerifyPoint, VerifySlideFixed, VerifyPointFixed } from 'taro-anji-verify';
```

### 1. 弹窗式滑动验证 (VerifySlideFixed)

最常用的方式，点击按钮弹出验证码。

```tsx
import { useState } from 'react';
import { View, Button } from '@tarojs/components';
import { VerifySlideFixed } from 'taro-anji-verify';

export default () => {
  const [showVerify, setShowVerify] = useState(false);

  const handleVerifyResult = (result: boolean) => {
    if (result) {
      console.log('验证成功');
      // 执行后续逻辑，例如登录
    }
    // 关闭验证码弹窗
    setShowVerify(false);
  };

  return (
    <View>
      <Button onClick={() => setShowVerify(true)}>点击验证</Button>
      
      <VerifySlideFixed
        baseUrl="https://your-api-domain.com"  {/* 必填：后端接口地址 */}
        isSlideShow={showVerify}               {/* 控制显示/隐藏 */}
        verifyPointFixedChild={handleVerifyResult} {/* 回调函数 */}
      />
    </View>
  );
};
```

### 2. 嵌入式滑动验证 (VerifySlide)

直接在页面中显示验证码区域。

```tsx
<VerifySlide
  baseUrl="https://your-api-domain.com"
/>
```

### 3. 弹窗式文字点选验证 (VerifyPointFixed)

```tsx
<VerifyPointFixed
  baseUrl="https://your-api-domain.com"
  isPointShow={showPointVerify}
  verifyPointFixedChild={(result) => {
     console.log('验证结果:', result);
     setShowPointVerify(false);
  }}
/>
```

### 4. 嵌入式文字点选验证 (VerifyPoint)

```tsx
<VerifyPoint
  baseUrl="https://your-api-domain.com"
/>
```

## 参数说明 (Props)

### 通用参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| baseUrl | string | **是** | - | 后端接口的基础地址 (例如: `https://api.example.com`)。组件会自动拼接 `/captcha/get` 和 `/captcha/check`。 |
| imgSize | object | 否 | `{ width: '310px', height: '200px' }` | 图片容器尺寸 |
| barSize | object | 否 | `{ width: '310px', height: '40px' }` | 滑块/操作栏尺寸 |
| vSpace | number | 否 | 5 | 图片与控制栏的垂直间距 |

### Fixed 组件特有参数 (VerifySlideFixed, VerifyPointFixed)

| 参数名 | 类型 | 说明 |
|---|---|---|
| isSlideShow / isPointShow | boolean | 控制弹窗显示或隐藏 |
| verifyPointFixedChild | (result: boolean) => void | 验证结果回调。`true` 表示验证成功，`false` 表示关闭或失败。 |

## 注意事项

1. **依赖**: 确保项目已安装 `@tarojs/taro`, `@tarojs/components` 和 `react`。
2. **样式**: 组件内部引入了 `index.scss`，请确保你的构建配置支持 SCSS 导入。
3. **后端接口**: 需要配合 Anji-Plus 的后端服务使用。

## License

MIT
