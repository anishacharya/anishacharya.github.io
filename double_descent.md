---
layout: page
title: Understanding Double Descent 
---

### Background
<img align="right" width="500" height="300" src="/img/double_descent.png"> 
We focus on the phenomenon of double descent in deep learning wherein when we increase model size or 
the num-ber of epochs, performance on the test set initially improves(as expected), 
then worsens but again starts to improve andfinally saturates, which is against conventional wisdom.
This phenomenon has already been demonstrated on traditional machine 
learning models [[Belikin et.al.](https://arxiv.org/pdf/1812.11118.pdf)],
[[Belkin et.al.](https://arxiv.org/pdf/1903.07571.pdf)] but more recently was also observed in complex deep learning models 
[[Nakkiran et.al.](https://arxiv.org/pdf/1912.02292.pdf)]. 
There have also been attempts at mathematically explaining
double descent for simple linear regression settings.

### Proposal
In this project, we aim to investigate double descent more deeply and try to precisely 
characterize the phenomenon under different settings. 
Specifically, we shall focus on a couple of aspects the impact of **label noise** and **regularization** on 
double descent. None of the existing works consider these aspects in detail and we hypothesize that these 
play an integral role in double descent.   
Conversely, we pose a particular question: can we mitigate double descent by applying adequate regularization 
in the case of noisy data? Further, we also plan to investigate if suitable regularization can 
bias the trajectory of gradient-based optimization algorithms in such a way that double descent can 
be mitigated, i.e. we do not observe an intermediate dip at all or observe a very small intermediate 
dip in the test performance.

### DataSets
We shall try to reproduce the limited existing results from OpenAI 
[[Nakkiran et.al.](https://arxiv.org/pdf/1912.02292.pdf)] 
which use commonly used datasets such as CIFAR-10, CIFAR-100, etc. on common 
architectures such as ResNets, VGG, etc. We shall also try to observe this 
in simple problems such as linear regression. 
More importantly, we shall try to observe its variation with different kinds and 
degrees of regularization as well as different noise levels. Existing works 
do not consider regularization in too much detail but we think it is a critical factor 
controlling the extent of double descent.


### Timeline   
-[x] April 15 : Literature Review of Double Descent in a Overparameterized Models       
-[ ] May 10 : Preliminary experiments and theory on linear regression models   
-[ ] May 23 : Deep learning experiments    

