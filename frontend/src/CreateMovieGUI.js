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
  const [scandals, setScandals] = useState([]);
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
  fetchScandals();
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

  async function fetchScandals(query) {
    try {
      const url = query ? `/scandals/?query=${encodeURIComponent(query)}` : "/scandals/";
      const res = await axios.get(url);
      setScandals(res.data || []);
    } catch {
      setScandals([]);
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

  // Quick create helpers
  const [newActor, setNewActor] = useState("");
  const [newProducer, setNewProducer] = useState("");
  const [createTitle, setCreateTitle] = useState("");
  const [createGenre, setCreateGenre] = useState("");
  const [createProducerId, setCreateProducerId] = useState("");
  const [createActorIds, setCreateActorIds] = useState([]);
  const [createScandalIds, setCreateScandalIds] = useState([]);

  async function addActor() {
    const name = newActor.trim();
    if (!name) return;
    try {
      await axios.post("/actors/", { name });
      setNewActor("");
      fetchActors();
    } catch (e) {
      setActionMsg("Failed to add actor");
    }
  }

  async function addProducer() {
    const name = newProducer.trim();
    if (!name) return;
    try {
      await axios.post("/producers/", { name });
      setNewProducer("");
      fetchProducers();
    } catch (e) {
      setActionMsg("Failed to add producer");
    }
  }

  async function createMovie() {
    try {
      const payload = {
        title: createTitle || `Manual_${Date.now()}`,
        genre: createGenre || undefined,
        producer_id: Number(createProducerId),
        actor_ids: createActorIds.map(Number),
        scandal_ids: createScandalIds.map(Number),
      };
      const res = await axios.post("/movies/create/", payload);
      setActionMsg(`Created movie #${res.data.movie_id}`);
      setCreateTitle(""); setCreateGenre(""); setCreateProducerId(""); setCreateActorIds([]); setCreateScandalIds([]);
      await refreshMovies();
      await openMovieDetails(res.data.movie_id);
    } catch (e) {
      setActionMsg(e?.response?.data?.detail || "Failed to create movie");
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
          <div className="card__header">
            <input className="input" placeholder="Quick add actor…" value={newActor} onChange={(e)=>setNewActor(e.target.value)} />
            <button className="btn" onClick={addActor}>Add</button>
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
          <div className="card__header">
            <input className="input" placeholder="Quick add producer…" value={newProducer} onChange={(e)=>setNewProducer(e.target.value)} />
            <button className="btn" onClick={addProducer}>Add</button>
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

      <section className="create card" style={{ marginTop: 12 }}>
        <div className="card__header">
          <h2>Create Movie (manual)</h2>
        </div>
        <div style={{ padding: 12, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <input className="input" placeholder="Title" value={createTitle} onChange={e=>setCreateTitle(e.target.value)} />
          <input className="input" placeholder="Genre (optional)" value={createGenre} onChange={e=>setCreateGenre(e.target.value)} />
          <select className="input" value={createProducerId} onChange={e=>setCreateProducerId(e.target.value)}>
            <option value="">Select Producer</option>
            {producers.map(p => <option key={p.producer_id} value={p.producer_id}>{p.name}</option>)}
          </select>

          <select className="input" multiple value={createActorIds} onChange={(e)=>setCreateActorIds([...e.target.selectedOptions].map(o=>o.value))}>
            <option disabled>— Select Actors —</option>
            {actors.map(a => <option key={a.actor_id} value={a.actor_id}>{a.name}</option>)}
          </select>

          <select className="input" multiple value={createScandalIds} onChange={(e)=>setCreateScandalIds([...e.target.selectedOptions].map(o=>o.value))}>
            <option disabled>— Select Scandals —</option>
            {scandals.map(s => <option key={s.scandal_id} value={s.scandal_id}>{s.description}</option>)}
          </select>

          <div>
            <button className="btn btn--primary" onClick={createMovie} disabled={!createProducerId}>Create Movie</button>
          </div>
        </div>
      </section>

      {error && <div className="error fixed-error">{error}</div>}
    </div>
  );
}
