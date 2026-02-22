# CPU Process Scheduling Simulator (Web)

A web-based **CPU Process Scheduling Simulator** that accepts **any number of processes**, runs them through **multiple scheduling algorithms**, and shows:
* **Step-by-step execution**
* **Gantt chart visualization**
* **Performance metrics table for each algorithm**
* **Automatic “Best Algorithm” selection** based on computed metrics

## Live Demo




## Features
* Add **N processes** with Arrival Time, Burst Time and Priority
* Supports **preemptive and non-preemptive** scheduling
* **Round Robin** with user-defined **time quantum**
* Shows **timeline steps** (which process ran at each time)
* Generates **Gantt chart**
* Computes and tabulates:
  - Waiting Time (WT)
  - Turnaround Time (TAT)
  - Response Time (RT)
  - Completion Time (CT)
  - (Optional) CPU Utilization, Throughput
* Highlights **Best Algorithm** for the given input case



## Algorithms Included
* FCFS (First Come First Serve)
* SJF (Non-preemptive)
* SRTF (Preemptive SJF)
* Priority Scheduling (Non-preemptive)
* Priority Scheduling (Preemptive)
* Round Robin (RR)

> Algorithm explanations are available inside the app and in the documentation 



## How “Best Algorithm” is Chosen
The simulator computes metrics for each algorithm and selects the best using a scoring (for example: lowest average waiting time, then lowest turnaround time, then lowest response time).


## Input Format (UI)
Each process typically includes:
* Process ID (P1, P2, …)
* Arrival Time (AT)
* Burst Time (BT)
* Priority (only for Priority algorithms)
* Time Quantum (only for Round Robin)



## Output
For each algorithm, the simulator displays:
* Gantt Chart 
* Step-by-step execution log
* Per-process table (CT, TAT, WT, RT)
* Overall averages for comparison across algorithms
* Best algorithm badge





