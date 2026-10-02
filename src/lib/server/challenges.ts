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
    description: `The vault multi-channel sensor array emits irregular telemetry vectors corrupted by transmission dropouts (NaNs) and severe spike anomalies.

The subroutine is designed to clean the data and compute modified Z-scores based on Median Absolute Deviation (MAD) to identify extreme outliers:
- Impute missing telemetry values per column using column medians.
- Compute the modified Z-score using Boris Iglewicz & David Hoaglin's formula: modified_z = 0.6745 * (x - median) / MAD.
- Count the number of outlier values (|modified_z| > 3.5) and report the maximum absolute score across all sensors.

SECURITY AUDIT: Exactly 3 implementation bugs corrupt the subroutine. Diagnose and eliminate all 3 defects to output the verified sequence:
\`DISARM_SEQ: NP-ROBUST-Z-<COUNT:02d>-<MAX_SCORE:.2f}\``,
    buggyCode: `import numpy as np

def compute_robust_z_scores(raw_data: np.ndarray) -> str:
    col_medians = np.nanmedian(raw_data, axis=1)
    inds = np.where(np.isnan(raw_data))
    cleaned = raw_data.copy()
    cleaned[inds] = 0.0

    medians = np.median(cleaned, axis=0)
    deviations = np.abs(cleaned - medians)
    mad = np.mean(deviations, axis=0)
    mad = np.where(mad == 0, 1e-6, mad)

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
    col_medians = np.nanmedian(raw_data, axis=0)
    inds = np.where(np.isnan(raw_data))
    cleaned = raw_data.copy()
    cleaned[inds] = np.take(col_medians, inds[1])

    medians = np.median(cleaned, axis=0)
    deviations = np.abs(cleaned - medians)
    mad = np.median(deviations, axis=0)
    mad = np.where(mad == 0, 1e-6, mad)

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
    description: `Multi-currency high-frequency transaction streams must be monitored to detect suspicious routing spikes.

The subroutine calculates a 3-period Volume Weighted Average Price (VWAP) per currency symbol:
- Evaluate trades chronologically per symbol.
- Compute rolling VWAP over a 3-period window (min_periods=1).
- Detect trades where the transaction price deviates significantly from the rolling VWAP (> 1.0% absolute deviation).
- Sum the total volume of all flagged trades and report the maximum percentage deviation observed.

SECURITY AUDIT: Exactly 3 implementation bugs corrupt the subroutine. Diagnose and eliminate all 3 defects to output the verified sequence:
\`DISARM_SEQ: PD-VWAP-<FLAGGED_VOL>-<MAX_DEV:.2f}\``,
    buggyCode: `import numpy as np
import pandas as pd

def audit_rolling_vwap(df: pd.DataFrame) -> str:
    df.sort_values(by=["symbol", "timestamp"])
    df["pv"] = df["price"] * df["volume"]

    df["rolling_pv"] = df.groupby("symbol")["pv"].transform(lambda s: s.rolling(3, min_periods=1).sum())
    df["rolling_vol"] = df.groupby("symbol")["volume"].transform(lambda s: s.rolling(3, min_periods=1).sum())
    
    df["vwap"] = df["rolling_pv"] / df["volume"]
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
    df = df.sort_values(by=["symbol", "timestamp"]).reset_index(drop=True)
    df["pv"] = df["price"] * df["volume"]

    df["rolling_pv"] = df.groupby("symbol")["pv"].transform(lambda s: s.rolling(3, min_periods=1).sum())
    df["rolling_vol"] = df.groupby("symbol")["volume"].transform(lambda s: s.rolling(3, min_periods=1).sum())
    
    df["vwap"] = df["rolling_pv"] / df["rolling_vol"]
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
    description: `Network packet telemetry is evaluated using a Logistic Regression classifier to differentiate normal traffic from intrusion attempts.

The subroutine trains and evaluates the classifier:
- Standardize features across train and test sets.
- Train the logistic regression model on labeled packet data.
- Compute the ROC-AUC performance metric on the test partition.
- Apply a calibrated decision threshold of 0.55 to classify test packets and count the number of correct predictions.

SECURITY AUDIT: Exactly 3 implementation bugs corrupt the subroutine. Diagnose and eliminate all 3 defects to output the verified sequence:
\`DISARM_SEQ: SK-LOGREG-AUC-<AUC:.2f>-ACC-<CORRECT_COUNT>\``,
    buggyCode: `import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import roc_auc_score

def evaluate_intrusion_classifier(X_train, y_train, X_test, y_test) -> str:
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.fit_transform(X_test)

    clf = LogisticRegression(C=1.0, solver="liblinear", random_state=42)
    clf.fit(X_train_scaled, y_train)

    probs = clf.predict_proba(X_test_scaled)[:, 1]
    auc = roc_auc_score(y_test, clf.predict(X_test_scaled))
    
    threshold = 0.55
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
    X_test_scaled = scaler.transform(X_test)

    clf = LogisticRegression(C=1.0, solver="liblinear", random_state=42)
    clf.fit(X_train_scaled, y_train)

    probs = clf.predict_proba(X_test_scaled)[:, 1]
    auc = roc_auc_score(y_test, probs)
    
    threshold = 0.55
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
    description: `Biometric scanner feature matrices must be compressed using Singular Value Decomposition (SVD) for rapid signature verification.

The subroutine applies low-rank approximation:
- Compute the SVD decomposition of the input feature matrix.
- Reconstruct a rank-2 approximation of the matrix.
- Measure the Frobenius norm of the residual reconstruction error.
- Calculate the percentage of total spectral energy retained in the rank-2 subspace.

SECURITY AUDIT: Exactly 3 implementation bugs corrupt the subroutine. Diagnose and eliminate all 3 defects to output the verified sequence:
\`DISARM_SEQ: NP-SVD-RANK2-ERR-<FRO_NORM:.3f}-ENG-<ENERGY:.1f}\``,
    buggyCode: `import numpy as np

def compress_biometric_matrix(A: np.ndarray, k: int = 2) -> str:
    U, S, Vt = np.linalg.svd(A, full_matrices=False)
    A_approx = (U[:, :k] * S[:k]) * Vt[:k, :]

    diff = A_approx - A_approx
    fro_norm = np.linalg.norm(diff, ord="fro")
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
    A_approx = (U[:, :k] * S[:k]) @ Vt[:k, :]

    diff = A - A_approx
    fro_norm = np.linalg.norm(diff, ord="fro")
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
    description: `Vault thermal sensors record temperature readings asynchronously with sporadic transmission gaps.

The subroutine processes the time series for laser corridor stabilization:
- Handle missing values across the irregular timestamp index.
- Downsample the telemetry into uniform 15-minute intervals.
- Apply Exponential Weighted Moving Average (EWMA) smoothing with alpha=0.4.
- Report the final smoothed temperature reading and the peak smoothed value.

SECURITY AUDIT: Exactly 3 implementation bugs corrupt the subroutine. Diagnose and eliminate all 3 defects to output the verified sequence:
\`DISARM_SEQ: PD-EWMA-LAST-<LAST:.2f}-MAX-<MAX:.2f}\``,
    buggyCode: `import numpy as np
import pandas as pd

def process_thermal_telemetry(df: pd.DataFrame) -> str:
    df["interp"] = df["temperature"].interpolate(method="linear")
    resampled = df[["interp"]].resample("15min").sum()
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
    df["interp"] = df["temperature"].interpolate(method="time")
    resampled = df[["interp"]].resample("15min").mean()
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
    description: `Incoming access tokens must be cross-referenced against security incident archives using Natural Language Processing.

The subroutine matches access tokens using TF-IDF representation:
- Extract sublinear TF-IDF feature vectors capturing unigram and bigram token sequences while ignoring standard English stop words.
- Compute cosine similarities between the probe query and all archived incident logs.
- Identify the index of the most semantically relevant incident and report its similarity coefficient.

SECURITY AUDIT: Exactly 3 implementation bugs corrupt the subroutine. Diagnose and eliminate all 3 defects to output the verified sequence:
\`DISARM_SEQ: SK-TFIDF-MATCH-DOC<INDEX>-SIM-<SIMILARITY:.3f}\``,
    buggyCode: `import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def find_most_similar_incident(documents: list, query: str) -> str:
    vectorizer = TfidfVectorizer(ngram_range=(2, 2), stop_words="english", sublinear_tf=True)
    doc_vectors = vectorizer.fit_transform(documents)

    query_vector = TfidfVectorizer().fit_transform([query])
    similarities = cosine_similarity(query_vector, doc_vectors)[0]
    
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
    vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words="english", sublinear_tf=True)
    all_texts = documents + [query]
    tfidf_matrix = vectorizer.fit_transform(all_texts)

    doc_vectors = tfidf_matrix[:-1]
    query_vector = tfidf_matrix[-1:]
    
    similarities = cosine_similarity(query_vector, doc_vectors)[0]
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
    description: `Drone patrol coordinates must be grouped into distinct operational sectors and validated for cluster cohesion.

The subroutine clusters patrol waypoints:
- Partition coordinate vectors into 3 spatial sectors using K-Means with random_state=42.
- Compute the Silhouette coefficient to evaluate cluster separation.
- Record the final clustering inertia.

SECURITY AUDIT: Exactly 3 implementation bugs corrupt the subroutine. Diagnose and eliminate all 3 defects to output the verified sequence:
\`DISARM_SEQ: SK-KMEANS-SIL-<SCORE:.3f}-INERTIA-<INERTIA:.1f}\``,
    buggyCode: `import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score

def optimize_drone_sectors(X: np.ndarray) -> str:
    kmeans = KMeans(n_clusters=2, random_state=42, n_init=10)
    labels = kmeans.labels_

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
    kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
    labels = kmeans.fit_predict(X)

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
    description: `Multi-datacenter firewall logs record irregular intrusion attempts across infrastructure tiers.

The subroutine aggregates incident logs into an operational threat matrix:
- Pivot event counts across datacenter and tier hierarchical levels.
- Aggregate total incidents per datacenter across all tiers.
- Calculate a composite threat score where CRITICAL events are weighted at 3.0 and HIGH events at 1.5.
- Identify the datacenter presenting the highest threat score.

SECURITY AUDIT: Exactly 3 implementation bugs corrupt the subroutine. Diagnose and eliminate all 3 defects to output the verified sequence:
\`DISARM_SEQ: PD-PIVOT-TOP-<DATACENTER>-SCORE-<WEIGHT:.1f}\``,
    buggyCode: `import pandas as pd

def compute_datacenter_threats(df: pd.DataFrame) -> str:
    pivot = pd.pivot_table(
        df,
        values="events",
        index=["datacenter", "tier"],
        columns="severity",
        fill_value=0,
    )

    dc_summary = pivot.groupby(level=1).sum()
    crit = dc_summary["CRITICAL"] if "CRITICAL" in dc_summary else 0
    high = dc_summary["HIGH"] if "HIGH" in dc_summary else 0
    
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
    pivot = pd.pivot_table(
        df,
        values="events",
        index=["datacenter", "tier"],
        columns="severity",
        aggfunc="sum",
        fill_value=0,
    )

    dc_summary = pivot.groupby(level=0).sum()
    crit = dc_summary["CRITICAL"] if "CRITICAL" in dc_summary else 0
    high = dc_summary["HIGH"] if "HIGH" in dc_summary else 0
    
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
    description: `A sensor calibration unit optimizes linear model parameters using batch gradient descent with Ridge (L2) regularization.

The subroutine performs parameter optimization:
- Train weights over 100 epochs using learning rate 0.05 and regularization parameter lambda=0.1.
- Update weights using the regularized analytical gradient.
- Calculate the final total regularized mean-squared loss and the L2 Euclidean norm of the weight vector.

SECURITY AUDIT: Exactly 3 implementation bugs corrupt the subroutine. Diagnose and eliminate all 3 defects to output the verified sequence:
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
        grad = (1 / m) * (X @ error)
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
        grad = (1 / m) * (X.T @ error) + (lambda_reg / m) * w
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
    description: `A multi-class security alert model categorizes incoming system events into 3 severity levels (0: Low, 1: Medium, 2: High).

The subroutine evaluates model classification performance on imbalanced telemetry:
- Generate the confusion matrix across all 3 classes.
- Calculate the unweighted macro-averaged F1 score.
- Compute the precision metric specifically for Class 0.

SECURITY AUDIT: Exactly 3 implementation bugs corrupt the subroutine. Diagnose and eliminate all 3 defects to output the verified sequence:
\`DISARM_SEQ: SK-METRICS-MACROF1-<F1:.3f}-PREC0-<PREC:.2f}\``,
    buggyCode: `import numpy as np
from sklearn.metrics import confusion_matrix, f1_score

def evaluate_alarm_predictions(y_true: np.ndarray, y_pred: np.ndarray) -> str:
    cm = confusion_matrix(y_true, y_pred, labels=[0, 1, 2])
    f1_val = f1_score(y_true, y_pred, average="micro")

    tp_0 = cm[0, 0]
    fp_0 = np.sum(cm[0, :]) - tp_0
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
    f1_val = f1_score(y_true, y_pred, average="macro")

    tp_0 = cm[0, 0]
    fp_0 = np.sum(cm[:, 0]) - tp_0
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
