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
    title: "Galois Field CRC-16 Frame Checksum",
    category: "Cyclic Redundancy Check",
    points: 150,
    timeBonusMax: 50,
    description: `The Royal Mint vault telemetry frames are protected by a bit-reflected CRC-16 checksum using the reverse polynomial 0xA001 and an initial register state of 0xFFFF.

For each byte in the incoming frame payload, the byte is XORed into the 16-bit register, and each of its 8 bits is processed sequentially: if the least significant bit (LSB) is set prior to right-shifting, the register is shifted right by 1 and XORed with the polynomial; otherwise it is shifted right by 1.

The script must evaluate the telemetry frame payload and output the verified hexadecimal checksum in the format:
\`DISARM_SEQ: CRC16-0x<HEX>\``,
    buggyCode: `def compute_frame_crc16(payload: bytes) -> str:
    crc = 0xFFFF
    polynomial = 0xA001

    for byte in payload:
        crc ^= byte
        for _ in range(8):
            crc >>= 1
            if crc & 1:
                crc ^= polynomial

    return f"DISARM_SEQ: CRC16-0x{crc:04X}"

if __name__ == "__main__":
    frame_payload = b"ROYAL_MINT_VAULT_TELEMETRY_PACKET_99"
    result = compute_frame_crc16(frame_payload)
    print(result)
`,
    correctCode: `def compute_frame_crc16(payload: bytes) -> str:
    crc = 0xFFFF
    polynomial = 0xA001

    for byte in payload:
        crc ^= byte
        for _ in range(8):
            lsb = crc & 1
            crc >>= 1
            if lsb:
                crc ^= polynomial

    return f"DISARM_SEQ: CRC16-0x{crc:04X}"

if __name__ == "__main__":
    frame_payload = b"ROYAL_MINT_VAULT_TELEMETRY_PACKET_99"
    result = compute_frame_crc16(frame_payload)
    print(result)
`,
    expectedOutput: "DISARM_SEQ: CRC16-0x6AE0",
  },
  {
    id: "alarm-02",
    stageNumber: 2,
    title: "Optical Laser Corridor Dijkstra Shortest Path",
    category: "Graph Theory / Priority Queues",
    points: 150,
    timeBonusMax: 50,
    description: `The subterranean vault corridor is mapped as a weighted directed graph of optical sensor relay nodes. Our disarm transmitter must route a pulse from entry node 0 to terminal node 4 along the path that expends the absolute minimum optical energy.

The script models the network using an adjacency list and calculates the shortest path distance from start node 0 to target node 4.

The output must report the minimum energy cost in the format:
\`DISARM_SEQ: OPTICAL-MIN-ENERGY-<COST>\``,
    buggyCode: `import heapq

def find_minimum_optical_path(graph, start_node, target_node) -> str:
    dist = {node: float("inf") for node in graph}
    dist[start_node] = 0

    pq = [(0, start_node)]

    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue

        for v, weight in graph[u]:
            if dist[u] + weight < dist[v]:
                dist[v] = dist[u] + weight
                heapq.heappush(pq, (v, dist[v]))

    min_energy = dist[target_node]
    return f"DISARM_SEQ: OPTICAL-MIN-ENERGY-{min_energy}"

if __name__ == "__main__":
    optical_grid = {
        0: [(1, 7), (2, 9), (3, 14)],
        1: [(0, 7), (2, 10), (3, 15)],
        2: [(0, 9), (1, 10), (3, 11), (5, 2)],
        3: [(0, 14), (1, 15), (2, 11), (4, 6)],
        4: [(3, 6), (5, 9)],
        5: [(2, 2), (4, 9)]
    }
    print(find_minimum_optical_path(optical_grid, 0, 4))
`,
    correctCode: `import heapq

def find_minimum_optical_path(graph, start_node, target_node) -> str:
    dist = {node: float("inf") for node in graph}
    dist[start_node] = 0

    pq = [(0, start_node)]

    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue

        for v, weight in graph[u]:
            if dist[u] + weight < dist[v]:
                dist[v] = dist[u] + weight
                heapq.heappush(pq, (dist[v], v))

    min_energy = dist[target_node]
    return f"DISARM_SEQ: OPTICAL-MIN-ENERGY-{min_energy}"

if __name__ == "__main__":
    optical_grid = {
        0: [(1, 7), (2, 9), (3, 14)],
        1: [(0, 7), (2, 10), (3, 15)],
        2: [(0, 9), (1, 10), (3, 11), (5, 2)],
        3: [(0, 14), (1, 15), (2, 11), (4, 6)],
        4: [(3, 6), (5, 9)],
        5: [(2, 2), (4, 9)]
    }
    print(find_minimum_optical_path(optical_grid, 0, 4))
`,
    expectedOutput: "DISARM_SEQ: OPTICAL-MIN-ENERGY-20",
  },
  {
    id: "alarm-03",
    stageNumber: 3,
    title: "Multi-Rotor Reflector Scrambler",
    category: "Cryptographic Machine",
    points: 150,
    timeBonusMax: 50,
    description: `The rooftop emergency alarm beacon scrambles incoming authorization tokens through a 3-rotor transposition machine equipped with a fixed reflector (ref).

Each character advances the machine step counter by 1. The signal passes forward through Rotor 1 (r1), Rotor 2 (r2), and Rotor 3 (r3), bounces off the reflector (ref), and then traverses backwards through the reciprocal inverse substitution wirings of Rotor 3, Rotor 2, and Rotor 1 before the step offset is removed.

The script must process the beacon token and emit the resulting scrambled ciphertext in the format:
\`DISARM_SEQ: BEACON-SCRAMBLE-<CIPHERTEXT>\``,
    buggyCode: `def scramble_beacon_token(token: str) -> str:
    r1 = "EKMFLGDQVZNTOWYHXUSPAIBRCJ"
    r2 = "AJDKSIRUXBLHWTMCQGZNPYFVOE"
    r3 = "BDFHJLCPRTXVZNYEIWGAKMUSQO"
    ref = "YRUHQSLDPXNGOKMIEBFZCWVJAT"

    def process_char(char: str, step: int) -> str:
        val = ord(char) - ord('A')
        val = (val + step) % 26
        val = ord(r1[val]) - ord('A')
        val = ord(r2[val]) - ord('A')
        val = ord(r3[val]) - ord('A')
        val = ord(ref[val]) - ord('A')
        val = ord(r3[val]) - ord('A')
        val = ord(r2[val]) - ord('A')
        val = ord(r1[val]) - ord('A')
        val = (val - step + 26) % 26
        return chr(val + ord('A'))

    scrambled = "".join(process_char(c, i + 1) for i, c in enumerate(token))
    return f"DISARM_SEQ: BEACON-SCRAMBLE-{scrambled}"

if __name__ == "__main__":
    beacon_token = "PROFESSOR"
    print(scramble_beacon_token(beacon_token))
`,
    correctCode: `def scramble_beacon_token(token: str) -> str:
    r1 = "EKMFLGDQVZNTOWYHXUSPAIBRCJ"
    r2 = "AJDKSIRUXBLHWTMCQGZNPYFVOE"
    r3 = "BDFHJLCPRTXVZNYEIWGAKMUSQO"
    ref = "YRUHQSLDPXNGOKMIEBFZCWVJAT"

    def process_char(char: str, step: int) -> str:
        val = ord(char) - ord('A')
        val = (val + step) % 26
        val = ord(r1[val]) - ord('A')
        val = ord(r2[val]) - ord('A')
        val = ord(r3[val]) - ord('A')
        val = ord(ref[val]) - ord('A')
        val = r3.index(chr(val + ord('A')))
        val = r2.index(chr(val + ord('A')))
        val = r1.index(chr(val + ord('A')))
        val = (val - step + 26) % 26
        return chr(val + ord('A'))

    scrambled = "".join(process_char(c, i + 1) for i, c in enumerate(token))
    return f"DISARM_SEQ: BEACON-SCRAMBLE-{scrambled}"

if __name__ == "__main__":
    beacon_token = "PROFESSOR"
    print(scramble_beacon_token(beacon_token))
`,
    expectedOutput: "DISARM_SEQ: BEACON-SCRAMBLE-RTFCBTREE",
  },
  {
    id: "alarm-04",
    stageNumber: 4,
    title: "Pressure Plate Disjoint Interval Union",
    category: "Computational Geometry / Intervals",
    points: 150,
    timeBonusMax: 50,
    description: `The treasury floor pressure plates are calibrated over overlapping continuous coordinate ranges [start, end]. To compute the true active safe floor area, overlapping and contiguous coordinate zones must be merged into disjoint unified intervals, and their cumulative span summed.

The script processes a series of calibrated sensor intervals, merges all overlapping areas, and computes the total unified coverage span.

The output must strictly match the format:
\`DISARM_SEQ: PRESSURE-COVERAGE-<TOTAL_UNITS>\``,
    buggyCode: `def calculate_pressure_coverage(raw_zones) -> str:
    intervals = sorted(raw_zones, key=lambda x: x[0])
    merged = [intervals[0]]

    for start, end in intervals[1:]:
        last_s, last_e = merged[-1]
        if start <= last_e:
            merged[-1] = (last_s, end)
        else:
            merged.append((start, end))

    total_coverage = sum(e - s for s, e in merged)
    return f"DISARM_SEQ: PRESSURE-COVERAGE-{total_coverage}"

if __name__ == "__main__":
    sensor_zones = [
        (12, 25), (20, 38), (45, 60), (15, 30),
        (55, 75), (80, 95), (85, 90)
    ]
    print(calculate_pressure_coverage(sensor_zones))
`,
    correctCode: `def calculate_pressure_coverage(raw_zones) -> str:
    intervals = sorted(raw_zones, key=lambda x: x[0])
    merged = [intervals[0]]

    for start, end in intervals[1:]:
        last_s, last_e = merged[-1]
        if start <= last_e:
            merged[-1] = (last_s, max(last_e, end))
        else:
            merged.append((start, end))

    total_coverage = sum(e - s for s, e in merged)
    return f"DISARM_SEQ: PRESSURE-COVERAGE-{total_coverage}"

if __name__ == "__main__":
    sensor_zones = [
        (12, 25), (20, 38), (45, 60), (15, 30),
        (55, 75), (80, 95), (85, 90)
    ]
    print(calculate_pressure_coverage(sensor_zones))
`,
    expectedOutput: "DISARM_SEQ: PRESSURE-COVERAGE-71",
  },
  {
    id: "alarm-05",
    stageNumber: 5,
    title: "2D Thermal Anomaly Spatial Convolution",
    category: "Matrix Signal Processing",
    points: 150,
    timeBonusMax: 50,
    description: `The bullion vault temperature grid is scanned by an infrared sensor producing a 5x5 thermal matrix. The security system performs a 2D spatial convolution across the matrix using a 3x3 Laplacian edge-detection kernel to locate the maximum anomalous thermal energy peak.

The valid convolution slides the 3x3 kernel across all valid positions without padding, computing the sum of element-wise products at each window to identify the highest energy response.

The output must report the maximum detected peak in the format:
\`DISARM_SEQ: THERMAL-PEAK-<PEAK_VAL>\``,
    buggyCode: `def compute_thermal_anomaly_peak(image, kernel) -> str:
    h = len(image)
    w = len(image[0])
    kh = len(kernel)
    kw = len(kernel[0])

    max_peak = -float("inf")

    for r in range(h - kh + 1):
        for c in range(w - kw + 1):
            accum = 0
            for kr in range(kh):
                for kc in range(kw):
                    accum += image[r + kr][c + kc] * kernel[kc][kr]

            if accum > max_peak:
                max_peak = accum

    return f"DISARM_SEQ: THERMAL-PEAK-{max_peak}"

if __name__ == "__main__":
    sensor_matrix = [
        [15, 20, 25, 30, 35],
        [22, 88, 95, 80, 24],
        [18, 92, 99, 85, 20],
        [25, 84, 91, 78, 28],
        [14, 19, 23, 29, 31]
    ]
    laplacian_kernel = [
        [ 0, -1,  0],
        [-1,  4, -1],
        [ 0, -1,  0]
    ]
    print(compute_thermal_anomaly_peak(sensor_matrix, laplacian_kernel))
`,
    correctCode: `def compute_thermal_anomaly_peak(image, kernel) -> str:
    h = len(image)
    w = len(image[0])
    kh = len(kernel)
    kw = len(kernel[0])

    max_peak = -float("inf")

    for r in range(h - kh + 1):
        for c in range(w - kw + 1):
            accum = 0
            for kr in range(kh):
                for kc in range(kw):
                    accum += image[r + kr][c + kc] * kernel[kr][kc]

            if accum > max_peak:
                max_peak = accum

    return f"DISARM_SEQ: THERMAL-PEAK-{max_peak}"

if __name__ == "__main__":
    sensor_matrix = [
        [15, 20, 25, 30, 35],
        [22, 88, 95, 80, 24],
        [18, 92, 99, 85, 20],
        [25, 84, 91, 78, 28],
        [14, 19, 23, 29, 31]
    ]
    laplacian_kernel = [
        [ 0, -1,  0],
        [-1,  4, -1],
        [ 0, -1,  0]
    ]
    print(compute_thermal_anomaly_peak(sensor_matrix, laplacian_kernel))
`,
    expectedOutput: "DISARM_SEQ: THERMAL-PEAK-123",
  },
  {
    id: "alarm-06",
    stageNumber: 6,
    title: "Biometric Scanner Multi-Hash Bloom Filter",
    category: "Probabilistic Data Structures",
    points: 150,
    timeBonusMax: 50,
    description: `The governor's elevator biometric terminal authenticates personnel badges against a 256-bit Bloom filter (represented as a 32-byte array) using three independent hash functions: DJB2 (h1), SDBM (h2), and FNV-1a (h3).

The filter is initialized with the authorized crew members. When scanning candidate badges, each badge is verified against the Bloom filter; a candidate is considered verified if all three corresponding bit indices are set.

The script must tally how many scanned candidate badges pass the Bloom filter verification and emit:
\`DISARM_SEQ: BLOOM-AUTH-COUNT-<COUNT>\``,
    buggyCode: `def verify_authorized_personnel() -> str:
    def h1(s):
        h = 5381
        for c in s:
            h = ((h << 5) + h + ord(c)) & 0xFFFFFFFF
        return h % 256

    def h2(s):
        h = 0
        for c in s:
            h = (ord(c) + (h << 6) + (h << 16) - h) & 0xFFFFFFFF
        return h % 256

    def h3(s):
        h = 2166136261
        for c in s:
            h = ((h ^ ord(c)) * 16777619) & 0xFFFFFFFF
        return h % 256

    authorized_crew = ["BERLIN", "TOKYO", "NAIROBI", "RIO", "DENVER", "HELSINKI"]
    filter_bytes = bytearray(32)

    for member in authorized_crew:
        for fn in (h1, h2, h3):
            bit = fn(member)
            filter_bytes[bit // 8] |= (1 << (7 - (bit % 8)))

    scanned_candidates = ["TOKYO", "OSLO", "DENVER", "LISBON", "BERLIN", "PALERMO", "BOGOTA", "RIO"]
    verified_count = 0

    for candidate in scanned_candidates:
        match = True
        for fn in (h1, h2, h3):
            bit = fn(candidate)
            if not (filter_bytes[bit // 8] & (1 << (bit % 8))):
                match = False
                break
        if match:
            verified_count += 1

    return f"DISARM_SEQ: BLOOM-AUTH-COUNT-{verified_count}"

if __name__ == "__main__":
    print(verify_authorized_personnel())
`,
    correctCode: `def verify_authorized_personnel() -> str:
    def h1(s):
        h = 5381
        for c in s:
            h = ((h << 5) + h + ord(c)) & 0xFFFFFFFF
        return h % 256

    def h2(s):
        h = 0
        for c in s:
            h = (ord(c) + (h << 6) + (h << 16) - h) & 0xFFFFFFFF
        return h % 256

    def h3(s):
        h = 2166136261
        for c in s:
            h = ((h ^ ord(c)) * 16777619) & 0xFFFFFFFF
        return h % 256

    authorized_crew = ["BERLIN", "TOKYO", "NAIROBI", "RIO", "DENVER", "HELSINKI"]
    filter_bytes = bytearray(32)

    for member in authorized_crew:
        for fn in (h1, h2, h3):
            bit = fn(member)
            filter_bytes[bit // 8] |= (1 << (bit % 8))

    scanned_candidates = ["TOKYO", "OSLO", "DENVER", "LISBON", "BERLIN", "PALERMO", "BOGOTA", "RIO"]
    verified_count = 0

    for candidate in scanned_candidates:
        match = True
        for fn in (h1, h2, h3):
            bit = fn(candidate)
            if not (filter_bytes[bit // 8] & (1 << (bit % 8))):
                match = False
                break
        if match:
            verified_count += 1

    return f"DISARM_SEQ: BLOOM-AUTH-COUNT-{verified_count}"

if __name__ == "__main__":
    print(verify_authorized_personnel())
`,
    expectedOutput: "DISARM_SEQ: BLOOM-AUTH-COUNT-4",
  },
  {
    id: "alarm-07",
    stageNumber: 7,
    title: "Substation Capacitor Subset-Sum Dynamic Programming",
    category: "Knapsack Optimization",
    points: 150,
    timeBonusMax: 50,
    description: `To disarm the electromagnetic lock coils, 12 discrete backup capacitor blocks must be partitioned into two disjoint subsets such that the absolute difference between their total energy ratings is minimized.

Each capacitor can be selected at most once (0/1 partition problem). The script must determine the optimal partition and calculate the minimum possible energy delta between the two subsets.

The output must be formatted as:
\`DISARM_SEQ: VOLTAGE-MIN-DELTA-<DELTA>\``,
    buggyCode: `def balance_substation_capacitors(capacitors) -> str:
    total = sum(capacitors)
    target = total // 2

    dp = [False] * (target + 1)
    dp[0] = True

    for cap in capacitors:
        for j in range(cap, target + 1):
            if dp[j - cap]:
                dp[j] = True

    best_sum = 0
    for j in range(target, -1, -1):
        if dp[j]:
            best_sum = j
            break

    min_delta = total - 2 * best_sum
    return f"DISARM_SEQ: VOLTAGE-MIN-DELTA-{min_delta}"

if __name__ == "__main__":
    bank_capacitors = [14, 27, 33, 41, 55, 62, 78, 89, 94, 106, 118, 125]
    print(balance_substation_capacitors(bank_capacitors))
`,
    correctCode: `def balance_substation_capacitors(capacitors) -> str:
    total = sum(capacitors)
    target = total // 2

    dp = [False] * (target + 1)
    dp[0] = True

    for cap in capacitors:
        for j in range(target, cap - 1, -1):
            if dp[j - cap]:
                dp[j] = True

    best_sum = 0
    for j in range(target, -1, -1):
        if dp[j]:
            best_sum = j
            break

    min_delta = total - 2 * best_sum
    return f"DISARM_SEQ: VOLTAGE-MIN-DELTA-{min_delta}"

if __name__ == "__main__":
    bank_capacitors = [14, 27, 33, 41, 55, 62, 78, 89, 94, 106, 118, 125]
    print(balance_substation_capacitors(bank_capacitors))
`,
    expectedOutput: "DISARM_SEQ: VOLTAGE-MIN-DELTA-0",
  },
  {
    id: "alarm-08",
    stageNumber: 8,
    title: "Acoustic Siren Sliding Window Monotonic Deque",
    category: "Amortized Data Structures",
    points: 150,
    timeBonusMax: 50,
    description: `The alarm system klaxon generates high-amplitude soundwaves monitored across a sliding window of size K = 4. To compute the cancellation frequency, the system must record the maximum peak resonance observed in every consecutive window of length 4 across the telemetry sequence and sum these peak values.

The script tracks the stream telemetry and computes the total sum of all sliding window maximums.

The output must be formatted as:
\`DISARM_SEQ: KLAXON-PEAK-SUM-<TOTAL>\``,
    buggyCode: `from collections import deque

def compute_sliding_resonance_sum(telemetry, k: int) -> str:
    dq = deque()
    peak_sum = 0

    for i in range(len(telemetry)):
        if dq and dq[0] <= i - k:
            dq.popleft()

        while dq and telemetry[dq[-1]] >= telemetry[i]:
            dq.pop()

        dq.append(i)

        if i >= k - 1:
            peak_sum += telemetry[dq[0]]

    return f"DISARM_SEQ: KLAXON-PEAK-SUM-{peak_sum}"

if __name__ == "__main__":
    siren_telemetry = [440, 520, 490, 610, 590, 720, 680, 800, 750, 890, 830, 960]
    print(compute_sliding_resonance_sum(siren_telemetry, 4))
`,
    correctCode: `from collections import deque

def compute_sliding_resonance_sum(telemetry, k: int) -> str:
    dq = deque()
    peak_sum = 0

    for i in range(len(telemetry)):
        if dq and dq[0] <= i - k:
            dq.popleft()

        while dq and telemetry[dq[-1]] <= telemetry[i]:
            dq.pop()

        dq.append(i)

        if i >= k - 1:
            peak_sum += telemetry[dq[0]]

    return f"DISARM_SEQ: KLAXON-PEAK-SUM-{peak_sum}"

if __name__ == "__main__":
    siren_telemetry = [440, 520, 490, 610, 590, 720, 680, 800, 750, 890, 830, 960]
    print(compute_sliding_resonance_sum(siren_telemetry, 4))
`,
    expectedOutput: "DISARM_SEQ: KLAXON-PEAK-SUM-7000",
  },
  {
    id: "alarm-09",
    stageNumber: 9,
    title: "Huffman Priority Queue Prefix Coding",
    category: "Compression & Greedy Trees",
    points: 150,
    timeBonusMax: 50,
    description: `The safe's internal firmware commands are encoded using canonical prefix Huffman coding. The routine constructs a priority min-heap from character frequencies, iteratively joins the two lowest-frequency subtrees until a single binary prefix tree remains, and derives the variable-length bit codes for each symbol.

The script encodes the command string "ABFACED" using the generated prefix codes.

The output must report the total bit length followed by the first 8 bits of the encoded payload:
\`DISARM_SEQ: HUFFMAN-BITS-<LENGTH>-<FIRST_8_BITS>\``,
    buggyCode: `import heapq

def generate_huffman_encoding(frequencies, message: str) -> str:
    heap = []
    for ch, freq in frequencies.items():
        heapq.heappush(heap, (freq, ch))

    tree = {}
    node_id = 0

    while len(heap) > 1:
        f1, left = heapq.heappop(heap)
        f2, right = heapq.heappop(heap)

        parent = f"NODE_{node_id}"
        tree[parent] = (left, right)
        heapq.heappush(heap, (f1 + f2, parent))
        node_id += 1

    codes = {}
    def build_codes(node, prefix=""):
        if node in frequencies:
            codes[node] = prefix
            return
        l_child, r_child = tree[node]
        build_codes(l_child, prefix + "0")
        build_codes(r_child, prefix + "1")

    root = heap[0][1]
    build_codes(root)

    encoded_bits = "".join(codes[c] for c in message)
    return f"DISARM_SEQ: HUFFMAN-BITS-{len(encoded_bits)}-{encoded_bits[:8]}"

if __name__ == "__main__":
    char_freqs = {"A": 45, "B": 13, "C": 12, "D": 16, "E": 9, "F": 5}
    firmware_command = "ABFACED"
    try:
        print(generate_huffman_encoding(char_freqs, firmware_command))
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")
`,
    correctCode: `import heapq

def generate_huffman_encoding(frequencies, message: str) -> str:
    heap = []
    uid = 0
    for ch, freq in frequencies.items():
        heapq.heappush(heap, (freq, uid, ch))
        uid += 1

    tree = {}

    while len(heap) > 1:
        f1, u1, left = heapq.heappop(heap)
        f2, u2, right = heapq.heappop(heap)

        parent = f"NODE_{uid}"
        tree[parent] = (left, right)
        heapq.heappush(heap, (f1 + f2, uid, parent))
        uid += 1

    codes = {}
    def build_codes(node, prefix=""):
        if node in frequencies:
            codes[node] = prefix
            return
        l_child, r_child = tree[node]
        build_codes(l_child, prefix + "0")
        build_codes(r_child, prefix + "1")

    root = heap[0][2]
    build_codes(root)

    encoded_bits = "".join(codes[c] for c in message)
    return f"DISARM_SEQ: HUFFMAN-BITS-{len(encoded_bits)}-{encoded_bits[:8]}"

if __name__ == "__main__":
    char_freqs = {"A": 45, "B": 13, "C": 12, "D": 16, "E": 9, "F": 5}
    firmware_command = "ABFACED"
    print(generate_huffman_encoding(char_freqs, firmware_command))
`,
    expectedOutput: "DISARM_SEQ: HUFFMAN-BITS-19-01011100",
  },
  {
    id: "alarm-10",
    stageNumber: 10,
    title: "ChaCha20 32-Bit Quarter-Round Matrix Scrambler",
    category: "Symmetric Stream Cipher Internals",
    points: 150,
    timeBonusMax: 50,
    description: `The Professor's master override terminal scrambles commands through a 16-word state matrix executed over 5 full double-rounds (alternating 4 column quarter-rounds and 4 diagonal quarter-rounds).

Each quarter-round performs modular 32-bit unsigned addition, bitwise XOR, and cyclic left rotation (rotl32) with rotation distances 16, 12, 8, and 7 across the four selected state words.

The script executes the 10 quarter-round operations and computes the 32-bit checksum of the final state words:
\`DISARM_SEQ: CHACHA-WORD-0x<8-DIGIT-HEX>\``,
    buggyCode: `def rotl32(v: int, c: int) -> int:
    return (((v << c) & 0xFFFFFFFF) | (v >> (32 - c))) & 0xFFFFFFFF

def quarter_round(s, a: int, b: int, c: int, d: int):
    s[a] += s[b]
    s[d] = rotl32(s[d] ^ s[a], 16)
    s[c] += s[d]
    s[b] = rotl32(s[b] ^ s[c], 12)
    s[a] += s[b]
    s[d] = rotl32(s[d] ^ s[a], 8)
    s[c] += s[d]
    s[b] = rotl32(s[b] ^ s[c], 7)

def execute_master_stream_cipher() -> str:
    state = [
        0x61707865, 0x3320646e, 0x79622d32, 0x6b206574,
        0x03020100, 0x07060504, 0x0b0a0908, 0x0f0e0d0c,
        0x13121110, 0x17161514, 0x1b1a1918, 0x1f1e1d1c,
        0x00000001, 0x09000000, 0x4a000000, 0x00000000
    ]

    for _ in range(5):
        quarter_round(state, 0, 4, 8, 12)
        quarter_round(state, 1, 5, 9, 13)
        quarter_round(state, 2, 6, 10, 14)
        quarter_round(state, 3, 7, 11, 15)
        quarter_round(state, 0, 5, 10, 15)
        quarter_round(state, 1, 6, 11, 12)
        quarter_round(state, 2, 7, 8, 13)
        quarter_round(state, 3, 4, 9, 14)

    checksum = sum(state) & 0xFFFFFFFF
    return f"DISARM_SEQ: CHACHA-WORD-0x{checksum:08X}"

if __name__ == "__main__":
    print(execute_master_stream_cipher())
`,
    correctCode: `def rotl32(v: int, c: int) -> int:
    return (((v << c) & 0xFFFFFFFF) | (v >> (32 - c))) & 0xFFFFFFFF

def quarter_round(s, a: int, b: int, c: int, d: int):
    s[a] = (s[a] + s[b]) & 0xFFFFFFFF
    s[d] = rotl32(s[d] ^ s[a], 16)
    s[c] = (s[c] + s[d]) & 0xFFFFFFFF
    s[b] = rotl32(s[b] ^ s[c], 12)
    s[a] = (s[a] + s[b]) & 0xFFFFFFFF
    s[d] = rotl32(s[d] ^ s[a], 8)
    s[c] = (s[c] + s[d]) & 0xFFFFFFFF
    s[b] = rotl32(s[b] ^ s[c], 7)

def execute_master_stream_cipher() -> str:
    state = [
        0x61707865, 0x3320646e, 0x79622d32, 0x6b206574,
        0x03020100, 0x07060504, 0x0b0a0908, 0x0f0e0d0c,
        0x13121110, 0x17161514, 0x1b1a1918, 0x1f1e1d1c,
        0x00000001, 0x09000000, 0x4a000000, 0x00000000
    ]

    for _ in range(5):
        quarter_round(state, 0, 4, 8, 12)
        quarter_round(state, 1, 5, 9, 13)
        quarter_round(state, 2, 6, 10, 14)
        quarter_round(state, 3, 7, 11, 15)
        quarter_round(state, 0, 5, 10, 15)
        quarter_round(state, 1, 6, 11, 12)
        quarter_round(state, 2, 7, 8, 13)
        quarter_round(state, 3, 4, 9, 14)

    checksum = sum(state) & 0xFFFFFFFF
    return f"DISARM_SEQ: CHACHA-WORD-0x{checksum:08X}"

if __name__ == "__main__":
    print(execute_master_stream_cipher())
`,
    expectedOutput: "DISARM_SEQ: CHACHA-WORD-0x072B794A",
  },
];

/**
 * Returns exactly ONE randomly selected challenge safe for client-side transmission.
 * Supports optional excludeId to ensure consecutive challenges are distinct.
 * NEVER exposes correctCode or expectedOutput. Zero list leakage.
 */
export function getRandomClientChallenge(excludeId?: string): ChallengeClient {
  const pool = excludeId ? CHALLENGES.filter((c) => c.id !== excludeId) : CHALLENGES;
  const targetPool = pool.length > 0 ? pool : CHALLENGES;
  const randomIndex = Math.floor(Math.random() * targetPool.length);
  const { correctCode, expectedOutput, ...clientSafe } = targetPool[randomIndex];
  return clientSafe;
}

/**
 * Returns a specific sanitized challenge by ID if requested.
 */
export function getClientChallengeById(id: string): ChallengeClient | undefined {
  const found = CHALLENGES.find((c) => c.id === id);
  if (!found) return undefined;
  const { correctCode, expectedOutput, ...clientSafe } = found;
  return clientSafe;
}

/**
 * Retrieves a single full challenge for server-side evaluation ONLY.
 */
export function getChallengeById(id: string): ChallengeServer | undefined {
  return CHALLENGES.find((c) => c.id === id);
}
