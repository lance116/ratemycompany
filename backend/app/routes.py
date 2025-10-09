from flask import Blueprint, jsonify


bp = Blueprint("routes", __name__)


@bp.get("/")
def healthcheck():
	return jsonify({"status": "ok"})


