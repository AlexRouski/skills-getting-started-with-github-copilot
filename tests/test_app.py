from urllib.parse import quote


def test_root_redirects_to_frontend(client):
    response = client.get("/", follow_redirects=False)

    assert response.status_code == 307
    assert response.headers["location"] == "/static/index.html"


def test_get_activities_returns_activity_details(client):
    response = client.get("/activities")

    assert response.status_code == 200
    activities = response.json()
    assert "Chess Club" in activities
    assert activities["Chess Club"]["participants"] == [
        "michael@mergington.edu",
        "daniel@mergington.edu",
    ]


def test_signup_adds_participant(client):
    activity = quote("Basketball Team", safe="")
    response = client.post(
        f"/activities/{activity}/signup",
        params={"email": "student@mergington.edu"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "message": "Signed up student@mergington.edu for Basketball Team"
    }
    assert "student@mergington.edu" in client.get("/activities").json()[
        "Basketball Team"
    ]["participants"]


def test_signup_rejects_unknown_activity(client):
    response = client.post(
        "/activities/Unknown/signup",
        params={"email": "student@mergington.edu"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_signup_rejects_duplicate_participant(client):
    activity = quote("Basketball Team", safe="")
    params = {"email": "student@mergington.edu"}
    client.post(f"/activities/{activity}/signup", params=params)

    response = client.post(f"/activities/{activity}/signup", params=params)

    assert response.status_code == 400
    assert response.json()["detail"] == "Student is already signed up for this activity"
    participants = client.get("/activities").json()["Basketball Team"]["participants"]
    assert participants.count("student@mergington.edu") == 1


def test_unregister_removes_participant(client):
    activity = quote("Basketball Team", safe="")
    params = {"email": "student@mergington.edu"}
    client.post(f"/activities/{activity}/signup", params=params)

    response = client.delete(f"/activities/{activity}/signup", params=params)

    assert response.status_code == 200
    assert response.json() == {
        "message": "Unregistered student@mergington.edu from Basketball Team"
    }
    assert "student@mergington.edu" not in client.get("/activities").json()[
        "Basketball Team"
    ]["participants"]


def test_unregister_rejects_unknown_activity(client):
    response = client.delete(
        "/activities/Unknown/signup",
        params={"email": "student@mergington.edu"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_unregister_rejects_unregistered_participant(client):
    activity = quote("Basketball Team", safe="")
    response = client.delete(
        f"/activities/{activity}/signup",
        params={"email": "student@mergington.edu"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Student is not signed up for this activity"
