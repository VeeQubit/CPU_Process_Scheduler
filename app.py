from flask import Flask, render_template, request, jsonify, send_from_directory
from algorithms import fcfs, spn, srtf, round_robin, priority_np, priority_p, select_best_algorithms

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("home.html")

@app.route("/explore")
def explore():
    return render_template("explore.html")

@app.route("/simulator")
def simulator():
    return render_template("index.html")

@app.route("/sitemap.xml")
def sitemap():
    return send_from_directory(".", "sitemap.xml")

@app.route("/robots.txt")
def robots():
    return send_from_directory(".", "robots.txt")

@app.route("/run", methods=["POST"])
def run():
    data = request.json
    processes = data["processes"]
    quantum = data.get("quantum", 2)

    algos = {
        "FCFS":        fcfs,
        "SPN":         spn,
        "SRTF":        srtf,
        "RR":          lambda p: round_robin(p, quantum),
        "Priority NP": priority_np,
        "Priority P":  priority_p
    }

    raw_results = {}
    for name, func in algos.items():
        gantt, table = func(processes)
        raw_results[name] = (gantt, table)

    best, metrics = select_best_algorithms(raw_results)

    formatted_results = {
        name: {
            "gantt":   gantt,
            "table":   table,
            "metrics": metrics[name]
        }
        for name, (gantt, table) in raw_results.items()
    }

    return jsonify({"results": formatted_results, "best": best})

if __name__ == "__main__":
    app.run(debug=True)
