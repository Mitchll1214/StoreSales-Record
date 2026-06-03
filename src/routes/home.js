// 首页路由 — 随机励志语录
const express = require('express');
const https = require('https');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// 本地励志语录库（API 获取失败时使用）
const LOCAL_QUOTES = [
  { text: '每一个不曾起舞的日子，都是对生命的辜负。', from: '尼采' },
  { text: '天行健，君子以自强不息。', from: '《周易》' },
  { text: '千里之行，始于足下。', from: '《道德经》' },
  { text: '世上无难事，只要肯登攀。', from: '毛泽东' },
  { text: '不积跬步，无以至千里；不积小流，无以成江海。', from: '荀子' },
  { text: '志当存高远。', from: '诸葛亮' },
  { text: '宝剑锋从磨砺出，梅花香自苦寒来。', from: '《警世贤文》' },
  { text: '业精于勤，荒于嬉；行成于思，毁于随。', from: '韩愈' },
  { text: '路漫漫其修远兮，吾将上下而求索。', from: '屈原' },
  { text: '长风破浪会有时，直挂云帆济沧海。', from: '李白' },
  { text: '博观而约取，厚积而薄发。', from: '苏轼' },
  { text: '不要人夸好颜色，只留清气满乾坤。', from: '王冕' },
  { text: '人生在勤，不索何获。', from: '张衡' },
  { text: '天生我材必有用，千金散尽还复来。', from: '李白' },
  { text: '千磨万击还坚劲，任尔东西南北风。', from: '郑燮' },
  { text: '盛年不重来，一日难再晨。及时当勉励，岁月不待人。', from: '陶渊明' },
  { text: '古之立大事者，不惟有超世之才，亦必有坚忍不拔之志。', from: '苏轼' },
  { text: '书山有路勤为径，学海无涯苦作舟。', from: '韩愈' },
  { text: '有志者，事竟成。', from: '《后汉书》' },
  { text: '勿以恶小而为之，勿以善小而不为。', from: '刘备' },
];

// 从一言API获取随机语录
function fetchOnlineQuote() {
  return new Promise((resolve, reject) => {
    const req = https.get('https://v1.hitokoto.cn/?c=a&c=b&c=c&c=d&c=e&c=f&c=g&c=h&c=i&c=j&c=k&c=l&encode=json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            text: json.hitokoto,
            from: json.from || '一言',
          });
        } catch (e) {
          reject(new Error('解析失败'));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(3000, () => {
      req.destroy();
      reject(new Error('请求超时'));
    });
  });
}

// 从本地库随机取一条
function getLocalQuote() {
  const idx = Math.floor(Math.random() * LOCAL_QUOTES.length);
  return LOCAL_QUOTES[idx];
}

// ========== 路由 ==========

// 首页（需要登录）
router.get('/home', authRequired, async (req, res) => {
  let quote;
  let source = 'local';

  try {
    quote = await fetchOnlineQuote();
    source = 'api';
  } catch (err) {
    quote = getLocalQuote();
  }

  const greeting = getGreeting();
  const now = getBeijingTime();

  res.render('home', {
    user: req.user,
    currentPage: 'home',
    title: '首页',
    quote,
    source,
    greeting,
    now,
  });
});

// 获取北京时间（解决 Docker 容器 UTC 时区问题）
function getBeijingTime() {
  const utc = new Date();
  return new Date(utc.getTime() + 8 * 60 * 60 * 1000);
}

// 根据北京时间返回问候语
function getGreeting() {
  const hour = getBeijingTime().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 9) return '早上好';
  if (hour < 12) return '上午好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  if (hour < 22) return '晚上好';
  return '夜深了';
}

module.exports = router;
