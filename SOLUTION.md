# Royal Mint Vault Security Subroutines — Challenge Solutions & Bug Audit Guide

This document contains the complete audit and solution reference for all 10 cybersecurity disarm challenges in the **Alarm System Game**. Each subroutine is built with **NumPy**, **Pandas**, or **Scikit-Learn** and contains **exactly 3 bugs** (Medium to Hard difficulty).

---

## Challenge Summary & 3-Bug Matrix

| # | Subroutine Title | Library | Category | Expected Output Sequence | The 3 Bugs & Required Fixes |
|---|---|---|---|---|---|
| **01** | **Telemetry Matrix Robust Z-Score Normalization** | `NumPy` | Vectorized Data Cleaning | `DISARM_SEQ: NP-ROBUST-Z-02-319.54` | **1.** `axis=1` (rows) used instead of `axis=0` (columns) in `np.nanmedian`.<br>**2.** NaNs imputed with `0.0` instead of column medians (`np.take(col_medians, inds[1])`).<br>**3.** MAD calculates `np.mean` of deviations instead of `np.median`. |
| **02** | **Financial Ledger Rolling VWAP & Anomaly Filter** | `Pandas` | Time-Series Wrangling | `DISARM_SEQ: PD-VWAP-3800-1.46` | **1.** `df.sort_values()` called without reassignment or `.reset_index(drop=True)`.<br>**2.** Rolling price-volume divided by instantaneous volume instead of 3-period rolling volume (`df["rolling_vol"]`).<br>**3.** Percentage deviation formula missing `np.abs()` and dividing by `price` instead of `vwap`. |
| **03** | **Intrusion Detector Logistic Regression Calibration** | `Scikit-Learn` | Classification Pipeline | `DISARM_SEQ: SK-LOGREG-AUC-1.00-ACC-4` | **1.** Data leakage: calls `scaler.fit_transform(X_test)` instead of `scaler.transform(X_test)`.<br>**2.** Passes discrete predictions `clf.predict(X_test_scaled)` to `roc_auc_score` instead of probabilities `probs`.<br>**3.** Inverted decision threshold condition (`< 0.55` instead of `>= 0.55`). |
| **04** | **Biometric Access Matrix SVD Low-Rank Compression** | `NumPy` | Matrix Factorization | `DISARM_SEQ: NP-SVD-RANK2-ERR-7.595-ENG-96.8` | **1.** Uses element-wise multiplication `*` with $V^T$ instead of matrix product `@ Vt[:k, :]`.<br>**2.** Computes residual error as `A_approx - A_approx` instead of `A - A_approx`.<br>**3.** Spectral energy ratio uses unsquared singular values instead of variances ($S^2$). |
| **05** | **Vault Sensor Resampling & Exponential Moving Average** | `Pandas` | Time-Series Interpolation | `DISARM_SEQ: PD-EWMA-LAST-30.54-MAX-30.54` | **1.** `interpolate(method="linear")` fails on irregular timestamps; requires `method="time"`.<br>**2.** Resampling 15-minute intervals with `.sum()` instead of `.mean()`.<br>**3.** Exponential smoothing initialized with `adjust=True` instead of recursive `adjust=False`. |
| **06** | **Security Token Sublinear TF-IDF Cosine Similarity** | `Scikit-Learn` | NLP Feature Extraction | `DISARM_SEQ: SK-TFIDF-MATCH-DOC0-SIM-0.155` | **1.** `ngram_range=(2, 2)` ignores crucial unigrams; requires `(1, 2)`.<br>**2.** Fits a separate vectorizer instance on the query; must transform query using document vectorizer vocabulary.<br>**3.** Uses `np.argmin` (minimum similarity) instead of `np.argmax` (maximum similarity). |
| **07** | **Surveillance Drone K-Means & Silhouette Validation** | `Scikit-Learn` | Unsupervised Clustering | `DISARM_SEQ: SK-KMEANS-SIL-0.970-INERTIA-15.5` | **1.** Initializes `n_clusters=2` instead of the required 3 patrol sectors.<br>**2.** Reads `.labels_` before model training without calling `kmeans.fit_predict(X)`.<br>**3.** Passes transposed coordinates $X^T$ to `silhouette_score` instead of $X$. |
| **08** | **Datacenter Firewall MultiIndex Pivoting & Threat Score** | `Pandas` | Hierarchical Pivoting | `DISARM_SEQ: PD-PIVOT-TOP-DC-SOUTH-SCORE-76.5` | **1.** `pivot_table` uses default `aggfunc="mean"` instead of `"sum"`.<br>**2.** Grouping aggregates along `level=1` (tier) instead of `level=0` (datacenter).<br>**3.** Inverted threat weight coefficients ($1.5 \times \text{CRITICAL}$ and $3.0 \times \text{HIGH}$). |
| **09** | **Sensor Neural Weight Ridge Gradient Descent** | `NumPy` | Vectorized Optimization | `DISARM_SEQ: NP-RIDGE-LOSS-0.090-WNORM-2.26` | **1.** Dimension mismatch in gradient: `X @ error` instead of $X^T @ \text{error}$.<br>**2.** Omits the Ridge L2 regularization weight penalty `(lambda_reg / m) * w` in gradient calculation.<br>**3.** Gradient ascent update (`w += lr * grad`) causing divergence instead of subtraction (`w -= lr * grad`). |
| **10** | **Threat Level Confusion Matrix & Macro-F1 Metric** | `Scikit-Learn` | Evaluation Metrics | `DISARM_SEQ: SK-METRICS-MACROF1-0.758-PREC0-1.00` | **1.** Uses `average="micro"` instead of `average="macro"` for class imbalance.<br>**2.** Sums row 0 (False Negatives) instead of column 0 (False Positives) for Class 0 precision.<br>**3.** Precision denominator divides by $FP$ instead of $(TP + FP)$. |

---

## Detailed Bug Breakdown by Subroutine

### Subroutine 1: Telemetry Matrix Robust Z-Score Normalization
- **File**: `alarm-01` (`NumPy`)
- **Expected Output**: `DISARM_SEQ: NP-ROBUST-Z-02-319.54`
- **Bug 1**: `col_medians = np.nanmedian(raw_data, axis=1)` computes medians across rows instead of columns.
  - *Fix*: `col_medians = np.nanmedian(raw_data, axis=0)`
- **Bug 2**: `cleaned[inds] = 0.0` fills missing telemetry with zeros, biasing variance.
  - *Fix*: `cleaned[inds] = np.take(col_medians, inds[1])`
- **Bug 3**: `mad = np.mean(deviations, axis=0)` computes mean absolute deviation rather than median absolute deviation.
  - *Fix*: `mad = np.median(deviations, axis=0)`

---

### Subroutine 2: Financial Ledger Rolling VWAP & Anomaly Filter
- **File**: `alarm-02` (`Pandas`)
- **Expected Output**: `DISARM_SEQ: PD-VWAP-3800-1.46`
- **Bug 1**: `df.sort_values(by=["symbol", "timestamp"])` is not saved back to `df`.
  - *Fix*: `df = df.sort_values(by=["symbol", "timestamp"]).reset_index(drop=True)`
- **Bug 2**: `df["vwap"] = df["rolling_pv"] / df["volume"]` divides rolling sum by instantaneous volume.
  - *Fix*: `df["vwap"] = df["rolling_pv"] / df["rolling_vol"]`
- **Bug 3**: `df["pct_dev"] = ((df["price"] - df["vwap"]) / df["price"]) * 100` lacks absolute value and divides by price.
  - *Fix*: `df["pct_dev"] = (np.abs(df["price"] - df["vwap"]) / df["vwap"]) * 100`

---

### Subroutine 3: Intrusion Detector Logistic Regression Calibration
- **File**: `alarm-03` (`Scikit-Learn`)
- **Expected Output**: `DISARM_SEQ: SK-LOGREG-AUC-1.00-ACC-4`
- **Bug 1**: `X_test_scaled = scaler.fit_transform(X_test)` leaks test distribution information.
  - *Fix*: `X_test_scaled = scaler.transform(X_test)`
- **Bug 2**: `auc = roc_auc_score(y_test, clf.predict(X_test_scaled))` inputs thresholded discrete labels.
  - *Fix*: `auc = roc_auc_score(y_test, probs)` where `probs = clf.predict_proba(X_test_scaled)[:, 1]`
- **Bug 3**: `preds = (probs < threshold).astype(int)` inverts positive predictions.
  - *Fix*: `preds = (probs >= threshold).astype(int)`

---

### Subroutine 4: Biometric Access Matrix SVD Low-Rank Compression
- **File**: `alarm-04` (`NumPy`)
- **Expected Output**: `DISARM_SEQ: NP-SVD-RANK2-ERR-7.595-ENG-96.8`
- **Bug 1**: `A_approx = (U[:, :k] * S[:k]) * Vt[:k, :]` performs broadcasted element-wise multiplication instead of matrix dot product.
  - *Fix*: `A_approx = (U[:, :k] * S[:k]) @ Vt[:k, :]`
- **Bug 2**: `diff = A_approx - A_approx` evaluates to zero instead of reconstruction error.
  - *Fix*: `diff = A - A_approx`
- **Bug 3**: `retained_energy = (np.sum(S[:k]) / np.sum(S)) * 100` omits squared singular values.
  - *Fix*: `retained_energy = (np.sum(S[:k] ** 2) / np.sum(S ** 2)) * 100`

---

### Subroutine 5: Vault Sensor Resampling & Exponential Moving Average
- **File**: `alarm-05` (`Pandas`)
- **Expected Output**: `DISARM_SEQ: PD-EWMA-LAST-30.54-MAX-30.54`
- **Bug 1**: `interpolate(method="linear")` assumes equidistant sampling intervals.
  - *Fix*: `interpolate(method="time")`
- **Bug 2**: `resampled = df[["interp"]].resample("15min").sum()` aggregates via sum instead of mean.
  - *Fix*: `resampled = df[["interp"]].resample("15min").mean()`
- **Bug 3**: `ewm(alpha=0.4, adjust=True)` uses non-recursive adjustment weights.
  - *Fix*: `ewm(alpha=0.4, adjust=False)`

---

### Subroutine 6: Security Token Sublinear TF-IDF Cosine Similarity
- **File**: `alarm-06` (`Scikit-Learn`)
- **Expected Output**: `DISARM_SEQ: SK-TFIDF-MATCH-DOC0-SIM-0.155`
- **Bug 1**: `ngram_range=(2, 2)` ignores individual token matches.
  - *Fix*: `ngram_range=(1, 2)`
- **Bug 2**: `query_vector = TfidfVectorizer().fit_transform([query])` fits a different dictionary.
  - *Fix*: Vectorize query and documents on a unified fitted matrix (`all_texts = documents + [query]`).
- **Bug 3**: `best_idx = int(np.argmin(similarities))` picks the most dissimilar document.
  - *Fix*: `best_idx = int(np.argmax(similarities))`

---

### Subroutine 7: Surveillance Drone K-Means & Silhouette Validation
- **File**: `alarm-07` (`Scikit-Learn`)
- **Expected Output**: `DISARM_SEQ: SK-KMEANS-SIL-0.970-INERTIA-15.5`
- **Bug 1**: `KMeans(n_clusters=2)` partitions into 2 clusters instead of 3.
  - *Fix*: `KMeans(n_clusters=3, random_state=42, n_init=10)`
- **Bug 2**: `labels = kmeans.labels_` accessed before calling `.fit()`.
  - *Fix*: `labels = kmeans.fit_predict(X)`
- **Bug 3**: `score = silhouette_score(X.T, labels)` passes transposed coordinates.
  - *Fix*: `score = silhouette_score(X, labels)`

---

### Subroutine 8: Datacenter Firewall MultiIndex Pivoting & Threat Score
- **File**: `alarm-08` (`Pandas`)
- **Expected Output**: `DISARM_SEQ: PD-PIVOT-TOP-DC-SOUTH-SCORE-76.5`
- **Bug 1**: `pd.pivot_table(..., fill_value=0)` defaults to `aggfunc="mean"`.
  - *Fix*: Explicitly specify `aggfunc="sum"`.
- **Bug 2**: `dc_summary = pivot.groupby(level=1).sum()` aggregates by tier level.
  - *Fix*: Aggregate by datacenter with `pivot.groupby(level=0).sum()`.
- **Bug 3**: `crit * 1.5 + high * 3.0` reverses the threat severity multipliers.
  - *Fix*: `crit * 3.0 + high * 1.5`.

---

### Subroutine 9: Sensor Neural Weight Ridge Gradient Descent
- **File**: `alarm-09` (`NumPy`)
- **Expected Output**: `DISARM_SEQ: NP-RIDGE-LOSS-0.090-WNORM-2.26`
- **Bug 1**: `grad = (1 / m) * (X @ error)` fails on matrix inner dimensions.
  - *Fix*: `grad = (1 / m) * (X.T @ error) + (lambda_reg / m) * w`
- **Bug 2**: L2 penalty term is omitted from the analytical gradient.
  - *Fix*: Add `+ (lambda_reg / m) * w`.
- **Bug 3**: `w += lr * grad` performs gradient ascent, diverging away from optimal weights.
  - *Fix*: `w -= lr * grad`

---

### Subroutine 10: Threat Level Confusion Matrix & Macro-F1 Metric
- **File**: `alarm-10` (`Scikit-Learn`)
- **Expected Output**: `DISARM_SEQ: SK-METRICS-MACROF1-0.758-PREC0-1.00`
- **Bug 1**: `average="micro"` weights classes equally by sample count rather than macro-averaging.
  - *Fix*: `average="macro"`
- **Bug 2**: `fp_0 = np.sum(cm[0, :]) - tp_0` computes false negatives (row sum).
  - *Fix*: `fp_0 = np.sum(cm[:, 0]) - tp_0` (column sum)
- **Bug 3**: `prec_0 = float(tp_0 / fp_0)` omits true positives from the denominator.
  - *Fix*: `prec_0 = float(tp_0 / (tp_0 + fp_0))`

---

## Scoring & Time Decay Specifications

- **Total Timer**: 15 minutes (900 seconds).
- **Maximum Points**: 10 Points.
- **Decay Rules**:
  - **$\ge$ 13:00 Remaining (0 to 120s elapsed)**: Full **10 Points**.
  - **$< $ 13:00 Remaining (120s to 900s elapsed)**: The score decays gradually from **9 down to 1 point**:
    $$\text{Score} = \min\left(9, \max\left(1, 1 + \left\lfloor \frac{\text{timeLeft}}{780} \times 9 \right\rfloor \right)\right)$$
  - **Timer Expired (0s remaining)**: 0 points (or 1 completion point if submitted right at expiration).
