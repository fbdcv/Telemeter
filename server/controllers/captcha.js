const redis = require("redis");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

const createCaptcha = () => {
  let captcha = Math.floor(1000000 * Math.random());
  while (captcha / 100000 < 1) {
    captcha = captcha * 10;
  }
  return captcha;
};
const transporter = nodemailer.createTransport({
  service: "QQ",
  auth: {
    user: "2434897168@qq.com",
    pass: "ufasokshcbyndida",
  },
});
const receiver = (captcha, toEmail) => ({
  from: `"Telemeter即时通讯"<2434897168@qq.com>`,
  subject: "验证消息",
  to: toEmail,
  html: `<h1>验证码: ${captcha}</h1>`,
});

module.exports.storeCaptcha = async (req, res) => {
  // 1.获取邮箱
  const { email } = req.body;
  //2.生成验证码
  const captcha = createCaptcha();
  // 3.发送验证码到邮箱
  transporter.sendMail(receiver(captcha, email), (error, info) => {
    if (error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(200).json({ success: info.response });
    }
    transporter.close();
  });
  // 4.将邮箱和生成的验证码存放到redis中
  const redisClient = redis.createClient();

  // 监听错误信息;
  redisClient.on("err", (err) => {
    res.status(500).json({ error: err });
  });

  // 创建连接，是个 promise
  await redisClient.connect(process.env.REDIS_POST, process.env.REDIS_HOST);
  console.log(email, captcha.toString());
  await redisClient.set(`telemeter:${email}`, captcha.toString());

  //关闭redis连接
  await redisClient.disconnect();
};
