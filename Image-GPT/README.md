# Image-GPT的pytorch实现

- 一些数据预处理的部分参考了一些网上大佬的思路（本人太懒）
- ```train.py```直接运行即可！（运行简单）
- 数据集采用了```CIFAR-10 ```数据集进行训练
- 如果有些地方不足或者需要改进优化欢迎您在```ISSUES```中提出意见我会认真改正！
```python
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
```
