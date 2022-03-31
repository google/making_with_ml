import torch
import numpy as np


from torch.utils.data import Dataset


class ImageDataset(Dataset):
    def __init__(self, pt_dataset, Group, perm=None):
        self.pt_dataset = pt_dataset  # 设置图片数据源
        self.Group = Group # 设置集群
        self.perm = torch.arange(32 * 32) if perm is None else perm
        self.vocab_size = Group.size(0)
        self.block_size = 32 * 32 - 1

    def __len__(self):
        return len(self.pt_dataset)

    def __getitem__(self, idx):
        x, y = self.pt_dataset[idx]
        x = torch.from_numpy(np.array(x)).view(-1, 3)  # flatten out all pixels
        x = x[self.perm].float()  # 使用任何固定排列和重新shuffle像素值
        a = ((x[:, None, :] - self.Group[None, :, :]) ** 2).sum(-1).argmin(1)  # cluster assignments
        return a[:-1], a[1:]  # 一直预测下一个序列



