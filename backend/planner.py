import statistics

PRIORITY_WEIGHT = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1}


def skill_score(required, dev_skills):
    if not required:
        return 1.0
    req = {s.strip().lower() for s in required if s.strip()}
    if not req:
        return 1.0
    have = {s.strip().lower() for s in dev_skills}
    return len(req & have) / len(req)


def dev_capacity(dev):
    return round((dev.get("capacity_points", 0) or 0) * (dev.get("availability_pct", 100) or 0) / 100, 1)


def team_capacity(devs):
    return round(sum(dev_capacity(d) for d in devs), 1)


def topo_order(items):
    by_id = {i["id"]: i for i in items}
    visited, order = set(), []

    def visit(item, stack):
        if item["id"] in visited:
            return
        for dep in item.get("dependencies", []):
            if dep in by_id and dep not in stack:
                visit(by_id[dep], stack | {item["id"]})
        visited.add(item["id"])
        order.append(item)

    ranked = sorted(items, key=lambda x: -PRIORITY_WEIGHT.get(x.get("priority", "Medium"), 2))
    for item in ranked:
        visit(item, set())
    return order


def _assign(item, devs, remaining, strategy):
    pts = item.get("story_points", 0) or 0
    if strategy == "random":
        import random
        pick = random.choice(devs) if devs else None
        if pick:
            remaining[pick["id"]] -= pts
            return pick, skill_score(item.get("skills", []), pick.get("skills", []))
        return None, 0
    if strategy == "rule":
        for d in devs:
            if remaining[d["id"]] >= pts:
                remaining[d["id"]] -= pts
                return d, skill_score(item.get("skills", []), d.get("skills", []))
        if devs:
            remaining[devs[0]["id"]] -= pts
            return devs[0], skill_score(item.get("skills", []), devs[0].get("skills", []))
        return None, 0
    scored = sorted(devs, key=lambda d: (skill_score(item.get("skills", []), d.get("skills", [])),
                                         remaining[d["id"]]), reverse=True)
    fit = [d for d in scored if remaining[d["id"]] >= pts]
    pick = fit[0] if fit else (scored[0] if scored else None)
    if pick:
        remaining[pick["id"]] -= pts
        return pick, skill_score(item.get("skills", []), pick.get("skills", []))
    return None, 0


def build_plan(items, devs, capacity=None, strategy="optimized"):
    schedulable = [i for i in items if i.get("status") == "approved"]
    tasks = [i for i in schedulable if i.get("type") == "task"]
    pool = tasks if tasks else [i for i in schedulable if i.get("type") == "story"]

    if capacity is None:
        capacity = team_capacity(devs) or sum((i.get("story_points", 0) or 0) for i in pool)

    remaining = {d["id"]: dev_capacity(d) for d in devs}
    all_ids = {i["id"] for i in pool}
    ordered = topo_order(pool) if strategy != "random" else pool[:]
    if strategy == "random":
        import random
        random.shuffle(ordered)

    selected_ids, assignments, total = set(), [], 0
    for item in ordered:
        pts = item.get("story_points", 0) or 0
        deps = [d for d in item.get("dependencies", []) if d in all_ids]
        if strategy != "random" and any(d not in selected_ids for d in deps):
            continue
        if total + pts > capacity:
            continue
        dev, score = _assign(item, devs, remaining, strategy)
        selected_ids.add(item["id"])
        total += pts
        assignments.append({
            "item_id": item["id"], "title": item["title"], "type": item.get("type"),
            "story_points": pts, "priority": item.get("priority", "Medium"),
            "skills": item.get("skills", []), "dependencies": item.get("dependencies", []),
            "developer_id": dev["id"] if dev else None,
            "developer_name": dev["name"] if dev else "Unassigned",
            "skill_score": round(score, 2), "board_status": "todo",
        })

    loads = []
    for d in devs:
        cap = dev_capacity(d)
        load = round(cap - remaining[d["id"]], 1)
        loads.append({
            "developer_id": d["id"], "name": d["name"], "capacity": cap, "load": load,
            "utilization": round(load / cap * 100, 1) if cap else 0,
            "overloaded": cap > 0 and load > cap,
        })

    unscheduled = [{"item_id": i["id"], "title": i["title"], "story_points": i.get("story_points", 0),
                    "priority": i.get("priority", "Medium")}
                   for i in pool if i["id"] not in selected_ids]

    return {
        "strategy": strategy, "capacity": round(capacity, 1), "selected_points": total,
        "assignments": assignments, "dev_loads": loads, "unscheduled": unscheduled,
        "pool_size": len(pool),
    }


def plan_metrics(plan, pool_items):
    cap = plan["capacity"] or 1
    util = round(plan["selected_points"] / cap * 100, 1)
    loads = [d["load"] for d in plan["dev_loads"]] or [0]
    mean = statistics.mean(loads) if loads else 0
    if mean > 0 and len(loads) > 1:
        balance = round(max(0, 100 - (statistics.pstdev(loads) / mean * 100)), 1)
    else:
        balance = 100.0
    skills = [a["skill_score"] for a in plan["assignments"]] or [0]
    skill_match = round(sum(skills) / len(skills) * 100, 1)

    total_pri = sum(PRIORITY_WEIGHT.get(i.get("priority", "Medium"), 2) * (i.get("story_points", 0) or 0)
                    for i in pool_items if i.get("status") == "approved")
    sel_ids = {a["item_id"] for a in plan["assignments"]}
    got_pri = sum(PRIORITY_WEIGHT.get(a["priority"], 2) * a["story_points"] for a in plan["assignments"])
    priority_sat = round(got_pri / total_pri * 100, 1) if total_pri else 100.0

    dep_total = len(plan["assignments"]) or 1
    dep_ok = sum(1 for a in plan["assignments"] if all(d in sel_ids for d in a["dependencies"]))
    dep_sat = round(dep_ok / dep_total * 100, 1)

    overload = sum(1 for d in plan["dev_loads"] if d["overloaded"])
    overload_rate = round(overload / len(plan["dev_loads"]) * 100, 1) if plan["dev_loads"] else 0

    return {
        "capacity_utilization": util, "workload_balance": balance, "skill_match": skill_match,
        "priority_satisfaction": priority_sat, "dependency_satisfaction": dep_sat,
        "overload_rate": overload_rate, "tasks_scheduled": len(plan["assignments"]),
    }
