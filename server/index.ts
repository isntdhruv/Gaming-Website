import { config as loadEnv } from 'dotenv';
loadEnv({ path: './server/.env' });
import express from 'express';
import cors from 'cors';
import { games } from '../src/data/games.ts';
import { supabaseAdmin } from './src/config/supabase.ts';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Admin routes (protected)
import adminRoutes from './src/routes/admin.ts';
app.use('/api/admin', adminRoutes);

// Auth helper routes
import authRoutes from './src/routes/auth.ts';
app.use('/api/auth', authRoutes);

// List all games (prefers Supabase when service role key is available)
app.get('/api/games', async (_req, res) => {
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin.from('games').select('*');
    if (error) {
      // If the table doesn't exist in Supabase, fall back to the static file
      if (String(error.message).includes('Could not find the table')) {
        // eslint-disable-next-line no-console
        console.warn('Supabase table `games` not found — falling back to local data');
      } else {
        return res.status(500).json({ error: error.message });
      }
    } else {
      return res.json(data);
    }
  }
  // fallback to static file
  res.json(games);
});

// Get game by id or slug
app.get('/api/games/:id', async (req, res) => {
  const idOrSlug = req.params.id;

  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('games')
      .select('*')
      .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
      .limit(1);

    if (error) {
      if (String(error.message).includes('Could not find the table')) {
        // eslint-disable-next-line no-console
        console.warn('Supabase table `games` not found — falling back to local data');
      } else {
        return res.status(500).json({ error: error.message });
      }
    } else {
      const game = data && data[0];
      if (!game) return res.status(404).json({ error: 'Game not found' });
      return res.json(game);
    }
  }

  const game = games.find((g: any) => g.id === idOrSlug || g.slug === idOrSlug);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  res.json(game);
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT ?? 4000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend server listening on http://localhost:${PORT}`);
});
