"""
PyTorch MLP neural network for golf score prediction.
"""

import torch
import torch.nn as nn
from typing import List


class GolfScoreNet(nn.Module):
    """
    Multi-layer perceptron for predicting golf scores.

    Architecture: Linear -> ReLU -> Dropout, repeated for each hidden layer,
    followed by a final Linear output layer.
    """

    def __init__(
        self,
        input_dim: int,
        hidden_dims: List[int] = None,
        dropout: float = 0.2,
    ):
        """
        Initialize GolfScoreNet.

        Args:
            input_dim: Number of input features.
            hidden_dims: List of hidden layer sizes. Defaults to [64, 32, 16].
            dropout: Dropout probability applied after each hidden layer.
        """
        super(GolfScoreNet, self).__init__()

        if hidden_dims is None:
            hidden_dims = [64, 32, 16]

        layers: List[nn.Module] = []
        prev_dim = input_dim

        for hidden_dim in hidden_dims:
            layers.append(nn.Linear(prev_dim, hidden_dim))
            layers.append(nn.ReLU())
            layers.append(nn.Dropout(p=dropout))
            prev_dim = hidden_dim

        # Final output layer — single scalar (predicted score)
        layers.append(nn.Linear(prev_dim, 1))

        self.network = nn.Sequential(*layers)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass.

        Args:
            x: Input tensor of shape (batch_size, input_dim).

        Returns:
            Output tensor of shape (batch_size, 1).
        """
        return self.network(x)
