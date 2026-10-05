export function hydrateLoadedCase(raw) {
  const record = raw || null;
  return {
    record,
    profile: record && typeof record.profile === "string" ? record.profile : "",
  };
}

export function buildCaseTransaction({ address, action, caseId, title, goal, profile, sources, record }) {
  if (!address || !action) return null;
  const id = caseId.trim();
  const base = { kind: "write", address };
  if (action === "create") {
    return {
      ...base,
      method: "create_case",
      args: [id, title.trim(), goal.trim(), profile.trim(), JSON.stringify(sources.map(value => value.trim()).filter(Boolean))],
    };
  }
  if (action === "assess") return { ...base, method: "assess", args: [id] };
  if (action === "revise") {
    const revised = profile.trim();
    if (!record || record.id !== id) throw new Error("Reload this case before revising its profile.");
    if (revised === String(record.profile || "").trim()) throw new Error("Edit the loaded profile before saving a revision.");
    return { ...base, method: "revise_profile", args: [id, revised] };
  }
  return { ...base, method: "finalize", args: [id] };
}
