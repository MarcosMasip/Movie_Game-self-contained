import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";

// Small helper: debounce typing before firing a search
function useDebounced(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function CreateMovieGUI() {
  // Lists and queries
  const [movies, setMovies] = useState([]);
  const [actors, setActors] = useState([]);
  const [producers, setProducers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [movieQuery, setMovieQuery] = useState("");
  const [actorQuery, setActorQuery] = useState("");
  const [producerQuery, setProducerQuery] = useState("");

  const dMovie = useDebounced(movieQuery);
  const dActor = useDebounced(actorQuery);
  const dProducer = useDebounced(producerQuery);

  // Details pane
  const [selectedMovie, setSelectedMovie] = useState(null); // full movie
  const [actionMsg, setActionMsg] = useState("");

  // Initial load
  useEffect(() => {
    refreshMovies();
    fetchActors();
    fetchProducers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Searches
  useEffect(() => {
    refreshMovies(dMovie);
  }, [dMovie]);
  useEffect(() => {
    fetchActors(dActor);
  }, [dActor]);
  useEffect(() => {
    fetchProducers(dProducer);
  }, [dProducer]);

  async function refreshMovies(query) {
    try {
      setLoading(true);
      setError("");
      const url = query ? `/movies/?query=${encodeURIComponent(query)}` : "/movies/";
      const res = await axios.get(url);
      setMovies(res.data || []);
    } catch (e) {
      setError("Failed to load movies");
    } finally {
      setLoading(false);
    }
  }

  async function fetchActors(query) {
    try {
      const url = query ? `/actors/?query=${encodeURIComponent(query)}` : "/actors/";
      const res = await axios.get(url);
      setActors(res.data || []);
    } catch {
      setActors([]);
    }
  }

  async function fetchProducers(query) {
    try {
      const url = query ? `/producers/?query=${encodeURIComponent(query)}` : "/producers/";
      const res = await axios.get(url);
      setProducers(res.data || []);
    } catch {
      setProducers([]);
    }
  }

  async function generateRandomMovie() {
    try {
      setActionMsg("");
      const res = await axios.post("/movies/generate_random/");
      const m = res.data;
      setActionMsg(`Created movie #${m.movie_id}: ${m.title}`);
      await refreshMovies();
      // auto open details
      await openMovieDetails(m.movie_id);
    } catch (e) {
      setActionMsg("Could not generate a random movie.");
    }
  }

  async function openMovieDetails(movieId) {
    try {
      setSelectedMovie(null);
      const res = await axios.get(`/movies/${movieId}/full/`);
      setSelectedMovie(res.data);
    } catch (e) {
      setSelectedMovie({ error: "Failed to load movie details." });
    }
  }

  const hasAnyData = useMemo(() => (movies?.length || actors?.length || producers?.length), [movies, actors, producers]);

  return (
    <div className="app">
      <header className="app__header">
        <h1>Movie Game</h1>
        <div className="app__actions">
          <button className="btn btn--primary" onClick={generateRandomMovie}>
            Generate Random Movie
          </button>
          {actionMsg && <span className="app__msg" title={actionMsg}>{actionMsg}</span>}
        </div>
      </header>

      {!hasAnyData && (
        <div className="empty">
          <p>No data yet. Click “Generate Random Movie” to populate the database and explore.</p>
        </div>
      )}

      <main className="grid">
        <section className="card">
          <div className="card__header">
            <h2>Movies</h2>
            <input
              className="input"
              placeholder="Search title or genre…"
              value={movieQuery}
              onChange={(e) => setMovieQuery(e.target.value)}
            />
          </div>
          {loading ? (
            <div className="muted">Loading…</div>
          ) : (
            <ul className="list">
              {movies.map((m) => (
                <li key={m.movie_id} className="list__item" onClick={() => openMovieDetails(m.movie_id)}>
                  <div>
                    <div className="list__title">{m.title}</div>
                    <div className="list__meta">Budget ${m.base_budget?.toLocaleString?.() ?? m.base_budget} · Prestige {m.base_prestige} · Profit ${m.base_profit?.toLocaleString?.() ?? m.base_profit}</div>
                  </div>
                  <button className="btn btn--sm" onClick={(e) => { e.stopPropagation(); openMovieDetails(m.movie_id); }}>Details</button>
                </li>
              ))}
              {!movies.length && <li className="muted">No movies found.</li>}
            </ul>
          )}
        </section>

        <section className="card">
          <div className="card__header">
            <h2>Actors</h2>
            <input
              className="input"
              placeholder="Search actors…"
              value={actorQuery}
              onChange={(e) => setActorQuery(e.target.value)}
            />
          </div>
          <ul className="list">
            {actors.map((a) => (
              <li key={a.actor_id} className="list__item">
                <div className="list__title">{a.name}</div>
                <div className="list__meta">ID #{a.actor_id}</div>
              </li>
            ))}
            {!actors.length && <li className="muted">No actors found.</li>}
          </ul>
        </section>

        <section className="card">
          <div className="card__header">
            <h2>Producers</h2>
            <input
              className="input"
              placeholder="Search producers…"
              value={producerQuery}
              onChange={(e) => setProducerQuery(e.target.value)}
            />
          </div>
          <ul className="list">
            {producers.map((p) => (
              <li key={p.producer_id} className="list__item">
                <div className="list__title">{p.name}</div>
                <div className="list__meta">ID #{p.producer_id}</div>
              </li>
            ))}
            {!producers.length && <li className="muted">No producers found.</li>}
          </ul>
        </section>
      </main>

      <aside className="details">
        <h2>Details</h2>
        {!selectedMovie && <div className="muted">Select a movie to view details.</div>}
        {selectedMovie?.error && <div className="error">{selectedMovie.error}</div>}
        {selectedMovie && !selectedMovie.error && (
          <div className="details__content">
            <div className="kv"><span className="k">Title</span><span className="v">{selectedMovie.movie?.title}</span></div>
            <div className="kv"><span className="k">Status</span><span className="v">{selectedMovie.movie?.status}</span></div>
            <div className="kv"><span className="k">Budget</span><span className="v">${selectedMovie.movie?.base_budget?.toLocaleString?.() ?? selectedMovie.movie?.base_budget}</span></div>
            <div className="kv"><span className="k">Prestige</span><span className="v">{selectedMovie.movie?.base_prestige}</span></div>
            <div className="kv"><span className="k">Profit</span><span className="v">${selectedMovie.movie?.base_profit?.toLocaleString?.() ?? selectedMovie.movie?.base_profit}</span></div>

            <h3>Cast</h3>
            <ul className="list list--compact">
              {selectedMovie.cast?.map((c, i) => (
                <li key={i} className="list__item">
                  <div className="list__title">{c.name}</div>
                  <div className="list__meta">{c.role}</div>
                </li>
              ))}
              {!selectedMovie.cast?.length && <li className="muted">No cast assigned.</li>}
            </ul>

            <h3>Scandals</h3>
            <ul className="list list--compact">
              {selectedMovie.scandals?.map((s, i) => (
                <li key={i} className="list__item">
                  <div className="list__title">{s.description}</div>
                </li>
              ))}
              {!selectedMovie.scandals?.length && <li className="muted">No scandals.</li>}
            </ul>
          </div>
        )}
      </aside>

      {error && <div className="error fixed-error">{error}</div>}
    </div>
  );
}
