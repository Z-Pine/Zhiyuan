/**
 * 院校数据爬虫
 * 从教育部阳光高考平台获取院校基础信息
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const axios = require('axios');
const { pool } = require('../src/config/database');

// 反爬虫配置
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
];

const getRandomUserAgent = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getRandomDelay = () => Math.floor(Math.random() * 2000) + 1000; // 1-3秒随机延迟

// 院校基础数据（手动整理的核心院校）
const CORE_SCHOOLS = [
  // 985院校
  { name: '北京大学', code: '10001', province: '北京', city: '北京', category: '综合', level: '985', is_985: true, is_211: true, is_double_first: true },
  { name: '清华大学', code: '10003', province: '北京', city: '北京', category: '理工', level: '985', is_985: true, is_211: true, is_double_first: true },
  { name: '中国人民大学', code: '10002', province: '北京', city: '北京', category: '综合', level: '985', is_985: true, is_211: true, is_double_first: true },
  { name: '北京航空航天大学', code: '10006', province: '北京', city: '北京', category: '理工', level: '985', is_985: true, is_211: true, is_double_first: true },
  { name: '北京理工大学', code: '10007', province: '北京', city: '北京', category: '理工', level: '985', is_985: true, is_211: true, is_double_first: true },
  { name: '北京师范大学', code: '10027', province: '北京', city: '北京', category: '师范', level: '985', is_985: true, is_211: true, is_double_first: true },
  { name: '中国农业大学', code: '10019', province: '北京', city: '北京', category: '农林', level: '985', is_985: true, is_211: true, is_double_first: true },
  { name: '中央民族大学', code: '10052', province: '北京', city: '北京', category: '民族', level: '985', is_985: true, is_211: true, is_double_first: true },
  { name: '复旦大学', code: '10246', province: '上海', city: '上海', category: '综合', level: '985', is_985: true, is_211: true, is_double_first: true },
  { name: '上海交通大学', code: '10248', province: '上海', city: '上海', category: '理工', level: '985', is_985: true, is_211: true, is_double_first: true },
  { name: '同济大学', code: '10247', province: '上海', city: '上海', category: '理工', level: '985', is_985: true, is_211: true, is_double_first: true },
  { name: '华东师范大学', code: '10269', province: '上海', city: '上海', category: '师范', level: '985', is_985: true, is_211: true, is_double_first: true },
  { name: '南京大学', code: '10284', province: '江苏', city: '南京', category: '综合', level: '985', is_985: true, is_211: true, is_double_first: true },
  { name: '东南大学', code: '10286', province: '江苏', city: '南京', category: '理工', level: '985', is_985: true, is_211: true, is_double_first: true },
  { name: '浙江大学', code: '10335', province: '浙江', city: '杭州', category: '综合', level: '985', is_985: true, is_211: true, is_double_first: true },
  { name: '中国科学技术大学', code: '10358', province: '安徽', city: '合肥', category: '理工', level: '985', is_985: true, is_211: true, is_double_first: true },
  { name: '厦门大学', code: '10384', province: '福建', city: '厦门', category: '综合', level: '985', is_985: true, is_211: true, is_double_first: true },
  { name: '山东大学', code: '10422', province: '山东', city: '济南', category: '综合', level: '985', is_985: true, is_211: true, is_double_first: true },
  { name: '中国海洋大学', code: '10423', province: '山东', city: '青岛', category: '综合', level: '985', is_985: true, is_211: true, is_double_first: true },
  { name: '武汉大学', code: '10486', province: '湖北', city: '武汉', category: '综合', level: '985', is_985: true, is_211: true, is_double_first: true },
  { name: '华中科技大学', code: '10487', province: '湖北', city: '武汉', category: '理工', level: '985', is_985: true, is_211: true, is_double_first: true },
  { name: '湖南大学', code: '10532', province: '湖南', city: '长沙', category: '综合', level: '985', is_985: true, is_211: true, is_double_first: true },
  { name: '中南大学', code: '10533', province: '湖南', city: '长沙', category: '综合', level: '985', is_985: true, is_211: true, is_double_first: true },
  { name: '国防科技大学', code: '91002', province: '湖南', city: '长沙', category: '军事', level: '985', is_985: true, is_211: true, is_double_first: true },
  { name: '中山大学', code: '10558', province: '广东', city: '广州', category: '综合', level: '985', is_985: true, is_211: true, is_double_first: true },
  { name: '华南理工大学', code: '10561', province: '广东', city: '广州', category: '理工', level: '985', is_985: true, is_211: true, is_double_first: true },
  { name: '四川大学', code: '10610', province: '四川', city: '成都', category: '综合', level: '985', is_985: true, is_211: true, is_double_first: true },
  { name: '电子科技大学', code: '10614', province: '四川', city: '成都', category: '理工', level: '985', is_985: true, is_211: true, is_double_first: true },
  { name: '重庆大学', code: '10611', province: '重庆', city: '重庆', category: '综合', level: '985', is_985: true, is_211: true, is_double_first: true },
  { name: '西安交通大学', code: '10698', province: '陕西', city: '西安', category: '理工', level: '985', is_985: true, is_211: true, is_double_first: true },
  { name: '西北工业大学', code: '10699', province: '陕西', city: '西安', category: '理工', level: '985', is_985: true, is_211: true, is_double_first: true },
  { name: '西北农林科技大学', code: '10712', province: '陕西', city: '杨凌', category: '农林', level: '985', is_985: true, is_211: true, is_double_first: true },
  { name: '兰州大学', code: '10730', province: '甘肃', city: '兰州', category: '综合', level: '985', is_985: true, is_211: true, is_double_first: true },
  { name: '南开大学', code: '10055', province: '天津', city: '天津', category: '综合', level: '985', is_985: true, is_211: true, is_double_first: true },
  { name: '天津大学', code: '10056', province: '天津', city: '天津', category: '理工', level: '985', is_985: true, is_211: true, is_double_first: true },
  { name: '大连理工大学', code: '10141', province: '辽宁', city: '大连', category: '理工', level: '985', is_985: true, is_211: true, is_double_first: true },
  { name: '东北大学', code: '10145', province: '辽宁', city: '沈阳', category: '理工', level: '985', is_985: true, is_211: true, is_double_first: true },
  { name: '吉林大学', code: '10183', province: '吉林', city: '长春', category: '综合', level: '985', is_985: true, is_211: true, is_double_first: true },
  { name: '哈尔滨工业大学', code: '10213', province: '黑龙江', city: '哈尔滨', category: '理工', level: '985', is_985: true, is_211: true, is_double_first: true },
  { name: '哈尔滨工程大学', code: '10217', province: '黑龙江', city: '哈尔滨', category: '理工', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '东北师范大学', code: '10200', province: '吉林', city: '长春', category: '师范', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '辽宁大学', code: '10140', province: '辽宁', city: '沈阳', category: '综合', level: '211', is_985: false, is_211: true, is_double_first: false },
  { name: '大连海事大学', code: '10151', province: '辽宁', city: '大连', category: '理工', level: '211', is_985: false, is_211: true, is_double_first: false },
  { name: '延边大学', code: '10184', province: '吉林', city: '延边', category: '综合', level: '211', is_985: false, is_211: true, is_double_first: false },
  { name: '东北林业大学', code: '10225', province: '黑龙江', city: '哈尔滨', category: '农林', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '东北农业大学', code: '10224', province: '黑龙江', city: '哈尔滨', category: '农林', level: '211', is_985: false, is_211: true, is_double_first: false },
  { name: '北京交通大学', code: '10004', province: '北京', city: '北京', category: '理工', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '北京工业大学', code: '10005', province: '北京', city: '北京', category: '理工', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '北京科技大学', code: '10008', province: '北京', city: '北京', category: '理工', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '北京化工大学', code: '10010', province: '北京', city: '北京', category: '理工', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '北京邮电大学', code: '10013', province: '北京', city: '北京', category: '理工', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '北京林业大学', code: '10022', province: '北京', city: '北京', category: '农林', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '北京中医药大学', code: '10026', province: '北京', city: '北京', category: '医药', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '北京外国语大学', code: '10030', province: '北京', city: '北京', category: '语言', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '中国传媒大学', code: '10033', province: '北京', city: '北京', category: '语言', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '中央财经大学', code: '10034', province: '北京', city: '北京', category: '财经', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '对外经济贸易大学', code: '10036', province: '北京', city: '北京', category: '财经', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '中国政法大学', code: '10053', province: '北京', city: '北京', category: '政法', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '华北电力大学', code: '10054', province: '北京', city: '北京', category: '理工', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '中国矿业大学(北京)', code: '11413', province: '北京', city: '北京', category: '理工', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '中国石油大学(北京)', code: '11414', province: '北京', city: '北京', category: '理工', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '中国地质大学(北京)', code: '11415', province: '北京', city: '北京', category: '理工', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '天津医科大学', code: '10062', province: '天津', city: '天津', category: '医药', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '河北工业大学', code: '10080', province: '天津', city: '天津', category: '理工', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '太原理工大学', code: '10112', province: '山西', city: '太原', category: '理工', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '内蒙古大学', code: '10126', province: '内蒙古', city: '呼和浩特', category: '综合', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '上海外国语大学', code: '10271', province: '上海', city: '上海', category: '语言', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '上海财经大学', code: '10272', province: '上海', city: '上海', category: '财经', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '上海大学', code: '10280', province: '上海', city: '上海', category: '综合', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '华东理工大学', code: '10251', province: '上海', city: '上海', category: '理工', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '东华大学', code: '10255', province: '上海', city: '上海', category: '理工', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '上海海洋大学', code: '10264', province: '上海', city: '上海', category: '农林', level: '双一流', is_985: false, is_211: false, is_double_first: true },
  { name: '上海中医药大学', code: '10268', province: '上海', city: '上海', category: '医药', level: '双一流', is_985: false, is_211: false, is_double_first: true },
  { name: '上海体育学院', code: '10277', province: '上海', city: '上海', category: '体育', level: '双一流', is_985: false, is_211: false, is_double_first: true },
  { name: '上海音乐学院', code: '10278', province: '上海', city: '上海', category: '艺术', level: '双一流', is_985: false, is_211: false, is_double_first: true },
  { name: '海军军医大学', code: '91020', province: '上海', city: '上海', category: '军事', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '苏州大学', code: '10285', province: '江苏', city: '苏州', category: '综合', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '南京航空航天大学', code: '10287', province: '江苏', city: '南京', category: '理工', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '南京理工大学', code: '10288', province: '江苏', city: '南京', category: '理工', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '中国矿业大学', code: '10290', province: '江苏', city: '徐州', category: '理工', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '河海大学', code: '10294', province: '江苏', city: '南京', category: '理工', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '江南大学', code: '10295', province: '江苏', city: '无锡', category: '综合', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '南京农业大学', code: '10307', province: '江苏', city: '南京', category: '农林', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '中国药科大学', code: '10316', province: '江苏', city: '南京', category: '医药', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '南京师范大学', code: '10319', province: '江苏', city: '南京', category: '师范', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '南京邮电大学', code: '10293', province: '江苏', city: '南京', category: '理工', level: '双一流', is_985: false, is_211: false, is_double_first: true },
  { name: '南京林业大学', code: '10298', province: '江苏', city: '南京', category: '农林', level: '双一流', is_985: false, is_211: false, is_double_first: true },
  { name: '南京信息工程大学', code: '10300', province: '江苏', city: '南京', category: '理工', level: '双一流', is_985: false, is_211: false, is_double_first: true },
  { name: '南京医科大学', code: '10312', province: '江苏', city: '南京', category: '医药', level: '双一流', is_985: false, is_211: false, is_double_first: true },
  { name: '南京中医药大学', code: '10315', province: '江苏', city: '南京', category: '医药', level: '双一流', is_985: false, is_211: false, is_double_first: true },
  { name: '安徽大学', code: '10357', province: '安徽', city: '合肥', category: '综合', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '合肥工业大学', code: '10359', province: '安徽', city: '合肥', category: '理工', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '福州大学', code: '10386', province: '福建', city: '福州', category: '理工', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '南昌大学', code: '10403', province: '江西', city: '南昌', category: '综合', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '中国石油大学(华东)', code: '10425', province: '山东', city: '青岛', category: '理工', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '郑州大学', code: '10459', province: '河南', city: '郑州', category: '综合', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '武汉理工大学', code: '10497', province: '湖北', city: '武汉', category: '理工', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '中国地质大学(武汉)', code: '10491', province: '湖北', city: '武汉', category: '理工', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '华中农业大学', code: '10504', province: '湖北', city: '武汉', category: '农林', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '华中师范大学', code: '10511', province: '湖北', city: '武汉', category: '师范', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '中南财经政法大学', code: '10520', province: '湖北', city: '武汉', category: '财经', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '暨南大学', code: '10559', province: '广东', city: '广州', category: '综合', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '华南师范大学', code: '10574', province: '广东', city: '广州', category: '师范', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '广州医科大学', code: '10570', province: '广东', city: '广州', category: '医药', level: '双一流', is_985: false, is_211: false, is_double_first: true },
  { name: '广州中医药大学', code: '10572', province: '广东', city: '广州', category: '医药', level: '双一流', is_985: false, is_211: false, is_double_first: true },
  { name: '南方科技大学', code: '14325', province: '广东', city: '深圳', category: '理工', level: '双一流', is_985: false, is_211: false, is_double_first: true },
  { name: '华南农业大学', code: '10564', province: '广东', city: '广州', category: '农林', level: '双一流', is_985: false, is_211: false, is_double_first: true },
  { name: '广西大学', code: '10593', province: '广西', city: '南宁', category: '综合', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '海南大学', code: '10589', province: '海南', city: '海口', category: '综合', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '西南交通大学', code: '10613', province: '四川', city: '成都', category: '理工', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '西南财经大学', code: '10651', province: '四川', city: '成都', category: '财经', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '四川农业大学', code: '10626', province: '四川', city: '雅安', category: '农林', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '成都理工大学', code: '10616', province: '四川', city: '成都', category: '理工', level: '双一流', is_985: false, is_211: false, is_double_first: true },
  { name: '成都中医药大学', code: '10633', province: '四川', city: '成都', category: '医药', level: '双一流', is_985: false, is_211: false, is_double_first: true },
  { name: '西南大学', code: '10635', province: '重庆', city: '重庆', category: '综合', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '贵州大学', code: '10657', province: '贵州', city: '贵阳', category: '综合', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '云南大学', code: '10673', province: '云南', city: '昆明', category: '综合', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '西藏大学', code: '10694', province: '西藏', city: '拉萨', category: '综合', level: '211', is_985: false, is_211: true, is_double_first: false },
  { name: '西北大学', code: '10697', province: '陕西', city: '西安', category: '综合', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '西安电子科技大学', code: '10701', province: '陕西', city: '西安', category: '理工', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '长安大学', code: '10710', province: '陕西', city: '西安', category: '理工', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '陕西师范大学', code: '10718', province: '陕西', city: '西安', category: '师范', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '空军军医大学', code: '91030', province: '陕西', city: '西安', category: '军事', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '青海大学', code: '10743', province: '青海', city: '西宁', category: '综合', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '宁夏大学', code: '10749', province: '宁夏', city: '银川', category: '综合', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '新疆大学', code: '10755', province: '新疆', city: '乌鲁木齐', category: '综合', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '石河子大学', code: '10759', province: '新疆', city: '石河子', category: '综合', level: '211', is_985: false, is_211: true, is_double_first: true },
  { name: '南方医科大学', code: '12121', province: '广东', city: '广州', category: '医药', level: '普通', is_985: false, is_211: false, is_double_first: false },
  { name: '深圳大学', code: '10590', province: '广东', city: '深圳', category: '综合', level: '普通', is_985: false, is_211: false, is_double_first: false },
  { name: '广东工业大学', code: '11845', province: '广东', city: '广州', category: '理工', level: '普通', is_985: false, is_211: false, is_double_first: false },
  { name: '广东外语外贸大学', code: '11846', province: '广东', city: '广州', category: '语言', level: '普通', is_985: false, is_211: false, is_double_first: false },
  { name: '汕头大学', code: '10560', province: '广东', city: '汕头', category: '综合', level: '普通', is_985: false, is_211: false, is_double_first: false },
  { name: '杭州电子科技大学', code: '10336', province: '浙江', city: '杭州', category: '理工', level: '普通', is_985: false, is_211: false, is_double_first: false },
  { name: '浙江工业大学', code: '10337', province: '浙江', city: '杭州', category: '理工', level: '普通', is_985: false, is_211: false, is_double_first: false },
  { name: '浙江师范大学', code: '10345', province: '浙江', city: '金华', category: '师范', level: '普通', is_985: false, is_211: false, is_double_first: false },
  { name: '宁波大学', code: '11646', province: '浙江', city: '宁波', category: '综合', level: '双一流', is_985: false, is_211: false, is_double_first: true },
  { name: '浙江工商大学', code: '10353', province: '浙江', city: '杭州', category: '财经', level: '普通', is_985: false, is_211: false, is_double_first: false },
  { name: '南京工业大学', code: '10291', province: '江苏', city: '南京', category: '理工', level: '普通', is_985: false, is_211: false, is_double_first: false },
  { name: '扬州大学', code: '11117', province: '江苏', city: '扬州', category: '综合', level: '普通', is_985: false, is_211: false, is_double_first: false },
  { name: '江苏大学', code: '10299', province: '江苏', city: '镇江', category: '综合', level: '普通', is_985: false, is_211: false, is_double_first: false },
  { name: '燕山大学', code: '10216', province: '河北', city: '秦皇岛', category: '理工', level: '普通', is_985: false, is_211: false, is_double_first: false },
  { name: '河北大学', code: '10075', province: '河北', city: '保定', category: '综合', level: '普通', is_985: false, is_211: false, is_double_first: false },
  { name: '山西大学', code: '10108', province: '山西', city: '太原', category: '综合', level: '双一流', is_985: false, is_211: false, is_double_first: true },
  { name: '中北大学', code: '10110', province: '山西', city: '太原', category: '理工', level: '普通', is_985: false, is_211: false, is_double_first: false },
  { name: '河南大学', code: '10475', province: '河南', city: '开封', category: '综合', level: '双一流', is_985: false, is_211: false, is_double_first: true },
  { name: '河南师范大学', code: '10476', province: '河南', city: '新乡', category: '师范', level: '普通', is_985: false, is_211: false, is_double_first: false },
  { name: '湘潭大学', code: '10530', province: '湖南', city: '湘潭', category: '综合', level: '双一流', is_985: false, is_211: false, is_double_first: true },
  { name: '长沙理工大学', code: '10536', province: '湖南', city: '长沙', category: '理工', level: '普通', is_985: false, is_211: false, is_double_first: false },
  { name: '昆明理工大学', code: '10674', province: '云南', city: '昆明', category: '理工', level: '普通', is_985: false, is_211: false, is_double_first: false },
  { name: '西安建筑科技大学', code: '10703', province: '陕西', city: '西安', category: '理工', level: '普通', is_985: false, is_211: false, is_double_first: false },
  { name: '西安理工大学', code: '10700', province: '陕西', city: '西安', category: '理工', level: '普通', is_985: false, is_211: false, is_double_first: false },
  { name: '兰州交通大学', code: '10732', province: '甘肃', city: '兰州', category: '理工', level: '普通', is_985: false, is_211: false, is_double_first: false },
  { name: '西北师范大学', code: '10736', province: '甘肃', city: '兰州', category: '师范', level: '普通', is_985: false, is_211: false, is_double_first: false },
  { name: '哈尔滨医科大学', code: '10226', province: '黑龙江', city: '哈尔滨', category: '医药', level: '普通', is_985: false, is_211: false, is_double_first: false },
  { name: '东北财经大学', code: '10173', province: '辽宁', city: '大连', category: '财经', level: '普通', is_985: false, is_211: false, is_double_first: false },
];

// 将数据导入数据库
const importSchools = async () => {
  const client = await pool.connect();
  
  try {
    console.log('开始导入院校数据...');
    await client.query('BEGIN');
    
    let imported = 0;
    for (const school of CORE_SCHOOLS) {
      await client.query(`
        INSERT INTO schools (name, code, province, city, category, level, is_985, is_211, is_double_first)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (code) DO UPDATE SET
          name = EXCLUDED.name,
          province = EXCLUDED.province,
          city = EXCLUDED.city,
          category = EXCLUDED.category,
          level = EXCLUDED.level,
          is_985 = EXCLUDED.is_985,
          is_211 = EXCLUDED.is_211,
          is_double_first = EXCLUDED.is_double_first
      `, [
        school.name,
        school.code,
        school.province,
        school.city,
        school.category,
        school.level,
        school.is_985,
        school.is_211,
        school.is_double_first
      ]);
      imported++;
      
      if (imported % 10 === 0) {
        console.log(`已导入 ${imported}/${CORE_SCHOOLS.length} 所院校`);
      }
      
      // 随机延迟，避免过快
      await sleep(getRandomDelay());
    }
    
    await client.query('COMMIT');
    console.log(`✅ 院校数据导入完成！共导入 ${imported} 所院校`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('院校数据导入失败:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { importSchools };

// 直接运行
if (require.main === module) {
  importSchools()
    .then(() => {
      console.log('导入脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('导入脚本执行失败:', error);
      process.exit(1);
    });
}
