extends SceneTree

## Headless check für TheologyData-Autoload (Risk #6 Single-Source-of-Truth).

func _initialize() -> void:
	var ps: PackedScene = load("res://scenes/bootstrap.tscn")
	var scene := ps.instantiate() as Node3D
	root.add_child(scene)
	await scene.ready

	var data := root.get_node_or_null("/root/TheologyData")
	print("DEBUG: data=", data)
	if data == null:
		push_error("FAIL: TheologyData Autoload missing")
		quit(1)
		return
	print("PASS Autoload present")

	var questions: Array[Dictionary] = data.get("questions") as Array[Dictionary]
	print("DEBUG: questions size=", questions.size())
	if questions.size() != 3:
		push_error("FAIL: expected 3 questions, got %d" % questions.size())
		quit(1)
		return
	print("PASS question count: %d" % questions.size())

	var q1 := data.call("get_question_by_id", 1) as Dictionary
	print("DEBUG: q1=", q1)
	if q1.is_empty():
		push_error("FAIL: question id=1 not found")
		quit(1)
		return
	if not q1.has("text") or not q1["text"] is String:
		push_error("FAIL: question id=1 has no text")
		quit(1)
		return
	print("PASS question id=1 text loaded")

	print("ALL TESTS PASSED")
	quit(0)
