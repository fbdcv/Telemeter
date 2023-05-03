const User = require("../models/users");
const System = require("../models/system");
const bcryptjs = require("bcryptjs");
const redis = require("redis");

module.exports.register = async (req, res, next) => {
  try {
    const { username, email, password, captcha } = req.body;

    const redisClient = redis.createClient();
    await redisClient.connect(process.env.REDIS_POST, process.env.REDIS_HOST);
    const trueCaptcha = await redisClient.get(`telemeter:${email}`);
    await redisClient.disconnect();
    if (captcha !== trueCaptcha) {
      return res.json({
        msg: "The captcha was vailded",
        status: false,
      });
    }
    if (username === "SystemInfo") {
      return res.json({
        msg: "Username not could be SystemInfo",
        status: false,
      });
    }
    const usernameCheck = await User.findOne({ username });
    if (usernameCheck)
      return res.json({ msg: "Username already used", status: false });
    const emailCheck = await User.findOne({ email });
    if (emailCheck)
      return res.json({ msg: "Email already used", status: false });
    const hashedPassword = await bcryptjs.hash(password, 10);
    const user = await User.create({
      email,
      username,
      password: hashedPassword,
    });
    let SystemInfo = await User.findOne({ username: "SystemInfo" });
    if (!SystemInfo) {
      await User.create({
        email: "system@system.com",
        username: "SystemInfo",
        password: "admin",
        avatarImage:
          "PHN2ZyB3aWR0aD0iODU0IiBoZWlnaHQ9Ijg4MSIgdmlld0JveD0iMCAwIDg1NCA4ODEiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxnIGZpbHRlcj0idXJsKCNmaWx0ZXIwX2lmXzhfNTUpIj4KPHBhdGggZD0iTTg0My42MTIgNDE2LjIyNEw2NjEuMjcxIDI3OS4wNDJDNjI0LjgzNyAyNTEuNjMxIDU5Mi4zMjQgMjE5LjM2NiA1NjQuNjM1IDE4My4xNDRMNDI3LjEzMyAzLjI2NzYxTDI1Mi43MDQgMjI4LjE2NkMyNjMuODA0IDI3Mi4zNDIgMzA5LjIyMyAzNzMuMjA3IDQxNy42NzUgMzg3Ljc1NEM0NTAuMjA5IDM5Mi4xMjcgNTA0LjE0IDM5NS44MDQgNTkyLjMxOSAzNzIuMzg2QzU5My4zIDM3Mi4yMDggNTk0LjI4MiAzNzIuMDgzIDU5NS4yNjMgMzcxLjkyMkM2MDguMDA1IDM4NS4yOTEgNjM0LjMxMSA0NDIuMTA1IDcwNS40NjQgNDcyLjUzN0M3NDIuOTQxIDQ4Ni41MzEgNzY1LjM3NCA0NzIuNzUyIDc4OS4wMDIgNDU2LjAwOUw4NDMuNjEyIDQxNi4yMjRaIiBmaWxsPSIjMEU3N0Y3Ii8+CjxwYXRoIGQ9Ik04NDMuNjEyIDQxNi4yMjRMNjYxLjI3MSAyNzkuMDQyQzYyNC44MzcgMjUxLjYzMSA1OTIuMzI0IDIxOS4zNjYgNTY0LjYzNSAxODMuMTQ0TDQyNy4xMzMgMy4yNjc2MUwyNTIuNzA0IDIyOC4xNjZDMjYzLjgwNCAyNzIuMzQyIDMwOS4yMjMgMzczLjIwNyA0MTcuNjc1IDM4Ny43NTRDNDUwLjIwOSAzOTIuMTI3IDUwNC4xNCAzOTUuODA0IDU5Mi4zMTkgMzcyLjM4NkM1OTMuMyAzNzIuMjA4IDU5NC4yODIgMzcyLjA4MyA1OTUuMjYzIDM3MS45MjJDNjA4LjAwNSAzODUuMjkxIDYzNC4zMTEgNDQyLjEwNSA3MDUuNDY0IDQ3Mi41MzdDNzQyLjk0MSA0ODYuNTMxIDc2NS4zNzQgNDcyLjc1MiA3ODkuMDAyIDQ1Ni4wMDlMODQzLjYxMiA0MTYuMjI0WiIgZmlsbD0idXJsKCNwYWludDBfbGluZWFyXzhfNTUpIi8+CjwvZz4KPGcgZmlsdGVyPSJ1cmwoI2ZpbHRlcjFfZGZfOF81NSkiPgo8cGF0aCBkPSJNNTkyLjMxOSAzNzIuMDgzQzYyNi42NzMgMzY1LjYzOSA2NjMuMTg2IDM3Mi45MDQgNjg0Ljk3NiAzODEuMDA3QzY5Ny44NjEgMzg2LjE2NiA3NTIuNzkyIDQwNi45MjQgNzg4Ljg3OCA0NTUuNzI0TDg0My42MTIgNDE1Ljg4NUw2NjEuMjM5IDI3OC42NDhDNjI0Ljg2MSAyNTEuMjczIDU5Mi4zOTMgMjE5LjA1OSA1NjQuNzM0IDE4Mi44OThMNDI3LjEzMyAzTDI1Mi43MDQgMjI3Ljg5OEMyNjMuODA0IDI3Mi4wNzUgMzA5LjIyMyAzNzIuOTQgNDE3LjY3NSAzODcuNDg3QzQ1MC4yMDkgMzkxLjg2IDUwNC4xNCAzOTUuNTM3IDU5Mi4zMTkgMzcyLjExOSIgZmlsbD0idXJsKCNwYWludDFfbGluZWFyXzhfNTUpIi8+CjxwYXRoIGQ9Ik01OTIuMzE5IDM3Mi4wODNDNjI2LjY3MyAzNjUuNjM5IDY2My4xODYgMzcyLjkwNCA2ODQuOTc2IDM4MS4wMDdDNjk3Ljg2MSAzODYuMTY2IDc1Mi43OTIgNDA2LjkyNCA3ODguODc4IDQ1NS43MjRMODQzLjYxMiA0MTUuODg1TDY2MS4yMzkgMjc4LjY0OEM2MjQuODYxIDI1MS4yNzMgNTkyLjM5MyAyMTkuMDU5IDU2NC43MzQgMTgyLjg5OEw0MjcuMTMzIDNMMjUyLjcwNCAyMjcuODk4QzI2My44MDQgMjcyLjA3NSAzMDkuMjIzIDM3Mi45NCA0MTcuNjc1IDM4Ny40ODdDNDUwLjIwOSAzOTEuODYgNTA0LjE0IDM5NS41MzcgNTkyLjMxOSAzNzIuMTE5IiBmaWxsPSJ1cmwoI3BhaW50Ml9saW5lYXJfOF81NSkiIGZpbGwtb3BhY2l0eT0iMC4zIi8+CjxwYXRoIGQ9Ik01OTIuMzE5IDM3Mi4wODNDNjI2LjY3MyAzNjUuNjM5IDY2My4xODYgMzcyLjkwNCA2ODQuOTc2IDM4MS4wMDdDNjk3Ljg2MSAzODYuMTY2IDc1Mi43OTIgNDA2LjkyNCA3ODguODc4IDQ1NS43MjRMODQzLjYxMiA0MTUuODg1TDY2MS4yMzkgMjc4LjY0OEM2MjQuODYxIDI1MS4yNzMgNTkyLjM5MyAyMTkuMDU5IDU2NC43MzQgMTgyLjg5OEw0MjcuMTMzIDNMMjUyLjcwNCAyMjcuODk4QzI2My44MDQgMjcyLjA3NSAzMDkuMjIzIDM3Mi45NCA0MTcuNjc1IDM4Ny40ODdDNDUwLjIwOSAzOTEuODYgNTA0LjE0IDM5NS41MzcgNTkyLjMxOSAzNzIuMTE5IiBmaWxsPSJ1cmwoI3BhaW50M19saW5lYXJfOF81NSkiIHN0eWxlPSJtaXgtYmxlbmQtbW9kZTpkYXJrZW4iLz4KPC9nPgo8ZyBmaWx0ZXI9InVybCgjZmlsdGVyMl9paWZfOF81NSkiPgo8cGF0aCBkPSJNMzAgNDI5LjA3NUwyNjcuMTc3IDYwNy42MDFMNDQ2LjUxNCA4NDIuMDMxTDYyMC45NDQgNjE3LjEzM0M2MDkuODI2IDU3Mi45NTYgNTY0LjQyNSA0NzIuMTI3IDQ1NS45NzMgNDU3LjU4QzQyMy40NTcgNDUzLjIwNyAzNjkuNTA4IDQ0OS41MyAyODEuMzI5IDQ3Mi45NDhDMjgwLjM2NSA0NzMuMTI3IDI3OS4zODQgNDczLjI1MiAyNzguNDAyIDQ3My40MTJDMjY1LjY0MiA0NjAuMDQzIDIzOS4zNTUgNDAzLjIzIDE2OC4xODQgMzcyLjc5N0MxMzAuNzA3IDM1OC44MDMgMTA4LjI5MiAzNzIuNTgzIDg0LjY2MzIgMzg5LjMyNUwzMCA0MjkuMDc1WiIgZmlsbD0iIzBDNzVGNSIvPgo8cGF0aCBkPSJNMzAgNDI5LjA3NUwyNjcuMTc3IDYwNy42MDFMNDQ2LjUxNCA4NDIuMDMxTDYyMC45NDQgNjE3LjEzM0M2MDkuODI2IDU3Mi45NTYgNTY0LjQyNSA0NzIuMTI3IDQ1NS45NzMgNDU3LjU4QzQyMy40NTcgNDUzLjIwNyAzNjkuNTA4IDQ0OS41MyAyODEuMzI5IDQ3Mi45NDhDMjgwLjM2NSA0NzMuMTI3IDI3OS4zODQgNDczLjI1MiAyNzguNDAyIDQ3My40MTJDMjY1LjY0MiA0NjAuMDQzIDIzOS4zNTUgNDAzLjIzIDE2OC4xODQgMzcyLjc5N0MxMzAuNzA3IDM1OC44MDMgMTA4LjI5MiAzNzIuNTgzIDg0LjY2MzIgMzg5LjMyNUwzMCA0MjkuMDc1WiIgZmlsbD0idXJsKCNwYWludDRfbGluZWFyXzhfNTUpIiBzdHlsZT0ibWl4LWJsZW5kLW1vZGU6ZGFya2VuIi8+CjwvZz4KPGcgZmlsdGVyPSJ1cmwoI2ZpbHRlcjNfZGZfOF81NSkiPgo8cGF0aCBkPSJNMjgxLjMyOSA0NzMuMTk4QzI0Ni45NzUgNDc5LjY2IDIxMC40NzkgNDcyLjM3NyAxODguNjg5IDQ2NC4yNzRDMTc1LjgwNCA0NTkuMTE1IDEyMC44NzMgNDM4LjM3NSA4NC43NzAyIDM4OS41NzVMMzAgNDI5LjM0M0wyMjMuMzQ4IDU3NC44NjRDMjUyLjQzMSA1OTYuNzUzIDI3OC4zOTEgNjIyLjUxIDMwMC41MDcgNjUxLjQyMUw0NDYuNTE0IDg0Mi4yODFMNjIwLjk0NCA2MTcuMzgzQzYwOS44NjEgNTczLjIyNCA1NjQuNDI1IDQ3Mi4zNTkgNDU1Ljk3MyA0NTcuODEyQzQyMy40NTcgNDUzLjQzOSAzNjkuNTA4IDQ0OS43NjIgMjgxLjMyOSA0NzMuMTYzIiBmaWxsPSJ1cmwoI3BhaW50NV9saW5lYXJfOF81NSkiLz4KPHBhdGggZD0iTTI4MS4zMjkgNDczLjE5OEMyNDYuOTc1IDQ3OS42NiAyMTAuNDc5IDQ3Mi4zNzcgMTg4LjY4OSA0NjQuMjc0QzE3NS44MDQgNDU5LjExNSAxMjAuODczIDQzOC4zNzUgODQuNzcwMiAzODkuNTc1TDMwIDQyOS4zNDNMMjIzLjM0OCA1NzQuODY0QzI1Mi40MzEgNTk2Ljc1MyAyNzguMzkxIDYyMi41MSAzMDAuNTA3IDY1MS40MjFMNDQ2LjUxNCA4NDIuMjgxTDYyMC45NDQgNjE3LjM4M0M2MDkuODYxIDU3My4yMjQgNTY0LjQyNSA0NzIuMzU5IDQ1NS45NzMgNDU3LjgxMkM0MjMuNDU3IDQ1My40MzkgMzY5LjUwOCA0NDkuNzYyIDI4MS4zMjkgNDczLjE2MyIgZmlsbD0idXJsKCNwYWludDZfcmFkaWFsXzhfNTUpIiBmaWxsLW9wYWNpdHk9IjAuNSIgc3R5bGU9Im1peC1ibGVuZC1tb2RlOm11bHRpcGx5Ii8+CjxwYXRoIGQ9Ik0yODEuMzI5IDQ3My4xOThDMjQ2Ljk3NSA0NzkuNjYgMjEwLjQ3OSA0NzIuMzc3IDE4OC42ODkgNDY0LjI3NEMxNzUuODA0IDQ1OS4xMTUgMTIwLjg3MyA0MzguMzc1IDg0Ljc3MDIgMzg5LjU3NUwzMCA0MjkuMzQzTDIyMy4zNDggNTc0Ljg2NEMyNTIuNDMxIDU5Ni43NTMgMjc4LjM5MSA2MjIuNTEgMzAwLjUwNyA2NTEuNDIxTDQ0Ni41MTQgODQyLjI4MUw2MjAuOTQ0IDYxNy4zODNDNjA5Ljg2MSA1NzMuMjI0IDU2NC40MjUgNDcyLjM1OSA0NTUuOTczIDQ1Ny44MTJDNDIzLjQ1NyA0NTMuNDM5IDM2OS41MDggNDQ5Ljc2MiAyODEuMzI5IDQ3My4xNjMiIGZpbGw9InVybCgjcGFpbnQ3X2xpbmVhcl84XzU1KSIgc3R5bGU9Im1peC1ibGVuZC1tb2RlOmRhcmtlbiIvPgo8L2c+CjxkZWZzPgo8ZmlsdGVyIGlkPSJmaWx0ZXIwX2lmXzhfNTUiIHg9IjI1MC43MDQiIHk9IjEuMjY3NjEiIHdpZHRoPSI1OTQuOTA4IiBoZWlnaHQ9IjQ4Ny4wNDIiIGZpbHRlclVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzPSJzUkdCIj4KPGZlRmxvb2QgZmxvb2Qtb3BhY2l0eT0iMCIgcmVzdWx0PSJCYWNrZ3JvdW5kSW1hZ2VGaXgiLz4KPGZlQmxlbmQgbW9kZT0ibm9ybWFsIiBpbj0iU291cmNlR3JhcGhpYyIgaW4yPSJCYWNrZ3JvdW5kSW1hZ2VGaXgiIHJlc3VsdD0ic2hhcGUiLz4KPGZlQ29sb3JNYXRyaXggaW49IlNvdXJjZUFscGhhIiB0eXBlPSJtYXRyaXgiIHZhbHVlcz0iMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMTI3IDAiIHJlc3VsdD0iaGFyZEFscGhhIi8+CjxmZU9mZnNldCBkeT0iMTAiLz4KPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iMTUiLz4KPGZlQ29tcG9zaXRlIGluMj0iaGFyZEFscGhhIiBvcGVyYXRvcj0iYXJpdGhtZXRpYyIgazI9Ii0xIiBrMz0iMSIvPgo8ZmVDb2xvck1hdHJpeCB0eXBlPSJtYXRyaXgiIHZhbHVlcz0iMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMC41IDAiLz4KPGZlQmxlbmQgbW9kZT0ibm9ybWFsIiBpbjI9InNoYXBlIiByZXN1bHQ9ImVmZmVjdDFfaW5uZXJTaGFkb3dfOF81NSIvPgo8ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSIxIiByZXN1bHQ9ImVmZmVjdDJfZm9yZWdyb3VuZEJsdXJfOF81NSIvPgo8L2ZpbHRlcj4KPGZpbHRlciBpZD0iZmlsdGVyMV9kZl84XzU1IiB4PSIyNDIuNzA0IiB5PSIwIiB3aWR0aD0iNjEwLjkwOCIgaGVpZ2h0PSI0NzUuNzI0IiBmaWx0ZXJVbml0cz0idXNlclNwYWNlT25Vc2UiIGNvbG9yLWludGVycG9sYXRpb24tZmlsdGVycz0ic1JHQiI+CjxmZUZsb29kIGZsb29kLW9wYWNpdHk9IjAiIHJlc3VsdD0iQmFja2dyb3VuZEltYWdlRml4Ii8+CjxmZUNvbG9yTWF0cml4IGluPSJTb3VyY2VBbHBoYSIgdHlwZT0ibWF0cml4IiB2YWx1ZXM9IjAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDEyNyAwIiByZXN1bHQ9ImhhcmRBbHBoYSIvPgo8ZmVPZmZzZXQgZHk9IjEwIi8+CjxmZUdhdXNzaWFuQmx1ciBzdGREZXZpYXRpb249IjUiLz4KPGZlQ29sb3JNYXRyaXggdHlwZT0ibWF0cml4IiB2YWx1ZXM9IjAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAuMyAwIi8+CjxmZUJsZW5kIG1vZGU9Im5vcm1hbCIgaW4yPSJCYWNrZ3JvdW5kSW1hZ2VGaXgiIHJlc3VsdD0iZWZmZWN0MV9kcm9wU2hhZG93XzhfNTUiLz4KPGZlQmxlbmQgbW9kZT0ibm9ybWFsIiBpbj0iU291cmNlR3JhcGhpYyIgaW4yPSJlZmZlY3QxX2Ryb3BTaGFkb3dfOF81NSIgcmVzdWx0PSJzaGFwZSIvPgo8ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSIxLjUiIHJlc3VsdD0iZWZmZWN0Ml9mb3JlZ3JvdW5kQmx1cl84XzU1Ii8+CjwvZmlsdGVyPgo8ZmlsdGVyIGlkPSJmaWx0ZXIyX2lpZl84XzU1IiB4PSIyOCIgeT0iMzY1LjAyNSIgd2lkdGg9IjU5NC45NDQiIGhlaWdodD0iNDg3LjAwNyIgZmlsdGVyVW5pdHM9InVzZXJTcGFjZU9uVXNlIiBjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnM9InNSR0IiPgo8ZmVGbG9vZCBmbG9vZC1vcGFjaXR5PSIwIiByZXN1bHQ9IkJhY2tncm91bmRJbWFnZUZpeCIvPgo8ZmVCbGVuZCBtb2RlPSJub3JtYWwiIGluPSJTb3VyY2VHcmFwaGljIiBpbjI9IkJhY2tncm91bmRJbWFnZUZpeCIgcmVzdWx0PSJzaGFwZSIvPgo8ZmVDb2xvck1hdHJpeCBpbj0iU291cmNlQWxwaGEiIHR5cGU9Im1hdHJpeCIgdmFsdWVzPSIwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAxMjcgMCIgcmVzdWx0PSJoYXJkQWxwaGEiLz4KPGZlT2Zmc2V0IGR5PSIxMCIvPgo8ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSIxNSIvPgo8ZmVDb21wb3NpdGUgaW4yPSJoYXJkQWxwaGEiIG9wZXJhdG9yPSJhcml0aG1ldGljIiBrMj0iLTEiIGszPSIxIi8+CjxmZUNvbG9yTWF0cml4IHR5cGU9Im1hdHJpeCIgdmFsdWVzPSIwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwLjYgMCIvPgo8ZmVCbGVuZCBtb2RlPSJub3JtYWwiIGluMj0ic2hhcGUiIHJlc3VsdD0iZWZmZWN0MV9pbm5lclNoYWRvd184XzU1Ii8+CjxmZUNvbG9yTWF0cml4IGluPSJTb3VyY2VBbHBoYSIgdHlwZT0ibWF0cml4IiB2YWx1ZXM9IjAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDEyNyAwIiByZXN1bHQ9ImhhcmRBbHBoYSIvPgo8ZmVPZmZzZXQgZHk9IjEwIi8+CjxmZUdhdXNzaWFuQmx1ciBzdGREZXZpYXRpb249IjE1Ii8+CjxmZUNvbXBvc2l0ZSBpbjI9ImhhcmRBbHBoYSIgb3BlcmF0b3I9ImFyaXRobWV0aWMiIGsyPSItMSIgazM9IjEiLz4KPGZlQ29sb3JNYXRyaXggdHlwZT0ibWF0cml4IiB2YWx1ZXM9IjAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAuMjUgMCIvPgo8ZmVCbGVuZCBtb2RlPSJub3JtYWwiIGluMj0iZWZmZWN0MV9pbm5lclNoYWRvd184XzU1IiByZXN1bHQ9ImVmZmVjdDJfaW5uZXJTaGFkb3dfOF81NSIvPgo8ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSIxIiByZXN1bHQ9ImVmZmVjdDNfZm9yZWdyb3VuZEJsdXJfOF81NSIvPgo8L2ZpbHRlcj4KPGZpbHRlciBpZD0iZmlsdGVyM19kZl84XzU1IiB4PSIwIiB5PSIzNjcuNTc1IiB3aWR0aD0iNjUwLjk0NCIgaGVpZ2h0PSI1MTIuNzA2IiBmaWx0ZXJVbml0cz0idXNlclNwYWNlT25Vc2UiIGNvbG9yLWludGVycG9sYXRpb24tZmlsdGVycz0ic1JHQiI+CjxmZUZsb29kIGZsb29kLW9wYWNpdHk9IjAiIHJlc3VsdD0iQmFja2dyb3VuZEltYWdlRml4Ii8+CjxmZUNvbG9yTWF0cml4IGluPSJTb3VyY2VBbHBoYSIgdHlwZT0ibWF0cml4IiB2YWx1ZXM9IjAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDEyNyAwIiByZXN1bHQ9ImhhcmRBbHBoYSIvPgo8ZmVPZmZzZXQgZHk9IjgiLz4KPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iMTUiLz4KPGZlQ29sb3JNYXRyaXggdHlwZT0ibWF0cml4IiB2YWx1ZXM9IjAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAuNCAwIi8+CjxmZUJsZW5kIG1vZGU9Im5vcm1hbCIgaW4yPSJCYWNrZ3JvdW5kSW1hZ2VGaXgiIHJlc3VsdD0iZWZmZWN0MV9kcm9wU2hhZG93XzhfNTUiLz4KPGZlQmxlbmQgbW9kZT0ibm9ybWFsIiBpbj0iU291cmNlR3JhcGhpYyIgaW4yPSJlZmZlY3QxX2Ryb3BTaGFkb3dfOF81NSIgcmVzdWx0PSJzaGFwZSIvPgo8ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSIxIiByZXN1bHQ9ImVmZmVjdDJfZm9yZWdyb3VuZEJsdXJfOF81NSIvPgo8L2ZpbHRlcj4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDBfbGluZWFyXzhfNTUiIHgxPSI3MjUuOTUiIHkxPSI0NzguMDE0IiB4Mj0iNjA4LjExNyIgeTI9IjMwOS44NTYiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agb2Zmc2V0PSIwLjMyNDQyMiIgc3RvcC1vcGFjaXR5PSIwLjQzIi8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0id2hpdGUiIHN0b3Atb3BhY2l0eT0iMCIvPgo8L2xpbmVhckdyYWRpZW50Pgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MV9saW5lYXJfOF81NSIgeDE9IjY0My43MTMiIHkxPSIyNDcuMjU4IiB4Mj0iNTQ3Ljk3NCIgeTI9IjIzLjI1MjUiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzAwMzE5QyIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMwMDczRTkiLz4KPC9saW5lYXJHcmFkaWVudD4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDJfbGluZWFyXzhfNTUiIHgxPSI0MzYuODkxIiB5MT0iMyIgeDI9IjQzOS4zNDYiIHkyPSIyMjguODQ2IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IndoaXRlIi8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0id2hpdGUiIHN0b3Atb3BhY2l0eT0iMCIvPgo8L2xpbmVhckdyYWRpZW50Pgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50M19saW5lYXJfOF81NSIgeDE9IjM0MS43NjYiIHkxPSIxNDYuNjA5IiB4Mj0iNDc0LjMyOCIgeTI9IjIwNy4zNjYiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzAwMzZBQyIvPgo8c3RvcCBvZmZzZXQ9IjAuNzY0NTg1IiBzdG9wLWNvbG9yPSIjNDY2MDk4IiBzdG9wLW9wYWNpdHk9IjAiLz4KPC9saW5lYXJHcmFkaWVudD4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDRfbGluZWFyXzhfNTUiIHgxPSIxNzAuNTQiIHkxPSI0MTQuMTg3IiB4Mj0iNDQ2LjA5NyIgeTI9IjY0My43MTYiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzAwM0JCQiIvPgo8c3RvcCBvZmZzZXQ9IjAuNjIwMDg3IiBzdG9wLWNvbG9yPSJ3aGl0ZSIgc3RvcC1vcGFjaXR5PSIwIi8+CjwvbGluZWFyR3JhZGllbnQ+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQ1X2xpbmVhcl84XzU1IiB4MT0iMzEzLjUzNSIgeTE9IjY0Ni43ODUiIHgyPSI1MzguODQxIiB5Mj0iNDU4LjI1MyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjMDEzRkM4Ii8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzAwNTZFOSIvPgo8L2xpbmVhckdyYWRpZW50Pgo8cmFkaWFsR3JhZGllbnQgaWQ9InBhaW50Nl9yYWRpYWxfOF81NSIgY3g9IjAiIGN5PSIwIiByPSIxIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgZ3JhZGllbnRUcmFuc2Zvcm09InRyYW5zbGF0ZSgyNzEuMTg5IDY1NS4zNzcpIHJvdGF0ZSgtNDAuOTc0MSkgc2NhbGUoMjk2LjY5MyAzODcuMjkxKSI+CjxzdG9wIG9mZnNldD0iMC40MDUyMTEiIHN0b3AtY29sb3I9IiMwMDI4ODEiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSJ3aGl0ZSIgc3RvcC1vcGFjaXR5PSIwIi8+CjwvcmFkaWFsR3JhZGllbnQ+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQ3X2xpbmVhcl84XzU1IiB4MT0iMzAiIHkxPSI0MzEuMzcxIiB4Mj0iOTE2LjgxNSIgeTI9IjM0Ny45MDYiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agb2Zmc2V0PSIwLjE4NzUyNiIgc3RvcC1jb2xvcj0iIzAwMUM1QSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IndoaXRlIiBzdG9wLW9wYWNpdHk9IjAiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4K",
        isAvatarImageSet: true,
      });
      console.log("创建SystemInfo");
      SystemInfo = await User.findOne({ username: "SystemInfo" });
    }
    console.log(" SystemInfo._id", SystemInfo._id);
    console.log(" user._id", user._id);
    await User.findByIdAndUpdate(
      user._id,
      {
        $addToSet: {
          friends: SystemInfo._id.toString(),
        },
      },
      { new: true }
    );
    const userNopassword = await User.findOne({ username }, { password: 0 }); //返回的数据剔除password
    return res.json({ status: true, user: userNopassword }); //根据网页的storage显示，password并未被剔除，这里是有一个bug
  } catch (ex) {
    next(ex);
  }
};

module.exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (username === "SystemInfo") {
      return res.json({
        msg: "Username not could be SystemInfo",
        status: false,
      });
    }
    const user = await User.findOne({ username });
    if (!user)
      return res.json({ msg: "Incorrect Username or Password", status: false });
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid)
      return res.json({ msg: "Incorrect Username or Password", status: false });

    const userNopassword = await User.findOne({ username }, { password: 0 });
    return res.json({ status: true, user: userNopassword });
  } catch (ex) {
    next(ex);
  }
};

module.exports.setAvatar = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const avatarImage = req.body.image;
    const userData = await User.findByIdAndUpdate(
      userId,
      {
        isAvatarImageSet: true,
        avatarImage,
      },
      { new: true }
    );
    return res.json({
      isSet: userData.isAvatarImageSet,
      image: userData.avatarImage,
    });
  } catch (ex) {
    next(ex);
  }
};

module.exports.getAllUsers = async (req, res, next) => {
  try {
    //在User集合中筛选除了符合参数id的数据的其他数据
    const users = await User.find({ _id: { $ne: req.params.id } }).select([
      "email",
      "username",
      "avatarImage",
      "_id",
    ]);
    return res.json(users);
  } catch (ex) {
    next(ex);
  }
};

module.exports.getFriends = async (req, res, next) => {
  try {
    const data = await User.findOne({ _id: req.params.id }).select(["friends"]);
    const friends = data.friends;
    // console.log("friends", friends);
    const result = [];
    for (let i = 0; i < friends.length; i++) {
      const x = await User.findOne({ _id: friends[i] }).select([
        "email",
        "username",
        "avatarImage",
        "_id",
      ]);
      result.push(x);
    }
    // console.log("friends", friends);
    return res.json(result);
  } catch (ex) {
    next(ex);
  }
};

module.exports.beFriends = async (req, res, next) => {
  try {
    const { userId, friendId, userName, friendName } = req.body;
    // console.log("userId", userId);
    // console.log("friendId", friendId);
    // console.log("userName", userName);

    const sender = friendId;
    const to = userName;
    await User.findByIdAndUpdate(
      userId,
      {
        $addToSet: {
          friends: friendId,
        },
      },
      { new: true }
    );
    await User.findByIdAndUpdate(
      friendId,
      {
        $addToSet: {
          friends: userId,
        },
      },
      { new: true }
    );

    // console.log("sender", sender);
    // console.log("to", to);
    await System.deleteOne({
      info: "friendRequest",
      body: { sender: friendId, to: userName },
    });
    await System.deleteOne({
      info: "friendRequest",
      body: { sender: userId, to: friendName },
    });
    return res.json({
      status: true,
      msg: "Succeeded in adding a friend",
    });
  } catch (ex) {
    next(ex);
  }
};

module.exports.notBeFriends = async (req, res, next) => {
  try {
    const { userId, friendId, userName } = req.body;
    // console.log("userId", userId);
    // console.log("friendId", friendId);
    // console.log("userName", userName);

    const sender = friendId;
    const to = userName;
    // console.log("sender", sender);
    // console.log("to", to);
    await System.deleteOne({ info: "friendRequest", body: { sender, to } });

    return res.json({
      status: true,
      msg: "Succeeded in rejecting the friend request",
    });
  } catch (ex) {
    next(ex);
  }
};
