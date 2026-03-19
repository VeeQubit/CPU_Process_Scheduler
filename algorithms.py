from collections import deque

def calculate_metrics(gantt, table):
    n = len(table)

    avg_wt = sum(p["wt"] for p in table) / n
    avg_tat = sum(p["tat"] for p in table) / n
    avg_rt = sum(p["rt"] for p in table) / n

    busy_time = sum(end - start for pid, start, end in gantt if pid != "Idle")
    total_time = gantt[-1][2] if gantt else 0

    cpu_util = (busy_time / total_time) if total_time > 0 else 0
    throughput = n / total_time if total_time > 0 else 0

    return {
        "cpu_util": cpu_util,
        "throughput": throughput,
        "avg_tat": avg_tat,
        "avg_wt": avg_wt,
        "avg_rt": avg_rt
    }

def select_best_algorithms(results):
    metrics = {}

    for name, (gantt, table) in results.items():
        metrics[name] = calculate_metrics(gantt, table)

    def comparison_key(m):
        return (
            -m["cpu_util"],       
            -m["throughput"],     
            m["avg_tat"],         
            m["avg_wt"],          
            m["avg_rt"]           
        )

    best_value = min(comparison_key(m) for m in metrics.values())

    best_algorithms = [
        name for name, m in metrics.items()
        if comparison_key(m) == best_value
    ]

    return best_algorithms, metrics


# ---------------- FCFS ----------------
def fcfs(processes):
    processes = sorted(processes, key=lambda x: (x["arrival"], x["pid"]))
    time = 0
    gantt = []
    table = []

    for p in processes:
        if time < p["arrival"]:
            gantt.append(("Idle", time, p["arrival"]))
            time = p["arrival"]

        start = time
        end = time + p["burst"]
        gantt.append((p["pid"], start, end))

        ct = end
        tat = ct - p["arrival"]
        wt = tat - p["burst"]
        rt = start - p["arrival"]   

        table.append({
            **p,
            "ct": ct,
            "tat": tat,
            "wt": wt,
            "rt": rt             
        })

        time = end

    return gantt, table


# ---------------- SPN ----------------
def spn(processes):
    procs = processes.copy()
    time = 0
    completed = []
    gantt = []

    while procs:
        ready = [p for p in procs if p["arrival"] <= time]

        if not ready:
            next_arrival = min(procs, key=lambda x: x["arrival"])["arrival"]
            gantt.append(("Idle", time, next_arrival))
            time = next_arrival
            continue

        p = min(ready, key=lambda x: x["burst"])

        start = time
        end = time + p["burst"]
        gantt.append((p["pid"], start, end))

        ct = end
        tat = ct - p["arrival"]
        wt = tat - p["burst"]
        rt = start - p["arrival"]   

        completed.append({
            **p,
            "ct": ct,
            "tat": tat,
            "wt": wt,
            "rt": rt              
        })

        time = end
        procs.remove(p)

    return gantt, completed


# ---------------- SRTF ----------------
def srtf(processes):
    procs = [{**p, "remaining": p["burst"], "started": False} for p in processes]
    time = 0
    gantt = []
    completed = []
    current = None
    start_time = 0

    while procs:
        ready = [p for p in procs if p["arrival"] <= time]

        if not ready:
            next_arrival = min(procs, key=lambda x: x["arrival"])["arrival"]
            gantt.append(("Idle", time, next_arrival))
            time = next_arrival
            continue

        p = min(ready, key=lambda x: x["remaining"])

        if current != p:
            if current:
                gantt.append((current["pid"], start_time, time))
            current = p
            start_time = time

           
            if not p["started"]:
                p["rt"] = time - p["arrival"]
                p["started"] = True

        p["remaining"] -= 1
        time += 1

        if p["remaining"] == 0:
            gantt.append((p["pid"], start_time, time))
            ct = time
            tat = ct - p["arrival"]
            wt = tat - p["burst"]

            completed.append({
                **p,
                "ct": ct,
                "tat": tat,
                "wt": wt,
                "rt": p["rt"]     
            })

            procs.remove(p)
            current = None

    return gantt, completed


# ---------------- Round Robin ----------------
def round_robin(processes, quantum):
    procs = [
        {**p, "remaining": p["burst"], "started": False}
        for p in processes
    ]
    procs.sort(key=lambda x: x["arrival"])

    time = 0
    queue = deque()
    gantt = []
    completed = []
    i = 0

    while queue or i < len(procs):

        if not queue and i < len(procs) and time < procs[i]["arrival"]:
            gantt.append(("Idle", time, procs[i]["arrival"]))
            time = procs[i]["arrival"]

        while i < len(procs) and procs[i]["arrival"] <= time:
            queue.append(procs[i])
            i += 1

        if not queue:
            continue

        p = queue.popleft()

        start = time

        
        if not p["started"]:
            p["rt"] = time - p["arrival"]
            p["started"] = True

        exec_time = min(quantum, p["remaining"])
        time += exec_time
        p["remaining"] -= exec_time

        gantt.append((p["pid"], start, time))

        while i < len(procs) and procs[i]["arrival"] <= time:
            queue.append(procs[i])
            i += 1

        if p["remaining"] > 0:
            queue.append(p)
        else:
            ct = time
            tat = ct - p["arrival"]
            wt = tat - p["burst"]

            completed.append({
                **p,
                "ct": ct,
                "tat": tat,
                "wt": wt,
                "rt": p["rt"]   
            })

    return gantt, completed


# ---------------- Priority NP ----------------
def priority_np(processes):
    procs = processes.copy()
    time = 0
    gantt = []
    completed = []

    while procs:
        ready = [p for p in procs if p["arrival"] <= time]

        if not ready:
            next_arrival = min(procs, key=lambda x: x["arrival"])["arrival"]
            gantt.append(("Idle", time, next_arrival))
            time = next_arrival
            continue

        p = min(ready, key=lambda x: x["priority"])

        start = time
        end = time + p["burst"]
        gantt.append((p["pid"], start, end))

        ct = end
        tat = ct - p["arrival"]
        wt = tat - p["burst"]
        rt = start - p["arrival"]   

        completed.append({
            **p,
            "ct": ct,
            "tat": tat,
            "wt": wt,
            "rt": rt               
        })

        time = end
        procs.remove(p)

    return gantt, completed


# ---------------- Priority P ----------------
def priority_p(processes):
    procs = [
        {**p, "remaining": p["burst"], "started": False}
        for p in processes
    ]
    time = 0
    gantt = []
    completed = []
    current = None
    start_time = 0

    while procs:
        ready = [p for p in procs if p["arrival"] <= time]

        if not ready:
            next_arrival = min(procs, key=lambda x: x["arrival"])["arrival"]
            gantt.append(("Idle", time, next_arrival))
            time = next_arrival
            continue

        p = min(ready, key=lambda x: x["priority"])

        if current != p:
            if current:
                gantt.append((current["pid"], start_time, time))
            current = p
            start_time = time

            
            if not p["started"]:
                p["rt"] = time - p["arrival"]
                p["started"] = True

        p["remaining"] -= 1
        time += 1

        if p["remaining"] == 0:
            gantt.append((p["pid"], start_time, time))

            ct = time
            tat = ct - p["arrival"]
            wt = tat - p["burst"]

            completed.append({
                **p,
                "ct": ct,
                "tat": tat,
                "wt": wt,
                "rt": p["rt"]   
            })

            procs.remove(p)
            current = None

    return gantt, completed


