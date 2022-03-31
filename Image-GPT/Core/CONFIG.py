import torch
import math
import tqdm
import logging
import numpy as np

from torch.utils.data import DataLoader



logger = logging.getLogger(__name__)

class GPTConfig:
    """ base GPT config, params common to all GPT versions """
    embd_pdrop = 0.1
    resid_pdrop = 0.1
    attn_pdrop = 0.1

    def __init__(self, vocab_size, block_size, **kwargs):
        self.vocab_size = vocab_size
        self.block_size = block_size
        for k,v in kwargs.items():
            setattr(self, k, v)# 如果不存在k,v对象在此函数的参数中，则创建一个k,v




class GPT1Config(GPTConfig):
    """ GPT-1 like network roughly 125M params """
    n_layer = 12
    n_head = 12
    n_embd = 768





class TrainerConfig:
    # optimization parameters
    max_epochs = 5
    batch_size = 64
    learning_rate = 3e-4
    betas = (0.9, 0.95)
    grad_norm_clip = 1.0
    weight_decay = 0.1 # only applied on matmul weights
    # learning rate decay params: linear warmup followed by cosine decay to 10% of original
    lr_decay = False
    warmup_tokens = 375e6 # these two numbers come from the GPT-3 paper, but may not be good defaults elsewhere
    final_tokens = 260e9 # (at what point we reach 10% of original LR)


    num_workers = 0 # for DataLoader

    def __init__(self, **kwargs):
        for k,v in kwargs.items():
            setattr(self, k, v)







# ============================>>>>>>模型训练器<<<<<<<<<<====================================
class Trainer:
    def __init__(self, model, train_dataset, test_dataset, config,Save_Model_path):# checkpoint settings
        self.model = model
        self.train_dataset = train_dataset
        self.test_dataset = test_dataset
        self.config = config
        self.SAVE = Save_Model_path

        # take over whatever gpus are on the system
        self.device = 'cpu'
        if torch.cuda.is_available():
            self.device = torch.cuda.current_device()
            self.model = torch.nn.DataParallel(self.model).to(self.device)


########################################################################################
    # 定义训练函数
    def train(self):
        model, config = self.model, self.config # 导入模型以及其的配置
        raw_model = model.module if hasattr(self.model, "module") else model # 判断是否包含模型属性
        optimizer = raw_model.configure_optimizers(config) # 给模型配置优化器

        # 执行迭代的函数（将数据送入模型并计算损失）
        def run_epoch(split:str): # 判断是训练还是测试
# ==============================================
            # 如果输入“train"则执行训练：
            is_train = split == 'train'
            model.train(is_train) # 打开模型训练功能
# ==============================================
            # 判断数据的属性（是训练还是测试）
            data = self.train_dataset if is_train else self.test_dataset
            # 加载数据
            loader = DataLoader(data, shuffle=True, pin_memory=True,
                                batch_size=config.batch_size,
                                num_workers=config.num_workers)

            losses = [] # 用来存储损失值
            pbar = tqdm.tqdm(enumerate(loader), total=len(loader)) if is_train else enumerate(loader)# 显示进度条
# ==============================================
            for it, (x, y) in pbar: #读取数据
                # 将数据放到正确的设备上
                x = x.to(self.device)
                y = y.to(self.device)
                # 将数据传播给模型
                with torch.set_grad_enabled(is_train):# 计算梯度开关（将梯度计算设置为打开或关闭的上下文管理器）
                    logits, loss = model(x, y)# 将数据喂入模型并返回模型的输出
                    loss = loss.mean() # 如果它们分散在多个 GPU 上，则折叠所有损失
                    losses.append(loss.item())# 将所有损失放入loss损失列表
# ==============================================
                # 训练
                if is_train:
                    # 梯度初始化 -> 反向传播 -> 进行梯度裁剪防止反向传播时梯度为0或者消失 ->应用优化器更新模型的参数
                    # 反向传播并更新参数
                    model.zero_grad()# 模型梯度初始化
                    loss.backward()# 执行反向传播
                    #既然在BP过程中会产生梯度消失（就是偏导无限接近0，导致长时记忆无法更新），
                    # 那么最简单粗暴的方法，
                    # 设定阈值，
                    # 当梯度小于阈值时，更新的梯度为阈值，
                    #（梯度裁剪解决的是梯度消失或爆炸的问题，即设定阈值）
                    torch.nn.utils.clip_grad_norm_(model.parameters(), config.grad_norm_clip)# 梯度裁剪防止反向传播时梯度消失
                    optimizer.step()# 执行优化器

                    # 》》》》》》》》》》》》》》》》》》》》》》》》》
                    # 根据我们的进度衰减学习率
                    if config.lr_decay: # 预先配置的学习率
                        self.tokens += (y >= 0).sum() # 此步骤处理的token数（即标签不是 -100）
                        #############################################################################
                        if self.tokens < config.warmup_tokens:
                            # 由于刚开始训练时,模型的权重(weights)是随机初始化的，此时若选择一个较大的学习率,可能带来模型的不稳定(振荡)，
                            # 选择Warmup预热学习率的方式，可以使得开始训练的几个epoches或者一些steps内学习率较小,在预热的小学习率下，
                            # 模型可以慢慢趋于稳定,等模型相对稳定后再选择预先设置的学习率进行训练,使得模型收敛速度变得更快，模型效果更佳。
                            lr_mult = float(self.tokens) / float(max(1, config.warmup_tokens))
                        else:
                            # 余弦学习率衰减
                            # 余弦衰减
                            # 顾名思义，就是采用余弦方式进行学习率的衰减。
                            progress = float(self.tokens - config.warmup_tokens) / float(max(1, config.final_tokens - config.warmup_tokens))
                            lr_mult = max(0.1, 0.5 * (1.0 + math.cos(math.pi * progress)))

                        lr = config.learning_rate * lr_mult

                        for param_group in optimizer.param_groups:
                            param_group['lr'] = lr # 将所得的学习率应用到优化器
                        ################################################################################
                    else:
                        lr = config.learning_rate
                    # 》》》》》》》》》》》》》》》》》》》》》》》》》


                    # 显示迭代的进度
                    pbar.set_description(f"epoch {epoch+1} iter {it}: train loss {loss.item():.5f}. lr {lr:e}")
# ==============================================
            # 测试集
            if not is_train:
                test_loss = float(np.mean(losses))
                logger.info("test loss: %f", test_loss)
                return test_loss

        best_loss = float('inf')# 最佳损失
        self.tokens = 0 # 用于学习率衰减的计数器
# ==============================================

        for epoch in range(config.max_epochs):
            # 运行迭代
            run_epoch('train')
            if self.test_dataset is not None:
                test_loss = run_epoch('test')
        ##################################################################################
            # supports early stopping based on the test loss, or just save always if no test set is provided
            good_model = self.test_dataset is None or test_loss < best_loss

            if self.SAVE is not None and good_model:
                self.save_checkpoint()
# ==============================================
# 模型保存函数
    def save_checkpoint(self):
        # DataParallel wrappers keep raw model object in .module attribute
        raw_model = self.model.module if hasattr(self.model, "module") else self.model
        torch.save(raw_model.state_dict(), 'model.bin')
# ===============>>>>>>>END<<<<<<<<==================