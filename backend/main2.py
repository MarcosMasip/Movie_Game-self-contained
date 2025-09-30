from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import sqlite3, os
import random
import string
from fastapi import APIRouter

app = FastAPI()

DATABASE = "Movies_Game_Table_2.db"

# === Models ===

class MovieCreate(BaseModel):
    producer_id: int
    title: str
    genre: str
    base_budget: int
    base_prestige: int
    base_profit: int
    status: str = "in production"
    cast_actor_ids: List[int]
    scandal_ids: List[int]

class MovieResponse(BaseModel):
    movie_id: int
    producer_id: int
    title: str
    genre: str
    base_budget: int
    base_prestige: int
    base_profit: int
    status: str

# === DB connection helper ===

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

# === Routes ===

@app.post("/movies/generate_random/", response_model=Movie)
def generate_random_movie():
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Get random producer
        cur.execute("SELECT producer_id FROM Producers ORDER BY RANDOM() LIMIT 1")
        producer = cur.fetchone()
        if not producer:
            raise HTTPException(status_code=400, detail="No producers in database")
        producer_id = producer[0]

        # Get random genre
        cur.execute("SELECT name FROM Genres ORDER BY RANDOM() LIMIT 1")
        genre = cur.fetchone()
        genre_name = genre[0] if genre else "Drama"

        # Generate title
        title = "Auto_" + ''.join(random.choices(string.ascii_uppercase, k=5))

        # Get base values
        budget = random.randint(10_000_000, 150_000_000)
        prestige = random.randint(20, 90)
        profit = random.randint(-20_000_000, 300_000_000)

        # Insert movie
        cur.execute("""
            INSERT INTO Movies (producer_id, title, genre, base_budget, base_prestige, base_profit, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (producer_id, title, genre_name, budget, prestige, profit, "in production"))
        movie_id = cur.lastrowid

        # Assign random actors (1–3)
        cur.execute("SELECT actor_id FROM Actors")
        all_actors = [row[0] for row in cur.fetchall()]
        cast = random.sample(all_actors, k=min(3, len(all_actors)))
        for actor_id in cast:
            role_name = "Role_" + ''.join(random.choices(string.ascii_uppercase, k=3))
            cur.execute("INSERT INTO Movie_Cast (movie_id, actor_id, role) VALUES (?, ?, ?)", (movie_id, actor_id, role_name))

        # Maybe assign a scandal
        cur.execute("SELECT scandal_id FROM Scandals")
        all_scandals = [row[0] for row in cur.fetchall()]
        if all_scandals and random.choice([True, False]):
            scandal_id = random.choice(all_scandals)
            cur.execute("INSERT INTO Movie_Scandal (movie_id, scandal_id) VALUES (?, ?)", (movie_id, scandal_id))

        conn.commit()

        # Return created movie
        cur.execute("SELECT * FROM Movies WHERE movie_id = ?", (movie_id,))
        row = cur.fetchone()
        conn.close()
        return Movie(
            movie_id=row["movie_id"],
            producer_id=row["producer_id"],
            title=row["title"],
            genre=row["genre"],
            base_budget=row["base_budget"],
            base_prestige=row["base_prestige"],
            base_profit=row["base_profit"],
            status=row["status"]
        )

    except Exception as e:
        print("RANDOM MOVIE ERROR:", e)
        raise HTTPException(status_code=500, detail="Could not generate random movie")