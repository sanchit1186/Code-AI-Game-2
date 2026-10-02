export interface ChallengeServer {
  id: string;
  stageNumber: number;
  title: string;
  category: string;
  points: number;
  timeBonusMax: number;
  description: string;
  buggyCode: string;
  correctCode: string;
  expectedOutput: string;
}

export type ChallengeClient = Omit<ChallengeServer, "correctCode" | "expectedOutput">;

export const CHALLENGES: ChallengeServer[] = [
  {
    id: "alarm-01",
    stageNumber: 1,
    title: "Telemetry Matrix Robust Z-Score Normalization",
    category: "NumPy Vectorized Cleaning",
    points: 10,
    timeBonusMax: 0,
    description: `The vault multi-channel sensor array emits irregular telemetry vectors corrupted by NaN transmission dropouts and severe spike anomalies. Standard mean/std z-scores are heavily distorted by high-magnitude spikes.

You must implement a Robust Z-Score pipeline using NumPy:
1. Impute all NaN values in each column with that column's nan-median.
2. Compute the Median Absolute Deviation (MAD = median(|x - median(x)|)) for each column (avoiding division by zero with a 1e-6 epsilon).
3. Calculate the modified Z-score using Boris Iglewicz & David Hoaglin's formula:
   modified_z = 0.6745 * (x - median) / MAD
4. Count the number of outlier elements where |modified_z| > 3.5, and find the maximum absolute modified z-score across the matrix.

SECURITY AUDIT: Exactly 3 implementation bugs exist in the provided subroutine. Detect and eliminate all 3 defects to output the correct verification sequence:
\`DISARM_SEQ: NP-ROBUST-Z-<COUNT:02d>-<MAX_SCORE:.2f}\``,
    buggyCode: `import numpy as np

def compute_robust_z_scores(raw_data: np.ndarray) -> str:
    # BUG 1: Computing nanmedian along the wrong axis (axis=1 rows instead of axis=0 columns)
    col_medians = np.nanmedian(raw_data, axis=1)
    inds = np.where(np.isnan(raw_data))
    cleaned = raw_data.copy()
    
    # BUG 2: Zero imputation instead of replacing with column medians
    cleaned[inds] = 0.0

    medians = np.median(cleaned, axis=0)
    deviations = np.abs(cleaned - medians)
    
    # BUG 3: Calculating mean of deviations instead of median (MAD requires median)
    mad = np.mean(deviations, axis=0)
    mad = np.where(mad == 0, 1e-6, mad)

    # Modified Z-Score: 0.6745 * (x - median) / mad
    mod_z = 0.6745 * (cleaned - medians) / mad
    outlier_count = int(np.sum(np.abs(mod_z) > 3.5))
    max_score = float(np.max(np.abs(mod_z)))

    return f"DISARM_SEQ: NP-ROBUST-Z-{outlier_count:02d}-{max_score:.2f}"

if __name__ == "__main__":
    telemetry = np.array([
        [10.2, 45.1, np.nan, 120.5],
        [11.5, 47.0, 310.2, 122.1],
        [9.8, np.nan, 305.0, 119.8],
        [10.5, 46.2, 315.4, 121.0],
        [150.0, 48.1, 312.0, 500.0],
        [10.1, 45.8, 308.5, 120.2],
        [10.4, 46.5, 309.1, 121.4],
    ], dtype=float)
    print(compute_robust_z_scores(telemetry))
`,
    correctCode: `import numpy as np

def compute_robust_z_scores(raw_data: np.ndarray) -> str:
    # FIX 1: Compute nanmedian along axis 0 (columns)
    col_medians = np.nanmedian(raw_data, axis=0)
    inds = np.where(np.isnan(raw_data))
    cleaned = raw_data.copy()
    
    # FIX 2: Replace NaNs with the respective column median
    cleaned[inds] = np.take(col_medians, inds[1])

    medians = np.median(cleaned, axis=0)
    deviations = np.abs(cleaned - medians)
    
    # FIX 3: Compute median of deviations for proper MAD
    mad = np.median(deviations, axis=0)
    mad = np.where(mad == 0, 1e-6, mad)

    # Modified Z-Score: 0.6745 * (x - median) / mad
    mod_z = 0.6745 * (cleaned - medians) / mad
    outlier_count = int(np.sum(np.abs(mod_z) > 3.5))
    max_score = float(np.max(np.abs(mod_z)))

    return f"DISARM_SEQ: NP-ROBUST-Z-{outlier_count:02d}-{max_score:.2f}"

if __name__ == "__main__":
    telemetry = np.array([
        [10.2, 45.1, np.nan, 120.5],
        [11.5, 47.0, 310.2, 122.1],
        [9.8, np.nan, 305.0, 119.8],
        [10.5, 46.2, 315.4, 121.0],
        [150.0, 48.1, 312.0, 500.0],
        [10.1, 45.8, 308.5, 120.2],
        [10.4, 46.5, 309.1, 121.4],
    ], dtype=float)
    print(compute_robust_z_scores(telemetry))
`,
    expectedOutput: "DISARM_SEQ: NP-ROBUST-Z-02-319.54",
  },
  {
    id: "alarm-02",
    stageNumber: 2,
    title: "Financial Ledger Rolling VWAP & Anomaly Filter",
    category: "Pandas Time-Series Wrangling",
    points: 10,
    timeBonusMax: 0,
    description: `High-frequency transactions across foreign currency vaults must be evaluated to flag suspicious rapid-liquidity routing.

You must implement a 3-period grouped Volume Weighted Average Price (VWAP) calculation:
1. Ensure the transaction DataFrame is sorted by \`['symbol', 'timestamp']\` and indices reset.
2. Calculate price-volume product (price * volume).
3. Compute 3-period rolling sum of price-volume and rolling sum of volume per currency symbol (min_periods=1), and divide to find rolling VWAP.
4. Calculate percentage deviation: \`100 * |price - vwap| / vwap\`.
5. Sum the total volume of all trades where percentage deviation exceeds 1.0%, and record the maximum percentage deviation.

SECURITY AUDIT: Exactly 3 implementation bugs exist in the provided subroutine. Detect and eliminate all 3 defects to output the correct verification sequence:
\`DISARM_SEQ: PD-VWAP-<FLAGGED_VOL>-<MAX_DEV:.2f}\``,
    buggyCode: `import numpy as np
import pandas as pd

def audit_rolling_vwap(df: pd.DataFrame) -> str:
    # BUG 1: sort_values called without reassigning or resetting index
    df.sort_values(by=["symbol", "timestamp"])
    df["pv"] = df["price"] * df["volume"]

    # Compute rolling values per symbol
    df["rolling_pv"] = df.groupby("symbol")["pv"].transform(lambda s: s.rolling(3, min_periods=1).sum())
    df["rolling_vol"] = df.groupby("symbol")["volume"].transform(lambda s: s.rolling(3, min_periods=1).sum())
    
    # BUG 2: Dividing by instant volume instead of 3-period rolling volume
    df["vwap"] = df["rolling_pv"] / df["volume"]

    # BUG 3: Missing absolute value and dividing by price instead of vwap
    df["pct_dev"] = ((df["price"] - df["vwap"]) / df["price"]) * 100
    
    flagged = df[df["pct_dev"] > 1.0]
    total_flagged_vol = int(flagged["volume"].sum())
    max_dev = float(df["pct_dev"].max())

    return f"DISARM_SEQ: PD-VWAP-{total_flagged_vol}-{max_dev:.2f}"

if __name__ == "__main__":
    data = {
        "timestamp": pd.date_range("2026-01-01 09:00", periods=8, freq="5min"),
        "symbol": ["ALPHA", "BETA", "ALPHA", "BETA", "ALPHA", "BETA", "ALPHA", "BETA"],
        "price": [100.5, 50.2, 101.2, 50.8, 104.0, 49.5, 102.5, 51.0],
        "volume": [1200, 800, 1500, 950, 3100, 700, 1400, 1100],
    }
    df = pd.DataFrame(data)
    print(audit_rolling_vwap(df))
`,
    correctCode: `import numpy as np
import pandas as pd

def audit_rolling_vwap(df: pd.DataFrame) -> str:
    # FIX 1: Reassign sorted DataFrame and reset index
    df = df.sort_values(by=["symbol", "timestamp"]).reset_index(drop=True)
    df["pv"] = df["price"] * df["volume"]

    # Compute rolling values per symbol
    df["rolling_pv"] = df.groupby("symbol")["pv"].transform(lambda s: s.rolling(3, min_periods=1).sum())
    df["rolling_vol"] = df.groupby("symbol")["volume"].transform(lambda s: s.rolling(3, min_periods=1).sum())
    
    # FIX 2: Divide rolling price-volume by rolling volume
    df["vwap"] = df["rolling_pv"] / df["rolling_vol"]

    # FIX 3: Use absolute percentage difference divided by vwap
    df["pct_dev"] = (np.abs(df["price"] - df["vwap"]) / df["vwap"]) * 100
    
    flagged = df[df["pct_dev"] > 1.0]
    total_flagged_vol = int(flagged["volume"].sum())
    max_dev = float(df["pct_dev"].max())

    return f"DISARM_SEQ: PD-VWAP-{total_flagged_vol}-{max_dev:.2f}"

if __name__ == "__main__":
    data = {
        "timestamp": pd.date_range("2026-01-01 09:00", periods=8, freq="5min"),
        "symbol": ["ALPHA", "BETA", "ALPHA", "BETA", "ALPHA", "BETA", "ALPHA", "BETA"],
        "price": [100.5, 50.2, 101.2, 50.8, 104.0, 49.5, 102.5, 51.0],
        "volume": [1200, 800, 1500, 950, 3100, 700, 1400, 1100],
    }
    df = pd.DataFrame(data)
    print(audit_rolling_vwap(df))
`,
    expectedOutput: "DISARM_SEQ: PD-VWAP-3800-1.46",
  },
  {
    id: "alarm-03",
    stageNumber: 3,
    title: "Intrusion Detector Logistic Regression Calibration",
    category: "Scikit-Learn Classification",
    points: 10,
    timeBonusMax: 0,
    description: `A network packet classifier models security threats using Logistic Regression. To ensure robust inference without training contamination, feature scaling must be properly decoupled between training and test sets.

You must calibrate the classification pipeline:
1. Fit \`StandardScaler\` on training features only, and transform test features without refitting.
2. Train \`LogisticRegression(C=1.0, solver="liblinear", random_state=42)\`.
3. Compute the true ROC-AUC score on the test set using calibrated predicted probabilities \`predict_proba()[:, 1]\`.
4. Apply a classification threshold of 0.55 (\`probs >= 0.55\`) to determine predictions and count correctly identified test samples.

SECURITY AUDIT: Exactly 3 implementation bugs exist in the provided subroutine. Detect and eliminate all 3 defects to output the correct verification sequence:
\`DISARM_SEQ: SK-LOGREG-AUC-<AUC:.2f}-ACC-<CORRECT_COUNT>\``,
    buggyCode: `import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import roc_auc_score

def evaluate_intrusion_classifier(X_train, y_train, X_test, y_test) -> str:
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    
    # BUG 1: Data leakage - refitting the scaler on test data
    X_test_scaled = scaler.fit_transform(X_test)

    clf = LogisticRegression(C=1.0, solver="liblinear", random_state=42)
    clf.fit(X_train_scaled, y_train)

    probs = clf.predict_proba(X_test_scaled)[:, 1]
    
    # BUG 2: Passing discrete binary class labels to roc_auc_score instead of probabilities
    auc = roc_auc_score(y_test, clf.predict(X_test_scaled))
    
    threshold = 0.55
    # BUG 3: Inverted threshold condition (< instead of >=)
    preds = (probs < threshold).astype(int)
    correct_count = int(np.sum(preds == y_test))

    return f"DISARM_SEQ: SK-LOGREG-AUC-{auc:.2f}-ACC-{correct_count}"

if __name__ == "__main__":
    X_train = np.array([
        [1.2, 0.5, 12.0], [0.8, 0.4, 10.5], [1.5, 0.9, 14.2], [0.5, 0.2, 8.0],
        [3.2, 2.1, 25.0], [2.8, 1.8, 22.4], [3.5, 2.5, 28.1], [2.9, 2.0, 24.0]
    ])
    y_train = np.array([0, 0, 0, 0, 1, 1, 1, 1])

    X_test = np.array([
        [1.0, 0.6, 11.2], [3.1, 2.2, 26.0], [0.7, 0.3, 9.1], [3.0, 1.9, 23.5]
    ])
    y_test = np.array([0, 1, 0, 1])

    print(evaluate_intrusion_classifier(X_train, y_train, X_test, y_test))
`,
    correctCode: `import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import roc_auc_score

def evaluate_intrusion_classifier(X_train, y_train, X_test, y_test) -> str:
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    
    # FIX 1: Transform test set using the scaler fitted on training data
    X_test_scaled = scaler.transform(X_test)

    clf = LogisticRegression(C=1.0, solver="liblinear", random_state=42)
    clf.fit(X_train_scaled, y_train)

    probs = clf.predict_proba(X_test_scaled)[:, 1]
    
    # FIX 2: Pass continuous predicted probabilities to roc_auc_score
    auc = roc_auc_score(y_test, probs)
    
    threshold = 0.55
    # FIX 3: Predict positive when probability meets or exceeds threshold
    preds = (probs >= threshold).astype(int)
    correct_count = int(np.sum(preds == y_test))

    return f"DISARM_SEQ: SK-LOGREG-AUC-{auc:.2f}-ACC-{correct_count}"

if __name__ == "__main__":
    X_train = np.array([
        [1.2, 0.5, 12.0], [0.8, 0.4, 10.5], [1.5, 0.9, 14.2], [0.5, 0.2, 8.0],
        [3.2, 2.1, 25.0], [2.8, 1.8, 22.4], [3.5, 2.5, 28.1], [2.9, 2.0, 24.0]
    ])
    y_train = np.array([0, 0, 0, 0, 1, 1, 1, 1])

    X_test = np.array([
        [1.0, 0.6, 11.2], [3.1, 2.2, 26.0], [0.7, 0.3, 9.1], [3.0, 1.9, 23.5]
    ])
    y_test = np.array([0, 1, 0, 1])

    print(evaluate_intrusion_classifier(X_train, y_train, X_test, y_test))
`,
    expectedOutput: "DISARM_SEQ: SK-LOGREG-AUC-1.00-ACC-4",
  },
  {
    id: "alarm-04",
    stageNumber: 4,
    title: "Biometric Access Matrix SVD Low-Rank Compression",
    category: "NumPy Matrix Algebra",
    points: 10,
    timeBonusMax: 0,
    description: `High-dimensional biometric retinal scan feature matrices must be compressed using Singular Value Decomposition (SVD) for real-time vault authentication.

You must implement a Rank-2 truncated SVD approximation:
1. Decompose matrix A into U, S, and Vt using \`np.linalg.svd(A, full_matrices=False)\`.
2. Construct the rank-2 approximation: \`A_approx = (U[:, :2] * S[:2]) @ Vt[:2, :]\`.
3. Compute the Frobenius norm of the residual error: \`||A - A_approx||_F\`.
4. Calculate the percentage of retained spectral energy: \`100 * sum(S[:2]^2) / sum(S^2)\`.

SECURITY AUDIT: Exactly 3 implementation bugs exist in the provided subroutine. Detect and eliminate all 3 defects to output the correct verification sequence:
\`DISARM_SEQ: NP-SVD-RANK2-ERR-<FRO_NORM:.3f}-ENG-<ENERGY:.1f}\``,
    buggyCode: `import numpy as np

def compress_biometric_matrix(A: np.ndarray, k: int = 2) -> str:
    U, S, Vt = np.linalg.svd(A, full_matrices=False)
    
    # BUG 1: Using element-wise multiplication (*) instead of matrix product (@) for Vt
    A_approx = (U[:, :k] * S[:k]) * Vt[:k, :]

    # BUG 2: Subtracting reconstructed matrix from itself instead of original matrix A
    diff = A_approx - A_approx
    fro_norm = np.linalg.norm(diff, ord="fro")
    
    # BUG 3: Retained energy formula uses unsquared singular values instead of variances (S^2)
    retained_energy = (np.sum(S[:k]) / np.sum(S)) * 100

    return f"DISARM_SEQ: NP-SVD-RANK{k}-ERR-{fro_norm:.3f}-ENG-{retained_energy:.1f}"

if __name__ == "__main__":
    A = np.array([
        [12.5, 8.2, 4.1, 1.0],
        [9.1, 15.3, 7.2, 3.4],
        [4.0, 6.8, 18.1, 9.5],
        [2.2, 3.1, 11.0, 14.8],
        [8.4, 11.2, 10.5, 6.3]
    ])
    print(compress_biometric_matrix(A, 2))
`,
    correctCode: `import numpy as np

def compress_biometric_matrix(A: np.ndarray, k: int = 2) -> str:
    U, S, Vt = np.linalg.svd(A, full_matrices=False)
    
    # FIX 1: Use matrix multiplication (@) with Vt[:k, :]
    A_approx = (U[:, :k] * S[:k]) @ Vt[:k, :]

    # FIX 2: Calculate residual difference from original matrix A
    diff = A - A_approx
    fro_norm = np.linalg.norm(diff, ord="fro")
    
    # FIX 3: Retained spectral energy uses squared singular values (S^2)
    retained_energy = (np.sum(S[:k] ** 2) / np.sum(S ** 2)) * 100

    return f"DISARM_SEQ: NP-SVD-RANK{k}-ERR-{fro_norm:.3f}-ENG-{retained_energy:.1f}"

if __name__ == "__main__":
    A = np.array([
        [12.5, 8.2, 4.1, 1.0],
        [9.1, 15.3, 7.2, 3.4],
        [4.0, 6.8, 18.1, 9.5],
        [2.2, 3.1, 11.0, 14.8],
        [8.4, 11.2, 10.5, 6.3]
    ])
    print(compress_biometric_matrix(A, 2))
`,
    expectedOutput: "DISARM_SEQ: NP-SVD-RANK2-ERR-7.595-ENG-96.8",
  },
  {
    id: "alarm-05",
    stageNumber: 5,
    title: "Vault Sensor Resampling & Exponential Moving Average",
    category: "Pandas Time Series Interpolation",
    points: 10,
    timeBonusMax: 0,
    description: `Vault thermal sensors stream irregular timestamped telemetry with periodic transmission voids. To monitor laser corridor stabilization, data must be interpolated, downsampled to uniform 15-minute intervals, and smoothed.

You must build a Pandas time-series pipeline:
1. Interpolate missing values in temperature using time-weighted interpolation (\`method="time"\`).
2. Resample the series into 15-minute fixed bins, calculating the mean of each bin.
3. Compute the Exponential Weighted Moving Average (EWMA) with smoothing factor \`alpha=0.4\` and \`adjust=False\`.
4. Output the final smoothed temperature reading and the maximum smoothed reading.

SECURITY AUDIT: Exactly 3 implementation bugs exist in the provided subroutine. Detect and eliminate all 3 defects to output the correct verification sequence:
\`DISARM_SEQ: PD-EWMA-LAST-<LAST:.2f}-MAX-<MAX:.2f}\``,
    buggyCode: `import numpy as np
import pandas as pd

def process_thermal_telemetry(df: pd.DataFrame) -> str:
    # BUG 1: Using linear interpolation instead of time-based interpolation for irregular timestamps
    df["interp"] = df["temperature"].interpolate(method="linear")

    # BUG 2: Resampling with sum() instead of mean()
    resampled = df[["interp"]].resample("15min").sum()

    # BUG 3: Using adjust=True which skews recursive exponential smoothing
    resampled["ewma"] = resampled["interp"].ewm(alpha=0.4, adjust=True).mean()

    final_ewma = float(resampled["ewma"].iloc[-1])
    max_ewma = float(resampled["ewma"].max())

    return f"DISARM_SEQ: PD-EWMA-LAST-{final_ewma:.2f}-MAX-{max_ewma:.2f}"

if __name__ == "__main__":
    ts = pd.date_range("2026-03-01 00:00", periods=12, freq="7min")
    vals = [22.1, np.nan, 23.5, 24.0, np.nan, np.nan, 28.2, 29.0, 30.1, np.nan, 32.5, 33.0]
    df = pd.DataFrame({"temperature": vals}, index=ts)
    print(process_thermal_telemetry(df))
`,
    correctCode: `import numpy as np
import pandas as pd

def process_thermal_telemetry(df: pd.DataFrame) -> str:
    # FIX 1: Use time-weighted interpolation for irregular time indexes
    df["interp"] = df["temperature"].interpolate(method="time")

    # FIX 2: Aggregate resampled 15-minute bins using mean()
    resampled = df[["interp"]].resample("15min").mean()

    # FIX 3: Use adjust=False for recursive exponential smoothing
    resampled["ewma"] = resampled["interp"].ewm(alpha=0.4, adjust=False).mean()

    final_ewma = float(resampled["ewma"].iloc[-1])
    max_ewma = float(resampled["ewma"].max())

    return f"DISARM_SEQ: PD-EWMA-LAST-{final_ewma:.2f}-MAX-{max_ewma:.2f}"

if __name__ == "__main__":
    ts = pd.date_range("2026-03-01 00:00", periods=12, freq="7min")
    vals = [22.1, np.nan, 23.5, 24.0, np.nan, np.nan, 28.2, 29.0, 30.1, np.nan, 32.5, 33.0]
    df = pd.DataFrame({"temperature": vals}, index=ts)
    print(process_thermal_telemetry(df))
`,
    expectedOutput: "DISARM_SEQ: PD-EWMA-LAST-30.54-MAX-30.54",
  },
  {
    id: "alarm-06",
    stageNumber: 6,
    title: "Security Token Sublinear TF-IDF Cosine Similarity",
    category: "Scikit-Learn NLP Feature Extraction",
    points: 10,
    timeBonusMax: 0,
    description: `Incoming alarm override tokens are compared against known incident security logs to classify incident severity using Natural Language Processing.

You must build an NLP similarity matcher using Scikit-Learn:
1. Initialize \`TfidfVectorizer(ngram_range=(1, 2), stop_words="english", sublinear_tf=True)\` to extract unigrams and bigrams with sublinear frequency scaling.
2. Fit the vectorizer on the combined documents and query (or transform query using the fitted document vectorizer).
3. Compute cosine similarities between the query vector and all document vectors.
4. Identify the index of the highest similarity document and report its similarity score.

SECURITY AUDIT: Exactly 3 implementation bugs exist in the provided subroutine. Detect and eliminate all 3 defects to output the correct verification sequence:
\`DISARM_SEQ: SK-TFIDF-MATCH-DOC<INDEX>-SIM-<SIMILARITY:.3f}\``,
    buggyCode: `import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def find_most_similar_incident(documents: list, query: str) -> str:
    # BUG 1: ngram_range=(2, 2) excludes critical unigram security keywords
    vectorizer = TfidfVectorizer(ngram_range=(2, 2), stop_words="english", sublinear_tf=True)
    doc_vectors = vectorizer.fit_transform(documents)

    # BUG 2: Separate vectorizer instance for query creates mismatched vocabulary dimensions
    query_vector = TfidfVectorizer().fit_transform([query])
    
    # Matching requires identical vocabulary representation
    similarities = cosine_similarity(query_vector, doc_vectors)[0]
    
    # BUG 3: argmin finds the lowest similarity match instead of highest match
    best_idx = int(np.argmin(similarities))
    best_sim = float(similarities[best_idx])

    return f"DISARM_SEQ: SK-TFIDF-MATCH-DOC{best_idx}-SIM-{best_sim:.3f}"

if __name__ == "__main__":
    documents = [
        "perimeter breach alert sector 4 motion detected",
        "routine vault diagnostic system operational normal status",
        "unauthorized biometric scan override attempt in sub-vault",
        "emergency power backup generator online circuit active",
        "sector 4 perimeter alarm armed with biometric verification",
    ]
    query = "biometric security breach in sector 4"
    print(find_most_similar_incident(documents, query))
`,
    correctCode: `import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def find_most_similar_incident(documents: list, query: str) -> str:
    # FIX 1: Include unigrams and bigrams (1, 2)
    vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words="english", sublinear_tf=True)
    all_texts = documents + [query]
    tfidf_matrix = vectorizer.fit_transform(all_texts)

    # FIX 2: Extract query and document vectors from the shared vocabulary matrix
    doc_vectors = tfidf_matrix[:-1]
    query_vector = tfidf_matrix[-1:]
    
    similarities = cosine_similarity(query_vector, doc_vectors)[0]
    
    # FIX 3: argmax selects the highest similarity document
    best_idx = int(np.argmax(similarities))
    best_sim = float(similarities[best_idx])

    return f"DISARM_SEQ: SK-TFIDF-MATCH-DOC{best_idx}-SIM-{best_sim:.3f}"

if __name__ == "__main__":
    documents = [
        "perimeter breach alert sector 4 motion detected",
        "routine vault diagnostic system operational normal status",
        "unauthorized biometric scan override attempt in sub-vault",
        "emergency power backup generator online circuit active",
        "sector 4 perimeter alarm armed with biometric verification",
    ]
    query = "biometric security breach in sector 4"
    print(find_most_similar_incident(documents, query))
`,
    expectedOutput: "DISARM_SEQ: SK-TFIDF-MATCH-DOC0-SIM-0.155",
  },
  {
    id: "alarm-07",
    stageNumber: 7,
    title: "Surveillance Drone K-Means Clustering & Silhouette Validation",
    category: "Scikit-Learn Unsupervised Clustering",
    points: 10,
    timeBonusMax: 0,
    description: `Patrol drones monitoring the central reserve transmit geographic coordinate vectors. To neutralize tracking antennas, clusters must be partitioned into 3 distinct operational patrol sectors and validated with Silhouette scoring.

You must configure the clustering engine:
1. Initialize \`KMeans(n_clusters=3, random_state=42, n_init=10)\`.
2. Fit the model and compute cluster labels on coordinate matrix X.
3. Compute the overall Silhouette coefficient of the clustering: \`silhouette_score(X, labels)\`.
4. Extract the final model inertia (within-cluster sum of squares).

SECURITY AUDIT: Exactly 3 implementation bugs exist in the provided subroutine. Detect and eliminate all 3 defects to output the correct verification sequence:
\`DISARM_SEQ: SK-KMEANS-SIL-<SCORE:.3f}-INERTIA-<INERTIA:.1f}\``,
    buggyCode: `import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score

def optimize_drone_sectors(X: np.ndarray) -> str:
    # BUG 1: Configured for 2 clusters instead of the required 3 sectors
    kmeans = KMeans(n_clusters=2, random_state=42, n_init=10)
    
    # BUG 2: Reading labels_ attribute without fitting model (throws AttributeError)
    labels = kmeans.labels_

    # BUG 3: Transposed coordinates matrix passed to silhouette_score
    score = silhouette_score(X.T, labels)
    inertia = float(kmeans.inertia_)

    return f"DISARM_SEQ: SK-KMEANS-SIL-{score:.3f}-INERTIA-{inertia:.1f}"

if __name__ == "__main__":
    c1 = np.array([[10, 12], [11, 13], [9, 11], [10.5, 12.5]], dtype=float)
    c2 = np.array([[50, 52], [51, 50], [49, 53], [50.5, 51.5]], dtype=float)
    c3 = np.array([[90, 88], [91, 89], [89, 87], [90.2, 88.5]], dtype=float)
    X = np.vstack([c1, c2, c3])
    print(optimize_drone_sectors(X))
`,
    correctCode: `import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score

def optimize_drone_sectors(X: np.ndarray) -> str:
    # FIX 1: Specify n_clusters=3
    kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
    
    # FIX 2: Fit model and generate cluster assignment labels
    labels = kmeans.fit_predict(X)

    # FIX 3: Pass untransposed coordinate samples matrix X
    score = silhouette_score(X, labels)
    inertia = float(kmeans.inertia_)

    return f"DISARM_SEQ: SK-KMEANS-SIL-{score:.3f}-INERTIA-{inertia:.1f}"

if __name__ == "__main__":
    c1 = np.array([[10, 12], [11, 13], [9, 11], [10.5, 12.5]], dtype=float)
    c2 = np.array([[50, 52], [51, 50], [49, 53], [50.5, 51.5]], dtype=float)
    c3 = np.array([[90, 88], [91, 89], [89, 87], [90.2, 88.5]], dtype=float)
    X = np.vstack([c1, c2, c3])
    print(optimize_drone_sectors(X))
`,
    expectedOutput: "DISARM_SEQ: SK-KMEANS-SIL-0.970-INERTIA-15.5",
  },
  {
    id: "alarm-08",
    stageNumber: 8,
    title: "Datacenter Firewall MultiIndex Pivoting & Threat Score",
    category: "Pandas Hierarchical Pivoting",
    points: 10,
    timeBonusMax: 0,
    description: `Distributed firewall nodes record multi-severity intrusion events across infrastructure tiers. To pinpoint the most compromised datacenter, data must be aggregated via a MultiIndex pivot table and weighted threat scoring.

You must build a Pandas aggregation pipeline:
1. Construct a pivot table with \`index=['datacenter', 'tier']\`, \`columns='severity'\`, \`values='events'\`, and \`aggfunc='sum'\` (filling missing cells with 0).
2. Sum event counts per datacenter by grouping at index level 0 (\`level=0\`).
3. Compute the composite threat weight: \`CRITICAL * 3.0 + HIGH * 1.5\`.
4. Identify the datacenter with the maximum threat weight and report its score.

SECURITY AUDIT: Exactly 3 implementation bugs exist in the provided subroutine. Detect and eliminate all 3 defects to output the correct verification sequence:
\`DISARM_SEQ: PD-PIVOT-TOP-<DATACENTER>-SCORE-<WEIGHT:.1f}\``,
    buggyCode: `import pandas as pd

def compute_datacenter_threats(df: pd.DataFrame) -> str:
    # BUG 1: Default aggfunc="mean" instead of "sum" alters total incident counts
    pivot = pd.pivot_table(
        df,
        values="events",
        index=["datacenter", "tier"],
        columns="severity",
        fill_value=0,
    )

    # BUG 2: Grouping by level=1 (tier) instead of level=0 (datacenter)
    dc_summary = pivot.groupby(level=1).sum()
    crit = dc_summary["CRITICAL"] if "CRITICAL" in dc_summary else 0
    high = dc_summary["HIGH"] if "HIGH" in dc_summary else 0
    
    # BUG 3: Inverted multiplier coefficients (1.5 for CRITICAL and 3.0 for HIGH)
    dc_summary["threat_weight"] = crit * 1.5 + high * 3.0
    top_dc = str(dc_summary["threat_weight"].idxmax())
    max_weight = float(dc_summary["threat_weight"].max())

    return f"DISARM_SEQ: PD-PIVOT-TOP-{top_dc}-SCORE-{max_weight:.1f}"

if __name__ == "__main__":
    raw_events = [
        {"datacenter": "DC-NORTH", "tier": "DB", "severity": "HIGH", "events": 14},
        {"datacenter": "DC-NORTH", "tier": "APP", "severity": "LOW", "events": 45},
        {"datacenter": "DC-NORTH", "tier": "DB", "severity": "CRITICAL", "events": 8},
        {"datacenter": "DC-SOUTH", "tier": "APP", "severity": "HIGH", "events": 22},
        {"datacenter": "DC-SOUTH", "tier": "DB", "severity": "HIGH", "events": 19},
        {"datacenter": "DC-SOUTH", "tier": "APP", "severity": "CRITICAL", "events": 5},
        {"datacenter": "DC-EAST", "tier": "DB", "severity": "HIGH", "events": 31},
        {"datacenter": "DC-EAST", "tier": "APP", "severity": "HIGH", "events": 18},
    ]
    df = pd.DataFrame(raw_events)
    print(compute_datacenter_threats(df))
`,
    correctCode: `import pandas as pd

def compute_datacenter_threats(df: pd.DataFrame) -> str:
    # FIX 1: Explicitly specify aggfunc="sum"
    pivot = pd.pivot_table(
        df,
        values="events",
        index=["datacenter", "tier"],
        columns="severity",
        aggfunc="sum",
        fill_value=0,
    )

    # FIX 2: Group by level=0 to aggregate across datacenters
    dc_summary = pivot.groupby(level=0).sum()
    crit = dc_summary["CRITICAL"] if "CRITICAL" in dc_summary else 0
    high = dc_summary["HIGH"] if "HIGH" in dc_summary else 0
    
    # FIX 3: Weight CRITICAL * 3.0 and HIGH * 1.5
    dc_summary["threat_weight"] = crit * 3.0 + high * 1.5
    top_dc = str(dc_summary["threat_weight"].idxmax())
    max_weight = float(dc_summary["threat_weight"].max())

    return f"DISARM_SEQ: PD-PIVOT-TOP-{top_dc}-SCORE-{max_weight:.1f}"

if __name__ == "__main__":
    raw_events = [
        {"datacenter": "DC-NORTH", "tier": "DB", "severity": "HIGH", "events": 14},
        {"datacenter": "DC-NORTH", "tier": "APP", "severity": "LOW", "events": 45},
        {"datacenter": "DC-NORTH", "tier": "DB", "severity": "CRITICAL", "events": 8},
        {"datacenter": "DC-SOUTH", "tier": "APP", "severity": "HIGH", "events": 22},
        {"datacenter": "DC-SOUTH", "tier": "DB", "severity": "HIGH", "events": 19},
        {"datacenter": "DC-SOUTH", "tier": "APP", "severity": "CRITICAL", "events": 5},
        {"datacenter": "DC-EAST", "tier": "DB", "severity": "HIGH", "events": 31},
        {"datacenter": "DC-EAST", "tier": "APP", "severity": "HIGH", "events": 18},
    ]
    df = pd.DataFrame(raw_events)
    print(compute_datacenter_threats(df))
`,
    expectedOutput: "DISARM_SEQ: PD-PIVOT-TOP-DC-SOUTH-SCORE-76.5",
  },
  {
    id: "alarm-09",
    stageNumber: 9,
    title: "Sensor Neural Weight Ridge Gradient Descent Optimizer",
    category: "NumPy Vectorized Optimization",
    points: 10,
    timeBonusMax: 0,
    description: `A hardware sensor calibrator fits linear regression weights using vectorized batch gradient descent with L2 Ridge Regularization.

You must optimize the regression model over 100 epochs:
1. Matrix-vector prediction: \`preds = X @ w\`.
2. Compute residual error: \`error = preds - y\`.
3. Compute vectorized Ridge gradient: \`grad = (1 / m) * (X.T @ error) + (lambda_reg / m) * w\`.
4. Perform gradient descent step: \`w -= lr * grad\` (\`lr=0.05\`, \`lambda_reg=0.1\`).
5. Compute total regularized loss: \`loss = (1 / (2*m)) * ||X@w - y||^2 + (lambda_reg / (2*m)) * ||w||^2\` and L2 norm of weights \`||w||\`.

SECURITY AUDIT: Exactly 3 implementation bugs exist in the provided subroutine. Detect and eliminate all 3 defects to output the correct verification sequence:
\`DISARM_SEQ: NP-RIDGE-LOSS-<LOSS:.3f}-WNORM-<NORM:.2f}\``,
    buggyCode: `import numpy as np

def train_ridge_regression(X: np.ndarray, y: np.ndarray, epochs: int = 100) -> str:
    w = np.zeros(X.shape[1])
    lr = 0.05
    lambda_reg = 0.1
    m = len(y)

    for _ in range(epochs):
        preds = X @ w
        error = preds - y
        
        # BUG 1: Missing transpose on X causes matrix dimension incompatibility
        # BUG 2: Omitting the Ridge L2 weight penalty in the gradient calculation
        grad = (1 / m) * (X @ error)
        
        # BUG 3: Gradient ascent step (+ instead of -) causes divergence
        w += lr * grad

    final_loss = (1 / (2 * m)) * np.sum((X @ w - y) ** 2) + (lambda_reg / (2 * m)) * np.sum(w ** 2)
    w_norm = float(np.linalg.norm(w))

    return f"DISARM_SEQ: NP-RIDGE-LOSS-{final_loss:.3f}-WNORM-{w_norm:.2f}"

if __name__ == "__main__":
    X = np.array([
        [1.0, 2.0, 1.5], [2.0, 1.0, 2.5], [1.5, 3.0, 1.0], [3.0, 2.5, 3.0],
        [2.5, 1.5, 2.0], [3.5, 3.0, 2.5], [1.0, 1.5, 3.0], [2.0, 3.5, 1.5]
    ])
    y = np.array([5.5, 7.0, 6.8, 11.2, 8.0, 11.5, 6.2, 9.8])
    print(train_ridge_regression(X, y))
`,
    correctCode: `import numpy as np

def train_ridge_regression(X: np.ndarray, y: np.ndarray, epochs: int = 100) -> str:
    w = np.zeros(X.shape[1])
    lr = 0.05
    lambda_reg = 0.1
    m = len(y)

    for _ in range(epochs):
        preds = X @ w
        error = preds - y
        
        # FIX 1 & 2: Correct matrix multiplication (X.T @ error) and include Ridge penalty
        grad = (1 / m) * (X.T @ error) + (lambda_reg / m) * w
        
        # FIX 3: Gradient descent step subtracts gradient
        w -= lr * grad

    final_loss = (1 / (2 * m)) * np.sum((X @ w - y) ** 2) + (lambda_reg / (2 * m)) * np.sum(w ** 2)
    w_norm = float(np.linalg.norm(w))

    return f"DISARM_SEQ: NP-RIDGE-LOSS-{final_loss:.3f}-WNORM-{w_norm:.2f}"

if __name__ == "__main__":
    X = np.array([
        [1.0, 2.0, 1.5], [2.0, 1.0, 2.5], [1.5, 3.0, 1.0], [3.0, 2.5, 3.0],
        [2.5, 1.5, 2.0], [3.5, 3.0, 2.5], [1.0, 1.5, 3.0], [2.0, 3.5, 1.5]
    ])
    y = np.array([5.5, 7.0, 6.8, 11.2, 8.0, 11.5, 6.2, 9.8])
    print(train_ridge_regression(X, y))
`,
    expectedOutput: "DISARM_SEQ: NP-RIDGE-LOSS-0.090-WNORM-2.26",
  },
  {
    id: "alarm-10",
    stageNumber: 10,
    title: "Threat Level Confusion Matrix & Macro-F1 Metric",
    category: "Scikit-Learn Evaluation Metrics",
    points: 10,
    timeBonusMax: 0,
    description: `A 3-class alarm classifier categorizes intrusion telemetry into [0: Low, 1: Medium, 2: High]. Because the distribution across classes is imbalanced, evaluation requires computing Macro-averaged F1 and per-class precision metrics.

You must evaluate classifier predictions:
1. Generate the 3x3 confusion matrix: \`confusion_matrix(y_true, y_pred, labels=[0, 1, 2])\`.
2. Compute the Macro-averaged F1 score: \`f1_score(y_true, y_pred, average="macro")\`.
3. Compute class 0 precision from the confusion matrix: \`TP / (TP + FP)\`, where False Positives for class 0 are the sum of column 0 minus TP.

SECURITY AUDIT: Exactly 3 implementation bugs exist in the provided subroutine. Detect and eliminate all 3 defects to output the correct verification sequence:
\`DISARM_SEQ: SK-METRICS-MACROF1-<F1:.3f}-PREC0-<PREC:.2f}\``,
    buggyCode: `import numpy as np
from sklearn.metrics import confusion_matrix, f1_score

def evaluate_alarm_predictions(y_true: np.ndarray, y_pred: np.ndarray) -> str:
    cm = confusion_matrix(y_true, y_pred, labels=[0, 1, 2])
    
    # BUG 1: average="micro" used instead of average="macro"
    f1_val = f1_score(y_true, y_pred, average="micro")

    tp_0 = cm[0, 0]
    # BUG 2: Summing row 0 instead of column 0 gives False Negatives rather than False Positives
    fp_0 = np.sum(cm[0, :]) - tp_0
    
    # BUG 3: Dividing tp_0 by fp_0 instead of (tp_0 + fp_0)
    prec_0 = float(tp_0 / fp_0) if fp_0 > 0 else 0.0

    return f"DISARM_SEQ: SK-METRICS-MACROF1-{f1_val:.3f}-PREC0-{prec_0:.2f}"

if __name__ == "__main__":
    y_true = np.array([0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 2, 1])
    y_pred = np.array([0, 1, 1, 0, 2, 2, 0, 1, 2, 1, 2, 1])
    print(evaluate_alarm_predictions(y_true, y_pred))
`,
    correctCode: `import numpy as np
from sklearn.metrics import confusion_matrix, f1_score

def evaluate_alarm_predictions(y_true: np.ndarray, y_pred: np.ndarray) -> str:
    cm = confusion_matrix(y_true, y_pred, labels=[0, 1, 2])
    
    # FIX 1: Compute unweighted macro-averaged F1 score
    f1_val = f1_score(y_true, y_pred, average="macro")

    tp_0 = cm[0, 0]
    # FIX 2: Sum column 0 minus TP to get False Positives for class 0
    fp_0 = np.sum(cm[:, 0]) - tp_0
    
    # FIX 3: Precision denominator is TP + FP
    prec_0 = float(tp_0 / (tp_0 + fp_0)) if (tp_0 + fp_0) > 0 else 0.0

    return f"DISARM_SEQ: SK-METRICS-MACROF1-{f1_val:.3f}-PREC0-{prec_0:.2f}"

if __name__ == "__main__":
    y_true = np.array([0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 2, 1])
    y_pred = np.array([0, 1, 1, 0, 2, 2, 0, 1, 2, 1, 2, 1])
    print(evaluate_alarm_predictions(y_true, y_pred))
`,
    expectedOutput: "DISARM_SEQ: SK-METRICS-MACROF1-0.758-PREC0-1.00",
  },
];

/**
 * Returns a single randomized challenge without revealing expected output or solution.
 */
export function getRandomClientChallenge(excludeId?: string): ChallengeClient {
  const pool = excludeId ? CHALLENGES.filter((c) => c.id !== excludeId) : CHALLENGES;
  const targetPool = pool.length > 0 ? pool : CHALLENGES;
  const randomIndex = Math.floor(Math.random() * targetPool.length);
  const challenge = targetPool[randomIndex];
  return {
    id: challenge.id,
    stageNumber: challenge.stageNumber,
    title: challenge.title,
    category: challenge.category,
    points: challenge.points,
    timeBonusMax: challenge.timeBonusMax,
    description: challenge.description,
    buggyCode: challenge.buggyCode,
  };
}

/**
 * Returns a specific sanitized challenge by ID if requested.
 */
export function getClientChallengeById(id: string): ChallengeClient | undefined {
  const found = CHALLENGES.find((c) => c.id === id);
  if (!found) return undefined;
  return {
    id: found.id,
    stageNumber: found.stageNumber,
    title: found.title,
    category: found.category,
    points: found.points,
    timeBonusMax: found.timeBonusMax,
    description: found.description,
    buggyCode: found.buggyCode,
  };
}

/**
 * Retrieves a single full challenge for server-side evaluation ONLY.
 */
export function getChallengeById(id: string): ChallengeServer | undefined {
  return CHALLENGES.find((c) => c.id === id);
}
