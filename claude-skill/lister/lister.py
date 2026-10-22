"""CLI over the Lister data file (%APPDATA%/com.lister.app/lister_data.bin, plain JSON).

Boards and columns accept an id or a case-insensitive title (unique prefix also works).
Every write keeps lister_data.bin.bak with the previous version.
"""
import argparse, json, os, random, shutil, sys, time

PATH = os.environ.get("LISTER_DATA") or os.path.join(os.environ.get("APPDATA", ""), "com.lister.app", "lister_data.bin")
PRIOS = ("low", "medium", "high")
COLORS = ["bg-red-500", "bg-orange-500", "bg-amber-500", "bg-yellow-500", "bg-lime-500", "bg-green-500", "bg-emerald-500",
          "bg-teal-500", "bg-cyan-500", "bg-sky-500", "bg-blue-500", "bg-indigo-500", "bg-violet-500", "bg-purple-500",
          "bg-fuchsia-500", "bg-pink-500", "bg-rose-500"]

now = lambda: int(time.time() * 1000)
sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")


def load():
    with open(PATH, encoding="utf-8") as f:
        return json.load(f)


def save(data):
    shutil.copyfile(PATH, PATH + ".bak")
    tmp = PATH + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(tmp, PATH)


def die(msg):
    sys.exit(f"erro: {msg}")


def pick(items, key, what):
    """items: list of dicts with id/title. Exact id, exact title, then unique prefix."""
    k = key.lower()
    for test in (lambda x: x["id"] == key, lambda x: x["title"].lower() == k, lambda x: x["title"].lower().startswith(k)):
        hits = [x for x in items if test(x)]
        if len(hits) == 1:
            return hits[0]
        if len(hits) > 1:
            die(f"{what} ambíguo '{key}': " + ", ".join(f"{h['title']} ({h['id']})" for h in hits))
    die(f"{what} não encontrado: '{key}'")


def board(data, key):
    return pick(data["boards"], key, "board")


def column(b, key):
    return pick([b["columns"][c] for c in b["columnOrder"]], key, "coluna")


def find_task(data, tid):
    for b in data["boards"]:
        if tid in b["tasks"]:
            col = next((c for c in b["columns"].values() if tid in c["taskIds"]), None)
            return b, col, b["tasks"][tid]
    die(f"tarefa não encontrada: {tid}")


def tag_ids(b, names):
    """Tag titles -> ids, creating missing tags on the board."""
    out = []
    for n in filter(None, (s.strip() for s in names.split(","))):
        t = next((t for t in b["tags"].values() if t["title"].lower() == n.lower() or t["id"] == n), None)
        if not t:
            t = {"id": f"tag-{now()}-{len(b['tags'])}", "title": n, "color": random.choice(COLORS)}
            b["tags"][t["id"]] = t
        out.append(t["id"])
    return out


def fmt_ms(ms):
    m, h = ms // 60000 % 60, ms // 3600000
    return f"{h}h{m:02d}m" if h else (f"{m}m" if m else "")


def line(b, t):
    tags = ",".join(b["tags"][i]["title"] for i in t.get("tags") or [] if i in b["tags"])
    st = t.get("subtasks") or []
    bits = [t.get("priority", "medium")]
    if tags: bits.append("#" + tags)
    if st: bits.append(f"{sum(s['done'] for s in st)}/{len(st)} sub")
    if fmt_ms(t.get("timeLog") or 0): bits.append(fmt_ms(t["timeLog"]))
    if t.get("isRunning"): bits.append("TIMER RODANDO")
    return f"  [{'x' if t.get('completed') else ' '}] {t['content']}  ({'; '.join(bits)})  id={t['id']}"


# ---- commands ----

def c_boards(d, a):
    for b in d["boards"]:
        kind = b.get("kind", "board")
        extra = f"{len(b['tasks'])} tarefas, {len(b['columnOrder'])} colunas" if kind == "board" else f"{len(b.get('notes') or '')} chars"
        print(f"{b['title']}  [{kind}]  {extra}  id={b['id']}")


def c_show(d, a):
    b = board(d, a.board)
    if b.get("kind") == "notes":
        print(b.get("notes") or "(vazio)")
        return
    print(f"# {b['title']}  id={b['id']}")
    for cid in b["columnOrder"]:
        c = b["columns"][cid]
        print(f"\n## {c['title']}  id={cid}" + (f" — {c['description']}" if c.get("description") else ""))
        for tid in c["taskIds"]:
            if tid in b["tasks"] and (a.all or not b["tasks"][tid].get("completed")):
                print(line(b, b["tasks"][tid]))


def c_task(d, a):
    b, col, t = find_task(d, a.id)
    out = dict(t, board=b["title"], column=col and col["title"],
               tags=[b["tags"][i]["title"] for i in t.get("tags") or [] if i in b["tags"]])
    print(json.dumps(out, ensure_ascii=False, indent=2))


def c_search(d, a):
    q = a.query.lower()
    for b in d["boards"]:
        for t in b["tasks"].values():
            if q in t["content"].lower() or q in (t.get("description") or "").lower():
                col = next((c["title"] for c in b["columns"].values() if t["id"] in c["taskIds"]), "?")
                print(f"{b['title']} / {col}:" + line(b, t))
        if q in (b.get("notes") or "").lower():
            print(f"{b['title']}: (match nas notas)")


def c_add(d, a):
    b = board(d, a.board)
    c = column(b, a.column)
    t = {"id": f"task-{now()}-{random.random()}", "content": a.content, "completed": False,
         "createdAt": now(), "priority": a.priority or "medium"}
    if a.desc: t["description"] = a.desc
    if a.tags: t["tags"] = tag_ids(b, a.tags)
    if a.subtasks:
        t["subtasks"] = [{"id": f"st-{now()}-{i}", "content": s.strip(), "done": False}
                         for i, s in enumerate(a.subtasks.split(";")) if s.strip()]
    b["tasks"][t["id"]] = t
    (c["taskIds"].insert(0, t["id"]) if a.top else c["taskIds"].append(t["id"]))
    save(d)
    print(f"criada: {t['id']}")


def c_edit(d, a):
    b, _, t = find_task(d, a.id)
    if a.content: t["content"] = a.content
    if a.priority: t["priority"] = a.priority
    if a.desc is not None: t["description"] = a.desc
    if a.tags is not None: t["tags"] = tag_ids(b, a.tags)
    st = t.setdefault("subtasks", [])
    for i, s in enumerate(a.add_subtask or []):
        st.append({"id": f"st-{now()}-{i}", "content": s, "done": False})
    for key in a.check or []:
        next((s for s in st if s["id"] == key or s["content"].lower() == key.lower()), {})["done"] = True
    for key in a.uncheck or []:
        next((s for s in st if s["id"] == key or s["content"].lower() == key.lower()), {})["done"] = False
    if a.remove_subtask:
        rm = {k.lower() for k in a.remove_subtask}
        t["subtasks"] = [s for s in st if s["id"].lower() not in rm and s["content"].lower() not in rm]
    if a.time is not None: t["timeLog"] = int(a.time * 60000)
    save(d)
    print("ok")


def c_done(d, a, value=True):
    _, _, t = find_task(d, a.id)
    if value and t.get("isRunning"):  # same as the app: completing stops the clock
        t["timeLog"] = (t.get("timeLog") or 0) + now() - (t.get("lastStartTime") or now())
        t["isRunning"], t["lastStartTime"] = False, None
    t["completed"], t["completedAt"] = value, now() if value else None
    save(d)
    print("ok")


def c_move(d, a):
    b, col, t = find_task(d, a.id)
    dest = column(b, a.column)
    col["taskIds"].remove(t["id"])
    pos = len(dest["taskIds"]) if a.position is None else a.position
    dest["taskIds"].insert(pos, t["id"])
    save(d)
    print(f"movida para {dest['title']}")


def c_delete(d, a):
    b, col, t = find_task(d, a.id)
    if col: col["taskIds"].remove(t["id"])
    del b["tasks"][t["id"]]
    save(d)
    print(f"apagada: {t['content']}")


def c_add_board(d, a):
    b = {"id": f"board-{now()}", "title": a.title, "tasks": {}, "columns": {}, "columnOrder": [], "tags": {},
         "createdAt": now(), "icon": "tabler:layout-dashboard"}
    if a.notes:
        b.update(kind="notes", notes="", icon="tabler:notes")
    else:
        for i, title in enumerate(a.columns.split(",") if a.columns else ["To Do"]):
            cid = f"col-{now()}{i}"
            b["columns"][cid] = {"id": cid, "title": title.strip(), "description": "", "taskIds": []}
            b["columnOrder"].append(cid)
    d["boards"].append(b)
    save(d)
    print(f"criado: {b['id']}")


def c_rename_board(d, a):
    board(d, a.board)["title"] = a.title
    save(d)
    print("ok")


def c_delete_board(d, a):
    b = board(d, a.board)
    d["boards"].remove(b)
    save(d)
    print(f"board apagado: {b['title']} ({len(b['tasks'])} tarefas)")


def c_add_column(d, a):
    b = board(d, a.board)
    cid = f"col-{now()}"
    b["columns"][cid] = {"id": cid, "title": a.title, "description": a.desc or "", "taskIds": []}
    b["columnOrder"].append(cid)
    save(d)
    print(f"criada: {cid}")


def c_edit_column(d, a):
    c = column(board(d, a.board), a.column)
    if a.title: c["title"] = a.title
    if a.desc is not None: c["description"] = a.desc
    save(d)
    print("ok")


def c_delete_column(d, a):
    b = board(d, a.board)
    c = column(b, a.column)
    for tid in c["taskIds"]:
        b["tasks"].pop(tid, None)
    del b["columns"][c["id"]]
    b["columnOrder"].remove(c["id"])
    save(d)
    print(f"coluna apagada: {c['title']} ({len(c['taskIds'])} tarefas)")


def c_notes(d, a):
    b = board(d, a.board)
    if b.get("kind") != "notes": die("não é um bloco de notas")
    if a.set is not None: b["notes"] = a.set
    elif a.append: b["notes"] = ((b.get("notes") or "").rstrip("\n") + "\n\n" + a.append).lstrip("\n")
    else:
        print(b.get("notes") or "(vazio)")
        return
    save(d)
    print("ok")


def main():
    p = argparse.ArgumentParser(prog="lister")
    sp = p.add_subparsers(dest="cmd", required=True)
    def cmd(name, fn, *args):
        s = sp.add_parser(name)
        for spec in args:
            names, kw = (spec, {}) if isinstance(spec, str) else spec
            s.add_argument(*([names] if isinstance(names, str) else names), **kw)
        s.set_defaults(fn=fn)
    cmd("boards", c_boards)
    cmd("show", c_show, "board", ("--all", dict(action="store_true", help="inclui concluídas")))
    cmd("task", c_task, "id")
    cmd("search", c_search, "query")
    cmd("add", c_add, "board", "column", "content", ("--priority", dict(choices=PRIOS)), "--desc",
        ("--tags", dict(help="títulos separados por vírgula")), ("--subtasks", dict(help="separadas por ;")),
        ("--top", dict(action="store_true")))
    cmd("edit", c_edit, "id", "--content", ("--priority", dict(choices=PRIOS)), "--desc",
        ("--tags", dict(help="substitui; '' limpa")), ("--add-subtask", dict(action="append")),
        ("--check", dict(action="append")), ("--uncheck", dict(action="append")),
        ("--remove-subtask", dict(action="append")), ("--time", dict(type=float, help="minutos registrados")))
    cmd("done", c_done, "id")
    cmd("undone", lambda d, a: c_done(d, a, False), "id")
    cmd("move", c_move, "id", "column", ("--position", dict(type=int)))
    cmd("delete", c_delete, "id")
    cmd("add-board", c_add_board, "title", ("--notes", dict(action="store_true")), ("--columns", dict(help="títulos separados por vírgula")))
    cmd("rename-board", c_rename_board, "board", "title")
    cmd("delete-board", c_delete_board, "board")
    cmd("add-column", c_add_column, "board", "title", "--desc")
    cmd("edit-column", c_edit_column, "board", "column", "--title", "--desc")
    cmd("delete-column", c_delete_column, "board", "column")
    cmd("notes", c_notes, "board", "--set", "--append")
    a = p.parse_args()
    a.fn(load(), a)


if __name__ == "__main__":
    main()
