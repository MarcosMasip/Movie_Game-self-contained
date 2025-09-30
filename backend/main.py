from fastapi import FastAPI, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel
import sqlite3
import random

app = FastAPI()

DATABASE = "Movies_Game_Table_2.db"

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

# ==== Models ====

class ActorCreate(BaseModel):
    name: str

class ProducerCreate(BaseModel):
    name: str

class MovieCreate(BaseModel):
    title: str
    producer_id: int
    genre: Optional[str] = None
    actor_ids: Optional[List[int]] = []
    scandal_ids: Optional[List[int]] = []
    base_budget: Optional[int] = None
    base_prestige: Optional[int] = None
    base_profit: Optional[int] = None
    status: Optional[str] = "in production"

@app.post("/movies/generate_random/")
def generate_random_movie():
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # Random producer
        cur.execute("SELECT producer_id FROM Producers ORDER BY RANDOM() LIMIT 1")
        producer = cur.fetchone()
        if not producer:
            raise HTTPException(status_code=400, detail="No producers found")
        producer_id = producer["producer_id"]

        # Random genre
        #cur.execute("SELECT genre FROM Genres ORDER BY RANDOM() LIMIT 1")
        #genre_row = cur.fetchone()
        #genres = genre_row["genre"] if genre_row else "Drama"

        # Generate movie data
        title = f"Auto_{random.randint(1000, 9999)}"
        base_budget = random.randint(1_000_000, 100_000_000)
        base_prestige = random.randint(1, 100)
        base_profit = random.randint(0, base_budget * 2)
        status = "in production"

        # Insert movie
        cur.execute("""
            INSERT INTO Movies (producer_id, title, base_budget, base_prestige, base_profit, status)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (producer_id, title, base_budget, base_prestige, base_profit, status))
        movie_id = cur.lastrowid

        # Assign cast (1-5 actors)
        cur.execute("SELECT actor_id FROM Actors ORDER BY RANDOM() LIMIT 5")
        actors = cur.fetchall()
        for actor in actors:
            role = "Lead" if random.random() > 0.7 else "Supporting"
            cur.execute("INSERT INTO Movie_Cast (movie_id, actor_id, role) VALUES (?, ?, ?)",
                        (movie_id, actor["actor_id"], role))

        # Assign scandals (0-3)
        cur.execute("SELECT scandal_id FROM Scandals ORDER BY RANDOM() LIMIT 3")
        scandals = cur.fetchall()
        for scandal in scandals:
            if random.random() > 0.5:
                cur.execute("INSERT INTO Movie_Scandal (movie_id, scandal_id) VALUES (?, ?)",
                            (movie_id, scandal["scandal_id"]))

        conn.commit()

        return {
            "movie_id": movie_id,
            "producer_id": producer_id,
            "title": title,
            "base_budget": base_budget,
            "base_prestige": base_prestige,
            "base_profit": base_profit,
            "status": status
        }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Could not generate random movie: {str(e)}")
    finally:
        conn.close()

@app.get("/movies/{movie_id}/full/")
def get_movie_full(movie_id: int):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM Movies WHERE movie_id = ?", (movie_id,))
    movie = cur.fetchone()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    cur.execute("""
        SELECT a.actor_id, a.name, mc.role
        FROM Movie_Cast mc
        JOIN Actors a ON mc.actor_id = a.actor_id
        WHERE mc.movie_id = ?
    """, (movie_id,))
    cast = cur.fetchall()

    # 🔧 This was missing!
    cur.execute("""
        SELECT s.scandal_id, s.description
        FROM Movie_Scandal ms
        JOIN Scandals s ON ms.scandal_id = s.scandal_id
        WHERE ms.movie_id = ?
    """, (movie_id,))
    scandals = cur.fetchall()  # You were trying to use `scandals` but hadn't defined it

    conn.close()

    return {
        "movie": dict(movie),
        "cast": [dict(c) for c in cast],
        "scandals": [dict(s) for s in scandals]  # This line broke without the above fix
    }

@app.get("/movies/")
def list_movies(query: Optional[str] = Query(None, min_length=1)):
    conn = get_db_connection()
    cur = conn.cursor()

    if query:
        like_query = f"%{query}%"
        cur.execute("""
            SELECT * FROM Movies
            WHERE title LIKE ? OR genre LIKE ?
            ORDER BY movie_id DESC
            LIMIT 20
        """, (like_query, like_query))
    else:
        cur.execute("SELECT * FROM Movies ORDER BY movie_id DESC LIMIT 20")

    movies = cur.fetchall()
    conn.close()

    return [dict(m) for m in movies]

@app.get("/actors/")
def list_actors(query: Optional[str] = Query(None, min_length=1)):
    conn = get_db_connection()
    cur = conn.cursor()

    if query:
        like_query = f"%{query}%"
        cur.execute("SELECT * FROM Actors WHERE name LIKE ? ORDER BY actor_id DESC LIMIT 20", (like_query,))
    else:
        cur.execute("SELECT * FROM Actors ORDER BY actor_id DESC LIMIT 20")

    actors = cur.fetchall()
    conn.close()

    return [dict(a) for a in actors]

@app.get("/producers/")
def list_producers(query: Optional[str] = Query(None, min_length=1)):
    conn = get_db_connection()
    cur = conn.cursor()

    if query:
        like_query = f"%{query}%"
        cur.execute("SELECT * FROM Producers WHERE name LIKE ? ORDER BY producer_id DESC LIMIT 20", (like_query,))
    else:
        cur.execute("SELECT * FROM Producers ORDER BY producer_id DESC LIMIT 20")

    producers = cur.fetchall()
    conn.close()

    return [dict(p) for p in producers]

# ==== New endpoints for full-stack create flows ====

@app.post("/actors/")
def create_actor(body: ActorCreate):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("INSERT INTO Actors (name) VALUES (?)", (body.name.strip(),))
        actor_id = cur.lastrowid
        conn.commit()
        cur.execute("SELECT * FROM Actors WHERE actor_id = ?", (actor_id,))
        row = cur.fetchone()
        return dict(row)
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Could not create actor: {e}")
    finally:
        conn.close()

@app.post("/producers/")
def create_producer(body: ProducerCreate):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("INSERT INTO Producers (name) VALUES (?)", (body.name.strip(),))
        producer_id = cur.lastrowid
        conn.commit()
        cur.execute("SELECT * FROM Producers WHERE producer_id = ?", (producer_id,))
        row = cur.fetchone()
        return dict(row)
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Could not create producer: {e}")
    finally:
        conn.close()

@app.get("/scandals/")
def list_scandals(query: Optional[str] = Query(None, min_length=1)):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        if query:
            like = f"%{query}%"
            cur.execute("SELECT * FROM Scandals WHERE description LIKE ? ORDER BY scandal_id DESC LIMIT 50", (like,))
        else:
            cur.execute("SELECT * FROM Scandals ORDER BY scandal_id DESC LIMIT 50")
        rows = cur.fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

@app.post("/movies/create/")
def create_movie(body: MovieCreate):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # Validate producer exists
        cur.execute("SELECT 1 FROM Producers WHERE producer_id = ?", (body.producer_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=400, detail="Producer not found")

        # Defaults
        base_budget = body.base_budget if body.base_budget is not None else random.randint(1_000_000, 100_000_000)
        base_prestige = body.base_prestige if body.base_prestige is not None else random.randint(1, 100)
        base_profit = body.base_profit if body.base_profit is not None else random.randint(0, base_budget * 2)
        status = body.status or "in production"

        # Insert movie (genre is optional in schema; ignore if column not present)
        try:
            cur.execute(
                """
                INSERT INTO Movies (producer_id, title, genre, base_budget, base_prestige, base_profit, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (body.producer_id, body.title, body.genre, base_budget, base_prestige, base_profit, status),
            )
        except sqlite3.OperationalError:
            # Fallback if Movies table has no genre column
            cur.execute(
                """
                INSERT INTO Movies (producer_id, title, base_budget, base_prestige, base_profit, status)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (body.producer_id, body.title, base_budget, base_prestige, base_profit, status),
            )
        movie_id = cur.lastrowid

        # Assign cast
        for aid in (body.actor_ids or []):
            cur.execute("SELECT 1 FROM Actors WHERE actor_id = ?", (aid,))
            if cur.fetchone():
                cur.execute("INSERT INTO Movie_Cast (movie_id, actor_id, role) VALUES (?, ?, ?)", (movie_id, aid, "Cast"))

        # Assign scandals
        for sid in (body.scandal_ids or []):
            cur.execute("SELECT 1 FROM Scandals WHERE scandal_id = ?", (sid,))
            if cur.fetchone():
                cur.execute("INSERT INTO Movie_Scandal (movie_id, scandal_id) VALUES (?, ?)", (movie_id, sid))

        conn.commit()

        cur.execute("SELECT * FROM Movies WHERE movie_id = ?", (movie_id,))
        movie = cur.fetchone()
        return {"movie_id": movie_id, **dict(movie)}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Could not create movie: {e}")
    finally:
        conn.close()