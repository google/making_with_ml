import torch
import math

from torch.nn import functional
from torch import nn

# 上下文注意力(因果注意力)
class CausalSelfAttention(nn.Module):
    """
    A vanilla multi-head masked self-attention layer with a projection at the end.
    It is possible to use torch.nn.MultiheadAttention here but I am including an
    explicit implementation here to show that there is nothing too scary here.
    """
    def __init__(self, config):
        super(CausalSelfAttention,self).__init__()
        assert config.n_embd % config.n_head == 0
        # key, query, value 所有头的预测
        self.key = nn.Linear(config.n_embd, config.n_embd)
        self.query = nn.Linear(config.n_embd, config.n_embd)
        self.value = nn.Linear(config.n_embd, config.n_embd)
        # 正则化（使输出的“函数更加的平常，平滑”）
        self.attn_drop = nn.Dropout(config.attn_pdrop)
        self.resid_drop = nn.Dropout(config.resid_pdrop)
        # 输出投影
        self.proj = nn.Linear(config.n_embd, config.n_embd)
        # 因果掩码，以确保仅将注意力应用于输入序列的左侧
        self.register_buffer("mask", torch.tril(torch.ones(config.block_size, config.block_size)).view(1, 1, config.block_size, config.block_size))
        self.n_head = config.n_head

    def forward(self, x, layer_past=None):
        B, T, C = x.size() # B是批量大小，T是序列长度，C是嵌入的维数 ( n_embd)

        # 批量计算所有头的查询、键、值并将头向前移动以成为批次维度dim
        k = self.key(x).view(B, T, self.n_head, C // self.n_head).transpose(1, 2) # (B, nh, T, hs)
        q = self.query(x).view(B, T, self.n_head, C // self.n_head).transpose(1, 2) # (B, nh, T, hs)
        v = self.value(x).view(B, T, self.n_head, C // self.n_head).transpose(1, 2) # (B, nh, T, hs)

        # causal self-attention; Self-attend: (B, nh, T, hs) x (B, nh, hs, T) -> (B, nh, T, T)
        att = (q @ k.transpose(-2, -1)) * (1.0 / math.sqrt(k.size(-1)))
        att = att.masked_fill(self.mask[:,:,:T,:T] == 0, float('-inf'))
        att = torch.softmax(att, dim=-1)
        att = self.attn_drop(att)
        y = att @ v # (B, nh, T, T) x (B, nh, T, hs) -> (B, nh, T, hs)
        y = y.transpose(1, 2).contiguous().view(B, T, C) # re-assemble all head outputs side by side
        # output projection
        y = self.resid_drop(self.proj(y))
        return y

# GPT 块
class GPT_Block(nn.Module):
    """ an unassuming Transformer block """
    def __init__(self, config):
        super(GPT_Block,self).__init__()
        self.ln1 = nn.LayerNorm(config.n_embd)
        self.ln2 = nn.LayerNorm(config.n_embd)
        self.attn = CausalSelfAttention(config)
        self.mlp = nn.Sequential(
            nn.Linear(config.n_embd, 4 * config.n_embd),
            nn.GELU(),
            nn.Linear(4 * config.n_embd, config.n_embd),
            nn.Dropout(config.resid_pdrop),
        )
    def forward(self, x):
        x = x + self.attn(self.ln1(x))# This ln1(x) + x =y -> ln(y) + x = y2
        x = x + self.mlp(self.ln2(x))
        return x # return y2


class GPT_Model(nn.Module):
    def __init__(self,config):
        super(GPT_Model,self).__init__()
        # input embedding stem
        self.tok_emb = nn.Embedding(config.vocab_size, config.n_embd)
        self.pos_emb = nn.Parameter(torch.zeros(1, config.block_size, config.n_embd))# 一维，大小为block_size和n_emd维度
        self.drop1 = nn.Dropout(config.embd_pdrop)
        self.drop2 = nn.Dropout(0.5)



        # transformer-Blocks
        self.blocks = nn.Sequential(*[GPT_Block(config = config) for _ in range(config.n_layer)])


        # decoder head
        self.ln_f = nn.LayerNorm(config.n_embd)
        self.head = nn.Linear(config.n_embd, config.vocab_size, bias=False)

        self.block_size = config.block_size
        self.apply(self._init_weights)

        #logger.info("number of parameters: %e", sum(p.numel() for p in self.parameters()))

    def get_block_size(self):
        return self.block_size

    def _init_weights(self, module):
        if isinstance(module, (nn.Linear, nn.Embedding)):
            module.weight.data.normal_(mean=0.0, std=0.02)
            if isinstance(module, nn.Linear) and module.bias is not None:
                module.bias.data.zero_()
        elif isinstance(module, nn.LayerNorm):
            module.bias.data.zero_()
            module.weight.data.fill_(1.0)
# ====================>>>>>>>配置优化器<<<<<<<<==========================
    def configure_optimizers(self, train_config):
        """
        不幸的是，这个长函数正在做一些非常简单的事情并且非常具有防御性：
         我们将模型的所有参数分成两个桶：那些将经历
         正则化的权重衰减和不会的权重衰减（偏差和 layernorm/嵌入权重）。
         然后我们返回 PyTorch 优化器对象。
         """
        # 将所有参数与那些将经历和不会经历正则化权重衰减的参数分开
        decay = set() # 一个集合
        no_decay = set() # 一个集合

        whitelist_weight_modules = (torch.nn.Linear,) # 权重白名单
        blacklist_weight_modules = (torch.nn.LayerNorm, torch.nn.Embedding) # 权重黑名单

        for mn, m in self.named_modules():
            for pn, p in m.named_parameters():
                fpn = '%s.%s' % (mn, pn) if mn else pn  # 完整的参数名称

                if pn.endswith('bias'):
                    # 所有的bias都不会衰减
                    no_decay.add(fpn)
                elif pn.endswith('weight') and isinstance(m, whitelist_weight_modules):
                    # weights of whitelist modules will be weight decayed
                    decay.add(fpn)
                elif pn.endswith('weight') and isinstance(m, blacklist_weight_modules):
                    # weights of blacklist modules will NOT be weight decayed
                    no_decay.add(fpn)

        # 特殊情况下，根 GPT 模块中的位置嵌入参数未衰减
        no_decay.add('pos_emb')

        # 验证我们是否考虑了每个参数
        参数字典 = {pn: p for pn, p in self.named_parameters()}
        inter_params = decay & no_decay
        union_params = decay | no_decay
        assert len(inter_params) == 0, "parameters %s made it into both decay/no_decay sets!" % (str(inter_params),)
        assert len(
            参数字典.keys() - union_params) == 0, "parameters %s were not separated into either decay/no_decay set!" \
                                                    % (str(参数字典.keys() - union_params),)

        # 创建pytorch优化器的一个对象
        optim_groups = [
            {"params": [参数字典[pn] for pn in sorted(list(decay))], "weight_decay": train_config.weight_decay},
            {"params": [参数字典[pn] for pn in sorted(list(no_decay))], "weight_decay": 0.0},
        ]
        # build the optimizer

        optimizer = torch.optim.AdamW(optim_groups, lr=train_config.learning_rate, betas=train_config.betas)

        return optimizer
# ===============>>>>>前向传播<<<<<<<<=================
    def forward(self, idx, targets=None):
        b, t = idx.size() # B是批量大小，T是序列长度，C是嵌入的维数 ( n_embd)
        assert t <= self.block_size, "Cannot forward, model block size is exhausted."

        # forward the GPT model
        token_embeddings = self.tok_emb(idx)  # 每个索引映射到一个（可学习的）向量
        position_embeddings = self.pos_emb[:, :t, :]  # each position maps to a (learnable) vector
        # 前向传播层：
        x = self.drop1(token_embeddings + position_embeddings)
        x = self.drop2(x)
        x = self.blocks(x)
        x = self.ln_f(x)
        logits = self.head(x)

        # 如果我们给定一些期望的目标，也计算损失
        loss = None
        if targets is not None:
            loss = functional.cross_entropy(logits.view(-1, logits.size(-1)), targets.view(-1))
        return logits, loss


