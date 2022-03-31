# Image-GPT's pytorch implementation

- Some data preprocessing parts refer to the ideas of some online bigwigs 
- ````train.py```` can be run directly! (simple to run)
- The dataset uses the ```CIFAR-10``` dataset for training

```python
# ===================================================================
# Configuration of some GPT models before training
# According to the official model, the parameters are batch_size = 128, Adam lr 0.003, beta = (0.9, 0.95)
# Learning rate warms up for one epoch, then decays to 0
# Not using weight decay or droput
# n_layer=24, n_head=8, n_embd=512
# In addition, you can configure it yourself according to your own device
mconf = GPTConfig(train_dataset.vocab_size, train_dataset.block_size,
                  embd_pdrop=0.0, resid_pdrop=0.0, attn_pdrop=0.0,
                  n_layer=10, n_head=4, n_embd=84)

model = GPT_Model(mconf)
print(model)
```
