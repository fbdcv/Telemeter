import base64
import os
import pymongo

# 连接数据库
client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client["chat"]
collection = db["avatars"]

# 获取当前工作目录路径
current_dir = os.getcwd()

# 设置文件夹路径
folder_path = r"script\Circle"

print("The script is running....")
print("current_dir ", current_dir)

# 遍历文件夹中的所有 SVG 文件
for filename in os.listdir(os.path.join(current_dir, folder_path)):
    if filename.endswith(".svg"):
        # 打开 SVG 文件
        svg_file = open(os.path.join(folder_path, filename), 'rb')
        svg_content = svg_file.read()
        svg_file.close()

        # 将 SVG 转成 Base64
        svg_base64 = base64.b64encode(svg_content).decode('utf-8')

        # 写入数据库
        if filename == "Telemeter.svg":
            data = {
                "filename": filename,
                "base64": svg_base64,
                "type": "svg",
                "ispublic": False
            }
        else:
            data = {
                "filename": filename,
                "base64": svg_base64,
                "type": "svg",
                "ispublic": True
            }

        collection.insert_one(data)


print("The script was done")
