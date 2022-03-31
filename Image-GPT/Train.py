import torch
import torchvision
import numpy as np
import matplotlib.pyplot as plt

from Core.Function import set_seed
from Core.CONFIG import Trainer
from Core.Model import GPT_Model
from Core.Function import kmeans
from Core.Datasets import ImageDataset
from Core.CONFIG import GPTConfig
from Core.CONFIG import TrainerConfig



# 设置确定性
set_seed(42)


# ===========================下载数据====================================
# 加载数据
root = './'
train_data = torchvision.datasets.CIFAR10(root, train=True, transform=None, target_transform=None, download=True)
test_data  = torchvision.datasets.CIFAR10(root, train=False, transform=None, target_transform=None, download=True)
print(len(train_data), len(test_data))

# ================================================================
# 每张图像随机获取 5 个像素并将它们全部堆叠为 rgb 值以获得半百万个随机像素
pluck_rgb = lambda x: torch.from_numpy(np.array(x)).view(32*32, 3)[torch.randperm(32*32)[:5], :]
px = torch.cat([pluck_rgb(x) for x, y in train_data], dim=0).float()
print(px.size())

# ===========================应用K-means进行获取数据离散值=====================================
ncluster = 512
with torch.no_grad():
    C = kmeans(px, ncluster, niter=8)

print(C.size()) # 输出结果
# ===========================展示一些经过k-means离散之后的图片======================================
# 如果您想跳过这个step请将以下代码注释掉
# 使用我们的码本对训练示例进行编码，以可视化我们在离散化中损失了多少
number_sample = 16 # 显示出的图片的数量
ncol = 8
nrow = number_sample // ncol + 1
plt.figure(figsize=(20, 10))
for i in range(number_sample):
    # 将数据编码和解码
    x, y = train_data[np.random.randint(0, len(train_data))] # 从数据集中获取数据（随机）
    xpt = torch.from_numpy(np.array(x)).float().view(32 * 32, 3) # 利用torch从numy获取数据
    ix = ((xpt[:, None, :] - C[None, :, :]) ** 2).sum(-1).argmin(1)  #  每个像素进行聚类分配
    plt.subplot(nrow, ncol, i + 1)
    plt.imshow(C[ix].view(32, 32, 3).numpy().astype(np.uint8)) # 查看这些图片，当然您希望他们不是异形
    plt.axis('off')

# =============================制作数据集==============================
train_dataset = ImageDataset(train_data, C)                      # ==
#test_dataset = ImageDataset(test_data, C)                        # ==
print(train_dataset[0][0])  # 一个示例图像被展平为整数
                                                               # ==
# ===================================================================
# 训练前的一些GPT模型的配置
# 根据官方的模型，参数为batch_size = 128,Adam lr 0.003，beta = (0.9, 0.95)
# 学习率预热一个 epoch，然后衰减到 0
# 没有使用权重衰减或Droput
# n_layer=24, n_head=8, n_embd=512
# 另外您可以根据自己的设备进行自己配置
mconf = GPTConfig(train_dataset.vocab_size, train_dataset.block_size,
                  embd_pdrop=0.0, resid_pdrop=0.0, attn_pdrop=0.0,
                  n_layer=10, n_head=4, n_embd=84)

model = GPT_Model(mconf)
print(model)
# ==============================开始训练======================================
"""
Note that I am running on an 8-GPU V100 machine so each GPU has 32GB.
If you don't have as many computational resources you have to bring down
the batch_size until the model fits into your memory, and then you may
also need to adjust the learning rate (e.g. decrease it a bit). Alternatively,
you can use an even smaller model up above, bringing down the number of layers,
number of heads, and the embedding size.
"""
if __name__ == '__main__':

    tokens_per_epoch = len(train_data) * train_dataset.block_size
    train_epochs = 1 # todo run a bigger model and longer, this is tiny
# 初始化训练器进行训练
    tconf = TrainerConfig(max_epochs=train_epochs, batch_size=3*8, learning_rate=3e-3,
                        betas = (0.9, 0.95), weight_decay=0,
                        lr_decay=True, warmup_tokens=tokens_per_epoch, final_tokens=train_epochs*tokens_per_epoch,
                        num_workers=8)

    trainer = Trainer(model = model, train_dataset = train_dataset, test_dataset = None, config = tconf,Save_Model_path='./pa')
    trainer.train()

