# ✅什么是BigInt？解决了什么问题？

# 典型回答

**BigInt**是ES2020引入的JavaScript第七种原始数据类型，用于表示**任意精度**的整数。它解决了JavaScript中Number类型无法精确表示大整数的问题。

**Number类型的安全限制：**
- JavaScript的Number采用IEEE 754双精度64位浮点数
- 安全整数范围：`-(2^53 - 1)` 到 `2^53 - 1`（约9千万亿）
- 超过此范围的计算会**丢失精度**

```javascript
// Number类型的大整数问题
console.log(9007199254740991 + 1); // 9007199254740992 ✓
console.log(9007199254740991 + 2); // 9007199254740992 ✗ 精度丢失
console.log(9999999999999999);     // 10000000000000000 精度丢失
```

**BigInt的创建方式：**
```javascript
// 方式一：在整数末尾加n
const big1 = 9007199254740991n;

// 方式二：BigInt() 函数
const big2 = BigInt(9007199254740991);
const big3 = BigInt('9007199254740991');

console.log(typeof big1); // 'bigint'
```

# 扩展知识

## BigInt的基本运算

```javascript
const a = 1000000000000000000n;
const b = 2000000000000000000n;

// 基本算术运算
console.log(a + b);  // 3000000000000000000n
console.log(b - a);  // 1000000000000000000n
console.log(a * 2n); // 2000000000000000000n
console.log(b / 3n); // 666666666666666666n（除法会截断小数）
console.log(a % 3n); // 1n
console.log(a ** 2n); // 1000000000000000000000000000000000000n

// 位运算
console.log(a & b);  // 支持 & | ^ ~ << >> 等位运算
console.log(a | b);
console.log(a ^ b);
```

## BigInt与Number的混用限制

**BigInt不能直接与Number混合运算：**
```javascript
const big = 1n;
const num = 1;

// console.log(big + num);  // TypeError: Cannot mix BigInt and other types
// console.log(big > num);  // TypeError

// 必须显式转换
console.log(big + BigInt(num));   // 2n
console.log(Number(big) + num);   // 2
```

**比较运算符例外：**
```javascript
// 比较运算符可以混用（因为比较的是值而非类型）
console.log(1n == 1);   // true （宽松相等）
console.log(1n === 1);  // false （严格相等，类型不同）
console.log(1n < 2);    // true
console.log(2n > 1);    // true
```

## BigInt与Math对象

```javascript
const big = 16n;

// Math对象的方法不支持BigInt
// console.log(Math.sqrt(big));  // TypeError

// 需要手动转换
console.log(Math.sqrt(Number(big)));  // 4
```

## BigInt的JSON序列化

```javascript
const obj = { value: 9007199254740991n };

// 直接JSON.stringify会报错
// JSON.stringify(obj);  // TypeError: Do not know how to serialize a BigInt

// 需要自定义序列化
const json = JSON.stringify(obj, (key, value) =>
  typeof value === 'bigint' ? value.toString() : value
);
console.log(json); // {"value":"9007199254740991"}

// 或者使用toJSON方法
BigInt.prototype.toJSON = function() {
  return this.toString();
};
console.log(JSON.stringify(obj)); // {"value":"9007199254740991"}
```

## 应用场景

```javascript
// 1. 高精度金融计算
const price = 12345678901234567890n;
const quantity = 1000000n;
const total = price * quantity;
// 精确的大数乘法结果

// 2. 数据库ID处理
// 数据库生成的BigInt ID（如Snowflake ID）
const userId = BigInt('1623456789012345678');
console.log(userId.toString()); // 数据库查询使用

// 3. 加密算法中的大数运算
const modulus = 2n ** 256n - 2n ** 224n + 2n ** 192n + 2n ** 96n - 1n;
// 用于椭圆曲线加密的质数

// 4. 时间戳精确计算
const start = BigInt(Date.now()) * 1000000n;
// 纳秒级时间戳

// 5. 科学计算
const avogadro = 602214076000000000000000n; // 阿伏伽德罗常数
```

## BigInt的性能注意事项

```javascript
// BigInt运算比Number慢得多（可能慢2-10倍）
console.time('BigInt');
let sum = 0n;
for (let i = 0n; i < 100000n; i++) sum += i;
console.timeEnd('BigInt');

console.time('Number');
let sum2 = 0;
for (let i = 0; i < 100000; i++) sum2 += i;
console.timeEnd('Number');

// 不需要大整数时不要使用BigInt
```

## BigInt的局限性

```javascript
// 1. 不能用于单精度运算（如Math、浮点数）
// Math.round(1n); // TypeError

// 2. 不能混合运算
// 1n + 1; // TypeError

// 3. 不能用于JSON.stringify（默认）
// 4. 除法的截断行为
console.log(5n / 2n); // 2n（向零取整）

// 5. 不支持一元正号
// +1n; // TypeError
// 但支持负号
console.log(-1n); // -1n

// 6. 不能用于类型转换暗示为数字
console.log(String(1n)); // '1' ✔
console.log(Boolean(1n)); // true ✔ （只有0n是false）
// Number(1n); // 可能丢失精度但可以执行
console.log(Number(1n)); // 1

// 7. 无符号右移（>>>）不支持
// 1n >>> 0n; // TypeError: BigInts have no unsigned right shift
```

## BigInt与TypeScript

```typescript
// TypeScript中BigInt的类型是 bigint
let big: bigint = 100n;

// 需要target为ES2020+
// tsconfig.json: "target": "ES2020"
```

## 何时使用BigInt

- 需要精确表示大于2^53-1的整数
- 金融计算（金额的精确整数表示）
- 加密和哈希算法
- 数据库中的64位或128位ID
- 科学计算中的大整数

**不需要使用BigInt的场景：**
- 小整数常规计算
- 涉及小数的计算（BigInt不支持小数）
- 性能敏感但有精度容忍的场景
- 需要频繁与JSON交互的场景
