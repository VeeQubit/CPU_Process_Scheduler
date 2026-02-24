from flask import Flask, render_template, request, jsonify
from algorithms import *

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("home.html")

@app.route("/simulator")
def simulator():
    return render_template("index.html")

@app.route("/run", methods=["POST"])
def run():
    data = request.json
    processes = data["processes"]
    quantum = data.get("quantum", 2)

    algos = {
        "FCFS": fcfs,
        "SPN": spn,
        "SRTF": srtf,
        "RR": lambda p: round_robin(p, quantum),
        "Priority NP": priority_np,
        "Priority P": priority_p
    }

    raw_results = {}

    # Run all algorithms
    for name, func in algos.items():
        gantt, table = func(processes)
        raw_results[name] = (gantt, table)

    # Select best and calculate metrics
    best, metrics = select_best_algorithms(raw_results)

    # Format response for frontend
    formatted_results = {}

    for name, (gantt, table) in raw_results.items():
        formatted_results[name] = {
            "gantt": gantt,
            "table": table,
            "metrics": metrics[name]
        }

    return jsonify({
        "results": formatted_results,
        "best": best
    })

if __name__ == "__main__":
    app.run(debug=True)