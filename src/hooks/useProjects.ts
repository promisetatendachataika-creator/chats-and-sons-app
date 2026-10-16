import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../config/db';
import type { Project } from '../lib/projects';

/** Live list of projects, newest first. */
export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setProjects(snap.docs.map((d) => ({ id: d.id, thumbs: [], ...d.data() }) as unknown as Project));
      setLoading(false);
      setError(false);
    }, (err) => {
      console.error('Projects failed to load:', err);
      setLoading(false);
      setError(true);
    });
  }, []);

  return { projects, loading, error };
};
