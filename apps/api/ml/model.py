"""
Golf ML model: ensemble of GradientBoostingRegressor and GolfScoreNet.
"""

import os
import json
import logging
import numpy as np
import joblib
import torch
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from typing import Optional, List

from .neural_net import GolfScoreNet
from .features import FEATURE_COLUMNS

logger = logging.getLogger(__name__)

_SKLEARN_FILENAME = "gbr_model.joblib"
_SCALER_FILENAME = "scaler.joblib"
_NN_FILENAME = "golf_score_net.pt"
_METADATA_FILENAME = "metadata.json"


class GolfMLModel:
    """
    Ensemble model combining GradientBoostingRegressor and GolfScoreNet.

    Both models are trained independently. During inference, predictions
    are averaged when both are available; otherwise whichever model is
    available is used.
    """

    def __init__(self):
        self.gbr: Optional[GradientBoostingRegressor] = None
        self.net: Optional[GolfScoreNet] = None
        self.scaler: Optional[StandardScaler] = None
        self.feature_names: List[str] = FEATURE_COLUMNS
        self._trained: bool = False

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    @property
    def is_trained(self) -> bool:
        """True if at least one sub-model has been fitted."""
        return self._trained

    def fit(self, X: np.ndarray, y: np.ndarray) -> None:
        """
        Train both the GradientBoostingRegressor and GolfScoreNet.

        Args:
            X: Feature matrix of shape (n_samples, n_features).
               Must already be scaled if you want consistent behavior
               with save/load; pass raw features and supply a scaler
               externally, or scale inside this method.
            y: Target vector of shape (n_samples,).
        """
        # --- sklearn GBR ---
        self.gbr = GradientBoostingRegressor(
            n_estimators=200,
            learning_rate=0.05,
            max_depth=4,
            subsample=0.8,
            random_state=42,
        )
        self.gbr.fit(X, y)
        logger.info("GradientBoostingRegressor trained.")

        # --- PyTorch MLP ---
        input_dim = X.shape[1]
        self.net = GolfScoreNet(input_dim=input_dim, hidden_dims=[64, 32, 16], dropout=0.2)
        self._train_net(X, y)
        logger.info("GolfScoreNet trained.")

        self._trained = True

    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Generate ensemble predictions.

        Returns the average of GBR and MLP predictions when both are
        available. Falls back to whichever single model exists.

        Args:
            X: Feature matrix of shape (n_samples, n_features).

        Returns:
            Predictions array of shape (n_samples,).
        """
        if not self._trained:
            raise RuntimeError("Model has not been trained. Call fit() first.")

        preds = []

        if self.gbr is not None:
            preds.append(self.gbr.predict(X))

        if self.net is not None:
            preds.append(self._net_predict(X))

        if not preds:
            raise RuntimeError("No sub-models available for prediction.")

        return np.mean(preds, axis=0)

    def save(self, artifacts_dir: str) -> None:
        """
        Persist model artifacts to disk.

        Saves:
          - GBR model via joblib
          - PyTorch state dict (.pt)
          - StandardScaler via joblib
          - metadata JSON (feature names, input_dim, etc.)

        Args:
            artifacts_dir: Directory to write artifacts into.
        """
        os.makedirs(artifacts_dir, exist_ok=True)

        # sklearn GBR
        if self.gbr is not None:
            joblib.dump(self.gbr, os.path.join(artifacts_dir, _SKLEARN_FILENAME))
            logger.info("GBR saved.")

        # scaler
        if self.scaler is not None:
            joblib.dump(self.scaler, os.path.join(artifacts_dir, _SCALER_FILENAME))
            logger.info("Scaler saved.")

        # PyTorch net
        if self.net is not None:
            torch.save(
                self.net.state_dict(),
                os.path.join(artifacts_dir, _NN_FILENAME),
            )
            logger.info("GolfScoreNet state dict saved.")

        # Metadata
        metadata = {
            "feature_names": self.feature_names,
            "input_dim": len(self.feature_names),
            "has_gbr": self.gbr is not None,
            "has_net": self.net is not None,
            "has_scaler": self.scaler is not None,
        }
        with open(os.path.join(artifacts_dir, _METADATA_FILENAME), "w") as f:
            json.dump(metadata, f, indent=2)
        logger.info("Metadata saved.")

    @classmethod
    def load(cls, artifacts_dir: str) -> "GolfMLModel":
        """
        Load a GolfMLModel from a directory of saved artifacts.

        Args:
            artifacts_dir: Directory that was previously used with save().

        Returns:
            A fully initialized GolfMLModel instance.

        Raises:
            FileNotFoundError: If the metadata file is missing.
        """
        metadata_path = os.path.join(artifacts_dir, _METADATA_FILENAME)
        if not os.path.exists(metadata_path):
            raise FileNotFoundError(
                f"Metadata file not found at {metadata_path}. "
                "Ensure the model has been saved before loading."
            )

        with open(metadata_path, "r") as f:
            metadata = json.load(f)

        instance = cls()
        instance.feature_names = metadata.get("feature_names", FEATURE_COLUMNS)
        input_dim = metadata.get("input_dim", len(FEATURE_COLUMNS))

        # Load GBR
        gbr_path = os.path.join(artifacts_dir, _SKLEARN_FILENAME)
        if metadata.get("has_gbr") and os.path.exists(gbr_path):
            instance.gbr = joblib.load(gbr_path)
            logger.info("GBR loaded.")

        # Load scaler
        scaler_path = os.path.join(artifacts_dir, _SCALER_FILENAME)
        if metadata.get("has_scaler") and os.path.exists(scaler_path):
            instance.scaler = joblib.load(scaler_path)
            logger.info("Scaler loaded.")

        # Load PyTorch net
        net_path = os.path.join(artifacts_dir, _NN_FILENAME)
        if metadata.get("has_net") and os.path.exists(net_path):
            instance.net = GolfScoreNet(
                input_dim=input_dim, hidden_dims=[64, 32, 16], dropout=0.2
            )
            instance.net.load_state_dict(
                torch.load(net_path, map_location="cpu", weights_only=True)
            )
            instance.net.eval()
            logger.info("GolfScoreNet loaded.")

        instance._trained = (instance.gbr is not None or instance.net is not None)
        return instance

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _train_net(self, X: np.ndarray, y: np.ndarray, epochs: int = 100, lr: float = 1e-3) -> None:
        """Train the GolfScoreNet with Adam optimizer and MSE loss."""
        self.net.train()
        optimizer = torch.optim.Adam(self.net.parameters(), lr=lr)
        loss_fn = torch.nn.MSELoss()

        X_tensor = torch.tensor(X, dtype=torch.float32)
        y_tensor = torch.tensor(y, dtype=torch.float32).unsqueeze(1)

        for epoch in range(epochs):
            optimizer.zero_grad()
            output = self.net(X_tensor)
            loss = loss_fn(output, y_tensor)
            loss.backward()
            optimizer.step()

            if (epoch + 1) % 20 == 0:
                logger.debug("Epoch %d/%d — Loss: %.4f", epoch + 1, epochs, loss.item())

        self.net.eval()

    def _net_predict(self, X: np.ndarray) -> np.ndarray:
        """Run inference with GolfScoreNet."""
        self.net.eval()
        with torch.no_grad():
            X_tensor = torch.tensor(X, dtype=torch.float32)
            preds = self.net(X_tensor).squeeze(1).numpy()
        return preds
