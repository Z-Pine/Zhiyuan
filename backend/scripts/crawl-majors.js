/**
 * 专业数据导入脚本
 * 基于教育部专业目录整理
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { pool } = require('../src/config/database');

// 专业类别和具体专业
const MAJORS_DATA = [
  // 哲学
  { category: '哲学', name: '哲学', code: '010101', degree: '哲学学士', duration: 4 },
  { category: '哲学', name: '逻辑学', code: '010102', degree: '哲学学士', duration: 4 },
  { category: '哲学', name: '宗教学', code: '010103', degree: '哲学学士', duration: 4 },
  
  // 经济学
  { category: '经济学', name: '经济学', code: '020101', degree: '经济学学士', duration: 4 },
  { category: '经济学', name: '经济统计学', code: '020102', degree: '经济学学士', duration: 4 },
  { category: '经济学', name: '财政学', code: '020201', degree: '经济学学士', duration: 4 },
  { category: '经济学', name: '税收学', code: '020202', degree: '经济学学士', duration: 4 },
  { category: '经济学', name: '金融学', code: '020301', degree: '经济学学士', duration: 4 },
  { category: '经济学', name: '金融工程', code: '020302', degree: '经济学学士', duration: 4 },
  { category: '经济学', name: '保险学', code: '020303', degree: '经济学学士', duration: 4 },
  { category: '经济学', name: '投资学', code: '020304', degree: '经济学学士', duration: 4 },
  { category: '经济学', name: '国际经济与贸易', code: '020401', degree: '经济学学士', duration: 4 },
  { category: '经济学', name: '贸易经济', code: '020402', degree: '经济学学士', duration: 4 },
  
  // 法学
  { category: '法学', name: '法学', code: '030101', degree: '法学学士', duration: 4 },
  { category: '法学', name: '知识产权', code: '030102', degree: '法学学士', duration: 4 },
  { category: '法学', name: '监狱学', code: '030103', degree: '法学学士', duration: 4 },
  { category: '法学', name: '信用风险管理与法律防控', code: '030104', degree: '法学学士', duration: 4 },
  { category: '政治学', name: '政治学与行政学', code: '030201', degree: '法学学士', duration: 4 },
  { category: '政治学', name: '国际政治', code: '030202', degree: '法学学士', duration: 4 },
  { category: '社会学', name: '社会学', code: '030301', degree: '法学学士', duration: 4 },
  { category: '社会学', name: '社会工作', code: '030302', degree: '法学学士', duration: 4 },
  { category: '民族学', name: '民族学', code: '030401', degree: '法学学士', duration: 4 },
  { category: '马克思主义理论', name: '科学社会主义', code: '030501', degree: '法学学士', duration: 4 },
  { category: '马克思主义理论', name: '思想政治教育', code: '030503', degree: '法学学士', duration: 4 },
  { category: '公安学', name: '治安学', code: '030601', degree: '法学学士', duration: 4 },
  { category: '公安学', name: '侦查学', code: '030602', degree: '法学学士', duration: 4 },
  
  // 教育学
  { category: '教育学', name: '教育学', code: '040101', degree: '教育学学士', duration: 4 },
  { category: '教育学', name: '科学教育', code: '040102', degree: '教育学学士', duration: 4 },
  { category: '教育学', name: '人文教育', code: '040103', degree: '教育学学士', duration: 4 },
  { category: '教育学', name: '教育技术学', code: '040104', degree: '教育学学士', duration: 4 },
  { category: '教育学', name: '艺术教育', code: '040105', degree: '教育学学士', duration: 4 },
  { category: '教育学', name: '学前教育', code: '040106', degree: '教育学学士', duration: 4 },
  { category: '教育学', name: '小学教育', code: '040107', degree: '教育学学士', duration: 4 },
  { category: '教育学', name: '特殊教育', code: '040108', degree: '教育学学士', duration: 4 },
  { category: '体育学', name: '体育教育', code: '040201', degree: '教育学学士', duration: 4 },
  { category: '体育学', name: '运动训练', code: '040202', degree: '教育学学士', duration: 4 },
  { category: '体育学', name: '社会体育指导与管理', code: '040203', degree: '教育学学士', duration: 4 },
  
  // 文学
  { category: '中国语言文学', name: '汉语言文学', code: '050101', degree: '文学学士', duration: 4 },
  { category: '中国语言文学', name: '汉语言', code: '050102', degree: '文学学士', duration: 4 },
  { category: '中国语言文学', name: '汉语国际教育', code: '050103', degree: '文学学士', duration: 4 },
  { category: '外国语言文学', name: '英语', code: '050201', degree: '文学学士', duration: 4 },
  { category: '外国语言文学', name: '俄语', code: '050202', degree: '文学学士', duration: 4 },
  { category: '外国语言文学', name: '德语', code: '050203', degree: '文学学士', duration: 4 },
  { category: '外国语言文学', name: '法语', code: '050204', degree: '文学学士', duration: 4 },
  { category: '外国语言文学', name: '西班牙语', code: '050205', degree: '文学学士', duration: 4 },
  { category: '外国语言文学', name: '阿拉伯语', code: '050206', degree: '文学学士', duration: 4 },
  { category: '外国语言文学', name: '日语', code: '050207', degree: '文学学士', duration: 4 },
  { category: '外国语言文学', name: '朝鲜语', code: '050209', degree: '文学学士', duration: 4 },
  { category: '新闻传播学', name: '新闻学', code: '050301', degree: '文学学士', duration: 4 },
  { category: '新闻传播学', name: '广播电视学', code: '050302', degree: '文学学士', duration: 4 },
  { category: '新闻传播学', name: '广告学', code: '050303', degree: '文学学士', duration: 4 },
  { category: '新闻传播学', name: '传播学', code: '050304', degree: '文学学士', duration: 4 },
  { category: '新闻传播学', name: '网络与新媒体', code: '050306', degree: '文学学士', duration: 4 },
  
  // 历史学
  { category: '历史学', name: '历史学', code: '060101', degree: '历史学学士', duration: 4 },
  { category: '历史学', name: '世界史', code: '060102', degree: '历史学学士', duration: 4 },
  { category: '历史学', name: '考古学', code: '060103', degree: '历史学学士', duration: 4 },
  { category: '历史学', name: '文物与博物馆学', code: '060104', degree: '历史学学士', duration: 4 },
  
  // 理学
  { category: '数学', name: '数学与应用数学', code: '070101', degree: '理学学士', duration: 4 },
  { category: '数学', name: '信息与计算科学', code: '070102', degree: '理学学士', duration: 4 },
  { category: '物理学', name: '物理学', code: '070201', degree: '理学学士', duration: 4 },
  { category: '物理学', name: '应用物理学', code: '070202', degree: '理学学士', duration: 4 },
  { category: '化学', name: '化学', code: '070301', degree: '理学学士', duration: 4 },
  { category: '化学', name: '应用化学', code: '070302', degree: '理学学士', duration: 4 },
  { category: '天文学', name: '天文学', code: '070401', degree: '理学学士', duration: 4 },
  { category: '地理科学', name: '地理科学', code: '070501', degree: '理学学士', duration: 4 },
  { category: '地理科学', name: '自然地理与资源环境', code: '070502', degree: '理学学士', duration: 4 },
  { category: '地理科学', name: '人文地理与城乡规划', code: '070503', degree: '理学学士', duration: 4 },
  { category: '地理科学', name: '地理信息科学', code: '070504', degree: '理学学士', duration: 4 },
  { category: '大气科学', name: '大气科学', code: '070601', degree: '理学学士', duration: 4 },
  { category: '大气科学', name: '应用气象学', code: '070602', degree: '理学学士', duration: 4 },
  { category: '海洋科学', name: '海洋科学', code: '070701', degree: '理学学士', duration: 4 },
  { category: '海洋科学', name: '海洋技术', code: '070702', degree: '理学学士', duration: 4 },
  { category: '地球物理学', name: '地球物理学', code: '070801', degree: '理学学士', duration: 4 },
  { category: '地球物理学', name: '空间科学与技术', code: '070802', degree: '理学学士', duration: 4 },
  { category: '地质学', name: '地质学', code: '070901', degree: '理学学士', duration: 4 },
  { category: '地质学', name: '地球化学', code: '070902', degree: '理学学士', duration: 4 },
  { category: '生物科学', name: '生物科学', code: '071001', degree: '理学学士', duration: 4 },
  { category: '生物科学', name: '生物技术', code: '071002', degree: '理学学士', duration: 4 },
  { category: '生物科学', name: '生物信息学', code: '071003', degree: '理学学士', duration: 4 },
  { category: '心理学', name: '心理学', code: '071101', degree: '理学学士', duration: 4 },
  { category: '心理学', name: '应用心理学', code: '071102', degree: '理学学士', duration: 4 },
  { category: '统计学', name: '统计学', code: '071201', degree: '理学学士', duration: 4 },
  { category: '统计学', name: '应用统计学', code: '071202', degree: '理学学士', duration: 4 },
  
  // 工学
  { category: '力学', name: '理论与应用力学', code: '080101', degree: '工学学士', duration: 4 },
  { category: '力学', name: '工程力学', code: '080102', degree: '工学学士', duration: 4 },
  { category: '机械', name: '机械工程', code: '080201', degree: '工学学士', duration: 4 },
  { category: '机械', name: '机械设计制造及其自动化', code: '080202', degree: '工学学士', duration: 4 },
  { category: '机械', name: '材料成型及控制工程', code: '080203', degree: '工学学士', duration: 4 },
  { category: '机械', name: '机械电子工程', code: '080204', degree: '工学学士', duration: 4 },
  { category: '机械', name: '工业设计', code: '080205', degree: '工学学士', duration: 4 },
  { category: '机械', name: '车辆工程', code: '080207', degree: '工学学士', duration: 4 },
  { category: '机械', name: '汽车服务工程', code: '080208', degree: '工学学士', duration: 4 },
  { category: '仪器', name: '测控技术与仪器', code: '080301', degree: '工学学士', duration: 4 },
  { category: '材料', name: '材料科学与工程', code: '080401', degree: '工学学士', duration: 4 },
  { category: '材料', name: '材料物理', code: '080402', degree: '工学学士', duration: 4 },
  { category: '材料', name: '材料化学', code: '080403', degree: '工学学士', duration: 4 },
  { category: '材料', name: '冶金工程', code: '080404', degree: '工学学士', duration: 4 },
  { category: '材料', name: '金属材料工程', code: '080405', degree: '工学学士', duration: 4 },
  { category: '材料', name: '无机非金属材料工程', code: '080406', degree: '工学学士', duration: 4 },
  { category: '材料', name: '高分子材料与工程', code: '080407', degree: '工学学士', duration: 4 },
  { category: '能源动力', name: '能源与动力工程', code: '080501', degree: '工学学士', duration: 4 },
  { category: '能源动力', name: '新能源科学与工程', code: '080503', degree: '工学学士', duration: 4 },
  { category: '电气', name: '电气工程及其自动化', code: '080601', degree: '工学学士', duration: 4 },
  { category: '电气', name: '智能电网信息工程', code: '080602', degree: '工学学士', duration: 4 },
  { category: '电子信息', name: '电子信息工程', code: '080701', degree: '工学学士', duration: 4 },
  { category: '电子信息', name: '电子科学与技术', code: '080702', degree: '工学学士', duration: 4 },
  { category: '电子信息', name: '通信工程', code: '080703', degree: '工学学士', duration: 4 },
  { category: '电子信息', name: '微电子科学与工程', code: '080704', degree: '工学学士', duration: 4 },
  { category: '电子信息', name: '光电信息科学与工程', code: '080705', degree: '工学学士', duration: 4 },
  { category: '电子信息', name: '信息工程', code: '080706', degree: '工学学士', duration: 4 },
  { category: '电子信息', name: '人工智能', code: '080717', degree: '工学学士', duration: 4 },
  { category: '自动化', name: '自动化', code: '080801', degree: '工学学士', duration: 4 },
  { category: '自动化', name: '轨道交通信号与控制', code: '080802', degree: '工学学士', duration: 4 },
  { category: '自动化', name: '机器人工程', code: '080803', degree: '工学学士', duration: 4 },
  { category: '计算机', name: '计算机科学与技术', code: '080901', degree: '工学学士', duration: 4 },
  { category: '计算机', name: '软件工程', code: '080902', degree: '工学学士', duration: 4 },
  { category: '计算机', name: '网络工程', code: '080903', degree: '工学学士', duration: 4 },
  { category: '计算机', name: '信息安全', code: '080904', degree: '工学学士', duration: 4 },
  { category: '计算机', name: '物联网工程', code: '080905', degree: '工学学士', duration: 4 },
  { category: '计算机', name: '数字媒体技术', code: '080906', degree: '工学学士', duration: 4 },
  { category: '计算机', name: '数据科学与大数据技术', code: '080910', degree: '工学学士', duration: 4 },
  { category: '土木', name: '土木工程', code: '081001', degree: '工学学士', duration: 4 },
  { category: '土木', name: '建筑环境与能源应用工程', code: '081002', degree: '工学学士', duration: 4 },
  { category: '土木', name: '给排水科学与工程', code: '081003', degree: '工学学士', duration: 4 },
  { category: '土木', name: '建筑电气与智能化', code: '081004', degree: '工学学士', duration: 4 },
  { category: '水利', name: '水利水电工程', code: '081101', degree: '工学学士', duration: 4 },
  { category: '水利', name: '水文与水资源工程', code: '081102', degree: '工学学士', duration: 4 },
  { category: '测绘', name: '测绘工程', code: '081201', degree: '工学学士', duration: 4 },
  { category: '测绘', name: '遥感科学与技术', code: '081202', degree: '工学学士', duration: 4 },
  { category: '化工与制药', name: '化学工程与工艺', code: '081301', degree: '工学学士', duration: 4 },
  { category: '化工与制药', name: '制药工程', code: '081302', degree: '工学学士', duration: 4 },
  { category: '地质', name: '地质工程', code: '081401', degree: '工学学士', duration: 4 },
  { category: '地质', name: '勘查技术与工程', code: '081402', degree: '工学学士', duration: 4 },
  { category: '矿业', name: '采矿工程', code: '081501', degree: '工学学士', duration: 4 },
  { category: '矿业', name: '石油工程', code: '081502', degree: '工学学士', duration: 4 },
  { category: '纺织', name: '纺织工程', code: '081601', degree: '工学学士', duration: 4 },
  { category: '纺织', name: '服装设计与工程', code: '081602', degree: '工学学士', duration: 4 },
  { category: '轻工', name: '轻化工程', code: '081701', degree: '工学学士', duration: 4 },
  { category: '轻工', name: '包装工程', code: '081702', degree: '工学学士', duration: 4 },
  { category: '轻工', name: '印刷工程', code: '081703', degree: '工学学士', duration: 4 },
  { category: '交通运输', name: '交通运输', code: '081801', degree: '工学学士', duration: 4 },
  { category: '交通运输', name: '交通工程', code: '081802', degree: '工学学士', duration: 4 },
  { category: '交通运输', name: '航海技术', code: '081803', degree: '工学学士', duration: 4 },
  { category: '交通运输', name: '轮机工程', code: '081804', degree: '工学学士', duration: 4 },
  { category: '交通运输', name: '飞行技术', code: '081805', degree: '工学学士', duration: 4 },
  { category: '海洋工程', name: '船舶与海洋工程', code: '081901', degree: '工学学士', duration: 4 },
  { category: '航空航天', name: '航空航天工程', code: '082001', degree: '工学学士', duration: 4 },
  { category: '航空航天', name: '飞行器设计与工程', code: '082002', degree: '工学学士', duration: 4 },
  { category: '航空航天', name: '飞行器制造工程', code: '082003', degree: '工学学士', duration: 4 },
  { category: '兵器', name: '武器系统与工程', code: '082101', degree: '工学学士', duration: 4 },
  { category: '核工程', name: '核工程与核技术', code: '082201', degree: '工学学士', duration: 4 },
  { category: '农业工程', name: '农业工程', code: '082301', degree: '工学学士', duration: 4 },
  { category: '农业工程', name: '农业机械化及其自动化', code: '082302', degree: '工学学士', duration: 4 },
  { category: '林业工程', name: '森林工程', code: '082401', degree: '工学学士', duration: 4 },
  { category: '林业工程', name: '木材科学与工程', code: '082402', degree: '工学学士', duration: 4 },
  { category: '环境科学', name: '环境科学与工程', code: '082501', degree: '工学学士', duration: 4 },
  { category: '环境科学', name: '环境工程', code: '082502', degree: '工学学士', duration: 4 },
  { category: '环境科学', name: '环境科学', code: '082503', degree: '工学学士', duration: 4 },
  { category: '生物医学工程', name: '生物医学工程', code: '082601', degree: '工学学士', duration: 4 },
  { category: '食品科学', name: '食品科学与工程', code: '082701', degree: '工学学士', duration: 4 },
  { category: '食品科学', name: '食品质量与安全', code: '082702', degree: '工学学士', duration: 4 },
  { category: '建筑', name: '建筑学', code: '082801', degree: '建筑学学士', duration: 5 },
  { category: '建筑', name: '城乡规划', code: '082802', degree: '工学学士', duration: 5 },
  { category: '建筑', name: '风景园林', code: '082803', degree: '工学学士', duration: 4 },
  { category: '安全科学', name: '安全工程', code: '082901', degree: '工学学士', duration: 4 },
  { category: '生物工程', name: '生物工程', code: '083001', degree: '工学学士', duration: 4 },
  { category: '公安技术', name: '刑事科学技术', code: '083101', degree: '工学学士', duration: 4 },
  
  // 农学
  { category: '植物生产', name: '农学', code: '090101', degree: '农学学士', duration: 4 },
  { category: '植物生产', name: '园艺', code: '090102', degree: '农学学士', duration: 4 },
  { category: '植物生产', name: '植物保护', code: '090103', degree: '农学学士', duration: 4 },
  { category: '植物生产', name: '茶学', code: '090107', degree: '农学学士', duration: 4 },
  { category: '自然保护', name: '农业资源与环境', code: '090201', degree: '农学学士', duration: 4 },
  { category: '动物生产', name: '动物科学', code: '090301', degree: '农学学士', duration: 4 },
  { category: '动物医学', name: '动物医学', code: '090401', degree: '农学学士', duration: 5 },
  { category: '动物医学', name: '动植物检疫', code: '090403', degree: '农学学士', duration: 4 },
  { category: '林学', name: '林学', code: '090501', degree: '农学学士', duration: 4 },
  { category: '林学', name: '园林', code: '090502', degree: '农学学士', duration: 4 },
  { category: '水产', name: '水产养殖学', code: '090601', degree: '农学学士', duration: 4 },
  { category: '水产', name: '海洋渔业科学与技术', code: '090602', degree: '农学学士', duration: 4 },
  { category: '草学', name: '草业科学', code: '090701', degree: '农学学士', duration: 4 },
  
  // 医学
  { category: '基础医学', name: '基础医学', code: '100101', degree: '医学学士', duration: 5 },
  { category: '临床医学', name: '临床医学', code: '100201', degree: '医学学士', duration: 5 },
  { category: '临床医学', name: '麻醉学', code: '100202', degree: '医学学士', duration: 5 },
  { category: '临床医学', name: '医学影像学', code: '100203', degree: '医学学士', duration: 5 },
  { category: '临床医学', name: '眼视光医学', code: '100204', degree: '医学学士', duration: 5 },
  { category: '临床医学', name: '精神医学', code: '100205', degree: '医学学士', duration: 5 },
  { category: '临床医学', name: '放射医学', code: '100206', degree: '医学学士', duration: 5 },
  { category: '口腔医学', name: '口腔医学', code: '100301', degree: '医学学士', duration: 5 },
  { category: '公共卫生', name: '预防医学', code: '100401', degree: '医学学士', duration: 5 },
  { category: '公共卫生', name: '食品卫生与营养学', code: '100402', degree: '理学学士', duration: 4 },
  { category: '中医学', name: '中医学', code: '100501', degree: '医学学士', duration: 5 },
  { category: '中医学', name: '针灸推拿学', code: '100502', degree: '医学学士', duration: 5 },
  { category: '中医学', name: '中医康复学', code: '100510', degree: '医学学士', duration: 5 },
  { category: '中西医结合', name: '中西医临床医学', code: '100601', degree: '医学学士', duration: 5 },
  { category: '药学', name: '药学', code: '100701', degree: '理学学士', duration: 4 },
  { category: '药学', name: '药物制剂', code: '100702', degree: '理学学士', duration: 4 },
  { category: '药学', name: '临床药学', code: '100703', degree: '理学学士', duration: 5 },
  { category: '中药学', name: '中药学', code: '100801', degree: '理学学士', duration: 4 },
  { category: '法医学', name: '法医学', code: '100901', degree: '医学学士', duration: 5 },
  { category: '医学技术', name: '医学检验技术', code: '101001', degree: '理学学士', duration: 4 },
  { category: '医学技术', name: '医学影像技术', code: '101003', degree: '理学学士', duration: 4 },
  { category: '医学技术', name: '眼视光学', code: '101004', degree: '理学学士', duration: 4 },
  { category: '医学技术', name: '康复治疗学', code: '101005', degree: '理学学士', duration: 4 },
  { category: '护理学', name: '护理学', code: '101101', degree: '理学学士', duration: 4 },
  
  // 管理学
  { category: '管理科学', name: '管理科学', code: '120101', degree: '管理学学士', duration: 4 },
  { category: '管理科学', name: '信息管理与信息系统', code: '120102', degree: '管理学学士', duration: 4 },
  { category: '管理科学', name: '工程管理', code: '120103', degree: '管理学学士', duration: 4 },
  { category: '管理科学', name: '房地产开发与管理', code: '120104', degree: '管理学学士', duration: 4 },
  { category: '管理科学', name: '工程造价', code: '120105', degree: '管理学学士', duration: 4 },
  { category: '工商管理', name: '工商管理', code: '120201', degree: '管理学学士', duration: 4 },
  { category: '工商管理', name: '市场营销', code: '120202', degree: '管理学学士', duration: 4 },
  { category: '工商管理', name: '会计学', code: '120203', degree: '管理学学士', duration: 4 },
  { category: '工商管理', name: '财务管理', code: '120204', degree: '管理学学士', duration: 4 },
  { category: '工商管理', name: '国际商务', code: '120205', degree: '管理学学士', duration: 4 },
  { category: '工商管理', name: '人力资源管理', code: '120206', degree: '管理学学士', duration: 4 },
  { category: '工商管理', name: '审计学', code: '120207', degree: '管理学学士', duration: 4 },
  { category: '工商管理', name: '物业管理', code: '120209', degree: '管理学学士', duration: 4 },
  { category: '工商管理', name: '文化产业管理', code: '120210', degree: '管理学学士', duration: 4 },
  { category: '农业经济', name: '农林经济管理', code: '120301', degree: '管理学学士', duration: 4 },
  { category: '农业经济', name: '农村区域发展', code: '120302', degree: '管理学学士', duration: 4 },
  { category: '公共管理', name: '公共事业管理', code: '120401', degree: '管理学学士', duration: 4 },
  { category: '公共管理', name: '行政管理', code: '120402', degree: '管理学学士', duration: 4 },
  { category: '公共管理', name: '劳动与社会保障', code: '120403', degree: '管理学学士', duration: 4 },
  { category: '公共管理', name: '土地资源管理', code: '120404', degree: '管理学学士', duration: 4 },
  { category: '公共管理', name: '城市管理', code: '120405', degree: '管理学学士', duration: 4 },
  { category: '图书情报', name: '图书馆学', code: '120501', degree: '管理学学士', duration: 4 },
  { category: '图书情报', name: '档案学', code: '120502', degree: '管理学学士', duration: 4 },
  { category: '图书情报', name: '信息资源管理', code: '120503', degree: '管理学学士', duration: 4 },
  { category: '物流管理', name: '物流管理', code: '120601', degree: '管理学学士', duration: 4 },
  { category: '物流管理', name: '物流工程', code: '120602', degree: '工学学士', duration: 4 },
  { category: '物流管理', name: '采购管理', code: '120603', degree: '管理学学士', duration: 4 },
  { category: '物流管理', name: '供应链管理', code: '120604', degree: '管理学学士', duration: 4 },
  { category: '电子商务', name: '电子商务', code: '120801', degree: '管理学学士', duration: 4 },
  { category: '电子商务', name: '电子商务及法律', code: '120802', degree: '管理学学士', duration: 4 },
  { category: '旅游管理', name: '旅游管理', code: '120901', degree: '管理学学士', duration: 4 },
  { category: '旅游管理', name: '酒店管理', code: '120902', degree: '管理学学士', duration: 4 },
  { category: '旅游管理', name: '会展经济与管理', code: '120903', degree: '管理学学士', duration: 4 },
  
  // 艺术学
  { category: '艺术理论', name: '艺术史论', code: '130101', degree: '艺术学学士', duration: 4 },
  { category: '音乐舞蹈', name: '音乐表演', code: '130201', degree: '艺术学学士', duration: 4 },
  { category: '音乐舞蹈', name: '音乐学', code: '130202', degree: '艺术学学士', duration: 4 },
  { category: '音乐舞蹈', name: '舞蹈表演', code: '130204', degree: '艺术学学士', duration: 4 },
  { category: '音乐舞蹈', name: '舞蹈学', code: '130205', degree: '艺术学学士', duration: 4 },
  { category: '戏剧影视', name: '表演', code: '130301', degree: '艺术学学士', duration: 4 },
  { category: '戏剧影视', name: '戏剧学', code: '130302', degree: '艺术学学士', duration: 4 },
  { category: '戏剧影视', name: '电影学', code: '130303', degree: '艺术学学士', duration: 4 },
  { category: '戏剧影视', name: '广播电视编导', code: '130305', degree: '艺术学学士', duration: 4 },
  { category: '戏剧影视', name: '播音与主持艺术', code: '130309', degree: '艺术学学士', duration: 4 },
  { category: '美术', name: '美术学', code: '130401', degree: '艺术学学士', duration: 4 },
  { category: '美术', name: '绘画', code: '130402', degree: '艺术学学士', duration: 4 },
  { category: '美术', name: '雕塑', code: '130403', degree: '艺术学学士', duration: 5 },
  { category: '美术', name: '摄影', code: '130404', degree: '艺术学学士', duration: 4 },
  { category: '设计', name: '视觉传达设计', code: '130502', degree: '艺术学学士', duration: 4 },
  { category: '设计', name: '环境设计', code: '130503', degree: '艺术学学士', duration: 4 },
  { category: '设计', name: '产品设计', code: '130504', degree: '艺术学学士', duration: 4 },
  { category: '设计', name: '服装与服饰设计', code: '130505', degree: '艺术学学士', duration: 4 },
  { category: '设计', name: '数字媒体艺术', code: '130508', degree: '艺术学学士', duration: 4 },
];

// 导入专业数据
const importMajors = async () => {
  const client = await pool.connect();
  
  try {
    console.log('开始导入专业数据...');
    await client.query('BEGIN');
    
    let imported = 0;
    for (const major of MAJORS_DATA) {
      await client.query(`
        INSERT INTO majors (name, code, category, subcategory, degree_type, duration, tags)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (code) DO UPDATE SET
          name = EXCLUDED.name,
          category = EXCLUDED.category,
          subcategory = EXCLUDED.subcategory,
          degree_type = EXCLUDED.degree_type,
          duration = EXCLUDED.duration,
          tags = EXCLUDED.tags
      `, [
        major.name,
        major.code,
        major.category,
        major.category, // subcategory 暂用 category 填充
        major.degree,
        major.duration,
        []              // tags 默认为空数组
      ]);
      imported++;
      
      if (imported % 50 === 0) {
        console.log(`已导入 ${imported}/${MAJORS_DATA.length} 个专业`);
      }
    }
    
    await client.query('COMMIT');
    console.log(`✅ 专业数据导入完成！共导入 ${imported} 个专业`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('专业数据导入失败:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { importMajors };

// 直接运行
if (require.main === module) {
  importMajors()
    .then(() => {
      console.log('专业数据导入脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('专业数据导入脚本执行失败:', error);
      process.exit(1);
    });
}
