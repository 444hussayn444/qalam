import os 
import json
import random


data = []

os.chdir("assets")
for dirc in os.listdir():
    os.chdir(dirc)
    dirs = os.listdir()
    for i in range(len(dirs)):
        print(dirs[i])
        if len(dirs) > 1:
            products = {
                "id":random.randint(1,10000),
                "title":os.path.splitext(dirs[i])[0],
                "image":dirs[i],
                "category":os.path.basename(os.getcwd()),
                "price":random.randint(250,500)
            }
            data.append(products)
    os.chdir("../")


print(data)

os.chdir("../")
with open("data.json","w") as J_file:
    json.dump(data,J_file,indent=4)
