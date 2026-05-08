#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MDS_DIR = path.join(__dirname, '..', '..', 'mds')
const SRC_DATA_DIR = path.join(__dirname, '..', 'src', 'data')
const PUBLIC_DATA_DIR = path.join(__dirname, '..', 'public', 'data')

function extractTitle(content) {
  const match = content.match(/^#\s*(.+)$/m)
  return match ? match[1].trim().replace(/^✅\s*/, '').trim() : ''
}

function getCategoryName(dirName) {
  const map = {
    '必读': '必读',
    '面试必备': '面试必备',
    'Java基础': 'Java基础',
    '集合类': '集合类',
    'Java并发': 'Java并发',
    'JVM': 'JVM',
    'Spring': 'Spring',
    'SpringCloud': 'Spring Cloud',
    'MySQL': 'MySQL',
    'MyBatis': 'MyBatis',
    'Redis': 'Redis',
    'Kafka': 'Kafka',
    'RocketMQ': 'RocketMQ',
    'RabbitMQ': 'RabbitMQ',
    'Dubbo': 'Dubbo',
    'Netty': 'Netty',
    'Zookeeper': 'Zookeeper',
    '分布式': '分布式',
    '微服务': '微服务',
    '高并发': '高并发',
    '高可用': '高可用',
    '高性能': '高性能',
    '分库分表': '分库分表',
    '本地缓存': '本地缓存',
    'ElasticSearch': 'ElasticSearch',
    'Tomcat': 'Tomcat',
    '设计模式': '设计模式',
    'DDD': 'DDD',
    '容器': '容器',
    '云计算': '云计算',
    '计算机网络': '计算机网络',
    '操作系统': '操作系统',
    '数据结构': '数据结构',
    '网络安全': '网络安全',
    '单元测试': '单元测试',
    'Maven&Git': 'Maven & Git',
    'IDEA': 'IDEA',
    '日志': '日志',
    '定时任务': '定时任务',
    '文件处理': '文件处理',
    '配置中心': '配置中心',
    '线上问题排查': '线上问题排查',
    '场景题': '场景题',
    '架构设计': '架构设计',
    '大厂实践': '大厂实践',
    '项目难点&亮点': '项目难点&亮点',
    '面经实战': '面经实战',
    '编程题': '编程题',
    '智商题': '智商题',
    '非技术问题': '非技术问题',
    '其他': '其他',
    '其他专属内容': '其他专属内容',
    'Oracle': 'Oracle',
    'JavaScript': 'JavaScript',
    'TypeScript': 'TypeScript',
    'React': 'React',
    'CSS': 'CSS',
    'HTML': 'HTML',
    '浏览器与网络': '浏览器与网络',
    '前端工程化': '前端工程化'
  }
  return map[dirName] || dirName
}

function sanitizeId(id) {
  return id
    .replace(/[✅?？'"]/g, '')
    .replace(/[\s<>|\\:*"]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim()
}

function transformImagePaths(content, categoryPath) {
  // Transform relative image paths like ./img/xxx.png to absolute paths /mds/Category/img/xxx.png
  return content.replace(/!\[([^\]]*)\]\(\.\/([^)]+)\)/g, (match, alt, imgPath) => {
    const category = categoryPath.split('/')[0]
    return `![${alt}](/mds/${category}/${imgPath})`
  })
}

function processDirectory(dirPath, relativePath = '') {
  const items = fs.readdirSync(dirPath)
  const questions = []

  for (const item of items) {
    const itemPath = path.join(dirPath, item)
    const itemRelativePath = path.join(relativePath, item)
    const stat = fs.statSync(itemPath)

    if (stat.isDirectory()) {
      const subQuestions = processDirectory(itemPath, itemRelativePath)
      questions.push(...subQuestions)
    } else if (item.endsWith('.md')) {
      const content = fs.readFileSync(itemPath, 'utf-8')
      const title = extractTitle(content)
      const rawId = item.replace(/\.md$/, '').trim()
      const id = sanitizeId(rawId)

      if (title && id !== 'index' && id !== '新增面试题' && !id.includes('Timeline') && !id.startsWith('To读者')) {
        questions.push({
          id,
          title,
          category: relativePath.split('/')[0] || '其他',
          content: transformImagePaths(content, itemRelativePath),
          preview: content.slice(0, 200).replace(/[#*`\n\r]/g, ' ').trim(),
          path: itemRelativePath
        })
      }
    }
  }

  return questions
}

function main() {
  console.log('Building data...')

  // Create both output directories
  for (const dir of [SRC_DATA_DIR, PUBLIC_DATA_DIR]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  }

  const publicContentDir = path.join(PUBLIC_DATA_DIR, 'content')
  if (!fs.existsSync(publicContentDir)) {
    fs.mkdirSync(publicContentDir, { recursive: true })
  }

  const allQuestions = processDirectory(MDS_DIR)

  // Group by category
  const categoryMap = {}
  for (const q of allQuestions) {
    const cat = q.category
    if (!categoryMap[cat]) categoryMap[cat] = []
    categoryMap[cat].push(q)
  }

  // Generate categories index
  const categories = Object.entries(categoryMap)
    .map(([id, questions], index) => ({
      id,
      name: getCategoryName(id),
      count: questions.length,
      order: index
    }))
    .sort((a, b) => a.order - b.order)

  const indexData = JSON.stringify({ categories }, null, 2)
  fs.writeFileSync(path.join(SRC_DATA_DIR, 'index.json'), indexData)
  fs.writeFileSync(path.join(PUBLIC_DATA_DIR, 'index.json'), indexData)
  console.log(`Created index.json with ${categories.length} categories`)

  // Generate category content files (only in public/data for runtime fetch)
  for (const [catId, questions] of Object.entries(categoryMap)) {
    fs.writeFileSync(
      path.join(publicContentDir, `${catId}.json`),
      JSON.stringify({ category: getCategoryName(catId), questions }, null, 2)
    )
  }
  console.log(`Created ${Object.keys(categoryMap).length} category files in public/data/content/`)

  // Generate search index (to both locations)
  const searchIndex = allQuestions.map(q => ({
    id: q.id,
    title: q.title,
    category: getCategoryName(q.category),
    categoryId: q.category,
    preview: q.preview
  }))

  const searchData = JSON.stringify(searchIndex, null, 2)
  fs.writeFileSync(path.join(SRC_DATA_DIR, 'search-index.json'), searchData)
  fs.writeFileSync(path.join(PUBLIC_DATA_DIR, 'search-index.json'), searchData)
  console.log(`Created search-index.json with ${searchIndex.length} entries`)

  console.log(`\n✓ Processed ${allQuestions.length} questions across ${categories.length} categories`)
}

main()
