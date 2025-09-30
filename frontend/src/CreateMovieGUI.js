import React, { useState, useEffect } from "react";
import axios from "axios";

export default function CreateMovieGUI() {
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [scriptId, setScriptId] = useState("");
  const [producerId, setProducerId] = useState("");
  const [actorIds, setActorIds] = useState([]);
  const [effectIds, setEffectIds] = useState([]);
  const [scandalIds, setScandalIds] = useState([]);
  const [response, setResponse] = useState(null);

  const [scripts, setScripts] = useState([]);
  const [producers, setProducers] = useState([]);
  const [actors, setActors] = useState([]);
  const [effects, setEffects] = useState([]);
  const [scandals, setScandals] = useState([]);

  useEffect(() => {
    axios.get("/scripts").then(res => setScripts(res.data)).catch(()=>{});
    axios.get("/producers").then(res => setProducers(res.data)).catch(()=>{});
    axios.get("/actors").then(res => setActors(res.data)).catch(()=>{});
    axios.get("/effects").then(res => setEffects(res.data)).catch(()=>{});
    axios.get("/scandals").then(res => setScandals(res.data)).catch(()=>{});
  }, []);

  const handleSubmit = async () => {
    try {
      const payload = {
        title,
        genre,
        script_id: parseInt(scriptId),
        producer_id: parseInt(producerId),
        actor_ids: actorIds.map(Number),
        effect_ids: effectIds.map(Number),
        scandal_ids: scandalIds.map(Number),
      };
      const res = await axios.post("/movies/create/", payload);
      setResponse(res.data);
    } catch (err) {
      setResponse({ error: err?.response?.data?.detail || "Error" });
    }
  };

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: "0 auto", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Create a Movie</h2>

      <input placeholder="Title" style={{ border: "1px solid #ccc", padding: 8, width: "100%", marginBottom: 8 }} value={title} onChange={e => setTitle(e.target.value)} />
      <input placeholder="Genre" style={{ border: "1px solid #ccc", padding: 8, width: "100%", marginBottom: 8 }} value={genre} onChange={e => setGenre(e.target.value)} />

      <select style={{ border: "1px solid #ccc", padding: 8, width: "100%", marginBottom: 8 }} value={scriptId} onChange={e => setScriptId(e.target.value)}>
        <option value="">Select Script</option>
        {scripts.map(script => (
          <option key={script.script_id} value={script.script_id}>{script.title}</option>
        ))}
      </select>

      <select style={{ border: "1px solid #ccc", padding: 8, width: "100%", marginBottom: 8 }} value={producerId} onChange={e => setProducerId(e.target.value)}>
        <option value="">Select Producer</option>
        {producers.map(p => (
          <option key={p.producer_id} value={p.producer_id}>{p.name}</option>
        ))}
      </select>

      <label style={{ display: "block", fontWeight: 700, marginTop: 8 }}>Select Actors</label>
      <select multiple style={{ border: "1px solid #ccc", padding: 8, width: "100%", marginBottom: 8 }} value={actorIds} onChange={e => setActorIds([...e.target.selectedOptions].map(o => o.value))}>
        {actors.map(a => (
          <option key={a.actor_id} value={a.actor_id}>{a.name}</option>
        ))}
      </select>

      <label style={{ display: "block", fontWeight: 700, marginTop: 8 }}>Select Effects</label>
      <select multiple style={{ border: "1px solid #ccc", padding: 8, width: "100%", marginBottom: 8 }} value={effectIds} onChange={e => setEffectIds([...e.target.selectedOptions].map(o => o.value))}>
        {effects.map(eff => (
          <option key={eff.effect_id} value={eff.effect_id}>{eff.type}</option>
        ))}
      </select>

      <label style={{ display: "block", fontWeight: 700, marginTop: 8 }}>Select Scandals</label>
      <select multiple style={{ border: "1px solid #ccc", padding: 8, width: "100%", marginBottom: 8 }} value={scandalIds} onChange={e => setScandalIds([...e.target.selectedOptions].map(o => o.value))}>
        {scandals.map(s => (
          <option key={s.scandal_id} value={s.scandal_id}>{s.description}</option>
        ))}
      </select>

      <button style={{ background: "#2563eb", color: "#fff", padding: "8px 16px", borderRadius: 6, border: 0, cursor: "pointer" }} onClick={handleSubmit}>Create Movie</button>

      {response && (
        <div style={{ marginTop: 16, padding: 8, border: "1px solid #ccc", borderRadius: 6, background: "#f7f7f7" }}>
          <pre style={{ margin: 0 }}>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
